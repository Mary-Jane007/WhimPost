/** Calendar day as YYYY-MM-DD (UTC). */
export function todayNoteDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Accept only a safe YYYY-MM-DD day string. */
export function normalizeNoteDay(raw: string | null | undefined): string {
  const value = String(raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return todayNoteDay();
}
