export type GardenTabId =
  | "overview"
  | "daily"
  | "spotting"
  | "kindness"
  | "seeds"
  | "visitors"
  | "community"
  | "journal";

export const GARDEN_TABS: Array<{
  id: GardenTabId;
  label: string;
  emoji: string;
}> = [
  { id: "overview", label: "Garden Overview", emoji: "🌱" },
  { id: "daily", label: "Daily Bloom Tasks", emoji: "🌼" },
  { id: "spotting", label: "Flower Spotting", emoji: "📷" },
  { id: "kindness", label: "Acts of Kindness", emoji: "💛" },
  { id: "seeds", label: "Seeds of Joy", emoji: "✨" },
  { id: "visitors", label: "Wild Visitors", emoji: "🦋" },
  { id: "community", label: "Community Meadow", emoji: "🏕" },
  { id: "journal", label: "Garden Journal", emoji: "📔" },
];

export const GARDEN_XP = {
  daily: 40,
  spotting: 70,
  kindness: 100,
  seed: 35,
  journal: 25,
} as const;

export const GARDEN_TITLES = [
  { minXp: 0, title: "Tiny Seed", emoji: "🌱" },
  { minXp: 120, title: "Gentle Bloom", emoji: "🌼" },
  { minXp: 350, title: "Wildflower Friend", emoji: "🐰" },
  { minXp: 700, title: "Garden Keeper", emoji: "🪴" },
  { minXp: 1200, title: "Bloomkeeper", emoji: "🌻" },
  { minXp: 2000, title: "Heart of Clovermeadow", emoji: "💚" },
];

export function titleForGardenXp(xp: number) {
  let current = GARDEN_TITLES[0];
  for (const row of GARDEN_TITLES) {
    if (xp >= row.minXp) current = row;
  }
  return current;
}

export type DailyCategory =
  | "kindness"
  | "flower"
  | "nature"
  | "joy"
  | "cozy"
  | "adventure"
  | "community";

export type DailyTask = {
  id: string;
  label: string;
  emoji: string;
  category: DailyCategory;
  /** Photo upload encouraged / required for completion. */
  allowsPhoto: boolean;
  /** Extra contribution to the shared Community Meadow. */
  communityBonus?: boolean;
};

export const DAILY_CATEGORY_LABELS: Record<DailyCategory, string> = {
  kindness: "Kindness",
  flower: "Flower Spotting",
  nature: "Nature Moments",
  joy: "Joy & Gratitude",
  cozy: "Cozy Living",
  adventure: "Tiny Adventures",
  community: "Community Blooms",
};

