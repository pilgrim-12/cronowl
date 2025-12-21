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
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limit";

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

// Create a new API key for a user
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; keyData: ApiKey }> {
  // Check limit (max 10 keys per user)
  const existingKeys = await getUserApiKeys(userId);
  if (existingKeys.length >= 10) {
    throw new Error("Maximum of 10 API keys allowed per user");
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
}

// Middleware to authenticate API requests
export async function withApiAuth(
  request: NextRequest,
  handler: (req: NextRequest, auth: ApiAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  // Rate limiting by IP first
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`api:${clientIp}`, RATE_LIMITS.api);

  if (!rateLimit.success) {
    return apiError(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests",
      429,
      { retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) }
    );
  }

  // Extract Bearer token
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

  // Call the handler with auth context
  return handler(request, {
    userId: validation.userId,
    keyId: validation.keyId,
  });
}
