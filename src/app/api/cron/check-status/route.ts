import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { sendDownAlert } from "@/lib/email";
import { SCHEDULE_MINUTES } from "@/lib/constants";
import { addStatusEvent, getLastStatusEvent } from "@/lib/checks";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checksSnapshot = await getDocs(collection(db, "checks"));
  let checked = 0;
  let down = 0;

  for (const checkDoc of checksSnapshot.docs) {
    const check = checkDoc.data();

    if (check.status === "new" || !check.lastPing) {
      continue;
    }

    checked++;

    const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
    const gracePeriod = check.gracePeriod || 0;
    const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

    const lastPingTime = check.lastPing.toDate().getTime();
    const timeSinceLastPing = Date.now() - lastPingTime;

    if (timeSinceLastPing > expectedInterval && check.status !== "down") {
      await updateDoc(doc(db, "checks", checkDoc.id), {
        status: "down",
      });

      // Record status change to down
      const lastEvent = await getLastStatusEvent(checkDoc.id);
      await addStatusEvent(checkDoc.id, "down", lastEvent?.timestamp);

      const userDoc = await getDoc(doc(db, "users", check.userId));
      if (userDoc.exists()) {
        const user = userDoc.data();
        await sendDownAlert(user.email, check.name);
      }

      down++;
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    down,
    timestamp: new Date().toISOString(),
  });
}
