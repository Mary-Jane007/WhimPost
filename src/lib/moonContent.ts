export type MoonTabId =
  | "overview"
  | "rituals"
  | "atlas"
  | "journal"
  | "dreams"
  | "facts"
  | "calendar"
  | "creatures"
  | "playlists"
  | "inspiration";

export const MOON_TABS: Array<{ id: MoonTabId; label: string; emoji: string }> =
  [
    { id: "overview", label: "The Observatory", emoji: "🔭" },
    { id: "rituals", label: "Night Rituals", emoji: "🌙" },
    { id: "atlas", label: "Bright Stars", emoji: "✦" },
    { id: "journal", label: "Moon Journal", emoji: "📔" },
    { id: "dreams", label: "Dream Archive", emoji: "🫧" },
    { id: "facts", label: "Night Sky Facts", emoji: "🌌" },
    { id: "calendar", label: "Sky Calendar", emoji: "📅" },
    { id: "creatures", label: "Night Creatures", emoji: "🦉" },
    { id: "playlists", label: "Celestial Sounds", emoji: "🎧" },
    { id: "inspiration", label: "Daily Inspiration", emoji: "✨" },
  ];

export const MOON_XP = {
  ritual: 25,
  journal: 20,
  dream: 20,
} as const;

export const MOON_TITLES = [
  { minXp: 0, title: "Night Visitor", emoji: "🌙" },
  { minXp: 80, title: "Star Watcher", emoji: "✦" },
  { minXp: 200, title: "Dream Keeper", emoji: "🫧" },
  { minXp: 400, title: "Moon Scholar", emoji: "📔" },
  { minXp: 700, title: "Sky Listener", emoji: "🌌" },
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
    id: "learn-bright-star",
    label: "Learn tonight's brightest star",
    detail: "Open Bright Stars and meet the night's standout sun.",
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
    detail: "A small hope, not a plan.",
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

/* ─── Brightest stars of the night ─── */

export type NightStar = {
  id: string;
  name: string;
  emoji: string;
  /** Months (1–12) when this star is a strong evening target (Northern mid-latitudes). */
  bestMonths: number[];
  constellationHome: string;
  distanceLy: string;
  spectralType: string;
  summary: string;
  whenToLook: string;
  facts: string[];
  image: string;
};

/** Real bright stars — picked by season, not mythology or zodiac. */
export const NIGHT_STARS: NightStar[] = [
  {
    id: "sirius",
    name: "Sirius",
    emoji: "✦",
    bestMonths: [12, 1, 2, 3],
    constellationHome: "Canis Major",
    distanceLy: "8.6 light-years",
    spectralType: "A1V (white main-sequence) + white dwarf companion",
    summary:
      "The brightest star in Earth's night sky — a nearby binary system that dominates winter evenings.",
    whenToLook:
      "Winter evenings in the Northern Hemisphere; follows Orion's belt southeast.",
    facts: [
      "Apparent magnitude about −1.46 — brighter than any other night-time star.",
      "Sirius B is a white dwarf: a Earth-sized remnant of a once-larger star.",
      "Its name comes from Greek for “scorching,” not from any zodiac sign.",
    ],
    image: "/moon/constellations/orion.jpg",
  },
  {
    id: "canopus",
    name: "Canopus",
    emoji: "🌟",
    bestMonths: [12, 1, 2],
    constellationHome: "Carina",
    distanceLy: "~310 light-years",
    spectralType: "A9 II (bright giant)",
    summary:
      "The second-brightest night star overall — a southern sky beacon for navigators.",
    whenToLook:
      "Low on the southern horizon from mid-northern latitudes; high and brilliant from the Southern Hemisphere.",
    facts: [
      "Apparent magnitude about −0.74.",
      "Used historically for spacecraft navigation attitude sensors.",
      "Far more luminous than Sirius, but much farther away.",
    ],
    image: "/moon/constellations/orion.jpg",
  },
  {
    id: "arcturus",
    name: "Arcturus",
    emoji: "🟠",
    bestMonths: [3, 4, 5, 6],
    constellationHome: "Boötes",
    distanceLy: "36.7 light-years",
    spectralType: "K1.5 III (orange giant)",
    summary:
      "Spring's orange lantern — the brightest star in the northern celestial hemisphere.",
    whenToLook:
      "Follow the arc of the Big Dipper's handle to “arc to Arcturus” on spring evenings.",
    facts: [
      "Apparent magnitude about −0.05.",
      "An aging giant that has left the main sequence.",
      "One of the fastest-moving bright stars across our sky.",
    ],
    image: "/moon/constellations/ursa-major.jpg",
  },
  {
    id: "vega",
    name: "Vega",
    emoji: "💎",
    bestMonths: [6, 7, 8, 9],
    constellationHome: "Lyra",
    distanceLy: "25 light-years",
    spectralType: "A0V",
    summary:
      "Summer's brilliant white landmark — once used as the zero-point for the magnitude scale.",
    whenToLook:
      "Near the zenith on summer evenings for mid-northern latitudes; one corner of the Summer Triangle.",
    facts: [
      "Apparent magnitude about 0.03.",
      "Was Earth's north pole star about 12,000 years ago due to axial precession.",
      "Surrounded by a dusty debris disk — a young planetary system under study.",
    ],
    image: "/moon/constellations/lyra.jpg",
  },
  {
    id: "capella",
    name: "Capella",
    emoji: "🟡",
    bestMonths: [10, 11, 12, 1, 2],
    constellationHome: "Auriga",
    distanceLy: "42.9 light-years",
    spectralType: "G-type giant binary",
    summary:
      "A golden winter–autumn beacon — actually two pairs of stars bound together.",
    whenToLook:
      "High in northern evenings from autumn through winter; part of the Winter Hexagon.",
    facts: [
      "Apparent magnitude about 0.08.",
      "The brightest star in Auriga.",
      "Its yellow tint comes from cool giant components similar in color to the Sun, but much larger.",
    ],
    image: "/moon/constellations/cassiopeia.jpg",
  },
  {
    id: "rigel",
    name: "Rigel",
    emoji: "💙",
    bestMonths: [12, 1, 2, 3],
    constellationHome: "Orion",
    distanceLy: "~860 light-years",
    spectralType: "B8 Ia (blue-white supergiant)",
    summary:
      "Orion's brilliant blue-white foot — one of the most luminous stars visible to the naked eye.",
    whenToLook: "Winter evenings; the bright southwest corner of Orion.",
    facts: [
      "Apparent magnitude about 0.13 (varies slightly).",
      "Hundreds of thousands of times more luminous than the Sun.",
      "A multiple-star system; telescopes reveal fainter companions.",
    ],
    image: "/moon/constellations/orion.jpg",
  },
  {
    id: "procyon",
    name: "Procyon",
    emoji: "⚪",
    bestMonths: [1, 2, 3, 4],
    constellationHome: "Canis Minor",
    distanceLy: "11.5 light-years",
    spectralType: "F5 IV–V + white dwarf",
    summary:
      "The Little Dog's bright star — among the nearest naked-eye suns.",
    whenToLook:
      "Winter and early spring evenings; forms a triangle with Sirius and Betelgeuse.",
    facts: [
      "Apparent magnitude about 0.34.",
      "Has a white-dwarf companion like Sirius.",
      "Name means “before the dog,” rising ahead of Sirius.",
    ],
    image: "/moon/constellations/orion.jpg",
  },
  {
    id: "betelgeuse",
    name: "Betelgeuse",
    emoji: "🔴",
    bestMonths: [12, 1, 2, 3],
    constellationHome: "Orion",
    distanceLy: "~640 light-years",
    spectralType: "M1–M2 Ia (red supergiant)",
    summary:
      "A vast red supergiant near the end of its life — famous for dramatic brightness changes.",
    whenToLook: "Winter evenings; Orion's northeastern shoulder.",
    facts: [
      "If placed at the Sun's position, it would engulf the inner planets.",
      "Will someday explode as a supernova (on astronomical timescales).",
      "Its 2019–2020 “Great Dimming” was studied worldwide.",
    ],
    image: "/moon/constellations/orion.jpg",
  },
  {
    id: "altair",
    name: "Altair",
    emoji: "✈",
    bestMonths: [6, 7, 8, 9],
    constellationHome: "Aquila",
    distanceLy: "16.7 light-years",
    spectralType: "A7 V",
    summary:
      "A fast-spinning summer star — flattened by rotation, bright in the Summer Triangle.",
    whenToLook: "Summer evenings; southern point of the Summer Triangle with Vega and Deneb.",
    facts: [
      "Apparent magnitude about 0.76.",
      "Rotates in under 10 hours — so fast it bulges at the equator.",
      "One of the closest naked-eye A-type stars.",
    ],
    image: "/moon/constellations/cygnus.jpg",
  },
  {
    id: "aldebaran",
    name: "Aldebaran",
    emoji: "👁",
    bestMonths: [10, 11, 12, 1],
    constellationHome: "Taurus",
    distanceLy: "65 light-years",
    spectralType: "K5 III",
    summary:
      "The bright orange eye of Taurus — a autumn/winter giant along the ecliptic.",
    whenToLook:
      "Autumn and winter evenings; follows the Pleiades across the sky.",
    facts: [
      "Apparent magnitude about 0.85.",
      "Appears among the Hyades cluster but is a foreground star.",
      "The Moon and planets often pass nearby along the ecliptic.",
    ],
    image: "/moon/constellations/pegasus.jpg",
  },
  {
    id: "antares",
    name: "Antares",
    emoji: "❤",
    bestMonths: [5, 6, 7, 8],
    constellationHome: "Scorpius",
    distanceLy: "~550 light-years",
    spectralType: "M1.5 Iab",
    summary:
      "The red heart of Scorpius — a summer southern beacon rivaling Mars in color.",
    whenToLook:
      "Summer evenings low in the south for northern observers; high for southern skies.",
    facts: [
      "Name means “rival of Mars.”",
      "A red supergiant with a fainter hot companion.",
      "Sits near the Milky Way's rich southern star clouds.",
    ],
    image: "/moon/constellations/scorpius.jpg",
  },
  {
    id: "spica",
    name: "Spica",
    emoji: "🌾",
    bestMonths: [3, 4, 5, 6],
    constellationHome: "Virgo",
    distanceLy: "250 light-years",
    spectralType: "B1 III–IV + B2 V (binary)",
    summary:
      "Virgo's brilliant blue-white spike of wheat — a spring landmark on the ecliptic.",
    whenToLook:
      "Spring evenings; “spike to Spica” after arcing from the Big Dipper through Arcturus.",
    facts: [
      "Apparent magnitude about 0.97.",
      "A close binary of two hot massive stars.",
      "Often visited by the Moon and planets.",
    ],
    image: "/moon/constellations/ursa-major.jpg",
  },
];

/** Brightest featured star for the current night (season-weighted). */
export function todaysBrightStar(now = new Date()): NightStar {
  const month = now.getUTCMonth() + 1;
  const day = Math.floor(now.getTime() / 86_400_000);
  const inSeason = NIGHT_STARS.filter((s) => s.bestMonths.includes(month));
  const pool = inSeason.length ? inSeason : NIGHT_STARS;
  return pool[day % pool.length]!;
}

/** @deprecated Use NightStar / todaysBrightStar — kept for older imports. */
export type Constellation = NightStar;
/** @deprecated */
export const CONSTELLATIONS = NIGHT_STARS;
/** @deprecated */
export const todaysConstellation = todaysBrightStar;

/* ─── Planets ─── */

export type PlanetGuide = {
  id: string;
  name: string;
  emoji: string;
  type: string;
  summary: string;
  facts: string[];
};

export const PLANETS: PlanetGuide[] = [
  {
    id: "mercury",
    name: "Mercury",
    emoji: "☿️",
    type: "Rocky inner planet",
    summary: "The Sun's closest world — swift, cratered, and extreme in temperature.",
    facts: [
      "A year on Mercury is only 88 Earth days.",
      "It has almost no atmosphere to hold heat.",
      "Best seen in twilight, never far from the Sun in our sky.",
    ],
  },
  {
    id: "venus",
    name: "Venus",
    emoji: "♀️",
    type: "Rocky inner planet",
    summary: "Earth's cloudy twin — often the brightest planet after sunset or before sunrise.",
    facts: [
      "A runaway greenhouse makes its surface hotter than Mercury's.",
      "It rotates backwards compared with most planets.",
      "Thick clouds reflect sunlight, making it dazzling in our sky.",
    ],
  },
  {
    id: "earth",
    name: "Earth",
    emoji: "🌍",
    type: "Rocky inner planet",
    summary: "Our observatory's home — the only world known to host liquid-water oceans and life.",
    facts: [
      "Axial tilt of ~23.4° creates the seasons.",
      "The Moon stabilizes Earth's tilt over long timescales.",
      "From space, Earth shines blue-white from oceans and clouds.",
    ],
  },
  {
    id: "mars",
    name: "Mars",
    emoji: "♂️",
    type: "Rocky outer-inner planet",
    summary: "The red planet — deserts, volcanoes, polar ice, and a thin carbon-dioxide air.",
    facts: [
      "Olympus Mons is the Solar System's tallest volcano.",
      "A Martian day (sol) is about 24 hours 39 minutes.",
      "Appears distinctly orange-red to the naked eye at opposition.",
    ],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    emoji: "♃",
    type: "Gas giant",
    summary: "The giant of the Solar System — striped clouds and a family of many moons.",
    facts: [
      "More massive than all other planets combined.",
      "The Great Red Spot is a centuries-old storm.",
      "Four bright Galilean moons are binocular targets.",
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    emoji: "♄",
    type: "Gas giant",
    summary: "The ringed world — ice and rock particles circling in a thin, dazzling disk.",
    facts: [
      "Its rings are mostly water ice.",
      "Density is so low it would float in a (giant) bathtub of water.",
      "Titan has a thick atmosphere and liquid methane lakes.",
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    emoji: "♅",
    type: "Ice giant",
    summary: "A tipped-over ice giant — pale blue-green from methane in its atmosphere.",
    facts: [
      "Its axis is tilted about 98°, so it rolls on its side.",
      "Discovered by William Herschel in 1781.",
      "Needs binoculars or a telescope for most observers.",
    ],
  },
  {
    id: "neptune",
    name: "Neptune",
    emoji: "♆",
    type: "Ice giant",
    summary: "The farthest major planet — deep blue, windy, and home to Triton.",
    facts: [
      "Winds can exceed 1,000 mph in its atmosphere.",
      "Takes about 165 Earth years to orbit the Sun.",
      "Predicted mathematically before it was seen in 1846.",
    ],
  },
];

export function todaysPlanet(now = new Date()): PlanetGuide {
  const day = Math.floor(now.getTime() / 86_400_000);
  return PLANETS[day % PLANETS.length]!;
}

/* ─── Sky Calendar — real space events ─── */

export type SpaceEventKind =
  | "meteor-shower"
  | "lunar-eclipse"
  | "solar-eclipse"
  | "planet"
  | "other";

export type SpaceEvent = {
  id: string;
  title: string;
  kind: SpaceEventKind;
  /** Inclusive start date YYYY-MM-DD (UTC calendar day). */
  startDate: string;
  /** Inclusive end date YYYY-MM-DD. */
  endDate: string;
  peakNote?: string;
  body: string;
  emoji: string;
};

/**
 * Dated astronomy events (meteor peaks, eclipses, notable sky dates).
 * Times are calendar guides — always check a trusted ephemeris for your location.
 */
export const SPACE_EVENTS: SpaceEvent[] = [
  {
    id: "quadrantids-2026",
    title: "Quadrantid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-01-01",
    endDate: "2026-01-05",
    peakNote: "Peak night ~3–4 January 2026",
    body: "A brief but sometimes strong shower from an extinct comet. Best after midnight under dark skies.",
    emoji: "☄",
  },
  {
    id: "annular-solar-2026",
    title: "Annular solar eclipse",
    kind: "solar-eclipse",
    startDate: "2026-02-17",
    endDate: "2026-02-17",
    peakNote: "17 February 2026",
    body: "A “ring of fire” eclipse. Path crosses Antarctica and the southern ocean — most of Earth sees a partial eclipse only.",
    emoji: "☉",
  },
  {
    id: "total-lunar-2026-mar",
    title: "Total lunar eclipse",
    kind: "lunar-eclipse",
    startDate: "2026-03-02",
    endDate: "2026-03-03",
    peakNote: "3 March 2026 (UTC)",
    body: "The Full Moon passes through Earth's umbra and can turn copper-red. Safe to watch with the naked eye.",
    emoji: "🩸",
  },
  {
    id: "lyrids-2026",
    title: "Lyrid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-04-16",
    endDate: "2026-04-25",
    peakNote: "Peak ~22 April 2026",
    body: "Dust from comet Thatcher. Modest rates, but a reliable spring shower.",
    emoji: "☄",
  },
  {
    id: "eta-aquariids-2026",
    title: "Eta Aquariid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-04-19",
    endDate: "2026-05-28",
    peakNote: "Peak ~5–6 May 2026",
    body: "Halley's Comet debris — best before dawn, especially from southern and equatorial latitudes.",
    emoji: "☄",
  },
  {
    id: "perseids-2026",
    title: "Perseid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-07-17",
    endDate: "2026-08-24",
    peakNote: "Peak nights ~11–13 August 2026",
    body: "The year's favorite summer shower from comet Swift–Tuttle. Warm nights, fast bright meteors.",
    emoji: "☄",
  },
  {
    id: "partial-lunar-2026-aug",
    title: "Partial lunar eclipse",
    kind: "lunar-eclipse",
    startDate: "2026-08-28",
    endDate: "2026-08-28",
    peakNote: "28 August 2026",
    body: "Earth's shadow takes a bite from the Full Moon. No special filters needed.",
    emoji: "🌑",
  },
  {
    id: "orionids-2026",
    title: "Orionid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-10-02",
    endDate: "2026-11-07",
    peakNote: "Peak ~21–22 October 2026",
    body: "Another Halley stream. Swift meteors appear to radiate from Orion after midnight.",
    emoji: "☄",
  },
  {
    id: "leonids-2026",
    title: "Leonid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-11-06",
    endDate: "2026-11-30",
    peakNote: "Peak ~17–18 November 2026",
    body: "Fast meteors from comet Tempel–Tuttle. Most years are modest; historically capable of storms.",
    emoji: "☄",
  },
  {
    id: "geminids-2026",
    title: "Geminid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-12-04",
    endDate: "2026-12-17",
    peakNote: "Peak nights ~13–14 December 2026",
    body: "Often the richest reliable shower of the year — bright, medium-speed meteors from asteroid 3200 Phaethon.",
    emoji: "☄",
  },
  {
    id: "ursids-2026",
    title: "Ursid meteor shower",
    kind: "meteor-shower",
    startDate: "2026-12-17",
    endDate: "2026-12-26",
    peakNote: "Peak ~22–23 December 2026",
    body: "A quiet winter shower near Ursa Minor — worth a look under dark December skies.",
    emoji: "☄",
  },
  {
    id: "quadrantids-2027",
    title: "Quadrantid meteor shower",
    kind: "meteor-shower",
    startDate: "2027-01-01",
    endDate: "2027-01-05",
    peakNote: "Peak ~3–4 January 2027",
    body: "Sharp peak lasting only hours — dress warmly and watch after midnight.",
    emoji: "☄",
  },
  {
    id: "annular-solar-2027",
    title: "Annular solar eclipse",
    kind: "solar-eclipse",
    startDate: "2027-02-06",
    endDate: "2027-02-06",
    peakNote: "6 February 2027",
    body: "Ring-of-fire path across the South Pacific and southern South America. Elsewhere: partial phases only. Use proper solar filters.",
    emoji: "☉",
  },
  {
    id: "total-solar-2027",
    title: "Total solar eclipse",
    kind: "solar-eclipse",
    startDate: "2027-08-02",
    endDate: "2027-08-02",
    peakNote: "2 August 2027",
    body: "Totality crosses Spain, North Africa, and the Arabian Peninsula — one of the decade's great eclipse paths. Eye safety required for all partial phases.",
    emoji: "🌑",
  },
  {
    id: "perseids-2027",
    title: "Perseid meteor shower",
    kind: "meteor-shower",
    startDate: "2027-07-17",
    endDate: "2027-08-24",
    peakNote: "Peak nights ~11–13 August 2027",
    body: "Return of the August Perseids. Moonlight may interfere some years — still worth a late-night watch.",
    emoji: "☄",
  },
  {
    id: "geminids-2027",
    title: "Geminid meteor shower",
    kind: "meteor-shower",
    startDate: "2027-12-04",
    endDate: "2027-12-17",
    peakNote: "Peak nights ~13–14 December 2027",
    body: "December's reliable firework — often outshining the Perseids in raw rates.",
    emoji: "☄",
  },
  {
    id: "mars-opposition-note",
    title: "Planet-watching tip: oppositions",
    kind: "planet",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    peakNote: "Ongoing guide",
    body: "Outer planets (Mars, Jupiter, Saturn) are brightest and up all night near opposition — when Earth sits between them and the Sun. Check a planet almanac for the next exact date.",
    emoji: "🪐",
  },
];

function parseUtcDay(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y!, (m || 1) - 1, d || 1);
}

export function upcomingSpaceEvents(
  now = new Date(),
  limit = 8
): SpaceEvent[] {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const horizon = today + 400 * 86_400_000;
  return SPACE_EVENTS.filter((ev) => {
    const end = parseUtcDay(ev.endDate);
    const start = parseUtcDay(ev.startDate);
    return end >= today && start <= horizon;
  })
    .sort((a, b) => parseUtcDay(a.startDate) - parseUtcDay(b.startDate))
    .slice(0, limit);
}

export function spaceEventsHappeningNow(now = new Date()): SpaceEvent[] {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return SPACE_EVENTS.filter((ev) => {
    const start = parseUtcDay(ev.startDate);
    const end = parseUtcDay(ev.endDate);
    return start <= today && end >= today;
  });
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
    id: "starlight-thought",
    prompt: "What thought feels lighter under the stars?",
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
  {
    id: "sirius-fact",
    title: "The night's brightest star",
    category: "Stars",
    body: "Sirius outshines every other night-time star. It is a nearby binary only 8.6 light-years away — not a zodiac omen, just a brilliant neighbor.",
    emoji: "✦",
  },
  {
    id: "jupiter-moons",
    title: "Worlds around Jupiter",
    category: "Planets",
    body: "Io, Europa, Ganymede, and Callisto are easy binocular targets when Jupiter is up — real moons changing place night to night.",
    emoji: "♃",
  },
  {
    id: "saturn-rings",
    title: "Saturn's icy rings",
    category: "Planets",
    body: "Saturn's rings are countless ice particles in a thin disk — a backyard telescope reveals their shape on a steady night.",
    emoji: "♄",
  },
  {
    id: "meteor-speed",
    title: "Meteors are tiny",
    category: "Meteor showers",
    body: "Most shooting stars are grain-of-sand to pebble size, burning up as they hit the atmosphere at tens of kilometers per second.",
    emoji: "☄",
  },
];

export function todaysSkyFact(now = new Date()): SkyFact {
  const day = Math.floor(now.getTime() / 86_400_000);
  return SKY_FACTS[day % SKY_FACTS.length];
}

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
    image: "/moon/creatures/barn-owl.jpg",
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
    image: "/moon/creatures/potoo.jpg",
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
    image: "/moon/creatures/nightjar.jpg",
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
    image: "/moon/creatures/fireflies.jpg",
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
    image: "/moon/creatures/moths.jpg",
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
    image: "/moon/creatures/tree-frogs.jpg",
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
    image: "/moon/creatures/bats.jpg",
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
    image: "/moon/creatures/foxes.jpg",
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
    image: "/moon/creatures/hedgehogs.jpg",
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
    image: "/moon/playlists/gentle-rain.jpg",
  },
  {
    id: "forest-night",
    name: "Forest at Night",
    emoji: "🌲",
    mood: "Deep green hush",
    description: "Leaves, soft wind, and the far call of something kind.",
    listenFor: ["crickets", "branch creaks", "owl silence"],
    image: "/moon/playlists/forest-night.jpg",
  },
  {
    id: "campfire",
    name: "Crackling Campfire",
    emoji: "🔥",
    mood: "Amber comfort",
    description: "Embers talking softly while the lake stays still.",
    listenFor: ["snap of twigs", "low flame", "night air"],
    image: "/moon/playlists/campfire.jpg",
  },
  {
    id: "ocean-waves",
    name: "Ocean Waves",
    emoji: "🌊",
    mood: "Tidal calm",
    description: "Long breaths of water for drifting thoughts.",
    listenFor: ["slow breakers", "foam hush", "distant gull quiet"],
    image: "/moon/playlists/ocean-waves.jpg",
  },
  {
    id: "wind-trees",
    name: "Wind Through Trees",
    emoji: "🌬",
    mood: "Silver motion",
    description: "A night breeze combing pines along the dock.",
    listenFor: ["needle whisper", "soft sway", "open sky"],
    image: "/moon/playlists/wind-trees.jpg",
  },
  {
    id: "owls-calling",
    name: "Owls Calling",
    emoji: "🦉",
    mood: "Watchful peace",
    description: "Sparse hoots across a meadow of fog.",
    listenFor: ["far hoot", "grass hush", "moon stillness"],
    image: "/moon/playlists/owls-calling.jpg",
  },
  {
    id: "soft-piano",
    name: "Soft Piano",
    emoji: "🎹",
    mood: "Quiet wonder",
    description: "Sparse notes like stars appearing one by one.",
    listenFor: ["gentle keys", "long rests", "room reverb"],
    image: "/moon/playlists/soft-piano.jpg",
  },
  {
    id: "night-jazz",
    name: "Nighttime Jazz",
    emoji: "🎷",
    mood: "Velvet midnight",
    description: "Slow brass and brushed drums for late observatory hours.",
    listenFor: ["brushed snare", "warm bass", "muted horn"],
    image: "/moon/playlists/night-jazz.jpg",
  },
];

/* ─── Daily inspiration ─── */

export const QUOTE_POOL = [
  "Some answers only arrive after sunset.",
  "The quietest skies hold the brightest maps.",
  "You do not have to shine to belong among stars.",
  "Dreams are letters the night writes back.",
  "Still water remembers every bright star.",
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
  const brightStar = todaysBrightStar(now);
  const prompt = todaysJournalPrompt(now);
  const fact = todaysSkyFact(now);
  const creature = todaysCreature(now);
  const planet = todaysPlanet(now);
  return {
    moon,
    constellationId: brightStar.id,
    brightStarId: brightStar.id,
    planetId: planet.id,
    dreamPrompt: prompt,
    factId: fact.id,
    creatureId: creature.id,
    quote: QUOTE_POOL[day % QUOTE_POOL.length],
    reflection: REFLECTION_POOL[day % REFLECTION_POOL.length],
    skyColor: SKY_COLOR_POOL[day % SKY_COLOR_POOL.length],
  };
}
