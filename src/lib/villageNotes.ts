import { v4 as uuidv4 } from "uuid";
import type { Database } from "better-sqlite3";
import { mapUser } from "@/lib/auth";
import {
  normalizeNoteDay,
  todayNoteDay,
} from "@/lib/villageNoteDays";

export type VillageNoteCommentView = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  author: { id: string; displayName: string; username: string };
};

export type VillageNoteView = {
  id: string;
  body: string;
  anonymous: boolean;
  imageUrl: string | null;
  createdAt: string;
  authorId: string;
  isMine: boolean;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: VillageNoteCommentView[];
  author: { displayName: string; username: string } | null;
};

export { normalizeNoteDay, todayNoteDay } from "@/lib/villageNoteDays";

type NoteRow = {
  id: string;
  body: string;
  anonymous: number;
  image_url: string | null;
  created_at: string;
  author_id: string;
  uid: string;
  username: string;
  display_name: string;
  bio: string;
  forest_name: string;
  ucreated: string;
  is_owner: number;
  village_id: string | null;
  reputation: number;
};

export function ensureVillageNoteSocialTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS village_note_likes (
      note_id TEXT NOT NULL REFERENCES village_notes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (note_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_village_note_likes_note
      ON village_note_likes(note_id);

    CREATE TABLE IF NOT EXISTS village_note_comments (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES village_notes(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_village_note_comments_note
      ON village_note_comments(note_id, created_at);

    CREATE TABLE IF NOT EXISTS village_note_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_id TEXT NOT NULL REFERENCES village_notes(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('like', 'comment')),
      body TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_village_note_notifications_user
      ON village_note_notifications(user_id, is_read, created_at DESC);
  `);
}

export type VillageNoteNotificationView = {
  id: string;
  kind: "like" | "comment";
  body: string;
  noteId: string;
  notePreview: string;
  noteDay: string;
  isRead: boolean;
  createdAt: string;
  actor: { displayName: string; username: string };
};

function notifyNoteAuthor(
  db: Database,
  input: {
    authorId: string;
    actorId: string;
    noteId: string;
    kind: "like" | "comment";
    body?: string;
  }
) {
  if (input.authorId === input.actorId) return;

  const actor = db
    .prepare(`SELECT display_name, username FROM users WHERE id = ?`)
    .get(input.actorId) as
    | { display_name: string; username: string }
    | undefined;
  if (!actor) return;

  const who = actor.display_name || actor.username || "A villager";
  const previewBody =
    input.kind === "like"
      ? `${who} liked your Village Square note.`
      : `${who} commented on your Village Square note.`;

  db.prepare(
    `INSERT INTO village_note_notifications
      (id, user_id, actor_id, note_id, kind, body, is_read)
     VALUES (?, ?, ?, ?, ?, ?, 0)`
  ).run(
    uuidv4(),
    input.authorId,
    input.actorId,
    input.noteId,
    input.kind,
    (input.body || previewBody).slice(0, 280)
  );
}

export function countUnreadVillageNoteNotifications(
  db: Database,
  userId: string
) {
  ensureVillageNoteSocialTables(db);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM village_note_notifications
       WHERE user_id = ? AND is_read = 0`
    )
    .get(userId) as { n: number };
  return Number(row?.n) || 0;
}

export function listVillageNoteNotifications(
  db: Database,
  userId: string,
  limit = 20
): VillageNoteNotificationView[] {
  ensureVillageNoteSocialTables(db);
  const rows = db
    .prepare(
      `SELECT n.id, n.kind, n.body, n.note_id, n.is_read, n.created_at,
              note.body as note_body, note.created_at as note_created_at,
              u.display_name, u.username
       FROM village_note_notifications n
       JOIN users u ON u.id = n.actor_id
       JOIN village_notes note ON note.id = n.note_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as Array<{
    id: string;
    kind: "like" | "comment";
    body: string;
    note_id: string;
    is_read: number;
    created_at: string;
    note_body: string;
    note_created_at: string;
    display_name: string;
    username: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    body: r.body,
    noteId: r.note_id,
    notePreview: String(r.note_body || "").slice(0, 80),
    noteDay: String(r.note_created_at || "").slice(0, 10),
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
    actor: {
      displayName: r.display_name,
      username: r.username,
    },
  }));
}

export function markVillageNoteNotificationsRead(
  db: Database,
  userId: string,
  ids?: string[]
) {
  ensureVillageNoteSocialTables(db);
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => "?").join(", ");
    db.prepare(
      `UPDATE village_note_notifications
       SET is_read = 1
       WHERE user_id = ? AND id IN (${placeholders})`
    ).run(userId, ...ids);
    return;
  }
  db.prepare(
    `UPDATE village_note_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`
  ).run(userId);
}

function mapAuthor(row: NoteRow) {
  return mapUser({
    id: row.uid,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    forest_name: row.forest_name,
    created_at: row.ucreated,
    is_owner: row.is_owner,
    village_id: row.village_id,
    reputation: row.reputation,
  });
}

export function listVillageNotes(
  db: Database,
  villageId: string,
  viewerId: string,
  opts?: { day?: string | null }
): VillageNoteView[] {
  ensureVillageNoteSocialTables(db);

  const day = normalizeNoteDay(opts?.day);
  const rows = db
    .prepare(
      `SELECT n.id, n.body, n.anonymous, n.image_url, n.created_at, n.author_id,
              u.id as uid, u.username, u.display_name, u.bio, u.forest_name,
              u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
       FROM village_notes n
       JOIN users u ON u.id = n.author_id
       WHERE n.village_id = ?
         AND date(n.created_at) = date(?)
       ORDER BY n.created_at DESC
       LIMIT 80`
    )
    .all(villageId, day) as NoteRow[];

  if (rows.length === 0) return [];

  const noteIds = rows.map((r) => r.id);
  const placeholders = noteIds.map(() => "?").join(", ");

  const likeRows = db
    .prepare(
      `SELECT note_id, COUNT(*) as cnt,
              SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as liked_by_me
       FROM village_note_likes
       WHERE note_id IN (${placeholders})
       GROUP BY note_id`
    )
    .all(viewerId, ...noteIds) as Array<{
    note_id: string;
    cnt: number;
    liked_by_me: number;
  }>;

  const likeMap = new Map(
    likeRows.map((r) => [
      r.note_id,
      { count: Number(r.cnt) || 0, likedByMe: Number(r.liked_by_me) > 0 },
    ])
  );

  const commentRows = db
    .prepare(
      `SELECT c.id, c.note_id, c.body, c.created_at, c.author_id,
              u.username, u.display_name
       FROM village_note_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.note_id IN (${placeholders})
       ORDER BY c.created_at ASC`
    )
    .all(...noteIds) as Array<{
    id: string;
    note_id: string;
    body: string;
    created_at: string;
    author_id: string;
    username: string;
    display_name: string;
  }>;

  const commentsByNote = new Map<string, VillageNoteCommentView[]>();
  for (const c of commentRows) {
    const list = commentsByNote.get(c.note_id) || [];
    list.push({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      isMine: c.author_id === viewerId,
      author: {
        id: c.author_id,
        displayName: c.display_name,
        username: c.username,
      },
    });
    commentsByNote.set(c.note_id, list);
  }

  return rows.map((r) => {
    const likes = likeMap.get(r.id) || { count: 0, likedByMe: false };
    const comments = commentsByNote.get(r.id) || [];
    const author = mapAuthor(r);
    return {
      id: r.id,
      body: r.body,
      anonymous: Boolean(r.anonymous),
      imageUrl: r.image_url || null,
      createdAt: r.created_at,
      authorId: r.author_id,
      isMine: r.author_id === viewerId,
      likeCount: likes.count,
      likedByMe: likes.likedByMe,
      commentCount: comments.length,
      comments,
      author: r.anonymous
        ? null
        : {
            displayName: author.displayName,
            username: author.username,
          },
    };
  });
}

export function deleteOwnVillageNote(
  db: Database,
  noteId: string,
  userId: string,
  villageId: string
): { ok: true } | { ok: false; error: string; status: number } {
  ensureVillageNoteSocialTables(db);
  const row = db
    .prepare(
      `SELECT id, author_id, village_id FROM village_notes WHERE id = ?`
    )
    .get(noteId) as
    | { id: string; author_id: string; village_id: string }
    | undefined;
  if (!row) return { ok: false, error: "Note not found", status: 404 };
  if (row.village_id !== villageId) {
    return { ok: false, error: "That note belongs to another village", status: 403 };
  }
  if (row.author_id !== userId) {
    return { ok: false, error: "Only the writer can take this note down", status: 403 };
  }
  db.prepare(`DELETE FROM village_notes WHERE id = ? AND author_id = ?`).run(
    noteId,
    userId
  );
  return { ok: true };
}

export function toggleVillageNoteLike(
  db: Database,
  noteId: string,
  userId: string,
  villageId: string
):
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string; status: number } {
  ensureVillageNoteSocialTables(db);
  const row = db
    .prepare(
      `SELECT id, village_id, author_id FROM village_notes WHERE id = ?`
    )
    .get(noteId) as
    | { id: string; village_id: string; author_id: string }
    | undefined;
  if (!row) return { ok: false, error: "Note not found", status: 404 };
  if (row.village_id !== villageId) {
    return { ok: false, error: "That note belongs to another village", status: 403 };
  }

  const existing = db
    .prepare(
      `SELECT note_id FROM village_note_likes WHERE note_id = ? AND user_id = ?`
    )
    .get(noteId, userId) as { note_id: string } | undefined;

  if (existing) {
    db.prepare(
      `DELETE FROM village_note_likes WHERE note_id = ? AND user_id = ?`
    ).run(noteId, userId);
  } else {
    db.prepare(
      `INSERT INTO village_note_likes (note_id, user_id) VALUES (?, ?)`
    ).run(noteId, userId);
    notifyNoteAuthor(db, {
      authorId: row.author_id,
      actorId: userId,
      noteId,
      kind: "like",
    });
  }

  const likeCount = (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM village_note_likes WHERE note_id = ?`
      )
      .get(noteId) as { n: number }
  ).n;

  return { ok: true, liked: !existing, likeCount };
}

export function addVillageNoteComment(
  db: Database,
  noteId: string,
  userId: string,
  villageId: string,
  rawBody: string
):
  | { ok: true; comment: VillageNoteCommentView }
  | { ok: false; error: string; status: number } {
  ensureVillageNoteSocialTables(db);
  const text = String(rawBody || "").trim().slice(0, 280);
  if (text.length < 1) {
    return { ok: false, error: "Write a short comment", status: 400 };
  }

  const row = db
    .prepare(
      `SELECT id, village_id, author_id FROM village_notes WHERE id = ?`
    )
    .get(noteId) as
    | { id: string; village_id: string; author_id: string }
    | undefined;
  if (!row) return { ok: false, error: "Note not found", status: 404 };
  if (row.village_id !== villageId) {
    return { ok: false, error: "That note belongs to another village", status: 403 };
  }

  const user = db
    .prepare(`SELECT id, username, display_name FROM users WHERE id = ?`)
    .get(userId) as
    | { id: string; username: string; display_name: string }
    | undefined;
  if (!user) return { ok: false, error: "Not signed in", status: 401 };

  const id = uuidv4();
  db.prepare(
    `INSERT INTO village_note_comments (id, note_id, author_id, body)
     VALUES (?, ?, ?, ?)`
  ).run(id, noteId, userId, text);

  notifyNoteAuthor(db, {
    authorId: row.author_id,
    actorId: userId,
    noteId,
    kind: "comment",
    body: `${user.display_name || user.username}: ${text}`.slice(0, 280),
  });

  const created = db
    .prepare(
      `SELECT created_at FROM village_note_comments WHERE id = ?`
    )
    .get(id) as { created_at: string };

  return {
    ok: true,
    comment: {
      id,
      body: text,
      createdAt: created.created_at,
      isMine: true,
      author: {
        id: user.id,
        displayName: user.display_name,
        username: user.username,
      },
    },
  };
}

export function deleteOwnVillageNoteComment(
  db: Database,
  commentId: string,
  userId: string,
  villageId: string
): { ok: true } | { ok: false; error: string; status: number } {
  ensureVillageNoteSocialTables(db);
  const row = db
    .prepare(
      `SELECT c.id, c.author_id, n.village_id
       FROM village_note_comments c
       JOIN village_notes n ON n.id = c.note_id
       WHERE c.id = ?`
    )
    .get(commentId) as
    | { id: string; author_id: string; village_id: string }
    | undefined;
  if (!row) return { ok: false, error: "Comment not found", status: 404 };
  if (row.village_id !== villageId) {
    return { ok: false, error: "That note belongs to another village", status: 403 };
  }
  if (row.author_id !== userId) {
    return { ok: false, error: "Only the writer can remove this comment", status: 403 };
  }
  db.prepare(
    `DELETE FROM village_note_comments WHERE id = ? AND author_id = ?`
  ).run(commentId, userId);
  return { ok: true };
}
