import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  ANNOTATION_INKS,
  type AnnotationInk,
  type LibraryAnnotation,
  type ReadingPosition,
  type ReadingPositions,
} from "@/lib/libraryReadingTypes";

export type {
  AnnotationInk,
  LibraryAnnotation,
  ReadingPosition,
  ReadingPositions,
} from "@/lib/libraryReadingTypes";
export { ANNOTATION_INKS } from "@/lib/libraryReadingTypes";

type AnnotationRow = {
  id: string;
  user_id: string;
  book_id: string;
  cfi: string | null;
  page_label: string;
  percent: number;
  selected_text: string;
  body: string;
  ink: string;
  created_at: string;
  updated_at: string;
};

function parsePositions(raw: string | null | undefined): ReadingPositions {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mapAnnotation(row: AnnotationRow): LibraryAnnotation {
  const ink = ANNOTATION_INKS.some((i) => i.id === row.ink)
    ? (row.ink as AnnotationInk)
    : "moss";
  return {
    id: row.id,
    bookId: row.book_id,
    cfi: row.cfi,
    pageLabel: row.page_label || "",
    percent: Number(row.percent) || 0,
    selectedText: row.selected_text || "",
    body: row.body || "",
    ink,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getReadingPositions(userId: string): ReadingPositions {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT reading_positions_json FROM library_progress WHERE user_id = ?`
    )
    .get(userId) as { reading_positions_json?: string } | undefined;
  return parsePositions(row?.reading_positions_json);
}

export function getReadingPosition(
  userId: string,
  bookId: string
): ReadingPosition | null {
  const all = getReadingPositions(userId);
  return all[bookId] || null;
}

/** Overwrite last-page position and sync shelf % to the real place. */
export function saveReadingPosition(
  userId: string,
  bookId: string,
  position: {
    cfi?: string | null;
    percent?: number | null;
    page?: number | null;
    total?: number | null;
    label?: string;
  }
): { positions: ReadingPositions; bookProgress: Record<string, number> } {
  const db = getDb();
  const id = bookId.trim();
  if (!id) throw new Error("Book id required");

  const exists = db
    .prepare(`SELECT user_id FROM library_progress WHERE user_id = ?`)
    .get(userId);
  if (!exists) {
    db.prepare(`INSERT INTO library_progress (user_id, xp) VALUES (?, 0)`).run(
      userId
    );
  }

  const row = db
    .prepare(
      `SELECT reading_positions_json, book_progress_json, reading_status_json
       FROM library_progress WHERE user_id = ?`
    )
    .get(userId) as {
    reading_positions_json: string;
    book_progress_json: string;
    reading_status_json: string;
  };

  const positions = parsePositions(row.reading_positions_json);
  const bookProgress = (() => {
    try {
      return JSON.parse(row.book_progress_json || "{}") as Record<
        string,
        number
      >;
    } catch {
      return {};
    }
  })();
  const readingStatus = (() => {
    try {
      return JSON.parse(row.reading_status_json || "{}") as Record<
        string,
        string
      >;
    } catch {
      return {};
    }
  })();

  const hasPercent = position.percent != null && Number.isFinite(Number(position.percent));
  const pct = hasPercent
    ? Math.max(0, Math.min(100, Math.round(Number(position.percent))))
    : Math.max(0, Math.min(100, Math.round(Number(positions[id]?.percent) || 0)));
  positions[id] = {
    cfi: position.cfi || positions[id]?.cfi || null,
    percent: pct,
    page: position.page ?? positions[id]?.page ?? null,
    total: position.total ?? positions[id]?.total ?? null,
    label: (position.label || positions[id]?.label || "").slice(0, 80),
    updatedAt: new Date().toISOString(),
  };
  // Sync shelf % to the real place — do not keep a sticky high-water mark from
  // older (inflated chapter-page) estimates.
  if (hasPercent) {
    bookProgress[id] = pct;
  }
  if (pct >= 100) readingStatus[id] = "finished";
  else if (pct > 0 || positions[id]?.cfi || (position.label || "").trim()) {
    readingStatus[id] = "reading";
  }

  db.prepare(
    `UPDATE library_progress SET
      reading_positions_json = ?,
      book_progress_json = ?,
      reading_status_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    JSON.stringify(positions),
    JSON.stringify(bookProgress),
    JSON.stringify(readingStatus),
    userId
  );

  return { positions, bookProgress };
}

export function listAnnotations(
  userId: string,
  bookId: string
): LibraryAnnotation[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM library_annotations
       WHERE user_id = ? AND book_id = ?
       ORDER BY percent ASC, created_at ASC`
    )
    .all(userId, bookId) as AnnotationRow[];
  return rows.map(mapAnnotation);
}

export function createAnnotation(input: {
  userId: string;
  bookId: string;
  cfi?: string | null;
  pageLabel?: string;
  percent?: number;
  selectedText?: string;
  body: string;
  ink?: AnnotationInk;
}): LibraryAnnotation {
  const body = input.body.trim().slice(0, 1200);
  if (!body) throw new Error("Write a little note for the margin");
  const bookId = input.bookId.trim();
  if (!bookId) throw new Error("Book id required");

  const ink = ANNOTATION_INKS.some((i) => i.id === input.ink)
    ? (input.ink as AnnotationInk)
    : "moss";
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO library_annotations (
      id, user_id, book_id, cfi, page_label, percent, selected_text, body, ink
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    bookId,
    input.cfi || null,
    (input.pageLabel || "").slice(0, 80),
    Math.max(0, Math.min(100, Number(input.percent) || 0)),
    (input.selectedText || "").trim().slice(0, 500),
    body,
    ink
  );

  return listAnnotations(input.userId, bookId).find((a) => a.id === id)!;
}

export function deleteAnnotation(userId: string, annotationId: string) {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM library_annotations WHERE id = ? AND user_id = ?`)
    .run(annotationId, userId);
  return result.changes > 0;
}
