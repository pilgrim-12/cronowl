"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

interface AdminStats {
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    byPlan: { free: number; starter: number; pro: number };
  };
  checks: {
    total: number;
    statusUp: number;
    statusDown: number;
    statusNew: number;
  };
  activity: {
    totalToday: number;
    recentActions: Array<{
      id: string;
      userId: string;
      userEmail: string;
      action: string;
      timestamp: string;
      details: Record<string, unknown>;
    }>;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error?.message || "Unknown error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const formatAction = (action: string) => {
    const actionLabels: Record<string, string> = {
      "user.registered": "User registered",
      "user.login": "User logged in",
      "check.created": "Check created",
      "check.updated": "Check updated",
      "check.deleted": "Check deleted",
      "check.paused": "Check paused",
      "check.resumed": "Check resumed",
      "subscription.upgraded": "Subscription upgraded",
      "subscription.downgraded": "Subscription downgraded",
      "subscription.canceled": "Subscription canceled",
      "apiKey.created": "API key created",
      "apiKey.revoked": "API key revoked",
      "statusPage.created": "Status page created",
      "statusPage.deleted": "Status page deleted",
      "settings.updated": "Settings updated",
    };
    return actionLabels[action] || action;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
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
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users.total}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-green-500">+{stats.users.newThisWeek}</span>
            <span className="text-gray-400">this week</span>
          </div>
        </div>

        {/* Active Today */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users.activeToday}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Checks */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.checks.total}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600 dark:text-gray-400">{stats.checks.statusUp} up</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600 dark:text-gray-400">{stats.checks.statusDown} down</span>
            </span>
          </div>
        </div>

        {/* Activity Today */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actions Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activity.totalToday}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Distribution */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users by Plan</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users.byPlan.free}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Free</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.users.byPlan.starter}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Starter</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.users.byPlan.pro}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pro</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {stats.activity.recentActions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No activity yet
            </div>
          ) : (
            stats.activity.recentActions.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatAction(activity.action)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.userEmail}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {activity.timestamp ? formatTimeAgo(activity.timestamp) : "-"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
