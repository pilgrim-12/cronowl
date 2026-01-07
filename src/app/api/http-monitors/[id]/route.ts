import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  getHttpMonitor,
  updateHttpMonitor,
  deleteHttpMonitor,
  getMinIntervalForPlan,
  HttpMonitor,
} from "@/lib/http-monitors";
import { getUserPlan } from "@/lib/checks";
import { PLANS } from "@/lib/plans";
import { validateMonitorUrl, maskSensitiveHeaders } from "@/lib/http-monitor-checker";
import { encryptHeaders, encryptBody, decryptHeaders, decryptBody } from "@/lib/encryption";

// Helper to verify Firebase ID token
async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

// Serialize HTTP monitor for response (with optional decrypted headers)
async function serializeMonitor(monitor: HttpMonitor, includeDetails: boolean = false) {
  const base = {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    method: monitor.method,
    expectedStatusCodes: monitor.expectedStatusCodes,
    timeoutMs: monitor.timeoutMs,
    intervalSeconds: monitor.intervalSeconds,
    contentType: monitor.contentType || null,
    assertions: monitor.assertions || null,
    status: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt?.toDate().toISOString() || null,
    lastResponseTimeMs: monitor.lastResponseTimeMs || null,
    lastStatusCode: monitor.lastStatusCode || null,
    lastError: monitor.lastError || null,
    lastResponseBody: monitor.lastResponseBody || null,
    alertAfterFailures: monitor.alertAfterFailures,
    consecutiveFailures: monitor.consecutiveFailures,
    uptimePercent24h: monitor.uptimePercent24h || null,
    avgResponseTime24h: monitor.avgResponseTime24h || null,
    isEnabled: monitor.isEnabled,
    webhookUrl: monitor.webhookUrl || null,
    tags: monitor.tags || [],
    createdAt: monitor.createdAt?.toDate().toISOString() || null,
    updatedAt: monitor.updatedAt?.toDate().toISOString() || null,
  };

  if (includeDetails) {
    // Decrypt and mask headers for display
    let headers = null;
    if (monitor.headers) {
      const decrypted = await decryptHeaders(monitor.headers);
      headers = maskSensitiveHeaders(decrypted);
    }

    // Decrypt body (but don't show full content, just indicate it exists)
    let hasBody = false;
    if (monitor.body) {
      hasBody = true;
    }

    return {
      ...base,
      headers,
      hasBody,
    };
  }

  return {
    ...base,
    hasHeaders: !!monitor.headers && Object.keys(monitor.headers).length > 0,
    hasBody: !!monitor.body,
  };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/http-monitors/[id] - Get a single HTTP monitor
export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const monitor = await getHttpMonitor(id);

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    if (monitor.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Include detailed info for single monitor view
    const serialized = await serializeMonitor(monitor, true);
    return NextResponse.json({ monitor: serialized });
  } catch (error) {
    console.error("Failed to get HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to get monitor" }, { status: 500 });
  }
}

// PATCH /api/http-monitors/[id] - Update an HTTP monitor
export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const monitor = await getHttpMonitor(id);

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    if (monitor.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Name
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 1) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    // URL
    if (body.url !== undefined) {
      const urlValidation = validateMonitorUrl(body.url);
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error }, { status: 400 });
      }
      updates.url = body.url;
    }

    // Method
    if (body.method !== undefined) {
      const validMethods = ["GET", "HEAD", "POST", "PUT"];
      const method = body.method.toUpperCase();
      if (!validMethods.includes(method)) {
        return NextResponse.json({ error: "Invalid method" }, { status: 400 });
      }
      updates.method = method;
    }

    // Interval
    if (body.intervalSeconds !== undefined) {
      const plan = await getUserPlan(userId);
      const minInterval = getMinIntervalForPlan(plan);
      const interval = parseInt(body.intervalSeconds, 10);
      if (interval < minInterval) {
        return NextResponse.json({
          error: `Minimum interval for ${PLANS[plan].name} plan is ${minInterval} seconds`,
        }, { status: 400 });
      }
      updates.intervalSeconds = interval;
    }

    // Expected status codes
    if (body.expectedStatusCodes !== undefined) {
      if (!Array.isArray(body.expectedStatusCodes)) {
        return NextResponse.json({ error: "expectedStatusCodes must be an array" }, { status: 400 });
      }
      const codes = body.expectedStatusCodes.filter(
        (c: unknown) => typeof c === "number" && c >= 100 && c < 600
      );
      if (codes.length === 0) {
        return NextResponse.json({ error: "At least one valid status code is required" }, { status: 400 });
      }
      updates.expectedStatusCodes = codes;
    }

    // Timeout
    if (body.timeoutMs !== undefined) {
      updates.timeoutMs = Math.min(30000, Math.max(1000, parseInt(body.timeoutMs, 10)));
    }

    // Headers
    if (body.headers !== undefined) {
      if (body.headers === null) {
        updates.headers = null;
      } else if (typeof body.headers === "object") {
        updates.headers = await encryptHeaders(body.headers);
      }
    }

    // Body
    if (body.body !== undefined) {
      if (body.body === null) {
        updates.body = null;
      } else {
        updates.body = await encryptBody(body.body);
      }
    }

    // Content type
    if (body.contentType !== undefined) {
      const validContentTypes = ["application/json", "application/x-www-form-urlencoded", "text/plain"];
      if (body.contentType && !validContentTypes.includes(body.contentType)) {
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
      }
      updates.contentType = body.contentType || null;
    }

    // Assertions
    if (body.assertions !== undefined) {
      if (body.assertions === null) {
        updates.assertions = null;
      } else {
        updates.assertions = {
          maxResponseTimeMs: body.assertions.maxResponseTimeMs
            ? Math.max(0, parseInt(body.assertions.maxResponseTimeMs, 10))
            : undefined,
          bodyContains: body.assertions.bodyContains || undefined,
          bodyNotContains: body.assertions.bodyNotContains || undefined,
        };
      }
    }

    // Alert after failures
    if (body.alertAfterFailures !== undefined) {
      updates.alertAfterFailures = Math.max(1, Math.min(10, parseInt(body.alertAfterFailures, 10)));
    }

    // Webhook URL
    if (body.webhookUrl !== undefined) {
      updates.webhookUrl = body.webhookUrl || null;
    }

    // Tags
    if (body.tags !== undefined) {
      if (body.tags === null) {
        updates.tags = [];
      } else if (Array.isArray(body.tags)) {
        updates.tags = body.tags
          .filter((t: unknown) => typeof t === "string")
          .map((t: string) => t.trim().toLowerCase())
          .slice(0, 10);
      }
    }

    // Is enabled
    if (body.isEnabled !== undefined) {
      updates.isEnabled = !!body.isEnabled;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await updateHttpMonitor(id, updates);

    // Fetch updated monitor
    const updatedMonitor = await getHttpMonitor(id);
    if (!updatedMonitor) {
      return NextResponse.json({ error: "Monitor updated but could not be retrieved" }, { status: 500 });
    }

    const serialized = await serializeMonitor(updatedMonitor, true);
    return NextResponse.json({ monitor: serialized });
  } catch (error) {
    console.error("Failed to update HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 });
  }
}

// DELETE /api/http-monitors/[id] - Delete an HTTP monitor
export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const monitor = await getHttpMonitor(id);

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    if (monitor.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await deleteHttpMonitor(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 });
  }
}
