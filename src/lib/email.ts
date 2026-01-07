import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDownAlert(to: string, checkName: string) {
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `🚨 Alert: ${checkName} is DOWN`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">🦉 CronOwl Alert</h1>
          <p style="font-size: 18px;">Your check <strong>${checkName}</strong> has not pinged in the expected time.</p>
          <p style="color: #666;">This usually means your cron job or scheduled task has stopped running.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendRecoveryAlert(to: string, checkName: string) {
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `✅ Recovered: ${checkName} is back UP`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">🦉 CronOwl Recovery</h1>
          <p style="font-size: 18px;">Good news! Your check <strong>${checkName}</strong> is working again.</p>
          <p style="color: #666;">We received a ping and the check is now marked as UP.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendSlowJobAlert(to: string, checkName: string, duration: number, maxDuration: number) {
  const durationSec = (duration / 1000).toFixed(1);
  const maxDurationSec = (maxDuration / 1000).toFixed(1);
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `⏱️ Slow Job: ${checkName} took ${durationSec}s`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">🦉 CronOwl Slow Job Alert</h1>
          <p style="font-size: 18px;">Your job <strong>${checkName}</strong> completed, but took longer than expected.</p>
          <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Duration:</strong> ${durationSec} seconds</p>
            <p style="margin: 8px 0 0 0;"><strong>Threshold:</strong> ${maxDurationSec} seconds</p>
          </div>
          <p style="color: #666;">This may indicate performance issues or an overloaded system.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send slow job email:", error);
    return false;
  }
}

export async function sendPaymentFailedAlert(to: string, planName: string) {
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `⚠️ Payment Failed - Action Required`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">🦉 CronOwl Payment Issue</h1>
          <p style="font-size: 18px;">We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
          <p style="color: #666;">Your subscription is currently past due. Please update your payment method to avoid service interruption.</p>
          <div style="margin: 24px 0;">
            <a href="https://cronowl.com/dashboard/settings" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Update Payment Method</a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you need assistance, please contact our support team.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send payment failed email:", error);
    return false;
  }
}

// ==================== HTTP Monitor Alerts ====================

export interface HttpMonitorAlertData {
  name: string;
  url: string;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  responseBody?: string;
  failedChecks?: number;
  downtimeDuration?: string;
  maxResponseTimeMs?: number;
}

export async function sendHttpMonitorDownAlert(to: string, data: HttpMonitorAlertData) {
  const statusText = data.statusCode ? `${data.statusCode} ${getStatusText(data.statusCode)}` : "Connection Failed";
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `🔴 [DOWN] ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">🦉 HTTP Monitor Alert</h1>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
            <h2 style="color: #ef4444; margin: 0 0 16px 0;">[DOWN] ${escapeHtml(data.name)}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">URL:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(data.url)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Status:</td>
                <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">${statusText}</td>
              </tr>
              ${data.responseTimeMs ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Response time:</td>
                <td style="padding: 8px 0; color: #333;">${data.responseTimeMs}ms</td>
              </tr>
              ` : ''}
              ${data.failedChecks ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Failed checks:</td>
                <td style="padding: 8px 0; color: #333;">${data.failedChecks}</td>
              </tr>
              ` : ''}
              ${data.error ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Error:</td>
                <td style="padding: 8px 0; color: #ef4444;">${escapeHtml(data.error)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          ${data.responseBody ? `
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Response preview:</p>
            <pre style="margin: 0; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${escapeHtml(data.responseBody)}</pre>
          </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send HTTP monitor down email:", error);
    return false;
  }
}

export async function sendHttpMonitorRecoveryAlert(to: string, data: HttpMonitorAlertData) {
  const statusText = data.statusCode ? `${data.statusCode} ${getStatusText(data.statusCode)}` : "OK";
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `🟢 [RECOVERED] ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">🦉 HTTP Monitor Recovery</h1>
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;">
            <h2 style="color: #22c55e; margin: 0 0 16px 0;">[RECOVERED] ${escapeHtml(data.name)}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">URL:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(data.url)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Status:</td>
                <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">${statusText}</td>
              </tr>
              ${data.responseTimeMs ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Response time:</td>
                <td style="padding: 8px 0; color: #333;">${data.responseTimeMs}ms</td>
              </tr>
              ` : ''}
              ${data.downtimeDuration ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Downtime:</td>
                <td style="padding: 8px 0; color: #333;">${data.downtimeDuration}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send HTTP monitor recovery email:", error);
    return false;
  }
}

export async function sendHttpMonitorDegradedAlert(to: string, data: HttpMonitorAlertData) {
  const statusText = data.statusCode ? `${data.statusCode} ${getStatusText(data.statusCode)}` : "OK";
  try {
    await resend.emails.send({
      from: "CronOwl <noreply@cronowl.com>",
      to,
      subject: `🟡 [DEGRADED] ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">🦉 HTTP Monitor Alert</h1>
          <div style="background: #fffbeb; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0;">
            <h2 style="color: #f97316; margin: 0 0 16px 0;">[DEGRADED] ${escapeHtml(data.name)}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">URL:</td>
                <td style="padding: 8px 0; color: #333;">${escapeHtml(data.url)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Status:</td>
                <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">${statusText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Response time:</td>
                <td style="padding: 8px 0; color: #f97316; font-weight: bold;">${data.responseTimeMs}ms (threshold: ${data.maxResponseTimeMs}ms)</td>
              </tr>
            </table>
          </div>
          <p style="color: #666;">The endpoint is responding but slower than expected. This may indicate performance issues.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 14px;">
            <a href="https://cronowl.com/dashboard" style="color: #3b82f6;">View Dashboard</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send HTTP monitor degraded email:", error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusText(code: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
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
