import type { VillageId } from "@/lib/villages";

export type CharacterGender = "male" | "female";

export type CharacterSpeciesId = string;

/** Fixed village resident — species + gender only (no outfit customization). */
export type VillagerCharacter = {
  villageId: VillageId;
  speciesId: CharacterSpeciesId;
  gender: CharacterGender;
};

export type CharacterSpecies = {
  id: CharacterSpeciesId;
  name: string;
  emoji: string;
  blurb: string;
};

export type VillageCharacterPool = {
  villageId: VillageId;
  label: string;
  emoji: string;
  theme: string;
  frameClass: string;
  species: CharacterSpecies[];
};

export const VILLAGE_CHARACTER_POOLS: Record<VillageId, VillageCharacterPool> = {
  bramblewood: {
    villageId: "bramblewood",
    label: "Bramblewood",
    emoji: "🌲",
    theme: "Forest · Adventure · Nature",
    frameClass: "char-frame-bramblewood",
    species: [
      {
        id: "fox",
        name: "Fox",
        emoji: "🦊",
        blurb: "Curious, clever, and always ready for the next woodland path.",
      },
      {
        id: "deer",
        name: "Deer",
        emoji: "🦌",
        blurb: "Gentle and sure-footed — notices every fern and footpath.",
      },
      {
        id: "raccoon",
        name: "Raccoon",
        emoji: "🦝",
        blurb: "A clever gatherer of odd treasures and woodland stories.",
      },
      {
        id: "owl",
        name: "Forest Owl",
        emoji: "🦉",
        blurb: "Quietly watches the canopy and remembers every trail.",
      },
    ],
  },
  clovermeadow: {
    villageId: "clovermeadow",
    label: "Clovermeadow",
    emoji: "🌼",
    theme: "Gardens · Flowers · Nature",
    frameClass: "char-frame-clovermeadow",
    species: [
      {
        id: "bee",
        name: "Bee",
        emoji: "🐝",
        blurb: "Busy with blossoms, pollen, and sunny little errands.",
      },
      {
        id: "butterfly",
        name: "Butterfly",
        emoji: "🦋",
        blurb: "Drifts from bloom to bloom with soft curiosity.",
      },
      {
        id: "rabbit",
        name: "Rabbit",
        emoji: "🐰",
        blurb: "A gentle gardener who knows every clover patch by heart.",
      },
      {
        id: "hummingbird",
        name: "Hummingbird",
        emoji: "🐦",
        blurb: "Quick, bright, and forever finding the sweetest flowers.",
      },
    ],
  },
  mosshollow: {
    villageId: "mosshollow",
    label: "Mosshollow",
    emoji: "📚",
    theme: "Books · Mystery · Knowledge",
    frameClass: "char-frame-mosshollow",
    species: [
      {
        id: "owl",
        name: "Owl",
        emoji: "🦉",
        blurb: "A quiet scholar of shelves, secrets, and soft lamplight.",
      },
      {
        id: "fox",
        name: "Archive Fox",
        emoji: "🦊",
        blurb: "Clever with clues, footnotes, and forgotten letters.",
      },
      {
        id: "raven",
        name: "Raven",
        emoji: "🐦‍⬛",
        blurb: "Keeps watch over ink, history, and half-told mysteries.",
      },
      {
        id: "mouse",
        name: "Field Mouse",
        emoji: "🐭",
        blurb: "A tiny archivist with enormous curiosity.",
      },
    ],
  },
  hearthwick: {
    villageId: "hearthwick",
    label: "Hearthwick",
    emoji: "🧡",
    theme: "Home · Baking · Crafts",
    frameClass: "char-frame-hearthwick",
    species: [
      {
        id: "hedgehog",
        name: "Hedgehog",
        emoji: "🦔",
        blurb: "Warm-hearted, flour-dusted, and always ready for tea.",
      },
      {
        id: "bear",
        name: "Bear",
        emoji: "🐻",
        blurb: "A gentle host who keeps the kettle warm for friends.",
      },
      {
        id: "cat",
        name: "Cat",
        emoji: "🐱",
        blurb: "Soft paws, crafty hands, and a love of sunny windowsills.",
      },
      {
        id: "rabbit",
        name: "Rabbit",
        emoji: "🐇",
        blurb: "Brings baked goods, kind notes, and cozy company.",
      },
    ],
  },
  moonmere: {
    villageId: "moonmere",
    label: "Moonmere",
    emoji: "🌙",
    theme: "Night · Water · Stars",
    frameClass: "char-frame-moonmere",
    species: [
      {
        id: "luna-moth",
        name: "Luna Moth",
        emoji: "🦋",
        blurb: "Soft wings, starlight errands, and quiet lakeside wonder.",
      },
      {
        id: "bat",
        name: "Night Bat",
        emoji: "🦇",
        blurb: "Glides over still water with stars tucked in its wings.",
      },
      {
        id: "fox",
        name: "Night Fox",
        emoji: "🦊",
        blurb: "Pads along moonlit shores collecting quiet discoveries.",
      },
      {
        id: "turtle",
        name: "Shore Turtle",
        emoji: "🐢",
        blurb: "Slow, steady, and full of lakeside patience.",
      },
    ],
  },
};

