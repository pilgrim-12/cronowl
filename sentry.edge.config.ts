import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Only enable when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Debug mode for development
  debug: process.env.NODE_ENV === "development",
});
