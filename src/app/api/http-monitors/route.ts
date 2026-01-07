import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  getUserHttpMonitors,
  createHttpMonitor,
  canCreateHttpMonitor,
  getMinIntervalForPlan,
  HttpMonitor,
} from "@/lib/http-monitors";
import { getUserPlan } from "@/lib/checks";
import { PLANS } from "@/lib/plans";
import { validateMonitorUrl } from "@/lib/http-monitor-checker";
import { encryptHeaders, encryptBody } from "@/lib/encryption";

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

// Serialize HTTP monitor for response
function serializeMonitor(monitor: HttpMonitor) {
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    method: monitor.method,
    expectedStatusCodes: monitor.expectedStatusCodes,
    timeoutMs: monitor.timeoutMs,
    intervalSeconds: monitor.intervalSeconds,
    // Don't expose raw headers - they may be encrypted
    hasHeaders: !!monitor.headers && Object.keys(monitor.headers).length > 0,
    hasBody: !!monitor.body,
    contentType: monitor.contentType || null,
    assertions: monitor.assertions || null,
    status: monitor.status,
    lastCheckedAt: monitor.lastCheckedAt?.toDate().toISOString() || null,
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
    createdAt: monitor.createdAt?.toDate().toISOString() || null,
    updatedAt: monitor.updatedAt?.toDate().toISOString() || null,
  };
}

// GET /api/http-monitors - List all HTTP monitors
export async function GET(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");

    let monitors = await getUserHttpMonitors(userId);

    // Filter by status
    if (status && ["up", "down", "degraded", "pending"].includes(status)) {
      monitors = monitors.filter((m) => m.status === status);
    }

    // Filter by tag
    if (tag) {
      monitors = monitors.filter((m) => m.tags?.includes(tag));
    }

    // Get plan info
    const plan = await getUserPlan(userId);
    const planLimits = PLANS[plan];

    return NextResponse.json({
      monitors: monitors.map(serializeMonitor),
      limits: {
        current: monitors.length,
        max: planLimits.httpMonitorsLimit,
        minInterval: planLimits.minHttpIntervalSeconds,
        plan,
      },
    });
  } catch (error) {
    console.error("Failed to list HTTP monitors:", error);
    return NextResponse.json({ error: "Failed to list monitors" }, { status: 500 });
  }
}

// POST /api/http-monitors - Create a new HTTP monitor
export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL (SSRF protection)
    const urlValidation = validateMonitorUrl(body.url);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    // Check plan limits
    const limitCheck = await canCreateHttpMonitor(userId);
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: limitCheck.reason,
        limits: {
          current: limitCheck.current,
          max: limitCheck.limit,
          plan: limitCheck.plan,
        },
      }, { status: 400 });
    }

    // Validate method
    const validMethods = ["GET", "HEAD", "POST", "PUT"];
    const method = body.method?.toUpperCase() || "GET";
    if (!validMethods.includes(method)) {
      return NextResponse.json({
        error: `Invalid method. Must be one of: ${validMethods.join(", ")}`,
      }, { status: 400 });
    }

    // Validate interval
    const plan = await getUserPlan(userId);
    const minInterval = getMinIntervalForPlan(plan);
    const interval = parseInt(body.intervalSeconds, 10) || 300;
    if (interval < minInterval) {
      return NextResponse.json({
        error: `Minimum interval for ${PLANS[plan].name} plan is ${minInterval} seconds`,
      }, { status: 400 });
    }

    // Validate expected status codes
    let expectedStatusCodes = [200, 201, 204];
    if (body.expectedStatusCodes) {
      if (!Array.isArray(body.expectedStatusCodes)) {
        return NextResponse.json({ error: "expectedStatusCodes must be an array" }, { status: 400 });
      }
      expectedStatusCodes = body.expectedStatusCodes.filter(
        (c: unknown) => typeof c === "number" && c >= 100 && c < 600
      );
      if (expectedStatusCodes.length === 0) {
        return NextResponse.json({ error: "At least one valid status code is required" }, { status: 400 });
      }
    }

    // Validate timeout
    const timeoutMs = Math.min(30000, Math.max(1000, parseInt(body.timeoutMs, 10) || 10000));

    // Validate content type for POST/PUT
    let contentType = body.contentType;
    if ((method === "POST" || method === "PUT") && body.body) {
      const validContentTypes = ["application/json", "application/x-www-form-urlencoded", "text/plain"];
      if (contentType && !validContentTypes.includes(contentType)) {
        return NextResponse.json({
          error: `Invalid content type. Must be one of: ${validContentTypes.join(", ")}`,
        }, { status: 400 });
      }
      contentType = contentType || "application/json";

      // Validate JSON body if content type is JSON
      if (contentType === "application/json" && body.body) {
        try {
          JSON.parse(body.body);
        } catch {
          return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
      }
    }

    // Validate assertions
    let assertions = undefined;
    if (body.assertions) {
      assertions = {
        maxResponseTimeMs: body.assertions.maxResponseTimeMs
          ? Math.max(0, parseInt(body.assertions.maxResponseTimeMs, 10))
          : undefined,
        bodyContains: body.assertions.bodyContains || undefined,
        bodyNotContains: body.assertions.bodyNotContains || undefined,
      };
    }

    // Encrypt sensitive data
    let headers = body.headers;
    if (headers && typeof headers === "object") {
      headers = await encryptHeaders(headers);
    }

    let requestBody = body.body;
    if (requestBody) {
      requestBody = await encryptBody(requestBody);
    }

    // Validate tags
    let tags: string[] | undefined;
    if (body.tags) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: "Tags must be an array" }, { status: 400 });
      }
      tags = body.tags
        .filter((t: unknown) => typeof t === "string")
        .map((t: string) => t.trim().toLowerCase())
        .slice(0, 10);
    }

    // Create the monitor
    const monitorId = await createHttpMonitor(userId, {
      name: body.name.trim(),
      url: body.url,
      method,
      expectedStatusCodes,
      timeoutMs,
      intervalSeconds: interval,
      headers,
      body: requestBody,
      contentType,
      assertions,
      alertAfterFailures: Math.max(1, Math.min(10, parseInt(body.alertAfterFailures, 10) || 2)),
      webhookUrl: body.webhookUrl || undefined,
      tags,
    });

    // Fetch and return the created monitor
    const monitors = await getUserHttpMonitors(userId);
    const createdMonitor = monitors.find((m) => m.id === monitorId);

    if (!createdMonitor) {
      return NextResponse.json({ error: "Monitor created but could not be retrieved" }, { status: 500 });
    }

    return NextResponse.json({ monitor: serializeMonitor(createdMonitor) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}
