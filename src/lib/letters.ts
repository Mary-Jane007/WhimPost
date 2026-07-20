import { getDb } from "./db";
import { mapUser } from "./auth";
import type {
  LetterRecord,
  LetterView,
  PlacedScrap,
  PlacedSticker,
  UserPublic,
} from "./types";

function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserById(id: string): UserPublic | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        username: string;
        display_name: string;
        bio: string;
        forest_name: string;
        created_at: string;
        is_owner: number;
        village_id: string | null;
        reputation: number;
      }
    | undefined;
  return row ? mapUser(row) : null;
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
    stickers: parseJsonArray<PlacedSticker>(row.stickers_json),
    scraps: parseJsonArray<PlacedScrap>(row.scrap_json),
    imageUrl: row.image_url || null,
    status: row.status,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    sentAt: row.sent_at,
    sender,
    recipient,
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
              u.village_id, u.reputation
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
    reputation: number;
  }>;
  return rows.map(mapUser);
}
