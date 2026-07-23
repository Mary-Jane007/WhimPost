import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  getMoonProgress,
  removePlaylistSound,
  savePlaylistSoundFile,
} from "@/lib/moon";

export const runtime = "nodejs";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (!user.isOwner) {
    return {
      error: jsonError("Only the site owner can manage playlist sounds", 403),
    };
  }
  return { user };
}

/** Owner uploads an ambient audio file for a celestial playlist. */
export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data");

  const playlistId = String(form.get("playlistId") || "").trim();
  const file = form.get("audio");
  if (!playlistId) return jsonError("Choose a playlist");
  if (!(file instanceof File)) {
    return jsonError("Choose an audio file to add");
  }

  const result = await savePlaylistSoundFile(
    playlistId,
    file,
    gate.user.id
  );
  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({
    url: result.url,
    playlistSounds: result.playlistSounds,
    progress: getMoonProgress(gate.user.id),
  });
}

/** Owner removes the sound from a playlist. */
export async function DELETE(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as {
    playlistId?: string;
  } | null;
  const playlistId = String(body?.playlistId || "").trim();
  if (!playlistId) return jsonError("Choose a playlist");

  const result = removePlaylistSound(playlistId);
  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({
    playlistSounds: result.playlistSounds,
    progress: getMoonProgress(gate.user.id),
  });
}
