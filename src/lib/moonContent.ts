export type MoonTabId =
  | "overview"
  | "rituals"
  | "atlas"
  | "journal"
  | "dreams"
  | "facts"
  | "wishes"
  | "creatures"
  | "playlists"
  | "inspiration";

export const MOON_TABS: Array<{ id: MoonTabId; label: string; emoji: string }> =
  [
    { id: "overview", label: "The Observatory", emoji: "🔭" },
    { id: "rituals", label: "Night Rituals", emoji: "🌙" },
    { id: "atlas", label: "Star Atlas", emoji: "✦" },
    { id: "journal", label: "Moon Journal", emoji: "📔" },
    { id: "dreams", label: "Dream Archive", emoji: "🫧" },
    { id: "facts", label: "Night Sky Facts", emoji: "🌌" },
    { id: "wishes", label: "Shooting Stars", emoji: "💫" },
    { id: "creatures", label: "Night Creatures", emoji: "🦉" },
    { id: "playlists", label: "Celestial Sounds", emoji: "🎧" },
    { id: "inspiration", label: "Daily Inspiration", emoji: "✨" },
  ];

export const MOON_XP = {
  ritual: 25,
  journal: 20,
  dream: 20,
  stardust: 5,
} as const;

export const MOON_TITLES = [
  { minXp: 0, title: "Night Visitor", emoji: "🌙" },
  { minXp: 80, title: "Star Watcher", emoji: "✦" },
  { minXp: 200, title: "Dream Keeper", emoji: "🫧" },
  { minXp: 400, title: "Moon Scholar", emoji: "📔" },
  { minXp: 700, title: "Wish Weaver", emoji: "💫" },
  { minXp: 1100, title: "Observatory Elder", emoji: "🔭" },
] as const;

export function titleForMoonXp(xp: number) {
  let current: (typeof MOON_TITLES)[number] = MOON_TITLES[0];
  for (const t of MOON_TITLES) {
    if (xp >= t.minXp) current = t;
  }
  return current;
}

export const MOON_ART = {
  observatory: "/moon/observatory.jpg",
  moth: "/stickers/villages/moonmere/luna-moth.png",
  lantern: "/stickers/villages/moonmere/lantern-star.png",
  crescent: "/stickers/villages/moonmere/moon-crescent.png",
  fullMoon: "/stickers/villages/moonmere/moon-full.png",
  starfield: "/stickers/villages/moonmere/starfield.png",
  fairy: "/stickers/villages/moonmere/fairy-moon.png",
  ticket: "/stickers/villages/moonmere/ticket-observatory.png",
  pearls: "/stickers/collectibles/moonmere/moon-pearls.png",
  shards: "/stickers/collectibles/moonmere/moon-shards.png",
  moths: "/stickers/collectibles/moonmere/moon-moths.png",
  starlight: "/stickers/collectibles/moonmere/moon-starlight.png",
  dreams: "/stickers/collectibles/moonmere/moon-dreams.png",
  dust: "/stickers/collectibles/moonmere/moon-dust.png",
  lilies: "/stickers/collectibles/moonmere/moon-lilies.png",
  lanterns: "/stickers/collectibles/moonmere/moon-lanterns.png",
};

/* ─── Night rituals ─── */

export type NightRitual = {
  id: string;
  label: string;
  detail: string;
  emoji: string;
};

