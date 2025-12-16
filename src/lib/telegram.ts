// Telegram Bot Integration for CronOwl
// Bot token should be stored in TELEGRAM_BOT_TOKEN environment variable

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export interface TelegramMessage {
  title: string;
  body: string;
  checkName?: string;
  type?: "down" | "recovery";
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

  const emoji = message.type === "down" ? "🔴" : message.type === "recovery" ? "🟢" : "📢";
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
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
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
