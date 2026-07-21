"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { LetterPaper, PHOTO_SELECT_ID } from "@/components/LetterPaper";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { StickerArt, ScrapArt } from "@/components/stickers/StickerArt";
import type { UserPublic } from "@/lib/types";
import {
  ENVELOPE_OPTIONS,
  FONT_OPTIONS,
  PAPER_OPTIONS,
  SCRAP_OPTIONS,
  STAMP_OPTIONS,
  WAX_OPTIONS,
  sharedStickers,
  villagePackStickers,
  type EnvelopeStyle,
  type LetterFont,
  type PaperStyle,
  type PlacedImage,
  type PlacedScrap,
  type PlacedSticker,
  type ScrapKind,
  type StampStyle,
  type StickerKind,
  type WaxSeal,
} from "@/lib/types";
import { getVillage } from "@/lib/villages";

const VILLAGE_STATIONERY: Record<string, PaperStyle> = {
  hearthwick: "hearthwick",
  bramblewood: "bramblewood",
};

function defaultPaperForVillage(villageId: string | null | undefined): PaperStyle {
  return (villageId && VILLAGE_STATIONERY[villageId]) || "parchment";
}

function defaultFontForVillage(villageId: string | null | undefined): LetterFont {
  return villageId && VILLAGE_STATIONERY[villageId] ? "typewriter" : "quill";
}

function scatter(seed: number, index: number) {
  const n = seed * 17 + index * 41;
  return {
    x: 18 + (n % 64),
    y: 16 + ((n * 3) % 62),
    scale: 0.85 + ((n % 20) / 100),
    rotation: -16 + (n % 32),
  };
}

