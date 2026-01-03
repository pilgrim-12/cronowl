"use client";

import { useState } from "react";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentSeverity = "minor" | "major" | "critical";

interface IncidentUpdate {
  message: string;
  status: IncidentStatus;
  createdAt: string;
}

interface PublicIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

interface IncidentBannerProps {
  incidents: PublicIncident[];
  type: "active" | "recent";
}

const severityConfig = {
  critical: {
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  major: {
    bg: "bg-orange-500/10 border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  minor: {
    bg: "bg-yellow-500/10 border-yellow-500/30",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const statusLabels: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function IncidentCard({ incident, defaultExpanded = false }: { incident: PublicIncident; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = severityConfig[incident.severity];

  return (
    <div className={`${config.bg} border rounded-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={config.text}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white">{incident.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
              {incident.severity}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="capitalize">{statusLabels[incident.status]}</span>
            <span>•</span>
            <span>{formatRelativeTime(incident.updatedAt)}</span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && incident.updates.length > 0 && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="pt-4 space-y-4">
            {incident.updates.map((update, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${
                    update.status === "resolved" ? "bg-green-500" :
                    update.status === "monitoring" ? "bg-blue-500" :
                    update.status === "identified" ? "bg-yellow-500" :
                    "bg-orange-500"
                  }`} />
                  {index < incident.updates.length - 1 && (
                    <div className="w-px flex-1 bg-gray-300 dark:bg-gray-700 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-1">
                    <span className="capitalize">{statusLabels[update.status]}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(update.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IncidentBanner({ incidents, type }: IncidentBannerProps) {
  if (incidents.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
        {type === "active" ? "Active Incidents" : "Recent Incidents"}
      </h2>
      <div className="space-y-3">
        {incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            defaultExpanded={type === "active"}
          />
        ))}
      </div>
    </div>
  );
}
