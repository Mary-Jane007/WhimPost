export type LibraryTabId =
  | "bookclub"
  | "readinglist"
  | "curiosity"
  | "mystery"
  | "challenges"
  | "thoughts"
  | "archives"
  | "journal";

export const LIBRARY_TABS: Array<{
  id: LibraryTabId;
  label: string;
  emoji: string;
}> = [
  { id: "bookclub", label: "Monthly Book Club", emoji: "📚" },
  { id: "readinglist", label: "Owl's Reading List", emoji: "🦉" },
  { id: "curiosity", label: "Curiosity Cabinet", emoji: "🔎" },
  { id: "mystery", label: "Mystery of the Month", emoji: "🗝" },
  { id: "challenges", label: "Archive Challenges", emoji: "📜" },
  { id: "thoughts", label: "Thought Experiments", emoji: "🧠" },
  { id: "archives", label: "Mosshollow Archives", emoji: "📺" },
  { id: "journal", label: "Archivist Journal", emoji: "🏆" },
];

export const LIBRARY_XP = {
  reading: 75,
  mystery: 120,
  quiz: 30,
  reflection: 40,
  review: 50,
  challenge: 35,
  thought: 40,
  archive: 25,
  secret: 45,
  journal: 25,
} as const;

export const LIBRARY_TITLES = [
  { minXp: 0, title: "Curious Reader", emoji: "📖" },
  { minXp: 150, title: "Library Assistant", emoji: "🕯" },
  { minXp: 400, title: "Junior Archivist", emoji: "🪶" },
  { minXp: 800, title: "Senior Archivist", emoji: "🦉" },
  { minXp: 1400, title: "Keeper of Knowledge", emoji: "🗝" },
  { minXp: 2200, title: "Master Librarian", emoji: "🏛" },
];

export function titleForLibraryXp(xp: number) {
  let current = LIBRARY_TITLES[0];
  for (const row of LIBRARY_TITLES) {
    if (xp >= row.minXp) current = row;
  }
  return current;
}

export type ClubBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  minutes: number;
  coverEmoji: string;
  quotes: string[];
  reflections: string[];
  /** Optional uploaded cover image URL (`/api/uploads/...`). */
  coverUrl?: string | null;
  /** Optional readable file (PDF/EPUB) URL. */
  fileUrl?: string | null;
  fileName?: string | null;
  uploaded?: boolean;
};

