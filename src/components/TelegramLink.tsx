"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TelegramLinkProps {
  userId: string;
}

export default function TelegramLink({ userId }: TelegramLinkProps) {
  const [isLinked, setIsLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Listen to user document for telegram status
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsLinked(!!data.telegramChatId);
        setTelegramUsername(data.telegramUsername || null);

        // Clear code and close modal if linked
        if (data.telegramChatId) {
          setLinkingCode(null);
          setCodeExpiry(null);
          setShowModal(false);
        }
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Countdown for code expiry
  useEffect(() => {
    if (!codeExpiry) return;

    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now();
      if (remaining <= 0) {
        setLinkingCode(null);
        setCodeExpiry(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiry]);

  const generateCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLinkingCode(data.code);
        setCodeExpiry(Date.now() + data.expiresIn * 1000);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error generating code:", error);
    }
    setLoading(false);
  };

  const unlinkTelegram = async () => {
    if (!confirm("Are you sure you want to unlink Telegram?")) return;

    setLoading(true);
    try {
      await fetch("/api/telegram/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error("Error unlinking:", error);
    }
    setLoading(false);
  };

  const formatTimeRemaining = () => {
    if (!codeExpiry) return "";
    const remaining = Math.max(0, Math.floor((codeExpiry - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "CronOwlBot";

  // Telegram icon
  const TelegramIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.37-.5 1.03-.78 4.03-1.76 6.72-2.91 8.06-3.47 3.84-1.6 4.64-1.88 5.16-1.89.11 0 .37.03.54.17.14.12.18.28.2.46-.01.06.01.24 0 .38z"/>
    </svg>
  );

  if (isLinked) {
    return (
      <button
        onClick={unlinkTelegram}
        disabled={loading}
        className="p-2 rounded-lg hover:bg-gray-800 transition-colors group relative"
        title={`Telegram: @${telegramUsername || "linked"} (click to unlink)`}
      >
        <TelegramIcon />
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-950" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={generateCode}
        disabled={loading}
        className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-[#0088cc]"
        title="Link Telegram"
      >
        <TelegramIcon />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Link Telegram</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {linkingCode ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-400 mb-2">Your linking code:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-3xl font-mono font-bold text-yellow-400 tracking-widest">
                      {linkingCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(linkingCode)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy code"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Expires in {formatTimeRemaining()}</p>
                </div>

                <div className="space-y-3 text-sm text-gray-400">
                  <p>Send this code to our bot:</p>
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg font-medium transition-colors"
                  >
                    <TelegramIcon />
                    Open @{botUsername}
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Generating code...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
