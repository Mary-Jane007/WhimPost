"use client";

import { useMemo, useState } from "react";
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
  const character = value?.villageId === villageId ? value : defaultCharacterForVillage(villageId);
  const species = getCharacterSpecies(character.villageId, character.speciesId);
  const [phase, setPhase] = useState<"pick" | "customize">(
    value ? "customize" : "pick"
  );

  const cards = useMemo(() => {
    const list: Array<{
      key: string;
      draft: VillagerCharacter;
    }> = [];
    for (const s of pool.species) {
      for (const gender of ["female", "male"] as CharacterGender[]) {
        list.push({
          key: `${s.id}-${gender}`,
          draft: {
            villageId,
            speciesId: s.id,
            gender,
            appearanceId: s.appearances[0]?.id || "natural",
            outfitId: s.outfits[0]?.id || "default",
            accessoryIds: [],
          },
        });
      }
    }
    return list;
  }, [pool.species, villageId]);

  function selectCard(draft: VillagerCharacter) {
    onChange({
      ...draft,
      appearanceId: character.speciesId === draft.speciesId ? character.appearanceId : draft.appearanceId,
      outfitId: character.speciesId === draft.speciesId ? character.outfitId : draft.outfitId,
      accessoryIds:
        character.speciesId === draft.speciesId ? character.accessoryIds : [],
    });
    setPhase("customize");
  }

  function patch(partial: Partial<VillagerCharacter>) {
    onChange({ ...character, ...partial, villageId });
  }

  function toggleAccessory(id: string) {
    const has = character.accessoryIds.includes(id);
    const next = has
      ? character.accessoryIds.filter((x) => x !== id)
      : [...character.accessoryIds, id].slice(0, 3);
    patch({ accessoryIds: next });
  }

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
          . This becomes your face on letters and your cottage profile — not a
          generic avatar.
        </p>
      </header>

      <div className="char-picker-phases" role="tablist" aria-label="Character steps">
        <button
          type="button"
          role="tab"
          aria-selected={phase === "pick"}
          className={phase === "pick" ? "is-active" : ""}
          onClick={() => setPhase("pick")}
        >
          1. Species
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={phase === "customize"}
          className={phase === "customize" ? "is-active" : ""}
          onClick={() => setPhase("customize")}
        >
          2. Customize
        </button>
      </div>

      {phase === "pick" ? (
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
                onClick={() => selectCard(draft)}
                aria-pressed={selected}
              >
                <CharacterPortrait character={draft} size="md" decorative />
                <div className="char-card-copy">
                  <strong>
                    {s.emoji} {s.name}{" "}
                    <span aria-hidden>{draft.gender === "female" ? "♀" : "♂"}</span>
                  </strong>
                  <em>{draft.gender === "female" ? "Female" : "Male"}</em>
                  <p>{s.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="char-customize">
          <div className="char-customize-preview">
            <CharacterPortrait character={character} size="hero" showLabel />
            {species ? <p className="char-customize-blurb">{species.blurb}</p> : null}
          </div>

          <div className="char-customize-controls">
            {species ? (
              <>
                <fieldset>
                  <legend>Appearance</legend>
                  <div className="char-swatches">
                    {species.appearances.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`char-swatch appearance-${a.id} ${
                          character.appearanceId === a.id ? "is-selected" : ""
                        }`}
                        onClick={() => patch({ appearanceId: a.id })}
                        aria-pressed={character.appearanceId === a.id}
                        title={a.label}
                      >
                        <span className="sr-only">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Outfit</legend>
                  <div className="char-chip-row">
                    {species.outfits.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`char-chip ${
                          character.outfitId === o.id ? "is-selected" : ""
                        }`}
                        onClick={() => patch({ outfitId: o.id })}
                        aria-pressed={character.outfitId === o.id}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Accessories <span>(up to 3)</span></legend>
                  <div className="char-acc-grid">
                    {species.accessories.map((a) => {
                      const on = character.accessoryIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={`char-acc ${on ? "is-selected" : ""}`}
                          onClick={() => toggleAccessory(a.id)}
                          aria-pressed={on}
                        >
                          <span aria-hidden>{a.emoji}</span>
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <button
                  type="button"
                  className="btn-secondary char-back-species"
                  onClick={() => setPhase("pick")}
                >
                  ← Choose a different species
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
