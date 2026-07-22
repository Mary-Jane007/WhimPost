export type HearthTabId =
  | "overview"
  | "rituals"
  | "apothecary"
  | "recipes"
  | "candles"
  | "knitting"
  | "notes"
  | "inspiration";

export const HEARTH_TABS: Array<{ id: HearthTabId; label: string; emoji: string }> =
  [
    { id: "overview", label: "The Fireside", emoji: "🔥" },
    { id: "rituals", label: "Today's Rituals", emoji: "☕" },
    { id: "apothecary", label: "Herbal Apothecary", emoji: "🌿" },
    { id: "recipes", label: "Cozy Recipes", emoji: "🥧" },
    { id: "candles", label: "Candle Crafts", emoji: "🕯" },
    { id: "knitting", label: "Knitting Nook", emoji: "🧶" },
    { id: "notes", label: "Fireside Notes", emoji: "💌" },
    { id: "inspiration", label: "Cozy Inspiration", emoji: "✨" },
  ];

export const HEARTH_XP = {
  ritual: 25,
  note: 20,
  favoriteRecipe: 5,
  kindling: 5,
  craftBrowse: 0,
} as const;

export const HEARTH_TITLES = [
  { minXp: 0, title: "Warm Guest", emoji: "🕯" },
  { minXp: 80, title: "Tea Companion", emoji: "☕" },
  { minXp: 200, title: "Hearth Keeper", emoji: "🔥" },
  { minXp: 400, title: "Apothecary Friend", emoji: "🌿" },
  { minXp: 700, title: "Kindling Heart", emoji: "💛" },
  { minXp: 1100, title: "Cottage Elder", emoji: "🦔" },
] as const;

export function titleForHearthXp(xp: number) {
  let current: (typeof HEARTH_TITLES)[number] = HEARTH_TITLES[0];
  for (const t of HEARTH_TITLES) {
    if (xp >= t.minXp) current = t;
  }
  return current;
}

export type RitualTask = {
  id: string;
  label: string;
  detail: string;
  emoji: string;
};

export const RITUAL_POOL: RitualTask[] = [
  { id: "brew-tea", label: "Brew today's tea", detail: "Choose a mug that feels right and take a slow first sip.", emoji: "🍵" },
  { id: "drink-water", label: "Drink enough water", detail: "Keep a glass nearby the fire — hydrate as gently as you rest.", emoji: "💧" },
  { id: "knit-ten", label: "Knit for 10 minutes", detail: "Even a few rows count. Soft stitches, softer mind.", emoji: "🧶" },
  { id: "read-fire", label: "Read beside the fire", detail: "One chapter, one poem, or one quiet page.", emoji: "📖" },
  { id: "journal-sentence", label: "Write one sentence in your journal", detail: "Capture one true thing about today.", emoji: "✏" },
  { id: "gratitude", label: "Practice gratitude", detail: "Name three small kindnesses — including your own.", emoji: "💛" },
  { id: "rain-sounds", label: "Listen to rain sounds", detail: "Whether outside or from a soft recording, let the weather settle you.", emoji: "🌧" },
  { id: "bake-comfort", label: "Bake something comforting", detail: "Bread, cookies, or simply warm something sweet.", emoji: "🍞" },
  { id: "learn-herb", label: "Learn one new herb", detail: "Open the Apothecary and linger with a jar.", emoji: "🌿" },
  { id: "press-flower", label: "Press a flower into your journal", detail: "A petal today becomes tomorrow's bookmark.", emoji: "🌸" },
  { id: "light-candle", label: "Light a candle", detail: "One flame is enough to change a room.", emoji: "🕯" },
  { id: "stretch-fire", label: "Stretch by the fireplace", detail: "Unfurl shoulders, wrists, and the day you carried.", emoji: "🧘" },
  { id: "cozy-corner", label: "Organize a cozy corner", detail: "Blanket, book, mug — claim a nest.", emoji: "🛋" },
  { id: "fireside-note", label: "Write a Fireside Note", detail: "Leave anonymous kindness for whoever needs it next.", emoji: "💌" },
  { id: "watch-sunset", label: "Watch the sunset", detail: "Even a window-view counts as wonder.", emoji: "🌅" },
  { id: "hot-chocolate", label: "Make hot chocolate", detail: "Stir slowly. Taste the steam.", emoji: "🍫" },
  { id: "herbal-tea", label: "Try today's herbal tea", detail: "Pair it with Today's Herb from the shelves.", emoji: "🫖" },
  { id: "new-stitch", label: "Learn a new knitting stitch", detail: "One unfamiliar loop is enough progress.", emoji: "🧵" },
  { id: "herb-fact", label: "Memorize today's herb fact", detail: "Carry a little folklore home with you.", emoji: "📜" },
];