export const RITUAL_POOL: NightRitual[] = [
  {
    id: "moon-phase",
    label: "Observe today's moon phase",
    detail: "Step outside or to a window. Name the moon you see.",
    emoji: "🌕",
  },
  {
    id: "learn-constellation",
    label: "Learn a constellation",
    detail: "Open the Star Atlas and linger with one pattern of light.",
    emoji: "✦",
  },
  {
    id: "watch-stars",
    label: "Watch the stars for five minutes",
    detail: "No phone, no rush — only sky.",
    emoji: "🌌",
  },
  {
    id: "write-dream",
    label: "Write today's dream",
    detail: "Capture whatever lingered when you woke.",
    emoji: "💭",
  },
  {
    id: "record-weather",
    label: "Record tonight's weather",
    detail: "Clear, cloudy, misty, windy — note the sky's mood.",
    emoji: "🌫",
  },
  {
    id: "reflect-day",
    label: "Reflect on your day",
    detail: "One quiet truth about how today felt.",
    emoji: "🪞",
  },
  {
    id: "moon-tea",
    label: "Drink moon tea",
    detail: "Chamomile, lavender, or whatever softens the evening.",
    emoji: "🍵",
  },
  {
    id: "night-sounds",
    label: "Listen to nighttime sounds",
    detail: "Crickets, wind, distant water — let them settle you.",
    emoji: "🦗",
  },
  {
    id: "fireflies",
    label: "Watch fireflies",
    detail: "Even imagined ones count under a soft lamp.",
    emoji: "✨",
  },
  {
    id: "hope-tomorrow",
    label: "Write one hope for tomorrow",
    detail: "A small wish, not a plan.",
    emoji: "🌱",
  },
  {
    id: "mindful-breath",
    label: "Practice mindful breathing",
    detail: "Four counts in, six counts out — under starlight.",
    emoji: "🌬",
  },
  {
    id: "read-moonlight",
    label: "Read beneath moonlight",
    detail: "A page, a poem, or a single sentence aloud.",
    emoji: "📖",
  },
  {
    id: "astro-fact",
    label: "Learn one astronomy fact",
    detail: "Visit Night Sky Facts and carry one wonder home.",
    emoji: "📜",
  },
  {
    id: "sketch-moon",
    label: "Sketch the moon",
    detail: "Imperfect circles welcome.",
    emoji: "✏",
  },
  {
    id: "watch-sunset",
    label: "Watch a sunset",
    detail: "The door into Moonmere's hours.",
    emoji: "🌅",
  },
  {
    id: "watch-sunrise",
    label: "Watch a sunrise",
    detail: "Stay for the first pale silver of morning.",
    emoji: "🌄",
  },
];

export function dailyRituals(now = new Date()): NightRitual[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const picks: NightRitual[] = [];
  const used = new Set<string>();
  for (let guard = 0; picks.length < 5 && guard < 40; guard++) {
    const idx = (day * 19 + guard * 13) % RITUAL_POOL.length;
    const item = RITUAL_POOL[idx];
    if (used.has(item.id)) continue;
    used.add(item.id);
    picks.push(item);
  }
  return picks;
}

/* ─── Moon phases ─── */

export type MoonPhaseId =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

export type MoonPhase = {
  id: MoonPhaseId;
  name: string;
  emoji: string;
  detail: string;
  /** Fraction of the Moon's face lit (0–1), from real lunar geometry. */
  illumination: number;
  /** Earth days since the last new moon. */
  ageDays: number;
  /** Progress through the synodic month (0 = new, 0.5 = full). */
  cycle: number;
};

type MoonPhaseBase = Omit<
  MoonPhase,
  "illumination" | "ageDays" | "cycle"
>;

export const MOON_PHASES: MoonPhaseBase[] = [
  {
    id: "new",
    name: "New Moon",
    emoji: "🌑",
    detail: "A quiet beginning — the sky keeps its secrets close.",
  },
  {
    id: "waxing-crescent",
    name: "Waxing Crescent",
    emoji: "🌒",
    detail: "A silver smile returning. Soft hopes gather.",
  },
  {
    id: "first-quarter",
    name: "First Quarter",
    emoji: "🌓",
    detail: "Half light, half shadow — decisions feel clearer.",
  },
  {
    id: "waxing-gibbous",
    name: "Waxing Gibbous",
    emoji: "🌔",
    detail: "Almost full. Patience glows at the edges.",
  },
  {
    id: "full",
    name: "Full Moon",
    emoji: "🌕",
    detail: "The lake mirrors everything. Dreams speak louder.",
  },
  {
    id: "waning-gibbous",
    name: "Waning Gibbous",
    emoji: "🌖",
    detail: "A gentle release begins. Gratitude softens the night.",
  },
  {
    id: "last-quarter",
    name: "Last Quarter",
    emoji: "🌗",
    detail: "Balance again — look back with kindness.",
  },
  {
    id: "waning-crescent",
    name: "Waning Crescent",
    emoji: "🌘",
    detail: "A thin goodbye before rest. Quiet is enough.",
  },
];

