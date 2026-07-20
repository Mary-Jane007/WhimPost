"use client";

import { StickerArt, ScrapArt } from "@/components/stickers/StickerArt";
import type {
  PaperStyle,
  PlacedScrap,
  PlacedSticker,
} from "@/lib/types";

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
  editable = false,
  onBodyChange,
  onSubjectChange,
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
  editable?: boolean;
  onBodyChange?: (v: string) => void;
  onSubjectChange?: (v: string) => void;
  selectedId?: string | null;
  onSelectItem?: (id: string | null) => void;
  onMoveItem?: (id: string, x: number, y: number, type: "sticker" | "scrap") => void;
  className?: string;
}) {
  const handlePointerDown = (
    e: React.PointerEvent,
    id: string,
    type: "sticker" | "scrap"
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
        <div className="letter-body-display">{body}</div>
      )}

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
    </div>
  );
}
