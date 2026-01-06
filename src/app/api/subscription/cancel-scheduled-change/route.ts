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

    // Determine the current plan the user should stay on
    // IMPORTANT: When there's a scheduled downgrade, Paddle shows the future price_id,
    // not the current one. So we need to use our stored data.
    // If user has scheduledDowngrade = "starter", they are currently on "pro"
    // If user has scheduledChange.plan = "starter", they are currently on "pro"
    let currentPlan = userData?.subscription?.plan || "pro";

    // If there was a scheduled downgrade, the current plan is higher than scheduled
    const scheduledDowngrade = userData?.subscription?.scheduledDowngrade;
    const scheduledChangePlan = userData?.subscription?.scheduledChange?.plan;

    if (scheduledDowngrade === "starter" || scheduledChangePlan === "starter") {
      currentPlan = "pro";
    } else if (scheduledDowngrade === "free" || scheduledChangePlan === "free") {
      // Could be from starter or pro - check what makes sense
      // If current stored plan is "free", it's wrong - should be at least starter
      if (currentPlan === "free") {
        currentPlan = "starter";
      }
    }

    // NOTE: We intentionally DON'T fetch from Paddle here because:
    // When a scheduled downgrade exists, Paddle already shows the FUTURE price_id (Starter),
    // not the CURRENT price_id (Pro). Even after clearing scheduled_change, the price_id
    // in Paddle remains at the scheduled value until we explicitly change it back.
    // So we trust our Firestore data which correctly tracks the scheduled change.

    // If we determined current plan from scheduled change info, we need to also
    // update Paddle to restore the original price
    if (scheduledDowngrade || scheduledChangePlan) {
      const PRICE_STARTER = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk";
      const PRICE_PRO = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "pri_01kcrqgxrvnt77bwb99t209py1";

      const correctPriceId = currentPlan === "pro" ? PRICE_PRO : PRICE_STARTER;

      // Update Paddle subscription to the correct price
      console.log(`Restoring Paddle subscription to ${currentPlan} (${correctPriceId})`);
      await fetch(
        `${PADDLE_API_URL}/subscriptions/${subscriptionId}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${PADDLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ price_id: correctPriceId, quantity: 1 }],
            proration_billing_mode: "do_not_bill", // Don't charge - just restoring original plan
          }),
        }
      );
    }

    // Get limits for the current plan
    const limits = currentPlan === "pro"
      ? { maxChecks: 500, historyDays: 90, plan: "pro" }
      : currentPlan === "starter"
      ? { maxChecks: 100, historyDays: 30, plan: "starter" }
      : { maxChecks: 25, historyDays: 7, plan: "free" };

    // Update Firestore - clear all scheduled change fields and restore correct limits
    await adminDb.collection("users").doc(userId).update({
      "subscription.scheduledChange": null,
      "subscription.scheduledDowngrade": null,
      "subscription.scheduledDowngradeAt": null,
      "subscription.status": "active",
      "subscription.plan": currentPlan,
      "subscription.canceledAt": null,
      "subscription.effectiveEndDate": null,
      "plan": currentPlan,
      "limits": limits,
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