/** Mean synodic month (new moon → new moon), in Earth days. */
const SYNODIC_MONTH = 29.530588853;
/** Julian day of a known new moon near J2000 (2000-01-06). */
const REF_NEW_MOON_JD = 2451550.1;
/** Window around exact new/full/quarter (~18 hours). */
const MAJOR_PHASE_WINDOW = 0.75 / SYNODIC_MONTH;

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

function lunarCycleFraction(date: Date): number {
  let phase = (julianDay(date) - REF_NEW_MOON_JD) / SYNODIC_MONTH;
  phase = phase - Math.floor(phase);
  if (phase < 0) phase += 1;
  return phase;
}

function phaseDistance(cycle: number, target: number): number {
  const d = Math.abs(cycle - target);
  return Math.min(d, 1 - d);
}

function moonPhaseIdFromCycle(cycle: number): MoonPhaseId {
  if (phaseDistance(cycle, 0) < MAJOR_PHASE_WINDOW) return "new";
  if (phaseDistance(cycle, 0.25) < MAJOR_PHASE_WINDOW) return "first-quarter";
  if (phaseDistance(cycle, 0.5) < MAJOR_PHASE_WINDOW) return "full";
  if (phaseDistance(cycle, 0.75) < MAJOR_PHASE_WINDOW) return "last-quarter";
  if (cycle < 0.25) return "waxing-crescent";
  if (cycle < 0.5) return "waxing-gibbous";
  if (cycle < 0.75) return "waning-gibbous";
  return "waning-crescent";
}

/**
 * Real lunar phase for a calendar moment — not a rotating pool.
 * Uses Julian day + mean synodic month (same approach as common astronomy widgets).
 */
export function todaysMoonPhase(now = new Date()): MoonPhase {
  const cycle = lunarCycleFraction(now);
  const ageDays = cycle * SYNODIC_MONTH;
  const illumination = (1 - Math.cos(2 * Math.PI * cycle)) / 2;
  const id = moonPhaseIdFromCycle(cycle);
  const base = MOON_PHASES.find((p) => p.id === id) || MOON_PHASES[0];
  const lit = Math.round(illumination * 100);
  return {
    ...base,
    illumination,
    ageDays,
    cycle,
    detail: `${base.detail} Tonight the moon is about ${lit}% lit (${ageDays.toFixed(1)} days since new).`,
  };
}

/* ─── Star Atlas ─── */

export type Constellation = {
  id: string;
  name: string;
  emoji: string;
  mythology: string;
  visibility: string;
  facts: string[];
  brightestStars: string[];
  image: string;
};

