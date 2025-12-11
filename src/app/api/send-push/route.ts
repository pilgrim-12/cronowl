import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { tokens, title, body, data } = await request.json();

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: "No tokens provided" },
        { status: 400 }
      );
    }

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const result = await sendPushNotification(tokens, { title, body, data });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Send push error:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}
