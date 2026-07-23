/**
 * Woodland Workshop expansions — adventures, skills, DIY extras,
 * wildlife & flora field guides, weekly expeditions, collections,
 * and daily inspiration for Curaçao, Suriname, and the Netherlands.
 */

export type CountryTag = "Curaçao" | "Suriname" | "Netherlands";

export type AdventureItem = {
  id: string;
  label: string;
  emoji: string;
  hint: string;
};

export const WOODLAND_ADVENTURES: AdventureItem[] = [
  {
    id: "nearby-park",
    label: "Visit a nearby park",
    emoji: "🌳",
    hint: "Any green square counts — city park or village green.",
  },
  {
    id: "nature-reserve",
    label: "Explore a nature reserve",
    emoji: "🦌",
    hint: "Christoffel, Brownsberg, dunes, or a local woodland reserve.",
  },
  {
    id: "new-trail",
    label: "Walk a trail you've never walked before",
    emoji: "🥾",
    hint: "Even a short unfamiliar lane is an expedition.",
  },
  {
    id: "sunrise",
    label: "Watch the sunrise",
    emoji: "🌅",
    hint: "East-facing shore, dike, or balcony — arrive a little early.",
  },
  {
    id: "sunset",
    label: "Watch the sunset",
    emoji: "🌇",
    hint: "West coast glow, river light, or a quiet meadow.",
  },
  {
    id: "beach",
    label: "Visit a beach",
    emoji: "🏖",
    hint: "Caribbean cove, muddy river shore, or North Sea sand.",
  },
  {
    id: "river",
    label: "Visit a river",
    emoji: "🌊",
    hint: "Suriname rivers, Dutch canals, or a seasonal stream.",
  },
  {
    id: "mangrove",
    label: "Explore a mangrove",
    emoji: "🌿",
    hint: "Root forests of Curaçao & Suriname — tread lightly.",
  },
  {
    id: "listen-five",
    label: "Listen to nature for five minutes",
    emoji: "👂",
    hint: "No headphones. Just wind, water, insects, birds.",
  },
  {
    id: "interesting-rock",
    label: "Find an interesting rock",
    emoji: "🪨",
    hint: "Coral limestone, river stone, or a beach pebble.",
  },
  {
    id: "three-leaves",
    label: "Find three different leaves",
    emoji: "🍃",
    hint: "Shape, edge, and color — note them in your journal.",
  },
  {
    id: "photo-butterfly",
    label: "Photograph a butterfly",
    emoji: "🦋",
    hint: "Morning gardens and sunny paths are kinder to wings.",
  },
  {
    id: "photo-bird",
    label: "Photograph a bird",
    emoji: "🐦",
    hint: "Patience beats chase — wait where they already visit.",
  },
  {
    id: "draw-tree",
    label: "Draw a tree you like",
    emoji: "✏️",
    hint: "Divi-divi, mangrove, oak, or a lonely beach almond.",
  },
  {
    id: "walk-after-rain",
    label: "Walk after the rain",
    emoji: "🌧",
    hint: "Petrichor, shiny leaves, and louder frogs.",
  },
  {
    id: "watch-clouds",
    label: "Watch the clouds",
    emoji: "☁",
    hint: "Trade winds, thunderheads, or soft Dutch grey.",
  },
  {
    id: "picnic-outside",
    label: "Have a picnic outside",
    emoji: "🧺",
    hint: "Blanket optional. Bread and shade recommended.",
  },
  {
    id: "somewhere-new",
    label: "Explore somewhere new",
    emoji: "🗺",
    hint: "A street, cove, trailhead, or park corner you've skipped.",
  },
];

export type OutdoorSkill = {
  id: string;
  title: string;
  emoji: string;
  time: string;
  summary: string;
  steps: string[];
};

