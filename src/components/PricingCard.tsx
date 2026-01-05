"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { openCheckout, PaddlePlan } from "@/lib/paddle";
import { PLANS, PlanType } from "@/lib/plans";
import { useConfirm } from "@/components/ConfirmDialog";

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Plan order for comparison
const PLAN_ORDER: Record<PlanType, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

interface ScheduledChange {
  plan: PlanType | null;
  effectiveAt: Date | null;
  action: "downgrade" | "cancel" | null;
}

export function PricingCard({
  plan,
  planKey,
  isPopular = false,
  currentPlan,
  hasActiveSubscription = false,
  scheduledChange = null,
}: {
  plan: typeof PLANS[PlanType];
  planKey: PlanType;
  isPopular?: boolean;
  currentPlan?: PlanType;
  hasActiveSubscription?: boolean;
  scheduledChange?: ScheduledChange | null;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const isProPlan = planKey === "pro";
  const isPaidPlan = planKey === "starter" || planKey === "pro";

  // Determine relationship to current plan
  const isCurrentPlan = currentPlan === planKey;
  const isUpgrade = currentPlan ? PLAN_ORDER[planKey] > PLAN_ORDER[currentPlan] : false;
  const isDowngrade = currentPlan ? PLAN_ORDER[planKey] < PLAN_ORDER[currentPlan] : false;

  // Check if this plan is the scheduled target
  const isScheduledTarget = scheduledChange?.plan === planKey;
  const hasScheduledChange = scheduledChange !== null && scheduledChange.effectiveAt !== null;

  const handleUpgrade = async () => {
    if (!user) {
      router.push(`/signup?plan=${planKey}`);
      return;
    }

    setIsLoading(true);
    try {
      if (hasActiveSubscription) {
        // Use API to upgrade existing subscription
        const response = await fetch("/api/subscription/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, targetPlan: planKey }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to upgrade");
        }

        // Reload page to show updated plan
        window.location.reload();
      } else {
        // Open Paddle checkout for new subscription
        await openCheckout(planKey as PaddlePlan, user.uid, user.email || "");
      }
    } catch (error) {
      console.error("Failed to upgrade:", error);
      alert(error instanceof Error ? error.message : "Failed to upgrade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;

    if (planKey === "free") {
      // Cancel subscription
      const confirmed = await confirm({
        title: "Cancel Subscription",
        message: "Are you sure you want to cancel? You'll keep access until the end of your billing period, then downgrade to Free.",
        confirmText: "Cancel Subscription",
        cancelText: "Keep Plan",
        variant: "danger",
      });
      if (!confirmed) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/subscription/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to cancel");
        }

        window.location.reload();
      } catch (error) {
        console.error("Failed to cancel:", error);
        alert(error instanceof Error ? error.message : "Failed to cancel. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Downgrade to starter
      const confirmed = await confirm({
        title: "Downgrade to Starter",
        message: "You'll keep Pro features until the end of your billing period, then switch to Starter.",
        confirmText: "Downgrade",
        cancelText: "Keep Pro",
        variant: "warning",
      });
      if (!confirmed) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/subscription/downgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, targetPlan: "starter" }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to downgrade");
        }

        window.location.reload();
      } catch (error) {
        console.error("Failed to downgrade:", error);
        alert(error instanceof Error ? error.message : "Failed to downgrade. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClick = async () => {
    // Not logged in - redirect to signup
    if (!user) {
      if (planKey === "free") {
        router.push("/signup");
      } else {
        router.push(`/signup?plan=${planKey}`);
      }
      return;
    }

    // Current plan - go to settings
    if (isCurrentPlan) {
      router.push("/settings");
      return;
    }

    // Upgrade
    if (isUpgrade) {
      await handleUpgrade();
      return;
    }

    // Downgrade
    if (isDowngrade) {
      await handleDowngrade();
      return;
    }

    // No current plan info - default behavior
    if (planKey === "free") {
      router.push("/signup");
    } else {
      await handleUpgrade();
    }
  };

  // Determine button text and style
  const getButtonConfig = () => {
    if (isLoading) {
      return {
        text: (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ),
        className: "bg-gray-400 text-white cursor-wait",
      };
    }

    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        className: "bg-green-600 text-white cursor-default",
        disabled: true,
      };
    }

    // If this plan is already scheduled, show "Scheduled" instead of action
    if (isScheduledTarget) {
      return {
        text: "Scheduled",
        className: "bg-yellow-600 text-white cursor-default",
        disabled: true,
      };
    }

    // If there's already a scheduled change, disable downgrade buttons
    if (hasScheduledChange && isDowngrade) {
      return {
        text: planKey === "free" ? "Cancel Subscription" : "Downgrade",
        className: "bg-gray-400 text-white cursor-not-allowed",
        disabled: true,
      };
    }

    if (isUpgrade) {
      return {
        text: "Upgrade",
        className: isProPlan
          ? "bg-purple-600 text-white hover:bg-purple-700"
          : "bg-blue-600 text-white hover:bg-blue-700",
      };
    }

    if (isDowngrade) {
      return {
        text: planKey === "free" ? "Cancel Subscription" : "Downgrade",
        className: planKey === "free"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-gray-600 text-white hover:bg-gray-700",
      };
    }

    // Default for non-logged in users
    if (plan.price === 0) {
      return {
        text: "Get Started",
        className: "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700",
      };
    }

    return {
      text: "Start Free Trial",
      className: isPopular
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : isProPlan
        ? "bg-purple-600 text-white hover:bg-purple-700"
        : "bg-blue-600 text-white hover:bg-blue-700",
    };
  };

  const buttonConfig = getButtonConfig();

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 ${isPopular && !isCurrentPlan && !isScheduledTarget ? "ring-2 ring-blue-500" : ""} ${isCurrentPlan ? "ring-2 ring-green-500" : ""} ${isScheduledTarget && !isCurrentPlan ? "ring-2 ring-yellow-500" : ""}`}>
        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-green-500 text-white text-sm font-medium px-4 py-1 rounded-full">
              Current Plan
            </span>
          </div>
        )}

        {/* Scheduled Target Badge */}
        {isScheduledTarget && !isCurrentPlan && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-yellow-500 text-black text-sm font-medium px-4 py-1 rounded-full">
              Switching Soon
            </span>
          </div>
        )}

        {/* Most Popular Badge (only if not current plan and not scheduled) */}
        {isPopular && !isCurrentPlan && !isScheduledTarget && (
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

        <button
          onClick={handleClick}
          disabled={isLoading || buttonConfig.disabled}
          className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonConfig.className}`}
        >
          {buttonConfig.text}
        </button>

        {/* Scheduled change notice on current plan */}
        {isCurrentPlan && hasScheduledChange && scheduledChange?.effectiveAt && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 text-xs text-center">
              Switching to {scheduledChange.plan === "free" ? "Free" : (scheduledChange.plan ? scheduledChange.plan.charAt(0).toUpperCase() + scheduledChange.plan.slice(1) : "Unknown")} on {formatDate(scheduledChange.effectiveAt)}
            </p>
          </div>
        )}

        {/* Scheduled target notice */}
        {isScheduledTarget && !isCurrentPlan && scheduledChange?.effectiveAt && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 text-xs text-center">
              Starting {formatDate(scheduledChange.effectiveAt)}
            </p>
          </div>
        )}

        {/* Manage link for current paid plan */}
        {isCurrentPlan && isPaidPlan && !hasScheduledChange && (
          <Link
            href="/settings"
            className="block text-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mt-3"
          >
            Manage subscription →
          </Link>
        )}
      </div>
      {ConfirmDialog}
    </>
  );
}
