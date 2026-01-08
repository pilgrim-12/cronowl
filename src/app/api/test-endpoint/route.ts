import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

// Test endpoint that can be toggled up/down for testing HTTP monitors
// Status is stored in Firestore per URL so each monitor can be controlled independently

function urlToDocId(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 16);
}

interface TestStatus {
  isUp: boolean;
  updatedAt: string;
  url?: string;
}

// Helper to check status for a specific URL
async function getUrlStatus(url: string): Promise<boolean> {
  const docId = urlToDocId(url);
  const statusDoc = await getDoc(doc(db, "testEndpointStatuses", docId));
  if (statusDoc.exists()) {
    const status = statusDoc.data() as TestStatus;
    return status.isUp;
  }
  return true; // Default to up if no status set
}

// GET /api/test-endpoint - Returns 200 if up, 503 if down
export async function GET(request: NextRequest) {
  const fullUrl = request.url.split("?")[0]; // Remove query params for status check

  // Normal health check - check status for this specific URL
  try {
    const isUp = await getUrlStatus(fullUrl);

    if (!isUp) {
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

// POST /api/test-endpoint - Echoes back the request for testing POST monitors
export async function POST(request: NextRequest) {
  const fullUrl = request.url.split("?")[0]; // Remove query params for status check

  try {
    const isUp = await getUrlStatus(fullUrl);

    if (!isUp) {
      return NextResponse.json(
        { status: "error", message: "Service unavailable" },
        { status: 503 }
      );
    }

    // Parse the request body
    const contentType = request.headers.get("content-type") || "";
    let body: unknown = null;

    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = { parseError: "Invalid JSON" };
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else if (contentType.includes("text/plain")) {
      body = await request.text();
    }

    // Echo back the request details
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "POST received successfully",
      echo: {
        method: "POST",
        contentType,
        body,
        headers: {
          authorization: request.headers.get("authorization") ? "[PRESENT]" : null,
          "x-api-key": request.headers.get("x-api-key") ? "[PRESENT]" : null,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 500 }
    );
  }
}

// PUT /api/test-endpoint - Same as POST for testing PUT monitors
export async function PUT(request: NextRequest) {
  return POST(request);
}
