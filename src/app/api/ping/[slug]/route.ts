import { NextRequest, NextResponse } from "next/server";
import { recordPing } from "@/lib/checks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const success = await recordPing(slug);

    if (!success) {
      return NextResponse.json({ error: "Check not found" }, { status: 404 });
    }

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
