// Telegram Bot Integration for CronOwl
// Bot token should be stored in TELEGRAM_BOT_TOKEN environment variable

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export interface TelegramMessage {
  title: string;
  body: string;
  checkName?: string;
  type?: "down" | "recovery" | "slow";
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  message: TelegramMessage
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  const emoji = message.type === "down" ? "🔴" : message.type === "recovery" ? "🟢" : message.type === "slow" ? "🟡" : "📢";
  const text = `${emoji} *${escapeMarkdown(message.title)}*\n\n${escapeMarkdown(message.body)}`;

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

/**
 * Send down alert via Telegram
 */
export async function sendTelegramDownAlert(
  chatId: string,
  checkName: string
): Promise<boolean> {
  return sendTelegramMessage(chatId, {
    title: `${checkName} is DOWN`,
    body: `Your cron job "${checkName}" has missed its expected ping and is now marked as DOWN.`,
    checkName,
    type: "down",
  });
}

/**
 * Send recovery alert via Telegram
 */
export async function sendTelegramRecoveryAlert(
  chatId: string,
  checkName: string
): Promise<boolean> {
  return sendTelegramMessage(chatId, {
    title: `${checkName} is BACK UP`,
    body: `Your cron job "${checkName}" has recovered and is now running normally.`,
    checkName,
    type: "recovery",
  });
}

/**
 * Send slow job alert via Telegram
 */
export async function sendTelegramSlowJobAlert(
  chatId: string,
  checkName: string,
  duration: number,
  maxDuration: number
): Promise<boolean> {
  const durationSec = (duration / 1000).toFixed(1);
  const maxDurationSec = (maxDuration / 1000).toFixed(1);
  return sendTelegramMessage(chatId, {
    title: `${checkName} is SLOW`,
    body: `Your job "${checkName}" took ${durationSec}s (threshold: ${maxDurationSec}s)`,
    checkName,
    type: "slow",
  });
}

/**
 * Verify a Telegram chat ID by sending a test message
 */
export async function verifyTelegramChat(chatId: string): Promise<boolean> {
  return sendTelegramMessage(chatId, {
    title: "CronOwl Connected!",
    body: "Your Telegram account is now linked to CronOwl. You will receive alerts here when your cron jobs go down or recover.",
  });
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown(text: string): string {
  // Only escape characters that need escaping in Telegram Markdown
  // Note: [ ] don't need escaping in basic Markdown mode, only in MarkdownV2
  return text.replace(/[_*`]/g, "\\$&");
}

/**
 * Generate a unique linking code for a user
 */
export function generateLinkingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==================== HTTP Monitor Alerts ====================

export interface HttpMonitorTelegramData {
  name: string;
  url: string;
  method?: string;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  failedChecks?: number;
  downtimeDuration?: string;
  maxResponseTimeMs?: number;
}

/**
 * Send HTTP monitor down alert via Telegram
 */
export async function sendTelegramHttpMonitorDownAlert(
  chatId: string,
  data: HttpMonitorTelegramData
): Promise<boolean> {
  const statusText = data.statusCode
    ? `${data.statusCode} ${getStatusText(data.statusCode)}`
    : "Connection Failed";

  const methodPrefix = data.method ? `${data.method} ` : "";
  let body = `URL: ${methodPrefix}${data.url}\nStatus: ${statusText}`;
  if (data.responseTimeMs) {
    body += `\nResponse time: ${data.responseTimeMs}ms`;
  }
  if (data.failedChecks) {
    body += `\nFailed checks: ${data.failedChecks}`;
  }
  if (data.error) {
    body += `\nError: ${data.error}`;
  }

  return sendTelegramMessage(chatId, {
    title: `[DOWN] ${data.name}`,
    body,
    type: "down",
  });
}

/**
 * Send HTTP monitor recovery alert via Telegram
 */
export async function sendTelegramHttpMonitorRecoveryAlert(
  chatId: string,
  data: HttpMonitorTelegramData
): Promise<boolean> {
  const statusText = data.statusCode
    ? `${data.statusCode} ${getStatusText(data.statusCode)}`
    : "OK";

  const methodPrefix = data.method ? `${data.method} ` : "";
  let body = `URL: ${methodPrefix}${data.url}\nStatus: ${statusText}`;
  if (data.responseTimeMs) {
    body += `\nResponse time: ${data.responseTimeMs}ms`;
  }
  if (data.downtimeDuration) {
    body += `\nDowntime duration: ${data.downtimeDuration}`;
  }

  return sendTelegramMessage(chatId, {
    title: `[RECOVERED] ${data.name}`,
    body,
    type: "recovery",
  });
}

/**
 * Send HTTP monitor degraded alert via Telegram
 */
export async function sendTelegramHttpMonitorDegradedAlert(
  chatId: string,
  data: HttpMonitorTelegramData
): Promise<boolean> {
  const statusText = data.statusCode
    ? `${data.statusCode} ${getStatusText(data.statusCode)}`
    : "OK";

  const methodPrefix = data.method ? `${data.method} ` : "";
  let body = `URL: ${methodPrefix}${data.url}\nStatus: ${statusText}`;
  body += `\nResponse time: ${data.responseTimeMs}ms (threshold: ${data.maxResponseTimeMs}ms)`;

  return sendTelegramMessage(chatId, {
    title: `[DEGRADED] ${data.name}`,
    body,
    type: "slow",
  });
}

function getStatusText(code: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[code] || "Unknown";
}
