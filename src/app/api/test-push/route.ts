import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendPushNotification } from "@/lib/firebase-admin";

async function sendTestPush(userId: string) {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return { error: "User not found", status: 404 };
  }

  const user = userDoc.data();
  const tokens = user.pushTokens;

  if (!tokens || tokens.length === 0) {
    return {
      error: "No push tokens found for user",
      userData: { email: user.email, hasPushTokens: false },
      status: 400,
    };
  }

  const result = await sendPushNotification(tokens, {
    title: "🔔 Test Notification",
    body: "Push notifications are working!",
    data: {
      type: "test",
    },
  });

  return {
    ok: true,
    tokensCount: tokens.length,
    result,
  };
}

// GET for easy browser testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required as query param" }, { status: 400 });
  }

  try {
    const result = await sendTestPush(userId);
    if (result.status) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json(
      { error: "Failed to send test push", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const result = await sendTestPush(userId);
    if (result.status) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json(
      { error: "Failed to send test push", details: String(error) },
      { status: 500 }
    );
  }
}