export const CLUB_BOOKS: ClubBook[] = [
  {
    id: "secret-garden",
    title: "The Secret Garden",
    author: "Frances Hodgson Burnett",
    description:
      "A neglected garden awakens with a lonely girl, a boy who speaks to earth, and the quiet miracle of tending what was forgotten.",
    minutes: 280,
    coverEmoji: "🌹",
    quotes: [
      "If you look the right way, you can see that the whole world is a garden.",
      "Where you tend a rose, my lad, a thistle cannot grow.",
    ],
    reflections: [
      "What neglected corner of your life could use a little care?",
      "Who helped you rediscover wonder?",
    ],
  },
  {
    id: "hobbit",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    description:
      "An unexpected adventure begins with a knock at a round green door — and a hobbit who discovers courage is sometimes simply taking the next step.",
    minutes: 360,
    coverEmoji: "🗺",
    quotes: [
      "There is nothing like looking, if you want to find something.",
      "Not all those who wander are lost.",
    ],
    reflections: [
      "When did leaving home teach you something staying never could?",
      "What would your unexpected journey be?",
    ],
  },
  {
    id: "anne",
    title: "Anne of Green Gables",
    author: "L.M. Montgomery",
    description:
      "Orphan Anne Shirley arrives with an imagination large enough for Avonlea — and a red-haired insistence that beauty belongs everywhere.",
    minutes: 320,
    coverEmoji: "🍒",
    quotes: [
      "Dear old world, you are very lovely, and I am glad to be alive in you.",
      "Kindred spirits are not so scarce as I used to think.",
    ],
    reflections: [
      "What place first felt like home because of imagination?",
      "Who is your kindred spirit?",
    ],
  },
  {
    id: "little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    description:
      "A pilot stranded in the desert meets a prince from a tiny planet, and learns that what matters is invisible to the eye.",
    minutes: 120,
    coverEmoji: "⭐",
    quotes: [
      "It is only with the heart that one can see rightly.",
      "You become responsible, forever, for what you have tamed.",
    ],
    reflections: [
      "What do you see with the heart that logic misses?",
      "What are you responsible for tending?",
    ],
  },
  {
    id: "willows",
    title: "The Wind in the Willows",
    author: "Kenneth Grahame",
    description:
      "Riverbank friendship, reckless motorcars, and the soft music of home — a hymn to loyalty and the English countryside.",
    minutes: 260,
    coverEmoji: "🚣",
    quotes: [
      "Believe me, my young friend, there is nothing — absolutely nothing — half so much worth doing as simply messing about in boats.",
    ],
    reflections: [
      "Where do you feel most like yourself outdoors?",
      "Which friend would follow you into a wild adventure?",
    ],
  },
  {
    id: "narnia",
    title: "The Chronicles of Narnia",
    author: "C.S. Lewis",
    description:
      "Wardrobes open onto snow and lamp-posts; courage, betrayal, and second chances wait beyond the coats.",
    minutes: 400,
    coverEmoji: "🦁",
    quotes: [
      "Wrong will be right, when Aslan comes in sight.",
      "Once a king or queen of Narnia, always a king or queen.",
    ],
    reflections: [
      "What doorway in your life still feels magical?",
      "When have you needed a second chance?",
    ],
  },
  {
    id: "princess",
    title: "A Little Princess",
    author: "Frances Hodgson Burnett",
    description:
      "Sara Crewe keeps her dignity and kindness even when fortune turns — proving imagination is a kind of wealth.",
    minutes: 240,
    coverEmoji: "👑",
    quotes: [
      "Whatever comes, cannot alter one thing. If I am a princess in rags and tatters, I can be a princess still.",
    ],
    reflections: [
      "How do you stay kind when circumstances shrink?",
      "What story do you tell yourself to endure hard days?",
    ],
  },
  {
    id: "velveteen",
    title: "The Velveteen Rabbit",
    author: "Margery Williams",
    description:
      "A stuffed rabbit learns that becoming Real takes love, time, and being worn soft by someone who needs you.",
    minutes: 60,
    coverEmoji: "🐇",
    quotes: [
      "Real isn't how you are made. It's a thing that happens to you.",
      "Once you are Real you can't become unreal again.",
    ],
    reflections: [
      "What has love worn soft and Real in you?",
      "Which childhood object still feels alive?",
    ],
  },
  {
    id: "tollbooth",
    title: "The Phantom Tollbooth",
    author: "Norton Juster",
    description:
      "Milo drives through a mysterious tollbooth into a land where words and numbers quarrel — and curiosity is the only map.",
    minutes: 220,
    coverEmoji: "🚗",
    quotes: [
      "You must never feel badly about making mistakes… as long as you take the trouble to learn from them.",
      "So many things are possible just as long as you don't know they're impossible.",
    ],
    reflections: [
      "What boredom in your life might be a tollbooth in disguise?",
      "Which word would you rescue from Dictionopolis?",
    ],
  },
  {
    id: "neverending",
    title: "The NeverEnding Story",
    author: "Michael Ende",
    description:
      "Bastian hides in an attic with a stolen book — and discovers Fantastica needs a reader brave enough to give it a new name.",
    minutes: 380,
    coverEmoji: "🐉",
    quotes: [
      "Every real story is a never ending story.",
      "You must let what happens happen; everything must be equal in your heart.",
    ],
    reflections: [
      "What story are you inside without noticing?",
      "If Fantastica asked for a new name, what would you give?",
    ],
  },
];

export function featuredClubBook(now = new Date()) {
  const idx = now.getUTCMonth() % CLUB_BOOKS.length;
  return CLUB_BOOKS[idx];
}

export type ReadingCategory =
  | "Fantasy"
  | "Mystery"
  | "Philosophy"
  | "Psychology"
  | "History"
  | "Nature"
  | "Science"
  | "Classic Literature"
  | "Poetry";