export const CONSTELLATIONS: Constellation[] = [
  {
    id: "orion",
    name: "Orion",
    emoji: "🏹",
    mythology:
      "The hunter of winter skies — three belt stars mark his stride across myth and map alike.",
    visibility: "Best in Northern winter evenings; bright across both hemispheres.",
    facts: [
      "Betelgeuse is a red supergiant nearing the end of its life.",
      "The Orion Nebula is a stellar nursery visible to the naked eye.",
      "Orion's belt points toward Sirius, the night's brightest star.",
    ],
    brightestStars: ["Betelgeuse", "Rigel", "Bellatrix"],
    image: MOON_ART.starfield,
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    emoji: "👑",
    mythology:
      "The vain queen sits in a zigzag throne of five bright stars — punished to circle the pole forever.",
    visibility: "Circumpolar for much of the Northern Hemisphere; easy W or M shape.",
    facts: [
      "Cassiopeia never sets for many northern observers.",
      "It lies opposite the Big Dipper across Polaris.",
      "The constellation hosts several open star clusters.",
    ],
    brightestStars: ["Schedar", "Caph", "Gamma Cas"],
    image: MOON_ART.shards,
  },
  {
    id: "ursa-major",
    name: "Ursa Major",
    emoji: "🐻",
    mythology:
      "The Great Bear — her ladle-shaped Dipper has guided travelers for millennia.",
    visibility: "Year-round for northern skies; spring evenings are especially clear.",
    facts: [
      "The two pointer stars of the Dipper lead to Polaris.",
      "Most Dipper stars are a true moving group of related suns.",
      "Mizar and Alcor form a famous naked-eye double.",
    ],
    brightestStars: ["Alioth", "Dubhe", "Alkaid"],
    image: MOON_ART.starlight,
  },
  {
    id: "cygnus",
    name: "Cygnus",
    emoji: "🦢",
    mythology:
      "The Northern Cross — a swan flying the Milky Way with wings outstretched.",
    visibility: "Summer evenings in the Northern Hemisphere along the Milky Way.",
    facts: [
      "Deneb is one corner of the Summer Triangle.",
      "Cygnus X-1 was among the first black-hole candidates.",
      "The North America Nebula nestles near Deneb.",
    ],
    brightestStars: ["Deneb", "Sadr", "Albireo"],
    image: MOON_ART.dust,
  },
  {
    id: "lyra",
    name: "Lyra",
    emoji: "🎶",
    mythology:
      "Orpheus's lyre — a small constellation with one of the sky's most brilliant jewels.",
    visibility: "Summer nights in the north; Vega shines near zenith.",
    facts: [
      "Vega was the northern pole star ~12,000 years ago.",
      "The Ring Nebula (M57) is a planetary nebula in Lyra.",
      "Lyra is compact but unmistakable once Vega is found.",
    ],
    brightestStars: ["Vega", "Sheliak", "Sulafat"],
    image: MOON_ART.pearls,
  },
  {
    id: "scorpius",
    name: "Scorpius",
    emoji: "🦂",
    mythology:
      "The scorpion that stung Orion — forever chasing him across opposite seasons.",
    visibility: "Southern summer / northern summer low on the southern horizon.",
    facts: [
      "Antares is a red heart rivaling Mars in color.",
      "The scorpion's stinger holds Shaula and Lesath.",
      "Many Messier clusters glitter near the Milky Way here.",
    ],
    brightestStars: ["Antares", "Shaula", "Sargas"],
    image: MOON_ART.lanterns,
  },
  {
    id: "draco",
    name: "Draco",
    emoji: "🐉",
    mythology:
      "A winding dragon coiled around the north celestial pole — guardian of quiet skies.",
    visibility: "Circumpolar in northern latitudes; faint but long.",
    facts: [
      "Thuban was the pole star when the pyramids were young.",
      "Draco wraps between Ursa Major and Ursa Minor.",
      "The Cat's Eye Nebula lives within the dragon's coils.",
    ],
    brightestStars: ["Eltanin", "Rastaban", "Thuban"],
    image: MOON_ART.moths,
  },
  {
    id: "pegasus",
    name: "Pegasus",
    emoji: "🐴",
    mythology:
      "The winged horse — his Great Square is a autumn landmark of the northern sky.",
    visibility: "Autumn evenings; the Square is an easy asterism.",
    facts: [
      "Only three corners of the Square belong to Pegasus.",
      "The fourth corner is Alpheratz in Andromeda.",
      "51 Pegasi hosted the first exoplanet found around a Sun-like star.",
    ],
    brightestStars: ["Enif", "Scheat", "Markab"],
    image: MOON_ART.fairy,
  },
  {
    id: "andromeda",
    name: "Andromeda",
    emoji: "⛓",
    mythology:
      "The chained princess — and home to the nearest major spiral galaxy.",
    visibility: "Autumn nights; look northeast of the Great Square.",
    facts: [
      "The Andromeda Galaxy (M31) is visible to the naked eye from dark skies.",
      "M31 is approaching the Milky Way for a far-future merger.",
      "Andromeda shares a corner star with Pegasus.",
    ],
    brightestStars: ["Alpheratz", "Mirach", "Almach"],
    image: MOON_ART.dreams,
  },
];

