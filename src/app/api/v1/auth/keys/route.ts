import { NextRequest } from "next/server";
import {
  withApiAuth,
  createApiKey,
  getUserApiKeys,
  apiSuccess,
  apiError,
  ApiAuthContext,
  rateLimitHeaders,
} from "@/lib/api-auth";

// GET /api/v1/auth/keys - List all API keys for the authenticated user
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      const keys = await getUserApiKeys(auth.userId);

      // Don't return keyHash, only safe fields
      const safeKeys = keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.keyPrefix,
        createdAt: key.createdAt.toDate().toISOString(),
        lastUsedAt: key.lastUsedAt?.toDate().toISOString() || null,
      }));

      return apiSuccess(
        safeKeys,
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to list API keys:", error);
      return apiError("INTERNAL_ERROR", "Failed to list API keys", 500);
    }
  });
}

// POST /api/v1/auth/keys - Create a new API key
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const name = body.name?.trim();

      if (!name || name.length < 1 || name.length > 50) {
        return apiError(
          "VALIDATION_ERROR",
          "Name is required and must be between 1 and 50 characters",
          400,
          { field: "name" }
        );
      }

      const { key, keyData } = await createApiKey(auth.userId, name);

      return apiSuccess(
        {
          id: keyData.id,
          name: keyData.name,
          key, // Full key, shown only once!
          prefix: keyData.keyPrefix,
          createdAt: keyData.createdAt.toDate().toISOString(),
        },
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("Maximum")) {
        return apiError("LIMIT_EXCEEDED", error.message, 400);
      }
      console.error("Failed to create API key:", error);
      return apiError("INTERNAL_ERROR", "Failed to create API key", 500);
    }
  });
}