export type ReadingListBook = {
  id: string;
  title: string;
  author: string;
  category: ReadingCategory;
  difficulty: "Gentle" | "Steady" | "Dense";
  length: "Short" | "Medium" | "Long";
  mood: string;
  themes: string[];
  rating: number;
  coverEmoji?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  description?: string;
  uploaded?: boolean;
};

export const READING_LIST: ReadingListBook[] = [
  {
    id: "rl-gaiman",
    title: "The Ocean at the End of the Lane",
    author: "Neil Gaiman",
    category: "Fantasy",
    difficulty: "Gentle",
    length: "Short",
    mood: "Dreamlike",
    themes: ["memory", "childhood", "myth"],
    rating: 4.7,
  },
  {
    id: "rl-christie",
    title: "And Then There Were None",
    author: "Agatha Christie",
    category: "Mystery",
    difficulty: "Steady",
    length: "Medium",
    mood: "Suspenseful",
    themes: ["justice", "isolation", "secrets"],
    rating: 4.6,
  },
  {
    id: "rl-marcus",
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Philosophy",
    difficulty: "Dense",
    length: "Medium",
    mood: "Contemplative",
    themes: ["stoicism", "duty", "impermanence"],
    rating: 4.5,
  },
  {
    id: "rl-frankl",
    title: "Man's Search for Meaning",
    author: "Viktor Frankl",
    category: "Psychology",
    difficulty: "Steady",
    length: "Short",
    mood: "Sobering hope",
    themes: ["purpose", "resilience", "choice"],
    rating: 4.8,
  },
  {
    id: "rl-tuchman",
    title: "A Distant Mirror",
    author: "Barbara Tuchman",
    category: "History",
    difficulty: "Dense",
    length: "Long",
    mood: "Epic",
    themes: ["middle ages", "plague", "power"],
    rating: 4.4,
  },
  {
    id: "rl-thoreau",
    title: "Walden",
    author: "Henry David Thoreau",
    category: "Nature",
    difficulty: "Steady",
    length: "Medium",
    mood: "Solitary",
    themes: ["simplicity", "woods", "attention"],
    rating: 4.3,
  },
  {
    id: "rl-sagan",
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science",
    difficulty: "Steady",
    length: "Long",
    mood: "Wonderstruck",
    themes: ["space", "curiosity", "humanity"],
    rating: 4.7,
  },
  {
    id: "rl-austen",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Classic Literature",
    difficulty: "Gentle",
    length: "Medium",
    mood: "Witty",
    themes: ["pride", "love", "society"],
    rating: 4.6,
  },
  {
    id: "rl-oliver",
    title: "Devotions",
    author: "Mary Oliver",
    category: "Poetry",
    difficulty: "Gentle",
    length: "Medium",
    mood: "Attentive",
    themes: ["wildness", "gratitude", "attention"],
    rating: 4.9,
  },
  {
    id: "rl-eco",
    title: "The Name of the Rose",
    author: "Umberto Eco",
    category: "Mystery",
    difficulty: "Dense",
    length: "Long",
    mood: "Labyrinthine",
    themes: ["libraries", "faith", "semiotics"],
    rating: 4.5,
  },
  {
    id: "rl-le-guin",
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    category: "Fantasy",
    difficulty: "Steady",
    length: "Medium",
    mood: "Mythic",
    themes: ["names", "shadow", "balance"],
    rating: 4.7,
  },
  {
    id: "rl-Carson",
    title: "Silent Spring",
    author: "Rachel Carson",
    category: "Nature",
    difficulty: "Steady",
    length: "Medium",
    mood: "Urgent",
    themes: ["ecology", "responsibility", "warning"],
    rating: 4.6,
  },
];

export const READING_CATEGORIES: ReadingCategory[] = [
  "Fantasy",
  "Mystery",
  "Philosophy",
  "Psychology",
  "History",
  "Nature",
  "Science",
  "Classic Literature",
  "Poetry",
];

export type CuriosityFact = {
  id: string;
  question: string;
  fact: string;
  quiz: { prompt: string; options: string[]; answer: number };
};

