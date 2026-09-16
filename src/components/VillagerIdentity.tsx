import Link from "next/link";
import { CharacterPortrait } from "@/components/CharacterPortrait";
import {
  characterLabel,
  parseVillagerCharacter,
  type VillagerCharacter,
} from "@/lib/villageCharacters";
import type { VillageId } from "@/lib/villages";
import { getVillage } from "@/lib/villages";

export function VillagerIdentity({
  displayName,
  username,
  characterJson,
  villageId,
  title,
  href,
  size = "sm",
  layout = "row",
}: {
  displayName: string;
  username?: string;
  characterJson?: string | null;
  villageId?: string | null;
  title?: string | null;
  href?: string | null;
  size?: "sm" | "md";
  layout?: "row" | "stack" | "letter";
}) {
  const vid = (villageId || undefined) as VillageId | undefined;
  const character: VillagerCharacter | null = parseVillagerCharacter(
    characterJson,
    vid || null
  );
  const village = getVillage(vid);
  const label = character ? characterLabel(character) : null;
  const villageEmoji = village?.mascot || label?.villageEmoji || "🏡";
  const villageLabel = village?.name || label?.villageLabel || "Village";

  const body = (
    <span className={`villager-id villager-id-${layout} villager-id-${size}`}>
      {character ? (
        <CharacterPortrait character={character} size={size} decorative />
      ) : (
        <span className="villager-id-fallback" aria-hidden>
          {villageEmoji}
        </span>
      )}
      <span className="villager-id-copy">
        <strong className="villager-id-name">{displayName}</strong>
        <span className="villager-id-meta">
          {villageLabel}
          {title ? ` · ${title}` : ""}
          {username ? ` · @${username}` : ""}
        </span>
        {layout === "letter" && label ? (
          <em className="villager-id-blurb">{label.speciesName}</em>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="villager-id-link user-link">
        {body}
      </Link>
    );
  }
  return body;
}