export const OUTDOOR_SKILLS: OutdoorSkill[] = [
  {
    id: "five-knots",
    title: "Learn five basic knots",
    emoji: "🪢",
    time: "30 min",
    summary: "Reef, bowline, clove hitch, sheet bend, and a simple stopper.",
    steps: [
      "Practice each knot slowly with soft rope or shoelace.",
      "Say the use out loud: reef for bundling, bowline for a fixed loop.",
      "Undo and remake until your hands remember without thinking.",
    ],
  },
  {
    id: "trail-map",
    title: "Read a simple trail map",
    emoji: "🗺",
    time: "20 min",
    summary: "Find north, paths, water, and where you stand.",
    steps: [
      "Orient the map so north matches the compass or the sun.",
      "Trace the trail with a finger before you walk.",
      "Mark landmarks: a bend, a bridge, a viewpoint.",
    ],
  },
  {
    id: "compass",
    title: "Learn how to use a compass",
    emoji: "🧭",
    time: "25 min",
    summary: "Needle, housing, and a bearing you can follow.",
    steps: [
      "Hold the compass flat until the needle settles.",
      "Turn the housing so N aligns with the red needle.",
      "Pick a distant landmark on your bearing and walk to it.",
    ],
  },
  {
    id: "daypack",
    title: "Pack a day-hiking backpack",
    emoji: "🎒",
    time: "15 min",
    summary: "Water, sun care, snack, light layer, and a way home.",
    steps: [
      "Pack water first — heat and humidity ask for more than you think.",
      "Add sunscreen, hat, light rain layer, and a small snack.",
      "Keep phone/map accessible; leave room for a found leaf or shell.",
    ],
  },
  {
    id: "leave-no-trace",
    title: "Learn Leave No Trace principles",
    emoji: "♻",
    time: "15 min",
    summary: "Take only photos, leave only footprints.",
    steps: [
      "Stay on paths where they exist — mangroves and dunes are fragile.",
      "Carry out every wrapper; never leave fruit peels as “natural.”",
      "Watch wildlife quietly; don’t chase, feed, or corner animals.",
    ],
  },
  {
    id: "cloud-types",
    title: "Identify common cloud types",
    emoji: "☁",
    time: "20 min",
    summary: "Cirrus, cumulus, stratus, and the stormy cumulonimbus.",
    steps: [
      "Look high and wispy — likely cirrus.",
      "Puffy cotton stacks are cumulus; flat grey sheets are stratus.",
      "Tall dark towers mean weather is changing — plan shade or shelter.",
    ],
  },
  {
    id: "local-trees",
    title: "Learn how to identify local trees",
    emoji: "🌳",
    time: "30 min",
    summary: "Leaf shape, bark, and silhouette tell the story.",
    steps: [
      "Pick one tree and note leaf shape, arrangement, and bark texture.",
      "Compare with the Plant & Tree Guide in this workshop.",
      "Sketch it once — drawing locks recognition better than photos alone.",
    ],
  },
  {
    id: "bird-watching",
    title: "Learn basic bird watching",
    emoji: "🔭",
    time: "25 min",
    summary: "Size, color, beak, and behavior before you name it.",
    steps: [
      "Start with silhouettes: hopping ground bird vs soaring vs hovering.",
      "Note colors in order: head, breast, back, legs.",
      "Listen first at dawn — many Caribbean and Dutch birds announce themselves.",
    ],
  },
  {
    id: "animal-tracks",
    title: "Recognize common animal tracks",
    emoji: "🐾",
    time: "20 min",
    summary: "Mud, sand, and soft soil keep the best signatures.",
    steps: [
      "Look near water edges after rain or tide.",
      "Count toes and notice claw marks vs soft pads.",
      "Photograph beside a coin or leaf for scale — never disturb a nest.",
    ],
  },
  {
    id: "outdoor-safety",
    title: "Learn outdoor safety basics",
    emoji: "🛡",
    time: "20 min",
    summary: "Tell someone, carry water, respect heat and tides.",
    steps: [
      "Share your plan and return time with a friend.",
      "In tropical heat: shade breaks, more water, lighter clothing.",
      "Check tides for beaches; watch for uneven roots in mangroves.",
    ],
  },
  {
    id: "dress-weather",
    title: "Learn how to dress for changing weather",
    emoji: "🧥",
    time: "15 min",
    summary: "Layers win — sun, wind, sudden showers.",
    steps: [
      "Base layer that breathes; a light cover for wind or AC buses.",
      "Sun hat and sleeves for Caribbean noon; warmer midlayer for Dutch dusk.",
      "A packable rain shell fits almost any climate between these three countries.",
    ],
  },
];

