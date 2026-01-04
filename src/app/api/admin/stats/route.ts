import { NextRequest } from "next/server";
import { withAdminAuth, adminApiSuccess, adminApiError, AdminAuthContext } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getRecentActivity, getTodayActivityCount } from "@/lib/user-activity";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req: NextRequest, _auth: AdminAuthContext) => {
    try {
      // Get all users
      const usersSnapshot = await adminDb.collection("users").get();
      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Count users by plan
      const byPlan = { free: 0, starter: 0, pro: 0 };
      let activeToday = 0;
      let newThisWeek = 0;

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      for (const user of users) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userData = user as any;
        const plan = userData.plan || "free";
        if (plan in byPlan) {
          byPlan[plan as keyof typeof byPlan]++;
        }

        // Check if active today
        if (userData.lastLoginAt) {
          const lastLogin = userData.lastLoginAt.toDate ? userData.lastLoginAt.toDate() : new Date(userData.lastLoginAt);
          if (lastLogin >= todayStart) {
            activeToday++;
          }
        }

        // Check if new this week
        if (userData.createdAt) {
          const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
          if (createdAt >= weekAgo) {
            newThisWeek++;
          }
        }
      }

      // Get all checks
      const checksSnapshot = await adminDb.collection("checks").get();
      const checks = checksSnapshot.docs.map((doc) => doc.data());

      // Count checks by status
      let statusUp = 0;
      let statusDown = 0;
      let statusNew = 0;

      for (const check of checks) {
        const status = check.status || "new";
        if (status === "up") statusUp++;
        else if (status === "down") statusDown++;
        else statusNew++;
      }

      // Get recent activity
      const recentActions = await getRecentActivity(10);
      const totalToday = await getTodayActivityCount();

      return adminApiSuccess({
        users: {
          total: users.length,
          activeToday,
          newThisWeek,
          byPlan,
        },
        checks: {
          total: checks.length,
          statusUp,
          statusDown,
          statusNew,
        },
        activity: {
          totalToday,
          recentActions,
        },
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to fetch statistics", 500);
    }
  });
}
