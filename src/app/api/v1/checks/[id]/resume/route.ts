import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
} from "@/lib/api-auth";
import { getUserChecks, updateCheck } from "@/lib/checks";

// POST /api/v1/checks/:id/resume - Resume a paused check
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      // Verify ownership
      const checks = await getUserChecks(auth.userId);
      const check = checks.find((c) => c.id === id);

      if (!check) {
        return apiError("NOT_FOUND", "Check not found", 404);
      }

      if (!check.paused) {
        return apiError("NOT_PAUSED", "Check is not paused", 400);
      }

      await updateCheck(id, { paused: false });

      return apiSuccess({ paused: false, id });
    } catch (error) {
      console.error("Failed to resume check:", error);
      return apiError("INTERNAL_ERROR", "Failed to resume check", 500);
    }
  });
}
