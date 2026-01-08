import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp, collection, getDocs, query, where } from "firebase/firestore";
import {
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

// Get monitors due for check - inline to avoid module caching issues
async function getMonitorsDueForCheckInline(): Promise<{ monitors: HttpMonitor[], debugInfo: { totalEnabled: number, dueCount: number, firstMonitorHasLastChecked: boolean | null } }> {
  const monitorsQuery = query(
    collection(db, "httpMonitors"),
    where("isEnabled", "==", true)
  );

  const snapshot = await getDocs(monitorsQuery);
  const now = Date.now();
  const totalEnabled = snapshot.docs.length;

  const dueMonitors: HttpMonitor[] = [];
  let firstMonitorHasLastChecked: boolean | null = null;

  for (const docSnapshot of snapshot.docs) {
    const monitor = {
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as HttpMonitor;

    if (firstMonitorHasLastChecked === null) {
      firstMonitorHasLastChecked = !!monitor.lastCheckedAt;
    }

    // Check if monitor is due - ALWAYS add to due list for simplicity
    // The lastCheckedAt logic was causing issues, just check all enabled monitors
    dueMonitors.push(monitor);
  }

  return { monitors: dueMonitors, debugInfo: { totalEnabled, dueCount: dueMonitors.length, firstMonitorHasLastChecked } };
}

export const maxDuration = 60; // Allow up to 60 seconds for this function
const BUILD_VERSION = "v10"; // Fix: proper types for Firestore

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
    // Get all monitors due for check - use inline function to avoid module caching
    let monitors: HttpMonitor[];
    let debugInfo: { totalEnabled: number, dueCount: number, firstMonitorHasLastChecked: boolean | null };
    try {
      const result = await getMonitorsDueForCheckInline();
      monitors = result.monitors;
      debugInfo = result.debugInfo;
      logger.info(`Found ${monitors.length} HTTP monitors due for check (total enabled: ${debugInfo.totalEnabled})`);
    } catch (fetchError) {
      logger.error("Error fetching monitors due for check", undefined, fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      return NextResponse.json({
        ok: false,
        error: "Failed to fetch monitors",
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

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
        checked++; // Still count as checked even if error
        logger.error(`Error checking monitor ${monitor.id}:`, { monitorId: monitor.id }, error instanceof Error ? error : new Error(String(error)));
      });

      results.push(checkPromise);
    }

    // Wait for remaining checks to complete
    await Promise.all(results);

    const duration = Date.now() - startTime;
    logger.info(`HTTP monitor check complete: ${checked} checked, ${down} down, ${recovered} recovered, ${degraded} degraded in ${duration}ms`);

    return NextResponse.json({
      ok: true,
      version: BUILD_VERSION,
      checked,
      down,
      recovered,
      degraded,
      debug: { totalEnabled: debugInfo.totalEnabled, dueCount: debugInfo.dueCount, monitorsLength: monitors.length },
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
  logger.info(`Starting check for monitor ${monitor.id} (${monitor.name}): ${monitor.url}`);

  // Decrypt headers and body if encrypted
  let decryptedHeaders: Record<string, string> | undefined;
  let decryptedBody: string | undefined;

  try {
    decryptedHeaders = monitor.headers
      ? await decryptHeaders(monitor.headers)
      : undefined;
    logger.info(`Decrypted headers for ${monitor.id}: ${decryptedHeaders ? 'yes' : 'no'}`);
  } catch (decryptError) {
    logger.error(`Failed to decrypt headers for ${monitor.id}`, { monitorId: monitor.id }, decryptError instanceof Error ? decryptError : new Error(String(decryptError)));
    throw decryptError;
  }

  try {
    decryptedBody = monitor.body
      ? await decryptBody(monitor.body)
      : undefined;
    logger.info(`Decrypted body for ${monitor.id}: ${decryptedBody ? 'yes' : 'no'}`);
  } catch (decryptError) {
    logger.error(`Failed to decrypt body for ${monitor.id}`, { monitorId: monitor.id }, decryptError instanceof Error ? decryptError : new Error(String(decryptError)));
    throw decryptError;
  }

  // Create monitor copy with decrypted values for check
  const monitorForCheck: HttpMonitor = {
    ...monitor,
    headers: decryptedHeaders,
    body: decryptedBody,
  };

  // Execute the HTTP check
  let result;
  try {
    result = await executeHttpCheck(monitorForCheck);
    logger.info(`HTTP check result for ${monitor.id}: status=${result.status}, statusCode=${result.statusCode}, responseTimeMs=${result.responseTimeMs}`);
  } catch (checkError) {
    logger.error(`executeHttpCheck failed for ${monitor.id}`, { monitorId: monitor.id }, checkError instanceof Error ? checkError : new Error(String(checkError)));
    throw checkError;
  }

  // Record the check result - filter out undefined values (Firestore doesn't accept undefined)
  try {
    const checkData: {
      timestamp: typeof Timestamp.prototype;
      status: "success" | "failure";
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
      responseBodyPreview?: string;
    } = {
      timestamp: Timestamp.now(),
      status: result.status,
    };
    if (result.statusCode !== undefined) checkData.statusCode = result.statusCode;
    if (result.responseTimeMs !== undefined) checkData.responseTimeMs = result.responseTimeMs;
    if (result.error !== undefined) checkData.error = result.error;
    if (result.responseBody !== undefined) checkData.responseBodyPreview = result.responseBody;

    await addHttpMonitorCheck(monitor.id, checkData);
    logger.info(`Recorded check for ${monitor.id}`);
  } catch (addCheckError) {
    logger.error(`Failed to add check record for ${monitor.id}`, { monitorId: monitor.id }, addCheckError instanceof Error ? addCheckError : new Error(String(addCheckError)));
    throw addCheckError;
  }

  // Prepare update data - filter out undefined values (Firestore doesn't accept undefined)
  const updateData: Partial<HttpMonitor> = {
    lastCheckedAt: Timestamp.now(),
  };
  if (result.responseTimeMs !== undefined) updateData.lastResponseTimeMs = result.responseTimeMs;
  if (result.statusCode !== undefined) updateData.lastStatusCode = result.statusCode;
  if (result.error !== undefined) updateData.lastError = result.error;
  if (result.responseBody !== undefined) updateData.lastResponseBody = result.responseBody;

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
