import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isSiteOwner } from "@/lib/owner";
import { getDb } from "@/lib/db";
import {
  deleteLibraryBook,
  listClubBooks,
  listLibraryBookRecords,
  listReadingListBooks,
  upsertLibraryBook,
  type LibraryShelf,
} from "@/lib/libraryBooks";
import type { ReadingCategory, ReadingListBook } from "@/lib/libraryContent";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BOOK_BYTES = 40 * 1024 * 1024; // 40MB
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const BOOK_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "application/x-epub+zip": "epub",
};
const COVER_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function extFromBookFile(file: File) {
  const byMime = BOOK_MIME[file.type];
  if (byMime) return byMime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".epub")) return "epub";
  return null;
}

function splitLines(raw: FormDataEntryValue | null) {
  return String(raw || "")
    .split(/\n|•|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return { error: jsonError("Only the site owner can manage library books", 403) };
  }
  return { user };
}

/** Villagers see the merged shelf; owners can ask for raw uploaded records. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const admin = req.nextUrl.searchParams.get("admin") === "1";
  if (admin) {
    const gate = await requireOwner();
    if ("error" in gate && gate.error) return gate.error;
    return NextResponse.json({
      books: listLibraryBookRecords({ includeUnpublished: true }),
    });
  }

  return NextResponse.json({
    clubBooks: listClubBooks(),
    readingList: listReadingListBooks(),
  });
}

/** Owner creates/updates a library book, optionally with PDF/EPUB + cover. */
export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate && gate.error) return gate.error;
  const user = gate.user!;

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data");

  const shelfRaw = String(form.get("shelf") || "club");
  const shelf: LibraryShelf =
    shelfRaw === "readinglist" ? "readinglist" : "club";
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  if (!title || !author) return jsonError("Title and author are required");

  ensureUploadDir();

  let fileUrl: string | null | undefined;
  let fileName: string | null | undefined;
  let fileMime: string | null | undefined;
  const bookFile = form.get("file");
  if (bookFile instanceof File && bookFile.size > 0) {
    const ext = extFromBookFile(bookFile);
    if (!ext) return jsonError("Upload a PDF or EPUB book file");
    if (bookFile.size > MAX_BOOK_BYTES) {
      return jsonError("Book files must be under 40MB");
    }
    const filename = `${randomUUID()}.${ext}`;
    fs.writeFileSync(
      path.join(UPLOAD_DIR, filename),
      Buffer.from(await bookFile.arrayBuffer())
    );
    fileUrl = `/api/uploads/${filename}`;
    fileName = bookFile.name.slice(0, 180) || filename;
    fileMime =
      ext === "pdf" ? "application/pdf" : "application/epub+zip";
  }

  let coverUrl: string | null | undefined;
  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (!COVER_MIME.has(cover.type)) {
      return jsonError("Cover must be a JPG, PNG, WebP, or GIF");
    }
    if (cover.size > MAX_COVER_BYTES) {
      return jsonError("Cover images must be under 4MB");
    }
    const ext =
      cover.type === "image/png"
        ? "png"
        : cover.type === "image/webp"
          ? "webp"
          : cover.type === "image/gif"
            ? "gif"
            : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    fs.writeFileSync(
      path.join(UPLOAD_DIR, filename),
      Buffer.from(await cover.arrayBuffer())
    );
    coverUrl = `/api/uploads/${filename}`;
  }

  const idRaw = String(form.get("id") || "").trim();
  const difficulty = String(form.get("difficulty") || "").trim() as
    | ReadingListBook["difficulty"]
    | "";
  const length = String(form.get("length") || "").trim() as
    | ReadingListBook["length"]
    | "";
  const category = String(form.get("category") || "").trim() as
    | ReadingCategory
    | "";

  try {
    const book = upsertLibraryBook({
      id: idRaw || undefined,
      shelf,
      title,
      author,
      description: String(form.get("description") || ""),
      minutes: Number(form.get("minutes") || 120),
      coverEmoji: String(form.get("coverEmoji") || "📖"),
      coverUrl,
      fileUrl,
      fileName,
      fileMime,
      quotes: splitLines(form.get("quotes")),
      reflections: splitLines(form.get("reflections")),
      category: category || null,
      difficulty: difficulty || null,
      length: length || null,
      mood: String(form.get("mood") || ""),
      themes: splitLines(form.get("themes")),
      rating: Number(form.get("rating") || 4.5),
      published: String(form.get("published") || "1") !== "0",
      createdBy: user.id,
    });
    return NextResponse.json({ book });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Could not save book",
      400
    );
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate && gate.error) return gate.error;

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "").trim();
  if (!id) return jsonError("Book id required");

  const result = deleteLibraryBook(id);
  if (!result.ok) return jsonError(result.error, 404);
  return NextResponse.json({ ok: true });
}
