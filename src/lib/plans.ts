export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    checksLimit: 25,
    historyDays: 7,
    features: [
      "25 checks",
      "Email alerts",
      "Push notifications",
      "Telegram alerts",
      "7 days history",
    ],
  },
  starter: {
    name: "Starter",
    price: 4,
    checksLimit: 100,
    historyDays: 30,
    features: [
      "100 checks",
      "Everything in Free",
      "Webhooks",
      "Slack integration",
      "30 days history",
    ],
  },
  pro: {
    name: "Pro",
    price: 9,
    checksLimit: Infinity,
    historyDays: 90,
    features: [
      "Unlimited checks",
      "Everything in Starter",
      "90 days history",
      "API access",
      "Team members (3 users)",
      "Priority support",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}

export function getPlanByChecksNeeded(checksCount: number): PlanType {
  if (checksCount <= PLANS.free.checksLimit) return "free";
  if (checksCount <= PLANS.starter.checksLimit) return "starter";
  return "pro";
}
