import Script from "next/script";
import fs from "fs";
import path from "path";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getLibraryProgress } from "@/lib/library";
import { findLibraryBook } from "@/lib/libraryBooks";
import { ensureMediaReleaseAsset } from "@/lib/mediaRelease";
import { ensureLibraryBookBytes } from "@/lib/persistentLibraryBooks";
import { isLfsPointerFile } from "@/lib/tvUploadFiles";
import { LibraryReadClient } from "@/components/LibraryReadClient";

type Props = {
  params: Promise<{ bookId: string }>;
};

function ensureBookFileReady(fileUrl: string) {
  const match = /\/api\/uploads\/([a-f0-9-]+\.(?:epub|pdf))$/i.exec(fileUrl);
  if (!match) return;
  const filename = match[1];
  const local = path.join(process.cwd(), "data", "uploads", filename);
  try {
    if (
      !fs.existsSync(local) ||
      isLfsPointerFile(local) ||
      fs.statSync(local).size < 1024
    ) {
      ensureMediaReleaseAsset(filename);
    }
  } catch {
    try {
      ensureMediaReleaseAsset(filename);
    } catch {
      // Reader will surface a clear missing-file error.
    }
  }
}

export default async function LibraryReadPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.villageId !== "mosshollow") redirect("/library");

  // Heal any LFS stubs before we hand the reader a URL.
  try {
    ensureLibraryBookBytes(getDb());
  } catch {
    // ignore — single-file restore below still helps
  }

  const { bookId } = await params;
  const book = findLibraryBook(bookId);
  if (!book?.fileUrl) notFound();

  ensureBookFileReady(book.fileUrl);

  const progress = getLibraryProgress(user.id);
  const position = progress.readingPositions?.[book.id] || null;

  return (
    <>
      {/*
        React opens via vendor epub.min.js. Boot is a fallback that only
        steals the mount when React left an empty container (no iframe).
      */}
      <Script src="/library-reader-boot.js" strategy="afterInteractive" />
      <LibraryReadClient
        bookId={book.id}
        title={book.title}
        author={book.author}
        fileUrl={book.fileUrl}
        fileName={book.fileName || null}
        initialPosition={position}
      />
    </>
  );
}
