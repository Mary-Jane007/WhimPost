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

function mergeClubOverlay(seed: ClubBook, overlay: ClubBook): ClubBook {
  return {
    ...seed,
    ...overlay,
    description: overlay.description?.trim() || seed.description,
    minutes: overlay.minutes || seed.minutes,
    coverEmoji: overlay.coverEmoji || seed.coverEmoji,
    quotes: overlay.quotes?.length ? overlay.quotes : seed.quotes,
    reflections: overlay.reflections?.length
      ? overlay.reflections
      : seed.reflections,
    coverUrl: overlay.coverUrl ?? seed.coverUrl ?? null,
    fileUrl: overlay.fileUrl ?? seed.fileUrl ?? null,
    fileName: overlay.fileName ?? seed.fileName ?? null,
    uploaded: true,
  };
}

function mergeReadingOverlay(
  seed: ReadingListBook,
  overlay: ReadingListBook
): ReadingListBook {
  return {
    ...seed,
    ...overlay,
    category: overlay.category || seed.category,
    difficulty: overlay.difficulty || seed.difficulty,
    length: overlay.length || seed.length,
    mood: overlay.mood?.trim() || seed.mood,
    themes: overlay.themes?.length ? overlay.themes : seed.themes,
    rating: overlay.rating || seed.rating,
    coverEmoji: overlay.coverEmoji || seed.coverEmoji,
    coverUrl: overlay.coverUrl ?? seed.coverUrl ?? null,
    fileUrl: overlay.fileUrl ?? seed.fileUrl ?? null,
    fileName: overlay.fileName ?? seed.fileName ?? null,
    description: overlay.description?.trim() || seed.description,
    uploaded: true,
  };
}

/** Hardcoded club shelf + published owner uploads (DB overlays same id). */
export function listClubBooks(): ClubBook[] {
  const uploaded = listLibraryBookRecords({ shelf: "club" }).map(toClubBook);
  const byId = new Map<string, ClubBook>();
  for (const book of CLUB_BOOKS) byId.set(book.id, book);
  for (const book of uploaded) {
    const prev = byId.get(book.id);
    byId.set(book.id, prev ? mergeClubOverlay(prev, book) : book);
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
    byId.set(book.id, prev ? mergeReadingOverlay(prev, book) : book);
  }
  const seedIds = new Set(READING_LIST.map((b) => b.id));
  const merged = READING_LIST.map((b) => byId.get(b.id)!);
  for (const book of uploaded) {
    if (!seedIds.has(book.id)) merged.push(book);
  }
  return merged;
}

/** Look up a hardcoded catalog title (before DB overlay). */
export function findCatalogShelfBook(bookId: string): {
  shelf: LibraryShelf;
  club?: ClubBook;
  reading?: ReadingListBook;
} | null {
  const club = CLUB_BOOKS.find((b) => b.id === bookId);
  if (club) return { shelf: "club", club };
  const reading = READING_LIST.find((b) => b.id === bookId);
  if (reading) return { shelf: "readinglist", reading };
  return null;
}

/**
 * Attach / replace a book file and/or cover image on an existing shelf title.
 * Preserves catalog metadata when creating the first DB overlay row.
 */
export function attachAssetsToShelfBook(input: {
  bookId: string;
  fileUrl?: string;
  fileName?: string;
  fileMime?: string;
  coverUrl?: string | null;
  createdBy: string;
}): LibraryBookRecord {
  const bookId = input.bookId.trim();
  if (!bookId) throw new Error("Book id required");

  const hasFile = Boolean(input.fileUrl);
  const hasCover = input.coverUrl !== undefined;
  if (!hasFile && !hasCover) {
    throw new Error("Attach a book file or a cover image");
  }

  const existing = getLibraryBookRecord(bookId);
  const catalog = findCatalogShelfBook(bookId);
  const merged = findLibraryBook(bookId);

  if (!existing && !catalog && !merged) {
    throw new Error("That book is not on the library shelves");
  }

  // Drop previous bytes when replacing the attached file/cover.
  for (const [prevUrl, nextUrl] of [
    [existing?.fileUrl, hasFile ? input.fileUrl : existing?.fileUrl],
    [
      existing?.coverUrl,
      hasCover ? input.coverUrl : existing?.coverUrl,
    ],
  ] as Array<[string | null | undefined, string | null | undefined]>) {
    if (!prevUrl || !nextUrl || prevUrl === nextUrl) continue;
    const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(prevUrl);
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

  const shelf: LibraryShelf =
    existing?.shelf ||
    catalog?.shelf ||
    (listReadingListBooks().some((b) => b.id === bookId)
      ? "readinglist"
      : "club");

  const club = catalog?.club;
  const reading = catalog?.reading;
  const readingMerged =
    shelf === "readinglist"
      ? (merged as ReadingListBook | null)
      : null;
  const clubMerged =
    shelf === "club" ? (merged as ClubBook | null) : null;

  return upsertLibraryBook({
    id: bookId,
    shelf,
    title:
      existing?.title ||
      club?.title ||
      reading?.title ||
      clubMerged?.title ||
      readingMerged?.title ||
      "Untitled",
    author:
      existing?.author ||
      club?.author ||
      reading?.author ||
      clubMerged?.author ||
      readingMerged?.author ||
      "Unknown",
    description:
      existing?.description ||
      club?.description ||
      reading?.description ||
      clubMerged?.description ||
      readingMerged?.description ||
      "",
    minutes: existing?.minutes || club?.minutes || clubMerged?.minutes || 120,
    coverEmoji:
      existing?.coverEmoji ||
      club?.coverEmoji ||
      reading?.coverEmoji ||
      clubMerged?.coverEmoji ||
      readingMerged?.coverEmoji ||
      "📖",
    coverUrl: hasCover
      ? input.coverUrl
      : existing?.coverUrl ?? clubMerged?.coverUrl ?? readingMerged?.coverUrl ?? null,
    fileUrl: hasFile
      ? input.fileUrl
      : existing?.fileUrl ?? clubMerged?.fileUrl ?? readingMerged?.fileUrl ?? null,
    fileName: hasFile
      ? input.fileName
      : existing?.fileName ?? clubMerged?.fileName ?? readingMerged?.fileName ?? null,
    fileMime: hasFile ? input.fileMime : existing?.fileMime ?? null,
    quotes: existing?.quotes?.length
      ? existing.quotes
      : club?.quotes || clubMerged?.quotes || [],
    reflections: existing?.reflections?.length
      ? existing.reflections
      : club?.reflections || clubMerged?.reflections || [],
    category:
      existing?.category ||
      reading?.category ||
      readingMerged?.category ||
      null,
    difficulty:
      existing?.difficulty ||
      reading?.difficulty ||
      readingMerged?.difficulty ||
      null,
    length:
      existing?.length || reading?.length || readingMerged?.length || null,
    mood: existing?.mood || reading?.mood || readingMerged?.mood || "",
    themes: existing?.themes?.length
      ? existing.themes
      : reading?.themes || readingMerged?.themes || [],
    rating: existing?.rating || reading?.rating || readingMerged?.rating || 4.5,
    published: true,
    createdBy: input.createdBy,
  });
}

/** @deprecated Prefer attachAssetsToShelfBook */
export function attachFileToShelfBook(input: {
  bookId: string;
  fileUrl: string;
  fileName: string;
  fileMime: string;
  coverUrl?: string | null;
  createdBy: string;
}): LibraryBookRecord {
  return attachAssetsToShelfBook(input);
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
