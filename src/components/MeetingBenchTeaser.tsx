import Link from "next/link";
import type { BenchTeaser } from "@/lib/meetingBench";

export function MeetingBenchTeaser({ teaser }: { teaser: BenchTeaser }) {
  return (
    <section className={`village-panel mb-teaser season-${teaser.season}`}>
      <h2>🪑 The Meeting Bench</h2>
      <p className="section-lead">
        Come sit for a moment. There might be something happening.
      </p>

      <ul className="mb-teaser-list">
        {teaser.seasonal ? (
          <li>
            <span aria-hidden>🍃</span>
            <div>
              <strong>{teaser.seasonLabel} Gathering</strong>
              <em>{teaser.seasonal.title}</em>
            </div>
          </li>
        ) : null}
        {teaser.notice ? (
          <li>
            <span aria-hidden>📜</span>
            <div>
              <strong>New Notice</strong>
              <em>{teaser.notice.title}</em>
            </div>
          </li>
        ) : null}
        {teaser.gathering ? (
          <li>
            <span aria-hidden>🗓️</span>
            <div>
              <strong>Coming Up</strong>
              <em>
                {teaser.gathering.title} — {teaser.gathering.when}
              </em>
            </div>
          </li>
        ) : null}
        {teaser.chronicle ? (
          <li>
            <span aria-hidden>📰</span>
            <div>
              <strong>Chronicle</strong>
              <em>{teaser.chronicle.title}</em>
            </div>
          </li>
        ) : null}
        {!teaser.notice &&
        !teaser.gathering &&
        !teaser.seasonal &&
        !teaser.chronicle ? (
          <li>
            <span aria-hidden>🌱</span>
            <div>
              <strong>Quiet for now</strong>
              <em>The board is waiting for the next breeze.</em>
            </div>
          </li>
        ) : null}
      </ul>

      <Link href="/meeting-bench" className="btn-primary">
        Sit at the Bench
      </Link>
    </section>
  );
}
