import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Activity action types
export type UserActivityAction =
  | "user.registered"
  | "user.login"
  | "user.logout"
  | "check.created"
  | "check.updated"
  | "check.deleted"
  | "check.paused"
  | "check.resumed"
  | "subscription.upgraded"
  | "subscription.downgraded"
  | "subscription.canceled"
  | "apiKey.created"
  | "apiKey.revoked"
  | "statusPage.created"
  | "statusPage.updated"
  | "statusPage.deleted"
  | "incident.created"
  | "incident.updated"
  | "incident.resolved"
  | "team.memberInvited"
  | "team.memberRemoved"
  | "settings.updated";

// Activity metadata interface
export interface ActivityMetadata {
  checkId?: string;
  checkName?: string;
  previousPlan?: string;
  newPlan?: string;
  apiKeyId?: string;
  apiKeyName?: string;
  statusPageId?: string;
  statusPageName?: string;
  incidentId?: string;
  teamMemberEmail?: string;
  settingChanged?: string;
}

// User activity document interface
export interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: UserActivityAction;
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: FirebaseFirestore.Timestamp;
  metadata?: ActivityMetadata;
}

// Main logging function
export async function logActivity(
  userId: string,
  userEmail: string,
  action: UserActivityAction,
  details: Record<string, unknown> = {},
  options?: {
    ip?: string;
    userAgent?: string;
    metadata?: ActivityMetadata;
  }
): Promise<string | null> {
  try {
    const activityRef = adminDb.collection("userActivity");
    const docRef = await activityRef.add({
      userId,
      userEmail,
      action,
      details,
      ip: options?.ip || null,
      userAgent: options?.userAgent || null,
      timestamp: FieldValue.serverTimestamp(),
      metadata: options?.metadata || null,
    });
    return docRef.id;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

// Convenience functions for common actions

export async function logUserRegistered(
  userId: string,
  userEmail: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(userId, userEmail, "user.registered", {}, options);
}

export async function logUserLogin(
  userId: string,
  userEmail: string,
  provider: "email" | "google" | "github",
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(userId, userEmail, "user.login", { provider }, options);
}

export async function logCheckCreated(
  userId: string,
  userEmail: string,
  checkId: string,
  checkName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "check.created",
    { checkId, checkName },
    { ...options, metadata: { checkId, checkName } }
  );
}

export async function logCheckUpdated(
  userId: string,
  userEmail: string,
  checkId: string,
  checkName: string,
  changes: Record<string, unknown>,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "check.updated",
    { checkId, checkName, changes },
    { ...options, metadata: { checkId, checkName } }
  );
}

export async function logCheckDeleted(
  userId: string,
  userEmail: string,
  checkId: string,
  checkName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "check.deleted",
    { checkId, checkName },
    { ...options, metadata: { checkId, checkName } }
  );
}

export async function logCheckPaused(
  userId: string,
  userEmail: string,
  checkId: string,
  checkName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "check.paused",
    { checkId, checkName },
    { ...options, metadata: { checkId, checkName } }
  );
}

export async function logCheckResumed(
  userId: string,
  userEmail: string,
  checkId: string,
  checkName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "check.resumed",
    { checkId, checkName },
    { ...options, metadata: { checkId, checkName } }
  );
}

export async function logSubscriptionUpgraded(
  userId: string,
  userEmail: string,
  previousPlan: string,
  newPlan: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "subscription.upgraded",
    { previousPlan, newPlan },
    { ...options, metadata: { previousPlan, newPlan } }
  );
}

export async function logSubscriptionDowngraded(
  userId: string,
  userEmail: string,
  previousPlan: string,
  newPlan: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "subscription.downgraded",
    { previousPlan, newPlan },
    { ...options, metadata: { previousPlan, newPlan } }
  );
}

export async function logSubscriptionCanceled(
  userId: string,
  userEmail: string,
  plan: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "subscription.canceled",
    { plan },
    { ...options, metadata: { previousPlan: plan } }
  );
}

export async function logApiKeyCreated(
  userId: string,
  userEmail: string,
  apiKeyId: string,
  apiKeyName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "apiKey.created",
    { apiKeyId, apiKeyName },
    { ...options, metadata: { apiKeyId, apiKeyName } }
  );
}

export async function logApiKeyRevoked(
  userId: string,
  userEmail: string,
  apiKeyId: string,
  apiKeyName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "apiKey.revoked",
    { apiKeyId, apiKeyName },
    { ...options, metadata: { apiKeyId, apiKeyName } }
  );
}

export async function logStatusPageCreated(
  userId: string,
  userEmail: string,
  statusPageId: string,
  statusPageName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "statusPage.created",
    { statusPageId, statusPageName },
    { ...options, metadata: { statusPageId, statusPageName } }
  );
}

export async function logStatusPageDeleted(
  userId: string,
  userEmail: string,
  statusPageId: string,
  statusPageName: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "statusPage.deleted",
    { statusPageId, statusPageName },
    { ...options, metadata: { statusPageId, statusPageName } }
  );
}

export async function logTeamMemberInvited(
  userId: string,
  userEmail: string,
  memberEmail: string,
  role: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "team.memberInvited",
    { memberEmail, role },
    { ...options, metadata: { teamMemberEmail: memberEmail } }
  );
}

export async function logTeamMemberRemoved(
  userId: string,
  userEmail: string,
  memberEmail: string,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "team.memberRemoved",
    { memberEmail },
    { ...options, metadata: { teamMemberEmail: memberEmail } }
  );
}

export async function logSettingsUpdated(
  userId: string,
  userEmail: string,
  settingChanged: string,
  oldValue: unknown,
  newValue: unknown,
  options?: { ip?: string; userAgent?: string }
): Promise<string | null> {
  return logActivity(
    userId,
    userEmail,
    "settings.updated",
    { settingChanged, oldValue, newValue },
    { ...options, metadata: { settingChanged } }
  );
}

// Query functions for admin panel

export async function getRecentActivity(
  limit: number = 10
): Promise<UserActivity[]> {
  try {
    const snapshot = await adminDb
      .collection("userActivity")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserActivity[];
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return [];
  }
}

export async function getUserActivity(
  userId: string,
  limit: number = 20
): Promise<UserActivity[]> {
  try {
    const snapshot = await adminDb
      .collection("userActivity")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserActivity[];
  } catch (error) {
    console.error("Failed to get user activity:", error);
    return [];
  }
}

export async function getActivityByAction(
  action: UserActivityAction,
  limit: number = 20
): Promise<UserActivity[]> {
  try {
    const snapshot = await adminDb
      .collection("userActivity")
      .where("action", "==", action)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserActivity[];
  } catch (error) {
    console.error("Failed to get activity by action:", error);
    return [];
  }
}

export async function getTodayActivityCount(): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await adminDb
      .collection("userActivity")
      .where("timestamp", ">=", today)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    console.error("Failed to get today activity count:", error);
    return 0;
  }
}