export const CURIOSITY_FACTS: CuriosityFact[] = [
  {
    id: "octopus-hearts",
    question: "Why do octopuses have three hearts?",
    fact: "Two hearts pump blood to the gills; the third pumps it to the rest of the body — and even pauses when they swim.",
    quiz: {
      prompt: "How many hearts does an octopus have?",
      options: ["One", "Two", "Three", "Four"],
      answer: 2,
    },
  },
  {
    id: "trees-talk",
    question: "How do trees communicate underground?",
    fact: "Through mycorrhizal networks — fungal threads linking roots, nicknamed the Wood Wide Web — trees share nutrients and warning signals.",
    quiz: {
      prompt: "What helps trees share signals underground?",
      options: ["Birdsong", "Mycorrhizal fungi", "River stones", "Moonlight"],
      answer: 1,
    },
  },
  {
    id: "dreams",
    question: "Why do we dream?",
    fact: "Dreams may help consolidate memory, rehearse threats, and process emotion — though the full purpose remains a beautiful unfinished theory.",
    quiz: {
      prompt: "One leading theory says dreams help with…",
      options: ["Digesting food", "Memory & emotion", "Growing feathers", "Changing eye color"],
      answer: 1,
    },
  },
  {
    id: "deja-vu",
    question: "What causes déjà vu?",
    fact: "Likely a brief glitch in familiarity processing — the brain briefly tags a new moment as already known.",
    quiz: {
      prompt: "Déjà vu is best described as…",
      options: ["Time travel", "A familiarity glitch", "A weather pattern", "A vitamin"],
      answer: 1,
    },
  },
  {
    id: "oldest-tree",
    question: "How old is the oldest living tree?",
    fact: "Bristlecone pines in the White Mountains can exceed 4,800 years — living libraries of climate written in rings.",
    quiz: {
      prompt: "The oldest known living trees are often…",
      options: ["Bristlecone pines", "Banana plants", "Sunflowers", "Bamboo"],
      answer: 0,
    },
  },
  {
    id: "ravens",
    question: "Why are ravens considered intelligent?",
    fact: "They use tools, plan ahead, recognize faces, and even play — problem-solvers with glossy black curiosity.",
    quiz: {
      prompt: "Ravens are known for…",
      options: ["Only singing", "Tool use & planning", "Hibernating", "Avoiding shiny objects"],
      answer: 1,
    },
  },
  {
    id: "fungi",
    question: "Can fungi communicate?",
    fact: "Fungal networks exchange chemical signals and nutrients across vast underground webs connecting forests.",
    quiz: {
      prompt: "Fungi can form networks that…",
      options: ["Only grow mushrooms", "Exchange chemical signals", "Sing at night", "Make honey"],
      answer: 1,
    },
  },
  {
    id: "dark-sky",
    question: "Why is the sky dark at night?",
    fact: "Olbers' paradox: an infinite static universe of stars should blaze eternally — darkness hints the universe is finite in age and expanding.",
    quiz: {
      prompt: "A dark night sky hints the universe is…",
      options: ["Infinite & static", "Finite in age / expanding", "Made of ink", "Hollow"],
      answer: 1,
    },
  },
];

export function featuredCuriosity(now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return CURIOSITY_FACTS[day % CURIOSITY_FACTS.length];
}

export type MysteryItem = {
  id: string;
  title: string;
  synopsis: string;
  clues: string[];
  puzzlePrompt: string;
  answer: string;
  stamp: string;
};