export const DAILY_TASK_POOL: DailyTask[] = [
  // Kindness
  { id: "k-compliment", label: "Give someone a genuine compliment.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-thank", label: "Thank someone for something they've done.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-appreciate", label: "Tell a loved one you appreciate them.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-encourage", label: "Send an encouraging message.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-review", label: "Write a positive review for a local business.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-kind-comment", label: "Leave a kind comment online.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-hold-door", label: "Hold the door open for someone.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-introduce", label: "Introduce yourself to someone new.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-smile-five", label: "Smile at five people today.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-make-laugh", label: "Make someone laugh.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-surprise-snack", label: "Surprise someone with a snack or drink.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-offer-help", label: "Offer to help someone with a task.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-thank-you-note", label: "Write a thank-you note.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-admire", label: "Tell someone what you admire about them.", emoji: "🌸", category: "kindness", allowsPhoto: false },
  { id: "k-umbrella", label: "Share your umbrella if it's raining.", emoji: "🌸", category: "kindness", allowsPhoto: false },

  // Flower Spotting (photo tasks)
  { id: "f-photo-daisy", label: "Photograph a daisy.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-yellow", label: "Find a yellow flower.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-never-seen", label: "Find a flower you've never seen before.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-learn-name", label: "Learn the name of one flower.", emoji: "🌼", category: "flower", allowsPhoto: false },
  { id: "f-unexpected", label: "Photograph a flower growing in an unexpected place.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-three", label: "Find three different flowers.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-bee-flower", label: "Spot a bee visiting a flower.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-butterfly-flower", label: "Spot a butterfly on a flower.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-clover-patch", label: "Find a clover patch.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-wildflowers", label: "Photograph wildflowers.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-five-petals", label: "Find a flower with five petals.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-visit-garden", label: "Visit a garden or park.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-smell-describe", label: "Smell a flower and describe its scent.", emoji: "🌼", category: "flower", allowsPhoto: false },
  { id: "f-brightest", label: "Find the brightest flower you can.", emoji: "🌼", category: "flower", allowsPhoto: true },
  { id: "f-favorite-today", label: "Upload your favorite flower of the day.", emoji: "🌼", category: "flower", allowsPhoto: true },

  // Nature Moments
  { id: "n-outside-15", label: "Spend 15 minutes outside.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-listen-birds", label: "Listen to birds for five minutes.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-clouds", label: "Watch the clouds.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-sunset", label: "Watch the sunset.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-sunrise", label: "Watch the sunrise.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-listen-rain", label: "Listen to the rain.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-tree-bark", label: "Touch the bark of an old tree.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-barefoot", label: "Walk barefoot on grass (if safe).", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-interesting-leaf", label: "Find an interesting leaf.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-photo-green", label: "Photograph something green.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-watch-bees", label: "Watch bees for one minute.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-no-phone", label: "Listen without using your phone for ten minutes.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-heart-nature", label: "Find something shaped like a heart in nature.", emoji: "🌿", category: "nature", allowsPhoto: true },
  { id: "n-leaves-wind", label: "Watch leaves moving in the wind.", emoji: "🌿", category: "nature", allowsPhoto: false },
  { id: "n-sit-peaceful", label: "Sit somewhere peaceful for ten minutes.", emoji: "🌿", category: "nature", allowsPhoto: false },

  // Joy & Gratitude
  { id: "j-grateful-three", label: "Write down three things you're grateful for.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-childhood", label: "Think of your happiest childhood memory.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-smile-today", label: "Share something that made you smile today.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-favorite-season", label: "Write about your favorite season.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-favorite-smell", label: "Write about your favorite smell.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-love-home", label: "Write one thing you love about your home.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-inspires", label: "Name someone who inspires you.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-favorite-nature", label: "Think of your favorite place in nature.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-favorite-birthday", label: "Remember your favorite birthday.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-spring-afternoon", label: "Describe your perfect spring afternoon.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-proud", label: "Write one thing you're proud of.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-beautiful-noticed", label: "Reflect on something beautiful you noticed today.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-small-win", label: "Celebrate one small win.", emoji: "💛", category: "joy", allowsPhoto: false },
  { id: "j-mood-flower", label: "Write down your current mood with one flower that matches it.", emoji: "💛", category: "joy", allowsPhoto: false },

  // Cozy Living
  { id: "c-tea", label: "Make yourself a cup of tea.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-warm-drink", label: "Enjoy a warm drink without distractions.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-open-window", label: "Open your window and enjoy the fresh air.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-candle", label: "Light a candle (if safe).", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-arrange-vase", label: "Arrange flowers in a vase.", emoji: "🌷", category: "cozy", allowsPhoto: true },
  { id: "c-water-plant", label: "Water a houseplant.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-relax-ten", label: "Sit somewhere cozy and relax for ten minutes.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-calming-music", label: "Listen to calming music.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-cozy-sweater", label: "Wear your favorite cozy sweater.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-sweet-treat", label: "Bake or enjoy a sweet treat.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-fresh-table", label: "Put fresh flowers on your table.", emoji: "🌷", category: "cozy", allowsPhoto: true },
  { id: "c-tidy-corner", label: "Tidy one cozy corner of your home.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-rain-window", label: "Watch the rain from a window.", emoji: "🌷", category: "cozy", allowsPhoto: false },
  { id: "c-breakfast", label: "Enjoy breakfast without looking at a screen.", emoji: "🌷", category: "cozy", allowsPhoto: false },

  // Tiny Adventures
  { id: "a-new-walk", label: "Visit somewhere you've never walked before.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-different-route", label: "Take a different route home.", emoji: "🦋", category: "adventure", allowsPhoto: false },
  { id: "a-colorful-door", label: "Photograph a colorful door.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-flower-shop", label: "Visit a local flower shop.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-birds-nest", label: "Find a bird's nest (without disturbing it).", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-farmers-market", label: "Visit a farmers' market.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-count-butterflies", label: "Count how many butterflies you see.", emoji: "🦋", category: "adventure", allowsPhoto: false },
  { id: "a-new-tree", label: "Discover a new tree.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-reminds-clover", label: "Find something that reminds you of Clovermeadow.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-nearby-garden", label: "Explore a nearby garden.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-crack-pavement", label: "Find something growing through a crack in the pavement.", emoji: "🦋", category: "adventure", allowsPhoto: true },
  { id: "a-five-greens", label: "Notice five different shades of green.", emoji: "🦋", category: "adventure", allowsPhoto: false },

  // Community Blooms
  { id: "cm-brighten", label: "Brighten someone's day.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-welcome", label: "Welcome a new villager.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-recommend", label: "Share a wholesome recommendation.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-celebrate", label: "Celebrate another villager's achievement.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-board", label: "Leave an encouraging message on the Community Board.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-invite", label: "Invite someone to join a village activity.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-share-flower", label: "Share your favorite flower with the community gallery.", emoji: "🌻", category: "community", allowsPhoto: true, communityBonus: true },
  { id: "cm-photo-beautiful", label: "Post a photo of something beautiful you discovered today.", emoji: "🌻", category: "community", allowsPhoto: true, communityBonus: true },
  { id: "cm-unique", label: "Tell someone what makes them unique.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
  { id: "cm-three-tasks", label: "Help Clovermeadow bloom by completing three Daily Bloom Tasks.", emoji: "🌻", category: "community", allowsPhoto: false, communityBonus: true },
];

/** Deterministic day seed → 5 unique tasks, preferably from different categories. */
export function dailyTasksForDay(now = new Date()): DailyTask[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const categories: DailyCategory[] = [
    "kindness",
    "flower",
    "nature",
    "joy",
    "cozy",
    "adventure",
    "community",
  ];

  // Rotate category order by day so the mix feels fresh.
  const rotated = categories.map(
    (_, i) => categories[(day + i) % categories.length]
  );

  const picks: DailyTask[] = [];
  const used = new Set<string>();

  // First pass: one task from five different categories.
  for (let i = 0; i < 5; i++) {
    const cat = rotated[i];
    const pool = DAILY_TASK_POOL.filter(
      (t) => t.category === cat && !used.has(t.id)
    );
    if (!pool.length) continue;
    const idx = (day * 11 + i * 5) % pool.length;
    const task = pool[idx];
    picks.push(task);
    used.add(task.id);
  }

  // Fill if needed with unused tasks from the full pool.
  let guard = 0;
  while (picks.length < 5 && guard < DAILY_TASK_POOL.length * 2) {
    const idx = (day * 13 + guard * 7) % DAILY_TASK_POOL.length;
    const task = DAILY_TASK_POOL[idx];
    if (!used.has(task.id)) {
      picks.push(task);
      used.add(task.id);
    }
    guard += 1;
  }

  return picks.slice(0, 5);
}

export type SpotFlower = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  facts: string;
  season: string;
  pollinators: string;
  symbolism: string;
};

export const SPOT_FLOWERS: SpotFlower[] = [
  {
    id: "daisy",
    name: "Daisy",
    emoji: "🌼",
    image: "/garden/flowers/daisy.jpg",
    facts: "Daisies open with the sun and close at dusk — little meadow clocks.",
    season: "Spring–summer",
    pollinators: "Bees, butterflies",
    symbolism: "Innocence, new beginnings",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    image: "/garden/flowers/rose.jpg",
    facts: "Roses have been cultivated for thousands of years as symbols of devotion.",
    season: "Late spring–autumn",
    pollinators: "Bees, beetles",
    symbolism: "Love, gratitude",
  },
  {
    id: "tulip",
    name: "Tulip",
    emoji: "🌷",
    image: "/garden/flowers/tulip.jpg",
    facts: "Tulips once sparked a frenzy of trade in the Dutch Golden Age.",
    season: "Spring",
    pollinators: "Bees",
    symbolism: "Cheerful declaration",
  },
  {
    id: "lavender",
    name: "Lavender",
    emoji: "💜",
    image: "/garden/flowers/lavender.jpg",
    facts: "Lavender's scent calms minds and draws pollinators in soft purple waves.",
    season: "Summer",
    pollinators: "Bees, butterflies",
    symbolism: "Calm, devotion",
  },
  {
    id: "sunflower",
    name: "Sunflower",
    emoji: "🌻",
    image: "/garden/flowers/sunflower.jpg",
    facts: "Young sunflowers track the sun across the sky (heliotropism).",
    season: "Summer–early autumn",
    pollinators: "Bees, birds",
    symbolism: "Loyalty, warmth",
  },
  {
    id: "bluebell",
    name: "Bluebell",
    emoji: "🪻",
    image: "/garden/flowers/bluebell.jpg",
    facts: "Bluebell woods carpet forest floors in a single enchanted week each spring.",
    season: "Spring",
    pollinators: "Bees, hoverflies",
    symbolism: "Humility, gratitude",
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    emoji: "🌺",
    image: "/garden/flowers/hibiscus.jpg",
    facts: "Many hibiscus blooms last only a day — beauty in a brief visit.",
    season: "Warm months",
    pollinators: "Hummingbirds, bees",
    symbolism: "Delicate joy",
  },
  {
    id: "cherry-blossom",
    name: "Cherry Blossom",
    emoji: "🌸",
    image: "/garden/flowers/cherry-blossom.jpg",
    facts: "Sakura reminds us that fleeting moments can be the most precious.",
    season: "Early spring",
    pollinators: "Bees",
    symbolism: "Impermanence, renewal",
  },
  {
    id: "dandelion",
    name: "Dandelion",
    emoji: "🌼",
    image: "/garden/flowers/dandelion.jpg",
    facts: "Every part of a dandelion is useful — from root tea to seed wishes.",
    season: "Spring–autumn",
    pollinators: "Bees, butterflies",
    symbolism: "Resilience, wishes",
  },
  {
    id: "hydrangea",
    name: "Hydrangea",
    emoji: "🌹",
    image: "/garden/flowers/hydrangea.jpg",
    facts: "Hydrangea color can shift with soil acidity — chemistry as watercolor.",
    season: "Summer",
    pollinators: "Bees",
    symbolism: "Heartfelt emotion",
  },
  {
    id: "bougainvillea",
    name: "Bougainvillea",
    emoji: "🌺",
    image: "/garden/flowers/bougainvillea.jpg",
    facts: "The bright “petals” are actually bracts; tiny flowers hide in the center.",
    season: "Warm seasons",
    pollinators: "Butterflies, bees",
    symbolism: "Passion, welcome",
  },
  {
    id: "clover",
    name: "Clover",
    emoji: "🌿",
    image: "/garden/flowers/clover.jpg",
    facts: "Clover feeds soil with nitrogen and bees with nectar — a quiet helper.",
    season: "Spring–autumn",
    pollinators: "Bees",
    symbolism: "Luck, belonging",
  },
];

export type KindnessMission = {
  id: string;
  label: string;
  detail: string;
  rareFlower: string;
};

export const KINDNESS_MISSIONS: KindnessMission[] = [
  { id: "donate-clothes", label: "Donate clothes", detail: "Pass warmth along in wearable form.", rareFlower: "Velvet Marigold" },
  { id: "bake-someone", label: "Bake something for someone", detail: "Sweetness shared is sweetness doubled.", rareFlower: "Honey Blush Peony" },
  { id: "encouraging-note", label: "Leave an encouraging note", detail: "A few kind words can root somewhere unseen.", rareFlower: "Inkpetal" },
  { id: "help-groceries", label: "Help someone carry groceries", detail: "Lighten a load, brighten a path.", rareFlower: "Pathside Primrose" },
  { id: "send-flowers", label: "Send flowers", detail: "Let color travel for you.", rareFlower: "Courier Lily" },
  { id: "volunteer", label: "Volunteer", detail: "Give time like sunlight.", rareFlower: "Commons Rose" },
  { id: "plant-flower", label: "Plant a flower", detail: "Leave beauty growing behind you.", rareFlower: "Rooted Aster" },
  { id: "thank-you", label: "Write a thank-you message", detail: "Gratitude is a soft fertilizer.", rareFlower: "Grateful Clover" },
  { id: "local-business", label: "Support a local business", detail: "Tend the meadow of your neighborhood.", rareFlower: "Market Poppy" },
];

export function weeklyKindness(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 86_400_000));
  const start = (week * 2) % KINDNESS_MISSIONS.length;
  return [0, 1, 2].map(
    (i) => KINDNESS_MISSIONS[(start + i) % KINDNESS_MISSIONS.length]
  );
}

export type JoySeed = {
  id: string;
  prompt: string;
};

export const JOY_SEEDS: JoySeed[] = [
  { id: "laugh", prompt: "What's something that made you laugh recently?" },
  { id: "smell", prompt: "Share your favorite smell." },
  { id: "dream-garden", prompt: "Describe your dream garden." },
  { id: "cozy-photo", prompt: "Share a cozy photo (or describe one)." },
  { id: "comfort-movie", prompt: "Recommend a comforting movie." },
  { id: "favorite-season", prompt: "What's your favorite season?" },
  {
    id: "childhood-nature",
    prompt: "What's your happiest childhood memory involving nature?",
  },
];

export function featuredJoySeed(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 86_400_000));
  return JOY_SEEDS[week % JOY_SEEDS.length];
}

