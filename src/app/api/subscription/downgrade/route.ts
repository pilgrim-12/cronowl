import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!;
const PADDLE_API_URL = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
  ? "https://api.paddle.com"
  : "https://sandbox-api.paddle.com";

const PRICE_STARTER = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk";

export async function POST(req: NextRequest) {
  try {
    const { userId, targetPlan } = await req.json();

    if (!userId || !targetPlan) {
      return NextResponse.json(
        { error: "Missing userId or targetPlan" },
        { status: 400 }
      );
    }

    // Only allow downgrade to starter
    if (targetPlan !== "starter") {
      return NextResponse.json(
        { error: "Can only downgrade to starter plan" },
        { status: 400 }
      );
    }

    // Get user's current subscription
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const subscriptionId = userData?.subscription?.paddleSubscriptionId;
    const currentPlan = userData?.plan;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    if (currentPlan !== "pro") {
      return NextResponse.json(
        { error: "Can only downgrade from Pro plan" },
        { status: 400 }
      );
    }

    // Call Paddle API to update subscription
    // For downgrade, we use prorated_next_billing_period so user keeps Pro until end of period
    const response = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              price_id: PRICE_STARTER,
              quantity: 1,
            },
          ],
          proration_billing_mode: "prorated_next_billing_period", // Apply at next billing
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paddle API error:", errorData);
      return NextResponse.json(
        { error: "Failed to downgrade subscription", details: errorData },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log(`Subscription ${subscriptionId} scheduled for downgrade to starter`, result);

    return NextResponse.json({
      success: true,
      message: "Subscription will be downgraded to Starter at the end of the current billing period",
      subscriptionId,
    });
  } catch (error) {
    console.error("Downgrade subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
