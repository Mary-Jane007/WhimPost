import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  SHARED_CHANNEL_TITLE,
  createChannel,
  deleteChannel,
  listChannelsForVillage,
} from "@/lib/tvCorner";
import { isVillageId } from "@/lib/villages";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import fs from "fs";
import path from "path";
import type { UserPublic } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function nextPathFrom(raw: string | undefined) {
  const nextRaw = String(raw || "/tv-corner");
  return nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/tv-corner";
}

function performChannelDelete(id: string, user: UserPublic) {
  const result = deleteChannel(id, user);
  if (!result.ok) {
    return { ok: false as const, error: String(result.error || "Could not remove channel") };
  }
  for (const filename of result.filenames) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const villageId = req.nextUrl.searchParams.get("villageId") || user.villageId;
  return NextResponse.json({
    channels: listChannelsForVillage(villageId),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  // Progressive-enhancement remove (HTML form POST — no React required).
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const fields = await readRequestFields(req);
    if (String(fields.intent || "") === "remove") {
      if (!user.isOwner) {
        return jsonError("Only the site owner can remove channels", 403);
      }
      const id = String(fields.id || "").trim();
      const removed = performChannelDelete(id, user);
      if (!removed.ok) return jsonError(removed.error, 403);
      if (wantsHtmlRedirect(req)) {
        return redirectSameHost(req, nextPathFrom(fields.next));
      }
      return NextResponse.json({ ok: true });
    }
  }

  if (!user.isOwner) {
    return jsonError("Only the site owner can create TV channels", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    villageId?: string;
    isGlobal?: boolean;
  } | null;

  if (!body) return jsonError("Expected JSON body");

  const villageRaw = String(body.villageId || user.villageId || "").trim();
  if (!isVillageId(villageRaw)) {
    return jsonError("Pick which village this channel belongs to");
  }

  const title = String(body.title || "").trim();
  if (!title) return jsonError("Give your channel a name");

  const isGlobal =
    Boolean(body.isGlobal) ||
    title.toLowerCase() === SHARED_CHANNEL_TITLE.toLowerCase();

  const channel = createChannel({
    title,
    villageId: villageRaw,
    createdBy: user.id,
    isGlobal,
  });

  return NextResponse.json({ channel });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can remove channels", 403);
  }

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return jsonError("Missing channel id");

  const removed = performChannelDelete(body.id, user);
  if (!removed.ok) return jsonError(removed.error, 403);

  return NextResponse.json({ ok: true });
}
