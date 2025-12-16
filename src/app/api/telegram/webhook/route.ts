import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyTelegramChat } from "@/lib/telegram";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

async function sendTelegramReply(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const headerSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (headerSecret !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const update: TelegramUpdate = await request.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const username = update.message.from.username;

    // Handle /start command
    if (text === "/start") {
      await sendTelegramReply(
        chatId,
        `👋 *Welcome to CronOwl!*\n\nTo link your account, go to the CronOwl dashboard, click "Link Telegram", and send me the 6-character code you receive.\n\nExample: \`ABC123\``
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /status command
    if (text === "/status") {
      // Find user by chatId
      const usersQuery = query(
        collection(db, "users"),
        where("telegramChatId", "==", String(chatId))
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        await sendTelegramReply(
          chatId,
          "❌ Your Telegram is not linked to any CronOwl account. Send a linking code to connect."
        );
        return NextResponse.json({ ok: true });
      }

      const userId = usersSnapshot.docs[0].id;

      // Get user's checks
      const checksQuery = query(
        collection(db, "checks"),
        where("userId", "==", userId)
      );
      const checksSnapshot = await getDocs(checksQuery);

      if (checksSnapshot.empty) {
        await sendTelegramReply(chatId, "📋 You have no checks configured yet.");
        return NextResponse.json({ ok: true });
      }

      let statusText = "📊 *Your Checks Status:*\n\n";
      checksSnapshot.docs.forEach((doc) => {
        const check = doc.data();
        const emoji =
          check.status === "up" ? "🟢" : check.status === "down" ? "🔴" : "⚪";
        statusText += `${emoji} *${check.name}*\n   Schedule: ${check.schedule}\n\n`;
      });

      await sendTelegramReply(chatId, statusText);
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === "/help") {
      await sendTelegramReply(
        chatId,
        `🦉 *CronOwl Bot Commands:*\n\n/start - Welcome message\n/status - Check status of all your cron jobs\n/help - Show this help message\n\nTo link your account, send the 6-character code from the CronOwl dashboard.`
      );
      return NextResponse.json({ ok: true });
    }

    // Check if text looks like a linking code (6 alphanumeric chars)
    if (/^[A-Z0-9]{6}$/i.test(text)) {
      const code = text.toUpperCase();

      // Find user with this linking code
      const usersQuery = query(
        collection(db, "users"),
        where("telegramLinkingCode", "==", code)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        await sendTelegramReply(
          chatId,
          "❌ Invalid or expired code. Please generate a new code from the CronOwl dashboard."
        );
        return NextResponse.json({ ok: true });
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      // Check if code is expired
      if (userData.telegramLinkingExpires && userData.telegramLinkingExpires < Date.now()) {
        await sendTelegramReply(
          chatId,
          "❌ This code has expired. Please generate a new code from the CronOwl dashboard."
        );
        return NextResponse.json({ ok: true });
      }

      // Link the account
      await updateDoc(doc(db, "users", userDoc.id), {
        telegramChatId: String(chatId),
        telegramUsername: username || null,
        telegramLinkingCode: null,
        telegramLinkingExpires: null,
      });

      // Send confirmation
      await verifyTelegramChat(String(chatId));

      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendTelegramReply(
      chatId,
      "🤔 I didn't understand that. Send /help for available commands, or send a 6-character linking code to connect your account."
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// GET - Verify webhook is working
export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook is active" });
}
