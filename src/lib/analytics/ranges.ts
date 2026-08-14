import type { AnalyticsRangeKey, DateRange } from "@/lib/analytics/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** SQLite-friendly UTC datetime `YYYY-MM-DD HH:MM:SS`. */
export function toSqliteUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)
  );
}

export function resolveDateRange(
  key: AnalyticsRangeKey,
  customStart?: string | null,
  customEnd?: string | null
): DateRange {
  const now = new Date();
  const end = now;
  const today = startOfUtcDay(now);

  if (key === "all") {
    return {
      key,
      start: null,
      end: null,
      prevStart: null,
      prevEnd: null,
      label: "All time",
    };
  }

  if (key === "custom") {
    const start = customStart
      ? new Date(customStart.includes("T") ? customStart : `${customStart}T00:00:00Z`)
      : today;
    const endCustom = customEnd
      ? new Date(customEnd.includes("T") ? customEnd : `${customEnd}T23:59:59Z`)
      : now;
    const ms = Math.max(0, endCustom.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime() - 1000);
    const prevStart = new Date(prevEnd.getTime() - ms);
    return {
      key,
      start: toSqliteUtc(start),
      end: toSqliteUtc(endCustom),
      prevStart: toSqliteUtc(prevStart),
      prevEnd: toSqliteUtc(prevEnd),
      label: "Custom range",
    };
  }

  const days =
    key === "today"
      ? 1
      : key === "7d"
        ? 7
        : key === "30d"
          ? 30
          : key === "90d"
            ? 90
            : 180;

  const start =
    key === "today"
      ? today
      : new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const ms = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1000);
  const prevStart = new Date(prevEnd.getTime() - ms);

  const labels: Record<string, string> = {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 3 months",
    "180d": "Last 6 months",
  };

  return {
    key,
    start: toSqliteUtc(start),
    end: toSqliteUtc(end),
    prevStart: toSqliteUtc(prevStart),
    prevEnd: toSqliteUtc(prevEnd),
    label: labels[key] || key,
  };
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
