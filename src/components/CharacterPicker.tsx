"use client";

import { useMemo } from "react";
import { CharacterPortrait } from "@/components/CharacterPortrait";
import {
  defaultCharacterForVillage,
  getCharacterSpecies,
  getVillageCharacterPool,
  type CharacterGender,
  type VillagerCharacter,
} from "@/lib/villageCharacters";
import type { VillageId } from "@/lib/villages";
import { getVillage } from "@/lib/villages";

export function CharacterPicker({
  villageId,
  value,
  onChange,
  mode = "full",
  heading = "Choose your character",
}: {
  villageId: VillageId;
  value: VillagerCharacter | null;
  onChange: (next: VillagerCharacter) => void;
  mode?: "full" | "compact";
  heading?: string;
}) {
  const pool = getVillageCharacterPool(villageId);
  const village = getVillage(villageId);
  const character =
    value?.villageId === villageId ? value : defaultCharacterForVillage(villageId);

  const cards = useMemo(() => {
    const list: Array<{ key: string; draft: VillagerCharacter }> = [];
    for (const s of pool.species) {
      for (const gender of ["female", "male"] as CharacterGender[]) {
        list.push({
          key: `${s.id}-${gender}`,
          draft: { villageId, speciesId: s.id, gender },
        });
      }
    }
    return list;
  }, [pool.species, villageId]);

  return (
    <div className={`char-picker char-picker-${mode} ${pool.frameClass}`}>
      <header className="char-picker-head">
        <p className="belonging-kicker">Your resident</p>
        <h2>{heading}</h2>
        <p className="char-picker-lead">
          Pick a storybook neighbor for{" "}
          <strong>
            {village?.mascot || pool.emoji} {village?.name || pool.label}
          </strong>
          . Each character has a fixed look — choose species and male or female.
          This becomes your face on letters and your cottage profile.
        </p>
      </header>

      {character ? (
        <div className="char-picker-selected" aria-live="polite">
          <CharacterPortrait character={character} size="lg" showLabel />
          <p className="char-picker-selected-copy">
            Selected:{" "}
            <strong>
              {getCharacterSpecies(character.villageId, character.speciesId)?.name}{" "}
              ({character.gender === "female" ? "female" : "male"})
            </strong>
          </p>
        </div>
      ) : null}

      <div className="char-card-grid" role="list">
        {cards.map(({ key, draft }) => {
          const s = getCharacterSpecies(villageId, draft.speciesId)!;
          const selected =
            character.speciesId === draft.speciesId &&
            character.gender === draft.gender;
          return (
            <button
              key={key}
              type="button"
              role="listitem"
              className={`char-card ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(draft)}
              aria-pressed={selected}
            >
              <CharacterPortrait character={draft} size="md" decorative />
              <div className="char-card-copy">
                <strong>
                  {s.emoji} {s.name}{" "}
                  <span aria-hidden>
                    {draft.gender === "female" ? "♀" : "♂"}
                  </span>
                </strong>
                <em>{draft.gender === "female" ? "Female" : "Male"}</em>
                <p>{s.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
