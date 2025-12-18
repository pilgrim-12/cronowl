"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { openCheckout, PaddlePlan } from "@/lib/paddle";
import { PLANS } from "@/lib/plans";
import Link from "next/link";

interface Subscription {
  status: "active" | "pending" | "canceled" | "past_due" | "paused";
  plan: "starter" | "pro";
  paddleSubscriptionId?: string;
  paddleCustomerId?: string;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
  effectiveEndDate?: Date;
}

interface SubscriptionManagerProps {
  userId: string;
  userEmail: string;
}

export function SubscriptionManager({ userId, userEmail }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<"free" | "starter" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PaddlePlan | null>(null);
  const [downgrading, setDowngrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSubscription = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCurrentPlan(data.plan || "free");
        if (data.subscription) {
          setSubscription({
            ...data.subscription,
            currentPeriodEnd: data.subscription.currentPeriodEnd?.toDate?.() || null,
            canceledAt: data.subscription.canceledAt?.toDate?.() || null,
            effectiveEndDate: data.subscription.effectiveEndDate?.toDate?.() || null,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const handleUpgrade = async (plan: PaddlePlan) => {
    setUpgrading(plan);
    setError(null);
    setSuccess(null);

    try {
      // If user has an active subscription, use API to upgrade
      if (subscription?.paddleSubscriptionId && subscription.status === "active") {
        const response = await fetch("/api/subscription/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, targetPlan: plan }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upgrade subscription");
        }

        setSuccess(`Successfully upgraded to ${plan}! Changes will apply shortly.`);
        // Reload subscription data after a short delay
        setTimeout(() => loadSubscription(), 2000);
      } else {
        // No active subscription, open checkout for new subscription
        await openCheckout(plan, userId, userEmail);
      }
    } catch (err) {
      console.error("Failed to upgrade:", err);
      setError(err instanceof Error ? err.message : "Failed to upgrade subscription");
    } finally {
      setUpgrading(null);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm("Are you sure you want to downgrade to Starter? You will keep Pro features until the end of your billing period.")) {
      return;
    }

    setDowngrading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetPlan: "starter" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to downgrade subscription");
      }

      setSuccess("Your plan will be downgraded to Starter at the end of the current billing period.");
      setTimeout(() => loadSubscription(), 2000);
    } catch (err) {
      console.error("Failed to downgrade:", err);
      setError(err instanceof Error ? err.message : "Failed to downgrade subscription");
    } finally {
      setDowngrading(false);
    }
  };

  const handleManageSubscription = () => {
    // Open Paddle customer portal
    // In sandbox, this would be: https://sandbox-customer-portal.paddle.com
    // In production: https://customer-portal.paddle.com
    const portalUrl = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
      ? "https://customer-portal.paddle.com"
      : "https://sandbox-customer-portal.paddle.com";

    window.open(portalUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!subscription) return null;

    const statusColors: Record<string, string> = {
      active: "bg-green-500/10 text-green-400 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      canceled: "bg-red-500/10 text-red-400 border-red-500/20",
      past_due: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      paused: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };

    const statusLabels: Record<string, string> = {
      active: "Active",
      pending: "Pending",
      canceled: "Canceled",
      past_due: "Past Due",
      paused: "Paused",
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[subscription.status]}`}>
        {statusLabels[subscription.status]}
      </span>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Subscription
      </h2>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{PLANS[currentPlan].name} Plan</span>
            {getStatusBadge()}
          </div>
          <span className="text-gray-400">
            ${PLANS[currentPlan].price}/month
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          {currentPlan === "free" ? (
            <span>{PLANS.free.checksLimit} checks included</span>
          ) : currentPlan === "starter" ? (
            <span>{PLANS.starter.checksLimit} checks included</span>
          ) : (
            <span>Unlimited checks</span>
          )}
        </div>
        {subscription?.currentPeriodEnd && subscription.status === "active" && (
          <div className="text-gray-500 text-xs mt-2">
            Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}
        {subscription?.status === "canceled" && subscription.effectiveEndDate && (
          <div className="text-yellow-400 text-xs mt-2">
            Access until {new Date(subscription.effectiveEndDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Upgrade Options */}
      {currentPlan === "free" && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm mb-3">Upgrade to get more features:</p>

          {/* Starter Plan */}
          <div className="border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">Starter</span>
                <span className="text-gray-400 text-sm ml-2">${PLANS.starter.price}/month</span>
              </div>
              <button
                onClick={() => handleUpgrade("starter")}
                disabled={upgrading === "starter"}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {upgrading === "starter" ? "Loading..." : "Upgrade"}
              </button>
            </div>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• {PLANS.starter.checksLimit} checks</li>
              <li>• {PLANS.starter.historyDays} days history</li>
              <li>• Webhooks & Slack integration</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-colors bg-purple-500/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">Pro</span>
                <span className="text-gray-400 text-sm ml-2">${PLANS.pro.price}/month</span>
              </div>
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={upgrading === "pro"}
                className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {upgrading === "pro" ? "Loading..." : "Upgrade"}
              </button>
            </div>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Unlimited checks</li>
              <li>• {PLANS.pro.historyDays} days history</li>
              <li>• Team members (3 users)</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
      )}

      {/* Upgrade from Starter to Pro */}
      {currentPlan === "starter" && (
        <div className="space-y-3">
          <div className="border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-colors bg-purple-500/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">Upgrade to Pro</span>
                <span className="text-gray-400 text-sm ml-2">${PLANS.pro.price}/month</span>
              </div>
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={upgrading === "pro"}
                className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {upgrading === "pro" ? "Loading..." : "Upgrade"}
              </button>
            </div>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Unlimited checks (currently {PLANS.starter.checksLimit})</li>
              <li>• {PLANS.pro.historyDays} days history (currently {PLANS.starter.historyDays})</li>
              <li>• Team members (3 users)</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
      )}

      {/* Downgrade from Pro to Starter */}
      {currentPlan === "pro" && subscription?.status === "active" && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">You&apos;re on the highest plan!</p>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-gray-300 font-medium">Downgrade to Starter</span>
                <span className="text-gray-500 text-sm ml-2">${PLANS.starter.price}/month</span>
              </div>
              <button
                onClick={handleDowngrade}
                disabled={downgrading}
                className="bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {downgrading ? "Processing..." : "Downgrade"}
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              You&apos;ll keep Pro features until the end of your billing period.
            </p>
          </div>
        </div>
      )}

      {/* Manage Subscription */}
      {subscription && (subscription.status === "active" || subscription.status === "past_due") && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <button
            onClick={handleManageSubscription}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Manage subscription on Paddle
          </button>
          <p className="text-gray-500 text-xs mt-1">
            Update payment method, cancel, or view invoices
          </p>
        </div>
      )}

      {/* Past Due Warning */}
      {subscription?.status === "past_due" && (
        <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-orange-400 text-sm font-medium">Payment Failed</p>
              <p className="text-gray-400 text-xs mt-1">
                Please update your payment method to continue your subscription.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compare Plans Link */}
      <div className="mt-4 text-center">
        <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm">
          Compare all plans →
        </Link>
      </div>
    </div>
  );
}
