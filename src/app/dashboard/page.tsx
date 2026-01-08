"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  Ping,
  StatusEvent,
  ScheduleType,
  subscribeToUserChecks,
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
import {
  HttpMonitor,
  HttpMonitorCheck,
  HttpMonitorStatusEvent,
  HttpMethod,
  ContentType,
  HttpMonitorLimitResult,
  CreateHttpMonitorData,
  subscribeToUserHttpMonitors,
  createHttpMonitor,
  deleteHttpMonitor,
  updateHttpMonitor,
  pauseHttpMonitor,
  resumeHttpMonitor,
  canCreateHttpMonitor,
  getHttpMonitorChecks,
  getHttpMonitorStatusHistory,
} from "@/lib/http-monitors";
import { validateMonitorUrl } from "@/lib/http-monitor-checker";
import { PLANS } from "@/lib/plans";
import { SCHEDULE_OPTIONS, CRON_PRESETS, TIMEZONE_OPTIONS } from "@/lib/constants";
import Link from "next/link";
import { InstallPrompt } from "@/components/InstallPrompt";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { Header } from "@/components/Header";
import { OwlLogo } from "@/components/OwlLogo";
import { useConfirm } from "@/components/ConfirmDialog";

type DashboardTab = "checks" | "http-monitors";

