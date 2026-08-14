import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isSiteOwner } from "@/lib/owner";
import { getDb } from "@/lib/db";
import {
  attachAssetsToShelfBook,
  bumpClubShuffleSalt,
  clearLibraryBookFile,
  deleteLibraryBook,
  getBookClubRotation,
  listClubBooks,
  listLibraryBookRecords,
  listReadingListBooks,
  moveLibraryBookToShelf,
  upsertLibraryBook,
  type LibraryShelf,
} from "@/lib/libraryBooks";
import type { ReadingCategory, ReadingListBook } from "@/lib/libraryContent";
import { redirectSameHost, wantsHtmlRedirect } from "@/lib/requestBody";

export const runtime = "nodejs";
/** Large EPUB uploads can take a while on slow links. */
export const maxDuration = 600;

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BOOK_BYTES = 500 * 1024 * 1024; // 500MB — full novels / illustrated EPUBs
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

async function saveBookFile(bookFile: File) {
  const ext = extFromBookFile(bookFile);
  if (!ext) return { error: "Upload a PDF or EPUB book file" as const };
  if (bookFile.size > MAX_BOOK_BYTES) {
    return { error: "Book files must be under 500MB" as const };
  }
  ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const dest = path.join(UPLOAD_DIR, filename);
  try {
    // Stream to disk so large EPUBs do not need a second full copy in RAM.
    const webStream = bookFile.stream();
    const nodeStream = Readable.fromWeb(
      webStream as unknown as import("stream/web").ReadableStream
    );
    await pipeline(nodeStream, fs.createWriteStream(dest));
  } catch (err) {
    try {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    } catch {
      // ignore
    }
    console.error("[library] book upload failed:", err);
    return { error: "Could not save the book file — try again" as const };
  }

  // Sanity-check EPUB is a real ZIP before we keep it.
  if (ext === "epub") {
    const fd = fs.openSync(dest, "r");
    const header = Buffer.alloc(4);
    fs.readSync(fd, header, 0, 4, 0);
    fs.closeSync(fd);
    if (!(header[0] === 0x50 && header[1] === 0x4b)) {
      try {
        fs.unlinkSync(dest);
      } catch {
        // ignore
      }
      return {
        error: "That file does not look like a valid EPUB — try another export" as const,
      };
    }
  }

  return {
    fileUrl: `/api/uploads/${filename}`,
    fileName: bookFile.name.slice(0, 180) || filename,
    fileMime: ext === "pdf" ? "application/pdf" : "application/epub+zip",
  };
}

async function saveCoverFile(cover: File) {
  if (!COVER_MIME.has(cover.type)) {
    return { error: "Cover must be a JPG, PNG, WebP, or GIF" as const };
  }
  if (cover.size > MAX_COVER_BYTES) {
    return { error: "Cover images must be under 4MB" as const };
  }
  ensureUploadDir();
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
  return { coverUrl: `/api/uploads/${filename}` };
}

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) as NextResponse };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return {
      error: jsonError(
        "Only the site owner can manage library books",
        403
      ) as NextResponse,
    };
  }
  return { user };
}

function nextFromForm(form: FormData) {
  const nextRaw = String(form.get("next") || "/library");
  return nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/library";
}

