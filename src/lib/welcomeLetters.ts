import { hashSync } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type Database from "better-sqlite3";
import { toLetterView } from "@/lib/letters";
import type { LetterRecord, LetterView } from "@/lib/types";
import { isVillageId, type VillageId } from "@/lib/villages";

type SystemVillageSender = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  forestName: string;
  bio: string;
};

type WelcomeTemplate = {
  subject: string;
  body: string;
  paperStyle: string;
  envelopeStyle: string;
  waxSeal: string;
  stampStyle: string;
  stickers: Array<{
    id: string;
    kind: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
  scraps: Array<{
    id: string;
    kind: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>;
};

const SYSTEM_SENDERS: Partial<Record<VillageId, SystemVillageSender>> = {
  mosshollow: {
    id: "system-mosshollow",
    username: "mosshollow_owl",
    displayName: "Mosshollow",
    email: "system+mosshollow@whimpost.local",
    forestName: "The Great Library",
    bio: "Where stories are preserved.",
  },
  clovermeadow: {
    id: "system-clovermeadow",
    username: "clovermeadow_bee",
    displayName: "Clovermeadow",
    email: "system+clovermeadow@whimpost.local",
    forestName: "The Community Garden",
    bio: "Where kindness grows.",
  },
};

const WELCOME_TEMPLATES: Partial<Record<VillageId, WelcomeTemplate>> = {
  mosshollow: {
    subject: "Welcome to Mosshollow",
    body: `To our newest neighbor,

The forest noticed your footsteps long before we did.

This morning, the old owl blinked twice from the library oak, the moss softened beneath the winding paths, and somewhere between the shelves of forgotten stories, an empty place quietly filled itself.

That place was waiting for you.

Here in **Mosshollow**, we believe every person carries a story worth preserving. Some are written in careful ink, others in crossed-out sentences and coffee stains. We cherish them all.

Should you ever lose your words, wander to the Great Library. The trees have a remarkable way of lending them back.

Your neighbors are eager to know you—not through perfect introductions, but through honest letters, curious questions, and the pages you'll leave behind.

A small satchel has been prepared for you.

Inside you'll find:

* A fountain pen that never minds mistakes.
* A pressed oak leaf to mark your favorite page.
* A warm cup of woodland tea.
* And a blank journal, patiently waiting for its first sentence.

May your mailbox always be full, your thoughts never hurried, and your stories find a home among ours.

Welcome to **Mosshollow**.

*May your words take root.*`,
    paperStyle: "moss",
    envelopeStyle: "sage",
    waxSeal: "fern",
    stampStyle: "leafy-branch",
    stickers: [
      {
        id: "welcome-leaf",
        kind: "leafy-branch",
        x: 93,
        y: 7,
        scale: 0.72,
        rotation: 18,
      },
      {
        id: "welcome-mushroom",
        kind: "mushroom-amanita",
        x: 90,
        y: 88,
        scale: 0.68,
        rotation: -12,
      },
      {
        id: "welcome-moon",
        kind: "moon-crescent",
        x: 94,
        y: 96,
        scale: 0.55,
        rotation: 8,
      },
    ],
    scraps: [
      {
        id: "welcome-stain",
        kind: "tea-stain",
        x: 8,
        y: 6,
        scale: 0.55,
        rotation: -10,
      },
    ],
  },
  clovermeadow: {
    subject: "Welcome to Clovermeadow",
    body: `Dear friend,

The flowers began blooming a little earlier today.

We suspect they heard someone new was arriving.

Welcome to **Clovermeadow**, where every cottage keeps a kettle warm, every path leads to a friendly hello, and every letter has the chance to brighten someone's day.

Here, kindness is planted one small act at a time.

A compliment tucked into an envelope.
A thoughtful question.
A gentle reminder that someone, somewhere, is thinking of you.

Beside your doorstep, we've left a woven basket.

Inside you'll discover:

* A packet of wildflower seeds.
* A ribbon for tying your letters.
* Fresh honey from the village bees.
* And a tiny notebook for collecting moments that made you smile.

We hope you'll help our gardens grow—not only with flowers, but with the warmth your words bring to others.

Take your time.

There's no rush in a meadow.

Welcome home.

*May your letters bloom wherever they are read.*`,
    paperStyle: "floral",
    envelopeStyle: "blush",
    waxSeal: "heart",
    stampStyle: "dragonfly",
    stickers: [
      {
        id: "welcome-sunflower",
        kind: "sunflower",
        x: 93,
        y: 7,
        scale: 0.7,
        rotation: 14,
      },
      {
        id: "welcome-butterfly",
        kind: "butterfly-green",
        x: 7,
        y: 8,
        scale: 0.62,
        rotation: -16,
      },
      {
        id: "welcome-honey",
        kind: "honey-jar",
        x: 91,
        y: 90,
        scale: 0.65,
        rotation: -8,
      },
      {
        id: "welcome-narcissus",
        kind: "narcissus",
        x: 94,
        y: 96,
        scale: 0.55,
        rotation: 10,
      },
    ],
    scraps: [
      {
        id: "welcome-stain",
        kind: "tea-stain",
        x: 8,
        y: 94,
        scale: 0.5,
        rotation: 12,
      },
    ],
  },
};

export function isSystemUsername(username: string) {
  return Object.values(SYSTEM_SENDERS).some(
    (s) => s && s.username.toLowerCase() === username.toLowerCase()
  );
}

export function ensureVillageSystemUser(
  db: Database.Database,
  villageId: VillageId
) {
  const sender = SYSTEM_SENDERS[villageId];
  if (!sender) return null;

  const existing = db
    .prepare(`SELECT id FROM users WHERE id = ?`)
    .get(sender.id) as { id: string } | undefined;
  if (existing) return sender.id;

  db.prepare(
    `INSERT INTO users (
      id, username, display_name, email, password_hash, bio, forest_name,
      is_owner, village_id, reputation, collectibles_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, '{}')`
  ).run(
    sender.id,
    sender.username,
    sender.displayName,
    sender.email,
    hashSync(`system-locked-${sender.id}-${uuidv4()}`, 10),
    sender.bio,
    sender.forestName,
    villageId
  );

  return sender.id;
}

/** Keep welcome-letter decorations aligned with the current template. */
export function syncWelcomeLetterDecorations(db: Database.Database) {
  for (const [villageId, template] of Object.entries(WELCOME_TEMPLATES)) {
    if (!template) continue;
    const senderId = ensureVillageSystemUser(db, villageId as VillageId);
    if (!senderId) continue;
    db.prepare(
      `UPDATE letters
       SET stickers_json = ?, scrap_json = ?
       WHERE sender_id = ? AND subject = ?`
    ).run(
      JSON.stringify(template.stickers),
      JSON.stringify(template.scraps),
      senderId,
      template.subject
    );
  }
}

/** Idempotent: creates one unread welcome letter per villager per village. */
export function deliverWelcomeLetter(
  db: Database.Database,
  recipientId: string,
  villageId: string
): LetterView | null {
  if (!isVillageId(villageId)) return null;
  const template = WELCOME_TEMPLATES[villageId];
  const senderId = ensureVillageSystemUser(db, villageId);
  if (!template || !senderId) return null;

  syncWelcomeLetterDecorations(db);

  const existing = db
    .prepare(
      `SELECT * FROM letters
       WHERE recipient_id = ? AND sender_id = ? AND subject = ?
       LIMIT 1`
    )
    .get(recipientId, senderId, template.subject) as LetterRecord | undefined;

  if (existing) {
    return toLetterView(existing);
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO letters (
      id, sender_id, recipient_id, subject, body,
      paper_style, envelope_style, wax_seal, stamp_style,
      stickers_json, scrap_json, status, is_read, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', 0, datetime('now'))`
  ).run(
    id,
    senderId,
    recipientId,
    template.subject,
    template.body,
    template.paperStyle,
    template.envelopeStyle,
    template.waxSeal,
    template.stampStyle,
    JSON.stringify(template.stickers),
    JSON.stringify(template.scraps)
  );

  const row = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id) as
    | LetterRecord
    | undefined;
  return row ? toLetterView(row) : null;
}

export function getUnreadWelcomeLetter(
  db: Database.Database,
  recipientId: string,
  villageId: string | null | undefined
): LetterView | null {
  if (!villageId || !isVillageId(villageId)) return null;
  const sender = SYSTEM_SENDERS[villageId];
  const template = WELCOME_TEMPLATES[villageId];
  if (!sender || !template) return null;

  syncWelcomeLetterDecorations(db);

  const row = db
    .prepare(
      `SELECT * FROM letters
       WHERE recipient_id = ?
         AND sender_id = ?
         AND subject = ?
         AND is_read = 0
         AND status = 'sent'
       LIMIT 1`
    )
    .get(recipientId, sender.id, template.subject) as LetterRecord | undefined;

  return row ? toLetterView(row) : null;
}

export function markLetterRead(
  db: Database.Database,
  letterId: string,
  recipientId: string
) {
  const result = db
    .prepare(
      `UPDATE letters SET is_read = 1
       WHERE id = ? AND recipient_id = ? AND is_read = 0`
    )
    .run(letterId, recipientId);
  return result.changes > 0;
}
