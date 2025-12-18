import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPaymentFailedAlert } from "@/lib/email";

const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

// Paddle price IDs
const PRICE_STARTER = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "pri_01kcrqndhavchav36qazd8gnsk";
const PRICE_PRO = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "pri_01kcrqgxrvnt77bwb99t209py1";

function verifySignature(rawBody: string, signature: string): boolean {
  if (!signature || !WEBHOOK_SECRET) {
    console.error("Missing signature or webhook secret");
    return false;
  }

  try {
    // Parse signature: ts=timestamp;h1=hash
    const parts: Record<string, string> = {};
    signature.split(";").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        parts[key] = value;
      }
    });

    const ts = parts["ts"];
    const h1 = parts["h1"];

    if (!ts || !h1) {
      console.error("Invalid signature format");
      return false;
    }

    const signedPayload = `${ts}:${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    return h1 === expectedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

function getPlanFromPriceId(priceId: string): "starter" | "pro" | null {
  if (priceId === PRICE_STARTER) return "starter";
  if (priceId === PRICE_PRO) return "pro";
  return null;
}

function getLimitsForPlan(plan: "starter" | "pro" | "free") {
  switch (plan) {
    case "pro":
      return { maxChecks: -1, historyDays: 90 }; // -1 = unlimited
    case "starter":
      return { maxChecks: 100, historyDays: 30 };
    default:
      return { maxChecks: 25, historyDays: 7 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";

    // Verify webhook signature
    if (!verifySignature(rawBody, signature)) {
      console.error("Invalid Paddle webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event_type, data } = event;

    console.log(`Paddle webhook received: ${event_type}`, { subscriptionId: data?.id });

    switch (event_type) {
      case "subscription.created":
        await handleSubscriptionCreated(data);
        break;

      case "subscription.activated":
        await handleSubscriptionActivated(data);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(data);
        break;

      case "subscription.past_due":
        await handleSubscriptionPastDue(data);
        break;

      case "subscription.paused":
        await handleSubscriptionPaused(data);
        break;

      case "subscription.resumed":
        await handleSubscriptionResumed(data);
        break;

      case "transaction.completed":
      case "transaction.paid":
        await handleTransactionCompleted(data);
        break;

      default:
        console.log(`Unhandled Paddle event: ${event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(data: any) {
  const userId = data.custom_data?.userId;
  if (!userId) {
    console.error("No userId in subscription.created custom_data");
    return;
  }

  const priceId = data.items?.[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId) || "starter";
  const limits = getLimitsForPlan(plan);

  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      subscription: {
        status: "pending",
        plan,
        paddleSubscriptionId: data.id,
        paddleCustomerId: data.customer_id,
        currentPeriodEnd: data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : null,
        createdAt: FieldValue.serverTimestamp(),
      },
      limits,
      plan, // Update top-level plan for backwards compatibility
    });

  console.log(`Subscription created for user ${userId}: ${plan}`);
}

async function handleSubscriptionActivated(data: any) {
  const userId = data.custom_data?.userId;
  if (!userId) {
    console.error("No userId in subscription.activated custom_data");
    return;
  }

  const priceId = data.items?.[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId) || "starter";
  const limits = getLimitsForPlan(plan);

  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      subscription: {
        status: "active",
        plan,
        paddleSubscriptionId: data.id,
        paddleCustomerId: data.customer_id,
        currentPeriodEnd: data.current_billing_period?.ends_at
          ? new Date(data.current_billing_period.ends_at)
          : null,
        activatedAt: FieldValue.serverTimestamp(),
      },
      limits,
      plan,
    });

  console.log(`Subscription activated for user ${userId}: ${plan}`);
}

async function handleSubscriptionUpdated(data: any) {
  const userId = data.custom_data?.userId;
  if (!userId) {
    // Try to find user by paddleSubscriptionId
    const usersSnapshot = await adminDb
      .collection("users")
      .where("subscription.paddleSubscriptionId", "==", data.id)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error("No user found for subscription.updated");
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    await updateUserSubscription(userDoc.id, data);
    return;
  }

  await updateUserSubscription(userId, data);
}

