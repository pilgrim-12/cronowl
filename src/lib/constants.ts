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
