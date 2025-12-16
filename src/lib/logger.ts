// Structured logging for CronOwl
// In production, this can be extended to send to external services like Sentry, Datadog, etc.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  checkId?: string;
  checkName?: string;
  userId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formatted);
      }
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext, error?: Error) => log("error", message, context, error),

  // Specialized logging methods
  notificationSent: (type: "email" | "push" | "telegram" | "webhook", checkName: string, userId?: string) => {
    log("info", `Notification sent: ${type}`, { action: "notification_sent", checkName, userId, notificationType: type });
  },

  notificationFailed: (type: "email" | "push" | "telegram" | "webhook", checkName: string, error: Error, userId?: string) => {
    log("error", `Notification failed: ${type}`, { action: "notification_failed", checkName, userId, notificationType: type }, error);
  },

  checkStatusChange: (checkId: string, checkName: string, oldStatus: string, newStatus: string) => {
    log("info", `Check status changed: ${oldStatus} -> ${newStatus}`, {
      action: "status_change",
      checkId,
      checkName,
      oldStatus,
      newStatus,
    });
  },

  pingReceived: (checkId: string, checkName: string, ip: string, duration?: number) => {
    log("info", "Ping received", {
      action: "ping_received",
      checkId,
      checkName,
      ip,
      duration,
    });
  },

  rateLimitExceeded: (ip: string, endpoint: string) => {
    log("warn", "Rate limit exceeded", {
      action: "rate_limit",
      ip,
      endpoint,
    });
  },

  webhookValidationFailed: (url: string, reason: string) => {
    log("warn", "Webhook URL validation failed", {
      action: "webhook_validation_failed",
      url: url.substring(0, 50) + "...", // Truncate for security
      reason,
    });
  },
};
