import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { PLANS } from "@/lib/plans";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let usersProcessed = 0;
  let checksProcessed = 0;
  let pingsDeleted = 0;
  let statusEventsDeleted = 0;
  let httpMonitorsProcessed = 0;
  let httpMonitorChecksDeleted = 0;
  let httpMonitorStatusEventsDeleted = 0;

  try {
    // Get all users with their plans
    const usersSnapshot = await adminDb.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userPlan = (userData.plan as keyof typeof PLANS) || "free";
      const historyDays = PLANS[userPlan]?.historyDays || 7;
      const httpHistoryDays = PLANS[userPlan]?.httpHistoryDays || 1;

      // Calculate cutoff dates
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - historyDays);

      const httpCutoffDate = new Date();
      httpCutoffDate.setDate(httpCutoffDate.getDate() - httpHistoryDays);

      // Get all checks for this user
      const checksSnapshot = await adminDb
        .collection("checks")
        .where("userId", "==", userDoc.id)
        .get();

      for (const checkDoc of checksSnapshot.docs) {
        // Delete old pings
        const oldPingsSnapshot = await adminDb
          .collection("checks")
          .doc(checkDoc.id)
          .collection("pings")
          .where("timestamp", "<", cutoffDate)
          .get();

        for (const pingDoc of oldPingsSnapshot.docs) {
          await pingDoc.ref.delete();
          pingsDeleted++;
        }

        // Delete old status history
        const oldStatusSnapshot = await adminDb
          .collection("checks")
          .doc(checkDoc.id)
          .collection("statusHistory")
          .where("timestamp", "<", cutoffDate)
          .get();

        for (const statusDoc of oldStatusSnapshot.docs) {
          await statusDoc.ref.delete();
          statusEventsDeleted++;
        }

        checksProcessed++;
      }

      // Get all HTTP monitors for this user
      const httpMonitorsSnapshot = await adminDb
        .collection("httpMonitors")
        .where("userId", "==", userDoc.id)
        .get();

      for (const monitorDoc of httpMonitorsSnapshot.docs) {
        // Delete old HTTP monitor checks
        const oldChecksSnapshot = await adminDb
          .collection("httpMonitors")
          .doc(monitorDoc.id)
          .collection("checks")
          .where("timestamp", "<", httpCutoffDate)
          .get();

        for (const checkDoc of oldChecksSnapshot.docs) {
          await checkDoc.ref.delete();
          httpMonitorChecksDeleted++;
        }

        // Delete old HTTP monitor status history
        const oldStatusSnapshot = await adminDb
          .collection("httpMonitors")
          .doc(monitorDoc.id)
          .collection("statusHistory")
          .where("timestamp", "<", httpCutoffDate)
          .get();

        for (const statusDoc of oldStatusSnapshot.docs) {
          await statusDoc.ref.delete();
          httpMonitorStatusEventsDeleted++;
        }

        httpMonitorsProcessed++;
      }

      usersProcessed++;
    }

    console.log(
      `History cleanup completed: ${usersProcessed} users, ${checksProcessed} checks, ${pingsDeleted} pings deleted, ${statusEventsDeleted} status events deleted, ${httpMonitorsProcessed} HTTP monitors, ${httpMonitorChecksDeleted} HTTP checks deleted, ${httpMonitorStatusEventsDeleted} HTTP status events deleted`
    );

    return NextResponse.json({
      ok: true,
      usersProcessed,
      checksProcessed,
      pingsDeleted,
      statusEventsDeleted,
      httpMonitorsProcessed,
      httpMonitorChecksDeleted,
      httpMonitorStatusEventsDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("History cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
