export const SCHEDULE_MINUTES: Record<string, number> = {
  "every 1 minute": 1,
  "every 2 minutes": 2,
  "every 5 minutes": 5,
  "every 10 minutes": 10,
  "every 15 minutes": 15,
  "every 30 minutes": 30,
  "every hour": 60,
  "every 2 hours": 120,
  "every 6 hours": 360,
  "every 12 hours": 720,
  "every day": 1440,
  "every week": 10080,
};

export const SCHEDULE_OPTIONS = [
  { value: "every 1 minute", label: "1m", group: "minutes" },
  { value: "every 2 minutes", label: "2m", group: "minutes" },
  { value: "every 5 minutes", label: "5m", group: "minutes" },
  { value: "every 10 minutes", label: "10m", group: "minutes" },
  { value: "every 15 minutes", label: "15m", group: "minutes" },
  { value: "every 30 minutes", label: "30m", group: "minutes" },
  { value: "every hour", label: "1h", group: "hours" },
  { value: "every 2 hours", label: "2h", group: "hours" },
  { value: "every 6 hours", label: "6h", group: "hours" },
  { value: "every 12 hours", label: "12h", group: "hours" },
  { value: "every day", label: "1d", group: "days" },
  { value: "every week", label: "1w", group: "days" },
];

// Common cron expression presets
export const CRON_PRESETS = [
  { value: "* * * * *", label: "Every minute" },
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "*/10 * * * *", label: "Every 10 minutes" },
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 */2 * * *", label: "Every 2 hours" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
  { value: "0 */12 * * *", label: "Every 12 hours" },
  { value: "0 0 * * *", label: "Every day at midnight" },
  { value: "0 0 * * 1", label: "Every Monday at midnight" },
  { value: "0 0 1 * *", label: "First of every month" },
];

// Popular timezones grouped by region
export const TIMEZONE_OPTIONS = [
  // UTC
  { value: "UTC", label: "UTC", group: "UTC" },

  // Americas
  { value: "America/New_York", label: "New York (EST/EDT)", group: "Americas" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)", group: "Americas" },
  { value: "America/Denver", label: "Denver (MST/MDT)", group: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)", group: "Americas" },
  { value: "America/Toronto", label: "Toronto", group: "Americas" },
  { value: "America/Vancouver", label: "Vancouver", group: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo", group: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City", group: "Americas" },

  // Europe
  { value: "Europe/London", label: "London (GMT/BST)", group: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", group: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", group: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam", group: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", group: "Europe" },
  { value: "Europe/Kiev", label: "Kyiv", group: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", group: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", group: "Europe" },

  // Asia
  { value: "Asia/Tokyo", label: "Tokyo (JST)", group: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", group: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", group: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", group: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", group: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai/Kolkata (IST)", group: "Asia" },
  { value: "Asia/Dubai", label: "Dubai", group: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok", group: "Asia" },

  // Australia/Pacific
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", group: "Pacific" },
  { value: "Australia/Melbourne", label: "Melbourne", group: "Pacific" },
  { value: "Australia/Perth", label: "Perth", group: "Pacific" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)", group: "Pacific" },
];
