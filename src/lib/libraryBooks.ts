import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import {
  CLUB_BOOKS,
  READING_LIST,
  type ClubBook,
  type ReadingCategory,
  type ReadingListBook,
} from "@/lib/libraryContent";
import { exportPersistentLibraryBooks } from "@/lib/persistentLibraryBooks";

export const LIBRARY_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export type LibraryShelf = "club" | "readinglist";

export type LibraryBookRecord = {
  id: string;
  shelf: LibraryShelf;
  title: string;
  author: string;
  description: string;
  minutes: number;
  coverEmoji: string;
  coverUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMime: string | null;
  quotes: string[];
  reflections: string[];
  category: ReadingCategory | null;
  difficulty: ReadingListBook["difficulty"] | null;
  length: ReadingListBook["length"] | null;
  mood: string;
  themes: string[];
  rating: number;
  published: boolean;
  createdBy: string | null;
  createdAt: string;
};

type BookRow = {
  id: string;
  shelf: string;
  title: string;
  author: string;
  description: string;
  minutes: number;
  cover_emoji: string;
  cover_url: string | null;
  file_url: string | null;
  file_name: string | null;
  file_mime: string | null;
  quotes_json: string;
  reflections_json: string;
  category: string | null;
  difficulty: string | null;
  length: string | null;
  mood: string;
  themes_json: string;
  rating: number;
  published: number;
  created_by: string | null;
  created_at: string;
};

function parseJsonArray(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.map((x) => String(x)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function mapRow(row: BookRow): LibraryBookRecord {
  return {
    id: row.id,
    shelf: row.shelf === "readinglist" ? "readinglist" : "club",
    title: row.title,
    author: row.author,
    description: row.description || "",
    minutes: Number(row.minutes) || 0,
    coverEmoji: row.cover_emoji || "📖",
    coverUrl: row.cover_url,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileMime: row.file_mime,
    quotes: parseJsonArray(row.quotes_json),
    reflections: parseJsonArray(row.reflections_json),
    category: (row.category as ReadingCategory) || null,
    difficulty: (row.difficulty as ReadingListBook["difficulty"]) || null,
    length: (row.length as ReadingListBook["length"]) || null,
    mood: row.mood || "",
    themes: parseJsonArray(row.themes_json),
    rating: Number(row.rating) || 0,
    published: Boolean(row.published),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toClubBook(book: LibraryBookRecord): ClubBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    minutes: book.minutes || 120,
    coverEmoji: book.coverEmoji || "📖",
    quotes: book.quotes,
    reflections: book.reflections,
    coverUrl: book.coverUrl,
    fileUrl: book.fileUrl,
    fileName: book.fileName,
    uploaded: true,
  };
}

function toReadingListBook(book: LibraryBookRecord): ReadingListBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category || "Classic Literature",
    difficulty: book.difficulty || "Gentle",
    length: book.length || "Medium",
    mood: book.mood || "Cozy",
    themes: book.themes.length ? book.themes : ["story"],
    rating: book.rating || 4.5,
    coverEmoji: book.coverEmoji || "📖",
    coverUrl: book.coverUrl,
    fileUrl: book.fileUrl,
    fileName: book.fileName,
    description: book.description,
    uploaded: true,
  };
}

export function listLibraryBookRecords(opts?: {
  shelf?: LibraryShelf;
  includeUnpublished?: boolean;
}): LibraryBookRecord[] {
  const db = getDb();
  const rows = (
    opts?.shelf
      ? db
          .prepare(
            `SELECT * FROM library_books
             WHERE shelf = ?
             ORDER BY created_at DESC`
          )
          .all(opts.shelf)
      : db
          .prepare(
            `SELECT * FROM library_books
             ORDER BY created_at DESC`
          )
          .all()
  ) as BookRow[];

  return rows
    .map(mapRow)
    .filter((b) => (opts?.includeUnpublished ? true : b.published));
}

/** Hardcoded club shelf + published owner uploads (DB overrides same id). */
export function listClubBooks(): ClubBook[] {
  const uploaded = listLibraryBookRecords({ shelf: "club" }).map(toClubBook);
  const byId = new Map<string, ClubBook>();
  for (const book of CLUB_BOOKS) byId.set(book.id, book);
  for (const book of uploaded) {
    const prev = byId.get(book.id);
    byId.set(book.id, prev ? { ...prev, ...book, uploaded: true } : book);
  }
  // Keep seed order, then append new upload-only ids.
  const seedIds = new Set(CLUB_BOOKS.map((b) => b.id));
  const merged = CLUB_BOOKS.map((b) => byId.get(b.id)!);
  for (const book of uploaded) {
    if (!seedIds.has(book.id)) merged.push(book);
  }
  return merged;
}

export function listReadingListBooks(): ReadingListBook[] {
  const uploaded = listLibraryBookRecords({ shelf: "readinglist" }).map(
    toReadingListBook
  );
  const byId = new Map<string, ReadingListBook>();
  for (const book of READING_LIST) byId.set(book.id, book);
  for (const book of uploaded) {
    const prev = byId.get(book.id);
    byId.set(book.id, prev ? { ...prev, ...book, uploaded: true } : book);
  }
  const seedIds = new Set(READING_LIST.map((b) => b.id));
  const merged = READING_LIST.map((b) => byId.get(b.id)!);
  for (const book of uploaded) {
    if (!seedIds.has(book.id)) merged.push(book);
  }
  return merged;
}

