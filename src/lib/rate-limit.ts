// Rate limiter using Firebase Admin SDK for serverless compatibility
import { adminDb } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
 * Uses Firestore transaction to prevent race conditions
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const sanitizedKey = key.replace(/[\/]/g, "_");
  const docRef = adminDb.collection("rateLimits").doc(sanitizedKey);
  const firestore = getFirestore();

  try {
    const result = await firestore.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        // First request - create new entry
        transaction.set(docRef, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      const data = docSnap.data()!;
      const resetTime = data.resetTime as number;

      // Window expired - reset counter
      if (resetTime < now) {
        transaction.set(docRef, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      const currentCount = data.count as number;

      // Check if limit exceeded BEFORE incrementing
      if (currentCount >= config.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetTime: resetTime,
        };
      }

      // Increment within transaction
      transaction.update(docRef, {
        count: currentCount + 1,
      });

      return {
        success: true,
        remaining: config.maxRequests - currentCount - 1,
        resetTime: resetTime,
      };
    });

    return result;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    throw error;
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