export type DiyProject = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  time: string;
  materials: string[];
  instructions: string[];
  /** Optional photo path — falls back to craft art or parchment plate */
  image?: string;
};

/** Safe outdoor-inspired DIY (no weapons / dangerous tools). */
export const WOODLAND_DIY: DiyProject[] = [
  {
    id: "bird-feeder",
    title: "Build a bird feeder",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Pinecone or wood scrap", "Nut butter", "Birdseed", "String"],
    instructions: [
      "Coat the pinecone with nut butter.",
      "Roll in seed and tie with string.",
      "Hang from a branch and wait quietly.",
    ],
    image: "/workshop/crafts/bird-feeder.jpg",
  },
  {
    id: "pinecone-snack",
    title: "Make a pinecone bird snack",
    difficulty: "Easy",
    time: "20 min",
    materials: ["Pinecone", "Seed mix", "Soft spread", "Twine"],
    instructions: [
      "Fill the pinecone gaps with a soft spread.",
      "Press seeds into every gap.",
      "Hang where cats cannot reach.",
    ],
    image: "/workshop/crafts/paint-pinecones.jpg",
  },
  {
    id: "flower-bookmarks",
    title: "Press flowers into bookmarks",
    difficulty: "Easy",
    time: "45 min + drying",
    materials: ["Fresh blossoms", "Heavy books", "Cardstock", "Twine"],
    instructions: [
      "Arrange petals between parchment sheets.",
      "Press under books for several days.",
      "Glue onto cardstock strips and bind with twine.",
    ],
    image: "/workshop/crafts/flower-bookmarks.jpg",
  },
  {
    id: "leaf-rubbings",
    title: "Make leaf rubbings",
    difficulty: "Easy",
    time: "20 min",
    materials: ["Leaves", "Thin paper", "Crayon or soft pencil"],
    instructions: [
      "Place a leaf under paper, vein side up.",
      "Rub gently with the side of a crayon.",
      "Label the species if you know it.",
    ],
    image: "/workshop/crafts/press-wildflowers.jpg",
  },
  {
    id: "decorate-stones",
    title: "Decorate smooth stones",
    difficulty: "Easy",
    time: "30 min",
    materials: ["Smooth stones", "Acrylic paint", "Sealant"],
    instructions: [
      "Wash and dry the stones.",
      "Paint tiny woodland motifs.",
      "Seal and return one kindness stone to a path.",
    ],
  },
  {
    id: "nature-journal",
    title: "Create a nature journal",
    difficulty: "Easy",
    time: "40 min",
    materials: ["Blank notebook", "Pencil", "Glue stick", "Found scraps"],
    instructions: [
      "Decorate the cover with a leaf rubbing or map scrap.",
      "Rule a few pages: date, place, weather, discoveries.",
      "Leave room for sketches beside notes.",
    ],
    image: "/workshop/crafts/homemade-paper.jpg",
  },
  {
    id: "twig-frame",
    title: "Make a twig picture frame",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Straight twigs", "Twine", "Cardboard backing"],
    instructions: [
      "Cut four twigs to size.",
      "Lash the corners with twine.",
      "Tape a sketch or photo to the backing.",
    ],
    image: "/workshop/crafts/twig-frame.jpg",
  },
  {
    id: "fairy-fence",
    title: "Build a tiny fairy-sized fence",
    difficulty: "Easy",
    time: "35 min",
    materials: ["Twigs", "Twine", "Moss"],
    instructions: [
      "Cut equal mini posts.",
      "Lash horizontal rails with soft twine.",
      "Tuck moss at the base outdoors or on a shelf.",
    ],
    image: "/workshop/crafts/fairy-door.jpg",
  },
  {
    id: "stick-furniture",
    title: "Create miniature stick furniture",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Twigs", "Hot glue or twine", "Tiny fabric scrap"],
    instructions: [
      "Build a chair or bench from short sticks.",
      "Secure joints carefully — adult help with glue if needed.",
      "Add a fabric scrap cushion for charm.",
    ],
    image: "/workshop/crafts/fairy-garden.jpg",
  },
  {
    id: "grass-bracelet",
    title: "Make a grass bracelet",
    difficulty: "Easy",
    time: "15 min",
    materials: ["Long soft grass or raffia"],
    instructions: [
      "Braid three strands loosely.",
      "Tie with a gentle knot that won’t cut skin.",
      "Wear for the walk, then compost or keep as a bookmark.",
    ],
  },
  {
    id: "walking-charm",
    title: "Make a walking stick charm",
    difficulty: "Easy",
    time: "25 min",
    materials: ["Found stick", "Yarn or twine", "Bead or shell"],
    instructions: [
      "Choose a sturdy fallen stick — never break living wood.",
      "Wrap a colorful band near the top.",
      "Tie on a shell, bead, or tiny bell.",
    ],
  },
  {
    id: "woodland-mobile",
    title: "Create a woodland mobile",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Branch", "Twine", "Leaves / feathers / paper cutouts"],
    instructions: [
      "Hang a Y-shaped branch horizontally.",
      "Tie lightweight finds at different lengths.",
      "Balance until it turns in a soft breeze.",
    ],
    image: "/workshop/crafts/lavender-sachet.jpg",
  },
  {
    id: "twig-raft",
    title: "Build a tiny twig raft",
    difficulty: "Easy",
    time: "30 min",
    materials: ["Straight twigs", "Twine", "Shallow dish of water"],
    instructions: [
      "Bundle twigs side by side.",
      "Lash both ends firmly.",
      "Float it in a bowl — celebrate shipwright status.",
    ],
  },
  {
    id: "paint-acorns",
    title: "Paint acorns",
    difficulty: "Easy",
    time: "30 min",
    materials: ["Acorns or seed pods", "Paint", "Fine brush"],
    instructions: [
      "Wipe clean and dry.",
      "Paint tiny patterns.",
      "Display in a dish (or use beach almonds / pods if acorns are scarce).",
    ],
    image: "/workshop/crafts/paint-acorns.jpg",
  },
  {
    id: "nature-stamps",
    title: "Make nature stamps",
    difficulty: "Easy",
    time: "25 min",
    materials: ["Leaves or carved potato", "Paint", "Paper"],
    instructions: [
      "Brush a thin coat of paint on a leaf underside.",
      "Press onto paper and lift carefully.",
      "Repeat into a patterned page for your journal.",
    ],
    image: "/workshop/crafts/press-wildflowers.jpg",
  },
  {
    id: "bark-texture",
    title: "Create bark texture art",
    difficulty: "Easy",
    time: "20 min",
    materials: ["Paper", "Crayon", "Tree trunk access"],
    instructions: [
      "Hold paper against bark (without harming the tree).",
      "Rub with the side of a crayon.",
      "Label the tree species if you can.",
    ],
  },
  {
    id: "bug-hotel",
    title: "Build a bug hotel",
    difficulty: "Medium",
    time: "1–2 hours",
    materials: ["Wood scraps or tin can", "Hollow stems", "Dry leaves", "Twine"],
    instructions: [
      "Fill a container with bamboo pieces, stems, and dry material.",
      "Place in a quiet sheltered corner.",
      "Watch from a distance — hotels are for insects, not handling.",
    ],
    image: "/workshop/crafts/moss-terrarium.jpg",
  },
  {
    id: "rain-gauge",
    title: "Make a simple rain gauge",
    difficulty: "Easy",
    time: "20 min",
    materials: ["Clear jar", "Ruler marks or tape", "Open outdoor spot"],
    instructions: [
      "Mark centimeters on the jar with tape.",
      "Set it level in the open, away from roof drip.",
      "Check after rain and record the depth in your journal.",
    ],
  },
  {
    id: "mini-village",
    title: "Build a miniature woodland village",
    difficulty: "Medium",
    time: "1–2 hours",
    materials: ["Twigs", "Moss", "Stones", "Seed pods", "Tray"],
    instructions: [
      "Arrange paths with sand or paper.",
      "Build tiny houses from bark and twigs.",
      "Add moss gardens — photograph your village for the journal.",
    ],
    image: "/workshop/crafts/fairy-garden.jpg",
  },
];

