import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { areFriends, toLetterView } from "@/lib/letters";
import { rewardLetterSent } from "@/lib/villageProgress";
import type {
  EnvelopeStyle,
  LetterRecord,
  PaperStyle,
  ScrapKind,
  StampStyle,
  StickerKind,
  WaxSeal,
} from "@/lib/types";
import {
  ENVELOPE_OPTIONS,
  PAPER_OPTIONS,
  SCRAP_OPTIONS,
  STAMP_OPTIONS,
  STICKER_OPTIONS,
  WAX_OPTIONS,
} from "@/lib/types";

const paperIds = new Set(PAPER_OPTIONS.map((p) => p.id));
const envelopeIds = new Set(ENVELOPE_OPTIONS.map((p) => p.id));
const waxIds = new Set(WAX_OPTIONS.map((p) => p.id));
const stampIds = new Set(STAMP_OPTIONS.map((p) => p.id));
const stickerIds = new Set(STICKER_OPTIONS.map((p) => p.id));
const scrapIds = new Set(SCRAP_OPTIONS.map((p) => p.id));

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const box = req.nextUrl.searchParams.get("box") || "inbox";
  const db = getDb();

  const rows =
    box === "sent"
      ? (db
          .prepare(
            `SELECT * FROM letters
             WHERE sender_id = ? AND status = 'sent'
             ORDER BY sent_at DESC`
          )
          .all(user.id) as LetterRecord[])
      : (db
          .prepare(
            `SELECT * FROM letters
             WHERE recipient_id = ? AND status = 'sent'
             ORDER BY sent_at DESC`
          )
          .all(user.id) as LetterRecord[]);

  const letters = rows
    .map(toLetterView)
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return NextResponse.json({ letters });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const recipientId = String(body.recipientId || "");
  const subject = String(body.subject || "").trim().slice(0, 120);
  const letterBody = String(body.body || "").trim().slice(0, 8000);
  const paperStyle = String(body.paperStyle || "parchment") as PaperStyle;
  const envelopeStyle = String(body.envelopeStyle || "kraft") as EnvelopeStyle;
  const waxSeal = String(body.waxSeal || "fern") as WaxSeal;
  const stampStyle = String(body.stampStyle || "mushroom-amanita") as StampStyle;

  if (!recipientId) return jsonError("Choose a friend to write to");
  if (!letterBody) return jsonError("Your letter needs some words");
  if (!areFriends(user.id, recipientId)) {
    return jsonError("You can only write to accepted friends", 403);
  }
  if (!paperIds.has(paperStyle)) return jsonError("Unknown paper style");
  if (!envelopeIds.has(envelopeStyle)) return jsonError("Unknown envelope");
  if (!waxIds.has(waxSeal)) return jsonError("Unknown wax seal");
  if (!stampIds.has(stampStyle)) return jsonError("Unknown stamp");

  const stickers = Array.isArray(body.stickers)
    ? body.stickers
        .filter(
          (s: { kind?: string }) => s && stickerIds.has(s.kind as StickerKind)
        )
        .slice(0, 24)
        .map(
          (s: {
            id?: string;
            kind: StickerKind;
            x: number;
            y: number;
            scale?: number;
            rotation?: number;
          }) => ({
            id: String(s.id || uuidv4()),
            kind: s.kind,
            x: Math.min(100, Math.max(0, Number(s.x) || 0)),
            y: Math.min(100, Math.max(0, Number(s.y) || 0)),
            scale: Math.min(2, Math.max(0.4, Number(s.scale) || 1)),
            rotation: Number(s.rotation) || 0,
          })
        )
    : [];

  const scraps = Array.isArray(body.scraps)
    ? body.scraps
        .filter((s: { kind?: string }) => s && scrapIds.has(s.kind as ScrapKind))
        .slice(0, 12)
        .map(
          (s: {
            id?: string;
            kind: ScrapKind;
            x: number;
            y: number;
            scale?: number;
            rotation?: number;
          }) => ({
            id: String(s.id || uuidv4()),
            kind: s.kind,
            x: Math.min(100, Math.max(0, Number(s.x) || 0)),
            y: Math.min(100, Math.max(0, Number(s.y) || 0)),
            scale: Math.min(2, Math.max(0.4, Number(s.scale) || 1)),
            rotation: Number(s.rotation) || 0,
          })
        )
    : [];

  let imageUrl: string | null = null;
  if (body.imageUrl) {
    const candidate = String(body.imageUrl);
    if (!/^\/api\/uploads\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(candidate)) {
      return jsonError("Invalid image attachment");
    }
    imageUrl = candidate;
  }

  const id = uuidv4();
  const db = getDb();
  db.prepare(
    `INSERT INTO letters (
      id, sender_id, recipient_id, subject, body,
      paper_style, envelope_style, wax_seal, stamp_style,
      stickers_json, scrap_json, status, is_read, image_url, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', 0, ?, datetime('now'))`
  ).run(
    id,
    user.id,
    recipientId,
    subject || "A letter from the woods",
    letterBody,
    paperStyle,
    envelopeStyle,
    waxSeal,
    stampStyle,
    JSON.stringify(stickers),
    JSON.stringify(scraps),
    imageUrl
  );

  rewardLetterSent(db, user.id, letterBody.length);

  const row = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id) as LetterRecord;
  const letter = toLetterView(row);
  return NextResponse.json({ letter });
}
