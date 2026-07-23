import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isSiteOwner } from "@/lib/owner";
import { getDb } from "@/lib/db";
import {
  listChronicleAdmin,
  upsertChroniclePage,
  type ChroniclePageUpdate,
} from "@/lib/chronicle";
import {
  isChronicleActivityKey,
  type ChroniclePageNumber,
} from "@/lib/chronicleContent";
import { isVillageId, VILLAGES, type VillageId } from "@/lib/villages";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return {
      error: jsonError("Only the site owner can edit Lost Chronicles", 403),
    };
  }
  return { user };
}

export async function GET(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const villageId = req.nextUrl.searchParams.get("villageId") || "clovermeadow";
  if (!isVillageId(villageId)) return jsonError("Unknown village");

  return NextResponse.json({
    ...listChronicleAdmin(villageId),
    villages: VILLAGES.map((v) => ({ id: v.id, name: v.name })),
  });
}

export async function PUT(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as Partial<ChroniclePageUpdate> | null;
  if (!body) return jsonError("Expected chronicle page data");

  const villageId = body.villageId as VillageId;
  const pageNumber = Number(body.pageNumber) as ChroniclePageNumber;
  const unlockKey = String(body.unlockKey || "");

  if (!isVillageId(villageId)) return jsonError("Unknown village");
  if (![1, 2, 3, 4].includes(pageNumber)) {
    return jsonError("Page must be 1–4");
  }
  if (!isChronicleActivityKey(unlockKey)) {
    return jsonError("Choose a valid unlock requirement");
  }

  const result = upsertChroniclePage({
    villageId,
    pageNumber,
    title: String(body.title || ""),
    body: String(body.body || ""),
    illustrationUrl: String(body.illustrationUrl || ""),
    unlockKey,
    unlockCount: Number(body.unlockCount) || 1,
    published: body.published !== false,
  });

  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({
    pages: result.pages,
    meta: listChronicleAdmin(villageId).meta,
  });
}
