import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { VILLAGE_SYSTEM_SENDER_IDS, isVillageId } from "@/lib/villages";

/** Git-tracked welcome letters so first-visit mail survives fresh servers. */
export const PERSISTENT_WELCOME_LETTERS_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-welcome-letters.json"
);

export type PersistentWelcomeLetter = {
  id: string;
  villageId: string;
  recipientId: string;
  senderId: string;
  subject: string;
  body: string;
  paperStyle: string;
  envelopeStyle: string;
  waxSeal: string;
  stampStyle: string;
  fontStyle: string;
  stickersJson: string;
  scrapJson: string;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
};

type PersistentWelcomeLettersFile = {
  version: 1;
  updatedAt: string;
  letters: PersistentWelcomeLetter[];
};

const SYSTEM_SENDER_IDS = new Set(
  Object.values(VILLAGE_SYSTEM_SENDER_IDS).filter(Boolean) as string[]
);

function readFile(): PersistentWelcomeLettersFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_WELCOME_LETTERS_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_WELCOME_LETTERS_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentWelcomeLettersFile;
    if (!parsed || !Array.isArray(parsed.letters)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(letters: PersistentWelcomeLetter[]) {
  const dir = path.dirname(PERSISTENT_WELCOME_LETTERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentWelcomeLettersFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    letters: letters.sort((a, b) => {
      const byRecipient = a.recipientId.localeCompare(b.recipientId);
      if (byRecipient !== 0) return byRecipient;
      return a.villageId.localeCompare(b.villageId);
    }),
  };

  const tmp = `${PERSISTENT_WELCOME_LETTERS_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_WELCOME_LETTERS_PATH);
}

function villageIdForSender(senderId: string): string | null {
  for (const [villageId, id] of Object.entries(VILLAGE_SYSTEM_SENDER_IDS)) {
    if (id === senderId) return villageId;
  }
  return null;
}

/** Snapshot every village welcome letter currently in SQLite. */
export function exportPersistentWelcomeLetters(db: Database) {
  const senderIds = [...SYSTEM_SENDER_IDS];
  if (senderIds.length === 0) {
    writeFile([]);
    return;
  }

  const placeholders = senderIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, sender_id, recipient_id, subject, body,
              paper_style, envelope_style, wax_seal, stamp_style, font_style,
              stickers_json, scrap_json, is_read, sent_at, created_at
       FROM letters
       WHERE sender_id IN (${placeholders})
         AND status = 'sent'`
    )
    .all(...senderIds) as Array<{
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string;
    body: string;
    paper_style: string;
    envelope_style: string;
    wax_seal: string;
    stamp_style: string;
    font_style: string;
    stickers_json: string;
    scrap_json: string;
    is_read: number;
    sent_at: string | null;
    created_at: string;
  }>;

  const letters: PersistentWelcomeLetter[] = [];
  for (const row of rows) {
    const villageId = villageIdForSender(row.sender_id);
    if (!villageId || !isVillageId(villageId)) continue;
    letters.push({
      id: row.id,
      villageId,
      recipientId: row.recipient_id,
      senderId: row.sender_id,
      subject: row.subject,
      body: row.body,
      paperStyle: row.paper_style,
      envelopeStyle: row.envelope_style,
      waxSeal: row.wax_seal,
      stampStyle: row.stamp_style,
      fontStyle: row.font_style || "typewriter",
      stickersJson: row.stickers_json || "[]",
      scrapJson: row.scrap_json || "[]",
      isRead: Boolean(row.is_read),
      sentAt: row.sent_at,
      createdAt: row.created_at,
    });
  }

  writeFile(letters);
}

/**
 * Restore welcome letters into SQLite and mark each recipient as having
 * visited that village so the modal never reappears after a reset.
 */
export function importPersistentWelcomeLetters(db: Database) {
  const file = readFile();
  if (!file || file.letters.length === 0) return;

  const userExists = db.prepare(`SELECT id FROM users WHERE id = ?`);
  const existingLetter = db.prepare(
    `SELECT id, is_read FROM letters
     WHERE recipient_id = ? AND sender_id = ?
     LIMIT 1`
  );
  const insert = db.prepare(
    `INSERT INTO letters (
      id, sender_id, recipient_id, subject, body,
      paper_style, envelope_style, wax_seal, stamp_style, font_style,
      stickers_json, scrap_json, status, is_read, sent_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)`
  );
  const updateRead = db.prepare(
    `UPDATE letters SET is_read = ? WHERE id = ? AND recipient_id = ?`
  );

  const sync = db.transaction((letters: PersistentWelcomeLetter[]) => {
    for (const letter of letters) {
      if (!letter.id || !letter.recipientId || !letter.senderId) continue;
      if (!userExists.get(letter.recipientId)) continue;
      if (!userExists.get(letter.senderId)) continue;

      const found = existingLetter.get(letter.recipientId, letter.senderId) as
        | { id: string; is_read: number }
        | undefined;

      if (found) {
        // Never un-read a letter the villager already opened.
        if (letter.isRead && !found.is_read) {
          updateRead.run(1, found.id, letter.recipientId);
        }
      } else {
        insert.run(
          letter.id,
          letter.senderId,
          letter.recipientId,
          letter.subject || "",
          letter.body || "",
          letter.paperStyle || "parchment",
          letter.envelopeStyle || "kraft",
          letter.waxSeal || "fern",
          letter.stampStyle || "mushroom-amanita",
          letter.fontStyle || "typewriter",
          letter.stickersJson || "[]",
          letter.scrapJson || "[]",
          letter.isRead ? 1 : 0,
          letter.sentAt || letter.createdAt || null,
          letter.createdAt || new Date().toISOString()
        );
      }
    }
  });

  sync(file.letters);
}