export function findLibraryBook(bookId: string): ClubBook | ReadingListBook | null {
  return (
    listClubBooks().find((b) => b.id === bookId) ||
    listReadingListBooks().find((b) => b.id === bookId) ||
    null
  );
}

export function featuredClubBookMerged(now = new Date()) {
  const books = listClubBooks();
  if (!books.length) return null;
  return books[now.getUTCMonth() % books.length];
}

export function getLibraryBookRecord(id: string): LibraryBookRecord | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM library_books WHERE id = ?`)
    .get(id) as BookRow | undefined;
  return row ? mapRow(row) : null;
}

export type UpsertLibraryBookInput = {
  id?: string;
  shelf: LibraryShelf;
  title: string;
  author: string;
  description?: string;
  minutes?: number;
  coverEmoji?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  quotes?: string[];
  reflections?: string[];
  category?: ReadingCategory | null;
  difficulty?: ReadingListBook["difficulty"] | null;
  length?: ReadingListBook["length"] | null;
  mood?: string;
  themes?: string[];
  rating?: number;
  published?: boolean;
  createdBy: string;
};

export function upsertLibraryBook(
  input: UpsertLibraryBookInput
): LibraryBookRecord {
  const db = getDb();
  const id = (input.id || `lib-${randomUUID()}`).trim();
  const title = input.title.trim().slice(0, 120);
  const author = input.author.trim().slice(0, 80);
  if (!title || !author) {
    throw new Error("Title and author are required");
  }

  const existing = getLibraryBookRecord(id);
  const payload = {
    id,
    shelf: input.shelf,
    title,
    author,
    description: (input.description || "").trim().slice(0, 2000),
    minutes: Math.max(0, Math.floor(input.minutes || existing?.minutes || 120)),
    cover_emoji: (input.coverEmoji || existing?.coverEmoji || "📖").slice(0, 8),
    cover_url:
      input.coverUrl === undefined
        ? existing?.coverUrl || null
        : input.coverUrl,
    file_url:
      input.fileUrl === undefined ? existing?.fileUrl || null : input.fileUrl,
    file_name:
      input.fileName === undefined
        ? existing?.fileName || null
        : input.fileName,
    file_mime:
      input.fileMime === undefined
        ? existing?.fileMime || null
        : input.fileMime,
    quotes_json: JSON.stringify(input.quotes || existing?.quotes || []),
    reflections_json: JSON.stringify(
      input.reflections || existing?.reflections || []
    ),
    category: input.category || existing?.category || null,
    difficulty: input.difficulty || existing?.difficulty || null,
    length: input.length || existing?.length || null,
    mood: (input.mood || existing?.mood || "").slice(0, 80),
    themes_json: JSON.stringify(input.themes || existing?.themes || []),
    rating: Number(input.rating ?? existing?.rating ?? 4.5) || 4.5,
    published:
      input.published === undefined
        ? existing?.published ?? true
        : input.published
          ? 1
          : 0,
    created_by: existing?.createdBy || input.createdBy,
  };

  db.prepare(
    `INSERT INTO library_books (
      id, shelf, title, author, description, minutes, cover_emoji, cover_url,
      file_url, file_name, file_mime, quotes_json, reflections_json, category,
      difficulty, length, mood, themes_json, rating, published, created_by
    ) VALUES (
      @id, @shelf, @title, @author, @description, @minutes, @cover_emoji, @cover_url,
      @file_url, @file_name, @file_mime, @quotes_json, @reflections_json, @category,
      @difficulty, @length, @mood, @themes_json, @rating, @published, @created_by
    )
    ON CONFLICT(id) DO UPDATE SET
      shelf = excluded.shelf,
      title = excluded.title,
      author = excluded.author,
      description = excluded.description,
      minutes = excluded.minutes,
      cover_emoji = excluded.cover_emoji,
      cover_url = excluded.cover_url,
      file_url = excluded.file_url,
      file_name = excluded.file_name,
      file_mime = excluded.file_mime,
      quotes_json = excluded.quotes_json,
      reflections_json = excluded.reflections_json,
      category = excluded.category,
      difficulty = excluded.difficulty,
      length = excluded.length,
      mood = excluded.mood,
      themes_json = excluded.themes_json,
      rating = excluded.rating,
      published = excluded.published`
  ).run(payload);

  try {
    exportPersistentLibraryBooks(db);
  } catch (err) {
    console.error("[persistent-library-books] export failed:", err);
  }

  return getLibraryBookRecord(id)!;
}

export function deleteLibraryBook(id: string) {
  const db = getDb();
  const existing = getLibraryBookRecord(id);
  if (!existing) return { ok: false as const, error: "Book not found" };

  db.prepare(`DELETE FROM library_books WHERE id = ?`).run(id);

  // Remove uploaded bytes when this book owned the files.
  for (const url of [existing.fileUrl, existing.coverUrl]) {
    if (!url) continue;
    const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(url);
    if (!match) continue;
    const filePath = path.join(LIBRARY_UPLOAD_DIR, match[1]);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  try {
    exportPersistentLibraryBooks(db);
  } catch (err) {
    console.error("[persistent-library-books] export failed:", err);
  }

  return { ok: true as const };
}
