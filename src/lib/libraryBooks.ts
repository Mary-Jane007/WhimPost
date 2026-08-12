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
import { persistAllDurableState } from "@/lib/tvPersist";

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

function isSeedBookId(id: string) {
  return (
    CLUB_BOOKS.some((b) => b.id === id) || READING_LIST.some((b) => b.id === id)
  );
}

export function getRemovedBookIds(): Set<string> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT book_id AS id FROM library_removed_books`)
    .all() as Array<{ id: string }>;
  return new Set(rows.map((r) => r.id));
}

function markBookRemoved(id: string) {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO library_removed_books (book_id) VALUES (?)`
    )
    .run(id);
}

function clearBookRemoved(id: string) {
  getDb()
    .prepare(`DELETE FROM library_removed_books WHERE book_id = ?`)
    .run(id);
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
  const removed = getRemovedBookIds();
  const allRecords = listLibraryBookRecords();
  // Owner can move a seed off the club by saving it onto the reading list.
  const movedToReading = new Set(
    allRecords.filter((r) => r.shelf === "readinglist").map((r) => r.id)
  );
  const uploaded = allRecords
    .filter((r) => r.shelf === "club")
    .map(toClubBook);
  const byId = new Map<string, ClubBook>();
  for (const book of CLUB_BOOKS) {
    if (removed.has(book.id) || movedToReading.has(book.id)) continue;
    byId.set(book.id, book);
  }
  for (const book of uploaded) {
    if (removed.has(book.id)) continue;
    const prev = byId.get(book.id);
    byId.set(book.id, prev ? mergeClubOverlay(prev, book) : book);
  }
  // Keep seed order, then append new upload-only ids.
  const seedIds = new Set(CLUB_BOOKS.map((b) => b.id));
  const merged = CLUB_BOOKS.filter((b) => byId.has(b.id)).map(
    (b) => byId.get(b.id)!
  );
  for (const book of uploaded) {
    if (removed.has(book.id)) continue;
    if (!seedIds.has(book.id)) merged.push(book);
  }
  return merged;
}

export function listReadingListBooks(): ReadingListBook[] {
  const removed = getRemovedBookIds();
  const allRecords = listLibraryBookRecords();
  const movedToClub = new Set(
    allRecords.filter((r) => r.shelf === "club").map((r) => r.id)
  );
  const uploaded = allRecords
    .filter((r) => r.shelf === "readinglist")
    .map(toReadingListBook);
  const byId = new Map<string, ReadingListBook>();
  for (const book of READING_LIST) {
    if (removed.has(book.id) || movedToClub.has(book.id)) continue;
    byId.set(book.id, book);
  }
  for (const book of uploaded) {
    if (removed.has(book.id)) continue;
    const prev = byId.get(book.id);
    byId.set(book.id, prev ? mergeReadingOverlay(prev, book) : book);
  }
  const seedIds = new Set(READING_LIST.map((b) => b.id));
  const merged = READING_LIST.filter((b) => byId.has(b.id)).map(
    (b) => byId.get(b.id)!
  );
  for (const book of uploaded) {
    if (removed.has(book.id)) continue;
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

/** How often the Book Club reshuffles titles from the full library. */
export const CLUB_ROTATION_DAYS = 14;

function readingListToClubBook(book: ReadingListBook): ClubBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description:
      book.description?.trim() ||
      `${book.mood} · ${book.category} · ${book.length}`,
    minutes:
      book.length === "Short" ? 120 : book.length === "Long" ? 360 : 220,
    coverEmoji: book.coverEmoji || "📖",
    quotes: [],
    reflections: [],
    coverUrl: book.coverUrl,
    fileUrl: book.fileUrl,
    fileName: book.fileName,
    uploaded: book.uploaded,
  };
}

/** Every library title (club + reading list), unique by id. */
export function listLibraryPoolAsClubBooks(): ClubBook[] {
  const byId = new Map<string, ClubBook>();
  for (const book of listClubBooks()) byId.set(book.id, book);
  for (const book of listReadingListBooks()) {
    if (!byId.has(book.id)) byId.set(book.id, readingListToClubBook(book));
  }
  return [...byId.values()];
}

export function clubRotationPeriodKey(now = new Date()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const utcDay = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / dayMs
  );
  return Math.floor(utcDay / CLUB_ROTATION_DAYS);
}

function getClubShuffleSalt(): number {
  const row = getDb()
    .prepare(`SELECT shuffle_salt AS salt FROM library_club_state WHERE id = 1`)
    .get() as { salt: number } | undefined;
  return Number(row?.salt) || 0;
}

