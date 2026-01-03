"use client";

import { useState, useEffect } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getPushToken,
  savePushToken,
  removePushToken,
  onForegroundMessage,
} from "@/lib/push-notifications";

interface PushToggleProps {
  userId: string;
}

export function PushToggle({ userId }: PushToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);

    if (supported) {
      const permission = getNotificationPermission();
      setIsEnabled(permission === "granted");

      // Check if we have a token stored
      if (permission === "granted") {
        getPushToken().then((token) => {
          if (token) {
            setCurrentToken(token);
          }
        });
      }

      // Listen for foreground messages
      const unsubscribe = onForegroundMessage((payload) => {
        // Show a toast notification when app is in foreground
        if (payload.notification) {
          const { title, body } = payload.notification;
          if (Notification.permission === "granted") {
            new Notification(title || "CronOwl", {
              body: body || "You have a new notification",
              icon: "/icons/icon-192.svg",
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) return;

    setIsLoading(true);

    try {
      if (isEnabled && currentToken) {
        // Disable notifications
        await removePushToken(userId, currentToken);
        setIsEnabled(false);
        setCurrentToken(null);
      } else {
        // Enable notifications
        const granted = await requestNotificationPermission();
        if (granted) {
          const token = await getPushToken();
          if (token) {
            await savePushToken(userId, token);
            setCurrentToken(token);
            setIsEnabled(true);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        isEnabled
          ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isEnabled ? "Push notifications enabled" : "Enable push notifications"}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isEnabled ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        )}
      </svg>
      {isLoading ? "..." : isEnabled ? "Push On" : "Push Off"}
    </button>
  );
}
