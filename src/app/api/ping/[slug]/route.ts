import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendDownAlert, sendRecoveryAlert } from "@/lib/email";
import { sendPushNotification } from "@/lib/firebase-admin";
import { sendTelegramDownAlert, sendTelegramRecoveryAlert } from "@/lib/telegram";
import { SCHEDULE_MINUTES } from "@/lib/constants";
import { addStatusEvent, getLastStatusEvent } from "@/lib/checks";

async function checkUserChecks(userId: string, currentCheckId: string) {
  const checksQuery = query(
    collection(db, "checks"),
    where("userId", "==", userId)
  );
  const checksSnapshot = await getDocs(checksQuery);
  const now = new Date();

  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.exists() ? userDoc.data() : null;
  const userEmail = userData?.email || null;
  const telegramChatId = userData?.telegramChatId || null;

  for (const checkDoc of checksSnapshot.docs) {
    if (checkDoc.id === currentCheckId) continue;

    const check = checkDoc.data();
    if (check.status === "new" || !check.lastPing) continue;

    const lastPing = check.lastPing.toDate();
    const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
    const gracePeriod = check.gracePeriod || 5;
    const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

    const timeSinceLastPing = now.getTime() - lastPing.getTime();

    if (timeSinceLastPing > expectedInterval && check.status !== "down") {
      await updateDoc(doc(db, "checks", checkDoc.id), { status: "down" });

      // Send email alert
      if (userEmail) {
        await sendDownAlert(userEmail, check.name);
      }

      // Send Telegram alert
      if (telegramChatId) {
        try {
          await sendTelegramDownAlert(telegramChatId, check.name);
        } catch (telegramError) {
          console.error("Failed to send Telegram down alert:", telegramError);
        }
      }
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Parse query parameters for execution metrics
    const { searchParams } = new URL(request.url);
    const duration = searchParams.get("duration"); // in ms
    const exitCode = searchParams.get("exit_code") || searchParams.get("exitCode");
    const output = searchParams.get("output");
    const status = searchParams.get("status"); // success, failure

    const checksQuery = query(
      collection(db, "checks"),
      where("slug", "==", slug)
    );
    const checksSnapshot = await getDocs(checksQuery);

    if (checksSnapshot.empty) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

    const checkDoc = checksSnapshot.docs[0];
    const check = checkDoc.data();
    const wasDown = check.status === "down";

    // Determine ping status from exit code or explicit status
    let pingStatus: "success" | "failure" | "unknown" = "unknown";
    if (status === "success" || status === "fail" || status === "failure") {
      pingStatus = status === "success" ? "success" : "failure";
    } else if (exitCode !== null && exitCode !== undefined) {
      pingStatus = exitCode === "0" ? "success" : "failure";
    }

    // Update check status (only mark as "up" if not explicitly failed)
    const newStatus = pingStatus === "failure" ? check.status : "up";
    await updateDoc(doc(db, "checks", checkDoc.id), {
      lastPing: Timestamp.now(),
      status: newStatus,
      ...(duration && { lastDuration: parseInt(duration, 10) }),
    });

    // Save ping to history with metrics
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const pingData: Record<string, unknown> = {
      timestamp: Timestamp.now(),
      ip: ip.split(",")[0].trim(),
      userAgent,
    };

    // Add optional execution metrics
    if (duration) pingData.duration = parseInt(duration, 10);
    if (exitCode !== null && exitCode !== undefined) pingData.exitCode = parseInt(exitCode, 10);
    if (output) pingData.output = output.slice(0, 1000); // Truncate to 1KB
    if (pingStatus !== "unknown") pingData.status = pingStatus;

    await addDoc(collection(db, "checks", checkDoc.id, "pings"), pingData);

    // Record status change and send recovery alert if was down
    if (wasDown) {
      const lastEvent = await getLastStatusEvent(checkDoc.id);
      await addStatusEvent(checkDoc.id, "up", lastEvent?.timestamp);

      const userDoc = await getDoc(doc(db, "users", check.userId));
      if (userDoc.exists()) {
        const user = userDoc.data();

        // Send email recovery alert
        if (user.email) {
          await sendRecoveryAlert(user.email, check.name);
        }

        // Send push notification if user has push tokens
        if (user.pushTokens && user.pushTokens.length > 0) {
          try {
            await sendPushNotification(user.pushTokens, {
              title: `🟢 ${check.name} is BACK UP`,
              body: `Your cron job "${check.name}" has recovered and is now running normally.`,
              data: {
                checkId: checkDoc.id,
                checkName: check.name,
                type: "recovery",
              },
            });
          } catch (pushError) {
            console.error("Failed to send push notification:", pushError);
          }
        }

        // Send Telegram recovery alert if user has linked Telegram
        if (user.telegramChatId) {
          try {
            await sendTelegramRecoveryAlert(user.telegramChatId, check.name);
          } catch (telegramError) {
            console.error("Failed to send Telegram notification:", telegramError);
          }
        }
      }
    } else if (check.status === "new") {
      // First ping - record initial "up" status
      await addStatusEvent(checkDoc.id, "up");
    }

    // Check other user's checks
    await checkUserChecks(check.userId, checkDoc.id);

    return NextResponse.json({ ok: true, message: "Pong!" });
  } catch (error) {
    console.error("Ping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // For POST, also check body for metrics (allows longer output)
  const { slug } = await params;

  try {
    const body = await request.json().catch(() => ({}));

    // Build URL with body params as query string for GET handler
    const url = new URL(request.url);
    if (body.duration) url.searchParams.set("duration", String(body.duration));
    if (body.exit_code !== undefined) url.searchParams.set("exit_code", String(body.exit_code));
    if (body.exitCode !== undefined) url.searchParams.set("exitCode", String(body.exitCode));
    if (body.status) url.searchParams.set("status", body.status);
    if (body.output) url.searchParams.set("output", body.output);

    // Create new request with updated URL
    const newRequest = new NextRequest(url, {
      headers: request.headers,
    });

    return GET(newRequest, { params: Promise.resolve({ slug }) });
  } catch {
    return GET(request, { params });
  }
}