export function ComposeStudio({
  friends,
  villageId = null,
}: {
  friends: UserPublic[];
  villageId?: string | null;
}) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState(friends[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(
    defaultPaperForVillage(villageId)
  );
  const [fontStyle, setFontStyle] = useState<LetterFont>(
    defaultFontForVillage(villageId)
  );
  const [envelopeStyle, setEnvelopeStyle] = useState<EnvelopeStyle>("kraft");
  const [waxSeal, setWaxSeal] = useState<WaxSeal>("fern");
  const [stampStyle, setStampStyle] = useState<StampStyle>("mushroom-amanita");
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [scraps, setScraps] = useState<PlacedScrap[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "paper" | "font" | "envelope" | "stickers" | "scraps"
  >("paper");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<PlacedImage | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<"letter" | "envelope">("letter");

  const recipient = useMemo(
    () => friends.find((f) => f.id === recipientId),
    [friends, recipientId]
  );
  const forestStickers = useMemo(() => sharedStickers(), []);
  const villageStickers = useMemo(
    () => villagePackStickers(villageId),
    [villageId]
  );
  const village = getVillage(villageId);
  const villagePackName = village ? `${village.name} pack` : null;
  const villageStationery = villageId ? VILLAGE_STATIONERY[villageId] : undefined;
  const paperChoices = useMemo(() => {
    if (villageStationery) {
      return PAPER_OPTIONS.filter((p) => p.id === villageStationery);
    }
    return PAPER_OPTIONS.filter((p) => !VILLAGE_STATIONERY[p.id]);
  }, [villageStationery]);
  const composeThemeClass =
    villageId === "hearthwick"
      ? "compose-hearthwick"
      : villageId === "bramblewood"
        ? "compose-bramblewood"
        : "";

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
    type: "sticker" | "scrap" | "image"
  ) {
    const nx = Math.min(96, Math.max(4, x));
    const ny = Math.min(96, Math.max(4, y));
    if (type === "image") {
      setImage((current) => (current ? { ...current, x: nx, y: ny } : current));
      return;
    }
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
    if (selectedId === PHOTO_SELECT_ID) {
      setImage(null);
      setSelectedId(null);
      return;
    }
    setStickers((s) => s.filter((i) => i.id !== selectedId));
    setScraps((s) => s.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function nudgeSelected(field: "rotation" | "scale", delta: number) {
    if (!selectedId) return;
    if (selectedId === PHOTO_SELECT_ID) {
      setImage((current) =>
        current
          ? {
              ...current,
              [field]:
                field === "scale"
                  ? Math.min(2.5, Math.max(0.35, current.scale + delta))
                  : current.rotation + delta,
            }
          : current
      );
      return;
    }
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

  async function onPickImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Could not upload image");
      return;
    }
    setImage({
      url: data.url,
      x: 50,
      y: 58,
      scale: 1,
      rotation: -1,
    });
    setSelectedId(PHOTO_SELECT_ID);
    setPreview("letter");
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
        fontStyle,
        envelopeStyle,
        waxSeal,
        stampStyle,
        stickers,
        scraps,
        image,
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
    <div className={`compose-studio ${composeThemeClass}`}>
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
                ["font", "Font"],
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
            <div className="palette-stack">
              {villageStationery === "hearthwick" ? (
                <p className="compose-hint">
                  You&apos;re writing on Hearthwick&apos;s cottage stationery —
                  lined parchment with a meadow hedgehog in the corner.
                </p>
              ) : villageStationery === "bramblewood" ? (
                <p className="compose-hint">
                  You&apos;re writing on Bramblewood&apos;s trail stationery —
                  cream paper framed with peach blossoms and a fox on mossy stones.
                </p>
              ) : null}
              <div className="option-grid">
                {paperChoices.map((opt) => (
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
              <h3>Photo keepsake</h3>
              <label className="photo-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <span>
                  {uploading
                    ? "Tucking the photo in…"
                    : image
                      ? "Replace photo"
                      : "Upload an image"}
                </span>
              </label>
              {image ? (
                <p className="compose-hint">
                  Drag the photo on the letter. Use the corner handle or +/− to
                  resize.
                </p>
              ) : (
                <p className="compose-hint">JPG, PNG, WebP, or GIF · under 4MB</p>
              )}
            </div>
          )}

          {tab === "font" && (
            <div className="palette-stack">
              <p className="compose-hint">
                Choose how your words look on the page — typewriter, handwriting,
                or a whimsical print.
              </p>
              <div className="option-grid font-option-grid">
                {FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`option-chip font-swatch font-${opt.id} ${fontStyle === opt.id ? "active" : ""}`}
                    onClick={() => {
                      setFontStyle(opt.id);
                      setPreview("letter");
                    }}
                  >
                    <strong>{opt.name}</strong>
                    <span>{opt.hint}</span>
                    <em className="font-sample">{opt.sample}</em>
                  </button>
                ))}
              </div>
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
            <div className="sticker-panel">
              {villageStickers.length > 0 && (
                <div className="village-sticker-pack">
                  <h3>
                    {villagePackName || "Village pack"}
                    <span className="pack-lock">Only for your village</span>
                  </h3>
                  <div className="sticker-grid">
                    {villageStickers.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="sticker-btn village-sticker-btn"
                        onClick={() => addSticker(opt.id)}
                        title={opt.name}
                      >
                        <StickerArt kind={opt.id} className="w-12 h-12" />
                        <span>{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <h3>Forest stickers</h3>
              <div className="sticker-grid">
                {forestStickers.map((opt) => (
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
              <p>
                {selectedId === PHOTO_SELECT_ID
                  ? "Selected photo"
                  : "Selected decoration"}
              </p>
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
              fontStyle={fontStyle}
              body={body}
              subject={subject}
              stickers={stickers}
              scraps={scraps}
              image={image}
              editable
              onBodyChange={setBody}
              onSubjectChange={setSubject}
              onRemoveImage={() => {
                setImage(null);
                setSelectedId(null);
              }}
              onImageChange={setImage}
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
            {villageStationery === "hearthwick"
              ? "Type on the lined parchment — the hedgehog keeps the corner warm. Drag stickers and photos if you like, then seal when ready."
              : villageStationery === "bramblewood"
                ? "Write inside the floral frame — the fox keeps watch from the stones. Drag stickers and photos if you like, then seal when ready."
                : "Drag stickers, scraps, and photos across the page. Use the gold corner on a photo to resize. Seal when your letter feels complete."}
          </p>
        </section>
      </div>
    </div>
  );
}
