import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateLinkingCode } from "@/lib/telegram";

// POST - Generate a linking code for user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Generate a unique linking code
    const linkingCode = generateLinkingCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store linking code in user document
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        telegramLinkingCode: linkingCode,
        telegramLinkingExpires: expiresAt,
      });
    } else {
      await setDoc(userRef, {
        telegramLinkingCode: linkingCode,
        telegramLinkingExpires: expiresAt,
      });
    }

    return NextResponse.json({
      ok: true,
      code: linkingCode,
      expiresIn: 600, // seconds
    });
  } catch (error) {
    console.error("Error generating linking code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink Telegram account
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      telegramChatId: null,
      telegramUsername: null,
      telegramLinkingCode: null,
      telegramLinkingExpires: null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error unlinking Telegram:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