export const MYSTERIES: MysteryItem[] = [
  {
    id: "missing-manuscript",
    title: "Who stole the missing manuscript?",
    synopsis:
      "A vellum folio vanished from the Restricted Stacks. Three suspects left footprints in the dust.",
    clues: [
      "Candle wax drips lead toward the astronomy alcove.",
      "A moth wing was found caught in the folio's silk ribbon.",
      "The night owl's perch was empty at midnight.",
    ],
    puzzlePrompt: "Which alcove held the thief's candle? (one word)",
    answer: "astronomy",
    stamp: "Manuscript Seal",
  },
  {
    id: "ancient-cipher",
    title: "Decode an ancient cipher",
    synopsis:
      "A margin note reads: PQFO UIF NPTU CPPL — Caesar's whisper of +1.",
    clues: [
      "Shift each letter back by one.",
      "The cipher loves libraries.",
      "The answer is four words.",
    ],
    puzzlePrompt: "Decoded phrase?",
    answer: "open the most book",
    stamp: "Cipher Quill",
  },
  {
    id: "mysterious-footprint",
    title: "Identify the mysterious footprint",
    synopsis:
      "Soft prints circle the globe stand each dawn — four toes, no claws, dusted with pollen.",
    clues: [
      "Too light for a badger.",
      "Pollen suggests the moss garden.",
      "Owls prefer silent wings, not muddy toes.",
    ],
    puzzlePrompt: "Whose footprint? (one animal)",
    answer: "rabbit",
    stamp: "Footprint Wax",
  },
  {
    id: "locked-room",
    title: "Solve a locked-room puzzle",
    synopsis:
      "The reading room was locked from inside. A book on the table is still warm.",
    clues: [
      "The window latch was loose.",
      "Ivy outside reaches the sill.",
      "A ladder was never needed — only patience and green.",
    ],
    puzzlePrompt: "How did they leave? (one word: window/ivy/chimney)",
    answer: "window",
    stamp: "Locked Room Key",
  },
  {
    id: "forgotten-diary",
    title: "Investigate a forgotten diary",
    synopsis:
      "Pages speak of a door behind the atlas shelf that only opens when someone asks a true question.",
    clues: [
      "Truth, not cleverness, is the key.",
      "The diarist loved the word curiosity.",
      "Ask why, not how.",
    ],
    puzzlePrompt: "What opens the door? (one word)",
    answer: "curiosity",
    stamp: "Diary Ribbon",
  },
];

export function featuredMystery(now = new Date()) {
  return MYSTERIES[now.getUTCMonth() % MYSTERIES.length];
}

export type ChallengeItem = {
  id: string;
  label: string;
  detail: string;
};

export const ARCHIVE_CHALLENGES: ChallengeItem[] = [
  { id: "read-20", label: "Read for 20 minutes", detail: "Anywhere counts — chair, garden, train." },
  { id: "visit-library", label: "Visit a real library", detail: "Breathe the quiet stacks." },
  { id: "recommend", label: "Recommend a book", detail: "Tell a friend or pin it in your journal." },
  { id: "review", label: "Write a book review", detail: "A few honest sentences are enough." },
  { id: "five-words", label: "Learn five new words", detail: "Collect them like pressed leaves." },
  { id: "research", label: "Research an unfamiliar topic", detail: "Follow one question down a rabbit hole." },
  { id: "read-outside", label: "Read outside", detail: "Moss, porch, park bench — take your pick." },
  { id: "one-chapter", label: "Finish one chapter", detail: "Small progress still turns the page." },
  { id: "history-fact", label: "Find an interesting historical fact", detail: "Share it with the Cabinet." },
  { id: "new-author", label: "Discover a new author", detail: "Someone whose spine you've never opened." },
];

export function weeklyChallenges(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 86_400_000));
  const start = (week * 3) % ARCHIVE_CHALLENGES.length;
  return [0, 1, 2].map(
    (i) => ARCHIVE_CHALLENGES[(start + i) % ARCHIVE_CHALLENGES.length]
  );
}

export type ThoughtPrompt = {
  id: string;
  question: string;
};

export const THOUGHT_PROMPTS: ThoughtPrompt[] = [
  {
    id: "erase-memory",
    question:
      "Would you erase your happiest memory to remove your saddest one?",
  },
  {
    id: "save-knowledge",
    question:
      "If books disappeared tomorrow, what knowledge would you save first?",
  },
  {
    id: "future-self",
    question: "If you could ask your future self one question, what would it be?",
  },
  {
    id: "kindness",
    question: "Can kindness exist without expecting anything in return?",
  },
  {
    id: "immortality",
    question: "Would immortality eventually become lonely?",
  },
];

