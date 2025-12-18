import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  deleteField,
  getDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { SCHEDULE_MINUTES } from "./constants";
import { PLANS, PlanType } from "./plans";

export interface Check {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string;
  gracePeriod: number;
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  lastDuration?: number; // last execution duration in ms
  createdAt: Timestamp;
  webhookUrl?: string; // optional webhook URL for notifications
}

export interface Ping {
  id: string;
  timestamp: Timestamp;
  ip: string;
  userAgent: string;
  // Execution metrics
  duration?: number; // execution time in milliseconds
  exitCode?: number; // 0 = success, non-zero = failure
  output?: string; // stdout/stderr (truncated)
  status?: "success" | "failure" | "unknown";
}

export interface StatusEvent {
  id: string;
  status: "up" | "down";
  timestamp: Timestamp;
  duration?: number; // seconds in previous status
}

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 10; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export interface CheckLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  reason?: string;
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const data = userDoc.data();
    const plan = (data.plan as PlanType) || "free";

    // Check if subscription is canceled but still within grace period
    if (data.subscription?.status === "canceled" && data.subscription?.effectiveEndDate) {
      const effectiveEnd = data.subscription.effectiveEndDate.toDate?.() || new Date(data.subscription.effectiveEndDate);
      if (effectiveEnd > new Date()) {
        // Still within access period, use subscription plan
        return (data.subscription.plan as PlanType) || plan;
      }
    }

    return plan;
  }
  return "free";
}

export async function getUserChecksCount(userId: string): Promise<number> {
  const checksQuery = query(
    collection(db, "checks"),
    where("userId", "==", userId)
  );
  const snapshot = await getCountFromServer(checksQuery);
  return snapshot.data().count;
}

export async function canCreateCheck(userId: string): Promise<CheckLimitResult> {
  const plan = await getUserPlan(userId);
  const currentCount = await getUserChecksCount(userId);
  const planLimits = PLANS[plan];

  if (currentCount >= planLimits.checksLimit) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.checksLimit,
      plan,
      reason: `You've reached the limit of ${planLimits.checksLimit} checks on the ${planLimits.name} plan. Upgrade to add more.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.checksLimit,
    plan,
  };
}

export function calculateRealStatus(check: Check): "up" | "down" | "new" {
  if (check.status === "new" || !check.lastPing) {
    return "new";
  }

  const now = new Date();
  const lastPing = check.lastPing.toDate();
  const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
  const gracePeriod = check.gracePeriod || 5;
  const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

  const timeSinceLastPing = now.getTime() - lastPing.getTime();

  if (timeSinceLastPing > expectedInterval) {
    return "down";
  }

  return "up";
}

export async function createCheck(
  userId: string,
  data: { name: string; schedule: string; gracePeriod: number; webhookUrl?: string }
): Promise<string> {
  const checkData: Record<string, unknown> = {
    userId,
    name: data.name,
    slug: generateSlug(),
    schedule: data.schedule,
    gracePeriod: data.gracePeriod,
    status: "new",
    lastPing: null,
    createdAt: Timestamp.now(),
  };

  if (data.webhookUrl) {
    checkData.webhookUrl = data.webhookUrl;
  }

  const docRef = await addDoc(collection(db, "checks"), checkData);
  return docRef.id;
}

export async function getUserChecks(userId: string): Promise<Check[]> {
  const checksQuery = query(
    collection(db, "checks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(checksQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Check[];
}

export async function deleteCheck(checkId: string): Promise<void> {
  await deleteDoc(doc(db, "checks", checkId));
}

export async function updateCheck(
  checkId: string,
  data: Partial<Check>
): Promise<void> {
  await updateDoc(doc(db, "checks", checkId), data);
}

export async function removeWebhookUrl(checkId: string): Promise<void> {
  await updateDoc(doc(db, "checks", checkId), {
    webhookUrl: deleteField(),
  });
}

export async function getCheckPings(
  checkId: string,
  count: number = 20
): Promise<Ping[]> {
  const pingsQuery = query(
    collection(db, "checks", checkId, "pings"),
    orderBy("timestamp", "desc"),
    limit(count)
  );

  const snapshot = await getDocs(pingsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Ping[];
}

export async function addStatusEvent(
  checkId: string,
  status: "up" | "down",
  previousEventTimestamp?: Timestamp
): Promise<string> {
  const now = Timestamp.now();
  const eventData: Omit<StatusEvent, "id"> = {
    status,
    timestamp: now,
  };

  // Calculate duration in previous status
  if (previousEventTimestamp) {
    const durationMs = now.toMillis() - previousEventTimestamp.toMillis();
    eventData.duration = Math.round(durationMs / 1000);
  }

  const docRef = await addDoc(
    collection(db, "checks", checkId, "statusHistory"),
    eventData
  );
  return docRef.id;
}

export async function getStatusHistory(
  checkId: string,
  count: number = 50
): Promise<StatusEvent[]> {
  const historyQuery = query(
    collection(db, "checks", checkId, "statusHistory"),
    orderBy("timestamp", "desc"),
    limit(count)
  );

  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StatusEvent[];
}

export async function getLastStatusEvent(
  checkId: string
): Promise<StatusEvent | null> {
  const historyQuery = query(
    collection(db, "checks", checkId, "statusHistory"),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(historyQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as StatusEvent;
}
