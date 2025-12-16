import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { sendDownAlert } from "@/lib/email";
import { sendPushNotification } from "@/lib/firebase-admin";
import { sendTelegramDownAlert } from "@/lib/telegram";
import { sendWebhookDownAlert } from "@/lib/webhook";
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

        // Send email alert
        await sendDownAlert(user.email, check.name);

        // Send push notification if user has push tokens
        if (user.pushTokens && user.pushTokens.length > 0) {
          try {
            await sendPushNotification(user.pushTokens, {
              title: `🔴 ${check.name} is DOWN`,
              body: `Your cron job "${check.name}" has not reported in and is now marked as down.`,
              data: {
                checkId: checkDoc.id,
                checkName: check.name,
                type: "down",
              },
            });
          } catch (pushError) {
            console.error("Failed to send push notification:", pushError);
          }
        }

        // Send Telegram alert if user has linked Telegram
        if (user.telegramChatId) {
          try {
            await sendTelegramDownAlert(user.telegramChatId, check.name);
          } catch (telegramError) {
            console.error("Failed to send Telegram notification:", telegramError);
          }
        }
      }

      // Send webhook alert if configured
      console.log("Check webhookUrl:", check.name, check.webhookUrl);
      if (check.webhookUrl) {
        console.log("Sending webhook to:", check.webhookUrl);
        try {
          await sendWebhookDownAlert(check.webhookUrl, {
            id: checkDoc.id,
            name: check.name,
            slug: check.slug,
            status: "down",
          });
        } catch (webhookError) {
          console.error("Failed to send webhook notification:", webhookError);
        }
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
