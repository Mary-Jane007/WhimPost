import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { areFriends, toLetterView } from "@/lib/letters";
import { rewardLetterSent } from "@/lib/villageProgress";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import type {
  EnvelopeStyle,
  LetterFont,
  LetterRecord,
  PaperStyle,
  ScrapKind,
  StampStyle,
  StickerKind,
  WaxSeal,
} from "@/lib/types";
import {
  ENVELOPE_OPTIONS,
  FONT_OPTIONS,
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
const fontIds = new Set(FONT_OPTIONS.map((p) => p.id));
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
  const fontStyle = String(body.fontStyle || "quill") as LetterFont;

  if (!recipientId) return jsonError("Choose a friend to write to");
  if (!letterBody) return jsonError("Your letter needs some words");
  if (!areFriends(user.id, recipientId)) {
    return jsonError("You can only write to accepted friends", 403);
  }
  if (!paperIds.has(paperStyle)) return jsonError("Unknown paper style");
  if (!envelopeIds.has(envelopeStyle)) return jsonError("Unknown envelope");
  if (!waxIds.has(waxSeal)) return jsonError("Unknown wax seal");
  if (!stampIds.has(stampStyle)) return jsonError("Unknown stamp");
  if (!fontIds.has(fontStyle)) return jsonError("Unknown letter font");

  const stickerMeta = new Map(STICKER_OPTIONS.map((o) => [o.id, o]));
  const stickers = Array.isArray(body.stickers)
    ? body.stickers
        .filter((s: { kind?: string }) => {
          if (!s || !stickerIds.has(s.kind as StickerKind)) return false;
          const meta = stickerMeta.get(s.kind as StickerKind);
          if (meta?.villageId && meta.villageId !== user.villageId) {
            return false;
          }
          return true;
        })
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
  let imageJson: string | null = null;
  if (body.image && typeof body.image === "object") {
    const candidate = String(body.image.url || "");
    if (!/^\/api\/uploads\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(candidate)) {
      return jsonError("Invalid image attachment");
    }
    const placed = {
      url: candidate,
      x: Math.min(96, Math.max(4, Number(body.image.x) || 50)),
      y: Math.min(96, Math.max(4, Number(body.image.y) || 58)),
      scale: Math.min(2.5, Math.max(0.35, Number(body.image.scale) || 1)),
      rotation: Number(body.image.rotation) || 0,
    };
    imageUrl = placed.url;
    imageJson = JSON.stringify(placed);
  } else if (body.imageUrl) {
    // backwards-compatible simple URL
    const candidate = String(body.imageUrl);
    if (!/^\/api\/uploads\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(candidate)) {
      return jsonError("Invalid image attachment");
    }
    imageUrl = candidate;
    imageJson = JSON.stringify({
      url: candidate,
      x: 50,
      y: 58,
      scale: 1,
      rotation: -1,
    });
  }

  const id = uuidv4();
  const db = getDb();
  db.prepare(
    `INSERT INTO letters (
      id, sender_id, recipient_id, subject, body,
      paper_style, envelope_style, wax_seal, stamp_style, font_style,
      stickers_json, scrap_json, status, is_read, image_url, image_json, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', 0, ?, ?, datetime('now'))`
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
    fontStyle,
    JSON.stringify(stickers),
    JSON.stringify(scraps),
    imageUrl,
    imageJson
  );

  rewardLetterSent(db, user.id, letterBody.length);
  trackAnalyticsEvent({
    event: "letter_sent",
    userId: user.id,
    villageId: user.villageId || null,
    path: "/compose",
    meta: { hasRecipient: true },
  });

  const row = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id) as LetterRecord;
  const letter = toLetterView(row);
  return NextResponse.json({ letter });
}
