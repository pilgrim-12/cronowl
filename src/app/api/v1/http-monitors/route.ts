import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
} from "@/lib/api-auth";
import {
  getUserHttpMonitors,
  createHttpMonitor,
  canCreateHttpMonitor,
  HttpMonitor,
  HttpMethod,
  ContentType,
} from "@/lib/http-monitors";
import { validateMonitorUrl } from "@/lib/http-monitor-checker";
import { maskSensitiveHeaders } from "@/lib/http-monitor-checker";

// Serialize a monitor for API response
function serializeMonitor(monitor: HttpMonitor) {
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    method: monitor.method,
    expectedStatusCodes: monitor.expectedStatusCodes,
    timeoutMs: monitor.timeoutMs,
    intervalSeconds: monitor.intervalSeconds,
    headers: monitor.headers ? maskSensitiveHeaders(monitor.headers) : null,
    body: monitor.body ? "[REDACTED]" : null,
    contentType: monitor.contentType || null,
    assertions: monitor.assertions || null,
    status: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt
      ? monitor.lastCheckedAt.toDate().toISOString()
      : null,
    lastResponseTimeMs: monitor.lastResponseTimeMs || null,
    lastStatusCode: monitor.lastStatusCode || null,
    lastError: monitor.lastError || null,
    alertAfterFailures: monitor.alertAfterFailures,
    consecutiveFailures: monitor.consecutiveFailures,
    uptimePercent24h: monitor.uptimePercent24h || null,
    avgResponseTime24h: monitor.avgResponseTime24h || null,
    isEnabled: monitor.isEnabled,
    webhookUrl: monitor.webhookUrl || null,
    tags: monitor.tags || [],
    createdAt: monitor.createdAt
      ? monitor.createdAt.toDate().toISOString()
      : null,
    updatedAt: monitor.updatedAt
      ? monitor.updatedAt.toDate().toISOString()
      : null,
  };
}

// GET /api/v1/http-monitors - List all HTTP monitors
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status"); // up, down, degraded, pending
      const tag = searchParams.get("tag");
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

      let monitors = await getUserHttpMonitors(auth.userId);

      // Filter by status
      if (status && ["up", "down", "degraded", "pending"].includes(status)) {
        monitors = monitors.filter((m) => m.status === status);
      }

      // Filter by tag
      if (tag) {
        monitors = monitors.filter((m) => m.tags?.includes(tag));
      }

      // Pagination
      const total = monitors.length;
      const start = (page - 1) * limit;
      const paginatedMonitors = monitors.slice(start, start + limit);

      return apiSuccess(
        paginatedMonitors.map((m) => serializeMonitor(m)),
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      );
    } catch (error) {
      console.error("Failed to list HTTP monitors:", error);
      return apiError("INTERNAL_ERROR", "Failed to list HTTP monitors", 500);
    }
  });
}

