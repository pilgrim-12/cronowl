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
  maxDuration?: number; // max allowed duration in ms, alert if exceeded
  paused?: boolean; // if true, skip status checking
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
  maxDuration?: number; // max allowed duration in ms
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

  if (data.maxDuration && data.maxDuration > 0) {
    checkData.maxDuration = data.maxDuration;
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

// ==================== Status Page Branding ====================

export interface StatusPageBranding {
  logoUrl?: string; // URL to custom logo image
  primaryColor?: string; // Hex color (e.g., "#3B82F6")
  hidePoweredBy?: boolean; // Hide "Powered by CronOwl" footer
}

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
  branding?: StatusPageBranding; // custom branding (Pro only)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== Status History (Uptime) ====================

export interface DayStatus {
  date: string; // "2025-12-31" ISO date
  status: "operational" | "incident" | "no-data";
  uptimePercent?: number; // 0-100
  downMinutes?: number; // minutes of downtime that day
}

export interface CheckHistoryData {
  checkId: string;
  checkName: string;
  days: DayStatus[];
  overallUptime: number; // 0-100
}

export interface StatusPageCheck {
  id: string;
  name: string;
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  tags?: string[];
  history?: DayStatus[]; // uptime history
  uptimePercent?: number; // overall uptime
}

// ==================== Incidents ====================

export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
export type IncidentSeverity = "minor" | "major" | "critical";

export interface Incident {
  id: string;
  statusPageId: string;
  userId: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  affectedCheckIds?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface IncidentUpdate {
  id: string;
  message: string;
  status: IncidentStatus;
  createdAt: Timestamp;
}

export interface PublicIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  updates: {
    message: string;
    status: IncidentStatus;
    createdAt: string;
  }[];
}

export interface PublicStatusPage {
  title: string;
  description?: string;
  checks: StatusPageCheck[];
  overallStatus: "operational" | "degraded" | "down";
  updatedAt: string;
  branding?: StatusPageBranding;
  incidents?: {
    active: PublicIncident[];
    recent: PublicIncident[];
  };
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

export interface StatusPageLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  reason?: string;
}

export async function canCreateStatusPage(userId: string): Promise<StatusPageLimitResult> {
  const plan = await getUserPlan(userId);
  const planLimits = PLANS[plan];
  const existingPages = await getUserStatusPages(userId);
  const currentCount = existingPages.length;

  if (currentCount >= planLimits.statusPagesLimit) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.statusPagesLimit,
      plan,
      reason: `You've reached the limit of ${planLimits.statusPagesLimit} status page(s) on the ${planLimits.name} plan. Upgrade to add more.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.statusPagesLimit,
    plan,
  };
}

export async function createStatusPage(
  userId: string,
  data: CreateStatusPageData
): Promise<string> {
  // Check plan-based limit
  const limitCheck = await canCreateStatusPage(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason || "Status page limit reached");
  }

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

  // Get owner's plan to determine history days limit
  const plan = await getUserPlan(page.userId);
  const historyDays = PLANS[plan].historyDays;

  // Fetch all checks for this page with history
  const checks: StatusPageCheck[] = [];
  let upCount = 0;
  let downCount = 0;

  for (const checkId of page.checkIds) {
    const checkDoc = await getDoc(doc(db, "checks", checkId));
    if (checkDoc.exists()) {
      const checkData = checkDoc.data() as Omit<Check, "id">;
      const realStatus = calculateRealStatus({ id: checkId, ...checkData } as Check);

      // Get uptime history (limited by plan)
      const { days: history, overallUptime } = await getCheckUptimeHistory(checkId, historyDays);

      checks.push({
        id: checkId,
        name: checkData.name,
        status: realStatus,
        lastPing: checkData.lastPing,
        tags: page.showTags ? checkData.tags : undefined,
        history,
        uptimePercent: overallUptime,
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

  // Get incidents for this status page
  const activeIncidents = await getStatusPageIncidents(page.id, false);
  const recentResolved = await getRecentResolvedIncidents(page.id, 7, 5);

  // Format incidents for public display
  const formatIncidentForPublic = async (incident: Incident): Promise<PublicIncident> => {
    const fullIncident = await getIncidentWithUpdates(incident.id);
    return {
      id: incident.id,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      createdAt: incident.createdAt.toDate().toISOString(),
      updatedAt: incident.updatedAt.toDate().toISOString(),
      resolvedAt: incident.resolvedAt?.toDate().toISOString(),
      updates: (fullIncident?.updates || []).map(u => ({
        message: u.message,
        status: u.status,
        createdAt: u.createdAt.toDate().toISOString(),
      })),
    };
  };

  const formattedActiveIncidents = await Promise.all(activeIncidents.map(formatIncidentForPublic));
  const formattedRecentIncidents = await Promise.all(recentResolved.map(formatIncidentForPublic));

  return {
    title: page.title,
    description: page.description,
    checks,
    overallStatus,
    updatedAt: new Date().toISOString(),
    branding: page.branding,
    incidents: {
      active: formattedActiveIncidents,
      recent: formattedRecentIncidents,
    },
  };
}

// ==================== Team Members ====================

export interface TeamMember {
  id: string;
  ownerId: string; // The Pro user who owns the team
  memberEmail: string;
  memberUserId?: string; // Set when member accepts invite
  role: "viewer" | "editor"; // viewer can only view, editor can modify
  status: "pending" | "accepted";
  invitedAt: Timestamp;
  acceptedAt?: Timestamp;
}

export interface TeamMemberLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  reason?: string;
}

export async function canInviteTeamMember(userId: string): Promise<TeamMemberLimitResult> {
  const plan = await getUserPlan(userId);
  const planLimits = PLANS[plan];

  if (planLimits.teamMembers === 0) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan,
      reason: "Team members are only available on the Pro plan.",
    };
  }

  const existingMembers = await getTeamMembers(userId);
  const currentCount = existingMembers.length;

  if (currentCount >= planLimits.teamMembers) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.teamMembers,
      plan,
      reason: `You've reached the limit of ${planLimits.teamMembers} team members on the ${planLimits.name} plan.`,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.teamMembers,
    plan,
  };
}

