import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  ARCHIVE_CLIPS,
  CURIOSITY_FACTS,
  LIBRARY_COLLECTIONS,
  LIBRARY_XP,
  MYSTERIES,
  SECRET_REWARDS,
  featuredCuriosity,
  featuredMystery,
  featuredThought,
  titleForLibraryXp,
  weeklyChallenges,
} from "@/lib/libraryContent";
import {
  findLibraryBook,
  featuredClubBookMerged,
  listClubBooks,
  listReadingListBooks,
} from "@/lib/libraryBooks";
import {
  getReadingPositions,
  resetUserReadingProgress,
  saveReadingPosition,
  type ReadingPositions,
} from "@/lib/libraryReading";

export type LibraryJournalEntry = {
  id: string;
  activityType: string;
  activityId: string;
  activityName: string;
  note: string;
  quote: string;
  photoUrl: string | null;
  xpEarned: number;
  createdAt: string;
};

export type ThoughtReply = {
  id: string;
  promptId: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type LibraryProgress = {
  xp: number;
  title: ReturnType<typeof titleForLibraryXp>;
  badges: string[];
  stamps: string[];
  bookProgress: Record<string, number>;
  finishedBooks: Record<string, boolean>;
  wishlist: Record<string, boolean>;
  readingStatus: Record<string, "none" | "reading" | "finished">;
  readingPositions: ReadingPositions;
  curiosityDone: Record<string, boolean>;
  mysteryDone: Record<string, boolean>;
  challenges: Record<string, boolean>;
  archives: Record<string, { favorite?: boolean; completed?: boolean; progress?: number }>;
  collectionProgress: Record<string, number>;
  secretsFound: string[];
  journal: LibraryJournalEntry[];
  thoughts: ThoughtReply[];
  featured: {
    bookId: string;
    curiosityId: string;
    mysteryId: string;
    thoughtId: string;
    challengeIds: string[];
  };
};

type ProgressRow = {
  user_id: string;
  xp: number;
  badges_json: string;
  stamps_json: string;
  book_progress_json: string;
  finished_json: string;
  wishlist_json: string;
  reading_status_json: string;
  reading_positions_json?: string;
  curiosity_json: string;
  mystery_json: string;
  challenges_json: string;
  archives_json: string;
  collections_json: string;
  secrets_json: string;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureProgressRow(userId: string) {
  const db = getDb();
  const existing = db
    .prepare(`SELECT user_id FROM library_progress WHERE user_id = ?`)
    .get(userId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(`INSERT INTO library_progress (user_id, xp) VALUES (?, 0)`).run(
    userId
  );
}

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  return dbGet(userId);
}

function dbGet(userId: string) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM library_progress WHERE user_id = ?`)
    .get(userId) as ProgressRow;
}

function listJournal(userId: string): LibraryJournalEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, activity_type, activity_id, activity_name, note, quote, photo_url, xp_earned, created_at
       FROM library_journal
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 80`
    )
    .all(userId) as Array<{
    id: string;
    activity_type: string;
    activity_id: string;
    activity_name: string;
    note: string;
    quote: string;
    photo_url: string | null;
    xp_earned: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    activityType: r.activity_type,
    activityId: r.activity_id,
    activityName: r.activity_name,
    note: r.note,
    quote: r.quote,
    photoUrl: r.photo_url,
    xpEarned: r.xp_earned,
    createdAt: r.created_at,
  }));
}

