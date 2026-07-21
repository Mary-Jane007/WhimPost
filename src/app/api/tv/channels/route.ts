import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createChannel,
  deleteChannel,
  listChannelsForVillage,
} from "@/lib/tvCorner";
import { isVillageId } from "@/lib/villages";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

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
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can create TV channels", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    villageId?: string;
  } | null;

  if (!body) return jsonError("Expected JSON body");

  const villageRaw = String(body.villageId || "").trim();
  if (!isVillageId(villageRaw)) {
    return jsonError("Pick which village this channel belongs to");
  }

  const title = String(body.title || "").trim();
  if (!title) return jsonError("Give your channel a name");

  const channel = createChannel({
    title,
    villageId: villageRaw,
    createdBy: user.id,
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

  const result = deleteChannel(body.id, user);
  if (!result.ok) return jsonError(result.error, 403);

  for (const filename of result.filenames) {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  return NextResponse.json({ ok: true });
}
