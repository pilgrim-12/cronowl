"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Don't show if user is verified or signed in with OAuth (Google/GitHub)
  if (!user || user.emailVerified || !user.email) {
    return null;
  }

  // Check if user signed in with OAuth provider (they don't need email verification)
  const isOAuthUser = user.providerData.some(
    (provider) => provider.providerId === "google.com" || provider.providerId === "github.com"
  );
  if (isOAuthUser) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setError("");
    setSent(false);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-yellow-500 font-medium">Verify your email</h3>
          <p className="text-gray-400 text-sm mt-1">
            Please verify your email address ({user.email}) to ensure you receive important notifications about your cron jobs.
          </p>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
          {sent ? (
            <p className="text-green-400 text-sm mt-2">Verification email sent! Check your inbox.</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={sending}
              className="mt-3 text-sm text-yellow-400 hover:text-yellow-300 font-medium disabled:opacity-50"
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
