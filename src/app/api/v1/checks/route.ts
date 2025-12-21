import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
} from "@/lib/api-auth";
import {
  getUserChecks,
  createCheck,
  canCreateCheck,
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

// GET /api/v1/checks - List all checks
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status"); // up, down, new
      const tag = searchParams.get("tag");
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

      let checks = await getUserChecks(auth.userId);

      // Filter by status
      if (status && ["up", "down", "new"].includes(status)) {
        checks = checks.filter((c) => c.status === status);
      }

      // Filter by tag
      if (tag) {
        checks = checks.filter((c) => c.tags?.includes(tag));
      }

      // Pagination
      const total = checks.length;
      const start = (page - 1) * limit;
      const paginatedChecks = checks.slice(start, start + limit);

      return apiSuccess(
        paginatedChecks.map((c) => serializeCheck(c as unknown as Record<string, unknown>)),
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      );
    } catch (error) {
      console.error("Failed to list checks:", error);
      return apiError("INTERNAL_ERROR", "Failed to list checks", 500);
    }
  });
}

// POST /api/v1/checks - Create a new check
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));

      // Validate required fields
      if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
        return apiError("VALIDATION_ERROR", "Name is required", 400, { field: "name" });
      }

      // Check plan limits
      const limitCheck = await canCreateCheck(auth.userId);
      if (!limitCheck.allowed) {
        return apiError("LIMIT_EXCEEDED", limitCheck.reason || "Check limit reached", 400, {
          current: limitCheck.current,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        });
      }

      // Determine schedule type
      let scheduleType: ScheduleType = "preset";
      let schedule = body.schedule || "every hour";
      let cronExpression: string | undefined;

      if (body.cronExpression) {
        // Using cron expression
        if (!isValidCronExpression(body.cronExpression)) {
          return apiError("VALIDATION_ERROR", "Invalid cron expression", 400, {
            field: "cronExpression",
          });
        }
        scheduleType = "cron";
        cronExpression = body.cronExpression;
        schedule = "cron"; // placeholder for preset field
      } else if (body.schedule) {
        // Using preset
        const validSchedules = SCHEDULE_OPTIONS.map((s) => s.value);
        if (!validSchedules.includes(body.schedule)) {
          return apiError("VALIDATION_ERROR", "Invalid schedule preset", 400, {
            field: "schedule",
            validOptions: validSchedules,
          });
        }
        schedule = body.schedule;
      }

      // Validate timezone
      const timezone = body.timezone || "UTC";
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        return apiError("VALIDATION_ERROR", "Invalid timezone", 400, { field: "timezone" });
      }

      // Validate grace period
      const gracePeriod = Math.max(0, Math.min(60, parseInt(body.gracePeriod || "5", 10)));

      // Validate tags
      let tags: string[] | undefined;
      if (body.tags) {
        if (!Array.isArray(body.tags)) {
          return apiError("VALIDATION_ERROR", "Tags must be an array", 400, { field: "tags" });
        }
        tags = body.tags
          .filter((t: unknown) => typeof t === "string")
          .map((t: string) => t.trim().toLowerCase())
          .slice(0, 10); // Max 10 tags
      }

      // Validate webhook URL
      let webhookUrl: string | undefined;
      if (body.webhookUrl) {
        try {
          new URL(body.webhookUrl);
          webhookUrl = body.webhookUrl;
        } catch {
          return apiError("VALIDATION_ERROR", "Invalid webhook URL", 400, { field: "webhookUrl" });
        }
      }

      // Validate maxDuration
      let maxDuration: number | undefined;
      if (body.maxDuration) {
        maxDuration = parseInt(body.maxDuration, 10);
        if (isNaN(maxDuration) || maxDuration < 1) {
          return apiError("VALIDATION_ERROR", "maxDuration must be a positive number", 400, {
            field: "maxDuration",
          });
        }
      }

      // Create the check
      const checkId = await createCheck(auth.userId, {
        name: body.name.trim(),
        schedule,
        scheduleType,
        cronExpression,
        timezone,
        gracePeriod,
        tags,
        webhookUrl,
        maxDuration,
      });

      // Fetch the created check to return it
      const checks = await getUserChecks(auth.userId);
      const createdCheck = checks.find((c) => c.id === checkId);

      if (!createdCheck) {
        return apiError("INTERNAL_ERROR", "Check created but could not be retrieved", 500);
      }

      return apiSuccess(serializeCheck(createdCheck as unknown as Record<string, unknown>));
    } catch (error) {
      console.error("Failed to create check:", error);
      return apiError("INTERNAL_ERROR", "Failed to create check", 500);
    }
  });
}
