import { StickerArt } from "@/components/stickers/StickerArt";
import type { StickerKind } from "@/lib/types";
import {
  cloverStickerSrc,
  moonmereStickerSrc,
  type CloverStickerId,
  type MoonmereStickerId,
} from "@/lib/villageThemes";

export function PageCrest({
  kinds,
  villageStickers,
}: {
  kinds: StickerKind[];
  villageStickers?: Array<
    | { village: "clovermeadow"; id: CloverStickerId }
    | { village: "moonmere"; id: MoonmereStickerId }
    | CloverStickerId
  >;
}) {
  return (
    <div className="page-crest" aria-hidden>
      {villageStickers
        ? villageStickers.map((entry) => {
            const src =
              typeof entry === "string"
                ? cloverStickerSrc(entry)
                : entry.village === "moonmere"
                  ? moonmereStickerSrc(entry.id)
                  : cloverStickerSrc(entry.id);
            const key = typeof entry === "string" ? entry : entry.id;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={src}
                alt=""
                className="sticker-img w-11 h-11"
                draggable={false}
              />
            );
          })
        : kinds.map((kind) => (
            <StickerArt key={kind} kind={kind} className="w-11 h-11" />
          ))}
    </div>
  );
}
