export type Difficulty = "Easy" | "Medium" | "Hard";

export type WorkshopTabId =
  | "craft"
  | "kitchen"
  | "prompt"
  | "quest"
  | "grow"
  | "birds"
  | "journal";

export const WORKSHOP_TABS: Array<{
  id: WorkshopTabId;
  label: string;
  emoji: string;
}> = [
  { id: "craft", label: "Weekly Craft", emoji: "🌿" },
  { id: "kitchen", label: "Cozy Kitchen", emoji: "🍪" },
  { id: "prompt", label: "Creative Prompt", emoji: "🎨" },
  { id: "quest", label: "Woodland Quest", emoji: "📷" },
  { id: "grow", label: "Grow Something", emoji: "🌱" },
  { id: "birds", label: "Bird Watch", emoji: "🐦" },
  { id: "journal", label: "Craft Journal", emoji: "📖" },
];

export const WORKSHOP_XP = {
  craft: 100,
  recipe: 75,
  prompt: 50,
  questItem: 40,
  bird: 20,
  growWeek: 30,
  growComplete: 80,
  seasonal: 60,
  journal: 25,
} as const;

export const WORKSHOP_TITLES = [
  { minXp: 0, title: "Tiny Sapling", emoji: "🌱" },
  { minXp: 150, title: "Forest Friend", emoji: "🍃" },
  { minXp: 400, title: "Craft Apprentice", emoji: "🧵" },
  { minXp: 800, title: "Woodland Artisan", emoji: "🪵" },
  { minXp: 1400, title: "Master of Bramblewood", emoji: "🦊" },
] as const;

export type CraftItem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  time: string;
  materials: string[];
  instructions: string[];
  image: string;
};

export const CRAFTS: CraftItem[] = [
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
    id: "fairy-door",
    title: "Make a tiny fairy door",
    difficulty: "Medium",
    time: "1–2 hours",
    materials: ["Balsa wood or cardboard", "Acrylic paint", "Moss", "Tiny knob"],
    instructions: [
      "Cut a rounded door shape.",
      "Paint with soft woodland colors.",
      "Glue moss and a bead knob, then lean it at a tree base.",
    ],
    image: "/workshop/crafts/fairy-door.jpg",
  },
  {
    id: "paint-acorns",
    title: "Paint acorns",
    difficulty: "Easy",
    time: "30 min",
    materials: ["Acorns", "Paint", "Fine brush", "Clear sealant"],
    instructions: [
      "Wipe acorns clean and dry.",
      "Paint tiny patterns or faces.",
      "Seal lightly and display in a dish.",
    ],
    image: "/workshop/crafts/paint-acorns.jpg",
  },
  {
    id: "bird-feeder",
    title: "Build a bird feeder",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Pinecone or wood scrap", "Peanut butter", "Birdseed", "String"],
    instructions: [
      "Coat the pinecone with peanut butter.",
      "Roll in seed and tie with string.",
      "Hang from a branch and wait quietly.",
    ],
    image: "/workshop/crafts/bird-feeder.jpg",
  },
  {
    id: "flower-pot",
    title: "Decorate a flower pot",
    difficulty: "Easy",
    time: "40 min",
    materials: ["Clay pot", "Paint", "Pressed leaves", "Mod podge"],
    instructions: [
      "Paint a soft base color.",
      "Add leaf prints or tiny mushrooms.",
      "Seal and pot a small herb.",
    ],
    image: "/workshop/crafts/flower-pot.jpg",
  },
  {
    id: "beeswax-candles",
    title: "Make beeswax candles",
    difficulty: "Hard",
    time: "2 hours",
    materials: ["Beeswax", "Wicks", "Molds", "Essential oil"],
    instructions: [
      "Melt wax gently over low heat.",
      "Secure wicks in molds and pour.",
      "Cool fully, then trim and light with care.",
    ],
    image: "/workshop/crafts/beeswax-candles.jpg",
  },
  {
    id: "lavender-sachet",
    title: "Sew a lavender sachet",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Fabric scrap", "Dried lavender", "Needle", "Thread"],
    instructions: [
      "Cut two small squares of fabric.",
      "Sew three sides, fill with lavender, close the last edge.",
      "Tuck into a drawer or letter satchel.",
    ],
    image: "/workshop/crafts/lavender-sachet.jpg",
  },
  {
    id: "moss-terrarium",
    title: "Make a moss terrarium",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Glass jar", "Pebbles", "Soil", "Moss", "Tiny figurine"],
    instructions: [
      "Layer pebbles, soil, then moss.",
      "Mist lightly and add a tiny companion.",
      "Keep in soft light and watch it settle.",
    ],
    image: "/workshop/crafts/moss-terrarium.jpg",
  },
  {
    id: "homemade-paper",
    title: "Create homemade paper",
    difficulty: "Hard",
    time: "3 hours",
    materials: ["Scrap paper", "Blender", "Screen", "Pressed petals"],
    instructions: [
      "Soak and blend scrap paper into pulp.",
      "Pour over a screen and press out water.",
      "Scatter petals and dry flat overnight.",
    ],
    image: "/workshop/crafts/homemade-paper.jpg",
  },
  {
    id: "fairy-garden",
    title: "Build a miniature fairy garden",
    difficulty: "Medium",
    time: "2 hours",
    materials: ["Shallow dish", "Soil", "Moss", "Twigs", "Tiny stones"],
    instructions: [
      "Fill the dish with soil and moss paths.",
      "Build a twig arch and pebble benches.",
      "Place where morning light can find it.",
    ],
    image: "/workshop/crafts/fairy-garden.jpg",
  },
  {
    id: "paint-pinecones",
    title: "Paint pinecones",
    difficulty: "Easy",
    time: "35 min",
    materials: ["Pinecones", "Paint", "Brush", "Newspaper"],
    instructions: [
      "Shake dust from pinecones outdoors.",
      "Dry-brush tips with soft color.",
      "Let dry, then arrange in a bowl.",
    ],
    image: "/workshop/crafts/paint-pinecones.jpg",
  },
  {
    id: "press-wildflowers",
    title: "Press wildflowers",
    difficulty: "Easy",
    time: "20 min + drying",
    materials: ["Wildflowers", "Paper", "Heavy books"],
    instructions: [
      "Pick only what you need, leave roots.",
      "Press between paper under books.",
      "Wait patiently, then frame or journal them.",
    ],
    image: "/workshop/crafts/press-wildflowers.jpg",
  },
  {
    id: "twig-frame",
    title: "Twig picture frame",
    difficulty: "Medium",
    time: "1 hour",
    materials: ["Twigs", "Twine", "Glue", "Photo or sketch"],
    instructions: [
      "Bundle twigs into a rectangle.",
      "Bind corners with twine.",
      "Mount a photo or watercolor behind.",
    ],
    image: "/workshop/crafts/twig-frame.jpg",
  },
  {
    id: "clay-mushrooms",
    title: "Clay mushrooms",
    difficulty: "Easy",
    time: "50 min",
    materials: ["Air-dry clay", "Paint", "Toothpick", "Sealant"],
    instructions: [
      "Shape caps and stems from clay.",
      "Add dots with a toothpick tip.",
      "Dry, paint, and seal gently.",
    ],
    image: "/workshop/crafts/clay-mushrooms.jpg",
  },
];

