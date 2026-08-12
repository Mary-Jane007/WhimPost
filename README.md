# WhimPost

A whimsical cottagecore letter-writing website. Create a mailbox, add friends, and send handmade-feeling letters with paper, envelopes, wax seals, stickers, and junk-journal scraps.

## Features

- **Accounts** — register, sign in, and keep a woodland mailbox
- **Friends** — search users, send/accept friend requests
- **Compose** — choose paper & envelopes, place stickers and quote scraps, pick wax seals and postage stamps
- **Inbox & Sent** — open envelopes with a soft reveal, read decorated letters

## Stack

- Next.js (App Router) + React + TypeScript
- SQLite via `better-sqlite3`
- Cookie sessions (JWT via `jose`)
- Framer Motion for letter-opening motion

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333).

Create two accounts in separate browsers (or normal + private), add each other as friends, then write a letter.

### Persisting TV Corner videos

Uploaded clips are kept durable in two places:

1. **Catalogs in git** — `data/persistent-tv.json` (optional link shelf) and `data/persistent-tv-media.json` (uploaded file metadata)
2. **Bytes on the `whimpost-media` GitHub Release** — so playable files restore on any server even when Git LFS quota is exhausted

On boot, WhimPost tries Git LFS, then downloads any missing / pointer-only uploads from that release into `data/uploads/`. After new uploads, catalogs are committed and playable files are published to the release automatically.

```bash
# Optional manual refresh from the local database:
npm run persist-tv
npm run persist-tv:push
```

Library EPUB files under `data/uploads/` are also restored from the same release (and small public-domain EPUBs are committed in git).

## Scripts

- `npm run dev` — development server (port 3333)
- `npm run build` — production build
- `npm start` — run production server
- `npm run lint` — ESLint
- `npm run persist-tv` — refresh TV catalogs from the local database

## Ownership

The first account that **registers or signs in** when no owner exists yet is remembered as the **site owner** (stored in SQLite as `users.is_owner`). Later accounts stay regular members.

## Persistent accounts

Local SQLite (`data/whimpost.db`) stays gitignored, but account rows (including password hashes, never plaintext) are mirrored to `data/persistent-accounts.json`, which **is** tracked in git. On startup, WhimPost restores those accounts into an empty or fresh database so the same logins work on any server that has the repo.