export function dailyRituals(now = new Date()): RitualTask[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const picks: RitualTask[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (picks.length < 5 && guard < RITUAL_POOL.length * 3) {
    const idx = (day * 17 + guard * 11) % RITUAL_POOL.length;
    const task = RITUAL_POOL[idx];
    if (!used.has(task.id)) {
      picks.push(task);
      used.add(task.id);
    }
    guard += 1;
  }
  return picks;
}

export type HerbCategory =
  | "calming"
  | "kitchen"
  | "floral"
  | "spice"
  | "bright";

export type Herb = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  category: HerbCategory;
  description: string;
  facts: string;
  uses: string;
  aroma: string;
  season: string;
  teaPairing: string;
  folklore: string;
};

export const HERB_CATEGORY_LABELS: Record<HerbCategory, string> = {
  calming: "Calming",
  kitchen: "Kitchen herbs",
  floral: "Floral",
  spice: "Warming spices",
  bright: "Bright & citrusy",
};

export const HERBS: Herb[] = [
  {
    id: "lavender",
    name: "Lavender",
    emoji: "💜",
    image: "/garden/flowers/lavender.jpg",
    category: "calming",
    description: "Soft purple spikes that scent linens, baths, and sleepy evenings.",
    facts: "Lavender thrives in sunny, well-drained soil and draws bees all summer.",
    uses: "Sleep pillows, calming teas, baking, and linen sachets.",
    aroma: "Clean floral with a cool herbal hush.",
    season: "Summer",
    teaPairing: "Chamomile or honeyed milk.",
    folklore: "Ancient Romans scented their baths with lavender.",
  },
  {
    id: "chamomile",
    name: "Chamomile",
    emoji: "🌼",
    image: "/garden/flowers/daisy.jpg",
    category: "calming",
    description: "Tiny daisy-like blossoms known for gentle bedtime rituals.",
    facts: "Both German and Roman chamomile are used in herbalism; the flowers dry beautifully.",
    uses: "Evening tea, skin soothers, and calm-after-storm rituals.",
    aroma: "Apple-sweet and soft as meadow air.",
    season: "Late spring–summer",
    teaPairing: "Lavender or a spoon of honey.",
    folklore: "In folklore, chamomile was called the 'plant's physician' for neighboring herbs.",
  },
  {
    id: "rosemary",
    name: "Rosemary",
    emoji: "🌿",
    image: "/stickers/villages/hearthwick/herbal-jar.png",
    category: "kitchen",
    description: "Needle-leaved evergreen of remembrance and roast dinners.",
    facts: "Rosemary stays fragrant through winter and loves a sunny windowsill.",
    uses: "Roasts, breads, hair rinses, and clarifying teas.",
    aroma: "Piney, resinous, and bright.",
    season: "Year-round",
    teaPairing: "Lemon and a little honey.",
    folklore: "Tied to memory — 'rosemary for remembrance' appears in old poetry.",
  },
  {
    id: "mint",
    name: "Mint",
    emoji: "🌱",
    image: "/stickers/villages/hearthwick/leaf-jar.png",
    category: "bright",
    description: "Cool, vigorous leaves that freshen tea and tidy corners of the garden.",
    facts: "Mint spreads eagerly — cottage gardeners often keep it potted.",
    uses: "Digestive teas, summer water, sauces, and sweets.",
    aroma: "Cool, green, and sparkling.",
    season: "Spring–autumn",
    teaPairing: "Ginger or dark chocolate biscuits.",
    folklore: "Named in myth after Minthe, transformed into the fragrant plant.",
  },
  {
    id: "lemon-balm",
    name: "Lemon Balm",
    emoji: "🍋",
    image: "/stickers/villages/hearthwick/herbal-jar.png",
    category: "bright",
    description: "Soft heart-shaped leaves with a gentle citrus lift.",
    facts: "A favorite of bees; crushing a leaf releases its lemony oils at once.",
    uses: "Uplifting teas, iced infusions, and calming evening cups.",
    aroma: "Soft lemon candy and green meadow.",
    season: "Summer",
    teaPairing: "Chamomile or lavender.",
    folklore: "Medieval herbalists believed lemon balm strengthened the heart and spirits.",
  },
  {
    id: "thyme",
    name: "Thyme",
    emoji: "🌿",
    image: "/stickers/villages/hearthwick/potion-bottles.png",
    category: "kitchen",
    description: "Tiny leaves with a savory warmth perfect for soups and courage.",
    facts: "There are dozens of thyme varieties — lemon thyme is especially cottage-friendly.",
    uses: "Soups, roasted vegetables, and steam inhalations.",
    aroma: "Earthy, peppery, and clean.",
    season: "Summer",
    teaPairing: "Honey and a squeeze of lemon.",
    folklore: "Knights once received thyme for courage before journeys.",
  },
  {
    id: "sage",
    name: "Sage",
    emoji: "🍃",
    image: "/stickers/villages/hearthwick/leaf-jar.png",
    category: "kitchen",
    description: "Velvety silver-green leaves of wisdom and winter kitchens.",
    facts: "Sage loves dry heat and pairs naturally with butter and beans.",
    uses: "Stuffings, brown butter sauces, and reflective teas.",
    aroma: "Warm, camphorous, and grounding.",
    season: "Autumn–winter",
    teaPairing: "Apple slices or cinnamon.",
    folklore: "The saying goes: 'Why should a man die whilst sage grows in his garden?'",
  },
  {
    id: "calendula",
    name: "Calendula",
    emoji: "🧡",
    image: "/garden/flowers/sunflower.jpg",
    category: "floral",
    description: "Sunny orange petals used in salves and cheerful teas.",
    facts: "Often called pot marigold; petals are edible and dye food a soft gold.",
    uses: "Skin balms, broths, and bright herbal infusions.",
    aroma: "Resinous, honeyed, and garden-warm.",
    season: "Summer–autumn",
    teaPairing: "Ginger or rosehip.",
    folklore: "Calendula was said to bloom on the calends — the first of each month.",
  },
  {
    id: "elderflower",
    name: "Elderflower",
    emoji: "🤍",
    image: "/garden/flowers/hydrangea.jpg",
    category: "floral",
    description: "Creamy flower clusters that taste like early summer rain.",
    facts: "Harvested carefully in bloom; berries come later and need proper cooking.",
    uses: "Cordials, fritters, and light floral teas.",
    aroma: "Honeyed elder and soft musk.",
    season: "Early summer",
    teaPairing: "Lemon and sparkling water.",
    folklore: "Elder trees were once considered guardians of cottage thresholds.",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    image: "/garden/flowers/rose.jpg",
    category: "floral",
    description: "Petals of tenderness for teas, jams, and quiet gestures.",
    facts: "Rosehips follow the blooms and are rich in late-autumn recipes.",
    uses: "Petal teas, syrups, and bath soaks.",
    aroma: "Classic floral romance with a green stem note.",
    season: "Summer",
    teaPairing: "Hibiscus or vanilla.",
    folklore: "Roses have marked love letters for centuries — including cottage ones.",
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    emoji: "🌺",
    image: "/garden/flowers/hibiscus.jpg",
    category: "floral",
    description: "Ruby petals that brew into a tart, jewel-colored cup.",
    facts: "Dried calyces keep well on apothecary shelves through winter.",
    uses: "Iced teas, warm punches, and colorful blends.",
    aroma: "Cranberry-tart and tropical.",
    season: "Warm months",
    teaPairing: "Ginger, mint, or orange peel.",
    folklore: "In some traditions, hibiscus tea welcomes guests with bright hospitality.",
  },
  {
    id: "cinnamon",
    name: "Cinnamon",
    emoji: "🪵",
    image: "/stickers/villages/hearthwick/cinnamon-sticks.png",
    category: "spice",
    description: "Warm bark curls that scent the whole cottage when simmered.",
    facts: "True cinnamon (Ceylon) is thinner and sweeter than cassia.",
    uses: "Bakes, chai, mulled drinks, and candle accents.",
    aroma: "Sweet woodsmoke and bakery mornings.",
    season: "Autumn–winter",
    teaPairing: "Apple, clove, or vanilla chai.",
    folklore: "Once traded like treasure along spice roads to northern hearths.",
  },
  {
    id: "clove",
    name: "Clove",
    emoji: "🌰",
    image: "/stickers/villages/hearthwick/walnuts.png",
    category: "spice",
    description: "Tiny nail-shaped buds with a deep, festive warmth.",
    facts: "A little goes a long way — one bud can perfume a whole pot.",
    uses: "Mulled cider, spice cookies, and orange pomanders.",
    aroma: "Spicy, sweet, and slightly peppery.",
    season: "Winter",
    teaPairing: "Orange peel and cinnamon.",
    folklore: "Clove-studded oranges were traditional winter gifts for good fortune.",
  },
  {
    id: "ginger",
    name: "Ginger",
    emoji: "🫚",
    image: "/stickers/villages/hearthwick/ceramic-crock.png",
    category: "spice",
    description: "Fiery root that wakes cold fingers and sleepy afternoons.",
    facts: "Fresh ginger keeps well; candied ginger makes a pocket treat.",
    uses: "Teas, soups, cookies, and golden milk.",
    aroma: "Hot, citrusy, and bright.",
    season: "Year-round",
    teaPairing: "Lemon, honey, or turmeric.",
    folklore: "Sailors once carried ginger to settle both stomach and spirit.",
  },
  {
    id: "vanilla",
    name: "Vanilla",
    emoji: "🍦",
    image: "/stickers/collectibles/hearthwick/hearth-recipes.png",
    category: "spice",
    description: "Soft orchid bean of comfort baking and slow desserts.",
    facts: "Vanilla is hand-pollinated in many regions — each pod is patient work.",
    uses: "Custards, chai, candles, and sugar jars.",
    aroma: "Warm cream, wood, and sweetness.",
    season: "Year-round",
    teaPairing: "Black tea or hot chocolate.",
    folklore: "Associated with hospitality — the scent that says stay a while.",
  },
];

