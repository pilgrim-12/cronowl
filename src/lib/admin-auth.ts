import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";

// Admin authentication context
export interface AdminAuthContext {
  userId: string;
  email: string;
}

// API response helpers (reuse from api-auth patterns)
export function adminApiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function adminApiError(
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

// Check if a user is an admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data();
    return userData?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Check if a user is blocked
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data();
    return userData?.isBlocked === true;
  } catch (error) {
    console.error("Error checking blocked status:", error);
    return false;
  }
}

// Middleware to authenticate admin API requests
export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, auth: AdminAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return adminApiError(
        "UNAUTHORIZED",
        "Missing or invalid Authorization header",
        401
      );
    }

    const idToken = authHeader.substring(7); // Remove "Bearer "

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return adminApiError(
        "INVALID_TOKEN",
        "Invalid or expired authentication token",
        401
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email || "";

    // Check if user is blocked
    const blocked = await isUserBlocked(userId);
    if (blocked) {
      return adminApiError(
        "ACCOUNT_BLOCKED",
        "Your account has been blocked",
        403
      );
    }

    // Check if user is admin
    const admin = await isUserAdmin(userId);
    if (!admin) {
      return adminApiError(
        "FORBIDDEN",
        "Admin access required",
        403
      );
    }

    // Call the handler with admin context
    return handler(request, {
      userId,
      email,
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return adminApiError(
      "INTERNAL_ERROR",
      "Authentication failed",
      500
    );
  }
}

// Get client IP from request headers
export function getClientIp(request: NextRequest): string {
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
