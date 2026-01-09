import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
  rateLimitHeaders,
} from "@/lib/api-auth";
import {
  getUserChecks,
  updateCheck,
  deleteCheck,
  isValidCronExpression,
  ScheduleType,
} from "@/lib/checks";
import { SCHEDULE_OPTIONS } from "@/lib/constants";

// Serialize a check for API response
function serializeCheck(check: Record<string, unknown>) {
  return {
    id: check.id,
    name: check.name,
    slug: check.slug,
    schedule: check.schedule,
    scheduleType: check.scheduleType,
    cronExpression: check.cronExpression || null,
    timezone: check.timezone,
    gracePeriod: check.gracePeriod,
    status: check.status,
    paused: check.paused || false,
    lastPing: check.lastPing
      ? (check.lastPing as { toDate: () => Date }).toDate().toISOString()
      : null,
    lastDuration: check.lastDuration || null,
    webhookUrl: check.webhookUrl || null,
    tags: check.tags || [],
    maxDuration: check.maxDuration || null,
    createdAt: check.createdAt
      ? (check.createdAt as { toDate: () => Date }).toDate().toISOString()
      : null,
  };
}

// GET /api/v1/checks/:id - Get a single check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      const checks = await getUserChecks(auth.userId);
      const check = checks.find((c) => c.id === id);

      if (!check) {
        return apiError("NOT_FOUND", "Check not found", 404);
      }

      return apiSuccess(
        serializeCheck(check as unknown as Record<string, unknown>),
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to get check:", error);
      return apiError("INTERNAL_ERROR", "Failed to get check", 500);
    }
  });
}

// PATCH /api/v1/checks/:id - Update a check
export async function PATCH(
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

      const body = await req.json().catch(() => ({}));
      const updates: Record<string, unknown> = {};

      // Update name
      if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.trim().length < 1) {
          return apiError("VALIDATION_ERROR", "Name must be a non-empty string", 400, {
            field: "name",
          });
        }
        updates.name = body.name.trim();
      }

      // Update schedule
      if (body.cronExpression !== undefined) {
        if (body.cronExpression === null) {
          // Clear cron expression, revert to preset
          updates.scheduleType = "preset" as ScheduleType;
          updates.cronExpression = null;
          updates.schedule = body.schedule || "every hour";
        } else {
          if (!isValidCronExpression(body.cronExpression)) {
            return apiError("VALIDATION_ERROR", "Invalid cron expression", 400, {
              field: "cronExpression",
            });
          }
          updates.scheduleType = "cron" as ScheduleType;
          updates.cronExpression = body.cronExpression;
          updates.schedule = "cron";
        }
      } else if (body.schedule !== undefined) {
        const validSchedules = SCHEDULE_OPTIONS.map((s) => s.value);
        if (!validSchedules.includes(body.schedule)) {
          return apiError("VALIDATION_ERROR", "Invalid schedule preset", 400, {
            field: "schedule",
            validOptions: validSchedules,
          });
        }
        updates.schedule = body.schedule;
        updates.scheduleType = "preset" as ScheduleType;
        updates.cronExpression = null;
      }

      // Update timezone
      if (body.timezone !== undefined) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
          updates.timezone = body.timezone;
        } catch {
          return apiError("VALIDATION_ERROR", "Invalid timezone", 400, { field: "timezone" });
        }
      }

      // Update grace period
      if (body.gracePeriod !== undefined) {
        const gracePeriod = parseInt(body.gracePeriod, 10);
        if (isNaN(gracePeriod) || gracePeriod < 0 || gracePeriod > 60) {
          return apiError("VALIDATION_ERROR", "Grace period must be between 0 and 60", 400, {
            field: "gracePeriod",
          });
        }
        updates.gracePeriod = gracePeriod;
      }

      // Update tags
      if (body.tags !== undefined) {
        if (body.tags === null) {
          updates.tags = [];
        } else if (!Array.isArray(body.tags)) {
          return apiError("VALIDATION_ERROR", "Tags must be an array", 400, { field: "tags" });
        } else {
          updates.tags = body.tags
            .filter((t: unknown) => typeof t === "string")
            .map((t: string) => t.trim().toLowerCase())
            .slice(0, 10);
        }
      }

      // Update webhook URL
      if (body.webhookUrl !== undefined) {
        if (body.webhookUrl === null || body.webhookUrl === "") {
          updates.webhookUrl = null;
        } else {
          try {
            new URL(body.webhookUrl);
            updates.webhookUrl = body.webhookUrl;
          } catch {
            return apiError("VALIDATION_ERROR", "Invalid webhook URL", 400, {
              field: "webhookUrl",
            });
          }
        }
      }

      // Update maxDuration
      if (body.maxDuration !== undefined) {
        if (body.maxDuration === null) {
          updates.maxDuration = null;
        } else {
          const maxDuration = parseInt(body.maxDuration, 10);
          if (isNaN(maxDuration) || maxDuration < 1) {
            return apiError("VALIDATION_ERROR", "maxDuration must be a positive number", 400, {
              field: "maxDuration",
            });
          }
          updates.maxDuration = maxDuration;
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await updateCheck(id, updates);
      }

      // Fetch and return updated check
      const updatedChecks = await getUserChecks(auth.userId);
      const updatedCheck = updatedChecks.find((c) => c.id === id);

      return apiSuccess(
        serializeCheck(updatedCheck as unknown as Record<string, unknown>),
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to update check:", error);
      return apiError("INTERNAL_ERROR", "Failed to update check", 500);
    }
  });
}

// DELETE /api/v1/checks/:id - Delete a check
export async function DELETE(
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

      await deleteCheck(id);

      return apiSuccess(
        { deleted: true },
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to delete check:", error);
      return apiError("INTERNAL_ERROR", "Failed to delete check", 500);
    }
  });
}