export async function inviteTeamMember(
  ownerId: string,
  memberEmail: string,
  role: "viewer" | "editor" = "viewer"
): Promise<string> {
  // Check limit
  const limitCheck = await canInviteTeamMember(ownerId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason || "Team member limit reached");
  }

  // Check if already invited
  const existingQuery = query(
    collection(db, "teamMembers"),
    where("ownerId", "==", ownerId),
    where("memberEmail", "==", memberEmail.toLowerCase())
  );
  const existingSnapshot = await getDocs(existingQuery);
  if (!existingSnapshot.empty) {
    throw new Error("This email has already been invited");
  }

  const docRef = await addDoc(collection(db, "teamMembers"), {
    ownerId,
    memberEmail: memberEmail.toLowerCase(),
    role,
    status: "pending",
    invitedAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function getTeamMembers(ownerId: string): Promise<TeamMember[]> {
  const membersQuery = query(
    collection(db, "teamMembers"),
    where("ownerId", "==", ownerId),
    orderBy("invitedAt", "desc")
  );

  const snapshot = await getDocs(membersQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TeamMember[];
}

export async function getTeamInvitations(memberEmail: string): Promise<TeamMember[]> {
  const invitesQuery = query(
    collection(db, "teamMembers"),
    where("memberEmail", "==", memberEmail.toLowerCase()),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(invitesQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TeamMember[];
}

export async function acceptTeamInvitation(
  invitationId: string,
  memberUserId: string
): Promise<void> {
  await updateDoc(doc(db, "teamMembers", invitationId), {
    memberUserId,
    status: "accepted",
    acceptedAt: Timestamp.now(),
  });
}

export async function removeTeamMember(memberId: string): Promise<void> {
  await deleteDoc(doc(db, "teamMembers", memberId));
}

export async function getTeamsUserBelongsTo(userId: string): Promise<string[]> {
  // Find all teams where user is an accepted member
  const memberQuery = query(
    collection(db, "teamMembers"),
    where("memberUserId", "==", userId),
    where("status", "==", "accepted")
  );

  const snapshot = await getDocs(memberQuery);
  return snapshot.docs.map((doc) => doc.data().ownerId as string);
}

// Get all checks user can access (own + team owner's)
export async function getAccessibleChecks(userId: string): Promise<Check[]> {
  // Get own checks
  const ownChecks = await getUserChecks(userId);

  // Get team owner IDs
  const teamOwnerIds = await getTeamsUserBelongsTo(userId);

  // Get checks from team owners
  const teamChecks: Check[] = [];
  for (const ownerId of teamOwnerIds) {
    const ownerChecks = await getUserChecks(ownerId);
    teamChecks.push(...ownerChecks);
  }

  return [...ownChecks, ...teamChecks];
}

// ==================== Status History (Uptime) Functions ====================

/**
 * Get uptime history for a check over the last N days
 * Aggregates statusHistory events into daily buckets
 */
export async function getCheckUptimeHistory(
  checkId: string,
  days: number = 90
): Promise<{ days: DayStatus[]; overallUptime: number }> {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  // Get status history for the period
  const historyQuery = query(
    collection(db, "checks", checkId, "statusHistory"),
    where("timestamp", ">=", Timestamp.fromDate(cutoffDate)),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(historyQuery);
  const events = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StatusEvent[];

  // Initialize daily buckets
  const dayMap = new Map<string, { downMinutes: number; hasData: boolean }>();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split("T")[0];
    dayMap.set(dateStr, { downMinutes: 0, hasData: false });
  }

  // Process events to calculate downtime per day
  let currentStatus: "up" | "down" = "up";
  let lastEventTime = cutoffDate;

  for (const event of events) {
    const eventTime = event.timestamp.toDate();
    const eventDateStr = eventTime.toISOString().split("T")[0];

    // If previous status was "down", calculate downtime
    if (currentStatus === "down") {
      // Calculate downtime between lastEventTime and eventTime
      let cursor = new Date(lastEventTime);
      while (cursor < eventTime) {
        const cursorDateStr = cursor.toISOString().split("T")[0];
        const dayData = dayMap.get(cursorDateStr);
        if (dayData) {
          // Calculate minutes in this day
          const dayStart = new Date(cursor);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const periodStart = cursor > dayStart ? cursor : dayStart;
          const periodEnd = eventTime < dayEnd ? eventTime : dayEnd;

          if (periodEnd > periodStart) {
            const minutes = (periodEnd.getTime() - periodStart.getTime()) / 60000;
            dayData.downMinutes += minutes;
            dayData.hasData = true;
          }
        }
        // Move to next day
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
      }
    }

    // Mark day as having data
    const dayData = dayMap.get(eventDateStr);
    if (dayData) {
      dayData.hasData = true;
    }

    currentStatus = event.status;
    lastEventTime = eventTime;
  }

  // If currently down, calculate downtime until now
  if (currentStatus === "down") {
    let cursor = new Date(lastEventTime);
    while (cursor < now) {
      const cursorDateStr = cursor.toISOString().split("T")[0];
      const dayData = dayMap.get(cursorDateStr);
      if (dayData) {
        const dayStart = new Date(cursor);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const periodStart = cursor > dayStart ? cursor : dayStart;
        const periodEnd = now < dayEnd ? now : dayEnd;

        if (periodEnd > periodStart) {
          const minutes = (periodEnd.getTime() - periodStart.getTime()) / 60000;
          dayData.downMinutes += minutes;
          dayData.hasData = true;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }
  }

  // Convert to DayStatus array
  const daysResult: DayStatus[] = [];
  let totalMinutes = 0;
  let totalDownMinutes = 0;

  for (const [dateStr, data] of dayMap) {
    const minutesInDay = 24 * 60;
    totalMinutes += minutesInDay;
    totalDownMinutes += data.downMinutes;

    const uptimePercent = ((minutesInDay - data.downMinutes) / minutesInDay) * 100;

    daysResult.push({
      date: dateStr,
      status: !data.hasData
        ? "no-data"
        : data.downMinutes > 0
        ? "incident"
        : "operational",
      uptimePercent: Math.round(uptimePercent * 100) / 100,
      downMinutes: Math.round(data.downMinutes),
    });
  }

  const overallUptime =
    totalMinutes > 0
      ? Math.round(((totalMinutes - totalDownMinutes) / totalMinutes) * 10000) / 100
      : 100;

  return { days: daysResult, overallUptime };
}

// ==================== Branding Functions ====================

export async function canUseBranding(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId);
  const planLimits = PLANS[plan];

  if (!planLimits.customBranding) {
    return {
      allowed: false,
      reason: "Custom branding is only available on the Pro plan.",
    };
  }

  return { allowed: true };
}

// ==================== Incident Functions ====================

export interface IncidentLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanType;
  reason?: string;
}

export async function canCreateIncident(
  userId: string,
  statusPageId: string
): Promise<IncidentLimitResult> {
  const plan = await getUserPlan(userId);
  const planLimits = PLANS[plan];
  const limit = planLimits.activeIncidentsLimit;

  // Get active incidents count for this status page
  const activeIncidents = await getStatusPageIncidents(statusPageId, false);
  const current = activeIncidents.length;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      reason: `You've reached the limit of ${limit} active incident(s) on the ${planLimits.name} plan. Resolve existing incidents or upgrade.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

export interface CreateIncidentData {
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  initialMessage?: string;
  affectedCheckIds?: string[];
}

export async function createIncident(
  statusPageId: string,
  userId: string,
  data: CreateIncidentData
): Promise<string> {
  // Check limit
  const limitCheck = await canCreateIncident(userId, statusPageId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason || "Incident limit reached");
  }

  const now = Timestamp.now();
  const incidentData = {
    statusPageId,
    userId,
    title: data.title,
    status: data.status,
    severity: data.severity,
    affectedCheckIds: data.affectedCheckIds || [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, "incidents"), incidentData);

  // Add initial update if message provided
  if (data.initialMessage) {
    await addDoc(collection(db, "incidents", docRef.id, "updates"), {
      message: data.initialMessage,
      status: data.status,
      createdAt: now,
    });
  }

  return docRef.id;
}

export async function addIncidentUpdate(
  incidentId: string,
  message: string,
  status: IncidentStatus
): Promise<string> {
  const now = Timestamp.now();

  // Add update
  const updateRef = await addDoc(collection(db, "incidents", incidentId, "updates"), {
    message,
    status,
    createdAt: now,
  });

  // Update incident status and timestamp
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: now,
  };

  if (status === "resolved") {
    updateData.resolvedAt = now;
  }

  await updateDoc(doc(db, "incidents", incidentId), updateData);

  return updateRef.id;
}

export async function resolveIncident(incidentId: string, message?: string): Promise<void> {
  const now = Timestamp.now();

  // Add resolution update
  await addDoc(collection(db, "incidents", incidentId, "updates"), {
    message: message || "This incident has been resolved.",
    status: "resolved",
    createdAt: now,
  });

  // Update incident
  await updateDoc(doc(db, "incidents", incidentId), {
    status: "resolved",
    resolvedAt: now,
    updatedAt: now,
  });
}

export async function getStatusPageIncidents(
  statusPageId: string,
  includeResolved: boolean = false
): Promise<Incident[]> {
  let incidentsQuery;

  if (includeResolved) {
    incidentsQuery = query(
      collection(db, "incidents"),
      where("statusPageId", "==", statusPageId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  } else {
    incidentsQuery = query(
      collection(db, "incidents"),
      where("statusPageId", "==", statusPageId),
      where("status", "!=", "resolved"),
      orderBy("status"),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(incidentsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Incident[];
}

export async function getIncidentWithUpdates(
  incidentId: string
): Promise<(Incident & { updates: IncidentUpdate[] }) | null> {
  const incidentDoc = await getDoc(doc(db, "incidents", incidentId));
  if (!incidentDoc.exists()) return null;

  const updatesQuery = query(
    collection(db, "incidents", incidentId, "updates"),
    orderBy("createdAt", "desc")
  );
  const updatesSnapshot = await getDocs(updatesQuery);

  const updates = updatesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IncidentUpdate[];

  return {
    id: incidentDoc.id,
    ...incidentDoc.data(),
    updates,
  } as Incident & { updates: IncidentUpdate[] };
}

export async function deleteIncident(incidentId: string): Promise<void> {
  // Delete all updates first
  const updatesQuery = query(collection(db, "incidents", incidentId, "updates"));
  const updatesSnapshot = await getDocs(updatesQuery);
  for (const updateDoc of updatesSnapshot.docs) {
    await deleteDoc(updateDoc.ref);
  }

  // Delete incident
  await deleteDoc(doc(db, "incidents", incidentId));
}

export async function getRecentResolvedIncidents(
  statusPageId: string,
  daysBack: number = 7,
  maxCount: number = 5
): Promise<Incident[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const incidentsQuery = query(
    collection(db, "incidents"),
    where("statusPageId", "==", statusPageId),
    where("status", "==", "resolved"),
    where("resolvedAt", ">=", Timestamp.fromDate(cutoff)),
    orderBy("resolvedAt", "desc"),
    limit(maxCount)
  );

  const snapshot = await getDocs(incidentsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Incident[];
}
