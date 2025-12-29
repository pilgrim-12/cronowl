// Rate limiter using Firestore for serverless compatibility
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given key (usually user ID)
 * Uses Firestore for persistence across serverless instances
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const docRef = doc(db, "rateLimits", key.replace(/[\/]/g, "_")); // Sanitize key for Firestore

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // First request - create new entry
      await setDoc(docRef, {
        count: 1,
        resetTime: Timestamp.fromMillis(now + config.windowMs),
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    const data = docSnap.data();
    const resetTime = data.resetTime.toMillis();

    // Window expired - reset counter
    if (resetTime < now) {
      await setDoc(docRef, {
        count: 1,
        resetTime: Timestamp.fromMillis(now + config.windowMs),
      });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Check if limit exceeded
    if (data.count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: resetTime,
      };
    }

    // Increment count
    await setDoc(docRef, {
      count: data.count + 1,
      resetTime: data.resetTime,
    });

    return {
      success: true,
      remaining: config.maxRequests - data.count - 1,
      resetTime: resetTime,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the request (fail open)
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

// Preset rate limit configs
export const RATE_LIMITS = {
  // Ping endpoint: 100 requests per minute per IP
  ping: { maxRequests: 100, windowMs: 60000 },
  // Auth endpoints: 10 requests per minute per IP
  auth: { maxRequests: 10, windowMs: 60000 },
  // API endpoints: 60 requests per minute per IP
  api: { maxRequests: 60, windowMs: 60000 },
  // Webhook test: 5 requests per minute per user
  webhookTest: { maxRequests: 5, windowMs: 60000 },
} as const;