async function updateUserSubscription(userId: string, data: any) {
  const priceId = data.items?.[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId) || "starter";
  const limits = getLimitsForPlan(plan);

  const status = data.status === "active" ? "active" : data.status;

  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      "subscription.status": status,
      "subscription.plan": plan,
      "subscription.currentPeriodEnd": data.current_billing_period?.ends_at
        ? new Date(data.current_billing_period.ends_at)
        : null,
      "subscription.updatedAt": FieldValue.serverTimestamp(),
      limits,
      plan,
    });

  console.log(`Subscription updated for user ${userId}: ${plan} (${status})`);
}

async function handleSubscriptionCanceled(data: any) {
  // Find user by subscription ID
  const usersSnapshot = await adminDb
    .collection("users")
    .where("subscription.paddleSubscriptionId", "==", data.id)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error("No user found for subscription.canceled");
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const freeLimits = getLimitsForPlan("free");

  // Keep current plan until period end, then downgrade
  const effectiveAt = data.effective_at ? new Date(data.effective_at) : new Date();
  const now = new Date();

  if (effectiveAt > now) {
    // Subscription will end later - mark as canceled but keep current plan
    await adminDb
      .collection("users")
      .doc(userDoc.id)
      .update({
        "subscription.status": "canceled",
        "subscription.canceledAt": FieldValue.serverTimestamp(),
        "subscription.effectiveEndDate": effectiveAt,
      });
  } else {
    // Subscription ended - downgrade to free
    await adminDb
      .collection("users")
      .doc(userDoc.id)
      .update({
        "subscription.status": "canceled",
        "subscription.canceledAt": FieldValue.serverTimestamp(),
        limits: freeLimits,
        plan: "free",
      });
  }

  console.log(`Subscription canceled for user ${userDoc.id}`);
}

async function handleSubscriptionPastDue(data: any) {
  const usersSnapshot = await adminDb
    .collection("users")
    .where("subscription.paddleSubscriptionId", "==", data.id)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error("No user found for subscription.past_due");
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();

  await adminDb
    .collection("users")
    .doc(userDoc.id)
    .update({
      "subscription.status": "past_due",
      "subscription.pastDueAt": FieldValue.serverTimestamp(),
    });

  // Send email notification
  if (userData.email) {
    const planName = userData.plan === "pro" ? "Pro" : "Starter";
    await sendPaymentFailedAlert(userData.email, planName);
    console.log(`Payment failed email sent to ${userData.email}`);
  }

  console.log(`Subscription past_due for user ${userDoc.id}`);
}

async function handleSubscriptionPaused(data: any) {
  const usersSnapshot = await adminDb
    .collection("users")
    .where("subscription.paddleSubscriptionId", "==", data.id)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error("No user found for subscription.paused");
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const freeLimits = getLimitsForPlan("free");

  await adminDb
    .collection("users")
    .doc(userDoc.id)
    .update({
      "subscription.status": "paused",
      "subscription.pausedAt": FieldValue.serverTimestamp(),
      limits: freeLimits,
      plan: "free",
    });

  console.log(`Subscription paused for user ${userDoc.id}`);
}

async function handleSubscriptionResumed(data: any) {
  const usersSnapshot = await adminDb
    .collection("users")
    .where("subscription.paddleSubscriptionId", "==", data.id)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error("No user found for subscription.resumed");
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const priceId = data.items?.[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId) || "starter";
  const limits = getLimitsForPlan(plan);

  await adminDb
    .collection("users")
    .doc(userDoc.id)
    .update({
      "subscription.status": "active",
      "subscription.resumedAt": FieldValue.serverTimestamp(),
      limits,
      plan,
    });

  console.log(`Subscription resumed for user ${userDoc.id}: ${plan}`);
}

async function handleTransactionCompleted(data: any) {
  // Log transaction for records
  console.log(`Transaction completed: ${data.id}`, {
    customerId: data.customer_id,
    status: data.status,
    total: data.details?.totals?.total,
  });

  // Transaction events don't need to update subscription status
  // as subscription events handle that
}
