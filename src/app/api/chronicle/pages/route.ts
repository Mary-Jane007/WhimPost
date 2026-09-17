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
import { flushDurableTvGitSync } from "@/lib/tvPersist";
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

  // Wait for the durable snapshot flush so leaving the page cannot race a
  // restart that has not yet written persistent-chronicle-pages.json to git.
  let durable = { ok: true, committed: false, pushed: false as boolean };
  try {
    durable = await flushDurableTvGitSync();
  } catch (err) {
    console.error("[persistent-chronicle-pages] durable flush failed:", err);
    durable = { ok: false, committed: false, pushed: false };
  }

  return NextResponse.json({
    pages: result.pages,
    meta: listChronicleAdmin(villageId).meta,
    exported: result.exported,
    durable: {
      ok: Boolean(durable?.ok) && result.exported,
      committed: Boolean(durable?.committed),
      pushed: Boolean(durable?.pushed),
    },
  });
}