export function featuredThought(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 86_400_000));
  return THOUGHT_PROMPTS[week % THOUGHT_PROMPTS.length];
}

export type ArchiveClip = {
  id: string;
  title: string;
  category: string;
  duration: string;
  emoji: string;
};

export const ARCHIVE_CLIPS: ArchiveClip[] = [
  { id: "arch-book", title: "Fireside Book Discussion: Gardens & Growth", category: "Book discussions", duration: "28 min", emoji: "📚" },
  { id: "arch-psych", title: "The Quiet Mind: Attention & Rest", category: "Psychology", duration: "22 min", emoji: "🧠" },
  { id: "arch-hist", title: "Ink & Empire: How Libraries Began", category: "History", duration: "35 min", emoji: "🏛" },
  { id: "arch-owl", title: "Owls of the Northern Woods", category: "Owl documentaries", duration: "41 min", emoji: "🦉" },
  { id: "arch-rain", title: "Rain on Stained Glass (Ambience)", category: "Rainy library ambience", duration: "60 min", emoji: "🌧" },
  { id: "arch-mystery", title: "Locked Rooms & Candlelight Cases", category: "Mysteries", duration: "33 min", emoji: "🔍" },
  { id: "arch-space", title: "Cosmos for Night Readers", category: "Space documentaries", duration: "45 min", emoji: "🌌" },
  { id: "arch-nature", title: "How Forests Whisper", category: "Nature science", duration: "27 min", emoji: "🌿" },
  { id: "arch-archaeology", title: "Lost Scripts Unearthed", category: "Archaeology", duration: "38 min", emoji: "🏺" },
  { id: "arch-logic", title: "Evening Logic Puzzles", category: "Logic puzzles", duration: "18 min", emoji: "🧩" },
  { id: "arch-chess", title: "Quiet Chess Strategies", category: "Chess strategy", duration: "24 min", emoji: "♟" },
  { id: "arch-lost", title: "Maps of Lost Civilizations", category: "Lost civilizations", duration: "42 min", emoji: "🗺" },
  { id: "arch-story", title: "Storytelling by Lantern", category: "Storytelling", duration: "31 min", emoji: "📖" },
  { id: "arch-write", title: "Ink Advice for Tender Writers", category: "Writing advice", duration: "20 min", emoji: "✒" },
  { id: "arch-author", title: "Author Interview: On Curiosity", category: "Author interviews", duration: "36 min", emoji: "🎙" },
];

export const LIBRARY_COLLECTIONS = [
  { id: "classics-10", title: "Read 10 Classics", emoji: "📚", need: 3, badge: "Classic Collector" },
  { id: "owl-expert", title: "Owl Expert", emoji: "🦉", need: 3, badge: "Owl Expert" },
  { id: "world-explorer", title: "World Explorer", emoji: "🌍", need: 3, badge: "World Explorer" },
  { id: "psych-fan", title: "Psychology Enthusiast", emoji: "🧠", need: 2, badge: "Psychology Enthusiast" },
  { id: "history-scholar", title: "History Scholar", emoji: "🏛", need: 2, badge: "History Scholar" },
  { id: "naturalist", title: "Naturalist", emoji: "🌿", need: 2, badge: "Naturalist" },
  { id: "stargazer", title: "Stargazer", emoji: "🌌", need: 2, badge: "Stargazer" },
  { id: "philosopher", title: "Philosopher", emoji: "📖", need: 2, badge: "Philosopher" },
];

export const SECRET_REWARDS = [
  { id: "quote", label: "A rare quote", text: "Libraries are gardens where questions bloom year-round." },
  { id: "puzzle", label: "A bonus puzzle", text: "What has spines but never bones? A shelf of books." },
  { id: "lore", label: "Hidden lore", text: "The first Mosshollow owl nested in a hollow dictionary." },
  { id: "wallpaper", label: "Exclusive wallpaper idea", text: "Candlelit stacks with moth-wing gold." },
  { id: "bookmark", label: "Collectible bookmark", text: "Pressed fern ribbon — filed in your journal." },
];