export type WildVisitor = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  prefers: string;
  needBlooms: number;
};

export const WILD_VISITORS: WildVisitor[] = [
  { id: "butterflies", name: "Butterflies", emoji: "🦋", image: "/garden/visitors/butterfly.jpg", prefers: "Wildflowers & nectar", needBlooms: 3 },
  { id: "bees", name: "Bees", emoji: "🐝", image: "/garden/visitors/bee.jpg", prefers: "Lavender & clover", needBlooms: 5 },
  { id: "ladybugs", name: "Ladybugs", emoji: "🐞", image: "/garden/visitors/ladybug.jpg", prefers: "Sunny leaf edges", needBlooms: 4 },
  { id: "hedgehogs", name: "Hedgehogs", emoji: "🦔", image: "/garden/visitors/hedgehog.jpg", prefers: "Quiet undergrowth", needBlooms: 8 },
  { id: "rabbits", name: "Rabbits", emoji: "🐇", image: "/garden/visitors/rabbit.jpg", prefers: "Daisy patches", needBlooms: 6 },
  { id: "bluebirds", name: "Bluebirds", emoji: "🐦", image: "/garden/visitors/bluebird.jpg", prefers: "Open meadows", needBlooms: 7 },
  { id: "robins", name: "Robins", emoji: "🧡", image: "/garden/visitors/robin.jpg", prefers: "Morning paths", needBlooms: 7 },
  { id: "foxes", name: "Foxes", emoji: "🦊", image: "/garden/visitors/fox.jpg", prefers: "Twilight edges", needBlooms: 12 },
  { id: "hummingbirds", name: "Hummingbirds", emoji: "✨", image: "/garden/visitors/hummingbird.jpg", prefers: "Hibiscus & bright tubes", needBlooms: 10 },
];