export function todaysHerb(now = new Date()): Herb {
  const day = Math.floor(now.getTime() / 86_400_000);
  return HERBS[day % HERBS.length];
}

export type RecipeCategory = "breads" | "cookies" | "desserts" | "drinks" | "soups";

export type CozyRecipe = {
  id: string;
  name: string;
  emoji: string;
  category: RecipeCategory;
  time: string;
  difficulty: "easy" | "medium" | "cozy-project";
  description: string;
  ingredients: string[];
  herbalPairing?: string;
  image: string;
};

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breads: "Breads",
  cookies: "Cookies",
  desserts: "Desserts",
  drinks: "Drinks",
  soups: "Soups",
};

export const COZY_RECIPES: CozyRecipe[] = [
  {
    id: "honey-bread",
    name: "Honey Bread",
    emoji: "🍞",
    category: "breads",
    time: "2 hrs",
    difficulty: "medium",
    description: "A soft loaf that smells like golden afternoons.",
    ingredients: ["flour", "warm water", "yeast", "honey", "salt", "butter"],
    herbalPairing: "Rosemary",
    image: "/hearth/recipes/honey-bread.jpg",
  },
  {
    id: "cinnamon-bread",
    name: "Cinnamon Bread",
    emoji: "🥖",
    category: "breads",
    time: "2.5 hrs",
    difficulty: "medium",
    description: "Swirled with spice — best sliced while still warm.",
    ingredients: ["flour", "milk", "yeast", "sugar", "cinnamon", "butter", "egg"],
    herbalPairing: "Cinnamon",
    image: "/hearth/recipes/cinnamon-bread.jpg",
  },
  {
    id: "pumpkin-bread",
    name: "Pumpkin Bread",
    emoji: "🎃",
    category: "breads",
    time: "1.5 hrs",
    difficulty: "easy",
    description: "Moist autumn loaf for rainy window mornings.",
    ingredients: ["pumpkin puree", "flour", "eggs", "sugar", "oil", "spice blend"],
    herbalPairing: "Clove",
    image: "/hearth/recipes/pumpkin-bread.jpg",
  },
  {
    id: "lavender-cookies",
    name: "Lavender Cookies",
    emoji: "🍪",
    category: "cookies",
    time: "45 min",
    difficulty: "easy",
    description: "Delicate, floral, and perfect with afternoon tea.",
    ingredients: ["butter", "sugar", "flour", "egg", "dried lavender", "vanilla"],
    herbalPairing: "Lavender",
    image: "/hearth/recipes/lavender-cookies.jpg",
  },
  {
    id: "oatmeal-cookies",
    name: "Oatmeal Cookies",
    emoji: "🍪",
    category: "cookies",
    time: "40 min",
    difficulty: "easy",
    description: "Chewy comfort with a hint of brown sugar.",
    ingredients: ["oats", "flour", "butter", "brown sugar", "egg", "raisins optional"],
    herbalPairing: "Cinnamon",
    image: "/hearth/recipes/oatmeal-cookies.jpg",
  },
  {
    id: "ginger-cookies",
    name: "Ginger Cookies",
    emoji: "🍪",
    category: "cookies",
    time: "50 min",
    difficulty: "easy",
    description: "Spicy snaps that warm cold fingers.",
    ingredients: ["flour", "butter", "brown sugar", "ginger", "molasses", "spice"],
    herbalPairing: "Ginger",
    image: "/hearth/recipes/ginger-cookies.jpg",
  },
  {
    id: "apple-pie",
    name: "Apple Pie",
    emoji: "🥧",
    category: "desserts",
    time: "2 hrs",
    difficulty: "cozy-project",
    description: "The classic fireside dessert — cinnamon steam and golden crust.",
    ingredients: ["apples", "pie crust", "sugar", "cinnamon", "butter", "lemon"],
    herbalPairing: "Cinnamon",
    image: "/hearth/recipes/apple-pie.jpg",
  },
  {
    id: "blackberry-crumble",
    name: "Blackberry Crumble",
    emoji: "🫐",
    category: "desserts",
    time: "1 hr",
    difficulty: "easy",
    description: "Bubbling fruit under a buttery oat blanket.",
    ingredients: ["blackberries", "sugar", "oats", "flour", "butter"],
    herbalPairing: "Vanilla",
    image: "/hearth/recipes/blackberry-crumble.jpg",
  },
  {
    id: "rice-pudding",
    name: "Rice Pudding",
    emoji: "🍚",
    category: "desserts",
    time: "50 min",
    difficulty: "easy",
    description: "Slow-stirred creaminess for quiet nights.",
    ingredients: ["rice", "milk", "sugar", "vanilla", "cinnamon"],
    herbalPairing: "Vanilla",
    image: "/hearth/recipes/rice-pudding.jpg",
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    emoji: "🍫",
    category: "drinks",
    time: "15 min",
    difficulty: "easy",
    description: "Deep cocoa with a soft foam crown.",
    ingredients: ["milk", "cocoa", "sugar", "vanilla", "pinch of salt"],
    herbalPairing: "Cinnamon or mint",
    image: "/hearth/recipes/hot-chocolate.jpg",
  },
  {
    id: "apple-cider",
    name: "Apple Cider",
    emoji: "🍎",
    category: "drinks",
    time: "40 min",
    difficulty: "easy",
    description: "Simmered orchard warmth with spice.",
    ingredients: ["apple juice or cider", "cinnamon sticks", "cloves", "orange peel"],
    herbalPairing: "Clove",
    image: "/hearth/recipes/apple-cider.jpg",
  },
  {
    id: "vanilla-chai",
    name: "Vanilla Chai",
    emoji: "🫖",
    category: "drinks",
    time: "20 min",
    difficulty: "easy",
    description: "Spiced tea softened with vanilla and milk.",
    ingredients: ["black tea", "milk", "ginger", "cardamom", "cinnamon", "vanilla"],
    herbalPairing: "Vanilla",
    image: "/hearth/recipes/vanilla-chai.jpg",
  },
  {
    id: "chamomile-tea",
    name: "Chamomile Tea",
    emoji: "🌼",
    category: "drinks",
    time: "10 min",
    difficulty: "easy",
    description: "A pale gold cup for winding down.",
    ingredients: ["dried chamomile", "hot water", "honey optional"],
    herbalPairing: "Chamomile",
    image: "/hearth/recipes/chamomile-tea.jpg",
  },
  {
    id: "mint-tea",
    name: "Mint Tea",
    emoji: "🌱",
    category: "drinks",
    time: "10 min",
    difficulty: "easy",
    description: "Cool and clear — good after rich meals.",
    ingredients: ["fresh or dried mint", "hot water", "lemon optional"],
    herbalPairing: "Mint",
    image: "/hearth/recipes/mint-tea.jpg",
  },
  {
    id: "golden-milk",
    name: "Golden Milk",
    emoji: "✨",
    category: "drinks",
    time: "15 min",
    difficulty: "easy",
    description: "Turmeric-glowing comfort in a mug.",
    ingredients: ["milk", "turmeric", "ginger", "cinnamon", "honey", "black pepper"],
    herbalPairing: "Ginger",
    image: "/hearth/recipes/golden-milk.jpg",
  },
  {
    id: "pumpkin-soup",
    name: "Pumpkin Soup",
    emoji: "🍲",
    category: "soups",
    time: "1 hr",
    difficulty: "easy",
    description: "Silky orange warmth for chilly evenings.",
    ingredients: ["pumpkin", "onion", "stock", "cream", "sage", "salt"],
    herbalPairing: "Sage",
    image: "/hearth/recipes/pumpkin-soup.jpg",
  },
  {
    id: "tomato-soup",
    name: "Tomato Soup",
    emoji: "🍅",
    category: "soups",
    time: "45 min",
    difficulty: "easy",
    description: "Bright comfort with grilled bread on the side.",
    ingredients: ["tomatoes", "onion", "garlic", "stock", "basil", "cream optional"],
    herbalPairing: "Thyme",
    image: "/hearth/recipes/tomato-soup.jpg",
  },
  {
    id: "potato-leek-soup",
    name: "Potato Leek Soup",
    emoji: "🥔",
    category: "soups",
    time: "55 min",
    difficulty: "easy",
    description: "Quiet, creamy, and made for soft rain.",
    ingredients: ["potatoes", "leeks", "butter", "stock", "cream", "thyme"],
    herbalPairing: "Thyme",
    image: "/hearth/recipes/potato-leek-soup.jpg",
  },
];