export type WildlifeEntry = {
  id: string;
  name: string;
  emoji: string;
  habitat: string;
  facts: string[];
  bestTime: string;
  countries: CountryTag[];
  image: string;
};

export const LOCAL_WILDLIFE: WildlifeEntry[] = [
  {
    id: "bananaquit",
    name: "Bananaquit",
    emoji: "🐤",
    habitat: "Gardens, scrub, and flowering trees",
    facts: [
      "A tiny nectar-lover with a curved bill and bright yellow belly.",
      "Often visits balconies and bird feeders in Curaçao.",
    ],
    bestTime: "Morning in flowering gardens",
    countries: ["Curaçao", "Suriname"],
    image: "/workshop/wildlife/bananaquit.jpg",
  },
  {
    id: "troupial",
    name: "Troupial",
    emoji: "🧡",
    habitat: "Dry scrub, parks, and coastal thickets",
    facts: [
      "Curaçao’s national bird — bold orange and black.",
      "Known for a clear, whistling song.",
    ],
    bestTime: "Early morning on open scrub edges",
    countries: ["Curaçao"],
    image: "/workshop/wildlife/troupial.jpg",
  },
  {
    id: "scarlet-ibis",
    name: "Scarlet Ibis",
    emoji: "🦩",
    habitat: "Coastal mudflats, mangroves, and wetlands",
    facts: [
      "Brilliant red plumage comes from a diet rich in crustaceans.",
      "Often seen in flocks at dusk in Suriname’s coastal zones.",
    ],
    bestTime: "Late afternoon near mangroves and mudflats",
    countries: ["Suriname"],
    image: "/workshop/wildlife/scarlet-ibis.jpg",
  },
  {
    id: "green-iguana",
    name: "Green Iguana",
    emoji: "🦎",
    habitat: "Trees near water, gardens, and rocky coasts",
    facts: [
      "Excellent climbers that bask to warm up.",
      "Mostly herbivorous — leaves, flowers, and fruit.",
    ],
    bestTime: "Sunny mid-mornings on warm rocks or branches",
    countries: ["Curaçao", "Suriname"],
    image: "/workshop/wildlife/green-iguana.jpg",
  },
  {
    id: "agouti",
    name: "Agouti",
    emoji: "🐾",
    habitat: "Forest floor and garden edges",
    facts: [
      "Shy seed-dispersers that help forests regenerate.",
      "Often heard before they’re seen — a soft rustle in leaf litter.",
    ],
    bestTime: "Quiet dawn or dusk forest edges",
    countries: ["Suriname"],
    image: "/workshop/wildlife/agouti.jpg",
  },
  {
    id: "armadillo",
    name: "Nine-banded Armadillo",
    emoji: "🛡",
    habitat: "Forest edges, fields, and soft soils",
    facts: [
      "Digs for insects with strong claws.",
      "Mostly nocturnal — look for tracks and burrows by day.",
    ],
    bestTime: "Night walks with a red-light torch (where allowed)",
    countries: ["Suriname"],
    image: "/workshop/wildlife/armadillo.jpg",
  },
  {
    id: "european-robin",
    name: "European Robin",
    emoji: "❤️",
    habitat: "Gardens, hedges, and woodland edges",
    facts: [
      "Bold around gardeners — often follows for turned soil.",
      "A classic Dutch winter companion with an orange breast.",
    ],
    bestTime: "Morning gardens year-round; especially autumn–spring",
    countries: ["Netherlands"],
    image: "/workshop/wildlife/european-robin.jpg",
  },
  {
    id: "red-squirrel",
    name: "Red Squirrel",
    emoji: "🐿",
    habitat: "Pine woods, parks, and mixed forests",
    facts: [
      "Tufted ears and a bushy tail for balance.",
      "Caches nuts — watch them bury treasures in autumn.",
    ],
    bestTime: "Morning in quiet parks and pine stands",
    countries: ["Netherlands"],
    image: "/workshop/wildlife/red-squirrel.jpg",
  },
  {
    id: "hedgehog",
    name: "Hedgehog",
    emoji: "🦔",
    habitat: "Gardens, hedges, and leaf piles",
    facts: [
      "Night foragers that love insects and worms.",
      "Leave a gap in fences and a shallow water dish to help them.",
    ],
    bestTime: "Warm evenings from spring through autumn",
    countries: ["Netherlands"],
    image: "/workshop/wildlife/hedgehog.jpg",
  },
];