export type GardenCollection = {
  id: string;
  title: string;
  emoji: string;
  need: number;
  decoration: string;
};

export const GARDEN_COLLECTIONS: GardenCollection[] = [
  { id: "wildflowers", title: "Wildflowers", emoji: "🌼", need: 4, decoration: "Wildflower border" },
  { id: "spring", title: "Spring Flowers", emoji: "🌷", need: 3, decoration: "Spring bunting" },
  { id: "summer", title: "Summer Blooms", emoji: "🌻", need: 3, decoration: "Sun hat trellis" },
  { id: "autumn", title: "Autumn Flowers", emoji: "🍂", need: 3, decoration: "Golden leaf path" },
  { id: "night", title: "Night Flowers", emoji: "🌙", need: 2, decoration: "Moonlit lanterns" },
  { id: "herbs", title: "Medicinal Herbs", emoji: "🌿", need: 3, decoration: "Herb spiral" },
  { id: "rare", title: "Rare Blossoms", emoji: "💎", need: 3, decoration: "Crystal dew fountain" },
];

export const COMMUNITY_MILESTONES = [
  { id: "butterflies", at: 10000, label: "10,000 flowers · Butterflies appear", badge: "Meadow Butterfly Badge" },
  { id: "cherry", at: 25000, label: "25,000 kindnesses · Cherry blossoms bloom", badge: "Cherry Blossom Badge" },
  { id: "fountain", at: 50000, label: "50,000 blooms · Magical fountain appears", badge: "Fountain Keeper Badge" },
  { id: "festival", at: 100000, label: "100,000 blooms · The Clover Festival begins", badge: "Clover Festival Badge" },
];

export const GARDEN_ART = {
  meadowBg: "/garden/decor/meadow-bg.jpg",
  birdhouse: "/garden/decor/birdhouse.jpg",
} as const;

export const MEADOW_FLOWER_IMAGES = [
  "/garden/flowers/daisy.jpg",
  "/garden/flowers/tulip.jpg",
  "/garden/flowers/sunflower.jpg",
  "/garden/flowers/lavender.jpg",
  "/garden/flowers/rose.jpg",
  "/garden/flowers/clover.jpg",
  "/garden/flowers/cherry-blossom.jpg",
  "/garden/flowers/dandelion.jpg",
] as const;

export const BLOOM_FLOWERS = [
  "Daisy",
  "Buttercup",
  "Clover",
  "Poppy",
  "Cornflower",
  "Primrose",
  "Forget-me-not",
  "Wild rose",
  "Foxglove",
  "Queen Anne's lace",
];

export function bloomFlowerForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997;
  return BLOOM_FLOWERS[hash % BLOOM_FLOWERS.length];
}
