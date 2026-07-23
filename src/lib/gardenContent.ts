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

export type GardenSeason = "spring" | "summer" | "autumn" | "winter";

export type VisitorCategory =
  | "birds"
  | "butterflies"
  | "pollinators"
  | "gardenFriends"
  | "mammals"
  | "tiny"
  | "night";

export type VisitorRegion =
  | "curaçao"
  | "suriname"
  | "netherlands"
  | "shared";

export type VisitorRarity = "common" | "uncommon" | "rare" | "night";

export const VISITOR_CATEGORY_LABELS: Record<
  VisitorCategory,
  { label: string; emoji: string }
> = {
  birds: { label: "Birds", emoji: "🐦" },
  butterflies: { label: "Butterflies", emoji: "🦋" },
  pollinators: { label: "Helpful Pollinators", emoji: "🐝" },
  gardenFriends: { label: "Garden Friends", emoji: "🦎" },
  mammals: { label: "Small Mammals", emoji: "🐇" },
  tiny: { label: "Tiny Visitors", emoji: "🐞" },
  night: { label: "Rare Night Visitors", emoji: "🌙" },
};

export const VISITOR_REGION_LABELS: Record<VisitorRegion, string> = {
  curaçao: "Curaçao",
  suriname: "Suriname",
  netherlands: "Netherlands",
  shared: "Shared skies",
};

const VIMG = {
  bird: "/garden/visitors/robin.jpg",
  songbird: "/garden/visitors/bluebird.jpg",
  hummingbird: "/garden/visitors/hummingbird.jpg",
  butterfly: "/garden/visitors/butterfly.jpg",
  bee: "/garden/visitors/bee.jpg",
  ladybug: "/garden/visitors/ladybug.jpg",
  hedgehog: "/garden/visitors/hedgehog.jpg",
  rabbit: "/garden/visitors/rabbit.jpg",
  fox: "/garden/visitors/fox.jpg",
} as const;

/** Plants & decorations that draw wildlife into the meadow. */
export type GardenAttractor = {
  id: string;
  label: string;
  emoji: string;
  hint: string;
};

export const GARDEN_ATTRACTORS: GardenAttractor[] = [
  {
    id: "sunflowers",
    label: "Sunflowers",
    emoji: "🌻",
    hint: "Spot a sunflower or unlock Summer Blooms.",
  },
  {
    id: "hibiscus",
    label: "Hibiscus",
    emoji: "🌺",
    hint: "Spot a hibiscus blossom.",
  },
  {
    id: "lavender",
    label: "Lavender",
    emoji: "🪻",
    hint: "Spot lavender or unlock the Herb spiral.",
  },
  {
    id: "berry-bushes",
    label: "Berry bushes",
    emoji: "🍓",
    hint: "Unlocks around 12 blooms.",
  },
  {
    id: "native-trees",
    label: "Large native trees",
    emoji: "🌳",
    hint: "Unlocks around 22 blooms.",
  },
  {
    id: "pond",
    label: "Small pond",
    emoji: "🪨",
    hint: "Unlocks around 18 blooms.",
  },
  {
    id: "birdhouse",
    label: "Birdhouses",
    emoji: "🪺",
    hint: "Unlocks around 8 blooms.",
  },
  {
    id: "wildflower-meadow",
    label: "Wildflower meadows",
    emoji: "🌼",
    hint: "Complete the Wildflowers collection.",
  },
  {
    id: "undergrowth",
    label: "Quiet undergrowth",
    emoji: "🌿",
    hint: "Unlocks around 28 blooms.",
  },
  {
    id: "night-garden",
    label: "Moonlit garden",
    emoji: "🌙",
    hint: "Unlock Night Flowers or Community Meadow milestones.",
  },
];

/** Decorations granted purely by bloom count (attraction infrastructure). */
export const BLOOM_ATTRACTOR_DECORATIONS: Array<{
  needBlooms: number;
  decoration: string;
  attractorId: string;
}> = [
  { needBlooms: 8, decoration: "Birdhouse", attractorId: "birdhouse" },
  { needBlooms: 12, decoration: "Berry bushes", attractorId: "berry-bushes" },
  { needBlooms: 15, decoration: "Wildflower meadow", attractorId: "wildflower-meadow" },
  { needBlooms: 18, decoration: "Garden pond", attractorId: "pond" },
  { needBlooms: 22, decoration: "Native shade trees", attractorId: "native-trees" },
  { needBlooms: 28, decoration: "Quiet undergrowth", attractorId: "undergrowth" },
];

