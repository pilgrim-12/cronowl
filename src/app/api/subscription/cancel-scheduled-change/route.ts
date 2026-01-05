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

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Remove scheduled change via Paddle API
    const response = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduled_change: null,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paddle API error:", errorData);
      return NextResponse.json(
        { error: "Failed to cancel scheduled change", details: errorData },
        { status: 500 }
      );
    }

    // Get current plan from subscription to restore it
    const subscriptionResponse = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let currentPlan = userData?.subscription?.plan || "pro";

    if (subscriptionResponse.ok) {
      const subData = await subscriptionResponse.json();
      const priceId = subData.data?.items?.[0]?.price?.id;

      // Determine plan from price ID
      const PRICE_STARTER = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk";
      const PRICE_PRO = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "pri_01kcrqgxrvnt77bwb99t209py1";

      if (priceId === PRICE_STARTER) currentPlan = "starter";
      else if (priceId === PRICE_PRO) currentPlan = "pro";
    }

    // Update Firestore - clear all scheduled change fields
    await adminDb.collection("users").doc(userId).update({
      "subscription.scheduledChange": null,
      "subscription.scheduledDowngrade": null,
      "subscription.scheduledDowngradeAt": null,
      "subscription.status": "active",
      "subscription.plan": currentPlan,
      "plan": currentPlan,
    });

    console.log(`Scheduled change canceled for user ${userId}, restored to ${currentPlan}`);

    return NextResponse.json({
      success: true,
      message: "Scheduled change has been canceled",
      plan: currentPlan,
    });
  } catch (error) {
    console.error("Cancel scheduled change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
