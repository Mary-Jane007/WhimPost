import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { persistAllDurableState } from "@/lib/tvPersist";
import {
  clearVillageMediaOverride,
  getVillageMediaOverrides,
  isValidVillageMediaKey,
  setVillageMediaOverride,
} from "@/lib/villageMedia";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  return NextResponse.json({ images: getVillageMediaOverrides() });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) return jsonError("Only the owner can attach village images", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonError("Expected JSON body");
  }

  const key = String((body as { key?: string }).key || "").trim();
  const url = String((body as { url?: string }).url || "").trim();
  if (!isValidVillageMediaKey(key)) return jsonError("Invalid media key");
  if (!url) return jsonError("Missing image URL");

  try {
    setVillageMediaOverride(key, url);
    try {
      persistAllDurableState(getDb());
    } catch (err) {
      console.error("[village-media] persist failed:", err);
    }
    return NextResponse.json({
      ok: true,
      key,
      url,
      images: getVillageMediaOverrides(),
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Could not save image",
      400
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) return jsonError("Only the owner can clear village images", 403);

  const body = await req.json().catch(() => null);
  const key = String((body as { key?: string } | null)?.key || "").trim();
  if (!isValidVillageMediaKey(key)) return jsonError("Invalid media key");

  clearVillageMediaOverride(key);
  try {
    persistAllDurableState(getDb());
  } catch (err) {
    console.error("[village-media] persist failed:", err);
  }
  return NextResponse.json({
    ok: true,
    key,
    images: getVillageMediaOverrides(),
  });
}
