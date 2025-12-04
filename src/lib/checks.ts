import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Check {
  id: string;
  userId: string;
  name: string;
  slug: string;
  schedule: string; // e.g., "every 5 minutes", "every hour", "every day"
  gracePeriod: number; // minutes
  status: "up" | "down" | "new";
  lastPing: Timestamp | null;
  createdAt: Timestamp;
}

export type CreateCheckInput = {
  name: string;
  schedule: string;
  gracePeriod: number;
};

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 10; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export async function createCheck(
  userId: string,
  input: CreateCheckInput
): Promise<string> {
  const slug = generateSlug();
  const docRef = await addDoc(collection(db, "checks"), {
    userId,
    name: input.name,
    slug,
    schedule: input.schedule,
    gracePeriod: input.gracePeriod,
    status: "new",
    lastPing: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserChecks(userId: string): Promise<Check[]> {
  const q = query(
    collection(db, "checks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Check[];
}

export async function updateCheck(
  checkId: string,
  data: Partial<CreateCheckInput>
): Promise<void> {
  await updateDoc(doc(db, "checks", checkId), data);
}

export async function deleteCheck(checkId: string): Promise<void> {
  await deleteDoc(doc(db, "checks", checkId));
}

export async function recordPing(slug: string): Promise<boolean> {
  const q = query(collection(db, "checks"), where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return false;
  }

  const checkDoc = snapshot.docs[0];
  await updateDoc(checkDoc.ref, {
    lastPing: serverTimestamp(),
    status: "up",
  });

  return true;
}
