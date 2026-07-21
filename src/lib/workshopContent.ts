export type Difficulty = "Easy" | "Medium" | "Hard";

export type WorkshopTabId =
  | "craft"
  | "kitchen"
  | "prompt"
  | "quest"
  | "grow"
  | "birds"
  | "puzzle"
  | "broadcast"
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
  { id: "puzzle", label: "Puzzle Table", emoji: "🧩" },
  { id: "broadcast", label: "Bramblewood Broadcast", emoji: "📺" },
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
  puzzle: 35,
  broadcast: 25,
  seasonal: 60,
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
  note: string;
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
    note: "Today I pressed wildflowers while it rained outside. The pages still smell faintly of lavender.",
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
    note: "I left a fairy door by the oak. It feels like the woods are listening.",
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
    note: "A handful of painted acorns now live on my windowsill like little lanterns.",
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
    note: "The feeder swayed in the wind and a sparrow found it before dusk.",
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
    note: "My flower pot now wears a painted fern — very Bramblewood.",
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
    note: "The beeswax smelled like honey and summer fields.",
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
    note: "Every time I open the drawer, lavender rises like a quiet greeting.",
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
    note: "A miniature forest now lives on my desk.",
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
    note: "The paper dried uneven and perfect — like bark and sky.",
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
    note: "I built a path of pebbles and imagined fox footprints.",
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
    note: "Painted pinecones look like tiny autumn fireworks.",
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
    note: "Pressed petals became quiet bookmarks for rainy days.",
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
    note: "The twig frame made my sketch feel like it grew outdoors.",
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
    note: "A family of clay mushrooms lined up by the window.",
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
  note: string;
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
    image: "/stickers/villages/bramblewood/pumpkin.png",
    note: "The kitchen smelled like orchard dusk.",
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
    image: "/stickers/villages/bramblewood/candle-jar.png",
    note: "Sticky fingers, happy fox heart.",
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
    image: "/stickers/villages/bramblewood/bouquet.png",
    note: "Cookies tasted like a quiet meadow.",
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
    image: "/stickers/honey-jar.png",
    note: "Crisp edges, soft middle — perfect with tea.",
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
    image: "/stickers/villages/bramblewood/blankets.png",
    note: "Steam curled up like a tiny cloud.",
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
    image: "/stickers/villages/bramblewood/pumpkin.png",
    note: "Soup the color of late October.",
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
    image: "/stickers/villages/bramblewood/berry-sprig.png",
    note: "The jam set slowly, like patience itself.",
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
    image: "/stickers/villages/bramblewood/berry-sprig.png",
    note: "Bright citrus cut through the rainy afternoon.",
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
    image: "/stickers/villages/bramblewood/eucalyptus.png",
    note: "Herb butter melted on warm bread like a blessing.",
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
    image: "/stickers/villages/bramblewood/teapot.png",
    note: "Crumbly scones for a slow morning.",
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
    image: "/stickers/villages/bramblewood/berry-sprig.png",
    note: "Purple stains on my apron — proof of joy.",
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
    image: "/stickers/villages/bramblewood/pack/books.png",
    note: "The loaf cracked open like a warm hillside.",
    badge: "Village Baker",
  },
];

