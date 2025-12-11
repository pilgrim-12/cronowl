import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { app, db } from "./firebase";

let messaging: ReturnType<typeof getMessaging> | null = null;

// Initialize messaging only on client side
function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function getPushToken(): Promise<string | null> {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not configured");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    pushTokens: arrayUnion(token),
  });
}

export async function removePushToken(
  userId: string,
  token: string
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    pushTokens: arrayRemove(token),
  });
}

export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string } }) => void
): () => void {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return () => {};

  return onMessage(messagingInstance, callback);
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined") return null;
  return Notification.permission;
}
