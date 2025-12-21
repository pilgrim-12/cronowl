import { NextRequest, NextResponse } from "next/server";
import { getPublicStatusPageData } from "@/lib/checks";

function generateBadgeSVG(
  label: string,
  status: "operational" | "degraded" | "down",
  style: "flat" | "flat-square" | "for-the-badge" = "flat"
): string {
  const statusConfig = {
    operational: { text: "operational", color: "#22c55e" },
    degraded: { text: "degraded", color: "#f59e0b" },
    down: { text: "down", color: "#ef4444" },
  };

  const config = statusConfig[status];
  const labelWidth = label.length * 6.5 + 10;
  const statusWidth = config.text.length * 6.5 + 10;
  const totalWidth = labelWidth + statusWidth;

  if (style === "for-the-badge") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" viewBox="0 0 ${totalWidth} 28">
  <rect width="${labelWidth}" height="28" fill="#555"/>
  <rect x="${labelWidth}" width="${statusWidth}" height="28" fill="${config.color}"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="10" font-weight="bold">
    <text x="${labelWidth / 2}" y="18" textLength="${labelWidth - 10}">${label.toUpperCase()}</text>
    <text x="${labelWidth + statusWidth / 2}" y="18" textLength="${statusWidth - 10}">${config.text.toUpperCase()}</text>
  </g>
</svg>`;
  }

  const radius = style === "flat-square" ? "0" : "3";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="round">
    <rect width="${totalWidth}" height="20" rx="${radius}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${config.color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#smooth)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + statusWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${config.text}</text>
    <text x="${labelWidth + statusWidth / 2}" y="14">${config.text}</text>
  </g>
</svg>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const label = searchParams.get("label") || "status";
  const style = (searchParams.get("style") || "flat") as "flat" | "flat-square" | "for-the-badge";

  try {
    const statusData = await getPublicStatusPageData(slug);

    if (!statusData) {
      // Return a "not found" badge
      const svg = generateBadgeSVG(label, "down", style);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    const svg = generateBadgeSVG(label, statusData.overallStatus, style);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Badge error:", error);
    const svg = generateBadgeSVG(label, "down", style);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
