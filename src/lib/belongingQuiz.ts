import type { VillageId } from "@/lib/villages";

export type QuizOption = {
  key: "A" | "B" | "C" | "D" | "E";
  text: string;
  villageId: VillageId;
};

export type QuizQuestion = {
  id: number;
  prompt: string;
  options: QuizOption[];
};

export type BelongingResult = {
  villageId: VillageId;
  title: string;
  blurb: string;
  companion: string;
  companionEmoji: string;
  firstQuest: string;
  pathCue: string;
};

export const BELONGING_INTRO =
  "Before your first letter can be written, the forest must learn your story. Follow the lanterns, answer honestly, and discover which village has been waiting for you.";

export const BELONGING_TRAITS: Record<
  VillageId,
  { label: string; traits: string; emoji: string }
> = {
  mosshollow: {
    label: "Mosshollow",
    traits: "Wisdom, creativity, stories",
    emoji: "🍄",
  },
  clovermeadow: {
    label: "Clovermeadow",
    traits: "Kindness, connection, warmth",
    emoji: "🌼",
  },
  moonmere: {
    label: "Moonmere",
    traits: "Reflection, imagination, dreams",
    emoji: "🌙",
  },
  bramblewood: {
    label: "Bramblewood",
    traits: "Curiosity, adventure, discovery",
    emoji: "🦊",
  },
  hearthwick: {
    label: "Hearthwick",
    traits: "Comfort, belonging, tradition",
    emoji: "☕",
  },
};

