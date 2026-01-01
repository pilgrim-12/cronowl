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

    // First, get the subscription to check if there's a scheduled change
    const getResponse = await fetch(
      `${PADDLE_API_URL}/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      console.error("Paddle API error (get subscription):", errorData);
      return NextResponse.json(
        { error: "Failed to get subscription", details: errorData },
        { status: 500 }
      );
    }

    const subscriptionData = await getResponse.json();
    const scheduledChange = subscriptionData.data?.scheduled_change;

    // If there's a scheduled cancellation, remove it first
    // User wants to downgrade instead of cancel - valid flow
    if (scheduledChange?.action === "cancel") {
      console.log("Removing scheduled cancellation before downgrade");

      const removeScheduleResponse = await fetch(
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

      if (!removeScheduleResponse.ok) {
        const errorData = await removeScheduleResponse.json();
        console.error("Failed to remove scheduled cancellation:", errorData);
        return NextResponse.json(
          { error: "Failed to remove scheduled cancellation. Please try again.", details: errorData },
          { status: 500 }
        );
      }

      // Update Firestore to remove canceled status
      await adminDb.collection("users").doc(userId).update({
        "subscription.status": "active",
        "subscription.canceledAt": null,
        "subscription.effectiveEndDate": null,
      });
    }

    // Now apply the downgrade - schedule for next billing period
    // User keeps Pro features until the end of current paid period
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
          proration_billing_mode: "prorated_next_billing_period",
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

    // Update Firestore to reflect the scheduled downgrade
    const effectiveAt = result.data?.scheduled_change?.effective_at;
    await adminDb.collection("users").doc(userId).update({
      "subscription.scheduledDowngrade": "starter",
      "subscription.scheduledDowngradeAt": effectiveAt ? new Date(effectiveAt) : null,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be downgraded to Starter at the end of the current billing period",
      subscriptionId,
      effectiveAt,
    });
  } catch (error) {
    console.error("Downgrade subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
