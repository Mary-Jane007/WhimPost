"use client";

import { LetterBodyText } from "@/components/LetterBodyText";
import { StickerArt, ScrapArt } from "@/components/stickers/StickerArt";
import type {
  PaperStyle,
  PlacedImage,
  PlacedScrap,
  PlacedSticker,
} from "@/lib/types";

export const PHOTO_SELECT_ID = "__letter_photo__";

const paperClass: Record<PaperStyle, string> = {
  parchment: "paper-parchment",
  cream: "paper-cream",
  moss: "paper-moss",
  lined: "paper-lined",
  floral: "paper-floral",
  night: "paper-night",
};

export function LetterPaper({
  paperStyle,
  body,
  subject,
  stickers,
  scraps,
  image = null,
  mascot = null,
  editable = false,
  onBodyChange,
  onSubjectChange,
  onRemoveImage,
  onImageChange,
  selectedId,
  onSelectItem,
  onMoveItem,
  className = "",
}: {
  paperStyle: PaperStyle;
  body: string;
  subject: string;
  stickers: PlacedSticker[];
  scraps: PlacedScrap[];
  image?: PlacedImage | null;
  mascot?: {
    emoji: string;
    name: string;
    image?: string;
  } | null;
  editable?: boolean;
  onBodyChange?: (v: string) => void;
  onSubjectChange?: (v: string) => void;
  onRemoveImage?: () => void;
  onImageChange?: (image: PlacedImage) => void;
  selectedId?: string | null;
  onSelectItem?: (id: string | null) => void;
  onMoveItem?: (
    id: string,
    x: number,
    y: number,
    type: "sticker" | "scrap" | "image"
  ) => void;
  className?: string;
}) {
  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    type: "sticker" | "scrap" | "image"
  ) => {
    if (!editable || !onMoveItem) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(id);
    const parent = (e.currentTarget.parentElement as HTMLElement) || null;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      onMoveItem(id, x, y, type);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (!editable || !image || !onImageChange) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectItem?.(PHOTO_SELECT_ID);
    const startX = e.clientX;
    const startScale = image.scale;

    const move = (ev: PointerEvent) => {
      const delta = (ev.clientX - startX) / 120;
      const next = Math.min(2.5, Math.max(0.35, startScale + delta));
      onImageChange({ ...image, scale: next });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className={`letter-paper ${paperClass[paperStyle]} ${className}`}
      onClick={() => onSelectItem?.(null)}
    >
      {editable ? (
        <input
          className="letter-subject-input"
          value={subject}
          onChange={(e) => onSubjectChange?.(e.target.value)}
          placeholder="A quiet title for this letter…"
          maxLength={120}
        />
      ) : subject ? (
        <h2 className="letter-subject-display">{subject}</h2>
      ) : null}

      {editable ? (
        <textarea
          className="letter-body-input"
          value={body}
          onChange={(e) => onBodyChange?.(e.target.value)}
          placeholder={`Dearest friend,\n\nThe moss is soft today and I thought of you…`}
          maxLength={8000}
        />
      ) : (
        <LetterBodyText body={body} />
      )}

      {image ? (
        <div
          className={`placed-item letter-photo-item ${selectedId === PHOTO_SELECT_ID ? "selected" : ""}`}
          style={{
            left: `${image.x}%`,
            top: `${image.y}%`,
            transform: `translate(-50%, -50%) rotate(${image.rotation}deg) scale(${image.scale})`,
          }}
          onPointerDown={(e) => handlePointerDown(e, PHOTO_SELECT_ID, "image")}
        >
          <figure className="letter-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="Attached to this letter" draggable={false} />
            {editable ? (
              <span
                className="photo-resize-handle"
                onPointerDown={handleResizePointerDown}
                title="Drag to resize"
              />
            ) : null}
          </figure>
          {editable && onRemoveImage && selectedId === PHOTO_SELECT_ID ? (
            <button
              type="button"
              className="letter-photo-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage();
              }}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      ) : null}

      {scraps.map((scrap) => (
        <div
          key={scrap.id}
          className={`placed-item ${selectedId === scrap.id ? "selected" : ""}`}
          style={{
            left: `${scrap.x}%`,
            top: `${scrap.y}%`,
            transform: `translate(-50%, -50%) rotate(${scrap.rotation}deg) scale(${scrap.scale})`,
          }}
          onPointerDown={(e) => handlePointerDown(e, scrap.id, "scrap")}
        >
          <ScrapArt kind={scrap.kind} />
        </div>
      ))}

      {stickers.map((sticker) => (
        <div
          key={sticker.id}
          className={`placed-item sticker-item ${selectedId === sticker.id ? "selected" : ""}`}
          style={{
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
          }}
          onPointerDown={(e) => handlePointerDown(e, sticker.id, "sticker")}
        >
          <StickerArt kind={sticker.kind} className="w-14 h-14" />
        </div>
      ))}

      {mascot ? (
        <div className="letter-mascot" title={mascot.name}>
          {mascot.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mascot.image} alt={mascot.name} draggable={false} />
          ) : (
            <span className="letter-mascot-emoji" aria-hidden>
              {mascot.emoji}
            </span>
          )}
          <em>{mascot.name}</em>
        </div>
      ) : null}
    </div>
  );
}
