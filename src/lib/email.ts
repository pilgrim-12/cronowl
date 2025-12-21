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
