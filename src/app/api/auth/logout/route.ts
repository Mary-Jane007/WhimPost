import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_NAME } from "@/lib/auth";
import { redirectSameHost, wantsHtmlRedirect } from "@/lib/requestBody";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  if (wantsHtmlRedirect(req)) {
    const res = redirectSameHost(req, "/");
    res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }
  return NextResponse.json({ ok: true });
}