export const BELONGING_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: "You discover an old letter hidden inside a tree. What do you do?",
    options: [
      {
        key: "A",
        text: "Carefully read it and wonder about the person who wrote it.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Try to find the person it belonged to and return it.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Keep it safe and imagine the story behind it.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Search the forest for clues about where it came from.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Place it somewhere warm and protected so it won't be forgotten.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 2,
    prompt: "Your perfect afternoon looks like...",
    options: [
      {
        key: "A",
        text: "Reading beside an ancient tree with a cup of tea.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Sharing food and stories with neighbors.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Sitting beside a lake watching the stars appear.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Exploring a path you've never walked before.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Baking something while music plays in the background.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 3,
    prompt: "Someone sends you a letter saying they had a difficult day. You...",
    options: [
      {
        key: "A",
        text: "Write thoughtful advice and share something meaningful.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Send encouragement and remind them they're cared for.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Ask deeper questions about how they feel.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Distract them with a fun story or adventure.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Invite them to sit by the fire and feel welcome.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 4,
    prompt: "Choose a place where you would live:",
    options: [
      {
        key: "A",
        text: "A treehouse library hidden among the branches.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "A flower-covered cottage surrounded by gardens.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "A small cabin beside a glowing lake.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "A cottage near mysterious forest paths.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "A cozy home above a village bakery.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 5,
    prompt: "Your ideal letter contains...",
    options: [
      {
        key: "A",
        text: "Stories, ideas, and beautiful observations.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Kind words that make someone smile.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Thoughts about life, dreams, and emotions.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Tales of adventures and discoveries.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Memories, traditions, and everyday moments.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 6,
    prompt: "The forest gives you a magical ability. You choose:",
    options: [
      {
        key: "A",
        text: "Remember every story you've ever heard.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Make flowers bloom wherever you go.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "See people's dreams reflected in the stars.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Always discover hidden paths.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Create a place where everyone feels at home.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 7,
    prompt: "Your mailbox makes a strange sound at midnight. You...",
    options: [
      {
        key: "A",
        text: "Write down what happened and investigate the history.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Wonder who might need a friend.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Sit quietly and listen to what the night brings.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Grab a lantern and follow the sound.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Make tea and wait patiently.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 8,
    prompt: "What treasure would you keep?",
    options: [
      {
        key: "A",
        text: "An ancient book with handwritten notes.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "A necklace gifted by a friend.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "A bottle containing a captured moonbeam.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "A mysterious map.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "A recipe book passed through generations.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 9,
    prompt: "What do you want people to remember about you?",
    options: [
      {
        key: "A",
        text: "That you shared wisdom.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "That you made people feel loved.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "That you understood the unseen things.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "That you lived boldly.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "That you created a home for others.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 10,
    prompt: "Choose a companion:",
    options: [
      {
        key: "A",
        text: "An owl who collects forgotten stories",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "A bee who carries kindness between gardens",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "A moth who follows moonlight",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "A fox who knows every hidden trail",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "A hedgehog who loves warm fireplaces",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 11,
    prompt: "A stranger knocks on your door during a storm...",
    options: [
      {
        key: "A",
        text: "Invite them in and ask about their journey.",
        villageId: "mosshollow",
      },
      {
        key: "B",
        text: "Give them food and comfort immediately.",
        villageId: "clovermeadow",
      },
      {
        key: "C",
        text: "Listen to their story by candlelight.",
        villageId: "moonmere",
      },
      {
        key: "D",
        text: "Ask what adventure brought them here.",
        villageId: "bramblewood",
      },
      {
        key: "E",
        text: "Give them a blanket and a place to rest.",
        villageId: "hearthwick",
      },
    ],
  },
  {
    id: 12,
    prompt: "The forest whispers one word to you. Which one do you hope it says?",
    options: [
      { key: "A", text: "Remember", villageId: "mosshollow" },
      { key: "B", text: "Bloom", villageId: "clovermeadow" },
      { key: "C", text: "Dream", villageId: "moonmere" },
      { key: "D", text: "Discover", villageId: "bramblewood" },
      { key: "E", text: "Belong", villageId: "hearthwick" },
    ],
  },
];

export const BELONGING_RESULTS: Record<VillageId, BelongingResult> = {
  mosshollow: {
    villageId: "mosshollow",
    title: "You belong in Mosshollow",
    blurb:
      "The ancient trees have opened their doors. They recognize a keeper of stories, a collector of thoughts, and someone who sees meaning in the smallest details.",
    companion: "A woodland owl",
    companionEmoji: "🦉",
    firstQuest: "Write your first letter and leave a piece of your story behind.",
    pathCue: "mushrooms",
  },
  clovermeadow: {
    villageId: "clovermeadow",
    title: "You belong in Clovermeadow",
    blurb:
      "The gardens have been waiting with open petals. They know a heart that tends kindness carefully, and a voice that makes strangers feel like neighbors.",
    companion: "A meadow bee",
    companionEmoji: "🐝",
    firstQuest: "Write a letter that leaves someone warmer than before.",
    pathCue: "flowers",
  },
  moonmere: {
    villageId: "moonmere",
    title: "You belong in Moonmere",
    blurb:
      "The lake has mirrored your quiet thoughts. Here, dreamers and night-listeners gather — those who find wonder in stillness and meaning between the stars.",
    companion: "A luna moth",
    companionEmoji: "🦋",
    firstQuest: "Write a letter about a dream that still lingers.",
    pathCue: "lanterns",
  },
  bramblewood: {
    villageId: "bramblewood",
    title: "You belong in Bramblewood",
    blurb:
      "The winding trails have chosen a fellow wanderer. Curiosity lights your lantern, and every unanswered question is simply another path waiting to be walked.",
    companion: "A woodland fox",
    companionEmoji: "🦊",
    firstQuest: "Write a letter about a discovery — small or strange.",
    pathCue: "pawprints",
  },
  hearthwick: {
    villageId: "hearthwick",
    title: "You belong in Hearthwick",
    blurb:
      "The hearth has saved you a chair. Tradition, comfort, and welcome live here — and the village already knows you'll make a place where others feel at home.",
    companion: "A fireside hedgehog",
    companionEmoji: "🦔",
    firstQuest: "Write a letter that feels like coming home.",
    pathCue: "chimney",
  },
};

const TIE_ORDER: VillageId[] = [
  "mosshollow",
  "clovermeadow",
  "moonmere",
  "bramblewood",
  "hearthwick",
];

/** Score answers and return the winning village (ties favor earlier trail order). */
export function scoreBelongingQuiz(answers: VillageId[]): {
  villageId: VillageId;
  scores: Record<VillageId, number>;
  result: BelongingResult;
} {
  const scores: Record<VillageId, number> = {
    mosshollow: 0,
    clovermeadow: 0,
    moonmere: 0,
    bramblewood: 0,
    hearthwick: 0,
  };
  for (const id of answers) {
    if (id in scores) scores[id] += 1;
  }

  let best: VillageId = "mosshollow";
  let bestScore = -1;
  for (const id of TIE_ORDER) {
    if (scores[id] > bestScore) {
      bestScore = scores[id];
      best = id;
    }
  }

  return { villageId: best, scores, result: BELONGING_RESULTS[best] };
}
