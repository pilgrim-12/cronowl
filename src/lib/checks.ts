import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { SCHEDULE_MINUTES } from "./constants";

export interface Check {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string;
  gracePeriod: number;
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  createdAt: Timestamp;
}

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 10; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function calculateRealStatus(check: Check): "up" | "down" | "new" {
  if (check.status === "new" || !check.lastPing) {
    return "new";
  }

  const now = new Date();
  const lastPing = check.lastPing.toDate();
  const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
  const gracePeriod = check.gracePeriod || 5;
  const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

  const timeSinceLastPing = now.getTime() - lastPing.getTime();

  if (timeSinceLastPing > expectedInterval) {
    return "down";
  }

  return "up";
}

export async function createCheck(
  userId: string,
  data: { name: string; schedule: string; gracePeriod: number }
): Promise<string> {
  const checkData = {
    userId,
    name: data.name,
    slug: generateSlug(),
    schedule: data.schedule,
    gracePeriod: data.gracePeriod,
    status: "new",
    lastPing: null,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "checks"), checkData);
  return docRef.id;
}

export async function getUserChecks(userId: string): Promise<Check[]> {
  const checksQuery = query(
    collection(db, "checks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(checksQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Check[];
}

export async function deleteCheck(checkId: string): Promise<void> {
  await deleteDoc(doc(db, "checks", checkId));
}

export async function updateCheck(
  checkId: string,
  data: Partial<Check>
): Promise<void> {
  await updateDoc(doc(db, "checks", checkId), data);
}

export async function recordPing(slug: string): Promise<boolean> {
  const checksQuery = query(
    collection(db, "checks"),
    where("slug", "==", slug)
  );
  const snapshot = await getDocs(checksQuery);

  if (snapshot.empty) {
    return false;
  }

  const checkDoc = snapshot.docs[0];
  await updateDoc(doc(db, "checks", checkDoc.id), {
    lastPing: Timestamp.now(),
    status: "up",
  });

  return true;
}
