import { NextRequest } from "next/server";
import {
  withApiAuth,
  revokeApiKey,
  apiSuccess,
  apiError,
  ApiAuthContext,
  rateLimitHeaders,
} from "@/lib/api-auth";

// DELETE /api/v1/auth/keys/:id - Revoke an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      const success = await revokeApiKey(auth.userId, id);

      if (!success) {
        return apiError(
          "NOT_FOUND",
          "API key not found or does not belong to you",
          404
        );
      }

      return apiSuccess(
        { revoked: true },
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      return apiError("INTERNAL_ERROR", "Failed to revoke API key", 500);
    }
  });
}