export type RecipeItem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  time: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  badge: string;
};

export const RECIPES: RecipeItem[] = [
  {
    id: "apple-crumble",
    title: "Apple Crumble",
    difficulty: "Easy",
    time: "55 min",
    ingredients: ["Apples", "Sugar", "Cinnamon", "Butter", "Oats", "Flour"],
    instructions: [
      "Toss sliced apples with sugar and cinnamon.",
      "Rub butter into oats and flour for topping.",
      "Bake until bubbling and golden.",
    ],
    image: "/workshop/recipes/apple-crumble.jpg",
    badge: "Orchard Baker",
  },
  {
    id: "cinnamon-rolls",
    title: "Cinnamon Rolls",
    difficulty: "Hard",
    time: "2.5 hours",
    ingredients: ["Flour", "Yeast", "Milk", "Butter", "Brown sugar", "Cinnamon"],
    instructions: [
      "Make a soft enriched dough and let it rise.",
      "Spread butter, sugar, and cinnamon; roll and slice.",
      "Bake and glaze while warm.",
    ],
    image: "/workshop/recipes/cinnamon-rolls.jpg",
    badge: "Hearth Roll Baker",
  },
  {
    id: "lavender-cookies",
    title: "Lavender Cookies",
    difficulty: "Easy",
    time: "40 min",
    ingredients: ["Butter", "Sugar", "Flour", "Dried lavender", "Egg"],
    instructions: [
      "Cream butter and sugar with crushed lavender.",
      "Mix in flour and chill briefly.",
      "Bake until just golden at the edges.",
    ],
    image: "/workshop/recipes/lavender-cookies.jpg",
    badge: "Lavender Baker",
  },
  {
    id: "honey-oat-biscuits",
    title: "Honey Oat Biscuits",
    difficulty: "Easy",
    time: "35 min",
    ingredients: ["Oats", "Honey", "Butter", "Flour", "Pinch of salt"],
    instructions: [
      "Melt butter with honey.",
      "Stir in oats and flour.",
      "Scoop and bake until firm.",
    ],
    image: "/workshop/recipes/honey-oat-biscuits.jpg",
    badge: "Honey Keeper",
  },
  {
    id: "hot-chocolate",
    title: "Hot Chocolate",
    difficulty: "Easy",
    time: "15 min",
    ingredients: ["Milk", "Cocoa", "Sugar", "Vanilla", "Pinch of salt"],
    instructions: [
      "Warm milk gently.",
      "Whisk in cocoa, sugar, and vanilla.",
      "Serve in your favorite mug.",
    ],
    image: "/workshop/recipes/hot-chocolate.jpg",
    badge: "Mug Warmth",
  },
  {
    id: "pumpkin-soup",
    title: "Pumpkin Soup",
    difficulty: "Medium",
    time: "50 min",
    ingredients: ["Pumpkin", "Onion", "Broth", "Cream", "Sage"],
    instructions: [
      "Sauté onion, then simmer pumpkin in broth.",
      "Blend smooth and finish with cream and sage.",
      "Taste for salt and serve warm.",
    ],
    image: "/workshop/recipes/pumpkin-soup.jpg",
    badge: "Harvest Cook",
  },
  {
    id: "homemade-jam",
    title: "Homemade Jam",
    difficulty: "Medium",
    time: "1.5 hours",
    ingredients: ["Berries", "Sugar", "Lemon", "Clean jars"],
    instructions: [
      "Cook berries with sugar and lemon until thick.",
      "Skim foam and ladle into warm jars.",
      "Cool and label with the date.",
    ],
    image: "/workshop/recipes/homemade-jam.jpg",
    badge: "Jar Keeper",
  },
  {
    id: "lemon-loaf",
    title: "Lemon Loaf",
    difficulty: "Medium",
    time: "1 hour 15 min",
    ingredients: ["Flour", "Sugar", "Eggs", "Butter", "Lemons"],
    instructions: [
      "Cream butter and sugar, then add eggs.",
      "Fold in flour and lemon zest.",
      "Bake and glaze with lemon juice sugar.",
    ],
    image: "/workshop/recipes/lemon-loaf.jpg",
    badge: "Citrus Baker",
  },
  {
    id: "herb-butter",
    title: "Herb Butter",
    difficulty: "Easy",
    time: "20 min",
    ingredients: ["Butter", "Parsley", "Thyme", "Garlic", "Salt"],
    instructions: [
      "Soften butter.",
      "Fold in chopped herbs and garlic.",
      "Roll in parchment and chill.",
    ],
    image: "/workshop/recipes/herb-butter.jpg",
    badge: "Herb Whisperer",
  },
  {
    id: "scones",
    title: "Scones",
    difficulty: "Medium",
    time: "45 min",
    ingredients: ["Flour", "Butter", "Cream", "Sugar", "Optional berries"],
    instructions: [
      "Cut butter into flour.",
      "Stir in cream gently — do not overwork.",
      "Shape, bake, and serve with jam.",
    ],
    image: "/workshop/recipes/scones.jpg",
    badge: "Tea Table Host",
  },
  {
    id: "berry-pie",
    title: "Berry Pie",
    difficulty: "Hard",
    time: "2 hours",
    ingredients: ["Pie dough", "Mixed berries", "Sugar", "Cornstarch", "Lemon"],
    instructions: [
      "Line a tin with dough.",
      "Fill with sugared berries and cover.",
      "Vent the top and bake until juices bubble.",
    ],
    image: "/workshop/recipes/berry-pie.jpg",
    badge: "Pie Maker",
  },
  {
    id: "fresh-bread",
    title: "Fresh Bread",
    difficulty: "Medium",
    time: "3 hours",
    ingredients: ["Flour", "Water", "Yeast", "Salt"],
    instructions: [
      "Mix a shaggy dough and rest.",
      "Knead or fold until elastic, then rise.",
      "Bake until the crust sings when tapped.",
    ],
    image: "/workshop/recipes/fresh-bread.jpg",
    badge: "Village Baker",
  },
];

