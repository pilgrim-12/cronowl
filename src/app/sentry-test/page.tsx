"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryTestPage() {
  const [sent, setSent] = useState(false);

  const triggerError = () => {
    try {
      throw new Error("Test error from CronOwl - Sentry integration working!");
    } catch (error) {
      Sentry.captureException(error);
      setSent(true);
    }
  };

  const triggerUnhandledError = () => {
    throw new Error("Unhandled test error from CronOwl!");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">Sentry Test Page</h1>
        <p className="text-gray-400 mb-6">
          Use these buttons to test Sentry error tracking integration.
        </p>

        <div className="space-y-4">
          <button
            onClick={triggerError}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Send Test Error (Handled)
          </button>

          <button
            onClick={triggerUnhandledError}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Trigger Unhandled Error
          </button>
        </div>

        {sent && (
          <p className="mt-4 text-green-400 text-sm">
            Error sent to Sentry! Check your Sentry dashboard.
          </p>
        )}

        <p className="mt-6 text-gray-500 text-xs">
          Note: This page is for testing only. Remove in production or restrict
          access.
        </p>
      </div>
    </div>
  );
}