// POST /api/v1/http-monitors - Create a new HTTP monitor
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));

      // Validate required fields
      if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
        return apiError("VALIDATION_ERROR", "Name is required", 400, { field: "name" });
      }

      if (!body.url || typeof body.url !== "string") {
        return apiError("VALIDATION_ERROR", "URL is required", 400, { field: "url" });
      }

      // Validate URL
      const urlValidation = validateMonitorUrl(body.url);
      if (!urlValidation.valid) {
        return apiError("VALIDATION_ERROR", urlValidation.error || "Invalid URL", 400, { field: "url" });
      }

      // Check plan limits
      const limitCheck = await canCreateHttpMonitor(auth.userId);
      if (!limitCheck.allowed) {
        return apiError("LIMIT_EXCEEDED", limitCheck.reason || "HTTP monitor limit reached", 400, {
          current: limitCheck.current,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
        });
      }

      // Validate method
      const validMethods: HttpMethod[] = ["GET", "HEAD", "POST", "PUT"];
      const method: HttpMethod = body.method || "GET";
      if (!validMethods.includes(method)) {
        return apiError("VALIDATION_ERROR", "Invalid HTTP method", 400, {
          field: "method",
          validOptions: validMethods,
        });
      }

      // Validate expected status codes
      let expectedStatusCodes = [200, 201, 204];
      if (body.expectedStatusCodes) {
        if (!Array.isArray(body.expectedStatusCodes)) {
          return apiError("VALIDATION_ERROR", "expectedStatusCodes must be an array", 400, {
            field: "expectedStatusCodes",
          });
        }
        expectedStatusCodes = body.expectedStatusCodes
          .filter((c: unknown) => typeof c === "number" && c >= 100 && c < 600);
        if (expectedStatusCodes.length === 0) {
          return apiError("VALIDATION_ERROR", "At least one valid status code is required", 400, {
            field: "expectedStatusCodes",
          });
        }
      }

      // Validate timeout
      const timeoutMs = Math.max(1000, Math.min(30000, parseInt(body.timeoutMs || "10000", 10)));

      // Validate interval (respect plan limits)
      const minInterval = auth.planLimits.minHttpIntervalSeconds;
      const intervalSeconds = Math.max(minInterval, parseInt(body.intervalSeconds || "300", 10));

      // Validate headers
      let headers: Record<string, string> | undefined;
      if (body.headers) {
        if (typeof body.headers !== "object" || Array.isArray(body.headers)) {
          return apiError("VALIDATION_ERROR", "Headers must be an object", 400, { field: "headers" });
        }
        headers = {};
        for (const [key, value] of Object.entries(body.headers)) {
          if (typeof value === "string") {
            headers[key] = value;
          }
        }
      }

      // Validate content type
      const validContentTypes: ContentType[] = ["application/json", "application/x-www-form-urlencoded", "text/plain"];
      let contentType: ContentType | undefined;
      if (body.contentType) {
        if (!validContentTypes.includes(body.contentType)) {
          return apiError("VALIDATION_ERROR", "Invalid content type", 400, {
            field: "contentType",
            validOptions: validContentTypes,
          });
        }
        contentType = body.contentType;
      }

      // Validate body (for POST/PUT)
      let requestBody: string | undefined;
      if (body.body) {
        if (typeof body.body !== "string") {
          return apiError("VALIDATION_ERROR", "Body must be a string", 400, { field: "body" });
        }
        requestBody = body.body;
      }

      // Validate assertions
      let assertions: HttpMonitor["assertions"];
      if (body.assertions) {
        assertions = {};
        if (body.assertions.maxResponseTimeMs !== undefined) {
          const maxResponseTime = parseInt(body.assertions.maxResponseTimeMs, 10);
          if (!isNaN(maxResponseTime) && maxResponseTime > 0) {
            assertions.maxResponseTimeMs = maxResponseTime;
          }
        }
        if (body.assertions.bodyContains !== undefined && typeof body.assertions.bodyContains === "string") {
          assertions.bodyContains = body.assertions.bodyContains;
        }
        if (body.assertions.bodyNotContains !== undefined && typeof body.assertions.bodyNotContains === "string") {
          assertions.bodyNotContains = body.assertions.bodyNotContains;
        }
      }

      // Validate alert threshold
      const alertAfterFailures = Math.max(1, Math.min(10, parseInt(body.alertAfterFailures || "2", 10)));

      // Validate tags
      let tags: string[] | undefined;
      if (body.tags) {
        if (!Array.isArray(body.tags)) {
          return apiError("VALIDATION_ERROR", "Tags must be an array", 400, { field: "tags" });
        }
        tags = body.tags
          .filter((t: unknown) => typeof t === "string")
          .map((t: string) => t.trim().toLowerCase())
          .slice(0, 10);
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

      // Create the monitor
      const monitorId = await createHttpMonitor(auth.userId, {
        name: body.name.trim(),
        url: body.url,
        method,
        expectedStatusCodes,
        timeoutMs,
        intervalSeconds,
        headers,
        body: requestBody,
        contentType,
        assertions,
        alertAfterFailures,
        tags,
        webhookUrl,
      });

      // Fetch the created monitor to return it
      const monitors = await getUserHttpMonitors(auth.userId);
      const createdMonitor = monitors.find((m) => m.id === monitorId);

      if (!createdMonitor) {
        return apiError("INTERNAL_ERROR", "Monitor created but could not be retrieved", 500);
      }

      return apiSuccess(serializeMonitor(createdMonitor));
    } catch (error) {
      console.error("Failed to create HTTP monitor:", error);
      return apiError("INTERNAL_ERROR", "Failed to create HTTP monitor", 500);
    }
  });
}
