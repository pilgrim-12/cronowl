import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import {
  getMonitorsDueForCheck,
  updateHttpMonitor,
  addHttpMonitorCheck,
  addHttpMonitorStatusEvent,
  getLastHttpMonitorStatusEvent,
  HttpMonitor,
} from "@/lib/http-monitors";
import { executeHttpCheck } from "@/lib/http-monitor-checker";
import { decryptHeaders, decryptBody } from "@/lib/encryption";
import {
  sendHttpMonitorDownNotifications,
  sendHttpMonitorRecoveryNotifications,
  sendHttpMonitorDegradedNotifications,
} from "@/lib/http-monitor-notifications";
import { logger } from "@/lib/logger";

export const maxDuration = 60; // Allow up to 60 seconds for this function

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  let checked = 0;
  let down = 0;
  let recovered = 0;
  let degraded = 0;

  try {
    // Get all monitors due for check
    const monitors = await getMonitorsDueForCheck();
    logger.info(`Found ${monitors.length} HTTP monitors due for check`);

    // Process monitors in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 10;
    const results: Promise<void>[] = [];

    for (const monitor of monitors) {
      if (results.length >= CONCURRENCY_LIMIT) {
        // Wait for one to complete before adding more
        await Promise.race(results);
        // Remove completed promises
        const pendingResults: Promise<void>[] = [];
        for (const r of results) {
          const isSettled = await Promise.race([
            r.then(() => true).catch(() => true),
            Promise.resolve(false),
          ]);
          if (!isSettled) {
            pendingResults.push(r);
          }
        }
        results.length = 0;
        results.push(...pendingResults);
      }

      const checkPromise = processMonitorCheck(monitor).then((result) => {
        checked++;
        if (result === "down") down++;
        if (result === "recovered") recovered++;
        if (result === "degraded") degraded++;
      }).catch((error) => {
        logger.error(`Error checking monitor ${monitor.id}:`, error);
      });

      results.push(checkPromise);
    }

    // Wait for remaining checks to complete
    await Promise.all(results);

    const duration = Date.now() - startTime;
    logger.info(`HTTP monitor check complete: ${checked} checked, ${down} down, ${recovered} recovered, ${degraded} degraded in ${duration}ms`);

    return NextResponse.json({
      ok: true,
      checked,
      down,
      recovered,
      degraded,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("HTTP monitor cron failed", undefined, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

type CheckResultType = "ok" | "down" | "recovered" | "degraded";

async function processMonitorCheck(monitor: HttpMonitor): Promise<CheckResultType> {
  // Decrypt headers and body if encrypted
  const decryptedHeaders = monitor.headers
    ? await decryptHeaders(monitor.headers)
    : undefined;
  const decryptedBody = monitor.body
    ? await decryptBody(monitor.body)
    : undefined;

  // Create monitor copy with decrypted values for check
  const monitorForCheck: HttpMonitor = {
    ...monitor,
    headers: decryptedHeaders,
    body: decryptedBody,
  };

  // Execute the HTTP check
  const result = await executeHttpCheck(monitorForCheck);

  // Record the check result
  await addHttpMonitorCheck(monitor.id, {
    timestamp: Timestamp.now(),
    status: result.status,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
    error: result.error,
    responseBodyPreview: result.responseBody,
  });

  // Prepare update data
  const updateData: Partial<HttpMonitor> = {
    lastCheckedAt: Timestamp.now(),
    lastResponseTimeMs: result.responseTimeMs,
    lastStatusCode: result.statusCode,
    lastError: result.error,
    lastResponseBody: result.responseBody,
  };

  let resultType: CheckResultType = "ok";

  if (result.status === "failure") {
    // Increment consecutive failures
    const newFailures = (monitor.consecutiveFailures || 0) + 1;
    updateData.consecutiveFailures = newFailures;

    // Check if we should trigger DOWN alert
    if (newFailures >= monitor.alertAfterFailures && monitor.status !== "down") {
      updateData.status = "down";
      resultType = "down";

      // Get user info and send notifications
      await sendDownNotifications(monitor, result.error);

      // Record status event
      const lastEvent = await getLastHttpMonitorStatusEvent(monitor.id);
      await addHttpMonitorStatusEvent(monitor.id, "down", lastEvent?.timestamp);
    }
  } else {
    // Success - check for recovery or degraded
    const wasDown = monitor.status === "down";
    const wasDegraded = monitor.status === "degraded";

    // Reset consecutive failures
    updateData.consecutiveFailures = 0;

    // Check for degraded (slow response)
    const maxResponseTime = monitor.assertions?.maxResponseTimeMs;
    const isSlowResponse = maxResponseTime && result.responseTimeMs > maxResponseTime;

    if (wasDown) {
      // Recovery from down
      updateData.status = isSlowResponse ? "degraded" : "up";
      resultType = "recovered";

      // Calculate downtime duration
      const lastEvent = await getLastHttpMonitorStatusEvent(monitor.id);
      const downtimeSeconds = lastEvent?.timestamp
        ? Math.floor((Date.now() - lastEvent.timestamp.toMillis()) / 1000)
        : undefined;

      // Send recovery notifications
      await sendRecoveryNotifications(monitor, downtimeSeconds);

      // Record status event
      await addHttpMonitorStatusEvent(monitor.id, isSlowResponse ? "degraded" : "up", lastEvent?.timestamp);
    } else if (isSlowResponse && monitor.status !== "degraded") {
      // Transition to degraded
      updateData.status = "degraded";
      resultType = "degraded";

      // Send degraded notifications
      await sendDegradedNotifications(monitor, result.responseTimeMs, maxResponseTime);

      // Record status event
      const lastEvent = await getLastHttpMonitorStatusEvent(monitor.id);
      await addHttpMonitorStatusEvent(monitor.id, "degraded", lastEvent?.timestamp);
    } else if (!isSlowResponse && wasDegraded) {
      // Recovery from degraded to up
      updateData.status = "up";

      // Record status event
      const lastEvent = await getLastHttpMonitorStatusEvent(monitor.id);
      await addHttpMonitorStatusEvent(monitor.id, "up", lastEvent?.timestamp);
    } else if (!isSlowResponse) {
      updateData.status = "up";
    }
  }

  // Update monitor
  await updateHttpMonitor(monitor.id, updateData);

  return resultType;
}

async function sendDownNotifications(monitor: HttpMonitor, error?: string): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, "users", monitor.userId));
    if (!userDoc.exists()) return;

    const user = userDoc.data();

    await sendHttpMonitorDownNotifications(
      {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status: "down",
        statusCode: monitor.lastStatusCode,
        responseTimeMs: monitor.lastResponseTimeMs,
        error: error,
        failedChecks: monitor.alertAfterFailures,
        responseBody: monitor.lastResponseBody,
      },
      {
        id: monitor.userId,
        email: user.email,
        pushTokens: user.pushTokens,
        telegramChatId: user.telegramChatId,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        telegramNotifications: user.telegramNotifications,
      },
      monitor.webhookUrl
    );
  } catch (error) {
    logger.error(`Failed to send down notifications for monitor ${monitor.id}`, { monitorId: monitor.id }, error instanceof Error ? error : new Error(String(error)));
  }
}

