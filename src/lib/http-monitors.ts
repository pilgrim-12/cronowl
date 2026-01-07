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
  getDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { PLANS, PlanType } from "./plans";
import { getUserPlan } from "./checks";

// HTTP Monitor types
export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT";
export type HttpMonitorStatus = "up" | "down" | "degraded" | "pending";
export type ContentType = "application/json" | "application/x-www-form-urlencoded" | "text/plain";

export interface HttpMonitorAssertions {
  maxResponseTimeMs?: number;
  bodyContains?: string;
  bodyNotContains?: string;
}

export interface HttpMonitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatusCodes: number[];
  timeoutMs: number;
  intervalSeconds: number;
  headers?: Record<string, string>; // encrypted
  body?: string; // encrypted for POST/PUT
  contentType?: ContentType;
  assertions?: HttpMonitorAssertions;
  status: HttpMonitorStatus;
  lastCheckedAt?: Timestamp;
  lastResponseTimeMs?: number;
  lastStatusCode?: number;
  lastError?: string;
  lastResponseBody?: string; // truncated to 500 chars
  alertAfterFailures: number;
  consecutiveFailures: number;
  uptimePercent24h?: number;
  avgResponseTime24h?: number;
  isEnabled: boolean;
  webhookUrl?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HttpMonitorCheck {
  id: string;
  monitorId: string;
  timestamp: Timestamp;
  status: "success" | "failure";
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  responseBodyPreview?: string; // first 500 chars
}

export interface HttpMonitorStatusEvent {
  id: string;
  status: HttpMonitorStatus;
  timestamp: Timestamp;
  duration?: number; // seconds in previous status
}

// Limit checking
export interface HttpMonitorLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  reason?: string;
}

export async function getUserHttpMonitorsCount(userId: string): Promise<number> {
  const monitorsQuery = query(
    collection(db, "httpMonitors"),
    where("userId", "==", userId)
  );
  const snapshot = await getCountFromServer(monitorsQuery);
  return snapshot.data().count;
}

