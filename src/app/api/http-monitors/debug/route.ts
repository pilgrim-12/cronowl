import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMonitorsDueForCheck } from "@/lib/http-monitors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Direct query - all monitors
    const allMonitorsQuery = query(collection(db, "httpMonitors"));
    const allSnapshot = await getDocs(allMonitorsQuery);
    const allMonitors = allSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Query with isEnabled filter
    const enabledQuery = query(
      collection(db, "httpMonitors"),
      where("isEnabled", "==", true)
    );
    const enabledSnapshot = await getDocs(enabledQuery);
    const enabledMonitors = enabledSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Use the library function
    const dueMonitors = await getMonitorsDueForCheck();

    return NextResponse.json({
      allMonitorsCount: allMonitors.length,
      allMonitors: allMonitors.map(m => ({
        id: m.id,
        name: m.name,
        isEnabled: m.isEnabled,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt,
      })),
      enabledMonitorsCount: enabledMonitors.length,
      dueMonitorsCount: dueMonitors.length,
      dueMonitors: dueMonitors.map(m => ({
        id: m.id,
        name: m.name,
        isEnabled: m.isEnabled,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt,
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
