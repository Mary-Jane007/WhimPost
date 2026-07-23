import type { VillageId } from "@/lib/villages";

/** Activity keys that village hubs report for chronicle unlocks. */
export type ChronicleActivityKey =
  | "garden.completeDaily"
  | "garden.spotFlower"
  | "garden.completeKindness"
  | "library.finishBook"
  | "library.solveMystery"
  | "library.claimSecret"
  | "library.journalEntry"
  | "hearth.completeRitual"
  | "hearth.leaveNote"
  | "hearth.toggleRecipeFavorite"
  | "moon.completeRitual"
  | "moon.saveJournal"
  | "moon.submitDream"
  | "workshop.complete"
  | "workshop.journalEntry"
  | "workshop.bird";

export const CHRONICLE_ACTIVITY_LABELS: Record<ChronicleActivityKey, string> = {
  "garden.completeDaily": "Complete a Bloom Task",
  "garden.spotFlower": "Spot a wild flower / visitor",
  "garden.completeKindness": "Complete a kindness mission",
  "library.finishBook": "Finish a book",
  "library.solveMystery": "Solve a mystery",
  "library.claimSecret": "Uncover a library secret",
  "library.journalEntry": "Write in the library journal",
  "hearth.completeRitual": "Complete a fireside ritual",
  "hearth.leaveNote": "Leave a Fireside Note",
  "hearth.toggleRecipeFavorite": "Save a cozy recipe",
  "moon.completeRitual": "Complete a night ritual",
  "moon.saveJournal": "Save a Moon Journal entry",
  "moon.submitDream": "Bottle a dream",
  "workshop.complete": "Complete a workshop activity",
  "workshop.journalEntry": "Write in the workshop journal",
  "workshop.bird": "Spot a bird",
};

export type ChroniclePageNumber = 1 | 2 | 3 | 4;

export type ChroniclePageContent = {
  villageId: VillageId;
  pageNumber: ChroniclePageNumber;
  title: string;
  body: string;
  illustrationUrl: string;
  unlockKey: ChronicleActivityKey;
  unlockCount: number;
  published: boolean;
};

export type ChronicleMeta = {
  villageId: VillageId;
  name: string;
  keeperTitle: string;
  emoji: string;
  accent: string;
  cover: string;
  coverDeep: string;
  spine: string;
  foil: string;
  motif: string;
};

export const CHRONICLE_META: Record<VillageId, ChronicleMeta> = {
  clovermeadow: {
    villageId: "clovermeadow",
    name: "Clovermeadow Chronicle",
    keeperTitle: "Keeper of Clovermeadow",
    emoji: "🌼",
    accent: "#d4849a",
    cover: "#8f4f63",
    coverDeep: "#5c2f3f",
    spine: "#3d1f2a",
    foil: "#f0d4a8",
    motif: "clovers & soft blooms",
  },
  mosshollow: {
    villageId: "mosshollow",
    name: "Mosshollow Chronicle",
    keeperTitle: "Keeper of Mosshollow",
    emoji: "📚",
    accent: "#5a7a4a",
    cover: "#3f5a38",
    coverDeep: "#243522",
    spine: "#162016",
    foil: "#d8c48a",
    motif: "oak leaves & owl feathers",
  },
  hearthwick: {
    villageId: "hearthwick",
    name: "Hearthwick Chronicle",
    keeperTitle: "Keeper of Hearthwick",
    emoji: "❤️",
    accent: "#c4784a",
    cover: "#8a4a2e",
    coverDeep: "#5a2e1c",
    spine: "#3a1c10",
    foil: "#f0c878",
    motif: "embers & warm copper",
  },
  moonmere: {
    villageId: "moonmere",
    name: "Moonmere Chronicle",
    keeperTitle: "Keeper of Moonmere",
    emoji: "🌙",
    accent: "#7a8ab8",
    cover: "#2a3550",
    coverDeep: "#161e30",
    spine: "#0c121c",
    foil: "#c8d4f0",
    motif: "crescents & starlight",
  },
  bramblewood: {
    villageId: "bramblewood",
    name: "Bramblewood Chronicle",
    keeperTitle: "Keeper of Bramblewood",
    emoji: "🦊",
    accent: "#e07020",
    cover: "#8a4a18",
    coverDeep: "#5a2e0c",
    spine: "#3a1c08",
    foil: "#f0c090",
    motif: "autumn leaves & fox trails",
  },
};

export const ROMAN_PAGES: Record<ChroniclePageNumber, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