export async function canCreateHttpMonitor(userId: string): Promise<HttpMonitorLimitResult> {
  const plan = await getUserPlan(userId);
  const currentCount = await getUserHttpMonitorsCount(userId);
  const planLimits = PLANS[plan];

  if (currentCount >= planLimits.httpMonitorsLimit) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.httpMonitorsLimit,
      plan,
      reason: `You've reached the limit of ${planLimits.httpMonitorsLimit} HTTP monitors on the ${planLimits.name} plan. Upgrade to add more.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.httpMonitorsLimit,
    plan,
  };
}

export function getMinIntervalForPlan(plan: PlanType): number {
  return PLANS[plan].minHttpIntervalSeconds;
}

// Create HTTP Monitor
export interface CreateHttpMonitorData {
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatusCodes?: number[];
  timeoutMs?: number;
  intervalSeconds: number;
  headers?: Record<string, string>;
  body?: string;
  contentType?: ContentType;
  assertions?: HttpMonitorAssertions;
  alertAfterFailures?: number;
  webhookUrl?: string;
  tags?: string[];
}

export async function createHttpMonitor(
  userId: string,
  data: CreateHttpMonitorData
): Promise<string> {
  // Validate interval against plan
  const plan = await getUserPlan(userId);
  const minInterval = getMinIntervalForPlan(plan);

  if (data.intervalSeconds < minInterval) {
    throw new Error(`Minimum interval for ${PLANS[plan].name} plan is ${minInterval} seconds`);
  }

  const now = Timestamp.now();
  const monitorData: Omit<HttpMonitor, "id"> = {
    userId,
    name: data.name,
    url: data.url,
    method: data.method,
    expectedStatusCodes: data.expectedStatusCodes || [200, 201, 204],
    timeoutMs: data.timeoutMs || 10000,
    intervalSeconds: data.intervalSeconds,
    headers: data.headers,
    body: data.body,
    contentType: data.contentType,
    assertions: data.assertions,
    status: "pending",
    alertAfterFailures: data.alertAfterFailures || 2,
    consecutiveFailures: 0,
    isEnabled: true,
    webhookUrl: data.webhookUrl,
    tags: data.tags,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "httpMonitors"), monitorData);
  return docRef.id;
}

// Get all HTTP monitors for a user
export async function getUserHttpMonitors(userId: string): Promise<HttpMonitor[]> {
  const monitorsQuery = query(
    collection(db, "httpMonitors"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(monitorsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HttpMonitor[];
}

// Get single HTTP monitor
export async function getHttpMonitor(monitorId: string): Promise<HttpMonitor | null> {
  const docRef = doc(db, "httpMonitors", monitorId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as HttpMonitor;
}

// Update HTTP Monitor
export async function updateHttpMonitor(
  monitorId: string,
  data: Partial<Omit<HttpMonitor, "id" | "userId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "httpMonitors", monitorId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// Delete HTTP Monitor
export async function deleteHttpMonitor(monitorId: string): Promise<void> {
  // Delete all checks first
  const checksQuery = query(collection(db, "httpMonitors", monitorId, "checks"));
  const checksSnapshot = await getDocs(checksQuery);
  for (const checkDoc of checksSnapshot.docs) {
    await deleteDoc(checkDoc.ref);
  }

  // Delete all status history
  const historyQuery = query(collection(db, "httpMonitors", monitorId, "statusHistory"));
  const historySnapshot = await getDocs(historyQuery);
  for (const historyDoc of historySnapshot.docs) {
    await deleteDoc(historyDoc.ref);
  }

  // Delete the monitor itself
  await deleteDoc(doc(db, "httpMonitors", monitorId));
}

// Pause/Resume monitor
export async function pauseHttpMonitor(monitorId: string): Promise<void> {
  await updateDoc(doc(db, "httpMonitors", monitorId), {
    isEnabled: false,
    updatedAt: Timestamp.now(),
  });
}

export async function resumeHttpMonitor(monitorId: string): Promise<void> {
  await updateDoc(doc(db, "httpMonitors", monitorId), {
    isEnabled: true,
    updatedAt: Timestamp.now(),
  });
}

// Add check result
export async function addHttpMonitorCheck(
  monitorId: string,
  checkData: Omit<HttpMonitorCheck, "id" | "monitorId">
): Promise<string> {
  const docRef = await addDoc(
    collection(db, "httpMonitors", monitorId, "checks"),
    {
      ...checkData,
      monitorId,
    }
  );
  return docRef.id;
}

// Get check history
export async function getHttpMonitorChecks(
  monitorId: string,
  count: number = 100
): Promise<HttpMonitorCheck[]> {
  const checksQuery = query(
    collection(db, "httpMonitors", monitorId, "checks"),
    orderBy("timestamp", "desc"),
    limit(count)
  );

  const snapshot = await getDocs(checksQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HttpMonitorCheck[];
}

// Status history
export async function addHttpMonitorStatusEvent(
  monitorId: string,
  status: HttpMonitorStatus,
  previousEventTimestamp?: Timestamp
): Promise<string> {
  const now = Timestamp.now();
  const eventData: Omit<HttpMonitorStatusEvent, "id"> = {
    status,
    timestamp: now,
  };

  if (previousEventTimestamp) {
    const durationMs = now.toMillis() - previousEventTimestamp.toMillis();
    eventData.duration = Math.round(durationMs / 1000);
  }

  const docRef = await addDoc(
    collection(db, "httpMonitors", monitorId, "statusHistory"),
    eventData
  );
  return docRef.id;
}

export async function getLastHttpMonitorStatusEvent(
  monitorId: string
): Promise<HttpMonitorStatusEvent | null> {
  const historyQuery = query(
    collection(db, "httpMonitors", monitorId, "statusHistory"),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(historyQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as HttpMonitorStatusEvent;
}

export async function getHttpMonitorStatusHistory(
  monitorId: string,
  count: number = 50
): Promise<HttpMonitorStatusEvent[]> {
  const historyQuery = query(
    collection(db, "httpMonitors", monitorId, "statusHistory"),
    orderBy("timestamp", "desc"),
    limit(count)
  );

  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HttpMonitorStatusEvent[];
}

// Get monitors due for checking
export async function getMonitorsDueForCheck(): Promise<HttpMonitor[]> {
  // Get all enabled monitors
  const monitorsQuery = query(
    collection(db, "httpMonitors"),
    where("isEnabled", "==", true)
  );

  const snapshot = await getDocs(monitorsQuery);
  const now = Date.now();

  const dueMonitors: HttpMonitor[] = [];

  for (const docSnapshot of snapshot.docs) {
    const monitor = {
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as HttpMonitor;

    // Check if monitor is due
    if (!monitor.lastCheckedAt) {
      // Never checked - due immediately
      dueMonitors.push(monitor);
    } else {
      const lastChecked = monitor.lastCheckedAt.toDate().getTime();
      const intervalMs = monitor.intervalSeconds * 1000;
      if (now - lastChecked >= intervalMs) {
        dueMonitors.push(monitor);
      }
    }
  }

  return dueMonitors;
}

// Statistics calculation
export interface HttpMonitorStats {
  uptimePercent: number;
  avgResponseTimeMs: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
}

export async function calculateHttpMonitorStats(
  monitorId: string,
  periodDays: number = 1
): Promise<HttpMonitorStats> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const checksQuery = query(
    collection(db, "httpMonitors", monitorId, "checks"),
    where("timestamp", ">=", Timestamp.fromDate(cutoffDate)),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(checksQuery);
  const checks = snapshot.docs.map(doc => doc.data()) as HttpMonitorCheck[];

  const totalChecks = checks.length;
  const successfulChecks = checks.filter(c => c.status === "success").length;
  const failedChecks = checks.filter(c => c.status === "failure").length;

  const responseTimes = checks
    .filter(c => c.responseTimeMs !== undefined)
    .map(c => c.responseTimeMs!);

  const avgResponseTimeMs = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const uptimePercent = totalChecks > 0
    ? Math.round((successfulChecks / totalChecks) * 10000) / 100
    : 100;

  return {
    uptimePercent,
    avgResponseTimeMs,
    totalChecks,
    successfulChecks,
    failedChecks,
  };
}

// Get all unique tags for HTTP monitors
export async function getUserHttpMonitorTags(userId: string): Promise<string[]> {
  const monitors = await getUserHttpMonitors(userId);
  const tagsSet = new Set<string>();

  for (const monitor of monitors) {
    if (monitor.tags) {
      monitor.tags.forEach(tag => tagsSet.add(tag));
    }
  }

  return Array.from(tagsSet).sort();
}
