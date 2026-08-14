import Script from "next/script";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLibraryProgress } from "@/lib/library";
import { findLibraryBook } from "@/lib/libraryBooks";
import { LibraryReadClient } from "@/components/LibraryReadClient";

type Props = {
  params: Promise<{ bookId: string }>;
};

export default async function LibraryReadPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.villageId !== "mosshollow") redirect("/library");

  const { bookId } = await params;
  const book = findLibraryBook(bookId);
  if (!book?.fileUrl) notFound();

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
