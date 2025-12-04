import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDownAlert(to: string, checkName: string) {
  try {
    await resend.emails.send({
      from: "CronOwl <onboarding@resend.dev>",
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
      from: "CronOwl <onboarding@resend.dev>",
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