export const NATURE_JOURNAL_REWARDS = {
  decoration: "Nature Journal alcove",
  lookout: "Wildlife lookout",
  badge: "Nature Journal Complete",
} as const;

export type WildVisitor = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  category: VisitorCategory;
  region: VisitorRegion;
  seasons: GardenSeason[];
  favorites: string[];
  needBlooms: number;
  rarity: VisitorRarity;
  note?: string;
};

export const WILD_VISITORS: WildVisitor[] = [
  // Birds
  {
    id: "bananaquit",
    name: "Bananaquit (Suikerdiefje)",
    emoji: "🍌",
    image: "/garden/visitors/bananaquit.jpg",
    category: "birds",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["hibiscus", "birdhouse", "native-trees"],
    needBlooms: 6,
    rarity: "common",
  },
  {
    id: "troupial",
    name: "Troupial (Trupial)",
    emoji: "🧡",
    image: "/garden/visitors/troupial.jpg",
    category: "birds",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "berry-bushes"],
    needBlooms: 10,
    rarity: "uncommon",
  },
  {
    id: "brown-throated-parakeet",
    name: "Brown-throated Parakeet",
    emoji: "🦜",
    image: "/garden/visitors/brown-throated-parakeet.jpg",
    category: "birds",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn", "winter"],
    favorites: ["native-trees"],
    needBlooms: 14,
    rarity: "uncommon",
  },
  {
    id: "tropical-mockingbird",
    name: "Tropical Mockingbird",
    emoji: "🐦",
    image: "/garden/visitors/tropical-mockingbird.jpg",
    category: "birds",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["berry-bushes", "birdhouse"],
    needBlooms: 8,
    rarity: "common",
  },
  {
    id: "caribbean-elaenia",
    name: "Caribbean Elaenia",
    emoji: "🐦",
    image: "/garden/visitors/caribbean-elaenia.jpg",
    category: "birds",
    region: "curaçao",
    seasons: ["spring", "summer"],
    favorites: ["native-trees", "wildflower-meadow"],
    needBlooms: 11,
    rarity: "uncommon",
  },
  {
    id: "hummingbird",
    name: "Hummingbird",
    emoji: "✨",
    image: "/garden/visitors/hummingbird.jpg",
    category: "birds",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["hibiscus", "lavender"],
    needBlooms: 9,
    rarity: "common",
    note: "Curaçao & Suriname",
  },
  {
    id: "scarlet-macaw",
    name: "Scarlet Macaw",
    emoji: "🦜",
    image: "/garden/visitors/scarlet-macaw.jpg",
    category: "birds",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees"],
    needBlooms: 24,
    rarity: "rare",
  },
  {
    id: "toucan",
    name: "Toucan",
    emoji: "🦜",
    image: "/garden/visitors/toucan.jpg",
    category: "birds",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "berry-bushes"],
    needBlooms: 26,
    rarity: "rare",
  },
  {
    id: "great-kiskadee",
    name: "Great Kiskadee",
    emoji: "🐦",
    image: "/garden/visitors/great-kiskadee.jpg",
    category: "birds",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["berry-bushes", "pond"],
    needBlooms: 12,
    rarity: "uncommon",
  },
  {
    id: "blue-gray-tanager",
    name: "Blue-gray Tanager",
    emoji: "🐦",
    image: "/garden/visitors/blue-gray-tanager.jpg",
    category: "birds",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["berry-bushes"],
    needBlooms: 13,
    rarity: "uncommon",
  },
  {
    id: "robin",
    name: "Robin",
    emoji: "🧡",
    image: "/garden/visitors/robin.jpg",
    category: "birds",
    region: "netherlands",
    seasons: ["spring", "autumn", "winter"],
    favorites: ["berry-bushes", "birdhouse"],
    needBlooms: 7,
    rarity: "common",
  },
  {
    id: "great-tit",
    name: "Great Tit",
    emoji: "🐦",
    image: "/garden/visitors/great-tit.jpg",
    category: "birds",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn", "winter"],
    favorites: ["birdhouse", "native-trees"],
    needBlooms: 8,
    rarity: "common",
  },
  {
    id: "european-blackbird",
    name: "European Blackbird",
    emoji: "🐦",
    image: "/garden/visitors/european-blackbird.jpg",
    category: "birds",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["berry-bushes", "undergrowth"],
    needBlooms: 9,
    rarity: "common",
  },
  {
    id: "eurasian-blue-tit",
    name: "Eurasian Blue Tit",
    emoji: "🐦",
    image: "/garden/visitors/eurasian-blue-tit.jpg",
    category: "birds",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn", "winter"],
    favorites: ["birdhouse"],
    needBlooms: 7,
    rarity: "common",
  },
  {
    id: "barn-swallow",
    name: "Barn Swallow",
    emoji: "🐦",
    image: "/garden/visitors/barn-swallow.jpg",
    category: "birds",
    region: "netherlands",
    seasons: ["spring", "summer"],
    favorites: ["wildflower-meadow", "pond"],
    needBlooms: 10,
    rarity: "uncommon",
  },

  // Butterflies
  {
    id: "monarch",
    name: "Monarch Butterfly",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "shared",
    seasons: ["summer", "autumn"],
    favorites: ["wildflower-meadow", "sunflowers"],
    needBlooms: 4,
    rarity: "common",
  },
  {
    id: "julia",
    name: "Julia Butterfly",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["hibiscus", "wildflower-meadow"],
    needBlooms: 5,
    rarity: "common",
  },
  {
    id: "gulf-fritillary",
    name: "Gulf Fritillary",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "curaçao",
    seasons: ["spring", "summer"],
    favorites: ["wildflower-meadow", "hibiscus"],
    needBlooms: 6,
    rarity: "common",
  },
  {
    id: "painted-lady",
    name: "Painted Lady",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["wildflower-meadow", "lavender"],
    needBlooms: 5,
    rarity: "common",
  },
  {
    id: "small-white",
    name: "Small White",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "netherlands",
    seasons: ["spring", "summer"],
    favorites: ["wildflower-meadow"],
    needBlooms: 3,
    rarity: "common",
  },
  {
    id: "peacock-butterfly",
    name: "Peacock Butterfly",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["wildflower-meadow", "undergrowth"],
    needBlooms: 7,
    rarity: "uncommon",
  },
  {
    id: "common-buckeye",
    name: "Common Buckeye",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "shared",
    seasons: ["summer", "autumn"],
    favorites: ["wildflower-meadow", "sunflowers"],
    needBlooms: 6,
    rarity: "common",
  },
  {
    id: "blue-morpho",
    name: "Blue Morpho",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "butterflies",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "wildflower-meadow"],
    needBlooms: 20,
    rarity: "rare",
  },

  // Pollinators
  {
    id: "honey-bee",
    name: "Honey Bee",
    emoji: "🐝",
    image: VIMG.bee,
    category: "pollinators",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["sunflowers", "lavender", "wildflower-meadow"],
    needBlooms: 4,
    rarity: "common",
  },
  {
    id: "carpenter-bee",
    name: "Carpenter Bee",
    emoji: "🐝",
    image: VIMG.bee,
    category: "pollinators",
    region: "shared",
    seasons: ["spring", "summer"],
    favorites: ["sunflowers", "hibiscus"],
    needBlooms: 7,
    rarity: "uncommon",
  },
  {
    id: "bumblebee",
    name: "Bumblebee",
    emoji: "🐝",
    image: VIMG.bee,
    category: "pollinators",
    region: "netherlands",
    seasons: ["spring", "summer"],
    favorites: ["lavender", "wildflower-meadow"],
    needBlooms: 5,
    rarity: "common",
  },
  {
    id: "stingless-bee",
    name: "Stingless Bee",
    emoji: "🐝",
    image: VIMG.bee,
    category: "pollinators",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["hibiscus", "native-trees"],
    needBlooms: 8,
    rarity: "uncommon",
  },
  {
    id: "hoverfly",
    name: "Hoverfly",
    emoji: "🐝",
    image: VIMG.bee,
    category: "pollinators",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["wildflower-meadow", "lavender"],
    needBlooms: 3,
    rarity: "common",
  },

  // Garden friends
  {
    id: "green-iguana",
    name: "Green Iguana",
    emoji: "🦎",
    image: VIMG.fox,
    category: "gardenFriends",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "pond"],
    needBlooms: 16,
    rarity: "uncommon",
  },
  {
    id: "curacao-whiptail",
    name: "Curaçao Whiptail Lizard",
    emoji: "🦎",
    image: VIMG.fox,
    category: "gardenFriends",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn", "winter"],
    favorites: ["undergrowth", "wildflower-meadow"],
    needBlooms: 9,
    rarity: "common",
  },
  {
    id: "house-gecko",
    name: "House Gecko",
    emoji: "🦎",
    image: VIMG.hedgehog,
    category: "gardenFriends",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["birdhouse", "undergrowth"],
    needBlooms: 5,
    rarity: "common",
  },
  {
    id: "anole-lizard",
    name: "Anole Lizard",
    emoji: "🦎",
    image: VIMG.fox,
    category: "gardenFriends",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "hibiscus"],
    needBlooms: 8,
    rarity: "common",
  },
  {
    id: "tiny-tree-frog",
    name: "Tiny Tree Frog",
    emoji: "🐸",
    image: VIMG.hedgehog,
    category: "gardenFriends",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["pond", "native-trees"],
    needBlooms: 14,
    rarity: "uncommon",
  },

  // Mammals
  {
    id: "european-hedgehog",
    name: "European Hedgehog",
    emoji: "🦔",
    image: VIMG.hedgehog,
    category: "mammals",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["undergrowth"],
    needBlooms: 11,
    rarity: "uncommon",
  },
  {
    id: "european-rabbit",
    name: "European Rabbit",
    emoji: "🐇",
    image: VIMG.rabbit,
    category: "mammals",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["wildflower-meadow", "berry-bushes"],
    needBlooms: 8,
    rarity: "common",
  },
  {
    id: "red-squirrel",
    name: "Red Squirrel",
    emoji: "🐿️",
    image: VIMG.rabbit,
    category: "mammals",
    region: "netherlands",
    seasons: ["spring", "summer", "autumn", "winter"],
    favorites: ["native-trees", "berry-bushes"],
    needBlooms: 12,
    rarity: "uncommon",
  },
  {
    id: "agouti",
    name: "Agouti",
    emoji: "🐇",
    image: VIMG.rabbit,
    category: "mammals",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "undergrowth"],
    needBlooms: 18,
    rarity: "rare",
  },
  {
    id: "nine-banded-armadillo",
    name: "Nine-banded Armadillo",
    emoji: "🐾",
    image: VIMG.fox,
    category: "mammals",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["undergrowth", "native-trees"],
    needBlooms: 35,
    rarity: "rare",
    note: "Very rare visitor",
  },

  // Tiny
  {
    id: "ladybug",
    name: "Ladybug",
    emoji: "🐞",
    image: VIMG.ladybug,
    category: "tiny",
    region: "shared",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["wildflower-meadow", "lavender"],
    needBlooms: 3,
    rarity: "common",
  },
  {
    id: "dragonfly",
    name: "Dragonfly",
    emoji: "🪰",
    image: VIMG.ladybug,
    category: "tiny",
    region: "shared",
    seasons: ["spring", "summer"],
    favorites: ["pond"],
    needBlooms: 10,
    rarity: "uncommon",
  },
  {
    id: "praying-mantis",
    name: "Praying Mantis",
    emoji: "🪲",
    image: VIMG.ladybug,
    category: "tiny",
    region: "shared",
    seasons: ["summer", "autumn"],
    favorites: ["wildflower-meadow", "undergrowth"],
    needBlooms: 12,
    rarity: "uncommon",
  },
  {
    id: "leafcutter-ant",
    name: "Leafcutter Ant",
    emoji: "🐜",
    image: VIMG.ladybug,
    category: "tiny",
    region: "suriname",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["native-trees", "undergrowth"],
    needBlooms: 15,
    rarity: "uncommon",
  },
  {
    id: "firefly",
    name: "Firefly",
    emoji: "✨",
    image: VIMG.ladybug,
    category: "tiny",
    region: "suriname",
    seasons: ["summer", "autumn"],
    favorites: ["pond", "night-garden", "undergrowth"],
    needBlooms: 16,
    rarity: "uncommon",
  },
  {
    id: "walking-stick",
    name: "Walking Stick Insect",
    emoji: "🪲",
    image: VIMG.ladybug,
    category: "tiny",
    region: "shared",
    seasons: ["summer", "autumn"],
    favorites: ["native-trees", "undergrowth"],
    needBlooms: 13,
    rarity: "uncommon",
  },

  // Rare night visitors
  {
    id: "barn-owl",
    name: "Barn Owl",
    emoji: "🦉",
    image: VIMG.fox,
    category: "night",
    region: "netherlands",
    seasons: ["autumn", "winter"],
    favorites: ["night-garden", "native-trees"],
    needBlooms: 30,
    rarity: "night",
    note: "Appears after seasonal or community events",
  },
  {
    id: "spectacled-owl",
    name: "Spectacled Owl",
    emoji: "🦉",
    image: VIMG.fox,
    category: "night",
    region: "suriname",
    seasons: ["autumn", "winter"],
    favorites: ["night-garden", "native-trees"],
    needBlooms: 32,
    rarity: "night",
    note: "Appears after seasonal or community events",
  },
  {
    id: "nectar-bat",
    name: "Nectar Bat",
    emoji: "🦇",
    image: VIMG.hummingbird,
    category: "night",
    region: "curaçao",
    seasons: ["spring", "summer", "autumn"],
    favorites: ["night-garden", "hibiscus"],
    needBlooms: 28,
    rarity: "night",
    note: "Appears after seasonal or community events",
  },
  {
    id: "luna-moth",
    name: "Luna Moth",
    emoji: "🦋",
    image: VIMG.butterfly,
    category: "night",
    region: "shared",
    seasons: ["spring", "summer"],
    favorites: ["night-garden", "native-trees"],
    needBlooms: 25,
    rarity: "night",
    note: "Appears after seasonal or community events",
  },
  {
    id: "fireflies-night",
    name: "Fireflies",
    emoji: "✨",
    image: VIMG.ladybug,
    category: "night",
    region: "suriname",
    seasons: ["summer", "autumn"],
    favorites: ["night-garden", "pond"],
    needBlooms: 27,
    rarity: "night",
    note: "Appears after seasonal or community events",
  },
];

