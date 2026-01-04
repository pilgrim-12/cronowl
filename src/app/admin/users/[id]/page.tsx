"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

interface UserDetail {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  isAdmin: boolean;
  subscription?: {
    status: string;
    plan: string;
    currentPeriodEnd?: string;
  };
  notificationSettings: {
    email: boolean;
    push: boolean;
    telegram: boolean;
    hasTelegram: boolean;
  };
  checks: Array<{
    id: string;
    name: string;
    status: string;
    paused: boolean;
    lastPing?: string;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt?: string;
  }>;
  statusPages: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    async function fetchUser() {
      if (!authUser) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();
        if (data.success) {
          setUserDetail(data.data);
          setSelectedPlan(data.data.plan);
        } else {
          throw new Error(data.error?.message || "Unknown error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [authUser, resolvedParams.id]);

  const handleUpdatePlan = async () => {
    if (!userDetail || selectedPlan === userDetail.plan) return;

    setActionLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();
      if (data.success) {
        setUserDetail({ ...userDetail, plan: selectedPlan });
        setShowPlanModal(false);
      } else {
        throw new Error(data.error?.message || "Failed to update plan");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!userDetail) return;

    setActionLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const action = userDetail.isBlocked ? "unblock" : "block";
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason: action === "block" ? blockReason : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUserDetail({
          ...userDetail,
          isBlocked: !userDetail.isBlocked,
          blockedReason: action === "block" ? blockReason : undefined,
        });
        setShowBlockConfirm(false);
        setBlockReason("");
      } else {
        throw new Error(data.error?.message || "Failed to update user status");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    const actionLabels: Record<string, string> = {
      "user.registered": "Registered",
      "user.login": "Logged in",
      "check.created": "Created check",
      "check.updated": "Updated check",
      "check.deleted": "Deleted check",
      "subscription.upgraded": "Upgraded subscription",
      "subscription.downgraded": "Downgraded subscription",
      "apiKey.created": "Created API key",
      "apiKey.revoked": "Revoked API key",
      "settings.updated": "Updated settings",
    };
    return actionLabels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      up: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      down: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      new: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    };
    return badges[status] || badges.new;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
        <button
          onClick={() => router.push("/admin/users")}
          className="text-blue-500 hover:text-blue-600"
        >
          &larr; Back to users
        </button>
      </div>
    );
  }

  if (!userDetail) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{userDetail.email}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">User ID: {userDetail.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userDetail.isAdmin && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
              Admin
            </span>
          )}
          {userDetail.isBlocked && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
              Blocked
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{userDetail.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Plan</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{userDetail.plan}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(userDetail.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Last Login</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(userDetail.lastLoginAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Last IP</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{userDetail.lastLoginIp || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Notifications</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {[
                    userDetail.notificationSettings.email && "Email",
                    userDetail.notificationSettings.push && "Push",
                    userDetail.notificationSettings.telegram && "Telegram",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Checks */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Checks ({userDetail.checks.length})
              </h2>
            </div>
            {userDetail.checks.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No checks</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {userDetail.checks.map((check) => (
                  <div key={check.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{check.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last ping: {formatDate(check.lastPing)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.paused && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                          Paused
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(check.status)}`}>
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Keys */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                API Keys ({userDetail.apiKeys.length})
              </h2>
            </div>
            {userDetail.apiKeys.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No API keys</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {userDetail.apiKeys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{key.name}</p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{key.keyPrefix}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last used: {formatDate(key.lastUsedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowPlanModal(true)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Change Plan
              </button>
              <button
                onClick={() => setShowBlockConfirm(true)}
                disabled={userDetail.isAdmin}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  userDetail.isBlocked
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {userDetail.isBlocked ? "Unblock User" : "Block User"}
              </button>
              {userDetail.isAdmin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Cannot block admin users
                </p>
              )}
            </div>
          </div>

          {/* Block info */}
          {userDetail.isBlocked && userDetail.blockedReason && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Block Reason</h3>
              <p className="text-sm text-red-600 dark:text-red-300">{userDetail.blockedReason}</p>
              {userDetail.blockedAt && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  Blocked on {formatDate(userDetail.blockedAt)}
                </p>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            {userDetail.recentActivity.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No activity</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-80 overflow-y-auto">
                {userDetail.recentActivity.map((activity) => (
                  <div key={activity.id} className="p-3">
                    <p className="text-sm text-gray-900 dark:text-white">{formatAction(activity.action)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Plan</h3>
            <div className="space-y-3">
              {["free", "starter", "pro"].map((plan) => (
                <label
                  key={plan}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                    selectedPlan === plan
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan}
                    checked={selectedPlan === plan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{plan}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={actionLoading || selectedPlan === userDetail.plan}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {userDetail.isBlocked ? "Unblock User" : "Block User"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {userDetail.isBlocked
                ? `Are you sure you want to unblock ${userDetail.email}?`
                : `Are you sure you want to block ${userDetail.email}? They will not be able to log in or use the API.`}
            </p>
            {!userDetail.isBlocked && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter reason for blocking..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockConfirm(false);
                  setBlockReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockToggle}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  userDetail.isBlocked
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {actionLoading ? "Processing..." : userDetail.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
