import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isSiteOwner } from "@/lib/owner";
import { getDb } from "@/lib/db";
import {
  createMeetingBenchItem,
  deleteMeetingBenchItem,
  duplicateMeetingBenchItem,
  getMeetingBenchBoard,
  getMeetingBenchTeaser,
  listMeetingBenchItems,
  updateMeetingBenchItem,
  type BenchItemKind,
  type BenchItemStatus,
} from "@/lib/meetingBench";
import type { GardenSeason } from "@/lib/gardenContent";
import { isVillageId, type VillageId } from "@/lib/villages";

const KINDS = new Set<BenchItemKind>([
  "notice",
  "gathering",
  "seasonal",
  "chronicle",
  "community_event",
]);

const STATUSES = new Set<BenchItemStatus>([
  "draft",
  "upcoming",
  "active",
  "finished",
  "published",
  "archived",
]);

const SEASONS = new Set<GardenSeason>([
  "spring",
  "summer",
  "autumn",
  "winter",
]);

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return {
      error: jsonError("Only the site owner can edit the Meeting Bench", 403),
    };
  }
  return { user };
}

function parseVillages(raw: unknown): VillageId[] | "all" | null {
  if (raw === "all" || raw == null) return "all";
  if (!Array.isArray(raw)) return null;
  const ids = raw.filter((id): id is VillageId => isVillageId(String(id)));
  return ids.length ? ids : "all";
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const admin = req.nextUrl.searchParams.get("admin") === "1";
  const teaserOnly = req.nextUrl.searchParams.get("teaser") === "1";

  const villageParam = req.nextUrl.searchParams.get("village");
  const villageId =
    (villageParam && isVillageId(villageParam) ? villageParam : null) ||
    (user.villageId && isVillageId(user.villageId) ? user.villageId : null);

  if (teaserOnly) {
    return NextResponse.json({ teaser: getMeetingBenchTeaser(villageId) });
  }

  if (admin) {
    const gate = await requireOwner();
    if ("error" in gate) return gate.error;
    return NextResponse.json({
      items: listMeetingBenchItems({
        includeDrafts: true,
        userId: user.id,
      }),
      // Admin list stays global; living board view stays village-local.
      board: getMeetingBenchBoard(user.id, villageId),
    });
  }

  return NextResponse.json(getMeetingBenchBoard(user.id, villageId));
}

export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return jsonError("Expected Meeting Bench item data");

  const kind = String(body.kind || "") as BenchItemKind;
  if (!KINDS.has(kind)) return jsonError("Unknown board kind");

  const villages = parseVillages(body.villages);
  if (villages === null) return jsonError("Invalid villages");

  const statusRaw = body.status ? String(body.status) : undefined;
  if (statusRaw && !STATUSES.has(statusRaw as BenchItemStatus)) {
    return jsonError("Unknown status");
  }

  const seasonRaw =
    body.season === null || body.season === ""
      ? null
      : body.season
        ? String(body.season)
        : undefined;
  if (seasonRaw && !SEASONS.has(seasonRaw as GardenSeason)) {
    return jsonError("Unknown season");
  }

  const result = createMeetingBenchItem({
    kind,
    title: String(body.title || ""),
    body: String(body.body || ""),
    status: statusRaw as BenchItemStatus | undefined,
    season: seasonRaw as GardenSeason | null | undefined,
    startsAt: body.startsAt ? String(body.startsAt) : null,
    endsAt: body.endsAt ? String(body.endsAt) : null,
    activityType: body.activityType ? String(body.activityType) : null,
    villages,
    ctaLabel: body.ctaLabel ? String(body.ctaLabel) : null,
    ctaHref: body.ctaHref ? String(body.ctaHref) : null,
    pinned: Boolean(body.pinned),
    sortOrder: Number(body.sortOrder) || 50,
    meta:
      body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
        ? (body.meta as Record<string, unknown>)
        : {},
    createdBy: gate.user.id,
  });

  if (!result.ok) return jsonError(result.error);
  return NextResponse.json({ item: result.item, board: getMeetingBenchBoard() });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body?.id) return jsonError("Missing item id");

  const patch: Parameters<typeof updateMeetingBenchItem>[1] = {};
  if (body.kind !== undefined) {
    const kind = String(body.kind) as BenchItemKind;
    if (!KINDS.has(kind)) return jsonError("Unknown board kind");
    patch.kind = kind;
  }
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.body !== undefined) patch.body = String(body.body);
  if (body.status !== undefined) {
    const status = String(body.status) as BenchItemStatus;
    if (!STATUSES.has(status)) return jsonError("Unknown status");
    patch.status = status;
  }
  if (body.season !== undefined) {
    if (body.season === null || body.season === "") {
      patch.season = null;
    } else {
      const season = String(body.season) as GardenSeason;
      if (!SEASONS.has(season)) return jsonError("Unknown season");
      patch.season = season;
    }
  }
  if (body.startsAt !== undefined) {
    patch.startsAt = body.startsAt ? String(body.startsAt) : null;
  }
  if (body.endsAt !== undefined) {
    patch.endsAt = body.endsAt ? String(body.endsAt) : null;
  }
  if (body.activityType !== undefined) {
    patch.activityType = body.activityType ? String(body.activityType) : null;
  }
  if (body.villages !== undefined) {
    const villages = parseVillages(body.villages);
    if (villages === null) return jsonError("Invalid villages");
    patch.villages = villages;
  }
  if (body.ctaLabel !== undefined) {
    patch.ctaLabel = body.ctaLabel ? String(body.ctaLabel) : null;
  }
  if (body.ctaHref !== undefined) {
    patch.ctaHref = body.ctaHref ? String(body.ctaHref) : null;
  }
  if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder) || 50;
  if (body.meta !== undefined) {
    if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
      patch.meta = body.meta as Record<string, unknown>;
    } else {
      patch.meta = {};
    }
  }

  const result = updateMeetingBenchItem(String(body.id), patch);
  if (!result.ok) return jsonError(result.error);
  return NextResponse.json({ item: result.item, board: getMeetingBenchBoard() });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return jsonError("Missing item id");

  const result = deleteMeetingBenchItem(id);
  if (!result.ok) return jsonError(result.error);
  return NextResponse.json({ ok: true, board: getMeetingBenchBoard() });
}

/** Duplicate an existing paper onto the board (owner only). */
export async function PUT(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    id?: string;
  } | null;
  if (!body?.id) return jsonError("Missing item id");
  if (body.action !== "duplicate") {
    return jsonError("Unknown action");
  }

  const result = duplicateMeetingBenchItem(String(body.id), gate.user.id);
  if (!result.ok) return jsonError(result.error);
  return NextResponse.json({
    item: result.item,
    board: getMeetingBenchBoard(),
    items: listMeetingBenchItems({ includeDrafts: true, userId: gate.user.id }),
  });
}