export type CandleCraft = {
  id: string;
  name: string;
  emoji: string;
  difficulty: "easy" | "medium" | "careful";
  time: string;
  materials: string[];
  steps: string[];
  safety: string;
  image: string;
};

export const CANDLE_CRAFTS: CandleCraft[] = [
  {
    id: "beeswax",
    name: "Beeswax candles",
    emoji: "🐝",
    difficulty: "easy",
    time: "45 min",
    materials: ["beeswax sheets or pellets", "cotton wick", "scissors"],
    steps: [
      "Warm beeswax sheets slightly with your hands until pliable.",
      "Lay the wick along one edge and roll tightly.",
      "Trim the wick to about 1 cm and set upright to firm.",
    ],
    safety: "Never leave a burning candle unattended. Keep away from drafts and fabrics.",
    image: "/hearth/candles/beeswax.jpg",
  },
  {
    id: "dried-flower",
    name: "Dried flower candles",
    emoji: "🌸",
    difficulty: "medium",
    time: "1.5 hrs",
    materials: ["soy or beeswax", "wick", "jar", "dried petals"],
    steps: [
      "Secure the wick in a clean jar.",
      "Melt wax gently over a double boiler.",
      "Pour a base layer, cool slightly, then press dried flowers against the glass and finish pouring.",
    ],
    safety: "Keep botanicals away from the immediate wick path to reduce flare-ups.",
    image: "/hearth/candles/dried-flower.jpg",
  },
  {
    id: "cinnamon-stick",
    name: "Cinnamon stick candles",
    emoji: "🪵",
    difficulty: "easy",
    time: "1 hr",
    materials: ["pillar candle or jar candle", "cinnamon sticks", "twine"],
    steps: [
      "Arrange cinnamon sticks around a plain pillar.",
      "Tie firmly with twine or raffia.",
      "Trim ends evenly for a tidy cottage look.",
    ],
    safety: "Cinnamon is decorative — do not let sticks sit in open flame.",
    image: "/hearth/candles/cinnamon-stick.jpg",
  },
  {
    id: "lavender-candle",
    name: "Lavender candles",
    emoji: "💜",
    difficulty: "medium",
    time: "1.5 hrs",
    materials: ["wax", "wick", "lavender buds", "lavender oil optional"],
    steps: [
      "Melt wax and stir in a drop of lavender oil if using.",
      "Pour into molds or jars with centered wicks.",
      "Sprinkle a few buds on the cooling surface — sparingly.",
    ],
    safety: "Essential oils are flammable — use lightly and keep buds off the wick.",
    image: "/hearth/candles/lavender-candle.jpg",
  },
  {
    id: "orange-peel",
    name: "Orange peel candles",
    emoji: "🍊",
    difficulty: "easy",
    time: "30 min",
    materials: ["halved orange", "olive oil", "wick or cotton"],
    steps: [
      "Scoop out most of the fruit, leaving the pith 'stem' in the center if possible.",
      "Pour a little oil into the peel cup.",
      "Light the pith wick carefully for a short, fragrant glow.",
    ],
    safety: "Short burns only. Place on a fire-safe dish and watch closely.",
    image: "/hearth/candles/orange-peel.jpg",
  },
  {
    id: "pressed-flower",
    name: "Pressed flower candles",
    emoji: "🌺",
    difficulty: "medium",
    time: "2 hrs",
    materials: ["clear jar candle", "pressed flowers", "mod podge or wax seal"],
    steps: [
      "Arrange pressed flowers on the outside of a cool jar.",
      "Seal lightly so petals stay flat.",
      "Cure fully before lighting.",
    ],
    safety: "Keep paper-thin botanicals outside the flame chamber.",
    image: "/hearth/candles/pressed-flower.jpg",
  },
  {
    id: "teacup",
    name: "Teacup candles",
    emoji: "☕",
    difficulty: "medium",
    time: "1.5 hrs",
    materials: ["vintage teacup", "wax", "wick", "wick sticker"],
    steps: [
      "Clean and dry a sturdy teacup.",
      "Affix wick to the center bottom.",
      "Pour melted wax and hold wick upright until set.",
    ],
    safety: "Use cups without cracks. Burn on a heat-safe saucer.",
    image: "/hearth/candles/teacup.jpg",
  },
  {
    id: "floating",
    name: "Floating candles",
    emoji: "💧",
    difficulty: "easy",
    time: "1 hr",
    materials: ["floating candle molds", "wax", "wick", "bowl of water"],
    steps: [
      "Pour wax into shallow molds with short wicks.",
      "Unmold when fully cool.",
      "Float in a bowl with petals or cranberries.",
    ],
    safety: "Keep water bowls stable and away from edges.",
    image: "/hearth/candles/floating.jpg",
  },
  {
    id: "soy",
    name: "Soy candles",
    emoji: "🌱",
    difficulty: "medium",
    time: "2 hrs",
    materials: ["soy wax", "jar", "wick", "thermometer"],
    steps: [
      "Melt soy wax to the recommended temperature.",
      "Add scent if desired, then pour into wicked jars.",
      "Allow a full cure before the first long burn.",
    ],
    safety: "Follow wax temperature guides; never melt wax directly on a flame.",
    image: "/hearth/candles/soy.jpg",
  },
  {
    id: "autumn",
    name: "Autumn candles",
    emoji: "🍂",
    difficulty: "easy",
    time: "1 hr",
    materials: ["jar candle", "dried leaves", "twine", "cinnamon"],
    steps: [
      "Wrap a plain jar with twine and a few pressed leaves.",
      "Tuck in a cinnamon stick as decoration.",
      "Style on the mantel beside the fire.",
    ],
    safety: "Keep dried leaves well below the rim and flame.",
    image: "/hearth/candles/autumn.jpg",
  },
];