export type FloraEntry = {
  id: string;
  name: string;
  emoji: string;
  habitat: string;
  recognize: string;
  facts: string[];
  countries: CountryTag[];
  image: string;
};

export const PLANT_TREE_GUIDE: FloraEntry[] = [
  {
    id: "divi-divi",
    name: "Divi-divi",
    emoji: "🌳",
    habitat: "Windy coastal plains and dry scrub",
    recognize: "Iconic windswept lean — umbrella of leaves pointing away from trade winds.",
    facts: [
      "A living compass of Curaçao’s breeze.",
      "Pods were once used in tanning and ink-making.",
    ],
    countries: ["Curaçao"],
    image: "/workshop/flora/divi-divi.jpg",
  },
  {
    id: "mangrove",
    name: "Mangrove",
    emoji: "🌿",
    habitat: "Tidal shores, lagoons, and river mouths",
    recognize: "Tangled prop roots in brackish water; dense green canopy above.",
    facts: [
      "Nurseries for fish and shields against shore erosion.",
      "Walk boardwalks where provided — roots are living armor.",
    ],
    countries: ["Curaçao", "Suriname"],
    image: "/workshop/flora/mangrove.jpg",
  },
  {
    id: "sea-grape",
    name: "Sea Grape",
    emoji: "🍇",
    habitat: "Beaches and coastal dunes",
    recognize: "Large round leathery leaves with red veins; grape-like clusters.",
    facts: [
      "Fruit ripens to purple and feeds birds and people.",
      "Excellent shade tree for hot shoreline walks.",
    ],
    countries: ["Curaçao", "Suriname"],
    image: "/workshop/flora/sea-grape.jpg",
  },
  {
    id: "kapok",
    name: "Kapok Tree",
    emoji: "🌲",
    habitat: "Rainforest and riverine forest",
    recognize: "Towering trunk with buttress roots; cottony seed pods high above.",
    facts: [
      "One of the giants of Suriname’s canopy.",
      "Fibers from pods were historically used for stuffing pillows.",
    ],
    countries: ["Suriname"],
    image: "/workshop/flora/kapok.jpg",
  },
  {
    id: "oak",
    name: "Oak",
    emoji: "🌰",
    habitat: "Woodlands, parks, and estates",
    recognize: "Lobed leaves and acorns; sturdy branching crown.",
    facts: [
      "Supports huge numbers of insects — and therefore birds.",
      "A slow grower that can outlive many human generations.",
    ],
    countries: ["Netherlands"],
    image: "/workshop/flora/oak.jpg",
  },
  {
    id: "beech",
    name: "Beech",
    emoji: "🍃",
    habitat: "Cool forests and grand avenues",
    recognize: "Smooth grey bark; oval leaves with wavy edges.",
    facts: [
      "Autumn turns the canopy copper and gold.",
      "Dense shade below — look for soft leaf litter carpets.",
    ],
    countries: ["Netherlands"],
    image: "/workshop/flora/beech.jpg",
  },
  {
    id: "pine",
    name: "Pine",
    emoji: "🌲",
    habitat: "Sandy soils, dunes, and planted woods",
    recognize: "Needles in bundles; cones; resinous scent after rain.",
    facts: [
      "Common in Dutch dune landscapes.",
      "Listen for wind-hiss through the needles — a soft forest radio.",
    ],
    countries: ["Netherlands"],
    image: "/workshop/flora/pine.jpg",
  },
  {
    id: "ferns",
    name: "Ferns",
    emoji: "🌱",
    habitat: "Shady banks, rainforest understory, damp walls",
    recognize: "Fronds unfurl like scrolls; no flowers — spores underneath.",
    facts: [
      "Ancient plants that thrive in humid Suriname forests and Dutch shade.",
      "Perfect subjects for leaf rubbings.",
    ],
    countries: ["Suriname", "Netherlands", "Curaçao"],
    image: "/workshop/flora/ferns.jpg",
  },
  {
    id: "wildflowers",
    name: "Wildflowers",
    emoji: "🌼",
    habitat: "Meadows, roadsides, dune edges, and garden verges",
    recognize: "Seasonal color in open sun — look for clusters rather than single stems.",
    facts: [
      "Pollinator highways between villages.",
      "Press a few (where allowed) for bookmarks — leave most for bees.",
    ],
    countries: ["Netherlands", "Curaçao", "Suriname"],
    image: "/workshop/flora/wildflowers.jpg",
  },
];

