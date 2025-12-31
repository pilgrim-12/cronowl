"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Head from "next/head";
import { OwlLogo } from "@/components/OwlLogo";
import { UptimeBar } from "@/components/UptimeBar";
import { IncidentBanner } from "@/components/IncidentBanner";

interface DayStatus {
  date: string;
  status: "operational" | "incident" | "no-data";
  uptimePercent?: number;
  downMinutes?: number;
}

interface StatusCheck {
  id: string;
  name: string;
  status: "up" | "down" | "new";
  lastPing: { seconds: number; nanoseconds: number } | null;
  tags?: string[];
  history?: DayStatus[];
  uptimePercent?: number;
}

interface StatusPageBranding {
  logoUrl?: string;
  primaryColor?: string;
  hidePoweredBy?: boolean;
}

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentSeverity = "minor" | "major" | "critical";

interface PublicIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  updates: {
    message: string;
    status: IncidentStatus;
    createdAt: string;
  }[];
}

interface StatusPageData {
  title: string;
  description?: string;
  checks: StatusCheck[];
  overallStatus: "operational" | "degraded" | "down";
  updatedAt: string;
  branding?: StatusPageBranding;
  incidents?: {
    active: PublicIncident[];
    recent: PublicIncident[];
  };
}

function formatRelativeTime(timestamp: { seconds: number } | null): string {
  if (!timestamp) return "Never";

  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function StatusIndicator({ status }: { status: "up" | "down" | "new" }) {
  const config = {
    up: { color: "bg-green-500", pulse: true, label: "Operational" },
    down: { color: "bg-red-500", pulse: false, label: "Down" },
    new: { color: "bg-gray-500", pulse: false, label: "Pending" },
  };

  const { color, pulse, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        {pulse && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${color} animate-ping opacity-75`} />
        )}
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  );
}

function OverallStatusBanner({ status, primaryColor }: { status: "operational" | "degraded" | "down"; primaryColor?: string }) {
  const config = {
    operational: {
      bg: "bg-green-500/10 border-green-500/30",
      text: "text-green-400",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: "All Systems Operational",
    },
    degraded: {
      bg: "bg-yellow-500/10 border-yellow-500/30",
      text: "text-yellow-400",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      label: "Partial System Outage",
    },
    down: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      label: "Major System Outage",
    },
  };

  const { bg, text, icon, label } = config[status];

  // Apply custom primary color for operational status if provided
  const customStyle = primaryColor && status === "operational"
    ? { borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}15` }
    : undefined;
  const customTextStyle = primaryColor && status === "operational"
    ? { color: primaryColor }
    : undefined;

  return (
    <div className={`${bg} border rounded-xl p-6 mb-8`} style={customStyle}>
      <div className={`flex items-center gap-3 ${text}`} style={customTextStyle}>
        {icon}
        <span className="text-xl font-semibold">{label}</span>
      </div>
    </div>
  );
}

export default function StatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<StatusPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const toggleCheckExpanded = (checkId: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/status/${resolvedParams.slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Status page not found");
          } else {
            setError("Failed to load status page");
          }
          return;
        }
        const statusData = await res.json();
        setData(statusData);
      } catch {
        setError("Failed to load status page");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <OwlLogo className="w-7 h-7" />
              <span className="text-lg font-semibold text-white">CronOwl</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Status Page Not Found</h1>
            <p className="text-gray-400 mb-6">{error || "This status page doesn't exist or is private."}</p>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go to CronOwl
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const branding = data.branding;
  const hasActiveIncidents = data.incidents?.active && data.incidents.active.length > 0;
  const hasRecentIncidents = data.incidents?.recent && data.incidents.recent.length > 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <OwlLogo className="w-7 h-7" />
            )}
            <span className="text-lg font-semibold text-white">{data.title}</span>
          </div>
          {!branding?.hidePoweredBy && (
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Powered by CronOwl
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Description */}
        {data.description && (
          <p className="text-gray-400 mb-6">{data.description}</p>
        )}

        {/* Active Incidents */}
        {hasActiveIncidents && (
          <div className="mb-8">
            <IncidentBanner incidents={data.incidents!.active} type="active" />
          </div>
        )}

        {/* Overall status banner */}
        <OverallStatusBanner status={data.overallStatus} primaryColor={branding?.primaryColor} />

        {/* Checks list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Services
          </h2>
          {data.checks.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">No services configured</p>
            </div>
          ) : (
            data.checks.map((check) => {
              const isExpanded = expandedChecks.has(check.id);
              const hasHistory = check.history && check.history.length > 0;

              return (
                <div
                  key={check.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
                >
                  <div
                    className={`p-4 flex items-center justify-between ${hasHistory ? "cursor-pointer hover:bg-gray-800/50" : ""}`}
                    onClick={() => hasHistory && toggleCheckExpanded(check.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{check.name}</h3>
                          {check.uptimePercent !== undefined && (
                            <span className={`text-xs ${
                              check.uptimePercent >= 99.9 ? "text-green-400" :
                              check.uptimePercent >= 99 ? "text-yellow-400" :
                              "text-red-400"
                            }`}>
                              {check.uptimePercent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                        {check.tags && check.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {check.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(check.lastPing)}
                      </span>
                      <StatusIndicator status={check.status} />
                      {hasHistory && (
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {isExpanded && check.history && (
                    <div className="px-4 pb-4 border-t border-gray-800 pt-4">
                      <UptimeBar
                        days={check.history}
                        uptimePercent={check.uptimePercent || 100}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Recent Resolved Incidents */}
        {hasRecentIncidents && (
          <div className="mt-8">
            <IncidentBanner incidents={data.incidents!.recent} type="recent" />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date(data.updatedAt).toLocaleString()}</span>
          {!branding?.hidePoweredBy && (
            <Link
              href="https://cronowl.com"
              target="_blank"
              className="hover:text-gray-400 transition-colors"
            >
              Create your own status page with CronOwl
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
