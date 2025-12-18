import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!;
const PADDLE_API_URL = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
  ? "https://api.paddle.com"
  : "https://sandbox-api.paddle.com";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Get user's subscription
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const subscriptionId = userData?.subscription?.paddleSubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Create portal session via Paddle API
    const response = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}/portal-sessions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paddle portal session error:", errorData);
      return NextResponse.json(
        { error: "Failed to create portal session", details: errorData },
        { status: 500 }
      );
    }

    const result = await response.json();
    const portalUrl = result.data?.urls?.general?.overview;

    if (!portalUrl) {
      console.error("No portal URL in response:", result);
      return NextResponse.json(
        { error: "Portal URL not found in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: portalUrl,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
