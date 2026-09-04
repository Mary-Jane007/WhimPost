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
  | "hearth.completeCandleCraft"
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
  "hearth.completeCandleCraft": "Finish a candle craft",
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
  mascotName: string;
  mascotImage: string;
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
    emoji: "🐝",
    mascotName: "Bee",
    mascotImage: "/villages/clovermeadow/mascot.png",
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
    emoji: "🦉",
    mascotName: "Owl",
    mascotImage: "/villages/mosshollow/mascot.png",
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
    emoji: "🦔",
    mascotName: "Hedgehog",
    mascotImage: "/villages/hearthwick/mascot.png",
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
    emoji: "🦋",
    mascotName: "Luna moth",
    mascotImage: "/villages/moonmere/mascot.png",
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
    mascotName: "Fox",
    mascotImage: "/villages/bramblewood/mascot.png",
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
    title: "Before the Footpaths",
    body: "Long before cottages dotted the hills, there was only a meadow. Travelers often took a shortcut through it, yet many found themselves lingering far longer than they had planned. Some claimed it was the quiet, others the endless wildflowers. Whatever the reason, people kept returning until worn footpaths slowly became village lanes.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 2,
    title: "The Gardener Without a Name",
    body: 'The oldest records mention someone simply called "the gardener." No one knows who they were, only that every spring new flower beds appeared where there had been none before. The villagers continued the work without ever discovering who planted the very first ones.',
    illustrationUrl: "",
    unlockKey: "garden.spotFlower",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 3,
    title: "Forgotten Corners",
    body: "Even now, old stone borders and hidden garden paths occasionally appear beneath the grass after heavy rain. No one remembers who built them, but no one removes them either. Instead, new flowers are planted there, as though finishing a task someone began long ago.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 4,
    title: "The Meadow Remembers",
    body: "Every season adds another layer to Clovermeadow. New gardens bloom beside old ones, and each villager quietly leaves something behind for the next. Perhaps that is why the village never feels finished—there is always another corner waiting to be cared for.",
    illustrationUrl: "",
    unlockKey: "garden.completeKindness",
    unlockCount: 1,
    published: true,
  },
  // Mosshollow
  {
    villageId: "mosshollow",
    pageNumber: 1,
    title: "Four Books",
    body: "The oldest shelf in the library once held only four books. No title pages. No author's names. No record of who placed them there. They contained no grand adventures, only observations, sketches, recipes, poems, and quiet moments from ordinary lives. Somehow, they became the foundation of everything that followed.",
    illustrationUrl: "",
    unlockKey: "library.finishBook",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 2,
    title: "The Empty Shelf",
    body: "For reasons no one remembers, one shelf in the library has always remained empty. Every librarian has considered filling it, and every librarian has quietly decided against it. Today, it remains exactly as it has for generations.",
    illustrationUrl: "",
    unlockKey: "library.solveMystery",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 3,
    title: "Notes Between the Pages",
    body: "Readers occasionally discover handwritten notes tucked inside borrowed books. Some are decades old, others seem surprisingly recent. No one knows who leaves them, but returning the note to its place has become an unwritten rule among the villagers.",
    illustrationUrl: "",
    unlockKey: "library.claimSecret",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 4,
    title: "Stories That Stay",
    body: "Mosshollow has never tried to collect every book in the world. It only asks that no story worth remembering is allowed to disappear. Every book returned, every page preserved, and every thoughtful conversation adds another line to its history.",
    illustrationUrl: "",
    unlockKey: "library.journalEntry",
    unlockCount: 1,
    published: true,
  },
  // Hearthwick
  {
    villageId: "hearthwick",
    pageNumber: 1,
    title: "The Light in the Window",
    body: "There was once a single cottage on the hillside whose window remained lit every evening. Travelers crossing the valley soon learned that if they reached that light before nightfall, they would always find a warm fire and someone willing to share a meal. The cottage is long gone, but the habit remained.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 2,
    title: "The Unwritten Tradition",
    body: "No document ever established Hearthwick's customs. There was never a meeting, nor a list of rules. Yet somehow everyone knew to bake an extra loaf, set another place at the table, and keep the kettle warm. No one can say exactly when these traditions began—only that they have always been there.",
    illustrationUrl: "",
    unlockKey: "hearth.leaveNote",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 3,
    title: "The Basket Beside the Fire",
    body: "Old journals mention a small basket that once stood beside the village fireplace. Inside were folded notes containing encouragement, recipes, memories, and simple acts of kindness. The writers never signed their names. Generations later, the basket is still there, though no one remembers who placed it by the fire in the first place.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 4,
    title: "Home",
    body: 'Visitors often ask what makes Hearthwick feel different from anywhere else. The villagers usually smile and shrug. Some say it\'s the smell of fresh bread. Others say it\'s the fire. Most simply point to the empty chair beside the hearth and say,\n\n"It has been waiting for you."',
    illustrationUrl: "",
    unlockKey: "hearth.toggleRecipeFavorite",
    unlockCount: 1,
    published: true,
  },
  // Moonmere
  {
    villageId: "moonmere",
    pageNumber: 1,
    title: "The Bench by the Lake",
    body: "Before Moonmere became a village, there was only a weathered wooden bench overlooking the lake. No one knows who built it, yet someone always seemed to be sitting there after sunset. Over time, more benches appeared, followed by lanterns, cottages, and eventually the village itself.",
    illustrationUrl: "",
    unlockKey: "moon.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 2,
    title: "The Observatory Logbook",
    body: "The observatory keeps a logbook dating back further than anyone can explain. Each page records the phases of the moon, unusual weather, and familiar constellations in remarkably consistent handwriting. The earliest pages are unsigned, and no one has discovered who began them.",
    illustrationUrl: "",
    unlockKey: "moon.saveJournal",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 3,
    title: "Evenings Worth Remembering",
    body: "Moonmere never became famous for festivals or markets. Instead, people remembered evenings spent talking beneath the stars, listening to the lake, and watching the moon rise above the trees. The village slowly earned a reputation as a place where people stayed longer than they intended.",
    illustrationUrl: "",
    unlockKey: "moon.submitDream",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 4,
    title: "Looking Up",
    body: "Every clear evening, someone still unlocks the observatory before sunset. Sometimes it's a lifelong resident, sometimes a first-time visitor. The telescope is adjusted, the lanterns are lit, and another page is added to the logbook. No one knows how many pages it already holds—but everyone agrees it should never stop growing.",
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

/** Bump when default lore should refresh into the DB (preserves unlock settings). */
export const CHRONICLE_LORE_VERSION = 2;

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
