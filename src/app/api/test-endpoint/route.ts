import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Test endpoint that can be toggled up/down for testing HTTP monitors
// Status is stored in Firestore so it persists across deploys

const STATUS_DOC = "testEndpointStatus";

interface TestStatus {
  isUp: boolean;
  updatedAt: string;
}

// GET /api/test-endpoint - Returns 200 if up, 503 if down
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Check for toggle command
  const action = searchParams.get("action");
  const secret = searchParams.get("secret");

  if (action && secret === process.env.CRON_SECRET) {
    if (action === "down") {
      await setDoc(doc(db, "settings", STATUS_DOC), {
        isUp: false,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ status: "down", message: "Endpoint is now DOWN" });
    }
    if (action === "up") {
      await setDoc(doc(db, "settings", STATUS_DOC), {
        isUp: true,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ status: "up", message: "Endpoint is now UP" });
    }
    if (action === "status") {
      const statusDoc = await getDoc(doc(db, "settings", STATUS_DOC));
      const status = statusDoc.exists() ? (statusDoc.data() as TestStatus) : { isUp: true };
      return NextResponse.json({ status: status.isUp ? "up" : "down", ...status });
    }
  }

  // Normal health check
  try {
    const statusDoc = await getDoc(doc(db, "settings", STATUS_DOC));
    const status = statusDoc.exists() ? (statusDoc.data() as TestStatus) : { isUp: true };

    if (!status.isUp) {
      return NextResponse.json(
        { status: "error", message: "Service unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Service is healthy",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 }
    );
  }
}
