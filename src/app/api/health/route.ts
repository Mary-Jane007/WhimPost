import { NextResponse } from "next/server";

/** Lightweight keep-warm / uptime check for Render. */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "whimpost", ts: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
