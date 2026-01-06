/**
 * Script to fix user plan data
 *
 * Run with: npx tsx --env-file=.env.local scripts/fix-user-plan.ts
 */

import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials. Run with: npx tsx --env-file=.env.local scripts/fix-user-plan.ts");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

async function fixUserPlan() {
  const userEmail = "yurachernov12@gmail.com";

  const usersSnapshot = await db
    .collection("users")
    .where("email", "==", userEmail)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error(`User ${userEmail} not found`);
    process.exit(1);
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();

  console.log("=== BEFORE ===");
  console.log("subscription.plan:", userData.subscription?.plan);
  console.log("subscription.scheduledDowngrade:", userData.subscription?.scheduledDowngrade);
  console.log("subscription.scheduledChange:", userData.subscription?.scheduledChange);
  console.log("limits:", userData.limits);
  console.log("plan:", userData.plan);
  console.log("");

  const currentPeriodEnd = userData.subscription?.currentPeriodEnd?.toDate?.()
    || new Date("2026-01-28T02:15:50Z");

  // Fix: Set to Pro with scheduled downgrade to Starter
  await db.collection("users").doc(userDoc.id).update({
    "subscription.plan": "pro",
    "subscription.scheduledDowngrade": "starter",
    "subscription.scheduledDowngradeAt": currentPeriodEnd,
    "subscription.scheduledChange": {
      action: "downgrade",
      effectiveAt: currentPeriodEnd.toISOString(),
      plan: "starter",
    },
    limits: {
      maxChecks: 500,
      historyDays: 90,
      plan: "pro",
    },
    plan: "pro",
  });

  console.log("=== AFTER ===");
  console.log("subscription.plan: pro");
  console.log("subscription.scheduledDowngrade: starter");
  console.log("limits: { maxChecks: 500, historyDays: 90, plan: 'pro' }");
  console.log("plan: pro");
  console.log("");
  console.log("Done! User is now on Pro with scheduled downgrade to Starter.");
}

fixUserPlan()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