export const CREATIVE_PROMPTS = [
  {
    id: "dream-cottage",
    text: "Draw your dream cottage.",
  },
  {
    id: "first-flower",
    text: "Paint the first flower you see this week.",
  },
  {
    id: "woodland-creature",
    text: "Design a woodland creature.",
  },
  {
    id: "forest-map",
    text: "Invent a magical forest map.",
  },
  {
    id: "rainy-afternoon",
    text: "Write about your favorite rainy afternoon.",
  },
  {
    id: "reading-nook",
    text: "Design your perfect reading nook.",
  },
  {
    id: "mushroom-village",
    text: "Sketch a mushroom village.",
  },
  {
    id: "village-mascot",
    text: "Illustrate your village mascot.",
  },
];

export const QUEST_ITEMS = [
  { id: "mushroom", label: "Find a mushroom", emoji: "🍄" },
  { id: "feather", label: "Find a feather", emoji: "🪶" },
  { id: "flowers", label: "Find five different flowers", emoji: "🌼" },
  { id: "snail", label: "Find a snail", emoji: "🐌" },
  { id: "hug-tree", label: "Hug an old tree", emoji: "🌳" },
  { id: "pretty-leaf", label: "Find the prettiest leaf", emoji: "🍂" },
  { id: "moss", label: "Find moss", emoji: "🌿" },
  { id: "butterfly", label: "Find a butterfly", emoji: "🦋" },
  { id: "rain", label: "Photograph rain", emoji: "🌧" },
  { id: "moon", label: "Photograph the moon", emoji: "🌙" },
];

