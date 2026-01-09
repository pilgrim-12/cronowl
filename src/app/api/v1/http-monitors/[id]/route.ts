import { NextRequest } from "next/server";
import {
  withApiAuth,
  apiSuccess,
  apiError,
  ApiAuthContext,
  rateLimitHeaders,
} from "@/lib/api-auth";
import {
  getHttpMonitor,
  updateHttpMonitor,
  deleteHttpMonitor,
  HttpMonitor,
  HttpMethod,
  ContentType,
} from "@/lib/http-monitors";
import { validateMonitorUrl, maskSensitiveHeaders } from "@/lib/http-monitor-checker";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

// GET /api/v1/http-monitors/[id] - Get a single HTTP monitor
export async function GET(request: NextRequest, context: RouteContext) {
  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      const { id } = await context.params;
      const monitor = await getHttpMonitor(id);

      if (!monitor) {
        return apiError("NOT_FOUND", "HTTP monitor not found", 404);
      }

      if (monitor.userId !== auth.userId) {
        return apiError("FORBIDDEN", "Access denied", 403);
      }

      return apiSuccess(
        serializeMonitor(monitor),
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to get HTTP monitor:", error);
      return apiError("INTERNAL_ERROR", "Failed to get HTTP monitor", 500);
    }
  });
}