export function todaysConstellation(now = new Date()): Constellation {
  const day = Math.floor(now.getTime() / 86_400_000);
  return CONSTELLATIONS[day % CONSTELLATIONS.length];
}

/* ─── Moon Journal ─── */

export type JournalPrompt = {
  id: string;
  prompt: string;
};

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { id: "letting-go", prompt: "What are you letting go of tonight?" },
  { id: "hope", prompt: "What gave you hope today?" },
  { id: "dream-remember", prompt: "What dream do you remember?" },
  {
    id: "shooting-wish",
    prompt: "What would you wish upon a shooting star?",
  },
  {
    id: "night-color",
    prompt: "If tonight had a color, what would it be?",
  },
  { id: "quiet-moment", prompt: "Where did quiet find you today?" },
  { id: "silver-thread", prompt: "What soft truth are you carrying into sleep?" },
  { id: "lake-mirror", prompt: "What would the lake reflect if it held your day?" },
  { id: "one-kindness", prompt: "Who or what were you gentle with today?" },
  { id: "tomorrow-light", prompt: "What light do you hope tomorrow brings?" },
];

export function todaysJournalPrompt(now = new Date()): JournalPrompt {
  const day = Math.floor(now.getTime() / 86_400_000);
  return JOURNAL_PROMPTS[day % JOURNAL_PROMPTS.length];
}

/* ─── Dream Archive ─── */

export type DreamTheme =
  | "flying"
  | "ocean"
  | "forest"
  | "strange-places"
  | "childhood"
  | "animals"
  | "adventure"
  | "fantasy";

export const DREAM_THEME_LABELS: Record<DreamTheme, string> = {
  flying: "Flying",
  ocean: "Ocean",
  forest: "Forest",
  "strange-places": "Strange Places",
  childhood: "Childhood",
  animals: "Animals",
  adventure: "Adventure",
  fantasy: "Fantasy",
};

export const SAMPLE_DREAMS: Array<{ body: string; theme: DreamTheme }> = [
  {
    body: "I drifted above silver rooftops and the moon followed me like a lantern on a string.",
    theme: "flying",
  },
  {
    body: "The lake was glass. Every star had a twin beneath my feet.",
    theme: "ocean",
  },
  {
    body: "Moths led me through a pine path that hummed with soft blue light.",
    theme: "forest",
  },
  {
    body: "I found a door in a library that opened onto a hallway of moons.",
    theme: "strange-places",
  },
  {
    body: "I was small again, collecting fireflies in a jar that never needed a lid.",
    theme: "childhood",
  },
  {
    body: "An owl spoke my name once, then left a feather that glowed at the edges.",
    theme: "animals",
  },
  {
    body: "We rowed a boat made of paper toward a constellation shaped like home.",
    theme: "adventure",
  },
  {
    body: "A moth the size of a kite carried me over a city of floating hourglasses.",
    theme: "fantasy",
  },
  {
    body: "Waves whispered in a language I almost remembered from somewhere else.",
    theme: "ocean",
  },
  {
    body: "I climbed a ladder of stars and never felt afraid of falling.",
    theme: "flying",
  },
];

/* ─── Night sky facts ─── */

export type SkyFact = {
  id: string;
  title: string;
  category: string;
  body: string;
  emoji: string;
};

