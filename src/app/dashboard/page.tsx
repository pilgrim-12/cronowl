"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  Ping,
  StatusEvent,
  ScheduleType,
  getUserChecks,
  createCheck,
  deleteCheck,
  updateCheck,
  removeWebhookUrl,
  getCheckPings,
  getStatusHistory,
  calculateRealStatus,
  canCreateCheck,
  CheckLimitResult,
  CreateCheckData,
  describeCronExpression,
  isValidCronExpression,
  getNextRunTime,
} from "@/lib/checks";
import { PLANS } from "@/lib/plans";
import { SCHEDULE_OPTIONS, CRON_PRESETS, TIMEZONE_OPTIONS } from "@/lib/constants";
import Link from "next/link";
import { InstallPrompt } from "@/components/InstallPrompt";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { Header } from "@/components/Header";
import { OwlLogo } from "@/components/OwlLogo";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [pings, setPings] = useState<Record<string, Ping[]>>({});
  const [statusHistory, setStatusHistory] = useState<Record<string, StatusEvent[]>>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cronowl-view-mode") as "list" | "grid") || "list";
    }
    return "list";
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("cronowl-refresh-interval")) || 30;
    }
    return 30;
  });
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [planUsage, setPlanUsage] = useState<CheckLimitResult | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("cronowl-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("cronowl-refresh-interval", String(refreshInterval));
  }, [refreshInterval]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadChecks = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) {
      setLoadingChecks(true);
    }
    try {
      const userChecks = await getUserChecks(user.uid);
      setChecks(userChecks);
      setLastUpdated(new Date());
      // Load plan usage
      const usage = await canCreateCheck(user.uid);
      setPlanUsage(usage);
    } catch (error) {
      console.error("Failed to load checks:", error);
    } finally {
      if (!silent) {
        setLoadingChecks(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    loadChecks();
    setCountdown(refreshInterval);

    // Countdown timer (every second)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadChecks(true);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [user, loadChecks, refreshInterval]);

  const loadPings = async (checkId: string) => {
    try {
      const checkPings = await getCheckPings(checkId);
      setPings((prev) => ({ ...prev, [checkId]: checkPings }));
    } catch (error) {
      console.error("Failed to load pings:", error);
    }
  };

  const loadStatusHistory = async (checkId: string) => {
    try {
      const history = await getStatusHistory(checkId);
      setStatusHistory((prev) => ({ ...prev, [checkId]: history }));
    } catch (error) {
      console.error("Failed to load status history:", error);
    }
  };

  const toggleExpand = (checkId: string) => {
    if (expandedCheck === checkId) {
      setExpandedCheck(null);
    } else {
      setExpandedCheck(checkId);
      // Always reload data when expanding to get fresh metrics
      loadPings(checkId);
      loadStatusHistory(checkId);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  };

  // Helper to display schedule info
  const getScheduleDisplay = (check: Check): string => {
    if (check.scheduleType === "cron" && check.cronExpression) {
      return describeCronExpression(check.cronExpression);
    }
    return check.schedule || "Unknown";
  };

  const handleCreateCheck = async (data: CreateCheckData) => {
    if (!user) return;
    setLimitError(null);
    try {
      // Check if user can create more checks
      const limitCheck = await canCreateCheck(user.uid);
      if (!limitCheck.allowed) {
        setLimitError(limitCheck.reason || "Check limit reached");
        return;
      }
      await createCheck(user.uid, data);
      await loadChecks();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create check:", error);
    }
  };

  const handleEditCheck = async (data: CreateCheckData) => {
    if (!editingCheck) return;
    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        scheduleType: data.scheduleType,
        schedule: data.schedule || "",
        timezone: data.timezone,
        gracePeriod: data.gracePeriod,
      };

      if (data.scheduleType === "cron" && data.cronExpression) {
        updateData.cronExpression = data.cronExpression;
      }

      if (data.webhookUrl) {
        updateData.webhookUrl = data.webhookUrl;
      }

      await updateCheck(editingCheck.id, updateData);

      // Remove webhook URL if it was cleared
      if (!data.webhookUrl && editingCheck.webhookUrl) {
        await removeWebhookUrl(editingCheck.id);
      }

      await loadChecks();
      setEditingCheck(null);
    } catch (error) {
      console.error("Failed to update check:", error);
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (!confirm("Are you sure you want to delete this check?")) return;
    try {
      await deleteCheck(checkId);
      await loadChecks();
    } catch (error) {
      console.error("Failed to delete check:", error);
    }
  };

  const getStatusColor = (check: Check) => {
    const realStatus = calculateRealStatus(check);
    switch (realStatus) {
      case "up":
        return "bg-green-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPingUrl = (slug: string) => {
    return `${window.location.origin}/api/ping/${slug}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} signOut={signOut} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <EmailVerificationBanner />

        {/* Plan Usage Banner */}
        {planUsage && (
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">
                    {PLANS[planUsage.plan].name} Plan
                  </span>
                  {planUsage.plan === "free" && (
                    <Link
                      href="/pricing"
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded transition-colors"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          planUsage.current / planUsage.limit > 0.9
                            ? "bg-red-500"
                            : planUsage.current / planUsage.limit > 0.7
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min((planUsage.current / planUsage.limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    {planUsage.current} / {planUsage.limit === Infinity ? "∞" : planUsage.limit} checks
                  </span>
                </div>
              </div>
              {planUsage.current / planUsage.limit > 0.8 && planUsage.plan === "free" && (
                <div className="text-yellow-400 text-sm">
                  Running low on checks!{" "}
                  <Link href="/pricing" className="underline hover:text-yellow-300">
                    Upgrade now
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Limit Error Alert */}
        {limitError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400">{limitError}</p>
                <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
                  View pricing plans →
                </Link>
              </div>
              <button
                onClick={() => setLimitError(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Your Checks</h2>
            {lastUpdated && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-500 text-xs">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 sm:w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / refreshInterval) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs tabular-nums">{countdown}s</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Refresh interval - scrollable on mobile */}
            <div className="flex bg-gray-800 rounded-lg p-1 gap-0.5 overflow-x-auto max-w-full">
              {[
                { value: 5, label: "5s" },
                { value: 10, label: "10s" },
                { value: 15, label: "15s" },
                { value: 30, label: "30s" },
                { value: 60, label: "1m" },
                { value: 120, label: "2m" },
                { value: 300, label: "5m" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRefreshInterval(option.value);
                    setCountdown(option.value);
                  }}
                  className={`px-1.5 sm:px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                    refreshInterval === option.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 sm:px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 sm:px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>

            {/* New Check button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              + New Check
            </button>
          </div>
        </div>

        {loadingChecks ? (
          <div className="text-gray-400 text-center py-8">
            Loading checks...
          </div>
        ) : checks.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <OwlLogo className="w-20 h-20" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No checks yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first check to start monitoring your cron jobs
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 transition-colors"
            >
              Create your first check
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(
                        check
                      )}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{check.name}</h3>
                        {check.webhookUrl && (
                          <span title="Webhook configured" className="text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {getScheduleDisplay(check)} • {check.gracePeriod}min grace
                        {check.scheduleType === "cron" && (
                          <span className="ml-2 text-xs text-blue-400 font-mono">
                            ({check.cronExpression})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(getPingUrl(check.slug))}
                      className="text-gray-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1 bg-gray-800 rounded"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => toggleExpand(check.id)}
                      className="text-gray-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      {expandedCheck === check.id ? "Hide" : "History"}
                    </button>
                    <button
                      onClick={() => setEditingCheck(check)}
                      className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCheck(check.id)}
                      className="text-red-400 hover:text-red-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 bg-gray-800 rounded p-2">
                  <code className="text-green-400 text-sm break-all">
                    {getPingUrl(check.slug)}
                  </code>
                </div>
                <div className="flex items-center gap-4 text-gray-500 text-xs mt-2">
                  <span>
                    Last ping:{" "}
                    {check.lastPing
                      ? new Date(check.lastPing.toDate()).toLocaleString()
                      : "Never"}
                  </span>
                  {check.lastDuration !== undefined && (
                    <span className="text-blue-400">
                      {check.lastDuration < 1000
                        ? `${check.lastDuration}ms`
                        : `${(check.lastDuration / 1000).toFixed(1)}s`}
                    </span>
                  )}
                </div>

                {/* Expanded History Section */}
                {expandedCheck === check.id && (
                  <div className="mt-4 border-t border-gray-800 pt-4">
                    {/* Duration Graph */}
                    {pings[check.id] && pings[check.id].some(p => p.duration !== undefined) && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Execution Time
                        </h4>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-end gap-1 h-16">
                            {pings[check.id]
                              .filter(p => p.duration !== undefined)
                              .slice(0, 20)
                              .reverse()
                              .map((ping, i, arr) => {
                                const maxDuration = Math.max(...arr.map(p => p.duration || 0));
                                const height = maxDuration > 0 ? ((ping.duration || 0) / maxDuration) * 100 : 0;
                                return (
                                  <div
                                    key={ping.id}
                                    className={`flex-1 rounded-t transition-all ${
                                      ping.status === "failure" ? "bg-red-500" : "bg-blue-500"
                                    }`}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                    title={`${ping.duration}ms - ${new Date(ping.timestamp.toDate()).toLocaleString()}`}
                                  />
                                );
                              })}
                          </div>
                          <div className="flex justify-between text-gray-500 text-xs mt-2">
                            <span>Older</span>
                            <span>
                              Avg: {Math.round(
                                pings[check.id]
                                  .filter(p => p.duration !== undefined)
                                  .reduce((sum, p) => sum + (p.duration || 0), 0) /
                                pings[check.id].filter(p => p.duration !== undefined).length
                              )}ms
                            </span>
                            <span>Recent</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status History Timeline */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Status History
                      </h4>
                      {!statusHistory[check.id] ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : statusHistory[check.id].length === 0 ? (
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <p className="text-gray-500 text-sm">No status changes recorded yet</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {statusHistory[check.id].slice(0, 10).map((event) => (
                            <div
                              key={event.id}
                              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                                event.status === "up"
                                  ? "bg-green-500/10 border border-green-500/20"
                                  : "bg-red-500/10 border border-red-500/20"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  event.status === "up" ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className={`text-xs font-medium ${
                                  event.status === "up" ? "text-green-400" : "text-red-400"
                                }`}>
                                  {event.status === "up" ? "UP" : "DOWN"}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(event.timestamp.toDate()).toLocaleDateString()}{" "}
                                  {new Date(event.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              {event.duration && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ml-1 ${
                                    event.status === "up"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-green-500/20 text-green-400"
                                  }`}
                                  title={event.status === "up" ? "Downtime duration" : "Uptime duration"}
                                >
                                  {formatDuration(event.duration)}
                                </span>
                              )}
                            </div>
                          ))}
                          {statusHistory[check.id].length > 10 && (
                            <div className="flex items-center text-gray-500 text-xs px-3">
                              +{statusHistory[check.id].length - 10} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recent Pings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Recent Pings
                      </h4>
                      {!pings[check.id] ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : pings[check.id].length === 0 ? (
                        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                          <p className="text-gray-500 text-sm">No pings received yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {pings[check.id].slice(0, 10).map((ping) => (
                            <div
                              key={ping.id}
                              className={`bg-gray-800 rounded-lg px-2 sm:px-3 py-2 text-center border ${
                                ping.status === "failure"
                                  ? "border-red-500/30"
                                  : ping.status === "success"
                                    ? "border-green-500/30"
                                    : "border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {ping.status && (
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    ping.status === "failure" ? "bg-red-500" : "bg-green-500"
                                  }`} />
                                )}
                                <span className="text-gray-300 text-xs sm:text-sm">
                                  {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(ping.timestamp.toDate()).toLocaleDateString()}
                              </div>
                              {ping.duration !== undefined && (
                                <div className="text-blue-400 text-xs mt-1">
                                  {ping.duration < 1000
                                    ? `${ping.duration}ms`
                                    : `${(ping.duration / 1000).toFixed(1)}s`}
                                </div>
                              )}
                              {ping.exitCode !== undefined && ping.exitCode !== 0 && (
                                <div className="text-red-400 text-xs">
                                  exit: {ping.exitCode}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checks.map((check) => (
              <div
                key={check.id}
                className="bg-gray-900 rounded-lg p-4 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusColor(check)}`}
                  />
                  <h3 className="text-white font-medium truncate flex-1">
                    {check.name}
                  </h3>
                  {check.webhookUrl && (
                    <span title="Webhook configured" className="text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-1">
                  {getScheduleDisplay(check)}
                </p>
                {check.scheduleType === "cron" && (
                  <p className="text-blue-400 text-xs font-mono mb-1">
                    {check.cronExpression}
                  </p>
                )}
                <p className="text-gray-500 text-xs mb-3">
                  Grace: {check.gracePeriod}min
                </p>

                <div className="bg-gray-800 rounded p-2 mb-3">
                  <code className="text-green-400 text-xs break-all line-clamp-2">
                    {getPingUrl(check.slug)}
                  </code>
                </div>

                <p className="text-gray-500 text-xs mb-4">
                  Last ping:{" "}
                  {check.lastPing
                    ? new Date(check.lastPing.toDate()).toLocaleString()
                    : "Never"}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => copyToClipboard(getPingUrl(check.slug))}
                    className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-800 rounded flex-1"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => toggleExpand(check.id)}
                    className="text-gray-400 hover:text-white text-xs px-2 py-1"
                  >
                    {expandedCheck === check.id ? "Hide" : "History"}
                  </button>
                  <button
                    onClick={() => setEditingCheck(check)}
                    className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCheck(check.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                  >
                    Delete
                  </button>
                </div>

                {/* Expanded History Section for Grid View */}
                {expandedCheck === check.id && (
                  <div className="mt-4 border-t border-gray-800 pt-4">
                    {/* Duration Graph for Grid View */}
                    {pings[check.id] && pings[check.id].some(p => p.duration !== undefined) && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Execution Time</h4>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <div className="flex items-end gap-0.5 h-12">
                            {pings[check.id]
                              .filter(p => p.duration !== undefined)
                              .slice(0, 10)
                              .reverse()
                              .map((ping, i, arr) => {
                                const maxDuration = Math.max(...arr.map(p => p.duration || 0));
                                const height = maxDuration > 0 ? ((ping.duration || 0) / maxDuration) * 100 : 0;
                                return (
                                  <div
                                    key={ping.id}
                                    className={`flex-1 rounded-t transition-all ${
                                      ping.status === "failure" ? "bg-red-500" : "bg-blue-500"
                                    }`}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                    title={`${ping.duration}ms`}
                                  />
                                );
                              })}
                          </div>
                          <div className="text-center text-gray-500 text-xs mt-1">
                            Avg: {Math.round(
                              pings[check.id]
                                .filter(p => p.duration !== undefined)
                                .reduce((sum, p) => sum + (p.duration || 0), 0) /
                              pings[check.id].filter(p => p.duration !== undefined).length
                            )}ms
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status History */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Status History</h4>
                      {!statusHistory[check.id] ? (
                        <p className="text-gray-500 text-xs">Loading...</p>
                      ) : statusHistory[check.id].length === 0 ? (
                        <p className="text-gray-500 text-xs">No status changes yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {statusHistory[check.id].slice(0, 5).map((event) => (
                            <div
                              key={event.id}
                              className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
                                event.status === "up"
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  event.status === "up" ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              <span>{event.status === "up" ? "UP" : "DOWN"}</span>
                              <span className="text-gray-500">
                                {new Date(event.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Pings */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Recent Pings</h4>
                      {!pings[check.id] ? (
                        <p className="text-gray-500 text-xs">Loading...</p>
                      ) : pings[check.id].length === 0 ? (
                        <p className="text-gray-500 text-xs">No pings yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {pings[check.id].slice(0, 5).map((ping) => (
                            <div
                              key={ping.id}
                              className={`bg-gray-800 rounded px-2 py-1 text-xs ${
                                ping.status === "failure" ? "text-red-400 border border-red-500/30" : "text-gray-400"
                              }`}
                            >
                              {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {ping.duration !== undefined && (
                                <span className="text-blue-400 ml-1">{ping.duration}ms</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CheckModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCheck}
          title="Create New Check"
        />
      )}

      {editingCheck && (
        <CheckModal
          onClose={() => setEditingCheck(null)}
          onSave={handleEditCheck}
          title="Edit Check"
          initialData={{
            name: editingCheck.name,
            scheduleType: editingCheck.scheduleType || "preset",
            schedule: editingCheck.schedule,
            cronExpression: editingCheck.cronExpression,
            timezone: editingCheck.timezone || "UTC",
            gracePeriod: editingCheck.gracePeriod,
            webhookUrl: editingCheck.webhookUrl,
          }}
        />
      )}

      <InstallPrompt />
    </div>
  );
}

function CheckModal({
  onClose,
  onSave,
  title,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: CreateCheckData) => void;
  title: string;
  initialData?: {
    name?: string;
    scheduleType?: ScheduleType;
    schedule?: string;
    cronExpression?: string;
    timezone?: string;
    gracePeriod?: number;
    webhookUrl?: string;
  };
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    initialData?.scheduleType || "preset"
  );
  const [schedule, setSchedule] = useState(initialData?.schedule || "every 5 minutes");
  const [cronExpression, setCronExpression] = useState(initialData?.cronExpression || "");
  const [timezone, setTimezone] = useState(
    initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [gracePeriod, setGracePeriod] = useState(initialData?.gracePeriod || 5);
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || "");
  const [webhookError, setWebhookError] = useState("");
  const [cronError, setCronError] = useState("");

  // Calculate next run time for cron expression
  const nextRunTime = scheduleType === "cron" && cronExpression && isValidCronExpression(cronExpression)
    ? getNextRunTime(cronExpression, timezone)
    : null;

  const validateWebhookUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url) return { valid: true };
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { valid: false, error: "URL must use HTTP or HTTPS" };
      }
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
        /^192\.168\.\d+\.\d+$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)
      ) {
        return { valid: false, error: "Cannot use localhost or private IP addresses" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  };

  const handleCronChange = (value: string) => {
    setCronExpression(value);
    if (value && !isValidCronExpression(value)) {
      setCronError("Invalid cron expression");
    } else {
      setCronError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate webhook
    const webhookValidation = validateWebhookUrl(webhookUrl);
    if (!webhookValidation.valid) {
      setWebhookError(webhookValidation.error || "Invalid URL");
      return;
    }

    // Validate cron expression
    if (scheduleType === "cron") {
      if (!cronExpression) {
        setCronError("Cron expression is required");
        return;
      }
      if (!isValidCronExpression(cronExpression)) {
        setCronError("Invalid cron expression");
        return;
      }
    }

    onSave({
      name,
      scheduleType,
      schedule: scheduleType === "preset" ? schedule : undefined,
      cronExpression: scheduleType === "cron" ? cronExpression : undefined,
      timezone,
      gracePeriod,
      webhookUrl: webhookUrl || undefined,
    });
  };

  const minuteOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "minutes");
  const hourOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "hours");
  const dayOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "days");

  // Group timezones
  const timezoneGroups = TIMEZONE_OPTIONS.reduce((acc, tz) => {
    if (!acc[tz.group]) acc[tz.group] = [];
    acc[tz.group].push(tz);
    return acc;
  }, {} as Record<string, typeof TIMEZONE_OPTIONS>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg my-8">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Daily backup"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Schedule Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule Type
            </label>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setScheduleType("preset")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scheduleType === "preset"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("cron")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scheduleType === "cron"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Cron Expression
              </button>
            </div>
          </div>

          {/* Preset Schedule */}
          {scheduleType === "preset" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Schedule
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 w-12 py-1.5">Min:</span>
                  {minuteOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSchedule(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        schedule === option.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 w-12 py-1.5">Hour:</span>
                  {hourOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSchedule(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        schedule === option.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 w-12 py-1.5">Day:</span>
                  {dayOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSchedule(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        schedule === option.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cron Expression */}
          {scheduleType === "cron" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cron Expression
              </label>
              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {CRON_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setCronExpression(preset.value);
                      setCronError("");
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      cronExpression === preset.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => handleCronChange(e.target.value)}
                placeholder="*/5 * * * *"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  cronError ? "border-red-500" : "border-gray-700"
                }`}
              />
              {cronError ? (
                <p className="text-red-400 text-xs mt-1">{cronError}</p>
              ) : cronExpression && isValidCronExpression(cronExpression) ? (
                <div className="mt-2 space-y-1">
                  <p className="text-green-400 text-xs">
                    {describeCronExpression(cronExpression)}
                  </p>
                  {nextRunTime && (
                    <p className="text-gray-400 text-xs">
                      Next run: {nextRunTime.toLocaleString(undefined, {
                        timeZone: timezone,
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  Format: minute hour day month weekday (e.g., 0 3 * * 1 = 3:00 AM every Monday)
                </p>
              )}
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(timezoneGroups).map(([group, zones]) => (
                <optgroup key={group} label={group}>
                  {zones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Grace Period */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Grace Period (minutes)
            </label>
            <input
              type="number"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              min={1}
              max={60}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              How long to wait before marking as down
            </p>
          </div>

          {/* Webhook */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Webhook URL (optional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setWebhookError("");
              }}
              placeholder="https://example.com/webhook"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                webhookError ? "border-red-500" : "border-gray-700"
              }`}
            />
            {webhookError ? (
              <p className="text-red-400 text-xs mt-1">{webhookError}</p>
            ) : (
              <p className="text-gray-500 text-xs mt-1">
                Receive POST requests when status changes (down/recovery)
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
