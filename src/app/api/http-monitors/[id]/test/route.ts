import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getHttpMonitor } from "@/lib/http-monitors";
import { executeHttpCheck, getHttpStatusText } from "@/lib/http-monitor-checker";
import { decryptHeaders, decryptBody } from "@/lib/encryption";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/http-monitors/[id]/test - Run a manual test (no history recorded)
export async function POST(request: NextRequest, context: RouteContext) {
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

    // Decrypt headers and body for the test
    let decryptedHeaders = monitor.headers;
    if (decryptedHeaders) {
      decryptedHeaders = await decryptHeaders(decryptedHeaders);
    }

    let decryptedBody = monitor.body;
    if (decryptedBody) {
      decryptedBody = await decryptBody(decryptedBody);
    }

    // Create a monitor copy with decrypted values for testing
    const testMonitor = {
      ...monitor,
      headers: decryptedHeaders,
      body: decryptedBody,
    };

    // Execute the check
    const result = await executeHttpCheck(testMonitor);

    return NextResponse.json({
      result: {
        status: result.status,
        statusCode: result.statusCode || null,
        statusText: result.statusCode ? getHttpStatusText(result.statusCode) : null,
        responseTimeMs: result.responseTimeMs,
        error: result.error || null,
        responseBody: result.responseBody || null,
        assertions: result.assertions || null,
      },
    });
  } catch (error) {
    console.error("Failed to test HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to run test" }, { status: 500 });
  }
}