export function currentGardenSeason(now = new Date()): GardenSeason {
  const month = now.getUTCMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export type VisitorAttractionContext = {
  blooms: number;
  decorations: string[];
  spotted: Record<string, unknown>;
  collections: Record<string, number>;
  communityBlooms: number;
  communityKindness: number;
  season?: GardenSeason;
};

export function unlockedAttractorIds(
  ctx: VisitorAttractionContext
): Set<string> {
  const unlocked = new Set<string>();
  const { blooms, decorations, spotted, collections } = ctx;

  for (const row of BLOOM_ATTRACTOR_DECORATIONS) {
    if (blooms >= row.needBlooms || decorations.includes(row.decoration)) {
      unlocked.add(row.attractorId);
    }
  }

  if (spotted.sunflower || collections.summer) unlocked.add("sunflowers");
  if (spotted.hibiscus) unlocked.add("hibiscus");
  if (spotted.lavender || collections.herbs || decorations.includes("Herb spiral")) {
    unlocked.add("lavender");
  }
  if (
    collections.wildflowers ||
    decorations.includes("Wildflower border") ||
    decorations.includes("Wildflower meadow")
  ) {
    unlocked.add("wildflower-meadow");
  }
  if (
    decorations.includes("Moonlit lanterns") ||
    collections.night ||
    ctx.communityBlooms >= 10000
  ) {
    unlocked.add("night-garden");
  }

  return unlocked;
}

export function syncBloomDecorations(
  blooms: number,
  decorations: string[]
): string[] {
  let next = [...decorations];
  for (const row of BLOOM_ATTRACTOR_DECORATIONS) {
    if (blooms >= row.needBlooms && !next.includes(row.decoration)) {
      next = [...next, row.decoration];
    }
  }
  return next;
}

export function visitorCanArrive(
  visitor: WildVisitor,
  ctx: VisitorAttractionContext
): boolean {
  const season = ctx.season || currentGardenSeason();
  if (ctx.blooms < visitor.needBlooms) return false;
  if (!visitor.seasons.includes(season)) return false;

  const unlocked = unlockedAttractorIds(ctx);
  const hasFavorite = visitor.favorites.some((id) => unlocked.has(id));
  if (!hasFavorite) return false;

  if (visitor.rarity === "night") {
    const eventReady =
      unlocked.has("night-garden") ||
      ctx.communityBlooms >= 10000 ||
      ctx.communityKindness >= 25000;
    if (!eventReady) return false;
  }

  if (visitor.id === "nine-banded-armadillo") {
    if (ctx.blooms < 35 || !unlocked.has("undergrowth") || !unlocked.has("native-trees")) {
      return false;
    }
  }

  return true;
}

export function evaluateWildVisitors(
  ctx: VisitorAttractionContext
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const visitor of WILD_VISITORS) {
    if (visitorCanArrive(visitor, ctx)) next[visitor.id] = true;
  }
  return next;
}

export function natureJournalProgress(visitors: Record<string, boolean>) {
  const discoverable = WILD_VISITORS.filter((v) => v.rarity !== "night");
  const found = discoverable.filter((v) => visitors[v.id]).length;
  const nightFound = WILD_VISITORS.filter(
    (v) => v.rarity === "night" && visitors[v.id]
  ).length;
  const complete = found >= discoverable.length;
  return {
    found,
    total: discoverable.length,
    nightFound,
    nightTotal: WILD_VISITORS.filter((v) => v.rarity === "night").length,
    complete,
  };
}

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