export const SKY_FACTS: SkyFact[] = [
  {
    id: "moon-phases",
    title: "Why the moon changes shape",
    category: "Moon phases",
    body: "We always see the same face of the Moon, but sunlight paints different portions as it orbits Earth — that's the dance of phases.",
    emoji: "🌕",
  },
  {
    id: "perseids",
    title: "Perseid meteors",
    category: "Meteor showers",
    body: "Each August, Earth sweeps through dust from comet Swift–Tuttle, and the sky answers with swift bright streaks.",
    emoji: "☄",
  },
  {
    id: "aurora",
    title: "Auroras are solar weather",
    category: "Auroras",
    body: "Charged particles from the Sun collide with Earth's atmosphere, painting green and violet curtains near the poles.",
    emoji: "🌌",
  },
  {
    id: "lunar-eclipse",
    title: "Blood moons",
    category: "Lunar eclipses",
    body: "During a total lunar eclipse, Earth's shadow wraps the Moon while sunlight bends through our air — turning it copper-red.",
    emoji: "🩸",
  },
  {
    id: "solar-eclipse",
    title: "Day becomes night",
    category: "Solar eclipses",
    body: "When the Moon covers the Sun, birds quiet and temperature drops — a brief night at noon.",
    emoji: "🌑",
  },
  {
    id: "venus",
    title: "Morning and evening star",
    category: "Planets",
    body: "Venus is often the brightest 'star' after sunset or before sunrise — a neighbor wrapped in clouds.",
    emoji: "🪐",
  },
  {
    id: "milky-way",
    title: "Our home galaxy",
    category: "Galaxies",
    body: "On dark nights the Milky Way looks like spilled milk — billions of suns seen edge-on from inside the disk.",
    emoji: "🌌",
  },
  {
    id: "orion-nebula",
    title: "A nursery of stars",
    category: "Nebulae",
    body: "The Orion Nebula is a cloud where new stars are still being born — close enough to see without a telescope.",
    emoji: "☁",
  },
  {
    id: "black-holes",
    title: "Gentle giants, mostly",
    category: "Black holes",
    body: "Most black holes are quiet. Only when matter falls in do they shine — gravity's softest, strangest hush.",
    emoji: "⚫",
  },
  {
    id: "galileo",
    title: "Galileo's moons",
    category: "History",
    body: "In 1610 Galileo saw four moons circling Jupiter — proof that not everything orbits Earth.",
    emoji: "📜",
  },
  {
    id: "polaris",
    title: "Not always the pole",
    category: "History",
    body: "Earth's axis slowly wobbles. Thuban, Vega, and others have each taken a turn as the north star.",
    emoji: "🧭",
  },
  {
    id: "light-year",
    title: "A year of light",
    category: "Galaxies",
    body: "A light-year is how far light travels in one year — about 9.5 trillion kilometers of quiet distance.",
    emoji: "📏",
  },
];

export function todaysSkyFact(now = new Date()): SkyFact {
  const day = Math.floor(now.getTime() / 86_400_000);
  return SKY_FACTS[day % SKY_FACTS.length];
}

/* ─── Shooting star wishes ─── */

export const SAMPLE_WISHES = [
  "I hope my family stays healthy.",
  "I hope I become brave.",
  "I hope tomorrow feels lighter.",
  "I hope soft rain finds the dry places.",
  "I hope I remember how to rest.",
  "I hope someone I love sleeps well tonight.",
  "I hope the quiet answers arrive gently.",
  "I hope I keep my kindness even on hard days.",
  "I hope the stars keep watching over the lonely.",
  "I hope I wake with one clear hope.",
];

/* ─── Night creatures ─── */

export type NightCreature = {
  id: string;
  name: string;
  emoji: string;
  habitat: string;
  facts: string[];
  season: string;
  trivia: string;
  image: string;
};

