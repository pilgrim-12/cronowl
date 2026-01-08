// Unified notification system for HTTP Monitors with retry logic

import {
  sendHttpMonitorDownAlert,
  sendHttpMonitorRecoveryAlert,
  sendHttpMonitorDegradedAlert,
  HttpMonitorAlertData,
} from "./email";
import { sendPushNotification } from "./firebase-admin";
import {
  sendTelegramHttpMonitorDownAlert,
  sendTelegramHttpMonitorRecoveryAlert,
  sendTelegramHttpMonitorDegradedAlert,
} from "./telegram";
import {
  sendWebhookHttpMonitorDownAlert,
  sendWebhookHttpMonitorRecoveryAlert,
  sendWebhookHttpMonitorDegradedAlert,
} from "./webhook";
import { logger } from "./logger";

interface NotificationConfig {
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: NotificationConfig = DEFAULT_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < config.maxRetries) {
        await sleep(config.retryDelayMs * (attempt + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

export interface HttpMonitorInfo {
  id: string;
  name: string;
  url: string;
  method?: string;
  status: "up" | "down" | "degraded" | "pending";
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  failedChecks?: number;
  downtimeDuration?: string;
  maxResponseTimeMs?: number;
  responseBody?: string;
}

export interface UserInfo {
  id: string;
  email?: string;
  pushTokens?: string[];
  telegramChatId?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  telegramNotifications?: boolean;
}

export interface NotificationResult {
  email: boolean;
  push: boolean;
  telegram: boolean;
  webhook: boolean;
}

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

/**
 * Send all configured notifications for HTTP monitor DOWN event
 */
export async function sendHttpMonitorDownNotifications(
  monitor: HttpMonitorInfo,
  user: UserInfo,
  webhookUrl?: string
): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: false,
    push: false,
    telegram: false,
    webhook: false,
  };

  const alertData: HttpMonitorAlertData = {
    name: monitor.name,
    url: monitor.url,
    statusCode: monitor.statusCode,
    responseTimeMs: monitor.responseTimeMs,
    error: monitor.error,
    failedChecks: monitor.failedChecks,
    responseBody: monitor.responseBody,
  };

  // Email notification
  if (user.email && user.emailNotifications !== false) {
    try {
      await withRetry(() => sendHttpMonitorDownAlert(user.email!, alertData));
      result.email = true;
      logger.notificationSent("email", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("email", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Push notification
  if (user.pushTokens && user.pushTokens.length > 0 && user.pushNotifications !== false) {
    try {
      await withRetry(() =>
        sendPushNotification(user.pushTokens!, {
          title: `🔴 ${monitor.name} is DOWN`,
          body: `HTTP monitor "${monitor.name}" is not responding. ${monitor.error || ""}`,
          data: {
            monitorId: monitor.id,
            monitorName: monitor.name,
            type: "http_monitor_down",
          },
        })
      );
      result.push = true;
      logger.notificationSent("push", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("push", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Telegram notification
  if (user.telegramChatId && user.telegramNotifications !== false) {
    try {
      await withRetry(() =>
        sendTelegramHttpMonitorDownAlert(user.telegramChatId!, {
          name: monitor.name,
          url: monitor.url,
          method: monitor.method,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          error: monitor.error,
          failedChecks: monitor.failedChecks,
        })
      );
      result.telegram = true;
      logger.notificationSent("telegram", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("telegram", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Webhook notification
  if (webhookUrl) {
    try {
      const success = await withRetry(() =>
        sendWebhookHttpMonitorDownAlert(webhookUrl, {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          status: monitor.status,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          error: monitor.error,
          failedChecks: monitor.failedChecks,
        })
      );
      result.webhook = success;
      if (success) {
        logger.notificationSent("webhook", monitor.name, user.id);
      }
    } catch (error) {
      logger.notificationFailed("webhook", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  return result;
}

/**
 * Send all configured notifications for HTTP monitor RECOVERY event
 */
export async function sendHttpMonitorRecoveryNotifications(
  monitor: HttpMonitorInfo,
  user: UserInfo,
  webhookUrl?: string,
  downtimeSeconds?: number
): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: false,
    push: false,
    telegram: false,
    webhook: false,
  };

  const downtimeDuration = downtimeSeconds ? formatDuration(downtimeSeconds) : undefined;

  const alertData: HttpMonitorAlertData = {
    name: monitor.name,
    url: monitor.url,
    statusCode: monitor.statusCode,
    responseTimeMs: monitor.responseTimeMs,
    downtimeDuration,
  };

  // Email notification
  if (user.email && user.emailNotifications !== false) {
    try {
      await withRetry(() => sendHttpMonitorRecoveryAlert(user.email!, alertData));
      result.email = true;
      logger.notificationSent("email", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("email", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Push notification
  if (user.pushTokens && user.pushTokens.length > 0 && user.pushNotifications !== false) {
    try {
      await withRetry(() =>
        sendPushNotification(user.pushTokens!, {
          title: `🟢 ${monitor.name} is BACK UP`,
          body: `HTTP monitor "${monitor.name}" has recovered and is now responding normally.${downtimeDuration ? ` Downtime: ${downtimeDuration}` : ""}`,
          data: {
            monitorId: monitor.id,
            monitorName: monitor.name,
            type: "http_monitor_recovery",
          },
        })
      );
      result.push = true;
      logger.notificationSent("push", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("push", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Telegram notification
  if (user.telegramChatId && user.telegramNotifications !== false) {
    try {
      await withRetry(() =>
        sendTelegramHttpMonitorRecoveryAlert(user.telegramChatId!, {
          name: monitor.name,
          url: monitor.url,
          method: monitor.method,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          downtimeDuration,
        })
      );
      result.telegram = true;
      logger.notificationSent("telegram", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("telegram", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Webhook notification
  if (webhookUrl) {
    try {
      const success = await withRetry(() =>
        sendWebhookHttpMonitorRecoveryAlert(webhookUrl, {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          status: monitor.status,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          downtimeDuration,
        })
      );
      result.webhook = success;
      if (success) {
        logger.notificationSent("webhook", monitor.name, user.id);
      }
    } catch (error) {
      logger.notificationFailed("webhook", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  return result;
}

/**
 * Send all configured notifications for HTTP monitor DEGRADED event
 */
export async function sendHttpMonitorDegradedNotifications(
  monitor: HttpMonitorInfo,
  user: UserInfo,
  webhookUrl?: string
): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: false,
    push: false,
    telegram: false,
    webhook: false,
  };

  const alertData: HttpMonitorAlertData = {
    name: monitor.name,
    url: monitor.url,
    statusCode: monitor.statusCode,
    responseTimeMs: monitor.responseTimeMs,
    maxResponseTimeMs: monitor.maxResponseTimeMs,
  };

  // Email notification
  if (user.email && user.emailNotifications !== false) {
    try {
      await withRetry(() => sendHttpMonitorDegradedAlert(user.email!, alertData));
      result.email = true;
      logger.notificationSent("email", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("email", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Push notification
  if (user.pushTokens && user.pushTokens.length > 0 && user.pushNotifications !== false) {
    try {
      await withRetry(() =>
        sendPushNotification(user.pushTokens!, {
          title: `🟡 ${monitor.name} is SLOW`,
          body: `HTTP monitor "${monitor.name}" is responding slowly (${monitor.responseTimeMs}ms, threshold: ${monitor.maxResponseTimeMs}ms)`,
          data: {
            monitorId: monitor.id,
            monitorName: monitor.name,
            type: "http_monitor_degraded",
          },
        })
      );
      result.push = true;
      logger.notificationSent("push", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("push", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Telegram notification
  if (user.telegramChatId && user.telegramNotifications !== false) {
    try {
      await withRetry(() =>
        sendTelegramHttpMonitorDegradedAlert(user.telegramChatId!, {
          name: monitor.name,
          url: monitor.url,
          method: monitor.method,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          maxResponseTimeMs: monitor.maxResponseTimeMs,
        })
      );
      result.telegram = true;
      logger.notificationSent("telegram", monitor.name, user.id);
    } catch (error) {
      logger.notificationFailed("telegram", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Webhook notification
  if (webhookUrl) {
    try {
      const success = await withRetry(() =>
        sendWebhookHttpMonitorDegradedAlert(webhookUrl, {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          status: monitor.status,
          statusCode: monitor.statusCode,
          responseTimeMs: monitor.responseTimeMs,
          maxResponseTimeMs: monitor.maxResponseTimeMs,
        })
      );
      result.webhook = success;
      if (success) {
        logger.notificationSent("webhook", monitor.name, user.id);
      }
    } catch (error) {
      logger.notificationFailed("webhook", monitor.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  return result;
}