// PATCH /api/v1/http-monitors/[id] - Update an HTTP monitor
export async function PATCH(request: NextRequest, context: RouteContext) {
  return withApiAuth(request, async (req: NextRequest, auth: ApiAuthContext) => {
    try {
      const { id } = await context.params;
      const monitor = await getHttpMonitor(id);

      if (!monitor) {
        return apiError("NOT_FOUND", "HTTP monitor not found", 404);
      }

      if (monitor.userId !== auth.userId) {
        return apiError("FORBIDDEN", "Access denied", 403);
      }

      const body = await req.json().catch(() => ({}));
      const updates: Partial<HttpMonitor> = {};

      // Validate and update name
      if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.trim().length < 1) {
          return apiError("VALIDATION_ERROR", "Name must be a non-empty string", 400, { field: "name" });
        }
        updates.name = body.name.trim();
      }

      // Validate and update URL
      if (body.url !== undefined) {
        const urlValidation = validateMonitorUrl(body.url);
        if (!urlValidation.valid) {
          return apiError("VALIDATION_ERROR", urlValidation.error || "Invalid URL", 400, { field: "url" });
        }
        updates.url = body.url;
      }

      // Validate and update method
      if (body.method !== undefined) {
        const validMethods: HttpMethod[] = ["GET", "HEAD", "POST", "PUT"];
        if (!validMethods.includes(body.method)) {
          return apiError("VALIDATION_ERROR", "Invalid HTTP method", 400, {
            field: "method",
            validOptions: validMethods,
          });
        }
        updates.method = body.method;
      }

      // Validate and update expected status codes
      if (body.expectedStatusCodes !== undefined) {
        if (!Array.isArray(body.expectedStatusCodes)) {
          return apiError("VALIDATION_ERROR", "expectedStatusCodes must be an array", 400, {
            field: "expectedStatusCodes",
          });
        }
        const codes = body.expectedStatusCodes
          .filter((c: unknown) => typeof c === "number" && c >= 100 && c < 600);
        if (codes.length === 0) {
          return apiError("VALIDATION_ERROR", "At least one valid status code is required", 400, {
            field: "expectedStatusCodes",
          });
        }
        updates.expectedStatusCodes = codes;
      }

      // Validate and update timeout
      if (body.timeoutMs !== undefined) {
        updates.timeoutMs = Math.max(1000, Math.min(30000, parseInt(body.timeoutMs, 10)));
      }

      // Validate and update interval
      if (body.intervalSeconds !== undefined) {
        const minInterval = auth.planLimits.minHttpIntervalSeconds;
        updates.intervalSeconds = Math.max(minInterval, parseInt(body.intervalSeconds, 10));
      }

      // Validate and update headers
      if (body.headers !== undefined) {
        if (body.headers === null) {
          updates.headers = undefined;
        } else if (typeof body.headers === "object" && !Array.isArray(body.headers)) {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(body.headers)) {
            if (typeof value === "string") {
              headers[key] = value;
            }
          }
          updates.headers = headers;
        } else {
          return apiError("VALIDATION_ERROR", "Headers must be an object or null", 400, { field: "headers" });
        }
      }

      // Validate and update content type
      if (body.contentType !== undefined) {
        if (body.contentType === null) {
          updates.contentType = undefined;
        } else {
          const validContentTypes: ContentType[] = ["application/json", "application/x-www-form-urlencoded", "text/plain"];
          if (!validContentTypes.includes(body.contentType)) {
            return apiError("VALIDATION_ERROR", "Invalid content type", 400, {
              field: "contentType",
              validOptions: validContentTypes,
            });
          }
          updates.contentType = body.contentType;
        }
      }

      // Validate and update body
      if (body.body !== undefined) {
        if (body.body === null) {
          updates.body = undefined;
        } else if (typeof body.body === "string") {
          updates.body = body.body;
        } else {
          return apiError("VALIDATION_ERROR", "Body must be a string or null", 400, { field: "body" });
        }
      }

      // Validate and update assertions
      if (body.assertions !== undefined) {
        if (body.assertions === null) {
          updates.assertions = undefined;
        } else {
          updates.assertions = {};
          if (body.assertions.maxResponseTimeMs !== undefined) {
            const maxResponseTime = parseInt(body.assertions.maxResponseTimeMs, 10);
            if (!isNaN(maxResponseTime) && maxResponseTime > 0) {
              updates.assertions.maxResponseTimeMs = maxResponseTime;
            }
          }
          if (body.assertions.bodyContains !== undefined) {
            if (body.assertions.bodyContains === null) {
              updates.assertions.bodyContains = undefined;
            } else if (typeof body.assertions.bodyContains === "string") {
              updates.assertions.bodyContains = body.assertions.bodyContains;
            }
          }
          if (body.assertions.bodyNotContains !== undefined) {
            if (body.assertions.bodyNotContains === null) {
              updates.assertions.bodyNotContains = undefined;
            } else if (typeof body.assertions.bodyNotContains === "string") {
              updates.assertions.bodyNotContains = body.assertions.bodyNotContains;
            }
          }
        }
      }

      // Validate and update alert threshold
      if (body.alertAfterFailures !== undefined) {
        updates.alertAfterFailures = Math.max(1, Math.min(10, parseInt(body.alertAfterFailures, 10)));
      }

      // Validate and update isEnabled
      if (body.isEnabled !== undefined) {
        updates.isEnabled = body.isEnabled === true;
      }

      // Validate and update tags
      if (body.tags !== undefined) {
        if (body.tags === null) {
          updates.tags = undefined;
        } else if (Array.isArray(body.tags)) {
          updates.tags = body.tags
            .filter((t: unknown) => typeof t === "string")
            .map((t: string) => t.trim().toLowerCase())
            .slice(0, 10);
        } else {
          return apiError("VALIDATION_ERROR", "Tags must be an array or null", 400, { field: "tags" });
        }
      }

      // Validate and update webhook URL
      if (body.webhookUrl !== undefined) {
        if (body.webhookUrl === null) {
          updates.webhookUrl = undefined;
        } else {
          try {
            new URL(body.webhookUrl);
            updates.webhookUrl = body.webhookUrl;
          } catch {
            return apiError("VALIDATION_ERROR", "Invalid webhook URL", 400, { field: "webhookUrl" });
          }
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await updateHttpMonitor(id, updates);
      }

      // Fetch updated monitor
      const updatedMonitor = await getHttpMonitor(id);
      if (!updatedMonitor) {
        return apiError("INTERNAL_ERROR", "Monitor updated but could not be retrieved", 500);
      }

      return apiSuccess(
        serializeMonitor(updatedMonitor),
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to update HTTP monitor:", error);
      return apiError("INTERNAL_ERROR", "Failed to update HTTP monitor", 500);
    }
  });
}

// DELETE /api/v1/http-monitors/[id] - Delete an HTTP monitor
export async function DELETE(request: NextRequest, context: RouteContext) {
  return withApiAuth(request, async (_req: NextRequest, auth: ApiAuthContext) => {
    try {
      const { id } = await context.params;
      const monitor = await getHttpMonitor(id);

      if (!monitor) {
        return apiError("NOT_FOUND", "HTTP monitor not found", 404);
      }

      if (monitor.userId !== auth.userId) {
        return apiError("FORBIDDEN", "Access denied", 403);
      }

      await deleteHttpMonitor(id);

      return apiSuccess(
        { deleted: true, id },
        undefined,
        rateLimitHeaders(auth.rateLimit.limit, auth.rateLimit.remaining, auth.rateLimit.resetTime)
      );
    } catch (error) {
      console.error("Failed to delete HTTP monitor:", error);
      return apiError("INTERNAL_ERROR", "Failed to delete HTTP monitor", 500);
    }
  });
}
