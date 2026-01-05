export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    checksLimit: 25,
    historyDays: 7,
    apiKeysLimit: 1,
    webhooksPerCheck: 0, // Webhooks only for paid plans
    statusPagesLimit: 1,
    logOutputSize: 1024, // 1KB
    teamMembers: 0,
    customBranding: false, // Custom branding only for Pro
    activeIncidentsLimit: 1, // Max active incidents per status page
    features: [
      "25 checks",
      "Email alerts",
      "Push notifications",
      "Telegram alerts",
      "7 days history",
      "1 status page",
    ],
  },
  starter: {
    name: "Starter",
    price: 5,
    checksLimit: 100,
    historyDays: 30,
    apiKeysLimit: 3,
    webhooksPerCheck: 3,
    statusPagesLimit: 3,
    logOutputSize: 5120, // 5KB
    teamMembers: 0,
    customBranding: false,
    activeIncidentsLimit: 3,
    features: [
      "100 checks",
      "Everything in Free",
      "Webhooks",
      "Slack integration",
      "30 days history",
      "3 status pages",
    ],
  },
  pro: {
    name: "Pro",
    price: 10,
    checksLimit: 500,
    historyDays: 90,
    apiKeysLimit: 10,
    webhooksPerCheck: 10,
    statusPagesLimit: 10,
    logOutputSize: 10240, // 10KB
    teamMembers: 3,
    customBranding: true, // Custom branding available
    activeIncidentsLimit: 100, // Effectively unlimited
    features: [
      "500 checks",
      "Everything in Starter",
      "90 days history",
      "10 status pages",
      "Team members (3 users)",
      "Custom branding",
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
