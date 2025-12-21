import { NextRequest, NextResponse } from "next/server";
import { getPublicStatusPageData } from "@/lib/checks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const statusData = await getPublicStatusPageData(slug);

    if (!statusData) {
      return NextResponse.json(
        { error: "Status page not found" },
        { status: 404 }
      );
    }

    // Set cache headers for 30 seconds
    return NextResponse.json(statusData, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Status page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
