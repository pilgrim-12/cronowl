"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  Check,
  Ping,
  StatusEvent,
  getUserChecks,
  createCheck,
  deleteCheck,
  updateCheck,
  getCheckPings,
  getStatusHistory,
  calculateRealStatus,
} from "@/lib/checks";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PushToggle } from "@/components/PushToggle";

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
      if (!pings[checkId]) {
        loadPings(checkId);
      }
      if (!statusHistory[checkId]) {
        loadStatusHistory(checkId);
      }
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

  const handleCreateCheck = async (
    name: string,
    schedule: string,
    gracePeriod: number
  ) => {
    if (!user) return;
    try {
      await createCheck(user.uid, { name, schedule, gracePeriod });
      await loadChecks();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create check:", error);
    }
  };

  const handleEditCheck = async (
    name: string,
    schedule: string,
    gracePeriod: number
  ) => {
    if (!editingCheck) return;
    try {
      await updateCheck(editingCheck.id, { name, schedule, gracePeriod });
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
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🦉 CronOwl</h1>
          <div className="flex items-center gap-4">
            <PushToggle userId={user.uid} />
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-400 text-sm">{user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Checks</h2>
            {lastUpdated && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-500 text-xs">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
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
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800 rounded-lg p-1 gap-0.5">
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
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    refreshInterval === option.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
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
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
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
            <div className="text-6xl mb-4">🦉</div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        check
                      )}`}
                    />
                    <div>
                      <h3 className="text-white font-medium">{check.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {check.schedule} • {check.gracePeriod}min grace
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(getPingUrl(check.slug))}
                      className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-800 rounded"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => toggleExpand(check.id)}
                      className="text-gray-400 hover:text-white text-sm px-3 py-1"
                    >
                      {expandedCheck === check.id ? "Hide" : "History"}
                    </button>
                    <button
                      onClick={() => setEditingCheck(check)}
                      className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCheck(check.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1"
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
                <p className="text-gray-500 text-xs mt-2">
                  Last ping:{" "}
                  {check.lastPing
                    ? new Date(check.lastPing.toDate()).toLocaleString()
                    : "Never"}
                </p>

                {/* Expanded History Section */}
                {expandedCheck === check.id && (
                  <div className="mt-4 border-t border-gray-800 pt-4">
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
                              className="bg-gray-800 rounded-lg px-3 py-2 text-center"
                            >
                              <div className="text-gray-300 text-sm">
                                {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(ping.timestamp.toDate()).toLocaleDateString()}
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
                </div>

                <p className="text-gray-400 text-sm mb-2">
                  {check.schedule}
                </p>
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
                              className="bg-gray-800 rounded px-2 py-1 text-xs text-gray-400"
                            >
                              {new Date(ping.timestamp.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
          initialName={editingCheck.name}
          initialSchedule={editingCheck.schedule}
          initialGracePeriod={editingCheck.gracePeriod}
        />
      )}

      <InstallPrompt />
    </div>
  );
}

const SCHEDULE_OPTIONS = [
  { value: "every 1 minute", label: "1m", group: "minutes" },
  { value: "every 2 minutes", label: "2m", group: "minutes" },
  { value: "every 5 minutes", label: "5m", group: "minutes" },
  { value: "every 10 minutes", label: "10m", group: "minutes" },
  { value: "every 15 minutes", label: "15m", group: "minutes" },
  { value: "every 30 minutes", label: "30m", group: "minutes" },
  { value: "every hour", label: "1h", group: "hours" },
  { value: "every 2 hours", label: "2h", group: "hours" },
  { value: "every 6 hours", label: "6h", group: "hours" },
  { value: "every 12 hours", label: "12h", group: "hours" },
  { value: "every day", label: "1d", group: "days" },
  { value: "every week", label: "1w", group: "days" },
];

function CheckModal({
  onClose,
  onSave,
  title,
  initialName = "",
  initialSchedule = "every 5 minutes",
  initialGracePeriod = 5,
}: {
  onClose: () => void;
  onSave: (name: string, schedule: string, gracePeriod: number) => void;
  title: string;
  initialName?: string;
  initialSchedule?: string;
  initialGracePeriod?: number;
}) {
  const [name, setName] = useState(initialName);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [gracePeriod, setGracePeriod] = useState(initialGracePeriod);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, schedule, gracePeriod);
  };

  const minuteOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "minutes");
  const hourOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "hours");
  const dayOptions = SCHEDULE_OPTIONS.filter((o) => o.group === "days");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