/** Seed lore — owner can edit later via admin. */
export const DEFAULT_CHRONICLE_PAGES: ChroniclePageContent[] = [
  // Clovermeadow
  {
    villageId: "clovermeadow",
    pageNumber: 1,
    title: "When the First Seeds Were Shared",
    body: "Before the meadows had names, a traveler spilled a handful of clover seeds beside a quiet brook. Bees arrived before the travelers did, humming the village into being. Every bloom since has been a thank-you letter to that first kindness.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 2,
    title: "The Bloomkeeper's Promise",
    body: "The first Bloomkeeper swore never to hoard a flower. Petals were pressed into pages, nectar into jars, and joy into the hands of strangers. To tend the garden was to tend the heart of Clovermeadow.",
    illustrationUrl: "",
    unlockKey: "garden.spotFlower",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 3,
    title: "Wild Visitors at Dawn",
    body: "Butterflies mapped the lanes. Hedgehogs counted the dew. When a rare visitor lingered, villagers left a saucer of water and a poem. The meadow remembered every guest by the color of its wings.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 4,
    title: "The Endless Picnic",
    body: "On the longest warm evening, the whole village laid blankets end to end until the meadow became one table. They say if you listen closely at dusk, you can still hear laughter in the clover.",
    illustrationUrl: "",
    unlockKey: "garden.completeKindness",
    unlockCount: 1,
    published: true,
  },
  // Mosshollow
  {
    villageId: "mosshollow",
    pageNumber: 1,
    title: "The Library That Grew From Roots",
    body: "An oak fell in a storm and hollowed into shelves. Owls nested in the rafters and kept watch over unfinished stories. Mosshollow's first books were written on bark, then on paper soft as moss.",
    illustrationUrl: "",
    unlockKey: "library.finishBook",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 2,
    title: "Riddles in the Stacks",
    body: "Archivists hid truths inside questions. Solve one, and a candle lit itself. Solve three, and a secret door sighed open. The library never locked knowledge — it only asked you to knock politely.",
    illustrationUrl: "",
    unlockKey: "library.solveMystery",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 3,
    title: "The Forgotten Margin",
    body: "In the margins of a water-stained folio, a note waited: 'For the reader who stays past midnight.' Those who found it received a page that wrote itself — ink blooming like night flowers.",
    illustrationUrl: "",
    unlockKey: "library.claimSecret",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 4,
    title: "Keepers of Quiet Lore",
    body: "When the last candle guttered, the owls recited the village's true name — a soft syllable meaning 'home among pages.' Every Archivist since has carried that word like a bookmark in the heart.",
    illustrationUrl: "",
    unlockKey: "library.journalEntry",
    unlockCount: 1,
    published: true,
  },
  // Hearthwick
  {
    villageId: "hearthwick",
    pageNumber: 1,
    title: "The First Ember",
    body: "A stranger arrived soaked by soft rain. The villagers made room beside the fire without asking their name. That night, the hearth learned a new rule: every stranger is welcomed home.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 2,
    title: "Notes Beside the Fire",
    body: "Someone left a folded scrap of kindness on the mantel. No signature. By morning, three more had joined it. The fire did not burn them — it warmed the words until the whole room felt braver.",
    illustrationUrl: "",
    unlockKey: "hearth.leaveNote",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 3,
    title: "Herbs and Soft Evenings",
    body: "Lavender dried above the beams. Chamomile steeped in copper kettles. The apothecary taught that rest is a craft — measured in sips, stitches, and the hush after rain.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 4,
    title: "The Hearth Hall Feast",
    body: "Recipes traveled faster than rumors. A favorite pie, a shared soup, a loaf broken for latecomers — the Chronicle says Hearthwick was never built of stone, but of evenings spent together.",
    illustrationUrl: "",
    unlockKey: "hearth.toggleRecipeFavorite",
    unlockCount: 1,
    published: true,
  },
  // Moonmere
  {
    villageId: "moonmere",
    pageNumber: 1,
    title: "Answers After Sunset",
    body: "The lake kept secrets until the sky darkened. Then stars wrote themselves across still water, and villagers learned: some answers only arrive after sunset.",
    illustrationUrl: "",
    unlockKey: "moon.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 2,
    title: "Pages of the Moon Journal",
    body: "Each night a prompt rose with the moon. Ink met parchment in private — no audience, only honesty. The Observatory kept those truths the way the lake keeps reflections.",
    illustrationUrl: "",
    unlockKey: "moon.saveJournal",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 3,
    title: "Dreams in Glass Bottles",
    body: "Dreams were sealed without interpretation. Flying, forests, strange places — imagination alone. The archive taught that wonder needs no explanation to be precious.",
    illustrationUrl: "",
    unlockKey: "moon.submitDream",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 4,
    title: "The Restored Dome",
    body: "When the last page returned, the telescope found a constellation shaped like home. Moonmere's Chronicle ends where it begins: under a sky full of quiet questions.",
    illustrationUrl: "",
    unlockKey: "moon.completeRitual",
    unlockCount: 3,
    published: true,
  },
  // Bramblewood
  {
    villageId: "bramblewood",
    pageNumber: 1,
    title: "Beyond the First Thicket",
    body: "Adventure began where the path grew uncertain. Foxes marked the way with laughter. Bramblewood's first explorers packed curiosity instead of maps.",
    illustrationUrl: "",
    unlockKey: "workshop.complete",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 2,
    title: "Field Notes from the Edge",
    body: "Journals filled with sketches of ruins, recipes of foraged tea, and jokes told around autumn fires. The Workshop learned that making is another form of exploring.",
    illustrationUrl: "",
    unlockKey: "workshop.journalEntry",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 3,
    title: "Birds of the Orange Wood",
    body: "Migrating songbirds threaded the canopy like living needlework. Spotters left seed and silence. Every sighting was a stitch in the village's traveling quilt.",
    illustrationUrl: "",
    unlockKey: "workshop.bird",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 4,
    title: "The Guild's Quiet Map",
    body: "When all four pages returned, the Explorers' Guild inked a map that led not outward, but inward — to courage, craft, and the friends who walk the brambles with you.",
    illustrationUrl: "",
    unlockKey: "workshop.complete",
    unlockCount: 3,
    published: true,
  },
];

export function defaultPagesForVillage(
  villageId: VillageId
): ChroniclePageContent[] {
  return DEFAULT_CHRONICLE_PAGES.filter((p) => p.villageId === villageId).sort(
    (a, b) => a.pageNumber - b.pageNumber
  );
}

export function isChronicleActivityKey(
  value: string
): value is ChronicleActivityKey {
  return value in CHRONICLE_ACTIVITY_LABELS;
}