/** Owner can force a fresh shuffle before the next automatic rotation. */
export function bumpClubShuffleSalt(): number {
  const db = getDb();
  db.prepare(
    `INSERT INTO library_club_state (id, shuffle_salt, updated_at)
     VALUES (1, 1, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       shuffle_salt = shuffle_salt + 1,
       updated_at = datetime('now')`
  ).run();
  return getClubShuffleSalt();
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

export type BookClubRotation = {
  featured: ClubBook | null;
  shelf: ClubBook[];
  periodKey: number;
  daysUntilShuffle: number;
  shuffleSalt: number;
};

/**
 * Book Club picks from the whole library and reshuffles every
 * {@link CLUB_ROTATION_DAYS} days (plus any owner-triggered salt bumps).
 */
export function getBookClubRotation(now = new Date()): BookClubRotation {
  const pool = listLibraryPoolAsClubBooks();
  const periodKey = clubRotationPeriodKey(now);
  const shuffleSalt = getClubShuffleSalt();
  if (!pool.length) {
    return {
      featured: null,
      shelf: [],
      periodKey,
      daysUntilShuffle: CLUB_ROTATION_DAYS,
      shuffleSalt,
    };
  }

  const shuffled = seededShuffle(pool, periodKey + shuffleSalt * 10_000);
  // Prefer a readable file for the featured pick when possible.
  const featured =
    shuffled.find((b) => Boolean(b.fileUrl)) || shuffled[0] || null;

  const dayMs = 24 * 60 * 60 * 1000;
  const utcDay = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / dayMs
  );
  const daysIntoPeriod = utcDay % CLUB_ROTATION_DAYS;
  const daysUntilShuffle = CLUB_ROTATION_DAYS - daysIntoPeriod;

  return {
    featured,
    shelf: shuffled,
    periodKey,
    daysUntilShuffle,
    shuffleSalt,
  };
}

export function featuredClubBookMerged(now = new Date()) {
  return getBookClubRotation(now).featured;
}

/** Move a catalog/uploaded title between Book Club and Reading List. */
export function moveLibraryBookToShelf(
  bookId: string,
  shelf: LibraryShelf,
  createdBy: string
): LibraryBookRecord {
  const id = bookId.trim();
  if (!id) throw new Error("Book id required");
  if (shelf !== "club" && shelf !== "readinglist") {
    throw new Error("Shelf must be club or reading list");
  }

  const existing = getLibraryBookRecord(id);
  const live = findLibraryBook(id);
  const catalog = findCatalogShelfBook(id);
  if (!existing && !live && !catalog) {
    throw new Error("That book is not on the library shelves");
  }

  const asClub =
    live && "quotes" in live
      ? (live as ClubBook)
      : catalog?.club || null;
  const asReading =
    live && "category" in live
      ? (live as ReadingListBook)
      : catalog?.reading || null;

  return upsertLibraryBook({
    id,
    shelf,
    title:
      existing?.title ||
      asClub?.title ||
      asReading?.title ||
      "Untitled",
    author:
      existing?.author ||
      asClub?.author ||
      asReading?.author ||
      "Unknown",
    description:
      existing?.description ||
      asClub?.description ||
      asReading?.description ||
      "",
    minutes: existing?.minutes || asClub?.minutes || 180,
    coverEmoji:
      existing?.coverEmoji ||
      asClub?.coverEmoji ||
      asReading?.coverEmoji ||
      "📖",
    coverUrl:
      existing?.coverUrl ?? asClub?.coverUrl ?? asReading?.coverUrl ?? null,
    fileUrl: existing?.fileUrl ?? asClub?.fileUrl ?? asReading?.fileUrl ?? null,
    fileName:
      existing?.fileName ?? asClub?.fileName ?? asReading?.fileName ?? null,
    fileMime: existing?.fileMime ?? null,
    quotes: existing?.quotes?.length
      ? existing.quotes
      : asClub?.quotes || [],
    reflections: existing?.reflections?.length
      ? existing.reflections
      : asClub?.reflections || [],
    category: existing?.category || asReading?.category || null,
    difficulty: existing?.difficulty || asReading?.difficulty || null,
    length: existing?.length || asReading?.length || null,
    mood: existing?.mood || asReading?.mood || "",
    themes: existing?.themes?.length
      ? existing.themes
      : asReading?.themes || [],
    rating: existing?.rating || asReading?.rating || 4.5,
    published: true,
    createdBy,
  });
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
  // Re-shelving a removed (including built-in) title brings it back.
  clearBookRemoved(id);
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
    persistAllDurableState(db);
  } catch (err) {
    console.error("[persistent-library-books] export failed:", err);
  }

  return getLibraryBookRecord(id)!;
}

export function deleteLibraryBook(id: string) {
  const db = getDb();
  const bookId = id.trim();
  if (!bookId) return { ok: false as const, error: "Book id required" };

  const existing = getLibraryBookRecord(bookId);
  const seed = isSeedBookId(bookId);
  const alreadyRemoved = getRemovedBookIds().has(bookId);

  if (!existing && !seed && !alreadyRemoved) {
    return { ok: false as const, error: "Book not found" };
  }

  if (existing) {
    db.prepare(`DELETE FROM library_books WHERE id = ?`).run(bookId);

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
  }

  // Tombstone so hardcoded catalog titles do not reappear on the next merge.
  markBookRemoved(bookId);

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[persistent-library-books] export failed:", err);
  }

  return { ok: true as const };
}
