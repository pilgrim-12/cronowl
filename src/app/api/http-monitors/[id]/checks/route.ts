import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getHttpMonitor, getHttpMonitorChecks } from "@/lib/http-monitors";

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

// GET /api/http-monitors/[id]/checks - Get check history
export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);

  try {
    const monitor = await getHttpMonitor(id);

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    if (monitor.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse pagination params
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const checks = await getHttpMonitorChecks(id, limit);

    return NextResponse.json({
      checks,
      hasMore: checks.length === limit,
    });
  } catch (error) {
    console.error("Failed to get HTTP monitor checks:", error);
    return NextResponse.json({ error: "Failed to get checks" }, { status: 500 });
  }
}
