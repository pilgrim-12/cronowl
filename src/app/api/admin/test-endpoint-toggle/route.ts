import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Admin-only endpoint to toggle test endpoint status
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

    // Get action from body
    const body = await request.json();
    const action = body.action;

    if (action !== "up" && action !== "down") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update test endpoint status in Firestore
    await adminDb.collection("settings").doc("testEndpointStatus").set({
      isUp: action === "up",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: action,
      message: `Test endpoint is now ${action.toUpperCase()}`
    });
  } catch (error) {
    console.error("Failed to toggle test endpoint:", error);
    return NextResponse.json({ error: "Failed to toggle" }, { status: 500 });
  }
}
