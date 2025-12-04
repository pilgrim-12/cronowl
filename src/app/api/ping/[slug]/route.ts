import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendDownAlert, sendRecoveryAlert } from "@/lib/email";
import { SCHEDULE_MINUTES } from "@/lib/constants";

async function checkUserChecks(userId: string, currentCheckId: string) {
  const checksQuery = query(
    collection(db, "checks"),
    where("userId", "==", userId)
  );
  const checksSnapshot = await getDocs(checksQuery);
  const now = new Date();

  const userDoc = await getDoc(doc(db, "users", userId));
  const userEmail = userDoc.exists() ? userDoc.data().email : null;

  for (const checkDoc of checksSnapshot.docs) {
    if (checkDoc.id === currentCheckId) continue;

    const check = checkDoc.data();
    if (check.status === "new" || !check.lastPing) continue;

    const lastPing = check.lastPing.toDate();
    const scheduleMinutes = SCHEDULE_MINUTES[check.schedule] || 60;
    const gracePeriod = check.gracePeriod || 5;
    const expectedInterval = (scheduleMinutes + gracePeriod) * 60 * 1000;

    const timeSinceLastPing = now.getTime() - lastPing.getTime();

    if (timeSinceLastPing > expectedInterval && check.status !== "down") {
      await updateDoc(doc(db, "checks", checkDoc.id), { status: "down" });
      if (userEmail) {
        await sendDownAlert(userEmail, check.name);
      }
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const checksQuery = query(
      collection(db, "checks"),
      where("slug", "==", slug)
    );
    const checksSnapshot = await getDocs(checksQuery);

    if (checksSnapshot.empty) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

    const checkDoc = checksSnapshot.docs[0];
    const check = checkDoc.data();
    const wasDown = check.status === "down";

    // Update check status
    await updateDoc(doc(db, "checks", checkDoc.id), {
      lastPing: Timestamp.now(),
      status: "up",
    });

    // Save ping to history
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await addDoc(collection(db, "checks", checkDoc.id, "pings"), {
      timestamp: Timestamp.now(),
      ip: ip.split(",")[0].trim(),
      userAgent,
    });

    // Send recovery alert if was down
    if (wasDown) {
      const userDoc = await getDoc(doc(db, "users", check.userId));
      const userEmail = userDoc.exists() ? userDoc.data().email : null;
      if (userEmail) {
        await sendRecoveryAlert(userEmail, check.name);
      }
    }

    // Check other user's checks
    await checkUserChecks(check.userId, checkDoc.id);

    return NextResponse.json({ ok: true, message: "Pong!" });
  } catch (error) {
    console.error("Ping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return GET(request, { params });
}