export type Expedition = {
  id: string;
  title: string;
  emoji: string;
  challenge: string;
  detail: string;
};

export const WEEKLY_EXPEDITIONS: Expedition[] = [
  {
    id: "nature-photographer",
    title: "Nature Photographer",
    emoji: "🌿",
    challenge: "Find and photograph five different shades of green.",
    detail: "Moss, leaf, sea, shutter, paint — green is never only one color.",
  },
  {
    id: "butterfly-watch",
    title: "Butterfly Watch",
    emoji: "🦋",
    challenge: "Photograph or observe three butterflies.",
    detail: "Note wing patterns; stay still and let them choose you.",
  },
  {
    id: "coastal-explorer",
    title: "Coastal Explorer",
    emoji: "🌊",
    challenge: "Spend thirty minutes exploring a beach or shoreline.",
    detail: "River mud, Caribbean cove, or North Sea tide — all count.",
  },
  {
    id: "tree-friend",
    title: "Tree Friend",
    emoji: "🌳",
    challenge: "Find your favorite tree and sketch it.",
    detail: "Sit long enough to notice bark, light, and visiting insects.",
  },
  {
    id: "cloud-watcher",
    title: "Cloud Watcher",
    emoji: "☁",
    challenge: "Watch the clouds for ten minutes and describe what you see.",
    detail: "Shapes, speed, color — write three sentences afterward.",
  },
  {
    id: "early-bird",
    title: "Early Bird",
    emoji: "🐦",
    challenge: "Wake up early and listen for birds at sunrise.",
    detail: "No need to name them — list the sounds like a playlist.",
  },
];

