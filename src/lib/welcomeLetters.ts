import { hashSync } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type Database from "better-sqlite3";
import { toLetterView } from "@/lib/letters";
import type { LetterRecord, LetterView } from "@/lib/types";
import { grantCollectible } from "@/lib/villageProgress";
import {
  isVillageId,
  parseCollectibles,
  type CollectibleKind,
  type VillageId,
} from "@/lib/villages";

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
  moonmere: {
    id: "system-moonmere",
    username: "moonmere_moth",
    displayName: "Moonmere",
    email: "system+moonmere@whimpost.local",
    forestName: "The Moon Dock",
    bio: "Where dreams become letters.",
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

A small satchel has been prepared for you — the first pieces of your Mosshollow collection.

Inside you'll find:

* 🍄 A soft woodland mushroom for your jar.
* 🍃 A pressed oak leaf, the first of many.
* 🪶 A feather from the library owl.
* 📖 A lost page, waiting to join your shelf of stories.

These are only the beginning. Write letters, welcome friends, and gather more keepsakes as you wander the village. Your cottage will fill as your collection grows.

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

Beside your doorstep, we've left a woven basket — the first pieces of your Clovermeadow collection.

Inside you'll discover:

* 🦋 A pink meadow butterfly for your jar.
* 🎀 A soft ribbon for tying kindness into letters.
* 🍯 A spoon of village honey from the bees.
* 🌸 A handful of cherry blossoms to start your shelf.

These are only the beginning. Write letters, welcome friends, and gather more keepsakes as kindness grows. Your cottage will fill as your collection blooms.

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
  moonmere: {
    subject: "Welcome to Moonmere",
    body: `**To the traveler beneath the stars,**

Last night, the lake held an extra reflection.

Not of the moon.

Of you.

Welcome to **Moonmere**, where lanterns glow long after sunset and conversations linger like ripples across quiet water.

Some villagers write after midnight.
Some write after watching the rain.
Some simply wait until their heart has something gentle to say.

There is no wrong time to begin.

Waiting at your window is a silver lantern — the first pieces of your Moonmere collection.

Inside it you'll find:

* 🪷 Night lily petals from the lakeshore blooms.
* 🫧 A mere pearl, smooth as the water's hush.
* 🏮 A dock lantern that burns with a quiet light.
* 💭 A dream note that asks only one question:

*"What have you been dreaming about lately?"*

These are only the beginning. Write letters, welcome friends, and gather more keepsakes as starlight settles on the dock. Your cottage will fill as your collection grows.

You needn't have the answer today.

Moonmere has always believed that the best letters arrive when they're ready.

Until then, the lake will keep your secrets, and the stars will keep you company.

Welcome to **Moonmere**.

*May your words drift softly into waiting hearts.*`,
    paperStyle: "night",
    envelopeStyle: "ink",
    waxSeal: "moon",
    stampStyle: "moon-full",
    stickers: [
      {
        id: "welcome-moon-full",
        kind: "moon-full-engraving",
        x: 92,
        y: 8,
        scale: 0.62,
        rotation: 8,
      },
      {
        id: "welcome-luna-moth",
        kind: "moon-luna-moth",
        x: 8,
        y: 10,
        scale: 0.58,
        rotation: -14,
      },
      {
        id: "welcome-lantern",
        kind: "moon-lantern-star",
        x: 90,
        y: 88,
        scale: 0.6,
        rotation: -6,
      },
      {
        id: "welcome-quote",
        kind: "moon-quote",
        x: 10,
        y: 90,
        scale: 0.55,
        rotation: 6,
      },
    ],
    scraps: [
      {
        id: "welcome-stain",
        kind: "tea-stain",
        x: 8,
        y: 6,
        scale: 0.5,
        rotation: -8,
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

/** Keep welcome-letter body & decorations aligned with the current template. */
export function syncWelcomeLetterDecorations(db: Database.Database) {
  for (const [villageId, template] of Object.entries(WELCOME_TEMPLATES)) {
    if (!template) continue;
    const senderId = ensureVillageSystemUser(db, villageId as VillageId);
    if (!senderId) continue;
    db.prepare(
      `UPDATE letters
       SET body = ?, stickers_json = ?, scrap_json = ?
       WHERE sender_id = ? AND subject = ?`
    ).run(
      template.body,
      JSON.stringify(template.stickers),
      JSON.stringify(template.scraps),
      senderId,
      template.subject
    );
  }
}

/** Starter keepsakes mentioned in the welcome letter — a gentle collection boost. */
const WELCOME_COLLECTION_GIFTS: Partial<
  Record<VillageId, CollectibleKind[]>
> = {
  mosshollow: ["mushrooms", "leaves", "feathers", "lost-pages"],
  clovermeadow: [
    "clover-butterflies",
    "clover-ribbon",
    "clover-honey",
    "clover-blossoms",
  ],
  moonmere: ["moon-lilies", "moon-pearls", "moon-lanterns", "moon-dreams"],
};

function grantWelcomeCollectionGifts(
  db: Database.Database,
  recipientId: string,
  villageId: VillageId
) {
  const gifts = WELCOME_COLLECTION_GIFTS[villageId];
  if (!gifts?.length) return;

  const row = db
    .prepare(`SELECT collectibles_json FROM users WHERE id = ?`)
    .get(recipientId) as { collectibles_json: string } | undefined;
  if (!row) return;

  const bag = parseCollectibles(row.collectibles_json);
  // Already started this collection — don't double-gift.
  if (gifts.some((kind) => (bag[kind] || 0) > 0)) return;

  for (const kind of gifts) {
    grantCollectible(db, recipientId, kind, 1);
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
    // Backfill starter gifts for villagers who got the letter before gifts existed.
    grantWelcomeCollectionGifts(db, recipientId, villageId);
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

  grantWelcomeCollectionGifts(db, recipientId, villageId);

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
