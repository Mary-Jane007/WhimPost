"use client";

import { useRouter } from "next/navigation";
import { LibraryBookReader } from "@/components/LibraryBookReader";
import type { ReadingPosition } from "@/lib/libraryReadingTypes";

type Props = {
  bookId: string;
  title: string;
  author?: string;
  fileUrl: string;
  fileName?: string | null;
  initialPosition?: ReadingPosition | null;
};

/** Full-page reader shell so Read works even when the shelf client fails to hydrate. */
export function LibraryReadClient({
  bookId,
  title,
  author,
  fileUrl,
  fileName,
  initialPosition,
}: Props) {
  const router = useRouter();
  return (
    <LibraryBookReader
      bookId={bookId}
      title={title}
      author={author}
      fileUrl={fileUrl}
      fileName={fileName}
      initialPosition={initialPosition}
      closeHref="/library"
      onClose={() => router.push("/library")}
    />
  );
}