export type KnitDifficulty = "beginner" | "easy" | "intermediate" | "advanced";

export type KnitProject = {
  id: string;
  name: string;
  emoji: string;
  difficulty: KnitDifficulty;
  hours: string;
  materials: string[];
  size: string;
  tips: string;
  image: string;
};

export const KNIT_PROJECTS: KnitProject[] = [
  {
    id: "mug-cozy",
    name: "Mug Cozy",
    emoji: "☕",
    difficulty: "beginner",
    hours: "2–3 hrs",
    materials: ["worsted yarn", "needles 5mm", "button"],
    size: "Fits most mugs",
    tips: "Knit a flat rectangle and seam with a button loop.",
    image: "/stickers/collectibles/hearthwick/hearth-teacups.png",
  },
  {
    id: "dishcloth",
    name: "Dishcloth",
    emoji: "🧽",
    difficulty: "beginner",
    hours: "1–2 hrs",
    materials: ["cotton yarn", "needles 4.5mm"],
    size: "About 20×20 cm",
    tips: "Garter stitch forgives everything — perfect first project.",
    image: "/stickers/villages/hearthwick/wooden-crate.png",
  },
  {
    id: "bookmark",
    name: "Bookmark",
    emoji: "📑",
    difficulty: "beginner",
    hours: "1 hr",
    materials: ["leftover yarn", "needles 3.5mm"],
    size: "3×20 cm",
    tips: "Add a tiny tassel for cottage charm.",
    image: "/stickers/villages/hearthwick/vintage-books.png",
  },
  {
    id: "scarf",
    name: "Scarf",
    emoji: "🧣",
    difficulty: "easy",
    hours: "8–12 hrs",
    materials: ["soft wool", "needles 6mm"],
    size: "20×150 cm",
    tips: "Choose a forgiving stitch like seed or garter.",
    image: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  },
  {
    id: "beanie",
    name: "Beanie",
    emoji: "🧢",
    difficulty: "easy",
    hours: "5–8 hrs",
    materials: ["worsted yarn", "circular needles", "stitch marker"],
    size: "Adult medium",
    tips: "Try it on as you decrease — every head is different.",
    image: "/stickers/villages/hearthwick/hedgehog.png",
  },
  {
    id: "mittens",
    name: "Mittens",
    emoji: "🧤",
    difficulty: "easy",
    hours: "6–10 hrs",
    materials: ["wool yarn", "DPNs or magic loop"],
    size: "Adult pair",
    tips: "Make a gauge swatch — mittens hate surprises.",
    image: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  },
  {
    id: "socks",
    name: "Socks",
    emoji: "🧦",
    difficulty: "intermediate",
    hours: "12–20 hrs",
    materials: ["sock yarn", "2.5mm needles"],
    size: "Custom foot length",
    tips: "Master the heel flap once — then it becomes meditation.",
    image: "/stickers/villages/hearthwick/paintbrush.png",
  },
  {
    id: "shawl",
    name: "Shawl",
    emoji: "🎐",
    difficulty: "intermediate",
    hours: "20–40 hrs",
    materials: ["fingering yarn", "circular needles"],
    size: "Wraps the shoulders",
    tips: "Place markers every lace repeat to stay oriented.",
    image: "/stickers/villages/hearthwick/lavender-bouquet.png",
  },
  {
    id: "sweater",
    name: "Sweater",
    emoji: "🧥",
    difficulty: "intermediate",
    hours: "40–80 hrs",
    materials: ["worsted yarn", "needles per pattern", "stitch holders"],
    size: "Choose your ease",
    tips: "Measure a favorite sweater and match those numbers.",
    image: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  },
  {
    id: "blanket",
    name: "Blanket",
    emoji: "🛏",
    difficulty: "advanced",
    hours: "60+ hrs",
    materials: ["bulky or worsted yarn", "large needles or hook"],
    size: "Lap or full throw",
    tips: "Work in strips if the weight on your lap gets heavy.",
    image: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  },
  {
    id: "cardigan",
    name: "Cardigan",
    emoji: "🧶",
    difficulty: "advanced",
    hours: "50–90 hrs",
    materials: ["yarn per pattern", "buttons", "needles"],
    size: "Custom fit",
    tips: "Block pieces before seaming for a polished cottage finish.",
    image: "/stickers/villages/hearthwick/hedgehog.png",
  },
  {
    id: "plush-hedgehog",
    name: "Plush Hedgehog",
    emoji: "🦔",
    difficulty: "advanced",
    hours: "15–25 hrs",
    materials: ["brown & cream yarn", "safety eyes", "stuffing"],
    size: "Palm-sized friend",
    tips: "Hearthwick's favorite — stitch slowly and stuff firmly.",
    image: "/villages/hearthwick/mascot.png",
  },
];

