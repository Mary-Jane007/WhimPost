import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isVillageId } from "@/lib/villages";
import { markVisitorWelcomeSeen } from "@/lib/visitorWelcome";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";

/** Dismiss the visitor wanderer popup for a village (once per account). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const fields = await readRequestFields(req);
  const villageId = String(fields.villageId || "").trim();
  if (!isVillageId(villageId)) {
    return jsonError("Unknown village");
  }

  const db = getDb();
  markVisitorWelcomeSeen(db, user.id, villageId);

  if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/village");
  return NextResponse.json({ ok: true, villageId });
}
