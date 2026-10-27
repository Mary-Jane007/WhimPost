import { NextResponse } from "next/server";

/** Lightweight keep-warm / uptime check for Render. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const checkDb = url.searchParams.get("db") === "1";
  const payload: Record<string, unknown> = {
    ok: true,
    service: "whimpost",
    ts: Date.now(),
  };

  if (checkDb) {
    try {
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      const row = db.prepare("SELECT COUNT(*) AS n FROM users").get() as {
        n: number;
      };
      payload.db = "ok";
      payload.users = row?.n ?? 0;
    } catch (err) {
      payload.ok = false;
      payload.db = "error";
      payload.dbError = err instanceof Error ? err.message : String(err);
      return NextResponse.json(payload, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