export const EXPLORER_PROMPTS = [
  "Where did you explore today?",
  "What surprised you?",
  "What animal did you see?",
  "What sound did you notice?",
  "What would you like to explore next?",
  "What was your favorite discovery?",
] as const;

export type DiscoveryCollection = {
  id: string;
  title: string;
  emoji: string;
  goal: number;
  blurb: string;
};

export const DISCOVERY_COLLECTIONS: DiscoveryCollection[] = [
  {
    id: "birds",
    title: "Bird Collection",
    emoji: "🐦",
    goal: 5,
    blurb: "Log distinct birds you notice — curiosity, not competition.",
  },
  {
    id: "butterflies",
    title: "Butterfly Collection",
    emoji: "🦋",
    goal: 4,
    blurb: "Each soft landing is a stamp in your mental field guide.",
  },
  {
    id: "trees",
    title: "Trees Collection",
    emoji: "🌳",
    goal: 5,
    blurb: "Meet trees by silhouette, leaf, and shade.",
  },
  {
    id: "leaves",
    title: "Leaves Collection",
    emoji: "🍃",
    goal: 6,
    blurb: "Shapes and edges — press or sketch your favorites.",
  },
  {
    id: "shells",
    title: "Shell Collection",
    emoji: "🐚",
    goal: 4,
    blurb: "Shore finds only — leave living creatures on the beach.",
  },
  {
    id: "animals",
    title: "Animal Collection",
    emoji: "🐾",
    goal: 4,
    blurb: "Mammals, reptiles, or tracks that tell a story.",
  },
  {
    id: "clouds",
    title: "Cloud Collection",
    emoji: "☁",
    goal: 4,
    blurb: "Name the mood of the sky on different days.",
  },
  {
    id: "rocks",
    title: "Rock Collection",
    emoji: "🪨",
    goal: 5,
    blurb: "Texture, color, and the place you found them.",
  },
  {
    id: "trails",
    title: "Trail Collection",
    emoji: "🥾",
    goal: 4,
    blurb: "Paths walked — new or rediscovered.",
  },
];

