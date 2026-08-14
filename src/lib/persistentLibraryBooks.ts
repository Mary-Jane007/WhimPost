import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";

/**
 * Git-tracked catalog of owner-uploaded library books (metadata only).
 * EPUB/PDF bytes live under data/uploads/ via Git LFS.
 */
export const PERSISTENT_LIBRARY_BOOKS_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-library-books.json"
);

export const LIBRARY_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export type PersistentLibraryBook = {
  id: string;
  shelf: "club" | "readinglist";
  title: string;
  author: string;
  description?: string;
  minutes?: number;
  coverEmoji?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  quotesJson?: string;
  reflectionsJson?: string;
  category?: string | null;
  difficulty?: string | null;
  length?: string | null;
  mood?: string;
  themesJson?: string;
  rating?: number;
  published?: boolean;
};

type PersistentLibraryBooksFile = {
  version: 1;
  updatedAt: string;
  books: PersistentLibraryBook[];
  /** Catalog / seed ids the owner removed — keeps built-ins from reappearing. */
  removedIds?: string[];
};

function readFile(): PersistentLibraryBooksFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_LIBRARY_BOOKS_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_LIBRARY_BOOKS_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentLibraryBooksFile;
    if (!parsed || !Array.isArray(parsed.books)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(books: PersistentLibraryBook[], removedIds: string[]) {
  const dir = path.dirname(PERSISTENT_LIBRARY_BOOKS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentLibraryBooksFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    books: books.sort((a, b) =>
      `${a.shelf}:${a.title}`.localeCompare(`${b.shelf}:${b.title}`)
    ),
    removedIds: [...new Set(removedIds.map((id) => id.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    ),
  };

  const tmp = `${PERSISTENT_LIBRARY_BOOKS_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_LIBRARY_BOOKS_PATH);
}

function filenameFromUploadUrl(url: string | null | undefined) {
  if (!url) return null;
  const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(url);
  return match?.[1] || null;
}

/** Snapshot library book rows so fresh servers can restore with LFS bytes. */
export function exportPersistentLibraryBooks(db: Database) {
  const rows = db
    .prepare(
      `SELECT id, shelf, title, author, description, minutes, cover_emoji AS coverEmoji,
              cover_url AS coverUrl, file_url AS fileUrl, file_name AS fileName,
              file_mime AS fileMime, quotes_json AS quotesJson,
              reflections_json AS reflectionsJson, category, difficulty, length,
              mood, themes_json AS themesJson, rating, published
       FROM library_books
       ORDER BY shelf ASC, created_at ASC`
    )
    .all() as Array<
    PersistentLibraryBook & { published: number | boolean }
  >;

  const removedIds = (
    db.prepare(`SELECT book_id AS id FROM library_removed_books`).all() as Array<{
      id: string;
    }>
  ).map((r) => r.id);

  const books: PersistentLibraryBook[] = [];
  for (const row of rows) {
    const fileName = filenameFromUploadUrl(row.fileUrl);
    if (fileName) {
      const filePath = path.join(LIBRARY_UPLOAD_DIR, fileName);
      if (!fs.existsSync(filePath)) continue;
    }
    const coverName = filenameFromUploadUrl(row.coverUrl);
    if (coverName) {
      const coverPath = path.join(LIBRARY_UPLOAD_DIR, coverName);
      if (!fs.existsSync(coverPath)) {
        // Keep the book even if cover bytes are missing.
      }
    }
    books.push({
      id: row.id,
      shelf: row.shelf === "readinglist" ? "readinglist" : "club",
      title: row.title,
      author: row.author,
      description: row.description || "",
      minutes: Number(row.minutes) || 120,
      coverEmoji: row.coverEmoji || "📖",
      coverUrl: row.coverUrl || null,
      fileUrl: row.fileUrl || null,
      fileName: row.fileName || null,
      fileMime: row.fileMime || null,
      quotesJson: row.quotesJson || "[]",
      reflectionsJson: row.reflectionsJson || "[]",
      category: row.category || null,
      difficulty: row.difficulty || null,
      length: row.length || null,
      mood: row.mood || "",
      themesJson: row.themesJson || "[]",
      rating: Number(row.rating) || 4.5,
      published: Boolean(row.published),
    });
  }

  writeFile(books, removedIds);
  return books.length;
}

/** Restore owner-uploaded library books when DB rows are missing. */
export function importPersistentLibraryBooks(db: Database) {
  const file = readFile();
  if (!file) return 0;

  const owner =
    (db
      .prepare(
        `SELECT id FROM users WHERE is_owner = 1
         ORDER BY CASE WHEN username = 'Mary_Jane' THEN 0 ELSE 1 END, created_at ASC
         LIMIT 1`
      )
      .get() as { id: string } | undefined) ||
    (db
      .prepare(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`)
      .get() as { id: string } | undefined);

  const existing = db.prepare(`SELECT id FROM library_books WHERE id = ?`);
  const insert = db.prepare(`
    INSERT INTO library_books (
      id, shelf, title, author, description, minutes, cover_emoji, cover_url,
      file_url, file_name, file_mime, quotes_json, reflections_json, category,
      difficulty, length, mood, themes_json, rating, published, created_by
    ) VALUES (
      @id, @shelf, @title, @author, @description, @minutes, @cover_emoji, @cover_url,
      @file_url, @file_name, @file_mime, @quotes_json, @reflections_json, @category,
      @difficulty, @length, @mood, @themes_json, @rating, @published, @created_by
    )
  `);
  const markRemoved = db.prepare(
    `INSERT OR IGNORE INTO library_removed_books (book_id) VALUES (?)`
  );

  let restored = 0;
  const tx = db.transaction(() => {
    for (const id of file.removedIds || []) {
      if (!id?.trim()) continue;
      markRemoved.run(id.trim());
    }

    for (const book of file.books || []) {
      if (!book?.id || !book.title || !book.author) continue;
      if (existing.get(book.id)) continue;

      const fileName = filenameFromUploadUrl(book.fileUrl);
      if (fileName) {
        const filePath = path.join(LIBRARY_UPLOAD_DIR, fileName);
        if (!fs.existsSync(filePath)) continue;
      }

      insert.run({
        id: book.id,
        shelf: book.shelf === "readinglist" ? "readinglist" : "club",
        title: book.title.slice(0, 120),
        author: book.author.slice(0, 80),
        description: (book.description || "").slice(0, 2000),
        minutes: Math.max(0, Math.floor(book.minutes || 120)),
        cover_emoji: (book.coverEmoji || "📖").slice(0, 8),
        cover_url: book.coverUrl || null,
        file_url: book.fileUrl || null,
        file_name: book.fileName || null,
        file_mime: book.fileMime || null,
        quotes_json: book.quotesJson || "[]",
        reflections_json: book.reflectionsJson || "[]",
        category: book.category || null,
        difficulty: book.difficulty || null,
        length: book.length || null,
        mood: (book.mood || "").slice(0, 80),
        themes_json: book.themesJson || "[]",
        rating: Number(book.rating) || 4.5,
        published: book.published === false ? 0 : 1,
        created_by: owner?.id || null,
      });
      restored += 1;
    }
  });
  tx();
  return restored;
}

/**
 * Restore every shelf EPUB/PDF that is missing or still a Git LFS pointer
 * so the reading room always has real bytes to open.
 */
export function ensureLibraryBookBytes(db: Database, opts?: { skipNetwork?: boolean }) {
  const rows = db
    .prepare(
      `SELECT file_url FROM library_books
       WHERE file_url IS NOT NULL AND trim(file_url) != ''`
    )
    .all() as Array<{ file_url: string }>;

  let restored = 0;
  let missing = 0;
  for (const row of rows) {
    const filename = filenameFromUploadUrl(row.file_url);
    if (!filename) continue;
    const filePath = path.join(LIBRARY_UPLOAD_DIR, filename);
    try {
      if (fs.existsSync(filePath) && !isLfsPointerLike(filePath)) {
        const size = fs.statSync(filePath).size;
        if (size >= 1024) continue;
      }
    } catch {
      // try restore
    }
    if (opts?.skipNetwork) {
      missing += 1;
      continue;
    }
    try {
      // Lazy require avoids circular import with mediaRelease.
      const { ensureMediaReleaseAsset } = require("@/lib/mediaRelease") as {
        ensureMediaReleaseAsset: (filename: string) => string | null;
      };
      const ok = ensureMediaReleaseAsset(filename);
      if (ok) restored += 1;
      else missing += 1;
    } catch {
      missing += 1;
    }
  }
  if (restored > 0) {
    console.info(`[library] restored ${restored} book file(s) from media shelf`);
  }
  if (missing > 0 && !opts?.skipNetwork) {
    console.warn(
      `[library] ${missing} book file(s) still missing after shelf restore`
    );
  }
  return { restored, missing };
}

function isLfsPointerLike(filePath: string) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024) return false;
    const head = fs.readFileSync(filePath, "utf8");
    return head.startsWith("version https://git-lfs.github.com/spec/v1");
  } catch {
    return false;
  }
}
