import { StickerArt } from "@/components/stickers/StickerArt";
import type { StickerKind } from "@/lib/types";
import {
  cloverStickerSrc,
  type CloverStickerId,
} from "@/lib/villageThemes";

export function PageCrest({
  kinds,
  villageStickers,
}: {
  kinds: StickerKind[];
  villageStickers?: CloverStickerId[];
}) {
  return (
    <div className="page-crest" aria-hidden>
      {villageStickers
        ? villageStickers.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              src={cloverStickerSrc(id)}
              alt=""
              className="sticker-img w-11 h-11"
              draggable={false}
            />
          ))
        : kinds.map((kind) => (
            <StickerArt key={kind} kind={kind} className="w-11 h-11" />
          ))}
    </div>
  );
}
