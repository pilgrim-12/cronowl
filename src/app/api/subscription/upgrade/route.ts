import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const PADDLE_API_KEY = process.env.PADDLE_API_KEY!;
const PADDLE_API_URL = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
  ? "https://api.paddle.com"
  : "https://sandbox-api.paddle.com";

const PRICE_STARTER = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk";
const PRICE_PRO = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "pri_01kcrqgxrvnt77bwb99t209py1";

export async function POST(req: NextRequest) {
  try {
    const { userId, targetPlan } = await req.json();

    if (!userId || !targetPlan) {
      return NextResponse.json(
        { error: "Missing userId or targetPlan" },
        { status: 400 }
      );
    }

    if (targetPlan !== "starter" && targetPlan !== "pro") {
      return NextResponse.json(
        { error: "Invalid target plan" },
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

    // Determine the new price ID
    const newPriceId = targetPlan === "pro" ? PRICE_PRO : PRICE_STARTER;

    // Call Paddle API to update subscription
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
              price_id: newPriceId,
              quantity: 1,
            },
          ],
          proration_billing_mode: "prorated_immediately", // Charge/credit difference immediately
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Paddle API error:", errorData);
      return NextResponse.json(
        { error: "Failed to update subscription", details: errorData },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log(`Subscription ${subscriptionId} upgraded to ${targetPlan}`, result);

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${targetPlan}`,
      subscriptionId,
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
