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
import cronParser from "cron-parser";

// Schedule can be either a preset ("every 5 minutes") or cron expression ("*/5 * * * *")
export type ScheduleType = "preset" | "cron";

export interface Check {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string; // preset value like "every 5 minutes"
  scheduleType: ScheduleType; // "preset" or "cron"
  cronExpression?: string; // cron expression like "*/5 * * * *"
  timezone: string; // timezone like "UTC", "Europe/Moscow"
  gracePeriod: number;
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  lastDuration?: number; // last execution duration in ms
  createdAt: Timestamp;
  webhookUrl?: string; // optional webhook URL for notifications
  tags?: string[]; // optional tags for organizing checks
}

// Helper to get next run time from cron expression
export function getNextRunTime(cronExpression: string, timezone: string): Date | null {
  try {
    const interval = cronParser.parse(cronExpression, {
      tz: timezone,
      currentDate: new Date(),
    });
    return interval.next().toDate();
  } catch {
    return null;
  }
}

// Helper to get previous run time from cron expression
export function getPreviousRunTime(cronExpression: string, timezone: string): Date | null {
  try {
    const interval = cronParser.parse(cronExpression, {
      tz: timezone,
      currentDate: new Date(),
    });
    return interval.prev().toDate();
  } catch {
    return null;
  }
}

// Validate cron expression
export function isValidCronExpression(expression: string): boolean {
  try {
    cronParser.parse(expression);
    return true;
  } catch {
    return false;
  }
}

// Get human-readable description of cron expression
export function describeCronExpression(expression: string): string {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return expression;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Common patterns
    if (expression === "* * * * *") return "Every minute";
    if (expression === "*/5 * * * *") return "Every 5 minutes";
    if (expression === "*/10 * * * *") return "Every 10 minutes";
    if (expression === "*/15 * * * *") return "Every 15 minutes";
    if (expression === "*/30 * * * *") return "Every 30 minutes";
    if (expression === "0 * * * *") return "Every hour";
    if (expression === "0 */2 * * *") return "Every 2 hours";
    if (expression === "0 */6 * * *") return "Every 6 hours";
    if (expression === "0 */12 * * *") return "Every 12 hours";
    if (expression === "0 0 * * *") return "Every day at midnight";
    if (expression === "0 0 * * 0") return "Every Sunday at midnight";
    if (expression === "0 0 1 * *") return "First day of every month";

    // Build description for other patterns
    let desc = "";

    // Minutes
    if (minute === "*") {
      desc = "Every minute";
    } else if (minute.startsWith("*/")) {
      desc = `Every ${minute.slice(2)} minutes`;
    } else {
      desc = `At minute ${minute}`;
    }

    // Hours
    if (hour !== "*") {
      if (hour.startsWith("*/")) {
        desc += ` every ${hour.slice(2)} hours`;
      } else {
        desc += ` at ${hour.padStart(2, "0")}:${minute === "*" ? "00" : minute.padStart(2, "0")}`;
      }
    }

    // Day of month
    if (dayOfMonth !== "*") {
      desc += ` on day ${dayOfMonth}`;
    }

    // Month
    if (month !== "*") {
      const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      desc += ` in ${months[parseInt(month)] || month}`;
    }

    // Day of week
    if (dayOfWeek !== "*") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      desc += ` on ${days[parseInt(dayOfWeek)] || dayOfWeek}`;
    }

    return desc || expression;
  } catch {
    return expression;
  }
}

// Get expected interval in milliseconds for a check
export function getExpectedIntervalMs(check: Check): number {
  if (check.scheduleType === "cron" && check.cronExpression) {
    try {
      const interval = cronParser.parse(check.cronExpression, {
        tz: check.timezone || "UTC",
        currentDate: new Date(),
      });
      const next1 = interval.next().toDate();
      const next2 = interval.next().toDate();
      return next2.getTime() - next1.getTime();
    } catch {
      // Fallback to 1 hour if parsing fails
      return 60 * 60 * 1000;
    }
  }

  // Preset schedule
  const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
  return scheduleMinutes * 60 * 1000;
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
  const gracePeriod = check.gracePeriod || 5;

  // Get expected interval based on schedule type
  const expectedIntervalMs = getExpectedIntervalMs(check);
  const graceMs = gracePeriod * 60 * 1000;
  const totalAllowedMs = expectedIntervalMs + graceMs;

  const timeSinceLastPing = now.getTime() - lastPing.getTime();

  if (timeSinceLastPing > totalAllowedMs) {
    return "down";
  }

  return "up";
}

