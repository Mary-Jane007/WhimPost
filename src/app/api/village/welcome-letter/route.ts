import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { VILLAGES, isVillageId, type VillageId } from "@/lib/villages";
import {
  getWelcomeTemplateEdit,
  resetWelcomeTemplate,
  upsertWelcomeTemplate,
} from "@/lib/welcomeLetters";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return {
      error: jsonError("Only the site owner can edit welcoming letters.", 403),
    };
  }
  return { user, db };
}

function villageOptions() {
  return VILLAGES.map((v) => ({ id: v.id, name: v.name }));
}

export async function GET(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const villageId = req.nextUrl.searchParams.get("villageId");
  if (!villageId || !isVillageId(villageId)) {
    return jsonError("Choose a village first.", 400);
  }

  const template = getWelcomeTemplateEdit(auth.db, villageId);
  if (!template) return jsonError("Unknown village", 404);

  return NextResponse.json({
    template,
    villages: villageOptions(),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const villageId = body?.villageId as string | undefined;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const letterBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!villageId || !isVillageId(villageId)) {
    return jsonError("Choose a village first.", 400);
  }
  if (!subject || !letterBody) {
    return jsonError("Subject and letter body are both needed.", 400);
  }
  if (subject.length > 160) {
    return jsonError("Subject is a bit long — keep it under 160 characters.", 400);
  }
  if (letterBody.length > 12000) {
    return jsonError("That letter is too long for one welcome.", 400);
  }

  const template = upsertWelcomeTemplate(
    auth.db,
    villageId as VillageId,
    subject,
    letterBody,
    auth.user.id
  );
  if (!template) return jsonError("Unknown village", 404);

  return NextResponse.json({ ok: true, template });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const villageId = req.nextUrl.searchParams.get("villageId");
  if (!villageId || !isVillageId(villageId)) {
    return jsonError("Choose a village first.", 400);
  }

  const template = resetWelcomeTemplate(auth.db, villageId);
  if (!template) return jsonError("Unknown village", 404);

  return NextResponse.json({ ok: true, template });
}
