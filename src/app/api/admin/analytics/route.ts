import { NextRequest, NextResponse } from "next/server";
import { buildAnalyticsDashboard } from "@/lib/analytics/dashboard";
import type { AnalyticsRangeKey } from "@/lib/analytics/types";
import { requireOwnerUser } from "@/lib/requireOwner";

export const runtime = "nodejs";

const RANGE_KEYS = new Set([
  "today",
  "7d",
  "30d",
  "90d",
  "180d",
  "all",
  "custom",
]);

export async function GET(req: NextRequest) {
  const gate = await requireOwnerUser();
  if ("error" in gate) return gate.error;

  const url = req.nextUrl;
  const raw = url.searchParams.get("range") || "30d";
  const rangeKey = (RANGE_KEYS.has(raw) ? raw : "30d") as AnalyticsRangeKey;
  const customStart = url.searchParams.get("start");
  const customEnd = url.searchParams.get("end");

  try {
    const data = buildAnalyticsDashboard({
      rangeKey,
      customStart,
      customEnd,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Could not build analytics",
      },
      { status: 500 }
    );
  }
}
