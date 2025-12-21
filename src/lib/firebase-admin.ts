import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminMessaging: Messaging | null = null;
let adminFirestore: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials not configured");
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return adminApp;
}

export function getAdminMessaging(): Messaging {
  if (adminMessaging) return adminMessaging;
  adminMessaging = getMessaging(getAdminApp());
  return adminMessaging;
}

function getAdminAuth(): Auth {
  if (adminAuthInstance) return adminAuthInstance;
  adminAuthInstance = getAuth(getAdminApp());
  return adminAuthInstance;
}

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
};

function getAdminFirestore(): Firestore {
  if (adminFirestore) return adminFirestore;
  adminFirestore = getFirestore(getAdminApp());
  return adminFirestore;
}

export const adminDb = {
  collection: (collectionPath: string) => getAdminFirestore().collection(collectionPath),
};

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failure: number }> {
  if (tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  const messaging = getAdminMessaging();

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: {
        fcmOptions: {
          link: "/dashboard",
        },
      },
    });

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}
