import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createChannel,
  deleteChannel,
  listChannelsForUser,
} from "@/lib/tvCorner";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function nextPathFrom(raw: string | undefined) {
  const nextRaw = String(raw || "/tv-corner");
  return nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/tv-corner";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  return NextResponse.json({ channels: listChannelsForUser(user) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const fields = await readRequestFields(req);
  const title = String(fields.channelTitle || fields.title || "");
  const villageId = String(fields.villageId || user.villageId || "");
  const isGlobal =
    fields.channelGlobal === "on" ||
    fields.channelGlobal === "true" ||
    fields.isGlobal === "true" ||
    fields.isGlobal === "1";
  const next = nextPathFrom(fields.next);

  const result = createChannel(user, {
    title,
    villageId: villageId || undefined,
    isGlobal: Boolean(isGlobal),
  });

  if (!result.ok) {
    if (wantsHtmlRedirect(req)) {
      return redirectSameHost(
        req,
        `${next}?tvError=${encodeURIComponent(result.error)}`
      );
    }
    return jsonError(result.error, result.status);
  }

  if (wantsHtmlRedirect(req)) {
    return redirectSameHost(req, next);
  }

  return NextResponse.json({
    channel: result.channel,
    channels: listChannelsForUser(user),
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return jsonError("Missing channel id");

  const result = deleteChannel(body.id, user);
  if (!result.ok) return jsonError(result.error, result.status);

  for (const filename of result.filenames) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }

  return NextResponse.json({
    ok: true,
    channels: listChannelsForUser(user),
  });
}