async function sendRecoveryNotifications(monitor: HttpMonitor, downtimeSeconds?: number): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, "users", monitor.userId));
    if (!userDoc.exists()) return;

    const user = userDoc.data();

    await sendHttpMonitorRecoveryNotifications(
      {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status: "up",
        statusCode: monitor.lastStatusCode,
        responseTimeMs: monitor.lastResponseTimeMs,
      },
      {
        id: monitor.userId,
        email: user.email,
        pushTokens: user.pushTokens,
        telegramChatId: user.telegramChatId,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        telegramNotifications: user.telegramNotifications,
      },
      monitor.webhookUrl,
      downtimeSeconds
    );
  } catch (error) {
    logger.error(`Failed to send recovery notifications for monitor ${monitor.id}`, { monitorId: monitor.id }, error instanceof Error ? error : new Error(String(error)));
  }
}

async function sendDegradedNotifications(
  monitor: HttpMonitor,
  responseTimeMs: number,
  maxResponseTimeMs: number
): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, "users", monitor.userId));
    if (!userDoc.exists()) return;

    const user = userDoc.data();

    await sendHttpMonitorDegradedNotifications(
      {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status: "degraded",
        statusCode: monitor.lastStatusCode,
        responseTimeMs: responseTimeMs,
        maxResponseTimeMs: maxResponseTimeMs,
      },
      {
        id: monitor.userId,
        email: user.email,
        pushTokens: user.pushTokens,
        telegramChatId: user.telegramChatId,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        telegramNotifications: user.telegramNotifications,
      },
      monitor.webhookUrl
    );
  } catch (error) {
    logger.error(`Failed to send degraded notifications for monitor ${monitor.id}`, { monitorId: monitor.id }, error instanceof Error ? error : new Error(String(error)));
  }
}
