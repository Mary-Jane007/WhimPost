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

export type WelcomeTemplate = {
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

export type WelcomeTemplateEdit = {
  villageId: VillageId;
  subject: string;
  body: string;
  isCustom: boolean;
  updatedAt: string | null;
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
    forestName: "The Observatory",
    bio: "Some answers only arrive after sunset.",
  },
  bramblewood: {
    id: "system-bramblewood",
    username: "bramblewood_fox",
    displayName: "Bramblewood",
    email: "system+bramblewood@whimpost.local",
    forestName: "Explorer's Guild",
    bio: "Where every path hides a story.",
  },
  hearthwick: {
    id: "system-hearthwick",
    username: "hearthwick_hedgehog",
    displayName: "Hearthwick",
    email: "system+hearthwick@whimpost.local",
    forestName: "The Hearth Hall",
    bio: "Where every stranger is welcomed home.",
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

* ![Mushrooms](/stickers/collectibles/forest/mushrooms.png) A soft woodland mushroom for your jar.
* ![Leaves](/stickers/collectibles/forest/leaves.png) A pressed oak leaf, the first of many.
* ![Feathers](/stickers/collectibles/forest/feathers.png) A feather from the library owl.
* ![Lost Pages](/stickers/collectibles/forest/lost-pages.png) A lost page, waiting to join your shelf of stories.

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

* ![Pink Butterflies](/stickers/collectibles/clovermeadow/clover-butterflies.png) A pink meadow butterfly for your jar.
* ![Pink Ribbons](/stickers/collectibles/clovermeadow/clover-ribbon.png) A soft ribbon for tying kindness into letters.
* ![Village Honey](/stickers/collectibles/clovermeadow/clover-honey.png) A spoon of village honey from the bees.
* ![Cherry Blossoms](/stickers/collectibles/clovermeadow/clover-blossoms.png) A handful of cherry blossoms to start your shelf.

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

* ![Night Lilies](/stickers/collectibles/moonmere/moon-lilies.png) Night lily petals from the lakeshore blooms.
* ![Mere Pearls](/stickers/collectibles/moonmere/moon-pearls.png) A mere pearl, smooth as the water's hush.
* ![Dock Lanterns](/stickers/collectibles/moonmere/moon-lanterns.png) A dock lantern that burns with a quiet light.
* ![Dream Notes](/stickers/collectibles/moonmere/moon-dreams.png) A dream note that asks only one question:

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
        kind: "moon-full-clouds",
        x: 92,
        y: 8,
        scale: 0.62,
        rotation: 8,
      },
      {
        id: "welcome-fairy",
        kind: "moon-fairy-blue",
        x: 8,
        y: 10,
        scale: 0.55,
        rotation: -10,
      },
      {
        id: "welcome-lantern",
        kind: "moon-lantern",
        x: 8,
        y: 88,
        scale: 0.55,
        rotation: -4,
      },
      {
        id: "welcome-seal",
        kind: "moon-seal-sun",
        x: 12,
        y: 48,
        scale: 0.48,
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
  bramblewood: {
    subject: "Welcome to Bramblewood",
    body: `**Greetings, explorer,**

We were beginning to wonder when you'd find us.

The foxes insisted you'd taken the longer trail.

The ravens claimed you were distracted by something interesting.

As usual, they were probably both right.

Welcome to **Bramblewood**, where every winding path hides a story, every forgotten ruin whispers a mystery, and every letter is the beginning of another adventure.

Before setting off, we've packed a travel satchel for you — the first pieces of your Bramblewood collection.

Inside you'll find:

* ![Fox Tails](/stickers/collectibles/bramblewood/bramble-fox-tails.png) A soft fox tail for luck on every trail.
* ![Maple Leaves](/stickers/collectibles/bramblewood/bramble-maple.png) A pressed maple leaf from the dens.
* ![Hello Fall Candles](/stickers/collectibles/bramblewood/bramble-candles.png) A Hello Fall candle to warm your satchel.
* ![Wonder Compasses](/stickers/collectibles/bramblewood/bramble-compasses.png) A compass that occasionally points toward wonder instead of north.

These are only the beginning. Write letters, welcome friends, and gather more keepsakes as you wander the trails. Your cottage will fill as your collection grows.

Should you stumble upon something extraordinary, write about it.

The village has always loved a good tale.

And remember—

The finest adventures are rarely planned.

Welcome to **Bramblewood**.

*May curiosity always know the way.*`,
    paperStyle: "parchment",
    envelopeStyle: "kraft",
    waxSeal: "spiral",
    stampStyle: "fox-seated",
    stickers: [
      {
        id: "welcome-fox",
        kind: "bramble-fox-sitting",
        x: 92,
        y: 8,
        scale: 0.68,
        rotation: 10,
      },
      {
        id: "welcome-maple",
        kind: "bramble-maple-leaf",
        x: 8,
        y: 10,
        scale: 0.58,
        rotation: -14,
      },
      {
        id: "welcome-compass",
        kind: "bramble-compass",
        x: 9,
        y: 88,
        scale: 0.55,
        rotation: -6,
      },
      {
        id: "welcome-mushroom",
        kind: "bramble-mushroom",
        x: 93,
        y: 92,
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
        scale: 0.5,
        rotation: -8,
      },
    ],
  },
  hearthwick: {
    subject: "Welcome to Hearthwick",
    body: `**Dear neighbor,**

The kettle has been waiting for you.

Not for long—just long enough to brew the perfect cup.

Welcome to **Hearthwick**, where windows glow warmly at dusk, fresh bread cools on every windowsill, and no one stays a stranger for very long.

You'll soon discover that letters here travel with more than words.

They carry recipes.
Stories.
Laughter.
Comfort.

Sometimes they simply arrive to remind someone they are not alone.

On your kitchen table, we've left a small welcome basket.

Inside you'll find:

* ![Hearth Muffins](/stickers/collectibles/hearthwick/hearth-muffins.png) A loaf of warm honey bread.
* ![Recipes](/stickers/collectibles/hearthwick/hearth-recipes.png) A sprig of lavender.
* ![Knit Blankets](/stickers/collectibles/hearthwick/hearth-blankets.png) A cozy blanket stitched by village hands.
* ![Fireside Notes](/stickers/collectibles/hearthwick/hearth-letters.png) And a bundle of handmade stationery, ready for the conversations waiting ahead.

When evening falls, you'll always find someone by the hearth with an empty chair beside them.

We hope you'll pull it a little closer to the fire.

Welcome to **Hearthwick**.

*May every letter you send feel like coming home.*`,
    paperStyle: "cream",
    envelopeStyle: "kraft",
    waxSeal: "heart",
    stampStyle: "mushroom-amanita",
    stickers: [
      {
        id: "welcome-pie",
        kind: "pie",
        x: 92,
        y: 8,
        scale: 0.62,
        rotation: 8,
      },
      {
        id: "welcome-candle",
        kind: "candle-jar",
        x: 8,
        y: 10,
        scale: 0.58,
        rotation: -12,
      },
      {
        id: "welcome-honey",
        kind: "honey-jar",
        x: 9,
        y: 88,
        scale: 0.55,
        rotation: -6,
      },
      {
        id: "welcome-jam",
        kind: "jam-jar",
        x: 93,
        y: 92,
        scale: 0.55,
        rotation: 10,
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

/** Default hardcoded welcome template (before owner edits). */
export function getDefaultWelcomeTemplate(
  villageId: VillageId
): WelcomeTemplate | null {
  return WELCOME_TEMPLATES[villageId] || null;
}

/** Effective welcome template: owner edit if present, else default. */
export function getEffectiveWelcomeTemplate(
  db: Database.Database,
  villageId: VillageId
): WelcomeTemplate | null {
  const defaults = getDefaultWelcomeTemplate(villageId);
  if (!defaults) return null;

  const row = db
    .prepare(
      `SELECT subject, body FROM welcome_letter_templates WHERE village_id = ?`
    )
    .get(villageId) as { subject: string; body: string } | undefined;

  if (!row) return defaults;
  return {
    ...defaults,
    subject: row.subject,
    body: row.body,
  };
}

export function getWelcomeTemplateEdit(
  db: Database.Database,
  villageId: VillageId
): WelcomeTemplateEdit | null {
  const defaults = getDefaultWelcomeTemplate(villageId);
  if (!defaults) return null;

  const row = db
    .prepare(
      `SELECT subject, body, updated_at
       FROM welcome_letter_templates WHERE village_id = ?`
    )
    .get(villageId) as
    | { subject: string; body: string; updated_at: string }
    | undefined;

  return {
    villageId,
    subject: row?.subject ?? defaults.subject,
    body: row?.body ?? defaults.body,
    isCustom: Boolean(row),
    updatedAt: row?.updated_at ?? null,
  };
}

export function upsertWelcomeTemplate(
  db: Database.Database,
  villageId: VillageId,
  subject: string,
  body: string,
  updatedBy: string | null
): WelcomeTemplateEdit | null {
  db.prepare(
    `INSERT INTO welcome_letter_templates (village_id, subject, body, updated_at, updated_by)
     VALUES (?, ?, ?, datetime('now'), ?)
     ON CONFLICT(village_id) DO UPDATE SET
       subject = excluded.subject,
       body = excluded.body,
       updated_at = datetime('now'),
       updated_by = excluded.updated_by`
  ).run(villageId, subject, body, updatedBy);

  syncWelcomeLetterDecorations(db, villageId);
  return getWelcomeTemplateEdit(db, villageId);
}

export function resetWelcomeTemplate(
  db: Database.Database,
  villageId: VillageId
): WelcomeTemplateEdit | null {
  db.prepare(`DELETE FROM welcome_letter_templates WHERE village_id = ?`).run(
    villageId
  );
  syncWelcomeLetterDecorations(db, villageId);
  return getWelcomeTemplateEdit(db, villageId);
}

/** Keep welcome letters aligned with the effective (possibly owner-edited) template. */
export function syncWelcomeLetterDecorations(
  db: Database.Database,
  onlyVillageId?: VillageId
) {
  const villageIds = onlyVillageId
    ? [onlyVillageId]
    : (Object.keys(WELCOME_TEMPLATES) as VillageId[]);

  for (const villageId of villageIds) {
    const template = getEffectiveWelcomeTemplate(db, villageId);
    if (!template) continue;
    const senderId = ensureVillageSystemUser(db, villageId);
    if (!senderId) continue;
    db.prepare(
      `UPDATE letters
       SET subject = ?, body = ?, stickers_json = ?, scrap_json = ?,
           paper_style = ?, envelope_style = ?, wax_seal = ?, stamp_style = ?,
           font_style = 'typewriter'
       WHERE sender_id = ?`
    ).run(
      template.subject,
      template.body,
      JSON.stringify(template.stickers),
      JSON.stringify(template.scraps),
      template.paperStyle,
      template.envelopeStyle,
      template.waxSeal,
      template.stampStyle,
      senderId
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
  bramblewood: [
    "bramble-fox-tails",
    "bramble-maple",
    "bramble-candles",
    "bramble-compasses",
  ],
  hearthwick: [
    "hearth-muffins",
    "hearth-recipes",
    "hearth-blankets",
    "hearth-letters",
  ],
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
  const template = getEffectiveWelcomeTemplate(db, villageId);
  const senderId = ensureVillageSystemUser(db, villageId);
  if (!template || !senderId) return null;

  syncWelcomeLetterDecorations(db, villageId);

  const existing = db
    .prepare(
      `SELECT * FROM letters
       WHERE recipient_id = ? AND sender_id = ?
       LIMIT 1`
    )
    .get(recipientId, senderId) as LetterRecord | undefined;

  if (existing) {
    // Backfill starter gifts for villagers who got the letter before gifts existed.
    grantWelcomeCollectionGifts(db, recipientId, villageId);
    return toLetterView(existing);
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO letters (
      id, sender_id, recipient_id, subject, body,
      paper_style, envelope_style, wax_seal, stamp_style, font_style,
      stickers_json, scrap_json, status, is_read, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'typewriter', ?, ?, 'sent', 0, datetime('now'))`
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
  const template = getEffectiveWelcomeTemplate(db, villageId);
  if (!sender || !template) return null;

  syncWelcomeLetterDecorations(db, villageId);

  const row = db
    .prepare(
      `SELECT * FROM letters
       WHERE recipient_id = ?
         AND sender_id = ?
         AND is_read = 0
         AND status = 'sent'
       LIMIT 1`
    )
    .get(recipientId, sender.id) as LetterRecord | undefined;

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
