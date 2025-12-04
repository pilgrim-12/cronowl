import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendDownAlert } from "@/lib/email";

const SCHEDULE_MINUTES: Record<string, number> = {
  "every 1 minute": 1,
  "every 5 minutes": 5,
  "every 15 minutes": 15,
  "every 30 minutes": 30,
  "every hour": 60,
  "every day": 1440,
  "every week": 10080,
};

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth for development
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const checksSnapshot = await getDocs(collection(db, "checks"));
    const now = new Date();
    let checkedCount = 0;
    let downCount = 0;

    for (const checkDoc of checksSnapshot.docs) {
      const check = checkDoc.data();

      if (check.status === "new" || !check.lastPing) {
        continue; // Skip checks that never received a ping
      }

      const lastPing = check.lastPing.toDate();
      const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
      const gracePeriod = check.gracePeriod || 5;
      const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

      const timeSinceLastPing = now.getTime() - lastPing.getTime();
      checkedCount++;

      if (timeSinceLastPing > expectedInterval && check.status !== "down") {
        // Mark as down and send alert
        await updateDoc(doc(db, "checks", checkDoc.id), {
          status: "down",
        });

        // Get user email
        const userDoc = await getDoc(doc(db, "users", check.userId));
        const userEmail = userDoc.exists() ? userDoc.data().email : null;

        if (userEmail) {
          await sendDownAlert(userEmail, check.name);
        }

        downCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      checked: checkedCount,
      down: downCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
