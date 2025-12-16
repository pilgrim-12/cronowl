// Unified notification system with retry logic
import { sendDownAlert, sendRecoveryAlert } from "./email";
import { sendPushNotification } from "./firebase-admin";
import { sendTelegramDownAlert, sendTelegramRecoveryAlert } from "./telegram";
import { sendWebhookDownAlert, sendWebhookRecoveryAlert } from "./webhook";
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

export interface CheckInfo {
  id: string;
  name: string;
  slug: string;
}

export interface UserInfo {
  id: string;
  email?: string;
  pushTokens?: string[];
  telegramChatId?: string;
}

export interface NotificationResult {
  email: boolean;
  push: boolean;
  telegram: boolean;
  webhook: boolean;
}

/**
 * Send all configured notifications for a DOWN event
 */
export async function sendDownNotifications(
  check: CheckInfo,
  user: UserInfo,
  webhookUrl?: string
): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: false,
    push: false,
    telegram: false,
    webhook: false,
  };

  // Email notification
  if (user.email) {
    try {
      await withRetry(() => sendDownAlert(user.email!, check.name));
      result.email = true;
      logger.notificationSent("email", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("email", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Push notification
  if (user.pushTokens && user.pushTokens.length > 0) {
    try {
      await withRetry(() =>
        sendPushNotification(user.pushTokens!, {
          title: `🔴 ${check.name} is DOWN`,
          body: `Your cron job "${check.name}" has not reported in and is now marked as down.`,
          data: {
            checkId: check.id,
            checkName: check.name,
            type: "down",
          },
        })
      );
      result.push = true;
      logger.notificationSent("push", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("push", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Telegram notification
  if (user.telegramChatId) {
    try {
      await withRetry(() => sendTelegramDownAlert(user.telegramChatId!, check.name));
      result.telegram = true;
      logger.notificationSent("telegram", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("telegram", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Webhook notification
  if (webhookUrl) {
    try {
      const success = await withRetry(() =>
        sendWebhookDownAlert(webhookUrl, {
          id: check.id,
          name: check.name,
          slug: check.slug,
          status: "down",
        })
      );
      result.webhook = success;
      if (success) {
        logger.notificationSent("webhook", check.name, user.id);
      }
    } catch (error) {
      logger.notificationFailed("webhook", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  return result;
}

/**
 * Send all configured notifications for a RECOVERY event
 */
export async function sendRecoveryNotifications(
  check: CheckInfo,
  user: UserInfo,
  webhookUrl?: string
): Promise<NotificationResult> {
  const result: NotificationResult = {
    email: false,
    push: false,
    telegram: false,
    webhook: false,
  };

  // Email notification
  if (user.email) {
    try {
      await withRetry(() => sendRecoveryAlert(user.email!, check.name));
      result.email = true;
      logger.notificationSent("email", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("email", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Push notification
  if (user.pushTokens && user.pushTokens.length > 0) {
    try {
      await withRetry(() =>
        sendPushNotification(user.pushTokens!, {
          title: `🟢 ${check.name} is BACK UP`,
          body: `Your cron job "${check.name}" has recovered and is now running normally.`,
          data: {
            checkId: check.id,
            checkName: check.name,
            type: "recovery",
          },
        })
      );
      result.push = true;
      logger.notificationSent("push", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("push", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Telegram notification
  if (user.telegramChatId) {
    try {
      await withRetry(() => sendTelegramRecoveryAlert(user.telegramChatId!, check.name));
      result.telegram = true;
      logger.notificationSent("telegram", check.name, user.id);
    } catch (error) {
      logger.notificationFailed("telegram", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  // Webhook notification
  if (webhookUrl) {
    try {
      const success = await withRetry(() =>
        sendWebhookRecoveryAlert(webhookUrl, {
          id: check.id,
          name: check.name,
          slug: check.slug,
          status: "up",
        })
      );
      result.webhook = success;
      if (success) {
        logger.notificationSent("webhook", check.name, user.id);
      }
    } catch (error) {
      logger.notificationFailed("webhook", check.name, error instanceof Error ? error : new Error(String(error)), user.id);
    }
  }

  return result;
}