export const CREATIVE_PROMPTS = [
  {
    id: "dream-cottage",
    text: "Draw your dream cottage.",
    note: "I sketched a cottage with crooked shutters and too many flowerpots.",
  },
  {
    id: "first-flower",
    text: "Paint the first flower you see this week.",
    note: "The first flower was small and stubborn between two stones.",
  },
  {
    id: "woodland-creature",
    text: "Design a woodland creature.",
    note: "My creature had leaf ears and pockets full of seeds.",
  },
  {
    id: "forest-map",
    text: "Invent a magical forest map.",
    note: "I named a creek after the sound of rain on tin.",
  },
  {
    id: "rainy-afternoon",
    text: "Write about your favorite rainy afternoon.",
    note: "Rain made the workshop windows soft and silver.",
  },
  {
    id: "reading-nook",
    text: "Design your perfect reading nook.",
    note: "Blankets, a low lamp, and a fox-shaped bookmark.",
  },
  {
    id: "mushroom-village",
    text: "Sketch a mushroom village.",
    note: "Tiny doors in toadstool stems — of course.",
  },
  {
    id: "village-mascot",
    text: "Illustrate your village mascot.",
    note: "Our fox looked proud beside a stack of craft paper.",
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

export const PUZZLES = [
  {
    id: "crossword",
    title: "Crossword",
    blurb: "Cozy forest words across and down.",
    prompt: "Fill eight woodland words — leaf, moss, fox, twig, nest, oak, fern, rain.",
  },
  {
    id: "word-search",
    title: "Word Search",
    blurb: "Find herbs hiding in the letter thicket.",
    prompt: "Circle: mint, thyme, sage, basil, dill, rosemary.",
  },
  {
    id: "jigsaw",
    title: "Jigsaw Puzzle",
    blurb: "Assemble a cottage by candlelight (in your mind or on paper).",
    prompt: "Sketch the scene in 9 squares, then rearrange and redraw once.",
  },
  {
    id: "spot-difference",
    title: "Spot the Difference",
    blurb: "Two almost-identical workshop tables.",
    prompt: "Find five changes: missing scissors, extra mushroom, moved candle, new leaf, open book.",
  },
  {
    id: "hidden-objects",
    title: "Hidden Objects",
    blurb: "Seek craft tools in a cluttered sketch.",
    prompt: "Hide and find: spool, paintbrush, acorn, stamp, ribbon.",
  },
  {
    id: "logic",
    title: "Logic Puzzle",
    blurb: "Three foxes, three crafts, one afternoon.",
    prompt: "Who painted, who baked, who pressed flowers? Invent fair clues and solve.",
  },
];

export type BroadcastVideo = {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  duration: string;
  blurb: string;
  image: string;
};

export const BROADCAST_VIDEOS: BroadcastVideo[] = [
  {
    id: "nature-journaling",
    title: "Nature Journaling by the Creek",
    category: "Nature Journaling",
    categoryEmoji: "🌿",
    duration: "18 min",
    blurb: "Soft pages, field notes, and the hush of water.",
    image: "/stickers/villages/bramblewood/book-leaf.png",
  },
  {
    id: "watercolor",
    title: "Watercolor Leaves",
    category: "Watercolor Painting",
    categoryEmoji: "🎨",
    duration: "22 min",
    blurb: "Wet-on-wet greens and gentle edges.",
    image: "/stickers/villages/bramblewood/autumn-leaves.png",
  },
  {
    id: "candle-making",
    title: "Candle Making at Dusk",
    category: "Candle Making",
    categoryEmoji: "🕯",
    duration: "25 min",
    blurb: "Wax, wick, and a quiet flame.",
    image: "/stickers/villages/bramblewood/candle-jar.png",
  },
  {
    id: "clay-mushrooms-vid",
    title: "Clay Mushroom Sculpting",
    category: "Clay Mushroom Sculpting",
    categoryEmoji: "🍄",
    duration: "20 min",
    blurb: "Shape a little forest floor companion.",
    image: "/stickers/villages/bramblewood/mushroom.png",
  },
  {
    id: "bookbinding",
    title: "Simple Bookbinding",
    category: "Bookbinding",
    categoryEmoji: "📚",
    duration: "30 min",
    blurb: "Stitch a soft pamphlet for notes.",
    image: "/stickers/villages/bramblewood/pack/books.png",
  },
  {
    id: "wood-carving",
    title: "Whittle a Wooden Spoon",
    category: "Wood Carving",
    categoryEmoji: "🪵",
    duration: "28 min",
    blurb: "Slow cuts and grain that tells stories.",
    image: "/stickers/villages/bramblewood/pack/books.png",
  },
  {
    id: "crochet",
    title: "Crochet a Leaf Coaster",
    category: "Crochet",
    categoryEmoji: "🧶",
    duration: "24 min",
    blurb: "Loops like ivy around a mug.",
    image: "/stickers/villages/bramblewood/blankets.png",
  },
  {
    id: "embroidery",
    title: "Embroidery: Tiny Mushroom",
    category: "Embroidery",
    categoryEmoji: "🪡",
    duration: "26 min",
    blurb: "Needle and thread on soft linen.",
    image: "/stickers/villages/bramblewood/pack/bracelet.png",
  },
  {
    id: "pottery",
    title: "Pinch Pot Pottery",
    category: "Pottery",
    categoryEmoji: "🏺",
    duration: "21 min",
    blurb: "Thumbprints become a small bowl.",
    image: "/stickers/villages/bramblewood/eucalyptus.png",
  },
  {
    id: "birdhouse",
    title: "Birdhouse Building Basics",
    category: "Birdhouse Building",
    categoryEmoji: "🪺",
    duration: "32 min",
    blurb: "A safe perch for village birds.",
    image: "/stickers/villages/bramblewood/pack/compass.png",
  },
  {
    id: "pressed-flower-art",
    title: "Pressed Flower Art",
    category: "Pressed Flower Art",
    categoryEmoji: "🌸",
    duration: "19 min",
    blurb: "Arrange petals into a quiet collage.",
    image: "/stickers/villages/bramblewood/bouquet.png",
  },
  {
    id: "basket-weaving",
    title: "Beginner Basket Weaving",
    category: "Basket Weaving",
    categoryEmoji: "🧺",
    duration: "35 min",
    blurb: "Over, under, and a soft oval form.",
    image: "/stickers/picnic-basket.png",
  },
  {
    id: "bread-baking",
    title: "Bread Baking Calm",
    category: "Bread Baking",
    categoryEmoji: "🍞",
    duration: "27 min",
    blurb: "Knead, rest, and listen to the crust.",
    image: "/stickers/villages/bramblewood/pack/books.png",
  },
  {
    id: "cottage-baking",
    title: "Cottage Baking Hour",
    category: "Cottage Baking",
    categoryEmoji: "🍪",
    duration: "23 min",
    blurb: "Cookies, crumbs, and window light.",
    image: "/stickers/pie.png",
  },
  {
    id: "gardening",
    title: "Garden Bed Tending",
    category: "Gardening",
    categoryEmoji: "🪴",
    duration: "16 min",
    blurb: "Soil under nails and hopeful sprouts.",
    image: "/stickers/villages/bramblewood/eucalyptus.png",
  },
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

export function dayIndex(length: number, now = new Date()) {
  if (length <= 0) return 0;
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return day % length;
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

export function featuredPuzzle(now = new Date()) {
  return PUZZLES[dayIndex(PUZZLES.length, now)];
}
