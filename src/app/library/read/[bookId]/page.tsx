import fs from "fs";
import path from "path";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getLibraryProgress } from "@/lib/library";
import { findLibraryBook } from "@/lib/libraryBooks";
import { ensureMediaReleaseAsset } from "@/lib/mediaRelease";
import { ensureLibraryBookBytes } from "@/lib/persistentLibraryBooks";
import { isLfsPointerFile } from "@/lib/lfsPointer";
import { LibraryReadClient } from "@/components/LibraryReadClient";
import { canAccessVillageWorkshop } from "@/lib/villages";

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
  if (!canAccessVillageWorkshop(user, "mosshollow")) redirect("/library");

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
        Plain classic script (not next/script) so the fallback always runs
        even when React hydration is slow. React still owns the mount first;
        boot only steals an empty stage.
      */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/library-reader-boot.js" defer />
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
