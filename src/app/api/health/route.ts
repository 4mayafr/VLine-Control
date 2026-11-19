import { NextResponse } from "next/server";
import { networkStats } from "@/lib/repo/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = networkStats();
    return NextResponse.json({
      ok: true,
      service: "V/LINE CONTROL",
      dataSource: "operator-maintained",
      timestamp: new Date().toISOString(),
      counts: {
        lines: stats.lineCount,
        stations: stats.stationCount,
        activeDisruptions: stats.activeDisruptions,
        pendingInform: stats.pendingInform,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed.",
      },
      { status: 500 },
    );
  }
}
