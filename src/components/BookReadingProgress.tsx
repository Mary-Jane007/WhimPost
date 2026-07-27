import type { LibraryProgress } from "@/lib/library";
import { getBookProgressView } from "@/lib/libraryProgressView";

/** Compact progress meter for shelf cards and club rows. */
export function BookReadingProgress({
  progress,
  bookId,
  compact = false,
}: {
  progress: LibraryProgress;
  bookId: string;
  compact?: boolean;
}) {
  const view = getBookProgressView(progress, bookId);
  return (
    <div
      className={`mh-book-progress${compact ? " is-compact" : ""}${
        view.finished ? " is-finished" : view.started ? " is-started" : ""
      }`}
    >
      <div
        className="mh-book-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={view.percent}
        aria-label={`Reading progress ${view.percent}%`}
      >
        <span style={{ width: `${view.percent}%` }} />
      </div>
      <p className="mh-book-progress-meta">
        <span>{view.label}</span>
        {view.lastRead ? <span className="muted">{view.lastRead}</span> : null}
      </p>
    </div>
  );
}
