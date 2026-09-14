import type { VillageId } from "@/lib/villages";

export type CharacterGender = "male" | "female";

export type CharacterSpeciesId = string;

export type VillagerCharacter = {
  villageId: VillageId;
  speciesId: CharacterSpeciesId;
  gender: CharacterGender;
  appearanceId: string;
  outfitId: string;
  accessoryIds: string[];
};

export type CharacterSpecies = {
  id: CharacterSpeciesId;
  name: string;
  emoji: string;
  blurb: string;
  appearances: Array<{ id: string; label: string }>;
  outfits: Array<{ id: string; label: string }>;
  accessories: Array<{ id: string; label: string; emoji: string }>;
};

export type VillageCharacterPool = {
  villageId: VillageId;
  label: string;
  emoji: string;
  theme: string;
  frameClass: string;
  species: CharacterSpecies[];
};

const sharedAppearances = [
  { id: "natural", label: "Natural" },
  { id: "warm", label: "Warm" },
  { id: "soft", label: "Soft" },
  { id: "dusk", label: "Dusk" },
];

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
        appearances: sharedAppearances,
        outfits: [
          { id: "explorer", label: "Explorer jacket" },
          { id: "hiking", label: "Hiking kit" },
          { id: "camp", label: "Campfire kit" },
        ],
        accessories: [
          { id: "scarf", label: "Trail scarf", emoji: "🧣" },
          { id: "pack", label: "Backpack", emoji: "🎒" },
          { id: "binoculars", label: "Binoculars", emoji: "🔭" },
          { id: "map", label: "Trail map", emoji: "🗺️" },
        ],
      },
      {
        id: "deer",
        name: "Deer",
        emoji: "🦌",
        blurb: "Gentle and sure-footed — notices every fern and footpath.",
        appearances: sharedAppearances,
        outfits: [
          { id: "explorer", label: "Forest vest" },
          { id: "hiking", label: "Trail clothes" },
          { id: "camp", label: "Camp woolens" },
        ],
        accessories: [
          { id: "scarf", label: "Moss scarf", emoji: "🧣" },
          { id: "pack", label: "Satchel", emoji: "🎒" },
          { id: "lantern", label: "Lantern", emoji: "🏮" },
          { id: "compass", label: "Compass", emoji: "🧭" },
        ],
      },
      {
        id: "raccoon",
        name: "Raccoon",
        emoji: "🦝",
        blurb: "A clever gatherer of odd treasures and woodland stories.",
        appearances: sharedAppearances,
        outfits: [
          { id: "explorer", label: "Utility coat" },
          { id: "hiking", label: "Trail overalls" },
          { id: "camp", label: "Camp hoodie" },
        ],
        accessories: [
          { id: "hat", label: "Explorer cap", emoji: "🧢" },
          { id: "pack", label: "Forage bag", emoji: "🎒" },
          { id: "tools", label: "Tool belt", emoji: "🛠️" },
          { id: "map", label: "Sketch map", emoji: "🗺️" },
        ],
      },
      {
        id: "owl",
        name: "Forest Owl",
        emoji: "🦉",
        blurb: "Quietly watches the canopy and remembers every trail.",
        appearances: sharedAppearances,
        outfits: [
          { id: "explorer", label: "Ranger cloak" },
          { id: "hiking", label: "Soft field coat" },
          { id: "camp", label: "Nest sweater" },
        ],
        accessories: [
          { id: "scarf", label: "Feather scarf", emoji: "🪶" },
          { id: "lantern", label: "Night lantern", emoji: "🏮" },
          { id: "binoculars", label: "Spyglass", emoji: "🔭" },
          { id: "notebook", label: "Field notes", emoji: "📓" },
        ],
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
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Garden apron" },
          { id: "meadow", label: "Meadow tunic" },
          { id: "flower", label: "Flower outfit" },
        ],
        accessories: [
          { id: "crown", label: "Flower crown", emoji: "🌸" },
          { id: "basket", label: "Garden basket", emoji: "🧺" },
          { id: "can", label: "Watering can", emoji: "💧" },
          { id: "seeds", label: "Seed packet", emoji: "🌱" },
        ],
      },
      {
        id: "butterfly",
        name: "Butterfly",
        emoji: "🦋",
        blurb: "Drifts from bloom to bloom with soft curiosity.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Petal apron" },
          { id: "meadow", label: "Meadow dress" },
          { id: "flower", label: "Garden sash" },
        ],
        accessories: [
          { id: "crown", label: "Daisy crown", emoji: "🌼" },
          { id: "basket", label: "Flower basket", emoji: "🧺" },
          { id: "gloves", label: "Garden gloves", emoji: "🧤" },
          { id: "pin", label: "Butterfly pin", emoji: "🦋" },
        ],
      },
      {
        id: "rabbit",
        name: "Rabbit",
        emoji: "🐰",
        blurb: "A gentle gardener who knows every clover patch by heart.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Gardening apron" },
          { id: "meadow", label: "Soft meadow clothes" },
          { id: "flower", label: "Picnic outfit" },
        ],
        accessories: [
          { id: "crown", label: "Clover crown", emoji: "🍀" },
          { id: "basket", label: "Harvest basket", emoji: "🧺" },
          { id: "boots", label: "Tiny boots", emoji: "🥾" },
          { id: "bag", label: "Botanical bag", emoji: "👜" },
        ],
      },
      {
        id: "hummingbird",
        name: "Hummingbird",
        emoji: "🐦",
        blurb: "Quick, bright, and forever finding the sweetest flowers.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Nectar apron" },
          { id: "meadow", label: "Sky tunic" },
          { id: "flower", label: "Blossom wrap" },
        ],
        accessories: [
          { id: "crown", label: "Wildflower crown", emoji: "🌺" },
          { id: "can", label: "Tiny can", emoji: "💧" },
          { id: "pin", label: "Bloom pin", emoji: "🌷" },
          { id: "bag", label: "Pollen pouch", emoji: "👝" },
        ],
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
        appearances: sharedAppearances,
        outfits: [
          { id: "scholar", label: "Scholar coat" },
          { id: "librarian", label: "Librarian cardigan" },
          { id: "investigator", label: "Archive vest" },
        ],
        accessories: [
          { id: "glasses", label: "Spectacles", emoji: "👓" },
          { id: "satchel", label: "Book satchel", emoji: "🎒" },
          { id: "pen", label: "Fountain pen", emoji: "🖋️" },
          { id: "lantern", label: "Desk lantern", emoji: "🏮" },
        ],
      },
      {
        id: "fox",
        name: "Archive Fox",
        emoji: "🦊",
        blurb: "Clever with clues, footnotes, and forgotten letters.",
        appearances: sharedAppearances,
        outfits: [
          { id: "scholar", label: "Waistcoat" },
          { id: "librarian", label: "Reading sweater" },
          { id: "investigator", label: "Detective coat" },
        ],
        accessories: [
          { id: "glasses", label: "Reading glasses", emoji: "👓" },
          { id: "notebook", label: "Notebook", emoji: "📓" },
          { id: "key", label: "Old key", emoji: "🗝️" },
          { id: "glass", label: "Magnifier", emoji: "🔎" },
        ],
      },
      {
        id: "raven",
        name: "Raven",
        emoji: "🐦‍⬛",
        blurb: "Keeps watch over ink, history, and half-told mysteries.",
        appearances: sharedAppearances,
        outfits: [
          { id: "scholar", label: "Ink cloak" },
          { id: "librarian", label: "Archive robe" },
          { id: "investigator", label: "Night coat" },
        ],
        accessories: [
          { id: "bookmark", label: "Bookmark", emoji: "📑" },
          { id: "satchel", label: "Scroll bag", emoji: "🎒" },
          { id: "pen", label: "Quill", emoji: "🪶" },
          { id: "lantern", label: "Study lamp", emoji: "🪔" },
        ],
      },
      {
        id: "mouse",
        name: "Field Mouse",
        emoji: "🐭",
        blurb: "A tiny archivist with enormous curiosity.",
        appearances: sharedAppearances,
        outfits: [
          { id: "scholar", label: "Tiny waistcoat" },
          { id: "librarian", label: "Soft cardigan" },
          { id: "investigator", label: "Pocket coat" },
        ],
        accessories: [
          { id: "glasses", label: "Tiny spectacles", emoji: "👓" },
          { id: "notebook", label: "Field journal", emoji: "📔" },
          { id: "key", label: "Drawer key", emoji: "🔑" },
          { id: "bookmark", label: "Pressed leaf", emoji: "🍃" },
        ],
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
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Baking apron" },
          { id: "knit", label: "Knitted sweater" },
          { id: "cozy", label: "Fireside clothes" },
        ],
        accessories: [
          { id: "scarf", label: "Handmade scarf", emoji: "🧣" },
          { id: "mug", label: "Tea mug", emoji: "☕" },
          { id: "pin", label: "Oven mitt pin", emoji: "🥧" },
          { id: "bag", label: "Craft bag", emoji: "🧵" },
        ],
      },
      {
        id: "bear",
        name: "Bear",
        emoji: "🐻",
        blurb: "A gentle host who keeps the kettle warm for friends.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Kitchen apron" },
          { id: "knit", label: "Honey sweater" },
          { id: "cozy", label: "Cabin flannel" },
        ],
        accessories: [
          { id: "scarf", label: "Wool scarf", emoji: "🧣" },
          { id: "mug", label: "Honey mug", emoji: "🍯" },
          { id: "blanket", label: "Little blanket", emoji: "🧺" },
          { id: "pin", label: "Baker badge", emoji: "🍪" },
        ],
      },
      {
        id: "cat",
        name: "Cat",
        emoji: "🐱",
        blurb: "Soft paws, crafty hands, and a love of sunny windowsills.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Craft apron" },
          { id: "knit", label: "Cable sweater" },
          { id: "cozy", label: "Slipper outfit" },
        ],
        accessories: [
          { id: "scarf", label: "Knit scarf", emoji: "🧣" },
          { id: "mug", label: "Cocoa cup", emoji: "☕" },
          { id: "yarn", label: "Yarn ball", emoji: "🧶" },
          { id: "pin", label: "Heart pin", emoji: "🩷" },
        ],
      },
      {
        id: "rabbit",
        name: "Rabbit",
        emoji: "🐇",
        blurb: "Brings baked goods, kind notes, and cozy company.",
        appearances: sharedAppearances,
        outfits: [
          { id: "apron", label: "Flour apron" },
          { id: "knit", label: "Soft jumper" },
          { id: "cozy", label: "Tea-time clothes" },
        ],
        accessories: [
          { id: "crown", label: "Flower pin", emoji: "🌷" },
          { id: "mug", label: "Teacup", emoji: "🍵" },
          { id: "bag", label: "Baking tote", emoji: "👜" },
          { id: "socks", label: "Cozy socks", emoji: "🧦" },
        ],
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
        appearances: sharedAppearances,
        outfits: [
          { id: "stargazer", label: "Stargazer cloak" },
          { id: "night", label: "Night explorer" },
          { id: "lakeside", label: "Lakeside wrap" },
        ],
        accessories: [
          { id: "pendant", label: "Moon pendant", emoji: "🌙" },
          { id: "lantern", label: "Moon lantern", emoji: "🏮" },
          { id: "map", label: "Star map", emoji: "✨" },
          { id: "shell", label: "Sea glass", emoji: "🫧" },
        ],
      },
      {
        id: "owl",
        name: "Night Owl",
        emoji: "🦉",
        blurb: "Keeps company with constellations and still water.",
        appearances: sharedAppearances,
        outfits: [
          { id: "stargazer", label: "Constellation coat" },
          { id: "night", label: "Night ranger" },
          { id: "lakeside", label: "Dock sweater" },
        ],
        accessories: [
          { id: "telescope", label: "Tiny telescope", emoji: "🔭" },
          { id: "scarf", label: "Star scarf", emoji: "🌌" },
          { id: "lantern", label: "Shore lantern", emoji: "🪔" },
          { id: "map", label: "Sky chart", emoji: "🗺️" },
        ],
      },
      {
        id: "fox",
        name: "Night Fox",
        emoji: "🦊",
        blurb: "Pads along moonlit shores collecting quiet discoveries.",
        appearances: sharedAppearances,
        outfits: [
          { id: "stargazer", label: "Midnight coat" },
          { id: "night", label: "Explorer cloak" },
          { id: "lakeside", label: "Shore outfit" },
        ],
        accessories: [
          { id: "pendant", label: "Star charm", emoji: "⭐" },
          { id: "satchel", label: "Night satchel", emoji: "🎒" },
          { id: "shell", label: "Shell find", emoji: "🐚" },
          { id: "lantern", label: "Glow lamp", emoji: "🕯️" },
        ],
      },
      {
        id: "turtle",
        name: "Shore Turtle",
        emoji: "🐢",
        blurb: "Slow, steady, and full of lakeside patience.",
        appearances: sharedAppearances,
        outfits: [
          { id: "stargazer", label: "Moon vest" },
          { id: "night", label: "Tide coat" },
          { id: "lakeside", label: "Shell shawl" },
        ],
        accessories: [
          { id: "shell", label: "Favorite shell", emoji: "🐚" },
          { id: "scarf", label: "Mist scarf", emoji: "🌫️" },
          { id: "bag", label: "Tide pouch", emoji: "👝" },
          { id: "pendant", label: "Water charm", emoji: "💧" },
        ],
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

export function getCharacterSpecies(
  villageId: VillageId,
  speciesId: string
): CharacterSpecies | null {
  return (
    getVillageCharacterPool(villageId).species.find((s) => s.id === speciesId) ||
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
    appearanceId: species.appearances[0]?.id || "natural",
    outfitId: species.outfits[0]?.id || "explorer",
    accessoryIds: [],
  };
}

export function parseVillagerCharacter(
  raw: string | null | undefined,
  fallbackVillageId?: VillageId | null
): VillagerCharacter | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<VillagerCharacter>;
    if (!data.villageId || !data.speciesId || !data.gender) return null;
    if (!(data.villageId in VILLAGE_CHARACTER_POOLS)) return null;
    const species = getCharacterSpecies(data.villageId, data.speciesId);
    if (!species) return null;
    if (data.gender !== "male" && data.gender !== "female") return null;
    return {
      villageId: data.villageId,
      speciesId: data.speciesId,
      gender: data.gender,
      appearanceId: data.appearanceId || species.appearances[0]?.id || "natural",
      outfitId: data.outfitId || species.outfits[0]?.id || "default",
      accessoryIds: Array.isArray(data.accessoryIds)
        ? data.accessoryIds.filter((id) =>
            species.accessories.some((a) => a.id === id)
          ).slice(0, 3)
        : [],
    };
  } catch {
    return fallbackVillageId
      ? defaultCharacterForVillage(fallbackVillageId)
      : null;
  }
}

export function serializeVillagerCharacter(character: VillagerCharacter) {
  return JSON.stringify(character);
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

/** Validate + normalize character payload from client (register / customize). */
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
  const gender = data.gender === "male" || data.gender === "female" ? data.gender : null;
  if (!gender) return null;
  const appearanceId = species.appearances.some((a) => a.id === data.appearanceId)
    ? String(data.appearanceId)
    : species.appearances[0]?.id || "natural";
  const outfitId = species.outfits.some((o) => o.id === data.outfitId)
    ? String(data.outfitId)
    : species.outfits[0]?.id || "default";
  const accessoryIds = Array.isArray(data.accessoryIds)
    ? data.accessoryIds
        .map(String)
        .filter((id) => species.accessories.some((a) => a.id === id))
        .slice(0, 3)
    : [];
  return {
    villageId,
    speciesId,
    gender,
    appearanceId,
    outfitId,
    accessoryIds,
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