function listThoughts(promptId: string): ThoughtReply[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.id, t.prompt_id, t.body, t.created_at, u.display_name
       FROM library_thoughts t
       JOIN users u ON u.id = t.user_id
       WHERE t.prompt_id = ?
       ORDER BY t.created_at DESC
       LIMIT 40`
    )
    .all(promptId) as Array<{
    id: string;
    prompt_id: string;
    body: string;
    created_at: string;
    display_name: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    body: r.body,
    authorName: r.display_name,
    createdAt: r.created_at,
  }));
}

function insertJournal(input: {
  userId: string;
  activityType: string;
  activityId: string;
  activityName: string;
  note?: string;
  quote?: string;
  photoUrl?: string | null;
  xpEarned: number;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO library_journal
      (id, user_id, activity_type, activity_id, activity_name, note, quote, photo_url, xp_earned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    input.userId,
    input.activityType,
    input.activityId,
    input.activityName,
    (input.note || "").slice(0, 2000),
    (input.quote || "").slice(0, 500),
    input.photoUrl || null,
    input.xpEarned
  );
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge);
  return badges;
}

export function getLibraryProgress(userId: string): LibraryProgress {
  const row = readRow(userId);
  const book = featuredClubBookMerged();
  if (!book) {
    throw new Error("No club books available");
  }
  const curiosity = featuredCuriosity();
  const mystery = featuredMystery();
  const thought = featuredThought();
  const challenges = weeklyChallenges();

  const readingPositions = getReadingPositions(userId);
  const bookProgress = parseJson<Record<string, number>>(
    row.book_progress_json,
    {}
  );
  // Prefer CFI bookmark % over any older sticky/inflated shelf value.
  for (const [id, pos] of Object.entries(readingPositions)) {
    if (pos && Number.isFinite(pos.percent)) {
      bookProgress[id] = Math.max(0, Math.min(100, Math.round(pos.percent)));
    }
  }

  return {
    xp: Number(row.xp) || 0,
    title: titleForLibraryXp(Number(row.xp) || 0),
    badges: parseJson(row.badges_json, []),
    stamps: parseJson(row.stamps_json, []),
    bookProgress,
    finishedBooks: parseJson(row.finished_json, {}),
    wishlist: parseJson(row.wishlist_json, {}),
    readingStatus: parseJson(row.reading_status_json, {}),
    readingPositions,
    curiosityDone: parseJson(row.curiosity_json, {}),
    mysteryDone: parseJson(row.mystery_json, {}),
    challenges: parseJson(row.challenges_json, {}),
    archives: parseJson(row.archives_json, {}),
    collectionProgress: parseJson(row.collections_json, {}),
    secretsFound: parseJson(row.secrets_json, []),
    journal: listJournal(userId),
    thoughts: listThoughts(thought.id),
    featured: {
      bookId: book.id,
      curiosityId: curiosity.id,
      mysteryId: mystery.id,
      thoughtId: thought.id,
      challengeIds: challenges.map((c) => c.id),
    },
  };
}

export type LibraryAction =
  | { type: "bookProgress"; bookId: string; percent: number }
  | {
      type: "saveReadingPosition";
      bookId: string;
      percent?: number;
      cfi?: string | null;
      page?: number | null;
      total?: number | null;
      label?: string;
      reliable?: boolean;
    }
  | { type: "resetReadingProgress"; bookId: string }
  | { type: "finishBook"; bookId: string; reflection?: string; quote?: string }
  | { type: "wishlist"; bookId: string; on: boolean }
  | { type: "readingStatus"; bookId: string; status: "none" | "reading" | "finished" }
  | { type: "curiosityQuiz"; factId: string; choice: number }
  | { type: "solveMystery"; mysteryId: string; answer: string }
  | { type: "completeChallenge"; challengeId: string }
  | { type: "submitThought"; promptId: string; body: string }
  | { type: "archive"; clipId: string; favorite?: boolean; completed?: boolean; progress?: number }
  | { type: "journalEntry"; activityName: string; note: string; quote?: string; photoUrl?: string }
  | { type: "claimSecret" };

export function applyLibraryAction(
  userId: string,
  action: LibraryAction
): LibraryProgress {
  const db = getDb();
  ensureProgressRow(userId);
  const row = readRow(userId);
  let xp = Number(row.xp) || 0;
  let badges = parseJson<string[]>(row.badges_json, []);
  let stamps = parseJson<string[]>(row.stamps_json, []);
  const bookProgress = parseJson<Record<string, number>>(
    row.book_progress_json,
    {}
  );
  const finishedBooks = parseJson<Record<string, boolean>>(
    row.finished_json,
    {}
  );
  const wishlist = parseJson<Record<string, boolean>>(row.wishlist_json, {});
  const readingStatus = parseJson<
    Record<string, "none" | "reading" | "finished">
  >(row.reading_status_json, {});
  const curiosityDone = parseJson<Record<string, boolean>>(
    row.curiosity_json,
    {}
  );
  const mysteryDone = parseJson<Record<string, boolean>>(row.mystery_json, {});
  const challenges = parseJson<Record<string, boolean>>(
    row.challenges_json,
    {}
  );
  const archives = parseJson<
    Record<string, { favorite?: boolean; completed?: boolean; progress?: number }>
  >(row.archives_json, {});
  const collectionProgress = parseJson<Record<string, number>>(
    row.collections_json,
    {}
  );
  let secretsFound = parseJson<string[]>(row.secrets_json, []);

  const bumpCollection = (id: string, by = 1) => {
    collectionProgress[id] = (collectionProgress[id] || 0) + by;
    const meta = LIBRARY_COLLECTIONS.find((c) => c.id === id);
    if (meta && collectionProgress[id] >= meta.need) {
      badges = addBadge(badges, meta.badge);
    }
  };

  if (action.type === "bookProgress") {
    const pct = Math.max(0, Math.min(100, Math.floor(action.percent)));
    // Manual slider sets the exact value (no sticky high-water).
    bookProgress[action.bookId] = pct;
    readingStatus[action.bookId] =
      pct >= 100 ? "finished" : pct > 0 ? "reading" : "none";
  } else if (action.type === "saveReadingPosition") {
    const saved = saveReadingPosition(userId, action.bookId, {
      cfi: action.cfi,
      percent: action.percent,
      page: action.page,
      total: action.total,
      label: action.label,
    });
    Object.assign(bookProgress, saved.bookProgress);
    const pct = Math.max(
      0,
      Math.min(100, Math.round(Number(saved.bookProgress[action.bookId]) || 0))
    );
    readingStatus[action.bookId] =
      pct >= 100 ? "finished" : pct > 0 ? "reading" : readingStatus[action.bookId] || "none";
    // Early return — saveReadingPosition already wrote progress columns.
    return getLibraryProgress(userId);
  } else if (action.type === "resetReadingProgress") {
    resetUserReadingProgress(userId, action.bookId);
    // Early return — reset already wrote progress columns.
    return getLibraryProgress(userId);
  } else if (action.type === "finishBook") {
    const book = findLibraryBook(action.bookId);
    if (book && !finishedBooks[action.bookId]) {
      finishedBooks[action.bookId] = true;
      bookProgress[action.bookId] = 100;
      readingStatus[action.bookId] = "finished";
      xp += LIBRARY_XP.reading;
      badges = addBadge(badges, "Bookworm Badge");
      bumpCollection("classics-10");
      if ("category" in book) {
        if (book.category === "Psychology") bumpCollection("psych-fan");
        if (book.category === "History") bumpCollection("history-scholar");
        if (book.category === "Nature") bumpCollection("naturalist");
        if (book.category === "Science") bumpCollection("stargazer");
        if (book.category === "Philosophy") bumpCollection("philosopher");
        if (book.category === "Fantasy") bumpCollection("owl-expert");
        if (book.category === "Mystery") bumpCollection("world-explorer");
      }
      insertJournal({
        userId,
        activityType: "book",
        activityId: action.bookId,
        activityName: `Finished · ${book.title}`,
        note: action.reflection || "Closed the cover with a quiet smile.",
        quote: action.quote || "",
        xpEarned: LIBRARY_XP.reading,
      });
    }
  } else if (action.type === "wishlist") {
    if (action.on) wishlist[action.bookId] = true;
    else delete wishlist[action.bookId];
  } else if (action.type === "readingStatus") {
    readingStatus[action.bookId] = action.status;
    if (action.status === "finished" && !finishedBooks[action.bookId]) {
      return applyLibraryAction(userId, {
        type: "finishBook",
        bookId: action.bookId,
      });
    }
  } else if (action.type === "curiosityQuiz") {
    const found = CURIOSITY_FACTS.find((f) => f.id === action.factId);
    if (found && !curiosityDone[found.id]) {
      const correct = action.choice === found.quiz.answer;
      curiosityDone[found.id] = true;
      if (correct) {
        xp += LIBRARY_XP.quiz;
        bumpCollection("owl-expert");
        insertJournal({
          userId,
          activityType: "curiosity",
          activityId: found.id,
          activityName: `Curiosity · ${found.question}`,
          note: "Quiz answered correctly — another lantern lit.",
          xpEarned: LIBRARY_XP.quiz,
        });
      } else {
        insertJournal({
          userId,
          activityType: "curiosity",
          activityId: found.id,
          activityName: `Curiosity · ${found.question}`,
          note: "Read the fact; keep wondering for another night.",
          xpEarned: 0,
        });
      }
    }
  } else if (action.type === "solveMystery") {
    const mystery =
      MYSTERIES.find((m) => m.id === action.mysteryId) || featuredMystery();
    if (mystery.id === action.mysteryId && !mysteryDone[mystery.id]) {
      const normalized = action.answer.trim().toLowerCase();
      const ok =
        normalized === mystery.answer.toLowerCase() ||
        mystery.answer.toLowerCase().includes(normalized);
      if (ok) {
        mysteryDone[mystery.id] = true;
        xp += LIBRARY_XP.mystery;
        if (!stamps.includes(mystery.stamp)) stamps.push(mystery.stamp);
        bumpCollection("world-explorer");
        insertJournal({
          userId,
          activityType: "mystery",
          activityId: mystery.id,
          activityName: mystery.title,
          note: `Solved. Stamp earned: ${mystery.stamp}`,
          xpEarned: LIBRARY_XP.mystery,
        });
      }
    }
  } else if (action.type === "completeChallenge") {
    if (!challenges[action.challengeId]) {
      const label =
        weeklyChallenges().find((c) => c.id === action.challengeId)?.label ||
        action.challengeId;
      challenges[action.challengeId] = true;
      xp += LIBRARY_XP.challenge;
      insertJournal({
        userId,
        activityType: "challenge",
        activityId: action.challengeId,
        activityName: label,
        note: "Archive challenge complete.",
        xpEarned: LIBRARY_XP.challenge,
      });
    }
  } else if (action.type === "submitThought") {
    const body = action.body.trim().slice(0, 1200);
    if (body.length >= 12) {
      db.prepare(
        `INSERT INTO library_thoughts (id, user_id, prompt_id, body)
         VALUES (?, ?, ?, ?)`
      ).run(randomUUID(), userId, action.promptId, body);
      xp += LIBRARY_XP.thought;
      bumpCollection("philosopher");
      insertJournal({
        userId,
        activityType: "thought",
        activityId: action.promptId,
        activityName: "Thought experiment",
        note: body,
        xpEarned: LIBRARY_XP.thought + LIBRARY_XP.reflection,
      });
      xp += LIBRARY_XP.reflection;
    }
  } else if (action.type === "archive") {
    const clip = ARCHIVE_CLIPS.find((c) => c.id === action.clipId);
    const prior = archives[action.clipId] || {};
    archives[action.clipId] = {
      ...prior,
      favorite:
        action.favorite !== undefined ? action.favorite : prior.favorite,
      completed:
        action.completed !== undefined ? action.completed : prior.completed,
      progress:
        action.progress !== undefined ? action.progress : prior.progress,
    };
    if (action.completed && !prior.completed && clip) {
      xp += LIBRARY_XP.archive;
      if (clip.category.includes("Owl")) bumpCollection("owl-expert");
      if (clip.category.includes("Space")) bumpCollection("stargazer");
      if (clip.category.includes("Nature")) bumpCollection("naturalist");
      if (clip.category.includes("History") || clip.category.includes("Archaeology"))
        bumpCollection("history-scholar");
      insertJournal({
        userId,
        activityType: "archive",
        activityId: clip.id,
        activityName: clip.title,
        note: "Watched in the Mosshollow Archives.",
        xpEarned: LIBRARY_XP.archive,
      });
    }
  } else if (action.type === "journalEntry") {
    const note = action.note.trim().slice(0, 2000);
    const name = action.activityName.trim().slice(0, 120);
    if (name && note) {
      xp += LIBRARY_XP.journal;
      insertJournal({
        userId,
        activityType: "journal",
        activityId: `custom-${Date.now()}`,
        activityName: name,
        note,
        quote: action.quote,
        photoUrl: action.photoUrl,
        xpEarned: LIBRARY_XP.journal,
      });
    }
  } else if (action.type === "claimSecret") {
    const remaining = SECRET_REWARDS.filter((r) => !secretsFound.includes(r.id));
    if (remaining.length) {
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      secretsFound = [...secretsFound, pick.id];
      xp += LIBRARY_XP.secret;
      insertJournal({
        userId,
        activityType: "secret",
        activityId: pick.id,
        activityName: `Secret Library · ${pick.label}`,
        note: pick.text,
        xpEarned: LIBRARY_XP.secret,
      });
    }
  }

  db.prepare(
    `UPDATE library_progress SET
      xp = ?,
      badges_json = ?,
      stamps_json = ?,
      book_progress_json = ?,
      finished_json = ?,
      wishlist_json = ?,
      reading_status_json = ?,
      curiosity_json = ?,
      mystery_json = ?,
      challenges_json = ?,
      archives_json = ?,
      collections_json = ?,
      secrets_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    xp,
    JSON.stringify(badges),
    JSON.stringify(stamps),
    JSON.stringify(bookProgress),
    JSON.stringify(finishedBooks),
    JSON.stringify(wishlist),
    JSON.stringify(readingStatus),
    JSON.stringify(curiosityDone),
    JSON.stringify(mysteryDone),
    JSON.stringify(challenges),
    JSON.stringify(archives),
    JSON.stringify(collectionProgress),
    JSON.stringify(secretsFound),
    userId
  );

  return getLibraryProgress(userId);
}