export default function DashboardPage() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  // Tab state
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cronowl-dashboard-tab") as DashboardTab) || "checks";
    }
    return "checks";
  });

  // Checks state
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
  const [planUsage, setPlanUsage] = useState<CheckLimitResult | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // HTTP Monitors state
  const [httpMonitors, setHttpMonitors] = useState<HttpMonitor[]>([]);
  const [loadingMonitors, setLoadingMonitors] = useState(true);
  const [showCreateHttpMonitorModal, setShowCreateHttpMonitorModal] = useState(false);
  const [editingHttpMonitor, setEditingHttpMonitor] = useState<HttpMonitor | null>(null);
  const [expandedMonitor, setExpandedMonitor] = useState<string | null>(null);
  const [monitorChecks, setMonitorChecks] = useState<Record<string, HttpMonitorCheck[]>>({});
  const [monitorStatusHistory, setMonitorStatusHistory] = useState<Record<string, HttpMonitorStatusEvent[]>>({});
  const [httpMonitorUsage, setHttpMonitorUsage] = useState<HttpMonitorLimitResult | null>(null);
  const [selectedMonitorTag, setSelectedMonitorTag] = useState<string | null>(null);

  // Get all unique tags from checks
  const allTags = Array.from(
    new Set(checks.flatMap(check => check.tags || []))
  ).sort();

  // Filter checks by selected tag
  const filteredChecks = selectedTag
    ? checks.filter(check => check.tags?.includes(selectedTag))
    : checks;

  // Get all unique tags from HTTP monitors
  const allMonitorTags = Array.from(
    new Set(httpMonitors.flatMap(monitor => monitor.tags || []))
  ).sort();

  // Filter HTTP monitors by selected tag
  const filteredMonitors = selectedMonitorTag
    ? httpMonitors.filter(monitor => monitor.tags?.includes(selectedMonitorTag))
    : httpMonitors;

  // Save tab preference
  useEffect(() => {
    localStorage.setItem("cronowl-dashboard-tab", activeTab);
  }, [activeTab]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("cronowl-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load plan usage
  const loadPlanUsage = useCallback(async () => {
    if (!user) return;
    try {
      const [checksUsage, monitorsUsage] = await Promise.all([
        canCreateCheck(user.uid),
        canCreateHttpMonitor(user.uid),
      ]);
      setPlanUsage(checksUsage);
      setHttpMonitorUsage(monitorsUsage);
    } catch (error) {
      console.error("Failed to load plan usage:", error);
    }
  }, [user]);

  // Realtime subscriptions for checks and HTTP monitors
  useEffect(() => {
    if (!user) return;

    setLoadingChecks(true);
    setLoadingMonitors(true);

    // Subscribe to checks - realtime updates
    const unsubscribeChecks = subscribeToUserChecks(
      user.uid,
      (updatedChecks) => {
        setChecks(updatedChecks);
        setLastUpdated(new Date());
        setLoadingChecks(false);
      },
      (error) => {
        console.error("Checks subscription error:", error);
        setLoadingChecks(false);
      }
    );

    // Subscribe to HTTP monitors - realtime updates
    const unsubscribeMonitors = subscribeToUserHttpMonitors(
      user.uid,
      (updatedMonitors) => {
        setHttpMonitors(updatedMonitors);
        setLastUpdated(new Date());
        setLoadingMonitors(false);
      },
      (error) => {
        console.error("HTTP monitors subscription error:", error);
        setLoadingMonitors(false);
      }
    );

    // Load plan usage once
    loadPlanUsage();

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeChecks();
      unsubscribeMonitors();
    };
  }, [user, loadPlanUsage]);

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

  // HTTP Monitor helpers
  const loadMonitorChecks = async (monitorId: string) => {
    try {
      const checks = await getHttpMonitorChecks(monitorId, 50);
      setMonitorChecks((prev) => ({ ...prev, [monitorId]: checks }));
    } catch (error) {
      console.error("Failed to load monitor checks:", error);
    }
  };

  const loadMonitorStatusHistory = async (monitorId: string) => {
    try {
      const history = await getHttpMonitorStatusHistory(monitorId, 20);
      setMonitorStatusHistory((prev) => ({ ...prev, [monitorId]: history }));
    } catch (error) {
      console.error("Failed to load monitor status history:", error);
    }
  };

  const toggleMonitorExpand = (monitorId: string) => {
    if (expandedMonitor === monitorId) {
      setExpandedMonitor(null);
    } else {
      setExpandedMonitor(monitorId);
      loadMonitorChecks(monitorId);
      loadMonitorStatusHistory(monitorId);
    }
  };

  const getMonitorStatusColor = (status: HttpMonitor["status"]) => {
    switch (status) {
      case "up":
        return "bg-green-500";
      case "down":
        return "bg-red-500";
      case "degraded":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMonitorStatusText = (status: HttpMonitor["status"]) => {
    switch (status) {
      case "up":
        return "UP";
      case "down":
        return "DOWN";
      case "degraded":
        return "DEGRADED";
      default:
        return "PENDING";
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

  // Helper to format refresh interval
  const formatRefreshInterval = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    return `${seconds / 60}m`;
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
      setShowCreateModal(false);
      // Data will update automatically via realtime subscription
      loadPlanUsage(); // Refresh plan usage
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

      if (data.tags && data.tags.length > 0) {
        updateData.tags = data.tags;
      } else {
        updateData.tags = [];
      }

      await updateCheck(editingCheck.id, updateData);

      // Remove webhook URL if it was cleared
      if (!data.webhookUrl && editingCheck.webhookUrl) {
        await removeWebhookUrl(editingCheck.id);
      }

      setEditingCheck(null);
      // Data will update automatically via realtime subscription
    } catch (error) {
      console.error("Failed to update check:", error);
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    const confirmed = await confirm({
      title: "Delete Check",
      message: "Are you sure you want to delete this check? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteCheck(checkId);
      // Data will update automatically via realtime subscription
      loadPlanUsage(); // Refresh plan usage
    } catch (error) {
      console.error("Failed to delete check:", error);
    }
  };

  // HTTP Monitor handlers
  const handleCreateHttpMonitor = async (data: CreateHttpMonitorData) => {
    if (!user) return;
    setLimitError(null);
    try {
      const limitCheck = await canCreateHttpMonitor(user.uid);
      if (!limitCheck.allowed) {
        setLimitError(limitCheck.reason || "HTTP monitor limit reached");
        return;
      }
      await createHttpMonitor(user.uid, data);
      setShowCreateHttpMonitorModal(false);
      // Data will update automatically via realtime subscription
      loadPlanUsage(); // Refresh plan usage
    } catch (error) {
      console.error("Failed to create HTTP monitor:", error);
    }
  };

  const handleEditHttpMonitor = async (data: CreateHttpMonitorData) => {
    if (!editingHttpMonitor) return;
    try {
      await updateHttpMonitor(editingHttpMonitor.id, data);
      setEditingHttpMonitor(null);
      // Data will update automatically via realtime subscription
    } catch (error) {
      console.error("Failed to update HTTP monitor:", error);
    }
  };

  const handleDeleteHttpMonitor = async (monitorId: string) => {
    const confirmed = await confirm({
      title: "Delete HTTP Monitor",
      message: "Are you sure you want to delete this HTTP monitor? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteHttpMonitor(monitorId);
      // Data will update automatically via realtime subscription
      loadPlanUsage(); // Refresh plan usage
    } catch (error) {
      console.error("Failed to delete HTTP monitor:", error);
    }
  };

  const handlePauseMonitor = async (monitorId: string) => {
    try {
      await pauseHttpMonitor(monitorId);
      // Data will update automatically via realtime subscription
    } catch (error) {
      console.error("Failed to pause monitor:", error);
    }
  };

  const handleResumeMonitor = async (monitorId: string) => {
    try {
      await resumeHttpMonitor(monitorId);
      // Data will update automatically via realtime subscription
    } catch (error) {
      console.error("Failed to resume monitor:", error);
    }
  };

  // Admin: Toggle test endpoint status
  const [testEndpointLoading, setTestEndpointLoading] = useState<"up" | "down" | null>(null);

  const handleTestEndpointToggle = async (action: "up" | "down") => {
    if (!user) return;
    setTestEndpointLoading(action);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/test-endpoint-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle test endpoint");
      }
    } catch (error) {
      console.error("Failed to toggle test endpoint:", error);
    } finally {
      setTestEndpointLoading(null);
    }
  };

  // Check if URL is the test endpoint
  const isTestEndpointUrl = (url: string) => {
    return url.includes("/api/test-endpoint");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={user} signOut={signOut} isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <EmailVerificationBanner />

        {/* Plan Usage Banner */}
        {planUsage && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-900 dark:text-white font-medium">
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
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
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
                  <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                    {planUsage.current} / {planUsage.limit === Infinity ? "∞" : planUsage.limit} checks
                  </span>
                </div>
              </div>
              {planUsage.current / planUsage.limit > 0.8 && planUsage.plan === "free" && (
                <div className="text-yellow-600 dark:text-yellow-400 text-sm">
                  Running low on checks!{" "}
                  <Link href="/pricing" className="underline hover:text-yellow-500 dark:hover:text-yellow-300">
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
                <p className="text-red-500 dark:text-red-400">{limitError}</p>
                <Link href="/pricing" className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 inline-block">
                  View pricing plans →
                </Link>
              </div>
              <button
                onClick={() => setLimitError(null)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("checks")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === "checks"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Cron Checks
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
              {checks.length}
            </span>
            {activeTab === "checks" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("http-monitors")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === "http-monitors"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            HTTP Monitors
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
              {httpMonitors.length}
            </span>
            {activeTab === "http-monitors" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* Checks Tab Content */}
        {activeTab === "checks" && (
          <>
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your Checks</h2>
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-500 text-xs">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium">Live</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View mode toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 sm:px-3 py-1.5 rounded text-sm transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300/50 dark:hover:bg-gray-700/50"
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 sm:px-3 py-1.5 rounded text-sm transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300/50 dark:hover:bg-gray-700/50"
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
              className="bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:bg-blue-700 transition-all flex-shrink-0"
            >
              + New Check
            </button>
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-gray-500 text-sm">Filter:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({checks.length})
            </button>
            {allTags.map((tag) => {
              const count = checks.filter(c => c.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loadingChecks ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Loading checks...
          </div>
        ) : checks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <OwlLogo className="w-20 h-20" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No checks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
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
            {filteredChecks.map((check) => (
              <div key={check.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(
                        check
                      )}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 dark:text-white font-medium truncate">{check.name}</h3>
                        {check.webhookUrl && (
                          <span title="Webhook configured" className="text-gray-400 dark:text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {getScheduleDisplay(check)} • {check.gracePeriod}min grace
                        {check.scheduleType === "cron" && (
                          <span className="ml-2 text-xs text-blue-500 dark:text-blue-400 font-mono">
                            ({check.cronExpression})
                          </span>
                        )}
                      </p>
                      {check.tags && check.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {check.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(getPingUrl(check.slug))}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => toggleExpand(check.id)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      {expandedCheck === check.id ? "Hide" : "History"}
                    </button>
                    <button
                      onClick={() => setEditingCheck(check)}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCheck(check.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded p-2">
                  <code className="text-green-600 dark:text-green-400 text-sm break-all">
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
                    <span className="text-blue-500 dark:text-blue-400">
                      {check.lastDuration < 1000
                        ? `${check.lastDuration}ms`
                        : `${(check.lastDuration / 1000).toFixed(1)}s`}
                    </span>
                  )}
                </div>

                {/* Expanded History Section */}
                {expandedCheck === check.id && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                    {/* Duration Graph */}
                    {pings[check.id] && pings[check.id].some(p => p.duration !== undefined) && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Execution Time
                        </h4>
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-end gap-1 h-16">
                            {pings[check.id]
                              .filter(p => p.duration !== undefined)
                              .slice(0, 20)
                              .reverse()
                              .map((ping, _i, arr) => {
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
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Status History
                      </h4>
                      {!statusHistory[check.id] ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : statusHistory[check.id].length === 0 ? (
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 text-center">
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
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Recent Pings
                      </h4>
                      {!pings[check.id] ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : pings[check.id].length === 0 ? (
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                          <p className="text-gray-500 text-sm">No pings received yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {pings[check.id].slice(0, 10).map((ping) => (
                            <div
                              key={ping.id}
                              className={`bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-2 text-center border ${
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
                                <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                  {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(ping.timestamp.toDate()).toLocaleDateString()}
                              </div>
                              {ping.duration !== undefined && (
                                <div className="text-blue-500 dark:text-blue-400 text-xs mt-1">
                                  {ping.duration < 1000
                                    ? `${ping.duration}ms`
                                    : `${(ping.duration / 1000).toFixed(1)}s`}
                                </div>
                              )}
                              {ping.exitCode !== undefined && ping.exitCode !== 0 && (
                                <div className="text-red-500 dark:text-red-400 text-xs">
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
            {filteredChecks.map((check) => (
              <div
                key={check.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusColor(check)}`}
                  />
                  <h3 className="text-gray-900 dark:text-white font-medium truncate flex-1">
                    {check.name}
                  </h3>
                  {check.webhookUrl && (
                    <span title="Webhook configured" className="text-gray-400 dark:text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                  )}
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  {getScheduleDisplay(check)}
                </p>
                {check.scheduleType === "cron" && (
                  <p className="text-blue-500 dark:text-blue-400 text-xs font-mono mb-1">
                    {check.cronExpression}
                  </p>
                )}
                <p className="text-gray-500 text-xs mb-2">
                  Grace: {check.gracePeriod}min
                </p>

                {check.tags && check.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {check.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-3">
                  <code className="text-green-600 dark:text-green-400 text-xs break-all line-clamp-2">
                    {getPingUrl(check.slug)}
                  </code>
                </div>

                <p className="text-gray-500 text-xs mb-4">
                  Last ping:{" "}
                  {check.lastPing
                    ? new Date(check.lastPing.toDate()).toLocaleString()
                    : "Never"}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => copyToClipboard(getPingUrl(check.slug))}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded flex-1"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => toggleExpand(check.id)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs px-2 py-1"
                  >
                    {expandedCheck === check.id ? "Hide" : "History"}
                  </button>
                  <button
                    onClick={() => setEditingCheck(check)}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCheck(check.id)}
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs px-2 py-1"
                  >
                    Delete
                  </button>
                </div>

                {/* Expanded History Section for Grid View */}
                {expandedCheck === check.id && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                    {/* Duration Graph for Grid View */}
                    {pings[check.id] && pings[check.id].some(p => p.duration !== undefined) && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Execution Time</h4>
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2">
                          <div className="flex items-end gap-0.5 h-12">
                            {pings[check.id]
                              .filter(p => p.duration !== undefined)
                              .slice(0, 10)
                              .reverse()
                              .map((ping, _i, arr) => {
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
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Status History</h4>
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
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
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
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Pings</h4>
                      {!pings[check.id] ? (
                        <p className="text-gray-500 text-xs">Loading...</p>
                      ) : pings[check.id].length === 0 ? (
                        <p className="text-gray-500 text-xs">No pings yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {pings[check.id].slice(0, 5).map((ping) => (
                            <div
                              key={ping.id}
                              className={`bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs ${
                                ping.status === "failure" ? "text-red-500 dark:text-red-400 border border-red-500/30" : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {ping.duration !== undefined && (
                                <span className="text-blue-500 dark:text-blue-400 ml-1">{ping.duration}ms</span>
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
          </>
        )}

        {/* HTTP Monitors Tab Content */}
        {activeTab === "http-monitors" && (
          <>
            {/* HTTP Monitors Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">HTTP Monitors</h2>
                {lastUpdated && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-500 text-xs">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-medium">Live</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateHttpMonitorModal(true)}
                  className="bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:bg-blue-700 transition-all"
                >
                  + New Monitor
                </button>
              </div>
            </div>

            {/* HTTP Monitor Usage */}
            {httpMonitorUsage && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          httpMonitorUsage.current / httpMonitorUsage.limit > 0.9
                            ? "bg-red-500"
                            : httpMonitorUsage.current / httpMonitorUsage.limit > 0.7
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min((httpMonitorUsage.current / httpMonitorUsage.limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                    {httpMonitorUsage.current} / {httpMonitorUsage.limit} monitors
                  </span>
                </div>
              </div>
            )}

            {/* Monitor Tag Filter */}
            {allMonitorTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-gray-500 text-sm">Filter:</span>
                <button
                  onClick={() => setSelectedMonitorTag(null)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedMonitorTag === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  All ({httpMonitors.length})
                </button>
                {allMonitorTags.map((tag) => {
                  const count = httpMonitors.filter(m => m.tags?.includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedMonitorTag(selectedMonitorTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedMonitorTag === tag
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* HTTP Monitors List */}
            {loadingMonitors ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                Loading HTTP monitors...
              </div>
            ) : httpMonitors.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No HTTP monitors yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Monitor your web endpoints and get alerted when they go down
                </p>
                <button
                  onClick={() => setShowCreateHttpMonitorModal(true)}
                  className="bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 transition-colors"
                >
                  Create your first HTTP monitor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMonitors.map((monitor) => (
                  <div key={monitor.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getMonitorStatusColor(monitor.status)}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-gray-900 dark:text-white font-medium truncate">{monitor.name}</h3>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              monitor.status === "up" ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                              monitor.status === "down" ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                              monitor.status === "degraded" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                              "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                            }`}>
                              {getMonitorStatusText(monitor.status)}
                            </span>
                            {!monitor.isEnabled && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-600 dark:text-gray-400">
                                PAUSED
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                            {monitor.method} {monitor.url}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Every {monitor.intervalSeconds >= 60 ? `${monitor.intervalSeconds / 60}min` : `${monitor.intervalSeconds}s`}
                            {monitor.lastResponseTimeMs && ` • ${monitor.lastResponseTimeMs}ms`}
                            {monitor.lastStatusCode && ` • ${monitor.lastStatusCode}`}
                          </p>
                          {monitor.tags && monitor.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {monitor.tags.map((tag) => (
                                <span
                                  key={tag}
                                  onClick={() => setSelectedMonitorTag(tag)}
                                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => toggleMonitorExpand(monitor.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-1"
                        >
                          {expandedMonitor === monitor.id ? "Hide" : "History"}
                        </button>
                        {monitor.isEnabled ? (
                          <button
                            onClick={() => handlePauseMonitor(monitor.id)}
                            className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeMonitor(monitor.id)}
                            className="text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => setEditingHttpMonitor(monitor)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHttpMonitor(monitor.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-xs sm:text-sm px-2 sm:px-3 py-1"
                        >
                          Delete
                        </button>
                        {/* Admin: Test endpoint toggle buttons */}
                        {isAdmin && isTestEndpointUrl(monitor.url) && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <button
                              onClick={() => handleTestEndpointToggle("down")}
                              disabled={testEndpointLoading !== null}
                              className={`text-xs px-2 py-1 font-medium transition-colors ${
                                testEndpointLoading === "down"
                                  ? "text-orange-300 cursor-wait"
                                  : "text-orange-500 hover:text-orange-600"
                              }`}
                              title="Set test endpoint to DOWN (503)"
                            >
                              {testEndpointLoading === "down" ? "..." : "▼ Down"}
                            </button>
                            <button
                              onClick={() => handleTestEndpointToggle("up")}
                              disabled={testEndpointLoading !== null}
                              className={`text-xs px-2 py-1 font-medium transition-colors ${
                                testEndpointLoading === "up"
                                  ? "text-green-300 cursor-wait"
                                  : "text-green-500 hover:text-green-600"
                              }`}
                              title="Set test endpoint to UP (200)"
                            >
                              {testEndpointLoading === "up" ? "..." : "▲ Up"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Monitor Error */}
                    {monitor.lastError && monitor.status === "down" && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded p-2">
                        <p className="text-red-500 dark:text-red-400 text-sm">{monitor.lastError}</p>
                      </div>
                    )}

                    {/* Expanded Monitor History */}
                    {expandedMonitor === monitor.id && (
                      <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                        {/* Response Time Chart */}
                        {monitorChecks[monitor.id] && monitorChecks[monitor.id].some(c => c.responseTimeMs !== undefined) && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Response Time</h4>
                            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
                              <div className="flex items-end gap-1 h-16">
                                {monitorChecks[monitor.id]
                                  .filter(c => c.responseTimeMs !== undefined)
                                  .slice(0, 30)
                                  .reverse()
                                  .map((check, _i, arr) => {
                                    const maxTime = Math.max(...arr.map(c => c.responseTimeMs || 0));
                                    const height = maxTime > 0 ? ((check.responseTimeMs || 0) / maxTime) * 100 : 0;
                                    return (
                                      <div
                                        key={check.id}
                                        className={`flex-1 rounded-t transition-all ${
                                          check.status === "failure" ? "bg-red-500" : "bg-blue-500"
                                        }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                        title={`${check.responseTimeMs}ms - ${check.status}`}
                                      />
                                    );
                                  })}
                              </div>
                              <div className="flex justify-between text-gray-500 text-xs mt-2">
                                <span>Older</span>
                                <span>
                                  Avg: {Math.round(
                                    monitorChecks[monitor.id]
                                      .filter(c => c.responseTimeMs !== undefined)
                                      .reduce((sum, c) => sum + (c.responseTimeMs || 0), 0) /
                                    monitorChecks[monitor.id].filter(c => c.responseTimeMs !== undefined).length
                                  )}ms
                                </span>
                                <span>Recent</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status History */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status History</h4>
                          {!monitorStatusHistory[monitor.id] ? (
                            <p className="text-gray-500 text-sm">Loading...</p>
                          ) : monitorStatusHistory[monitor.id].length === 0 ? (
                            <p className="text-gray-500 text-sm">No status changes recorded yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {monitorStatusHistory[monitor.id].slice(0, 10).map((event) => (
                                <div
                                  key={event.id}
                                  className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                                    event.status === "up" ? "bg-green-500/10 border border-green-500/20" :
                                    event.status === "down" ? "bg-red-500/10 border border-red-500/20" :
                                    "bg-yellow-500/10 border border-yellow-500/20"
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${getMonitorStatusColor(event.status)}`} />
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-medium ${
                                      event.status === "up" ? "text-green-400" :
                                      event.status === "down" ? "text-red-400" :
                                      "text-yellow-400"
                                    }`}>
                                      {getMonitorStatusText(event.status)}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(event.timestamp.toDate()).toLocaleDateString()}{" "}
                                      {new Date(event.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  {event.duration && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                                      {formatDuration(event.duration)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recent Checks */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Checks</h4>
                          {!monitorChecks[monitor.id] ? (
                            <p className="text-gray-500 text-sm">Loading...</p>
                          ) : monitorChecks[monitor.id].length === 0 ? (
                            <p className="text-gray-500 text-sm">No checks yet</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {monitorChecks[monitor.id].slice(0, 12).map((check) => (
                                <div
                                  key={check.id}
                                  className={`bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-2 text-center border ${
                                    check.status === "failure" ? "border-red-500/30" : "border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      check.status === "failure" ? "bg-red-500" : "bg-green-500"
                                    }`} />
                                    <span className="text-gray-700 dark:text-gray-300 text-xs">
                                      {check.statusCode || "ERR"}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {check.responseTimeMs}ms
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {new Date(check.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
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
          </>
        )}
      </main>

      {showCreateModal && (
        <CheckModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCheck}
          title="Create New Check"
          existingTags={allTags}
          userPlan={planUsage?.plan || "free"}
        />
      )}

      {editingCheck && (
        <CheckModal
          onClose={() => setEditingCheck(null)}
          onSave={handleEditCheck}
          title="Edit Check"
          existingTags={allTags}
          userPlan={planUsage?.plan || "free"}
          initialData={{
            name: editingCheck.name,
            scheduleType: editingCheck.scheduleType || "preset",
            schedule: editingCheck.schedule,
            cronExpression: editingCheck.cronExpression,
            timezone: editingCheck.timezone || "UTC",
            gracePeriod: editingCheck.gracePeriod,
            webhookUrl: editingCheck.webhookUrl,
            tags: editingCheck.tags,
            maxDuration: editingCheck.maxDuration,
          }}
        />
      )}

      {/* HTTP Monitor Modals */}
      {showCreateHttpMonitorModal && (
        <HttpMonitorModal
          onClose={() => setShowCreateHttpMonitorModal(false)}
          onSave={handleCreateHttpMonitor}
          title="Create HTTP Monitor"
          existingTags={allMonitorTags}
          userPlan={planUsage?.plan || "free"}
        />
      )}

      {editingHttpMonitor && (
        <HttpMonitorModal
          onClose={() => setEditingHttpMonitor(null)}
          onSave={handleEditHttpMonitor}
          title="Edit HTTP Monitor"
          existingTags={allMonitorTags}
          userPlan={planUsage?.plan || "free"}
          initialData={{
            name: editingHttpMonitor.name,
            url: editingHttpMonitor.url,
            method: editingHttpMonitor.method,
            expectedStatusCodes: editingHttpMonitor.expectedStatusCodes,
            timeoutMs: editingHttpMonitor.timeoutMs,
            intervalSeconds: editingHttpMonitor.intervalSeconds,
            alertAfterFailures: editingHttpMonitor.alertAfterFailures,
            tags: editingHttpMonitor.tags,
            webhookUrl: editingHttpMonitor.webhookUrl,
            headers: editingHttpMonitor.headers,
            body: editingHttpMonitor.body,
            contentType: editingHttpMonitor.contentType,
            assertions: editingHttpMonitor.assertions,
          }}
        />
      )}

      <InstallPrompt />
      {ConfirmDialog}
    </div>
  );
}

// HTTP Monitor Modal Component
function HttpMonitorModal({
  onClose,
  onSave,
  title,
  initialData,
  existingTags = [],
  userPlan = "free",
}: {
  onClose: () => void;
  onSave: (data: CreateHttpMonitorData) => void;
  title: string;
  initialData?: {
    name?: string;
    url?: string;
    method?: HttpMethod;
    expectedStatusCodes?: number[];
    timeoutMs?: number;
    intervalSeconds?: number;
    alertAfterFailures?: number;
    tags?: string[];
    webhookUrl?: string;
    headers?: Record<string, string>;
    body?: string;
    contentType?: ContentType;
    assertions?: {
      maxResponseTimeMs?: number;
      bodyContains?: string;
      bodyNotContains?: string;
    };
  };
  existingTags?: string[];
  userPlan?: keyof typeof PLANS;
}) {
  const planLimits = PLANS[userPlan];
  const minInterval = planLimits.minHttpIntervalSeconds;

  const [name, setName] = useState(initialData?.name || "");
  const [url, setUrl] = useState(initialData?.url || "");
  const [method, setMethod] = useState<HttpMethod>(initialData?.method || "GET");
  const [expectedStatusCodes, setExpectedStatusCodes] = useState(
    initialData?.expectedStatusCodes?.join(", ") || "200, 201, 204"
  );
  const [timeoutMs, setTimeoutMs] = useState(initialData?.timeoutMs || 10000);
  const [intervalSeconds, setIntervalSeconds] = useState(
    initialData?.intervalSeconds || Math.max(300, minInterval)
  );
  const [alertAfterFailures, setAlertAfterFailures] = useState(
    initialData?.alertAfterFailures || 2
  );
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // POST/PUT request fields
  const [requestBody, setRequestBody] = useState(initialData?.body || "");
  const [contentType, setContentType] = useState<ContentType>(initialData?.contentType || "application/json");
  const [headers, setHeaders] = useState<Array<{key: string; value: string}>>(
    initialData?.headers
      ? Object.entries(initialData.headers).map(([key, value]) => ({ key, value }))
      : []
  );
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxResponseTimeMs, setMaxResponseTimeMs] = useState(
    initialData?.assertions?.maxResponseTimeMs || 0
  );
  const [bodyContains, setBodyContains] = useState(
    initialData?.assertions?.bodyContains || ""
  );
  const [bodyNotContains, setBodyNotContains] = useState(
    initialData?.assertions?.bodyNotContains || ""
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (urlToValidate: string) => {
    if (!urlToValidate) {
      setUrlError(null);
      return;
    }
    const result = validateMonitorUrl(urlToValidate);
    setUrlError(result.valid ? null : result.error || "Invalid URL");
  };

  const handleSubmit = () => {
    if (!name.trim() || !url.trim()) return;

    const urlValidation = validateMonitorUrl(url);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error || "Invalid URL");
      return;
    }

    const statusCodes = expectedStatusCodes
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 100 && n < 600);

    // Convert headers array to object
    const headersObj = headers.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key.trim()] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const data: CreateHttpMonitorData = {
      name: name.trim(),
      url: url.trim(),
      method,
      expectedStatusCodes: statusCodes.length > 0 ? statusCodes : [200, 201, 204],
      timeoutMs,
      intervalSeconds: Math.max(intervalSeconds, minInterval),
      alertAfterFailures,
      tags: tags.length > 0 ? tags : undefined,
      webhookUrl: webhookUrl.trim() || undefined,
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      body: (method === "POST" || method === "PUT") && requestBody.trim() ? requestBody.trim() : undefined,
      contentType: (method === "POST" || method === "PUT") ? contentType : undefined,
      assertions: showAdvanced && (maxResponseTimeMs > 0 || bodyContains || bodyNotContains)
        ? {
            maxResponseTimeMs: maxResponseTimeMs > 0 ? maxResponseTimeMs : undefined,
            bodyContains: bodyContains || undefined,
            bodyNotContains: bodyNotContains || undefined,
          }
        : undefined,
    };

    onSave(data);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production API"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  validateUrl(e.target.value);
                }}
                placeholder="https://api.example.com/health"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  urlError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
            </div>

            {/* Method and Timeout */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="HEAD">HEAD</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Math.max(1000, Math.min(30000, parseInt(e.target.value) || 10000)))}
                  min={1000}
                  max={30000}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* POST/PUT Request Settings */}
            {(method === "POST" || method === "PUT") && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Request Body Settings
                </h4>

                {/* Content-Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content-Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="application/json">application/json</option>
                    <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                    <option value="text/plain">text/plain</option>
                  </select>
                </div>

                {/* Request Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Request Body
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder={contentType === "application/json" ? '{"key": "value"}' : "key=value&key2=value2"}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Custom Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Headers (optional)
              </label>
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => {
                        const newHeaders = [...headers];
                        newHeaders[index].key = e.target.value;
                        setHeaders(newHeaders);
                      }}
                      placeholder="Header name"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => {
                        const newHeaders = [...headers];
                        newHeaders[index].value = e.target.value;
                        setHeaders(newHeaders);
                      }}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setHeaders(headers.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                    placeholder="Header name (e.g. Authorization)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newHeaderKey.trim()) {
                        setHeaders([...headers, { key: newHeaderKey.trim(), value: newHeaderValue }]);
                        setNewHeaderKey("");
                        setNewHeaderValue("");
                      }
                    }}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500">Add custom headers like Authorization, X-API-Key, etc.</p>
              </div>
            </div>

            {/* Interval and Alert Threshold */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check Interval
                </label>
                <select
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {minInterval <= 60 && <option value={60}>Every 1 minute</option>}
                  {minInterval <= 120 && <option value={120}>Every 2 minutes</option>}
                  <option value={300}>Every 5 minutes</option>
                  <option value={600}>Every 10 minutes</option>
                  <option value={900}>Every 15 minutes</option>
                  <option value={1800}>Every 30 minutes</option>
                  <option value={3600}>Every 1 hour</option>
                </select>
                {minInterval > 60 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min interval: {minInterval / 60}min ({planLimits.name} plan)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert after failures
                </label>
                <select
                  value={alertAfterFailures}
                  onChange={(e) => setAlertAfterFailures(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 failure</option>
                  <option value={2}>2 failures</option>
                  <option value={3}>3 failures</option>
                  <option value={5}>5 failures</option>
                </select>
              </div>
            </div>

            {/* Expected Status Codes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Status Codes
              </label>
              <input
                type="text"
                value={expectedStatusCodes}
                onChange={(e) => setExpectedStatusCodes(e.target.value)}
                placeholder="200, 201, 204"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of valid HTTP status codes</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  list="existing-tags"
                />
                <datalist id="existing-tags">
                  {existingTags.filter(t => !tags.includes(t)).map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {/* Response Time Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Response Time (ms)
                  </label>
                  <input
                    type="number"
                    value={maxResponseTimeMs || ""}
                    onChange={(e) => setMaxResponseTimeMs(parseInt(e.target.value) || 0)}
                    placeholder="2000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when response time exceeds this (0 = disabled)</p>
                </div>

                {/* Body Contains */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Response Body Contains
                  </label>
                  <input
                    type="text"
                    value={bodyContains}
                    onChange={(e) => setBodyContains(e.target.value)}
                    placeholder='e.g. "status": "ok"'
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Body Not Contains */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Response Body Must NOT Contain
                  </label>
                  <input
                    type="text"
                    value={bodyNotContains}
                    onChange={(e) => setBodyNotContains(e.target.value)}
                    placeholder="error"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Webhook URL (optional)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !url.trim() || !!urlError}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? "Save Changes" : "Create Monitor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckModal({
  onClose,
  onSave,
  title,
  initialData,
  existingTags = [],
  userPlan = "free",
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
    tags?: string[];
    maxDuration?: number;
  };
  existingTags?: string[];
  userPlan?: keyof typeof PLANS;
}) {
  const planLimits = PLANS[userPlan];
  const canUseWebhooks = planLimits.webhooksPerCheck > 0;
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
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [maxDuration, setMaxDuration] = useState<number | "">(initialData?.maxDuration || "");

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 10) {
      setTags([...tags, normalizedTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

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
      tags: tags.length > 0 ? tags : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
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
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg my-8">
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Daily backup"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Schedule Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Type
            </label>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setScheduleType("preset")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  scheduleType === "preset"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Cron Expression
              </button>
            </div>
          </div>

          {/* Preset Schedule */}
          {scheduleType === "preset" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
                className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  cronError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {cronError ? (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{cronError}</p>
              ) : cronExpression && isValidCronExpression(cronExpression) ? (
                <div className="mt-2 space-y-1">
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    {describeCronExpression(cronExpression)}
                  </p>
                  {nextRunTime && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grace Period (minutes)
            </label>
            <input
              type="number"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              min={1}
              max={60}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              How long to wait before marking as down
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-400 dark:hover:text-blue-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder="Add tag and press Enter"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={tags.length >= 10}
              />
            </div>
            {existingTags.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Suggestions: </span>
                {existingTags.filter(t => !tags.includes(t)).slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded ml-1"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Organize checks with tags (max 10)
            </p>
          </div>

          {/* Max Duration (Slow Job Alert) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slow Job Alert (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value ? Number(e.target.value) : "")}
                min={1}
                placeholder="e.g., 60000"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 dark:text-gray-400 text-sm">ms</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Alert if job duration exceeds this threshold (in milliseconds). Leave empty to disable.
            </p>
            {maxDuration && (
              <p className="text-blue-500 dark:text-blue-400 text-xs mt-1">
                Alert if job takes longer than {(Number(maxDuration) / 1000).toFixed(1)}s
              </p>
            )}
          </div>

          {/* Webhook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Webhook URL {canUseWebhooks ? "(optional)" : ""}
            </label>
            {canUseWebhooks ? (
              <>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    setWebhookError("");
                  }}
                  placeholder="https://example.com/webhook"
                  className={`w-full bg-gray-100 dark:bg-gray-800 border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    webhookError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                  }`}
                />
                {webhookError ? (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-1">{webhookError}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    Receive POST requests when status changes (down/recovery)
                  </p>
                )}
              </>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Webhooks are available on paid plans.
                </p>
                <Link href="/pricing" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm">
                  Upgrade to Starter or Pro
                </Link>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
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
