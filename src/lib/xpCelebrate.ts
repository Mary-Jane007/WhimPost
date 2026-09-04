import {
  COLLECTIBLE_META,
  REP_REWARDS,
  type CollectibleKind,
  type VillageId,
} from "@/lib/villages";
import { LIBRARY_XP } from "@/lib/libraryContent";
import { GARDEN_XP } from "@/lib/gardenContent";
import { MOON_XP } from "@/lib/moonContent";
import { WORKSHOP_XP } from "@/lib/workshopContent";
import { CANDLE_XP_COLLECTIBLE_GIFTS, HEARTH_XP } from "@/lib/hearthContent";
import {
  LIBRARY_XP_COLLECTIBLE_GIFTS,
  GARDEN_XP_COLLECTIBLE_GIFTS,
  MOON_XP_COLLECTIBLE_GIFTS,
  WORKSHOP_XP_COLLECTIBLE_GIFTS,
} from "@/lib/workshopXpGifts";

export type XpAlmanacRow = {
  task: string;
  xp: number;
  note?: string;
};

export type XpAlmanacSection = {
  villageId: VillageId | "letters";
  title: string;
  emoji: string;
  lead: string;
  tasks: XpAlmanacRow[];
  giftLead?: string;
  gifts?: Array<{ minXp: number; kind: CollectibleKind; label: string }>;
};

/** Soft almanac of every XP task and letter reward — cottagecore wording. */
export const XP_ALMANAC: XpAlmanacSection[] = [
  {
    villageId: "letters",
    title: "The Writing Desk",
    emoji: "✉️",
    lead:
      "Every sealed letter warms your forest standing and may tuck keepsakes into your satchel.",
    tasks: [
      {
        task: "Send a letter",
        xp: REP_REWARDS.sendLetter,
        note: "Forest standing (reputation)",
      },
      {
        task: "Long letter (280+ characters)",
        xp: REP_REWARDS.longLetter,
        note: "Extra standing + two pack keepsakes",
      },
      {
        task: "Thoughtful letter (120+ characters)",
        xp: 0,
        note: "One village pack keepsake",
      },
      {
        task: "Lucky ink roll",
        xp: 0,
        note: "Sometimes a fourth keepsake when the words feel lucky",
      },
      {
        task: "Welcome a new friend",
        xp: REP_REWARDS.welcomeFriend,
        note: "Standing + first pack keepsake",
      },
      {
        task: "Owner village task",
        xp: REP_REWARDS.villageTask,
        note: "Standing + the task’s listed collectibles",
      },
    ],
    giftLead:
      "Letter keepsakes come from the village you are standing in when you post.",
  },
  {
    villageId: "mosshollow",
    title: "The Grand Library",
    emoji: "📚",
    lead: "Quiet tasks among the shelves — each one leaves a little moss of knowledge.",
    tasks: [
      { task: "Finish a book", xp: LIBRARY_XP.reading },
      { task: "Solve the monthly mystery", xp: LIBRARY_XP.mystery },
      { task: "Curiosity quiz (correct)", xp: LIBRARY_XP.quiz },
      { task: "Archive challenge", xp: LIBRARY_XP.challenge },
      { task: "Share a thought", xp: LIBRARY_XP.thought },
      { task: "Thoughtful reflection", xp: LIBRARY_XP.reflection },
      { task: "Archive clip complete", xp: LIBRARY_XP.archive },
      { task: "Uncover a library secret", xp: LIBRARY_XP.secret },
      { task: "Archivist journal entry", xp: LIBRARY_XP.journal },
    ],
    giftLead: "Library XP milestones gift Mosshollow collectibles.",
    gifts: LIBRARY_XP_COLLECTIBLE_GIFTS.map((g) => ({
      minXp: g.minXp,
      kind: g.kind,
      label: g.label,
    })),
  },
  {
    villageId: "clovermeadow",
    title: "The Bloomkeeper's Garden",
    emoji: "🌻",
    lead: "Gentle garden work that grows kindness as surely as petals.",
    tasks: [
      {
        task: "Daily bloom task",
        xp: GARDEN_XP.daily,
        note: "+15 if it helps the community meadow",
      },
      { task: "Spot a flower or visitor", xp: GARDEN_XP.spotting },
      { task: "Act of kindness", xp: GARDEN_XP.kindness },
      { task: "Plant a seed of joy", xp: GARDEN_XP.seed },
      { task: "Garden journal entry", xp: GARDEN_XP.journal },
    ],
    giftLead: "Garden XP milestones gift Clovermeadow collectibles.",
    gifts: GARDEN_XP_COLLECTIBLE_GIFTS.map((g) => ({
      minXp: g.minXp,
      kind: g.kind,
      label: g.label,
    })),
  },
  {
    villageId: "moonmere",
    title: "The Observatory",
    emoji: "🔭",
    lead: "Night work under soft starlight — quiet XP for quiet wonder.",
    tasks: [
      { task: "Night ritual", xp: MOON_XP.ritual },
      { task: "Moon journal page", xp: MOON_XP.journal },
      { task: "Bottle a dream", xp: MOON_XP.dream },
    ],
    giftLead: "Observatory XP milestones gift Moonmere collectibles.",
    gifts: MOON_XP_COLLECTIBLE_GIFTS.map((g) => ({
      minXp: g.minXp,
      kind: g.kind,
      label: g.label,
    })),
  },
  {
    villageId: "bramblewood",
    title: "The Woodland Workshop",
    emoji: "🗺️",
    lead: "Outdoor crafts, recipes, and trails — bring home mossy XP.",
    tasks: [
      { task: "Finish a craft", xp: WORKSHOP_XP.craft },
      { task: "Woodland DIY project", xp: WORKSHOP_XP.diy },
      { task: "Cozy kitchen recipe", xp: WORKSHOP_XP.recipe },
      { task: "Creative prompt", xp: WORKSHOP_XP.prompt },
      { task: "Weekly expedition", xp: WORKSHOP_XP.expedition },
      { task: "Woodland adventure check", xp: WORKSHOP_XP.adventure },
      { task: "Quest find", xp: WORKSHOP_XP.questItem },
      { task: "Outdoor skill", xp: WORKSHOP_XP.skill },
      { task: "Wildlife spotting", xp: WORKSHOP_XP.wildlife },
      { task: "Bird spotting", xp: WORKSHOP_XP.bird },
      { task: "Plant week photo", xp: WORKSHOP_XP.growWeek },
      { task: "Finish growing (week 4 bonus)", xp: WORKSHOP_XP.growComplete },
      { task: "Collection step", xp: WORKSHOP_XP.collection },
      { task: "Explorer's journal", xp: WORKSHOP_XP.journal },
    ],
    giftLead: "Workshop XP milestones gift Bramblewood collectibles.",
    gifts: WORKSHOP_XP_COLLECTIBLE_GIFTS.map((g) => ({
      minXp: g.minXp,
      kind: g.kind,
      label: g.label,
    })),
  },
  {
    villageId: "hearthwick",
    title: "The Fireside",
    emoji: "🫖",
    lead: "Warm hearth tasks — steam, wax, and kindling for the soul.",
    tasks: [
      { task: "Today's fireside ritual", xp: HEARTH_XP.ritual },
      { task: "Leave a Fireside Note", xp: HEARTH_XP.note },
      { task: "Save a cozy recipe", xp: HEARTH_XP.favoriteRecipe },
      { task: "Save a note to Kindling", xp: HEARTH_XP.kindling },
      {
        task: "Finish a Candle Craft",
        xp: HEARTH_XP.candleCraft,
        note: "Also earns candle XP toward candle gifts",
      },
    ],
    giftLead: "Candle craft XP milestones gift Hearthwick collectibles.",
    gifts: CANDLE_XP_COLLECTIBLE_GIFTS.map((g) => ({
      minXp: g.minCandleXp,
      kind: g.kind,
      label: g.label,
    })),
  },
];

