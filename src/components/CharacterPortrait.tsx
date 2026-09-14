"use client";

import { useState } from "react";
import {
  characterLabel,
  characterPortraitFallbackSrc,
  characterPortraitSrc,
  getVillageCharacterPool,
  type VillagerCharacter,
} from "@/lib/villageCharacters";

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
  const pool = getVillageCharacterPool(character.villageId);
  const src = useFallbackSrc
    ? characterPortraitFallbackSrc(character)
    : characterPortraitSrc(character);

  return (
    <figure
      className={`char-portrait char-portrait-${size} ${pool.frameClass} ${className}`.trim()}
      data-village={character.villageId}
      data-gender={character.gender}
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
            draggable={false}
            onError={() => {
              if (!useFallbackSrc) setUseFallbackSrc(true);
              else setImgFailed(true);
            }}
          />
        ) : (
          <div className="char-portrait-fallback">
            <span className="char-portrait-emoji" aria-hidden>
              {label.emoji}
            </span>
          </div>
        )}
        <span className="char-portrait-gender" aria-hidden>
          {label.genderLabel}
        </span>
      </div>
      {showLabel ? (
        <figcaption className="char-portrait-caption">
          <strong>{label.speciesName}</strong>
          <em>{label.villageLabel}</em>
        </figcaption>
      ) : null}
    </figure>
  );
}
