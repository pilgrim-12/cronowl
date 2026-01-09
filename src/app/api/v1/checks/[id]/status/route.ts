import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
  rateLimitHeaders,
} from "@/lib/api-auth";
import { getUserChecks, getStatusHistory } from "@/lib/checks";

// GET /api/v1/checks/:id/status - Get status history for a check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      // Verify ownership
      const checks = await getUserChecks(auth.userId);
      const check = checks.find((c) => c.id === id);

      if (!check) {
        return apiError("NOT_FOUND", "Check not found", 404);
      }

      const { searchParams } = new URL(req.url);
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

      const statusEvents = await getStatusHistory(id, limit);

      const serializedEvents = statusEvents.map((event) => ({
        id: event.id,
        status: event.status,
        timestamp: event.timestamp.toDate().toISOString(),
        duration: event.duration || null, // Duration in previous status (seconds)
      }));

      return apiSuccess(
        serializedEvents,
        {
          checkId: id,
          checkName: check.name,
          currentStatus: check.status,
          count: serializedEvents.length,
        },
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to get status history:", error);
      return apiError("INTERNAL_ERROR", "Failed to get status history", 500);
    }
  });
}
