"use client";

import { useState } from "react";

interface DayStatus {
  date: string;
  status: "operational" | "incident" | "no-data";
  uptimePercent?: number;
  downMinutes?: number;
}

interface UptimeBarProps {
  days: DayStatus[];
  uptimePercent: number;
  compact?: boolean;
}

export function UptimeBar({ days, uptimePercent, compact = false }: UptimeBarProps) {
  const [hoveredDay, setHoveredDay] = useState<DayStatus | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (day: DayStatus, event: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: DayStatus["status"]) => {
    switch (status) {
      case "operational":
        return "bg-green-500 hover:bg-green-400";
      case "incident":
        return "bg-red-500 hover:bg-red-400";
      case "no-data":
      default:
        return "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600";
    }
  };

  const getUptimeColor = (percent: number) => {
    if (percent >= 99.9) return "text-green-400";
    if (percent >= 99) return "text-yellow-400";
    return "text-red-400";
  };

  if (compact) {
    // Compact version: just the bars without labels
    return (
      <div className="relative">
        <div className="flex gap-px">
          {days.map((day, i) => (
            <div
              key={i}
              className={`h-6 flex-1 rounded-sm cursor-pointer transition-colors ${getStatusColor(day.status)}`}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
        {hoveredDay && (
          <div
            className="fixed z-50 px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 60,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-medium text-gray-900 dark:text-white">{formatDate(hoveredDay.date)}</div>
            <div className="text-gray-600 dark:text-gray-400">
              {hoveredDay.status === "operational" && "No incidents"}
              {hoveredDay.status === "incident" && `${hoveredDay.downMinutes}m downtime`}
              {hoveredDay.status === "no-data" && "No data"}
            </div>
            {hoveredDay.uptimePercent !== undefined && (
              <div className={getUptimeColor(hoveredDay.uptimePercent)}>
                {hoveredDay.uptimePercent.toFixed(2)}% uptime
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full version with labels
  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-500">{days.length} days</span>
        <span className={`text-sm font-medium ${getUptimeColor(uptimePercent)}`}>
          {uptimePercent.toFixed(2)}% uptime
        </span>
      </div>
      <div className="flex gap-px">
        {days.map((day, i) => (
          <div
            key={i}
            className={`h-8 flex-1 min-w-[2px] rounded-sm cursor-pointer transition-colors ${getStatusColor(day.status)}`}
            onMouseEnter={(e) => handleMouseEnter(day, e)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>{formatDate(days[0]?.date || "")}</span>
        <span>Today</span>
      </div>
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 70,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium text-gray-900 dark:text-white">{formatDate(hoveredDay.date)}</div>
          <div className="text-gray-600 dark:text-gray-400">
            {hoveredDay.status === "operational" && "No incidents"}
            {hoveredDay.status === "incident" && `${hoveredDay.downMinutes}m downtime`}
            {hoveredDay.status === "no-data" && "No data"}
          </div>
          {hoveredDay.uptimePercent !== undefined && (
            <div className={getUptimeColor(hoveredDay.uptimePercent)}>
              {hoveredDay.uptimePercent.toFixed(2)}% uptime
            </div>
          )}
        </div>
      )}
    </div>
  );
}