export type DailyInspiration = {
  adventure: string;
  animalId: string;
  plantId: string;
  skillId: string;
  diyId: string;
  journalPrompt: string;
  quote: string;
  natureFact: string;
};

const INSPIRATION_QUOTES = [
  "The forest does not hurry, yet everything is accomplished.",
  "Close the laptop. The trail keeps no notifications.",
  "Notice one wild thing today and it will notice you back.",
  "A small walk can hold a large story.",
  "Moss remembers rain longer than we remember errands.",
  "Maps are invitations, not obligations.",
  "Bring curiosity; leave only footprints.",
  "The best field guide is a quiet pair of eyes.",
];

const NATURE_FACTS = [
  "Mangrove roots can filter salt — living desalination for the shore.",
  "European robins often hold tiny territories year-round in gardens.",
  "Divi-divi trees lean with the trade winds like green weather vanes.",
  "Scarlet ibises get their color from the shrimp and crabs they eat.",
  "Beech leaves take a long time to compost — soft carpets last all winter.",
  "Bananaquits can hover briefly while sipping nectar.",
  "Leave No Trace began as a kindness to places that cannot speak.",
  "Cloud watching trains the same attention used in birding.",
];

export function dayIndex(length: number, now = new Date()) {
  if (length <= 0) return 0;
  return Math.floor(now.getTime() / 86_400_000) % length;
}

export function featuredExpedition(now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  const week = Math.floor(day / 7);
  return WEEKLY_EXPEDITIONS[week % WEEKLY_EXPEDITIONS.length];
}

export function todaysWoodlandInspiration(now = new Date()): DailyInspiration {
  const d = Math.floor(now.getTime() / 86_400_000);
  return {
    adventure:
      WOODLAND_ADVENTURES[d % WOODLAND_ADVENTURES.length].label,
    animalId: LOCAL_WILDLIFE[d % LOCAL_WILDLIFE.length].id,
    plantId: PLANT_TREE_GUIDE[d % PLANT_TREE_GUIDE.length].id,
    skillId: OUTDOOR_SKILLS[d % OUTDOOR_SKILLS.length].id,
    diyId: WOODLAND_DIY[d % WOODLAND_DIY.length].id,
    journalPrompt: EXPLORER_PROMPTS[d % EXPLORER_PROMPTS.length],
    quote: INSPIRATION_QUOTES[d % INSPIRATION_QUOTES.length],
    natureFact: NATURE_FACTS[d % NATURE_FACTS.length],
  };
}
