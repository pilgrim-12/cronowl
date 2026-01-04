import { NextRequest } from "next/server";
import { withAdminAuth, adminApiSuccess, adminApiError, AdminAuthContext } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { UserActivityAction } from "@/lib/user-activity";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req: NextRequest, _auth: AdminAuthContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
      const userId = searchParams.get("userId") || "";
      const action = searchParams.get("action") || "";
      const startDate = searchParams.get("startDate") || "";
      const endDate = searchParams.get("endDate") || "";

      // Build query
      let query = adminDb.collection("userActivity").orderBy("timestamp", "desc");

      // Apply userId filter
      if (userId) {
        query = query.where("userId", "==", userId);
      }

      // Apply action filter
      if (action) {
        query = query.where("action", "==", action as UserActivityAction);
      }

      // Apply date filters
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query = query.where("timestamp", ">=", start);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.where("timestamp", "<=", end);
      }

      // Get total count (approximate, as Firestore doesn't have efficient count with complex queries)
      // For simplicity, we'll fetch more and count
      const countSnapshot = await query.limit(1000).get();
      const total = countSnapshot.size;

      // Paginate
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();

      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          details: data.details,
          ip: data.ip,
          userAgent: data.userAgent,
          timestamp: data.timestamp?.toDate?.().toISOString() || null,
          metadata: data.metadata,
        };
      });

      return adminApiSuccess({
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching activity log:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to fetch activity log", 500);
    }
  });
}
