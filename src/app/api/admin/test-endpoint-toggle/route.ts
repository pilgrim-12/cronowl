import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

// Extract just the path from a URL for consistent hashing
function getPathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

// Generate a short hash for path+method to use as document ID
function urlMethodToDocId(url: string, method: string): string {
  const path = getPathFromUrl(url);
  return crypto.createHash("md5").update(`${method}:${path}`).digest("hex").slice(0, 16);
}

// Admin-only endpoint to toggle test endpoint status for a specific URL+method
export async function POST(request: NextRequest) {
  // Verify auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if user is admin
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get action, URL and method from body
    const body = await request.json();
    const { action, url, method } = body;

    if (action !== "up" && action !== "down") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const httpMethod = method || "GET";

    // Update test endpoint status in Firestore for this specific URL+method
    const docId = urlMethodToDocId(url, httpMethod);
    await adminDb.collection("testEndpointStatuses").doc(docId).set({
      url,
      method: httpMethod,
      isUp: action === "up",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: action,
      url,
      method: httpMethod,
      message: `Test endpoint for ${httpMethod} ${url} is now ${action.toUpperCase()}`
    });
  } catch (error) {
    console.error("Failed to toggle test endpoint:", error);
    return NextResponse.json({ error: "Failed to toggle" }, { status: 500 });
  }
}
