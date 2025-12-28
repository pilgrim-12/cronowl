"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface SmartCTAButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SmartCTAButton({ className, children }: SmartCTAButtonProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`bg-blue-600/50 text-white rounded-lg px-8 py-3 text-lg font-medium ${className}`}>
        {children || "Start Monitoring — Free"}
      </div>
    );
  }

  // If logged in, go to dashboard
  if (user) {
    return (
      <Link
        href="/dashboard"
        className={`bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors ${className}`}
      >
        Go to Dashboard
      </Link>
    );
  }

  // Not logged in, go to signup
  return (
    <Link
      href="/signup"
      className={`bg-blue-600 text-white rounded-lg px-8 py-3 text-lg font-medium hover:bg-blue-700 transition-colors ${className}`}
    >
      {children || "Start Monitoring — Free"}
    </Link>
  );
}
