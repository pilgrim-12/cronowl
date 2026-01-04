"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

interface Activity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "user.registered", label: "User Registered" },
  { value: "user.login", label: "User Login" },
  { value: "check.created", label: "Check Created" },
  { value: "check.updated", label: "Check Updated" },
  { value: "check.deleted", label: "Check Deleted" },
  { value: "check.paused", label: "Check Paused" },
  { value: "check.resumed", label: "Check Resumed" },
  { value: "subscription.upgraded", label: "Subscription Upgraded" },
  { value: "subscription.downgraded", label: "Subscription Downgraded" },
  { value: "subscription.canceled", label: "Subscription Canceled" },
  { value: "apiKey.created", label: "API Key Created" },
  { value: "apiKey.revoked", label: "API Key Revoked" },
  { value: "statusPage.created", label: "Status Page Created" },
  { value: "statusPage.deleted", label: "Status Page Deleted" },
  { value: "settings.updated", label: "Settings Updated" },
];

export default function AdminActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActivity = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });

      if (actionFilter) params.set("action", actionFilter);
      if (userIdFilter) params.set("userId", userIdFilter);

      const response = await fetch(`/api/admin/activity?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity");
      }

      const data = await response.json();
      if (data.success) {
        setActivities(data.data.activities);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, actionFilter, userIdFilter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const formatAction = (action: string) => {
    const option = ACTION_OPTIONS.find((o) => o.value === action);
    return option?.label || action;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("user.")) return "text-blue-500";
    if (action.startsWith("check.")) return "text-purple-500";
    if (action.startsWith("subscription.")) return "text-green-500";
    if (action.startsWith("apiKey.")) return "text-orange-500";
    if (action.startsWith("statusPage.")) return "text-cyan-500";
    return "text-gray-500";
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith("user.")) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    if (action.startsWith("check.")) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    }
    if (action.startsWith("subscription.")) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    }
    if (action.startsWith("apiKey.")) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        {pagination && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total entries
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Filter by User ID..."
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(actionFilter || userIdFilter) && (
            <button
              onClick={() => {
                setActionFilter("");
                setUserIdFilter("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No activity found</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAction(activity.action)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">by</span>
                      <Link
                        href={`/admin/users/${activity.userId}`}
                        className="text-sm text-blue-500 hover:text-blue-600 truncate"
                      >
                        {activity.userEmail}
                      </Link>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {activity.metadata.checkName ? (
                          <span>Check: {String(activity.metadata.checkName)}</span>
                        ) : null}
                        {activity.metadata.previousPlan && activity.metadata.newPlan ? (
                          <span>
                            {String(activity.metadata.previousPlan)} → {String(activity.metadata.newPlan)}
                          </span>
                        ) : null}
                        {activity.metadata.apiKeyName ? (
                          <span>Key: {String(activity.metadata.apiKeyName)}</span>
                        ) : null}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      <span>{activity.timestamp ? formatDate(activity.timestamp) : "-"}</span>
                      {activity.ip && <span>IP: {activity.ip}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
