import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  createApiKey,
  getUserApiKeys,
  revokeApiKey,
} from "@/lib/api-auth";
import { logApiKeyCreated, logApiKeyRevoked } from "@/lib/user-activity";

// Verify Firebase ID token from Authorization header
async function verifyAuth(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { userId: decodedToken.uid, email: decodedToken.email || "" };
  } catch {
    return null;
  }
}

// Get user email from Firestore
async function getUserEmail(userId: string): Promise<string> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    return userDoc.exists ? userDoc.data()?.email || "" : "";
  } catch {
    return "";
  }
}

// GET /api/user/api-keys - List API keys (authenticated with Firebase token)
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await getUserApiKeys(auth.userId);

    const safeKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,
      createdAt: key.createdAt.toDate().toISOString(),
      lastUsedAt: key.lastUsedAt?.toDate().toISOString() || null,
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return NextResponse.json({ error: "Failed to list API keys" }, { status: 500 });
  }
}

// POST /api/user/api-keys - Create a new API key (authenticated with Firebase token)
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name?.trim();

    if (!name || name.length < 1 || name.length > 50) {
      return NextResponse.json(
        { error: "Name is required and must be between 1 and 50 characters" },
        { status: 400 }
      );
    }

    const { key, keyData } = await createApiKey(auth.userId, name);

    // Log the activity
    const userEmail = auth.email || await getUserEmail(auth.userId);
    await logApiKeyCreated(auth.userId, userEmail, keyData.id, name);

    return NextResponse.json({
      id: keyData.id,
      name: keyData.name,
      key, // Full key, shown only once!
      prefix: keyData.keyPrefix,
      createdAt: keyData.createdAt.toDate().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Maximum")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

// DELETE /api/user/api-keys - Revoke an API key (authenticated with Firebase token)
export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const success = await revokeApiKey(auth.userId, keyId);

    if (!success) {
      return NextResponse.json(
        { error: "API key not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Log the activity
    const userEmail = auth.email || await getUserEmail(auth.userId);
    await logApiKeyRevoked(auth.userId, userEmail, keyId, "");

    return NextResponse.json({ revoked: true });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
