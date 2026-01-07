import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getHttpMonitor, pauseHttpMonitor } from "@/lib/http-monitors";

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

// POST /api/http-monitors/[id]/pause - Pause monitoring
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

    if (!monitor.isEnabled) {
      return NextResponse.json({ error: "Monitor is already paused" }, { status: 400 });
    }

    await pauseHttpMonitor(id);

    return NextResponse.json({ success: true, isEnabled: false });
  } catch (error) {
    console.error("Failed to pause HTTP monitor:", error);
    return NextResponse.json({ error: "Failed to pause monitor" }, { status: 500 });
  }
}
