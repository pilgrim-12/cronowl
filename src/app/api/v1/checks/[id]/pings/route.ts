import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
} from "@/lib/api-auth";
import { getUserChecks, getCheckPings } from "@/lib/checks";

// GET /api/v1/checks/:id/pings - Get ping history for a check
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

      const pings = await getCheckPings(id, limit);

      const serializedPings = pings.map((ping) => ({
        id: ping.id,
        timestamp: ping.timestamp.toDate().toISOString(),
        ip: ping.ip,
        userAgent: ping.userAgent,
        duration: ping.duration || null,
        exitCode: ping.exitCode ?? null,
        output: ping.output || null,
        status: ping.status || null,
      }));

      return apiSuccess(serializedPings, {
        checkId: id,
        checkName: check.name,
        count: serializedPings.length,
      });
    } catch (error) {
      console.error("Failed to get pings:", error);
      return apiError("INTERNAL_ERROR", "Failed to get pings", 500);
    }
  });
}
