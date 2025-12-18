"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { openCheckout, PaddlePlan } from "@/lib/paddle";
import { PLANS, PlanType } from "@/lib/plans";

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
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isProPlan = planKey === "pro";
  const isPaidPlan = planKey === "starter" || planKey === "pro";

  const handleClick = async () => {
    if (planKey === "free") {
      router.push("/signup");
      return;
    }

    // For paid plans, check if user is logged in
    if (!user) {
      // Redirect to signup with plan info
      router.push(`/signup?plan=${planKey}`);
      return;
    }

    // User is logged in, open Paddle checkout
    setIsLoading(true);
    try {
      await openCheckout(planKey as PaddlePlan, user.uid, user.email || "");
    } catch (error) {
      console.error("Failed to open checkout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-2xl p-8 ${isPopular ? "ring-2 ring-blue-500" : ""}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-400">/month</span>
          )}
        </div>
        {plan.price === 0 && (
          <p className="text-gray-400 text-sm mt-1">Free forever</p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : isProPlan
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        ) : plan.price === 0 ? (
          "Get Started"
        ) : (
          "Start Free Trial"
        )}
      </button>
    </div>
  );
}
