"use client";

import Link from "next/link";
import { PLANS, PlanType } from "@/lib/plans";

// Gumroad membership links
const GUMROAD_LINKS = {
  starter: "https://yurachernov.gumroad.com/l/rgaar",
  pro: "https://yurachernov.gumroad.com/l/rgaar",
} as const;

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function PricingCard({
  plan,
  planKey,
  isPopular = false
}: {
  plan: typeof PLANS[PlanType];
  planKey: PlanType;
  isPopular?: boolean;
}) {
  const isProPlan = planKey === "pro";
  const isPaidPlan = planKey === "starter" || planKey === "pro";

  const buttonClasses = `block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
    isPopular
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : isProPlan
      ? "bg-purple-600 text-white hover:bg-purple-700"
      : "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700"
  }`;

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 ${isPopular ? "ring-2 ring-blue-500" : ""}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-500 dark:text-gray-400">/month</span>
          )}
        </div>
        {plan.price === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Free forever</p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {isPaidPlan ? (
        <a
          href={GUMROAD_LINKS[planKey as keyof typeof GUMROAD_LINKS]}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
        >
          Subscribe
        </a>
      ) : (
        <Link href="/signup" className={buttonClasses}>
          Get Started
        </Link>
      )}
    </div>
  );
}