/** Villagers see the merged shelf; owners can ask for raw uploaded records. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const rotation = getBookClubRotation();
  const readingList = listReadingListBooks();
  const membershipClubBooks = listClubBooks();
  const admin = req.nextUrl.searchParams.get("admin") === "1";
  if (admin) {
    const gate = await requireOwner();
    if ("error" in gate && gate.error) return gate.error;
    return NextResponse.json({
      books: listLibraryBookRecords({ includeUnpublished: true }),
      clubBooks: rotation.shelf,
      membershipClubBooks,
      readingList,
      featuredBook: rotation.featured,
      daysUntilShuffle: rotation.daysUntilShuffle,
    });
  }

  return NextResponse.json({
    clubBooks: rotation.shelf,
    membershipClubBooks,
    readingList,
    featuredBook: rotation.featured,
    daysUntilShuffle: rotation.daysUntilShuffle,
  });
}

/** Owner creates/updates a library book, or attaches a file to an existing shelf title. */
export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if ("error" in gate && gate.error) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return gate.error;
  }
  const user = gate.user!;

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data");
  const nextPath = nextFromForm(form);

  const intent = String(form.get("intent") || "").trim();
  if (intent === "remove") {
    const id = String(form.get("bookId") || form.get("id") || "").trim();
    if (!id) return jsonError("Book id required");
    const result = deleteLibraryBook(id);
    if (!result.ok) return jsonError(result.error, 404);
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
    return NextResponse.json({ ok: true, removed: id });
  }

  if (intent === "clear-file") {
    const id = String(form.get("bookId") || form.get("id") || "").trim();
    if (!id) return jsonError("Book id required");
    try {
      const book = clearLibraryBookFile(id, user.id);
      if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
      return NextResponse.json({ ok: true, book, clearedFile: true });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Could not remove the book file",
        400
      );
    }
  }

  if (intent === "reshuffle") {
    const salt = bumpClubShuffleSalt();
    const rotation = getBookClubRotation();
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
    return NextResponse.json({
      ok: true,
      shuffleSalt: salt,
      featuredBook: rotation.featured,
      clubBooks: rotation.shelf,
      daysUntilShuffle: rotation.daysUntilShuffle,
    });
  }

  if (intent === "set-shelf") {
    const id = String(form.get("bookId") || form.get("id") || "").trim();
    const shelfRaw = String(form.get("shelf") || "").trim();
    const shelf: LibraryShelf =
      shelfRaw === "readinglist" ? "readinglist" : "club";
    if (!id) return jsonError("Book id required");
    try {
      const book = moveLibraryBookToShelf(id, shelf, user.id);
      if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
      return NextResponse.json({ book, moved: true });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Could not move book",
        400
      );
    }
  }

  const attachTo = String(form.get("attachTo") || form.get("id") || "").trim();
  const attachOnly =
    String(form.get("attachOnly") || "") === "1" ||
    Boolean(form.get("attachTo"));

  // Attach / replace EPUB|PDF and/or cover image on an existing shelf book.
  if (attachOnly && attachTo) {
    const bookFile = form.get("file");
    const cover = form.get("cover");
    const hasBookFile = bookFile instanceof File && bookFile.size > 0;
    const hasCover = cover instanceof File && cover.size > 0;
    if (!hasBookFile && !hasCover) {
      return jsonError("Choose a PDF/EPUB or a cover image to attach");
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileMime: string | undefined;
    if (hasBookFile) {
      const saved = await saveBookFile(bookFile as File);
      if ("error" in saved) return jsonError(saved.error || "Could not save book file");
      fileUrl = saved.fileUrl;
      fileName = saved.fileName;
      fileMime = saved.fileMime;
    }

    let coverUrl: string | null | undefined;
    if (hasCover) {
      const coverSaved = await saveCoverFile(cover as File);
      if ("error" in coverSaved) {
        return jsonError(coverSaved.error || "Could not save cover");
      }
      coverUrl = coverSaved.coverUrl;
    }

    try {
      const book = attachAssetsToShelfBook({
        bookId: attachTo,
        fileUrl,
        fileName,
        fileMime,
        coverUrl,
        createdBy: user.id,
      });
      if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
      return NextResponse.json({ book, attached: true });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Could not update shelf book",
        400
      );
    }
  }

  const shelfRaw = String(form.get("shelf") || "club");
  const shelf: LibraryShelf =
    shelfRaw === "readinglist" ? "readinglist" : "club";
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  if (!title || !author) return jsonError("Title and author are required");

  let fileUrl: string | null | undefined;
  let fileName: string | null | undefined;
  let fileMime: string | null | undefined;
  const bookFile = form.get("file");
  if (bookFile instanceof File && bookFile.size > 0) {
    const saved = await saveBookFile(bookFile);
    if ("error" in saved) return jsonError(saved.error || "Could not save book file");
    fileUrl = saved.fileUrl;
    fileName = saved.fileName;
    fileMime = saved.fileMime;
  }

  let coverUrl: string | null | undefined;
  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const coverSaved = await saveCoverFile(cover);
    if ("error" in coverSaved) {
      return jsonError(coverSaved.error || "Could not save cover");
    }
    coverUrl = coverSaved.coverUrl;
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
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, nextPath);
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