export function getVillageCharacterPool(villageId: VillageId | null | undefined) {
  if (villageId && villageId in VILLAGE_CHARACTER_POOLS) {
    return VILLAGE_CHARACTER_POOLS[villageId];
  }
  return VILLAGE_CHARACTER_POOLS.bramblewood;
}

/** Map retired Moonmere owl picks to the Night Bat species. */
export function resolveCharacterSpeciesId(
  villageId: VillageId,
  speciesId: string
): string {
  if (villageId === "moonmere" && speciesId === "owl") return "bat";
  return speciesId;
}

export function getCharacterSpecies(
  villageId: VillageId,
  speciesId: string
): CharacterSpecies | null {
  const resolved = resolveCharacterSpeciesId(villageId, speciesId);
  return (
    getVillageCharacterPool(villageId).species.find((s) => s.id === resolved) ||
    null
  );
}

export function defaultCharacterForVillage(
  villageId: VillageId
): VillagerCharacter {
  const pool = getVillageCharacterPool(villageId);
  const species = pool.species[0];
  return {
    villageId,
    speciesId: species.id,
    gender: "female",
  };
}

export function parseVillagerCharacter(
  raw: string | null | undefined,
  fallbackVillageId?: VillageId | null
): VillagerCharacter | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<VillagerCharacter> & {
      appearanceId?: string;
      outfitId?: string;
      accessoryIds?: string[];
    };
    if (!data.villageId || !data.speciesId || !data.gender) return null;
    if (!(data.villageId in VILLAGE_CHARACTER_POOLS)) return null;
    const species = getCharacterSpecies(data.villageId, data.speciesId);
    if (!species) return null;
    if (data.gender !== "male" && data.gender !== "female") return null;
    return {
      villageId: data.villageId,
      speciesId: species.id,
      gender: data.gender,
    };
  } catch {
    return fallbackVillageId
      ? defaultCharacterForVillage(fallbackVillageId)
      : null;
  }
}

export function serializeVillagerCharacter(character: VillagerCharacter) {
  return JSON.stringify({
    villageId: character.villageId,
    speciesId: character.speciesId,
    gender: character.gender,
  });
}

export function characterPortraitSrc(character: VillagerCharacter) {
  return `/characters/${character.villageId}/${character.speciesId}-${character.gender}.png`;
}

/** Illustrated SVG fallback used when a painted PNG is not yet available. */
export function characterPortraitFallbackSrc(character: VillagerCharacter) {
  return `/characters/${character.villageId}/${character.speciesId}-${character.gender}.svg`;
}

export function characterLabel(character: VillagerCharacter) {
  const species = getCharacterSpecies(character.villageId, character.speciesId);
  const pool = getVillageCharacterPool(character.villageId);
  return {
    speciesName: species?.name || character.speciesId,
    emoji: species?.emoji || "✨",
    villageLabel: pool.label,
    villageEmoji: pool.emoji,
    genderLabel: character.gender === "female" ? "♀" : "♂",
    blurb: species?.blurb || "",
  };
}

export function isCompleteCharacter(
  character: VillagerCharacter | null | undefined
): character is VillagerCharacter {
  return Boolean(
    character &&
      character.villageId &&
      character.speciesId &&
      character.gender &&
      getCharacterSpecies(character.villageId, character.speciesId)
  );
}

/** Validate + normalize character payload from client (register / change). */
export function normalizeVillagerCharacter(
  raw: unknown,
  requiredVillageId?: VillageId | null
): VillagerCharacter | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<VillagerCharacter>;
  const villageId = (requiredVillageId || data.villageId) as VillageId | undefined;
  if (!villageId || !(villageId in VILLAGE_CHARACTER_POOLS)) return null;
  if (requiredVillageId && data.villageId && data.villageId !== requiredVillageId) {
    return null;
  }
  const speciesId = String(data.speciesId || "");
  const species = getCharacterSpecies(villageId, speciesId);
  if (!species) return null;
  const gender =
    data.gender === "male" || data.gender === "female" ? data.gender : null;
  if (!gender) return null;
  return {
    villageId,
    speciesId: species.id,
    gender,
  };
}

export function characterForUser(
  characterJson: string | null | undefined,
  villageId?: VillageId | null
): VillagerCharacter | null {
  return (
    parseVillagerCharacter(characterJson, villageId) ||
    (villageId ? defaultCharacterForVillage(villageId) : null)
  );
}
