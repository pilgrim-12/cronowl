import { NextRequest } from "next/server";
import { withAdminAuth, adminApiSuccess, adminApiError, AdminAuthContext } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getUserActivity } from "@/lib/user-activity";
import { logActivity } from "@/lib/user-activity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withAdminAuth(request, async (_req: NextRequest, _auth: AdminAuthContext) => {
    try {
      const { id: userId } = await context.params;

      // Get user document
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return adminApiError("NOT_FOUND", "User not found", 404);
      }

      const userData = userDoc.data()!;

      // Get user's checks
      const checksSnapshot = await adminDb
        .collection("checks")
        .where("userId", "==", userId)
        .get();

      const checks = checksSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          status: data.status,
          paused: data.paused || false,
          lastPing: data.lastPing?.toDate?.().toISOString() || null,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        };
      });

      // Get user's API keys (metadata only)
      const apiKeysSnapshot = await adminDb
        .collection("apiKeys")
        .where("userId", "==", userId)
        .get();

      const apiKeys = apiKeysSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          keyPrefix: data.keyPrefix,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
          lastUsedAt: data.lastUsedAt?.toDate?.().toISOString() || null,
        };
      });

      // Get user's status pages
      const statusPagesSnapshot = await adminDb
        .collection("statusPages")
        .where("userId", "==", userId)
        .get();

      const statusPages = statusPagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          slug: data.slug,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        };
      });

      // Get user's recent activity
      const recentActivity = await getUserActivity(userId, 20);

      return adminApiSuccess({
        id: userId,
        email: userData.email || "",
        plan: userData.plan || "free",
        createdAt: userData.createdAt?.toDate?.().toISOString() || null,
        lastLoginAt: userData.lastLoginAt?.toDate?.().toISOString() || null,
        lastLoginIp: userData.lastLoginIp || null,
        isBlocked: userData.isBlocked === true,
        blockedAt: userData.blockedAt?.toDate?.().toISOString() || null,
        blockedReason: userData.blockedReason || null,
        isAdmin: userData.isAdmin === true,
        subscription: userData.subscription || null,
        notificationSettings: {
          email: userData.emailNotifications !== false,
          push: userData.pushNotifications !== false,
          telegram: userData.telegramNotifications !== false,
          hasTelegram: !!userData.telegramChatId,
        },
        checks,
        apiKeys,
        statusPages,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to fetch user details", 500);
    }
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAdminAuth(request, async (req: NextRequest, auth: AdminAuthContext) => {
    try {
      const { id: userId } = await context.params;
      const body = await req.json();

      // Check if user exists
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return adminApiError("NOT_FOUND", "User not found", 404);
      }

      const userData = userDoc.data()!;
      const updates: Record<string, unknown> = {};

      // Only allow updating plan for now
      if (body.plan && ["free", "starter", "pro"].includes(body.plan)) {
        const previousPlan = userData.plan || "free";
        updates.plan = body.plan;

        // Log the admin action
        await logActivity(
          auth.userId,
          auth.email,
          "settings.updated",
          {
            targetUserId: userId,
            targetUserEmail: userData.email,
            action: "plan_changed",
            previousPlan,
            newPlan: body.plan,
          }
        );
      }

      if (Object.keys(updates).length === 0) {
        return adminApiError("BAD_REQUEST", "No valid fields to update", 400);
      }

      await userRef.update(updates);

      return adminApiSuccess({ message: "User updated successfully", updates });
    } catch (error) {
      console.error("Error updating user:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to update user", 500);
    }
  });
}
