import { NextRequest } from "next/server";
import { withAdminAuth, adminApiSuccess, adminApiError, AdminAuthContext } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

interface AdminUserView {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  checksCount: number;
  isBlocked: boolean;
  isAdmin: boolean;
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req: NextRequest, _auth: AdminAuthContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
      const search = searchParams.get("search") || "";
      const planFilter = searchParams.get("plan") || "";
      const statusFilter = searchParams.get("status") || "";

      // Get all users (Firestore doesn't support complex queries like LIKE)
      const usersSnapshot = await adminDb.collection("users").get();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let users: any[] = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Get all checks to count per user
      const checksSnapshot = await adminDb.collection("checks").get();
      const checksByUser: Record<string, number> = {};
      checksSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        if (userId) {
          checksByUser[userId] = (checksByUser[userId] || 0) + 1;
        }
      });

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter((user) =>
          user.email?.toLowerCase().includes(searchLower)
        );
      }

      // Apply plan filter
      if (planFilter) {
        users = users.filter((user) => (user.plan || "free") === planFilter);
      }

      // Apply status filter
      if (statusFilter === "blocked") {
        users = users.filter((user) => user.isBlocked === true);
      } else if (statusFilter === "active") {
        users = users.filter((user) => user.isBlocked !== true);
      }

      // Sort by createdAt descending
      users.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      // Pagination
      const total = users.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedUsers = users.slice(offset, offset + limit);

      // Format response
      const formattedUsers: AdminUserView[] = paginatedUsers.map((user) => ({
        id: user.id,
        email: user.email || "",
        plan: user.plan || "free",
        createdAt: user.createdAt?.toDate
          ? user.createdAt.toDate().toISOString()
          : user.createdAt
            ? new Date(user.createdAt).toISOString()
            : "",
        lastLoginAt: user.lastLoginAt?.toDate
          ? user.lastLoginAt.toDate().toISOString()
          : user.lastLoginAt
            ? new Date(user.lastLoginAt).toISOString()
            : undefined,
        lastLoginIp: user.lastLoginIp,
        checksCount: checksByUser[user.id] || 0,
        isBlocked: user.isBlocked === true,
        isAdmin: user.isAdmin === true,
      }));

      return adminApiSuccess({
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return adminApiError("INTERNAL_ERROR", "Failed to fetch users", 500);
    }
  });
}
