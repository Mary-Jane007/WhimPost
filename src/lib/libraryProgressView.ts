import type { LibraryProgress } from "@/lib/library";
import type { ReadingPosition } from "@/lib/libraryReadingTypes";

export type BookProgressView = {
  percent: number;
  label: string;
  finished: boolean;
  started: boolean;
  lastRead: string | null;
  position: ReadingPosition | null;
};

export function getBookProgressView(
  progress: LibraryProgress,
  bookId: string
): BookProgressView {
  const position = progress.readingPositions?.[bookId] || null;
  const fromPos =
    position && Number.isFinite(position.percent)
      ? Math.round(position.percent)
      : null;
  const fromShelf = Number.isFinite(progress.bookProgress?.[bookId])
    ? Math.round(progress.bookProgress[bookId]!)
    : null;
  const percent = Math.max(
    0,
    Math.min(100, fromPos ?? fromShelf ?? 0)
  );
  const finished =
    Boolean(progress.finishedBooks?.[bookId]) ||
    progress.readingStatus?.[bookId] === "finished" ||
    percent >= 100;
  const started =
    finished ||
    percent > 0 ||
    Boolean(position?.cfi) ||
    progress.readingStatus?.[bookId] === "reading";
  const label = finished
    ? "Finished"
    : percent > 0
      ? `${percent}% read`
      : started
        ? "Just started"
        : "Not started";
  const place =
    position?.label && !finished
      ? position.label
      : null;

  return {
    percent: finished ? 100 : percent,
    label: place ? `${label} · ${place}` : label,
    finished,
    started,
    lastRead: formatLastRead(position?.updatedAt),
    position,
  };
}

function formatLastRead(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const now = Date.now();
  const diffMs = Math.max(0, now - then.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Last read just now";
  if (mins < 60) return `Last read ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last read ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `Last read ${days}d ago`;
  return `Last read ${then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}
