import { StickerArt } from "@/components/stickers/StickerArt";
import type { StickerKind } from "@/lib/types";

export function PageCrest({ kinds }: { kinds: StickerKind[] }) {
  return (
    <div className="page-crest" aria-hidden>
      {kinds.map((kind) => (
        <StickerArt key={kind} kind={kind} className="w-11 h-11" />
      ))}
    </div>
  );
}
