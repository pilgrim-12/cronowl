import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from "crypto";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { PLANS, PlanType } from "./plans";

// API Key interface
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// Generate a new API key
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(24);
  const key = `sk_live_${randomBytes.toString("base64url")}`;
  return key;
}

// Hash an API key for storage
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Get key prefix for display (first 12 chars + ...)
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + "...";
}

// Get user's plan
async function getUserPlan(userId: string): Promise<PlanType> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return "free";
  return (userDoc.data().plan as PlanType) || "free";
}

// Create a new API key for a user
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; keyData: ApiKey }> {
  // Check plan-based limit
  const plan = await getUserPlan(userId);
  const planLimits = PLANS[plan];
  const existingKeys = await getUserApiKeys(userId);

  if (existingKeys.length >= planLimits.apiKeysLimit) {
    throw new Error(`Maximum of ${planLimits.apiKeysLimit} API keys allowed on ${planLimits.name} plan`);
  }

  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = getKeyPrefix(key);

  const docRef = await addDoc(collection(db, "apiKeys"), {
    userId,
    name,
    keyHash,
    keyPrefix,
    createdAt: Timestamp.now(),
  });

  return {
    key, // Full key, shown only once
    keyData: {
      id: docRef.id,
      userId,
      name,
      keyHash,
      keyPrefix,
      createdAt: Timestamp.now(),
    },
  };
}

// Get all API keys for a user (without the actual key, just metadata)
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const keysQuery = query(
    collection(db, "apiKeys"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(keysQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ApiKey[];
}

// Validate an API key and return the userId
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; userId?: string; keyId?: string }> {
  const keyHash = hashApiKey(key);

  const keysQuery = query(
    collection(db, "apiKeys"),
    where("keyHash", "==", keyHash)
  );
  const snapshot = await getDocs(keysQuery);

  if (snapshot.empty) {
    return { valid: false };
  }

  const keyDoc = snapshot.docs[0];
  const keyData = keyDoc.data();

  // Update lastUsedAt
  await updateDoc(doc(db, "apiKeys", keyDoc.id), {
    lastUsedAt: Timestamp.now(),
  });

  return {
    valid: true,
    userId: keyData.userId,
    keyId: keyDoc.id,
  };
}

// Revoke (delete) an API key
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  // Verify the key belongs to the user
  const keyDoc = await getDoc(doc(db, "apiKeys", keyId));
  if (!keyDoc.exists() || keyDoc.data().userId !== userId) {
    return false;
  }

  await deleteDoc(doc(db, "apiKeys", keyId));
  return true;
}

// API response helpers
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

// API Authentication context
export interface ApiAuthContext {
  userId: string;
  keyId: string;
  plan: PlanType;
  planLimits: (typeof PLANS)[PlanType];
}

// Middleware to authenticate API requests
export async function withApiAuth(
  request: NextRequest,
  handler: (req: NextRequest, auth: ApiAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extract Bearer token first (before rate limiting to get user plan)
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError(
      "UNAUTHORIZED",
      "Missing or invalid Authorization header. Use: Bearer sk_live_xxx",
      401
    );
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  // Validate key format
  if (!apiKey.startsWith("sk_live_")) {
    return apiError(
      "INVALID_API_KEY",
      "Invalid API key format",
      401
    );
  }

  // Validate key in database
  const validation = await validateApiKey(apiKey);
  if (!validation.valid || !validation.userId || !validation.keyId) {
    return apiError(
      "INVALID_API_KEY",
      "Invalid or revoked API key",
      401
    );
  }

  // Get user's plan for rate limiting
  const plan = await getUserPlan(validation.userId);
  const planLimits = PLANS[plan];

  // Rate limiting by user ID with plan-based limits
  const rateLimit = await checkRateLimit(`api:user:${validation.userId}`, {
    maxRequests: planLimits.apiRequestsPerMin,
    windowMs: 60000, // 1 minute
  });

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return apiError(
      "RATE_LIMIT_EXCEEDED",
      `Too many requests. Your ${planLimits.name} plan allows ${planLimits.apiRequestsPerMin} requests/min.`,
      429,
      {
        retryAfter,
        limit: planLimits.apiRequestsPerMin,
        remaining: 0,
        plan: plan,
      }
    );
  }

  // Call the handler with auth context including plan info
  return handler(request, {
    userId: validation.userId,
    keyId: validation.keyId,
    plan,
    planLimits,
  });
}
