"use client";

import { useState } from "react";
import {
  characterLabel,
  characterPortraitFallbackSrc,
  characterPortraitSrc,
  getCharacterSpecies,
  getVillageCharacterPool,
  type VillagerCharacter,
} from "@/lib/villageCharacters";

const APPEARANCE_TINT: Record<string, string> = {
  natural: "1",
  warm: "1.08",
  soft: "0.92",
  dusk: "0.85",
};

type Size = "sm" | "md" | "lg" | "hero";

export function CharacterPortrait({
  character,
  size = "md",
  className = "",
  showLabel = false,
  decorative = false,
}: {
  character: VillagerCharacter;
  size?: Size;
  className?: string;
  showLabel?: boolean;
  decorative?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);
  const label = characterLabel(character);
  const species = getCharacterSpecies(character.villageId, character.speciesId);
  const pool = getVillageCharacterPool(character.villageId);
  const src = useFallbackSrc
    ? characterPortraitFallbackSrc(character)
    : characterPortraitSrc(character);
  const tint = APPEARANCE_TINT[character.appearanceId] || "1";
  const outfit =
    species?.outfits.find((o) => o.id === character.outfitId)?.label || "";
  const accessories =
    species?.accessories.filter((a) => character.accessoryIds.includes(a.id)) ||
    [];

  return (
    <figure
      className={`char-portrait char-portrait-${size} ${pool.frameClass} ${className}`.trim()}
      data-village={character.villageId}
      data-gender={character.gender}
      data-appearance={character.appearanceId}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : `${label.speciesName} (${character.gender}), ${label.villageLabel}`
      }
    >
      <div className="char-portrait-frame">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="char-portrait-img"
            style={{ filter: `saturate(${tint})` }}
            draggable={false}
            onError={() => {
              if (!useFallbackSrc) setUseFallbackSrc(true);
              else setImgFailed(true);
            }}
          />
        ) : (
          <div className="char-portrait-fallback" style={{ filter: `saturate(${tint})` }}>
            <span className="char-portrait-emoji" aria-hidden>
              {label.emoji}
            </span>
            <span className="char-portrait-outfit" aria-hidden>
              {outfit}
            </span>
            {accessories.length > 0 ? (
              <span className="char-portrait-acc" aria-hidden>
                {accessories.map((a) => a.emoji).join(" ")}
              </span>
            ) : null}
          </div>
        )}
        <span className="char-portrait-gender" aria-hidden>
          {label.genderLabel}
        </span>
      </div>
      {showLabel ? (
        <figcaption className="char-portrait-caption">
          <strong>
            {label.emoji} {label.speciesName}
          </strong>
          <em>
            {label.villageEmoji} {label.villageLabel}
          </em>
        </figcaption>
      ) : null}
    </figure>
  );
}
