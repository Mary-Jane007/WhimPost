"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { LetterPaper } from "@/components/LetterPaper";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { StickerArt, ScrapArt } from "@/components/stickers/StickerArt";
import type { UserPublic } from "@/lib/types";
import {
  ENVELOPE_OPTIONS,
  PAPER_OPTIONS,
  SCRAP_OPTIONS,
  STAMP_OPTIONS,
  STICKER_OPTIONS,
  WAX_OPTIONS,
  type EnvelopeStyle,
  type PaperStyle,
  type PlacedScrap,
  type PlacedSticker,
  type ScrapKind,
  type StampStyle,
  type StickerKind,
  type WaxSeal,
} from "@/lib/types";

function scatter(seed: number, index: number) {
  const n = seed * 17 + index * 41;
  return {
    x: 18 + (n % 64),
    y: 16 + ((n * 3) % 62),
    scale: 0.85 + ((n % 20) / 100),
    rotation: -16 + (n % 32),
  };
}

export function ComposeStudio({ friends }: { friends: UserPublic[] }) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState(friends[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [paperStyle, setPaperStyle] = useState<PaperStyle>("parchment");
  const [envelopeStyle, setEnvelopeStyle] = useState<EnvelopeStyle>("kraft");
  const [waxSeal, setWaxSeal] = useState<WaxSeal>("fern");
  const [stampStyle, setStampStyle] = useState<StampStyle>("mushroom");
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [scraps, setScraps] = useState<PlacedScrap[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"paper" | "envelope" | "stickers" | "scraps">(
    "paper"
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<"letter" | "envelope">("letter");

  const recipient = useMemo(
    () => friends.find((f) => f.id === recipientId),
    [friends, recipientId]
  );

  function addSticker(kind: StickerKind) {
    const place = scatter(stickers.length + 3, stickers.length);
    const item: PlacedSticker = {
      id: uuidv4(),
      kind,
      ...place,
    };
    setStickers((s) => [...s, item]);
    setSelectedId(item.id);
    setPreview("letter");
  }

  function addScrap(kind: ScrapKind) {
    const place = scatter(scraps.length + 11, scraps.length);
    const item: PlacedScrap = {
      id: uuidv4(),
      kind,
      ...place,
    };
    setScraps((s) => [...s, item]);
    setSelectedId(item.id);
    setPreview("letter");
  }

  function moveItem(
    id: string,
    x: number,
    y: number,
    type: "sticker" | "scrap"
  ) {
    const nx = Math.min(96, Math.max(4, x));
    const ny = Math.min(96, Math.max(4, y));
    if (type === "sticker") {
      setStickers((items) =>
        items.map((i) => (i.id === id ? { ...i, x: nx, y: ny } : i))
      );
    } else {
      setScraps((items) =>
        items.map((i) => (i.id === id ? { ...i, x: nx, y: ny } : i))
      );
    }
  }

  function removeSelected() {
    if (!selectedId) return;
    setStickers((s) => s.filter((i) => i.id !== selectedId));
    setScraps((s) => s.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function nudgeSelected(field: "rotation" | "scale", delta: number) {
    if (!selectedId) return;
    setStickers((items) =>
      items.map((i) =>
        i.id === selectedId
          ? {
              ...i,
              [field]:
                field === "scale"
                  ? Math.min(2, Math.max(0.4, i.scale + delta))
                  : i.rotation + delta,
            }
          : i
      )
    );
    setScraps((items) =>
      items.map((i) =>
        i.id === selectedId
          ? {
              ...i,
              [field]:
                field === "scale"
                  ? Math.min(2, Math.max(0.4, i.scale + delta))
                  : i.rotation + delta,
            }
          : i
      )
    );
  }

  async function sendLetter() {
    if (!recipientId) {
      setError("Add a friend before sending a letter");
      return;
    }
    setSending(true);
    setError("");
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        subject,
        body,
        paperStyle,
        envelopeStyle,
        waxSeal,
        stampStyle,
        stickers,
        scraps,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Could not send letter");
      return;
    }
    router.push(`/letter/${data.letter.id}`);
    router.refresh();
  }

  if (friends.length === 0) {
    return (
      <div className="empty-state">
        <h1>Your desk is ready</h1>
        <p>
          WhimPost letters travel between friends. Find a woodland writer first,
          then come back to compose.
        </p>
        <a href="/friends" className="btn-primary">
          Find friends
        </a>
      </div>
    );
  }

  return (
    <div className="compose-studio">
      <div className="compose-toolbar">
        <label className="recipient-pick">
          To
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName} (@{f.username})
              </option>
            ))}
          </select>
        </label>
        <div className="preview-toggle">
          <button
            type="button"
            className={preview === "letter" ? "active" : ""}
            onClick={() => setPreview("letter")}
          >
            Letter
          </button>
          <button
            type="button"
            className={preview === "envelope" ? "active" : ""}
            onClick={() => setPreview("envelope")}
          >
            Envelope
          </button>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={sendLetter}
          disabled={sending}
        >
          {sending ? "Sending…" : "Seal & send"}
        </button>
      </div>

      {error && <p className="form-error compose-error">{error}</p>}

      <div className="compose-layout">
        <aside className="compose-palette">
          <div className="palette-tabs">
            {(
              [
                ["paper", "Paper"],
                ["envelope", "Envelope"],
                ["stickers", "Stickers"],
                ["scraps", "Scraps"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "paper" && (
            <div className="option-grid">
              {PAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`option-chip paper-swatch paper-${opt.id} ${paperStyle === opt.id ? "active" : ""}`}
                  onClick={() => {
                    setPaperStyle(opt.id);
                    setPreview("letter");
                  }}
                >
                  <strong>{opt.name}</strong>
                  <span>{opt.hint}</span>
                </button>
              ))}
            </div>
          )}

          {tab === "envelope" && (
            <div className="palette-stack">
              <div className="option-grid">
                {ENVELOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`option-chip env-swatch env-${opt.id} ${envelopeStyle === opt.id ? "active" : ""}`}
                    onClick={() => {
                      setEnvelopeStyle(opt.id);
                      setPreview("envelope");
                    }}
                  >
                    <strong>{opt.name}</strong>
                    <span>{opt.hint}</span>
                  </button>
                ))}
              </div>
              <h3>Wax seal</h3>
              <div className="tiny-grid">
                {WAX_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`tiny-chip ${waxSeal === opt.id ? "active" : ""}`}
                    onClick={() => setWaxSeal(opt.id)}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
              <h3>Postage stamp</h3>
              <div className="tiny-grid">
                {STAMP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`tiny-chip ${stampStyle === opt.id ? "active" : ""}`}
                    onClick={() => setStampStyle(opt.id)}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "stickers" && (
            <div className="sticker-grid">
              {STICKER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="sticker-btn"
                  onClick={() => addSticker(opt.id)}
                  title={opt.name}
                >
                  <StickerArt kind={opt.id} className="w-12 h-12" />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === "scraps" && (
            <div className="scrap-grid">
              {SCRAP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="scrap-btn"
                  onClick={() => addScrap(opt.id)}
                >
                  <ScrapArt kind={opt.id} />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedId && (
            <div className="selection-tools">
              <p>Selected decoration</p>
              <div className="tool-row">
                <button type="button" onClick={() => nudgeSelected("rotation", -8)}>
                  ↺
                </button>
                <button type="button" onClick={() => nudgeSelected("rotation", 8)}>
                  ↻
                </button>
                <button type="button" onClick={() => nudgeSelected("scale", -0.1)}>
                  −
                </button>
                <button type="button" onClick={() => nudgeSelected("scale", 0.1)}>
                  +
                </button>
                <button type="button" className="danger" onClick={removeSelected}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </aside>

        <section className="compose-stage">
          {preview === "letter" ? (
            <LetterPaper
              paperStyle={paperStyle}
              body={body}
              subject={subject}
              stickers={stickers}
              scraps={scraps}
              editable
              onBodyChange={setBody}
              onSubjectChange={setSubject}
              selectedId={selectedId}
              onSelectItem={setSelectedId}
              onMoveItem={moveItem}
            />
          ) : (
            <EnvelopeFace
              style={envelopeStyle}
              toName={recipient?.displayName || "Friend"}
              fromName="You"
              stampStyle={stampStyle}
              waxSeal={waxSeal}
            />
          )}
          <p className="compose-hint">
            Drag stickers and scraps across the page. Seal when your letter feels
            complete.
          </p>
        </section>
      </div>
    </div>
  );
}
