import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  countUserLetters,
  getOrCreateCottage,
  updateCottage,
  type CottagePatch,
} from "@/lib/cottageState";
import { getDb } from "@/lib/db";
import { getUserVillageStats } from "@/lib/villageProgress";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to visit your cottage", 401);
  const db = getDb();
  const stats = getUserVillageStats(db, user.id);
  const letterCount = countUserLetters(db, user.id);
  const cottage = getOrCreateCottage(
    db,
    {
      id: user.id,
      displayName: user.displayName,
      createdAt: user.createdAt,
      reputation: user.reputation,
      homeVillageId: user.homeVillageId,
      villageId: user.villageId,
    },
    stats.collectibles,
    letterCount
  );
  return NextResponse.json({ cottage, collectibles: stats.collectibles });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to customize your cottage", 401);
  let body: CottagePatch;
  try {
    body = (await req.json()) as CottagePatch;
  } catch {
    return jsonError("Invalid cottage update");
  }

  const db = getDb();
  // Ensure row exists before patching
  const stats = getUserVillageStats(db, user.id);
  getOrCreateCottage(
    db,
    {
      id: user.id,
      displayName: user.displayName,
      createdAt: user.createdAt,
      reputation: user.reputation,
      homeVillageId: user.homeVillageId,
      villageId: user.villageId,
    },
    stats.collectibles,
    countUserLetters(db, user.id)
  );

  const allowed: CottagePatch = {};
  if (typeof body.cottageName === "string") allowed.cottageName = body.cottageName;
  if (typeof body.description === "string") allowed.description = body.description;
  if (typeof body.signText === "string") allowed.signText = body.signText;
  if (body.favoriteItemId === null || typeof body.favoriteItemId === "string") {
    allowed.favoriteItemId = body.favoriteItemId;
  }
  if (typeof body.welcomed === "boolean") allowed.welcomed = body.welcomed;
  if (
    body.timeMode === "auto" ||
    body.timeMode === "day" ||
    body.timeMode === "evening" ||
    body.timeMode === "night"
  ) {
    allowed.timeMode = body.timeMode;
  }
  if (
    body.weatherMode === "auto" ||
    body.weatherMode === "sunny" ||
    body.weatherMode === "rain" ||
    body.weatherMode === "cloudy" ||
    body.weatherMode === "fog" ||
    body.weatherMode === "snow" ||
    body.weatherMode === "wind"
  ) {
    allowed.weatherMode = body.weatherMode;
  }
  if (Array.isArray(body.placements)) {
    allowed.placements = body.placements
      .filter(
        (p) =>
          p &&
          typeof p.itemId === "string" &&
          typeof p.x === "number" &&
          typeof p.y === "number"
      )
      .map((p) => ({
        itemId: p.itemId,
        x: Math.min(95, Math.max(5, Math.round(p.x))),
        y: Math.min(92, Math.max(8, Math.round(p.y))),
        rotation: Math.round(Number(p.rotation) || 0) % 360,
        placed: Boolean(p.placed),
        favorite: Boolean(p.favorite),
      }));
  }
  if (Array.isArray(body.memories)) {
    allowed.memories = body.memories.slice(0, 40).map((m) => ({
      id: String(m.id || ""),
      memoryType: String(m.memoryType || "custom"),
      referenceId: m.referenceId ? String(m.referenceId) : undefined,
      title: String(m.title || "").slice(0, 80),
      description: String(m.description || "").slice(0, 240),
      emoji: String(m.emoji || "🌼").slice(0, 8),
      dateLabel: String(m.dateLabel || "").slice(0, 40),
      pinned: Boolean(m.pinned),
    }));
  }
  if (
    body.displayedLetterId === null ||
    typeof body.displayedLetterId === "string"
  ) {
    allowed.displayedLetterId = body.displayedLetterId;
  }

  updateCottage(db, user.id, allowed);
  const cottage = getOrCreateCottage(
    db,
    {
      id: user.id,
      displayName: user.displayName,
      createdAt: user.createdAt,
      reputation: user.reputation,
      homeVillageId: user.homeVillageId,
      villageId: user.villageId,
    },
    stats.collectibles,
    countUserLetters(db, user.id)
  );
  return NextResponse.json({ cottage });
}
