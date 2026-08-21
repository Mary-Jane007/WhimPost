import { getDb } from "./db";
import { mapUser } from "./auth";
import {
  FONT_OPTIONS,
  type LetterFont,
  type LetterRecord,
  type LetterView,
  type PlacedImage,
  type PlacedScrap,
  type PlacedSticker,
  type UserPublic,
} from "./types";
import { mascotForSystemSender } from "./villages";

const FONT_IDS = new Set(FONT_OPTIONS.map((f) => f.id));

export function normalizeLetterFont(
  value: string | null | undefined
): LetterFont {
  if (value && FONT_IDS.has(value as LetterFont)) return value as LetterFont;
  return "quill";
}

function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  forest_name: string;
  created_at: string;
  is_owner: number;
  village_id: string | null;
  home_village_id: string | null;
  reputation: number;
};

const USER_SELECT = `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, home_village_id, reputation
       FROM users`;

export function getUserById(id: string): UserPublic | null {
  const db = getDb();
  const row = db.prepare(`${USER_SELECT} WHERE id = ?`).get(id) as
    | UserRow
    | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByUsername(username: string): UserPublic | null {
  const db = getDb();
  const row = db
    .prepare(`${USER_SELECT} WHERE username = ? COLLATE NOCASE`)
    .get(username.trim()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export type FriendshipRelation =
  | { status: "none" }
  | { status: "friends" }
  | { status: "pending_out" }
  | { status: "pending_in"; requestId: string };

export function getFriendshipRelation(
  viewerId: string,
  otherId: string
): FriendshipRelation {
  if (viewerId === otherId) return { status: "none" };
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, status, requester_id, addressee_id FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?)
          OR (requester_id = ? AND addressee_id = ?)`
    )
    .get(viewerId, otherId, otherId, viewerId) as
    | {
        id: string;
        status: string;
        requester_id: string;
        addressee_id: string;
      }
    | undefined;

  if (!row) return { status: "none" };
  if (row.status === "accepted") return { status: "friends" };
  if (row.status === "pending") {
    if (row.requester_id === viewerId) return { status: "pending_out" };
    return { status: "pending_in", requestId: row.id };
  }
  return { status: "none" };
}

function parseImage(row: LetterRecord): PlacedImage | null {
  if (row.image_json) {
    try {
      const parsed = JSON.parse(row.image_json) as Partial<PlacedImage>;
      if (parsed && typeof parsed.url === "string") {
        return {
          url: parsed.url,
          x: Math.min(96, Math.max(4, Number(parsed.x) || 50)),
          y: Math.min(96, Math.max(4, Number(parsed.y) || 58)),
          scale: Math.min(2.5, Math.max(0.35, Number(parsed.scale) || 1)),
          rotation: Number(parsed.rotation) || 0,
        };
      }
    } catch {
      /* fall through */
    }
  }
  if (row.image_url) {
    return {
      url: row.image_url,
      x: 50,
      y: 58,
      scale: 1,
      rotation: -1,
    };
  }
  return null;
}

export function toLetterView(row: LetterRecord): LetterView | null {
  const sender = getUserById(row.sender_id);
  const recipient = getUserById(row.recipient_id);
  if (!sender || !recipient) return null;

  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    paperStyle: row.paper_style,
    envelopeStyle: row.envelope_style,
    waxSeal: row.wax_seal,
    stampStyle: row.stamp_style,
    fontStyle: normalizeLetterFont(row.font_style),
    stickers: parseJsonArray<PlacedSticker>(row.stickers_json),
    scraps: parseJsonArray<PlacedScrap>(row.scrap_json),
    image: parseImage(row),
    status: row.status,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    sentAt: row.sent_at,
    sender,
    recipient,
    mascot: mascotForSystemSender(row.sender_id),
  };
}

export function areFriends(userA: string, userB: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id FROM friendships
       WHERE status = 'accepted'
         AND (
           (requester_id = ? AND addressee_id = ?)
           OR (requester_id = ? AND addressee_id = ?)
         )`
    )
    .get(userA, userB, userB, userA);
  return Boolean(row);
}

export function listFriends(userId: string): UserPublic[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.bio, u.forest_name, u.created_at, u.is_owner,
              u.village_id, u.home_village_id, u.reputation
       FROM friendships f
       JOIN users u ON u.id = CASE
         WHEN f.requester_id = ? THEN f.addressee_id
         ELSE f.requester_id
       END
       WHERE f.status = 'accepted'
         AND (f.requester_id = ? OR f.addressee_id = ?)
       ORDER BY u.display_name COLLATE NOCASE`
    )
    .all(userId, userId, userId) as Array<{
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
    is_owner: number;
    village_id: string | null;
    home_village_id: string | null;
    reputation: number;
  }>;
  return rows.map(mapUser);
}