export const PLANTS = [
  { id: "lavender", name: "Lavender", emoji: "💜" },
  { id: "mint", name: "Mint", emoji: "🌿" },
  { id: "basil", name: "Basil", emoji: "🌱" },
  { id: "sunflower", name: "Sunflower", emoji: "🌻" },
  { id: "cherry-tomato", name: "Cherry Tomato", emoji: "🍅" },
];

export const GROW_BADGES = [
  { week: 1, id: "tiny-sprout", name: "Tiny Sprout", emoji: "🌱" },
  { week: 3, id: "gardener", name: "Gardener", emoji: "🌿" },
  { week: 4, id: "green-thumb", name: "Green Thumb", emoji: "🌻" },
];

export const BIRDS = [
  { id: "robin", name: "Robin", emoji: "🧡", hint: "Cheerful chest, early song" },
  { id: "sparrow", name: "Sparrow", emoji: "🪶", hint: "Busy around seed and hedge" },
  { id: "blue-jay", name: "Blue Jay", emoji: "💙", hint: "Bright flash through pines" },
  { id: "owl", name: "Owl", emoji: "🦉", hint: "Soft dusk watcher" },
  { id: "cardinal", name: "Cardinal", emoji: "❤️", hint: "Scarlet against snow or leaf" },
  { id: "hummingbird", name: "Hummingbird", emoji: "✨", hint: "Hover near nectar blooms" },
  { id: "finch", name: "Finch", emoji: "🎵", hint: "Small song on high twigs" },
  { id: "woodpecker", name: "Woodpecker", emoji: "🪵", hint: "Tap-tap on old bark" },
];

export const SEASONAL_PANELS = [
  {
    id: "spring",
    title: "Spring Bloom Festival",
    emoji: "🌸",
    tasks: [
      "Plant something new",
      "Press flowers",
      "Make a flower crown",
      "Photograph blossoms",
    ],
    reward: "Spring Bloom Badge",
  },
  {
    id: "summer",
    title: "Summer Picnic Week",
    emoji: "☀",
    tasks: [
      "Pack a picnic",
      "Read beneath a tree",
      "Paint outdoors",
      "Identify five birds",
    ],
    reward: "Picnic Day Badge",
  },
  {
    id: "harvest",
    title: "Harvest Festival",
    emoji: "🍂",
    tasks: [
      "Bake something with apples",
      "Decorate with leaves",
      "Carve a pumpkin",
      "Make cinnamon ornaments",
    ],
    reward: "Harvest Badge",
  },
  {
    id: "winter",
    title: "Winter Hearth Week",
    emoji: "❄",
    tasks: [
      "Bake cookies",
      "Knit something",
      "Make paper snowflakes",
      "Write a gratitude letter",
      "Read beside candlelight",
    ],
    reward: "Hearth Keeper Badge",
  },
];

/** Deterministic weekly index from UTC date. */
export function weekIndex(length: number, now = new Date()) {
  if (length <= 0) return 0;
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  const week = Math.floor(day / 7);
  return week % length;
}

export function titleForXp(xp: number) {
  let current: (typeof WORKSHOP_TITLES)[number] = WORKSHOP_TITLES[0];
  for (const t of WORKSHOP_TITLES) {
    if (xp >= t.minXp) current = t;
  }
  return current;
}

export function featuredCraft(now = new Date()) {
  return CRAFTS[weekIndex(CRAFTS.length, now)];
}

export function featuredPrompt(now = new Date()) {
  return CREATIVE_PROMPTS[weekIndex(CREATIVE_PROMPTS.length, now)];
}
