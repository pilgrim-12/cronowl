// Webhook notification system for CronOwl
// Sends POST requests to user-configured URLs when check status changes

export interface WebhookPayload {
  event: "check.down" | "check.up" | "check.recovery";
  check: {
    id: string;
    name: string;
    slug: string;
    status: "up" | "down" | "new";
  };
  timestamp: string;
  message: string;
}

/**
 * Check if URL is a Slack webhook
 */
function isSlackWebhook(url: string): boolean {
  return url.includes("hooks.slack.com");
}

/**
 * Check if URL is a Discord webhook
 */
function isDiscordWebhook(url: string): boolean {
  return url.includes("discord.com/api/webhooks");
}

/**
 * Format payload for specific webhook service
 */
function formatPayloadForService(url: string, payload: WebhookPayload): unknown {
  if (isSlackWebhook(url)) {
    // Slack format with rich formatting
    const emoji = payload.event === "check.down" ? "🔴" : "🟢";
    const color = payload.event === "check.down" ? "#dc2626" : "#16a34a";
    return {
      attachments: [
        {
          color,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${emoji} *${payload.message}*`,
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Check: \`${payload.check.name}\` | Status: \`${payload.check.status}\` | ${payload.timestamp}`,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (isDiscordWebhook(url)) {
    // Discord format with embed
    const color = payload.event === "check.down" ? 0xdc2626 : 0x16a34a;
    return {
      embeds: [
        {
          title: payload.message,
          color,
          fields: [
            { name: "Check", value: payload.check.name, inline: true },
            { name: "Status", value: payload.check.status, inline: true },
          ],
          timestamp: payload.timestamp,
          footer: { text: "CronOwl" },
        },
      ],
    };
  }

  // Default: send full payload
  return payload;
}

/**
 * Send webhook notification to a URL
 * Returns true if successful, false otherwise
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const formattedPayload = formatPayloadForService(url, payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CronOwl/1.0",
        "X-CronOwl-Event": payload.event,
      },
      body: JSON.stringify(formattedPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Webhook timeout:", url);
    } else {
      console.error("Webhook error:", error);
    }
    return false;
  }
}

/**
 * Send down alert webhook
 */
export async function sendWebhookDownAlert(
  webhookUrl: string,
  check: { id: string; name: string; slug: string; status: "up" | "down" | "new" }
): Promise<boolean> {
  return sendWebhook(webhookUrl, {
    event: "check.down",
    check,
    timestamp: new Date().toISOString(),
    message: `Check "${check.name}" is DOWN - missed expected ping`,
  });
}

/**
 * Send recovery alert webhook
 */
export async function sendWebhookRecoveryAlert(
  webhookUrl: string,
  check: { id: string; name: string; slug: string; status: "up" | "down" | "new" }
): Promise<boolean> {
  return sendWebhook(webhookUrl, {
    event: "check.recovery",
    check,
    timestamp: new Date().toISOString(),
    message: `Check "${check.name}" is BACK UP - recovered and running normally`,
  });
}

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
