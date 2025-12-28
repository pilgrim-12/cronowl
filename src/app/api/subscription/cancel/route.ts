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

    // Cancel subscription via Paddle API
    // effective_from: "next_billing_period" means user keeps access until end of period
    const response = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paddle cancel subscription error:", errorData);
      return NextResponse.json(
        { error: "Failed to cancel subscription", details: errorData },
        { status: 500 }
      );
    }

    const result = await response.json();
    const canceledSubscription = result.data;

    // Update user's subscription status in Firestore
    await adminDb.collection("users").doc(userId).update({
      "subscription.status": "canceled",
      "subscription.canceledAt": new Date(),
      "subscription.effectiveEndDate": canceledSubscription.current_billing_period?.ends_at
        ? new Date(canceledSubscription.current_billing_period.ends_at)
        : null,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      effectiveEndDate: canceledSubscription.current_billing_period?.ends_at,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
