import { NextRequest } from "next/server";
import { withAdminAuth, adminApiSuccess, adminApiError, AdminAuthContext } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { logActivity } from "@/lib/user-activity";
import { FieldValue } from "firebase-admin/firestore";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withAdminAuth(request, async (req: NextRequest, auth: AdminAuthContext) => {
    try {
      const { id: userId } = await context.params;
      const body = await req.json();

      const action = body.action as "block" | "unblock";
      const reason = body.reason as string | undefined;

      if (!action || !["block", "unblock"].includes(action)) {
        return adminApiError("BAD_REQUEST", "Invalid action. Must be 'block' or 'unblock'", 400);
      }

      // Check if user exists
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return adminApiError("NOT_FOUND", "User not found", 404);
      }

      const userData = userDoc.data()!;

      // Prevent blocking yourself
      if (userId === auth.userId) {
        return adminApiError("BAD_REQUEST", "You cannot block yourself", 400);
      }

      // Prevent blocking other admins
      if (userData.isAdmin === true && action === "block") {
        return adminApiError("BAD_REQUEST", "Cannot block another admin", 400);
      }

      if (action === "block") {
        await userRef.update({
          isBlocked: true,
          blockedAt: FieldValue.serverTimestamp(),
          blockedReason: reason || "Blocked by administrator",
        });

        // Log the action
        await logActivity(
          auth.userId,
          auth.email,
          "settings.updated",
          {
            targetUserId: userId,
            targetUserEmail: userData.email,
            action: "user_blocked",
            reason: reason || "Blocked by administrator",
          }
        );

        return adminApiSuccess({ message: "User blocked successfully" });
      } else {
        await userRef.update({
          isBlocked: false,
          blockedAt: FieldValue.delete(),
          blockedReason: FieldValue.delete(),
        });

        // Log the action
        await logActivity(
          auth.userId,
          auth.email,
          "settings.updated",
          {
            targetUserId: userId,
            targetUserEmail: userData.email,
            action: "user_unblocked",
          }
        );

        return adminApiSuccess({ message: "User unblocked successfully" });
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to update user status", 500);
    }
  });
}