export const NIGHT_CREATURES: NightCreature[] = [
  {
    id: "barn-owl",
    name: "Barn Owl",
    emoji: "🦉",
    habitat: "Barns, meadows, and quiet field edges",
    facts: [
      "Heart-shaped faces funnel sound toward keen ears.",
      "They hunt mostly by hearing in near-dark.",
      "Soft fringe feathers hush their wingbeats.",
    ],
    season: "Year-round in mild regions",
    trivia: "A barn owl's call is a long eerie shriek — not a hoot.",
    image: MOON_ART.moth,
  },
  {
    id: "potoo",
    name: "Potoo",
    emoji: "👁",
    habitat: "Tropical forests and woodland edges",
    facts: [
      "By day they freeze like broken branches.",
      "Huge eyes help them hunt moths at dusk.",
      "Their song is a haunting descending whistle.",
    ],
    season: "Warm nights year-round in the tropics",
    trivia: "Potoos can open their mouths nearly as wide as their faces.",
    image: MOON_ART.crescent,
  },
  {
    id: "nightjar",
    name: "Nightjar",
    emoji: "🌙",
    habitat: "Heaths, clearings, and open woodland",
    facts: [
      "Camouflage makes them nearly invisible on the ground.",
      "They catch insects on the wing at twilight.",
      "Some species migrate thousands of kilometers.",
    ],
    season: "Spring through autumn in temperate zones",
    trivia: "Their soft churring song can carry for a kilometer.",
    image: MOON_ART.starfield,
  },
  {
    id: "fireflies",
    name: "Fireflies",
    emoji: "✨",
    habitat: "Damp meadows, gardens, and forest edges",
    facts: [
      "Their glow is cold light made by chemistry.",
      "Flash patterns help fireflies find each other.",
      "Larvae are fierce hunters of snails and worms.",
    ],
    season: "Warm summer nights",
    trivia: "Some fireflies synchronize their flashes across whole trees.",
    image: MOON_ART.starlight,
  },
  {
    id: "moths",
    name: "Moths",
    emoji: "🦋",
    habitat: "Gardens, woodlands, and moonlit docks",
    facts: [
      "Many navigate by moonlight and star patterns.",
      "Night-blooming flowers often rely on moths.",
      "Luna moths have no mouths as adults — they live to mate.",
    ],
    season: "Peak in late spring and summer",
    trivia: "Moonmere's mascot is a luna moth — soft green silk of the night.",
    image: MOON_ART.moths,
  },
  {
    id: "tree-frogs",
    name: "Tree Frogs",
    emoji: "🐸",
    habitat: "Wetlands, reed beds, and lakeside trees",
    facts: [
      "Their chorus is a map of warm, wet evenings.",
      "Toe pads help them cling to leaves and glass.",
      "Skin must stay moist — foggy nights are friends.",
    ],
    season: "Spring and summer breeding nights",
    trivia: "Some species change shade to match moonlit leaves.",
    image: MOON_ART.lilies,
  },
  {
    id: "bats",
    name: "Bats",
    emoji: "🦇",
    habitat: "Caves, lofts, bridges, and tree hollows",
    facts: [
      "Echolocation paints the dark in sound.",
      "A single bat can eat thousands of insects a night.",
      "They are the only mammals with true powered flight.",
    ],
    season: "Active from dusk through warm months",
    trivia: "Moonmere villagers leave porch lights soft so moths — and bats — can feast.",
    image: MOON_ART.lantern,
  },
  {
    id: "foxes",
    name: "Foxes",
    emoji: "🦊",
    habitat: "Woodland edges, fields, and quiet lanes",
    facts: [
      "Most hunting happens at dusk and dawn.",
      "Excellent hearing finds mice under snow or grass.",
      "They cache food for leaner nights.",
    ],
    season: "Year-round; kits in spring",
    trivia: "A fox's eyes shine green-gold in lantern light.",
    image: MOON_ART.fullMoon,
  },
  {
    id: "hedgehogs",
    name: "Hedgehogs",
    emoji: "🦔",
    habitat: "Gardens, hedgerows, and leaf litter",
    facts: [
      "They snuffle for beetles after sunset.",
      "Spines are modified hairs — soft when young.",
      "They hibernate through the coldest months.",
    ],
    season: "Spring to autumn nights",
    trivia: "A bowl of water is the kindest night gift for a visiting hedgehog.",
    image: MOON_ART.pearls,
  },
];

export function todaysCreature(now = new Date()): NightCreature {
  const day = Math.floor(now.getTime() / 86_400_000);
  return NIGHT_CREATURES[day % NIGHT_CREATURES.length];
}

/* ─── Celestial playlists ─── */

export type CelestialPlaylist = {
  id: string;
  name: string;
  emoji: string;
  mood: string;
  description: string;
  listenFor: string[];
  image: string;
};