export const SAMPLE_FIRESIDE_NOTES = [
  "I hope today was a little gentler than yesterday.",
  "The fire is always warm enough for one more chair.",
  "Take your time.",
  "You've done enough for today.",
  "I hope tomorrow surprises you in the nicest way.",
  "Sip slowly. The kettle will wait.",
  "You belong beside this fire.",
  "Soft rain, soft heart — both are welcome here.",
];

export type DailyInspiration = {
  tea: string;
  quote: string;
  knitting: string;
  candle: string;
  herbId: string;
  recipeId: string;
  journalPrompt: string;
  song: string;
  movie: string;
  reminder: string;
};

const INSPIRATION_POOL: Omit<DailyInspiration, "herbId" | "recipeId">[] = [
  {
    tea: "Chamomile with honey",
    quote: "Home is not a place — it is the feeling of being allowed to rest.",
    knitting: "Try three rows of seed stitch on a scrap.",
    candle: "Beeswax pillar by the window",
    journalPrompt: "What made your shoulders drop today?",
    song: "A soft acoustic playlist with no rush",
    movie: "A gentle rainy-day comfort film",
    reminder: "You do not have to earn rest.",
  },
  {
    tea: "Vanilla chai",
    quote: "Every stranger is welcomed home.",
    knitting: "Cast on a mug cozy tonight.",
    candle: "Lavender jar on the mantel",
    journalPrompt: "Describe the coziest corner you know.",
    song: "Quiet piano and kettle sounds",
    movie: "A bakery romance or cottage tale",
    reminder: "One warm drink is a complete ritual.",
  },
  {
    tea: "Mint and lemon",
    quote: "Creativity grows best beside a patient fire.",
    knitting: "Practice a new decrease on leftover yarn.",
    candle: "Cinnamon stick wrapped pillar",
    journalPrompt: "Which scent means safety to you?",
    song: "Folk songs for folding laundry",
    movie: "Something with autumn leaves and kind people",
    reminder: "Leave one kind sentence for a stranger.",
  },
  {
    tea: "Golden milk",
    quote: "Small crafts stitch large comforts.",
    knitting: "Finish two inches of your scarf.",
    candle: "Teacup candle after dinner",
    journalPrompt: "What would you tell a tired traveler?",
    song: "Rain on the roof with soft vocals",
    movie: "A slow story you have loved before",
    reminder: "The fire keeps for those who linger.",
  },
];

export function todaysInspiration(now = new Date()): DailyInspiration {
  const day = Math.floor(now.getTime() / 86_400_000);
  const base = INSPIRATION_POOL[day % INSPIRATION_POOL.length];
  return {
    ...base,
    herbId: HERBS[day % HERBS.length].id,
    recipeId: COZY_RECIPES[day % COZY_RECIPES.length].id,
  };
}

export const HEARTH_ART = {
  mascot: "/villages/hearthwick/mascot.png",
  kettle: "/stickers/collectibles/hearthwick/hearth-kettles.png",
  blanket: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  teacup: "/stickers/collectibles/hearthwick/hearth-teacups.png",
  embers: "/stickers/collectibles/hearthwick/hearth-embers.png",
  letters: "/stickers/collectibles/hearthwick/hearth-letters.png",
  apothecary: "/stickers/villages/hearthwick/apothecary-table.png",
  books: "/stickers/villages/hearthwick/vintage-books.png",
  hedgehog: "/stickers/villages/hearthwick/hedgehog.png",
  fireplace: "/hearth/fireplace.jpg",
} as const;
