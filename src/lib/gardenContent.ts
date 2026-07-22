export type GardenTabId =
  | "overview"
  | "daily"
  | "spotting"
  | "kindness"
  | "seeds"
  | "visitors"
  | "wish"
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
  { id: "wish", label: "The Wish Tree", emoji: "🌳" },
  { id: "community", label: "Community Meadow", emoji: "🏕" },
  { id: "journal", label: "Garden Journal", emoji: "📔" },
];

export const GARDEN_XP = {
  daily: 40,
  spotting: 70,
  kindness: 100,
  seed: 35,
  wish: 30,
  encourage: 10,
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

export type DailyTask = {
  id: string;
  label: string;
  emoji: string;
};

export const DAILY_TASK_POOL: DailyTask[] = [
  { id: "compliment", label: "Give someone a genuine compliment.", emoji: "💛" },
  { id: "appreciate", label: "Tell someone why you appreciate them.", emoji: "💌" },
  { id: "favorite-flower", label: "Pick your favorite flower from today's garden.", emoji: "🌼" },
  { id: "happy-memory", label: "Share a happy memory.", emoji: "🌸" },
  { id: "outside-10", label: "Spend 10 minutes outside.", emoji: "☀️" },
  { id: "smell-flower", label: "Smell a real flower.", emoji: "🌷" },
  { id: "photo-new-flower", label: "Photograph a flower you've never noticed before.", emoji: "🌺" },
  { id: "learn-flower", label: "Learn the name of one flower.", emoji: "🌻" },
  { id: "watch-bee", label: "Watch a bee or butterfly for one minute.", emoji: "🐝" },
  { id: "favorite-color", label: "Wear your favorite color today.", emoji: "🌈" },
  { id: "make-smile", label: "Make someone smile.", emoji: "😊" },
  { id: "comfort-song", label: "Share a comforting song.", emoji: "🎵" },
  { id: "photo-beautiful", label: "Photograph something beautiful.", emoji: "📷" },
  { id: "new-conversation", label: "Start a conversation with someone new.", emoji: "💬" },
  { id: "warm-drink", label: "Make yourself a warm drink and enjoy it without distractions.", emoji: "🍵" },
  { id: "read-poem", label: "Read a poem.", emoji: "📖" },
  { id: "water-plant", label: "Water a real plant.", emoji: "🌿" },
  { id: "arrange-flowers", label: "Arrange flowers in a vase.", emoji: "💐" },
  { id: "watch-sunset", label: "Watch the sunset.", emoji: "🌙" },
  { id: "watch-sunrise", label: "Watch the sunrise.", emoji: "⭐" },
  { id: "listen-birds", label: "Listen to birds for five minutes.", emoji: "🐦" },
  { id: "new-fruit", label: "Eat a piece of fruit you've never tried.", emoji: "🍓" },
  { id: "call-someone", label: "Call someone you haven't spoken to in a while.", emoji: "📞" },
  { id: "forgive-self", label: "Forgive yourself for one mistake.", emoji: "🕊" },
  { id: "grateful", label: "Write down one thing you're grateful for.", emoji: "💭" },
];

export function dailyTasksForDay(now = new Date()): DailyTask[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  const picks: DailyTask[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = (day * 7 + i * 3) % DAILY_TASK_POOL.length;
    const task = DAILY_TASK_POOL[idx];
    if (!picks.find((p) => p.id === task.id)) picks.push(task);
    else {
      const alt = DAILY_TASK_POOL[(idx + 5) % DAILY_TASK_POOL.length];
      if (!picks.find((p) => p.id === alt.id)) picks.push(alt);
    }
  }
  while (picks.length < 5) {
    picks.push(DAILY_TASK_POOL[picks.length % DAILY_TASK_POOL.length]);
  }
  return picks.slice(0, 5);
}

export type SpotFlower = {
  id: string;
  name: string;
  emoji: string;
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
    facts: "Daisies open with the sun and close at dusk — little meadow clocks.",
    season: "Spring–summer",
    pollinators: "Bees, butterflies",
    symbolism: "Innocence, new beginnings",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    facts: "Roses have been cultivated for thousands of years as symbols of devotion.",
    season: "Late spring–autumn",
    pollinators: "Bees, beetles",
    symbolism: "Love, gratitude",
  },
  {
    id: "tulip",
    name: "Tulip",
    emoji: "🌷",
    facts: "Tulips once sparked a frenzy of trade in the Dutch Golden Age.",
    season: "Spring",
    pollinators: "Bees",
    symbolism: "Cheerful declaration",
  },
  {
    id: "lavender",
    name: "Lavender",
    emoji: "💜",
    facts: "Lavender's scent calms minds and draws pollinators in soft purple waves.",
    season: "Summer",
    pollinators: "Bees, butterflies",
    symbolism: "Calm, devotion",
  },
  {
    id: "sunflower",
    name: "Sunflower",
    emoji: "🌻",
    facts: "Young sunflowers track the sun across the sky (heliotropism).",
    season: "Summer–early autumn",
    pollinators: "Bees, birds",
    symbolism: "Loyalty, warmth",
  },
  {
    id: "bluebell",
    name: "Bluebell",
    emoji: "🪻",
    facts: "Bluebell woods carpet forest floors in a single enchanted week each spring.",
    season: "Spring",
    pollinators: "Bees, hoverflies",
    symbolism: "Humility, gratitude",
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    emoji: "🌺",
    facts: "Many hibiscus blooms last only a day — beauty in a brief visit.",
    season: "Warm months",
    pollinators: "Hummingbirds, bees",
    symbolism: "Delicate joy",
  },
  {
    id: "cherry-blossom",
    name: "Cherry Blossom",
    emoji: "🌸",
    facts: "Sakura reminds us that fleeting moments can be the most precious.",
    season: "Early spring",
    pollinators: "Bees",
    symbolism: "Impermanence, renewal",
  },
  {
    id: "dandelion",
    name: "Dandelion",
    emoji: "🌼",
    facts: "Every part of a dandelion is useful — from root tea to seed wishes.",
    season: "Spring–autumn",
    pollinators: "Bees, butterflies",
    symbolism: "Resilience, wishes",
  },
  {
    id: "hydrangea",
    name: "Hydrangea",
    emoji: "🌹",
    facts: "Hydrangea color can shift with soil acidity — chemistry as watercolor.",
    season: "Summer",
    pollinators: "Bees",
    symbolism: "Heartfelt emotion",
  },
  {
    id: "bougainvillea",
    name: "Bougainvillea",
    emoji: "🌺",
    facts: "The bright “petals” are actually bracts; tiny flowers hide in the center.",
    season: "Warm seasons",
    pollinators: "Butterflies, bees",
    symbolism: "Passion, welcome",
  },
  {
    id: "clover",
    name: "Clover",
    emoji: "🌿",
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
  prefers: string;
  needBlooms: number;
};

export const WILD_VISITORS: WildVisitor[] = [
  { id: "butterflies", name: "Butterflies", emoji: "🦋", prefers: "Wildflowers & nectar", needBlooms: 3 },
  { id: "bees", name: "Bees", emoji: "🐝", prefers: "Lavender & clover", needBlooms: 5 },
  { id: "ladybugs", name: "Ladybugs", emoji: "🐞", prefers: "Sunny leaf edges", needBlooms: 4 },
  { id: "hedgehogs", name: "Hedgehogs", emoji: "🦔", prefers: "Quiet undergrowth", needBlooms: 8 },
  { id: "rabbits", name: "Rabbits", emoji: "🐇", prefers: "Daisy patches", needBlooms: 6 },
  { id: "bluebirds", name: "Bluebirds", emoji: "🐦", prefers: "Open meadows", needBlooms: 7 },
  { id: "robins", name: "Robins", emoji: "🧡", prefers: "Morning paths", needBlooms: 7 },
  { id: "foxes", name: "Foxes", emoji: "🦊", prefers: "Twilight edges", needBlooms: 12 },
  { id: "hummingbirds", name: "Hummingbirds", emoji: "✨", prefers: "Hibiscus & bright tubes", needBlooms: 10 },
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

export const WISH_GESTURES = [
  { id: "bloom", label: "Bloom", emoji: "🌸" },
  { id: "warmth", label: "Warmth", emoji: "💛" },
  { id: "hope", label: "Hope", emoji: "🕊" },
  { id: "light", label: "Light", emoji: "✨" },
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