export interface CreateCheckData {
  name: string;
  scheduleType: ScheduleType;
  schedule?: string; // preset schedule
  cronExpression?: string; // cron expression
  timezone: string;
  gracePeriod: number;
  webhookUrl?: string;
  tags?: string[]; // optional tags
}

export async function createCheck(
  userId: string,
  data: CreateCheckData
): Promise<string> {
  const checkData: Record<string, unknown> = {
    userId,
    name: data.name,
    slug: generateSlug(),
    scheduleType: data.scheduleType,
    schedule: data.schedule || "",
    timezone: data.timezone,
    gracePeriod: data.gracePeriod,
    status: "new",
    lastPing: null,
    createdAt: Timestamp.now(),
  };

  if (data.scheduleType === "cron" && data.cronExpression) {
    checkData.cronExpression = data.cronExpression;
  }

  if (data.webhookUrl) {
    checkData.webhookUrl = data.webhookUrl;
  }

  if (data.tags && data.tags.length > 0) {
    checkData.tags = data.tags;
  }

  const docRef = await addDoc(collection(db, "checks"), checkData);
  return docRef.id;
}

// Get all unique tags for a user
export async function getUserTags(userId: string): Promise<string[]> {
  const checks = await getUserChecks(userId);
  const tagsSet = new Set<string>();

  for (const check of checks) {
    if (check.tags) {
      check.tags.forEach(tag => tagsSet.add(tag));
    }
  }

  return Array.from(tagsSet).sort();
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

// ==================== Status Pages ====================

export interface StatusPage {
  id: string;
  userId: string;
  slug: string; // unique public URL slug
  title: string;
  description?: string;
  checkIds: string[]; // IDs of checks to display
  isPublic: boolean;
  showTags: boolean; // whether to show tags on public page
  customDomain?: string; // optional custom domain
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StatusPageCheck {
  id: string;
  name: string;
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  tags?: string[];
}

export interface PublicStatusPage {
  title: string;
  description?: string;
  checks: StatusPageCheck[];
  overallStatus: "operational" | "degraded" | "down";
  updatedAt: string;
}

function generateStatusPageSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export interface CreateStatusPageData {
  title: string;
  description?: string;
  checkIds: string[];
  isPublic: boolean;
  showTags?: boolean;
}

export async function createStatusPage(
  userId: string,
  data: CreateStatusPageData
): Promise<string> {
  const now = Timestamp.now();
  const pageData = {
    userId,
    slug: generateStatusPageSlug(),
    title: data.title,
    description: data.description || "",
    checkIds: data.checkIds,
    isPublic: data.isPublic,
    showTags: data.showTags ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "statusPages"), pageData);
  return docRef.id;
}

export async function getUserStatusPages(userId: string): Promise<StatusPage[]> {
  const pagesQuery = query(
    collection(db, "statusPages"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(pagesQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StatusPage[];
}

export async function getStatusPageBySlug(slug: string): Promise<StatusPage | null> {
  const pagesQuery = query(
    collection(db, "statusPages"),
    where("slug", "==", slug),
    limit(1)
  );

  const snapshot = await getDocs(pagesQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as StatusPage;
}

export async function updateStatusPage(
  pageId: string,
  data: Partial<Omit<StatusPage, "id" | "userId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "statusPages", pageId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteStatusPage(pageId: string): Promise<void> {
  await deleteDoc(doc(db, "statusPages", pageId));
}

export async function getPublicStatusPageData(slug: string): Promise<PublicStatusPage | null> {
  const page = await getStatusPageBySlug(slug);
  if (!page || !page.isPublic) return null;

  // Fetch all checks for this page
  const checks: StatusPageCheck[] = [];
  let upCount = 0;
  let downCount = 0;

  for (const checkId of page.checkIds) {
    const checkDoc = await getDoc(doc(db, "checks", checkId));
    if (checkDoc.exists()) {
      const checkData = checkDoc.data() as Omit<Check, "id">;
      const realStatus = calculateRealStatus({ id: checkId, ...checkData } as Check);

      checks.push({
        id: checkId,
        name: checkData.name,
        status: realStatus,
        lastPing: checkData.lastPing,
        tags: page.showTags ? checkData.tags : undefined,
      });

      if (realStatus === "up") upCount++;
      else if (realStatus === "down") downCount++;
    }
  }

  // Calculate overall status
  let overallStatus: "operational" | "degraded" | "down" = "operational";
  if (downCount > 0 && upCount > 0) {
    overallStatus = "degraded";
  } else if (downCount > 0 && upCount === 0) {
    overallStatus = "down";
  }

  return {
    title: page.title,
    description: page.description,
    checks,
    overallStatus,
    updatedAt: new Date().toISOString(),
  };
}