export const CELESTIAL_PLAYLISTS: CelestialPlaylist[] = [
  {
    id: "gentle-rain",
    name: "Gentle Rain",
    emoji: "🌧",
    mood: "Soft settling",
    description: "A slow roof-rain for reading and moon tea.",
    listenFor: ["distant drops", "soft gutter hush", "warm indoor quiet"],
    image: MOON_ART.pearls,
  },
  {
    id: "forest-night",
    name: "Forest at Night",
    emoji: "🌲",
    mood: "Deep green hush",
    description: "Leaves, soft wind, and the far call of something kind.",
    listenFor: ["crickets", "branch creaks", "owl silence"],
    image: MOON_ART.moth,
  },
  {
    id: "campfire",
    name: "Crackling Campfire",
    emoji: "🔥",
    mood: "Amber comfort",
    description: "Embers talking softly while the lake stays still.",
    listenFor: ["snap of twigs", "low flame", "night air"],
    image: MOON_ART.lantern,
  },
  {
    id: "ocean-waves",
    name: "Ocean Waves",
    emoji: "🌊",
    mood: "Tidal calm",
    description: "Long breaths of water for drifting thoughts.",
    listenFor: ["slow breakers", "foam hush", "distant gull quiet"],
    image: MOON_ART.dreams,
  },
  {
    id: "wind-trees",
    name: "Wind Through Trees",
    emoji: "🌬",
    mood: "Silver motion",
    description: "A night breeze combing pines along the dock.",
    listenFor: ["needle whisper", "soft sway", "open sky"],
    image: MOON_ART.dust,
  },
  {
    id: "owls-calling",
    name: "Owls Calling",
    emoji: "🦉",
    mood: "Watchful peace",
    description: "Sparse hoots across a meadow of fog.",
    listenFor: ["far hoot", "grass hush", "moon stillness"],
    image: MOON_ART.crescent,
  },
  {
    id: "soft-piano",
    name: "Soft Piano",
    emoji: "🎹",
    mood: "Quiet wonder",
    description: "Sparse notes like stars appearing one by one.",
    listenFor: ["gentle keys", "long rests", "room reverb"],
    image: MOON_ART.starlight,
  },
  {
    id: "night-jazz",
    name: "Nighttime Jazz",
    emoji: "🎷",
    mood: "Velvet midnight",
    description: "Slow brass and brushed drums for late observatory hours.",
    listenFor: ["brushed snare", "warm bass", "muted horn"],
    image: MOON_ART.lanterns,
  },
];

/* ─── Daily inspiration ─── */

export const QUOTE_POOL = [
  "Some answers only arrive after sunset.",
  "The quietest skies hold the brightest maps.",
  "You do not have to shine to belong among stars.",
  "Dreams are letters the night writes back.",
  "Still water remembers every constellation.",
  "Soft light is still light.",
  "Wonder is a kind of rest.",
  "Let the fog keep what you cannot carry.",
];

export const REFLECTION_POOL = [
  "Name one thing that felt enough today.",
  "Where did you feel most like yourself after dusk?",
  "What can wait until morning without harm?",
  "Who would you thank under a quiet sky?",
  "What small ritual made the night kinder?",
];

export const SKY_COLOR_POOL = [
  { name: "Deep Navy", hex: "#1a2744" },
  { name: "Midnight Blue", hex: "#243356" },
  { name: "Soft Lavender", hex: "#b8a8d4" },
  { name: "Moon White", hex: "#e8eef8" },
  { name: "Muted Teal", hex: "#6a8f9a" },
  { name: "Silver Mist", hex: "#c5cedd" },
];

export function todaysInspiration(now = new Date()) {
  const day = Math.floor(now.getTime() / 86_400_000);
  const moon = todaysMoonPhase(now);
  const constellation = todaysConstellation(now);
  const prompt = todaysJournalPrompt(now);
  const fact = todaysSkyFact(now);
  const creature = todaysCreature(now);
  return {
    moon,
    constellationId: constellation.id,
    dreamPrompt: prompt,
    factId: fact.id,
    creatureId: creature.id,
    quote: QUOTE_POOL[day % QUOTE_POOL.length],
    reflection: REFLECTION_POOL[day % REFLECTION_POOL.length],
    skyColor: SKY_COLOR_POOL[day % SKY_COLOR_POOL.length],
  };
}