export function almanacForVillage(
  villageId: VillageId | "letters"
): XpAlmanacSection | undefined {
  return XP_ALMANAC.find((s) => s.villageId === villageId);
}

export type XpCelebrationDetail = {
  eyebrow?: string;
  title: string;
  body: string;
  xp?: number;
  reputation?: number;
  collectibles?: CollectibleKind[];
};

const CELEBRATION_OPENERS = [
  "A soft hush falls over the clearing…",
  "The kettle sings a little brighter…",
  "Moss underfoot feels luckier somehow…",
  "A lantern flickers in quiet applause…",
  "The post owl ruffles approving feathers…",
];

function pickOpener(seed: number) {
  return CELEBRATION_OPENERS[Math.abs(seed) % CELEBRATION_OPENERS.length];
}

/** Build a cottagecore celebration for XP / standing / collectibles. */
export function buildXpCelebration(input: {
  xp?: number;
  reputation?: number;
  collectibles?: CollectibleKind[];
  activityHint?: string;
}): XpCelebrationDetail | null {
  const xp = input.xp || 0;
  const reputation = input.reputation || 0;
  const collectibles = input.collectibles || [];
  if (xp <= 0 && reputation <= 0 && collectibles.length === 0) return null;

  const seed =
    xp * 11 +
    reputation * 17 +
    collectibles.reduce((n, k) => n + k.length, 0) +
    (input.activityHint?.length || 0);

  const bits: string[] = [];
  if (xp > 0) {
    bits.push(
      `+${xp} gentle XP settles into your satchel${
        input.activityHint ? ` for ${input.activityHint}` : ""
      }`
    );
  }
  if (reputation > 0) {
    bits.push(
      `+${reputation} forest standing — the village remembers your kindness`
    );
  }
  if (collectibles.length > 0) {
    const names = collectibles
      .map((k) => `${COLLECTIBLE_META[k].emoji} ${COLLECTIBLE_META[k].name}`)
      .join(", ");
    bits.push(
      collectibles.length === 1
        ? `A keepsake finds you: ${names}`
        : `Keepsakes tumble into your jar: ${names}`
    );
  }

  let title = "A little woodland luck";
  if (collectibles.length && xp > 0) title = "XP & a keepsake!";
  else if (collectibles.length && reputation > 0) title = "Ink & treasures";
  else if (collectibles.length) title = "A gift from the path";
  else if (xp > 0) title = "Soft XP earned";
  else if (reputation > 0) title = "Your standing grows";

  return {
    eyebrow: "Village celebration",
    title,
    body: `${pickOpener(seed)} ${bits.join(". ")}.`,
    xp: xp || undefined,
    reputation: reputation || undefined,
    collectibles: collectibles.length ? collectibles : undefined,
  };
}
