import type { VillageId } from "@/lib/villages";

export type PaperStyle =
  | "parchment"
  | "cream"
  | "moss"
  | "lined"
  | "floral"
  | "night";

export type EnvelopeStyle =
  | "kraft"
  | "sage"
  | "blush"
  | "ink"
  | "lavender"
  | "bark";

export type WaxSeal = "fern" | "moon" | "sun" | "mushroom" | "heart" | "spiral";

export type StampStyle =
  | "mushroom-amanita"
  | "fox-seated"
  | "frog-crown"
  | "dragonfly"
  | "leafy-branch"
  | "moon-full";

export type StickerKind =
  | "frogs-tandem"
  | "frog-crown"
  | "bear-round"
  | "butterfly-green"
  | "frogs-kiss"
  | "fox-seated"
  | "fawn-resting"
  | "fawn-standing"
  | "bear-cub"
  | "rabbit-winged"
  | "rabbit-hood"
  | "dragonfly"
  | "rabbit-brown"
  | "squirrel"
  | "jam-jar"
  | "pinecone"
  | "mushroom-amanita"
  | "mushrooms-pair"
  | "mushroom-brown"
  | "leafy-branch"
  | "sunflower"
  | "narcissus"
  | "skeleton-key"
  | "moon-full"
  | "moon-crescent"
  | "camera-vintage"
  | "ace-hearts"
  | "hand-mirror"
  | "honey-jar"
  | "pie"
  | "picnic-basket"
  | "candle-jar"
  | "honey-bear"
  | "gingham-bow"
  | "ticket"
  | "dice"
  | "cassette"
  | "pretzel"
  // Clovermeadow village pack
  | "clover-wax-seal"
  | "clover-bow-loose"
  | "clover-bow-tight"
  | "clover-button"
  | "clover-blossom"
  | "clover-blossom-branch"
  | "clover-orchid"
  | "clover-cherries"
  | "clover-butterfly-crystal"
  | "clover-butterfly-silk"
  | "clover-butterfly-small"
  | "clover-shell"
  | "clover-conch"
  | "clover-moon"
  | "clover-star"
  | "clover-camera"
  | "clover-phone"
  | "clover-cd"
  | "clover-teddy"
  | "clover-bunny"
  | "clover-gummy"
  // Mosshollow village pack
  | "moss-typewriter"
  | "moss-letters-bundle"
  | "moss-ink-bottle"
  | "moss-books-stack"
  | "moss-quote-beauty"
  | "moss-quote-memories"
  | "moss-quote-things"
  | "moss-globe"
  | "moss-suitcase"
  | "moss-travel-tag"
  | "moss-ticket"
  | "moss-polaroids"
  | "moss-clock-face"
  | "moss-pocket-watch"
  | "moss-camera"
  | "moss-lantern"
  | "moss-gramophone"
  | "moss-vinyl"
  | "moss-hand-mirror"
  | "moss-padlock-heart"
  | "moss-teacup"
  | "moss-stamp-green"
  | "moss-stamp-red"
  | "moss-roses-dried"
  | "moss-babys-breath"
  | "moss-moth"
  | "moss-tag-365";

export type ScrapKind =
  | "quote-trees"
  | "quote-heal"
  | "quote-bones"
  | "quote-wild"
  | "quote-earth"
  | "ticket"
  | "postmark"
  | "tea-stain";

export interface PlacedSticker {
  id: string;
  kind: StickerKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PlacedScrap {
  id: string;
  kind: ScrapKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PlacedImage {
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface UserPublic {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  forestName: string;
  createdAt: string;
  isOwner: boolean;
  villageId: string | null;
  reputation: number;
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface LetterRecord {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  paper_style: PaperStyle;
  envelope_style: EnvelopeStyle;
  wax_seal: WaxSeal;
  stamp_style: StampStyle;
  stickers_json: string;
  scrap_json: string;
  status: "draft" | "sent";
  is_read: number;
  image_url: string | null;
  image_json: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface LetterView {
  id: string;
  subject: string;
  body: string;
  paperStyle: PaperStyle;
  envelopeStyle: EnvelopeStyle;
  waxSeal: WaxSeal;
  stampStyle: StampStyle;
  stickers: PlacedSticker[];
  scraps: PlacedScrap[];
  image: PlacedImage | null;
  status: "draft" | "sent";
  isRead: boolean;
  createdAt: string;
  sentAt: string | null;
  sender: UserPublic;
  recipient: UserPublic;
  /** Present on village welcome letters — the village mascot. */
  mascot?: {
    emoji: string;
    name: string;
    image?: string;
  } | null;
}

export const PAPER_OPTIONS: {
  id: PaperStyle;
  name: string;
  hint: string;
}[] = [
  { id: "parchment", name: "Parchment", hint: "Tea-stained & soft" },
  { id: "cream", name: "Cream Linen", hint: "Quiet & classic" },
  { id: "moss", name: "Moss Green", hint: "Forest floor hush" },
  { id: "lined", name: "Garden Lines", hint: "For thoughtful words" },
  { id: "floral", name: "Pressed Petals", hint: "Soft botanical wash" },
  { id: "night", name: "Night Ink", hint: "Moonlit charcoal" },
];

export const ENVELOPE_OPTIONS: {
  id: EnvelopeStyle;
  name: string;
  hint: string;
}[] = [
  { id: "kraft", name: "Kraft Paper", hint: "Warm & earthy" },
  { id: "sage", name: "Sage Leaf", hint: "Soft woodland green" },
  { id: "blush", name: "Blush Clay", hint: "Dusty rose dusk" },
  { id: "ink", name: "Ink Black", hint: "Crow-feather dark" },
  { id: "lavender", name: "Lavender Mist", hint: "Quiet meadow" },
  { id: "bark", name: "Birch Bark", hint: "Pale & textured" },
];

export const WAX_OPTIONS: { id: WaxSeal; name: string }[] = [
  { id: "fern", name: "Fern" },
  { id: "moon", name: "Crescent" },
  { id: "sun", name: "Sun Face" },
  { id: "mushroom", name: "Toadstool" },
  { id: "heart", name: "Wild Heart" },
  { id: "spiral", name: "Spiral" },
];

export const STAMP_OPTIONS: { id: StampStyle; name: string }[] = [
  { id: "mushroom-amanita", name: "Toadstool" },
  { id: "fox-seated", name: "Fox" },
  { id: "frog-crown", name: "Frog" },
  { id: "dragonfly", name: "Dragonfly" },
  { id: "leafy-branch", name: "Leaf" },
  { id: "moon-full", name: "Moon" },
];

export const STICKER_OPTIONS: {
  id: StickerKind;
  name: string;
  villageId?: VillageId;
  src?: string;
}[] = [
  { id: "frogs-tandem", name: "Tandem Frogs" },
  { id: "frog-crown", name: "Crown Frog" },
  { id: "frogs-kiss", name: "Kissing Frogs" },
  { id: "bear-round", name: "Round Bear" },
  { id: "bear-cub", name: "Bear Cub" },
  { id: "fox-seated", name: "Fox" },
  { id: "fawn-resting", name: "Resting Fawn" },
  { id: "fawn-standing", name: "Standing Fawn" },
  { id: "rabbit-winged", name: "Winged Rabbit" },
  { id: "rabbit-hood", name: "Hooded Rabbit" },
  { id: "rabbit-brown", name: "Brown Rabbit" },
  { id: "squirrel", name: "Squirrel" },
  { id: "butterfly-green", name: "Butterfly" },
  { id: "dragonfly", name: "Dragonfly" },
  { id: "mushroom-amanita", name: "Red Mushroom" },
  { id: "mushrooms-pair", name: "Mushroom Pair" },
  { id: "mushroom-brown", name: "Brown Mushroom" },
  { id: "pinecone", name: "Pinecone" },
  { id: "leafy-branch", name: "Leafy Branch" },
  { id: "sunflower", name: "Sunflower" },
  { id: "narcissus", name: "Narcissus" },
  { id: "jam-jar", name: "Jam Jar" },
  { id: "honey-jar", name: "Honey Jar" },
  { id: "honey-bear", name: "Honey Bear" },
  { id: "pie", name: "Pie" },
  { id: "picnic-basket", name: "Picnic Basket" },
  { id: "pretzel", name: "Pretzel" },
  { id: "candle-jar", name: "Candle" },
  { id: "moon-full", name: "Full Moon" },
  { id: "moon-crescent", name: "Crescent Moon" },
  { id: "skeleton-key", name: "Skeleton Key" },
  { id: "hand-mirror", name: "Hand Mirror" },
  { id: "camera-vintage", name: "Camera" },
  { id: "ace-hearts", name: "Ace of Hearts" },
  { id: "gingham-bow", name: "Gingham Bow" },
  { id: "ticket", name: "Ticket" },
  { id: "dice", name: "Dice" },
  { id: "cassette", name: "Cassette" },
  // Clovermeadow-only pack
  {
    id: "clover-wax-seal",
    name: "Bow Wax Seal",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/wax-seal-bow.png",
  },
  {
    id: "clover-bow-loose",
    name: "Satin Bow",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/bow-satin-loose.png",
  },
  {
    id: "clover-bow-tight",
    name: "Ribbon Bow",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/bow-satin-tight.png",
  },
  {
    id: "clover-button",
    name: "Pink Button",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/button-pink.png",
  },
  {
    id: "clover-blossom",
    name: "Cherry Blossom",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/blossom-single.png",
  },
  {
    id: "clover-blossom-branch",
    name: "Blossom Branch",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/blossom-branch.png",
  },
  {
    id: "clover-orchid",
    name: "Orchid",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/orchid-pink.png",
  },
  {
    id: "clover-cherries",
    name: "Gingham Cherries",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/cherries-ribbon.png",
  },
  {
    id: "clover-butterfly-crystal",
    name: "Crystal Butterfly",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/butterfly-crystal.png",
  },
  {
    id: "clover-butterfly-silk",
    name: "Silk Butterfly",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/butterfly-silk.png",
  },
  {
    id: "clover-butterfly-small",
    name: "Tiny Wings",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/butterfly-small.png",
  },
  {
    id: "clover-shell",
    name: "Scallop Shell",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/shell-1.png",
  },
  {
    id: "clover-conch",
    name: "Conch Shell",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/shell-2.png",
  },
  {
    id: "clover-moon",
    name: "Blush Moon",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/moon-pink.png",
  },
  {
    id: "clover-star",
    name: "Pink Star",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/star-pink.png",
  },
  {
    id: "clover-camera",
    name: "Sticker Camera",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/camera-cyber.png",
  },
  {
    id: "clover-phone",
    name: "Rotary Phone",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/phone-rotary.png",
  },
  {
    id: "clover-cd",
    name: "Kate Bush CD",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/cd-kate.png",
  },
  {
    id: "clover-teddy",
    name: "Bow Teddy",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/teddy-bows.png",
  },
  {
    id: "clover-bunny",
    name: "Plush Bunny",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/bunny-plush.png",
  },
  {
    id: "clover-gummy",
    name: "Gummy Bear",
    villageId: "clovermeadow",
    src: "/stickers/villages/clovermeadow/pack/gummy-bear.png",
  },
  // Mosshollow-only pack
  {
    id: "moss-typewriter",
    name: "Typewriter",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/typewriter.png",
  },
  {
    id: "moss-letters-bundle",
    name: "Letter Bundle",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/letters-bundle.png",
  },
  {
    id: "moss-ink-bottle",
    name: "Ink Bottle",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/ink-bottle.png",
  },
  {
    id: "moss-books-stack",
    name: "Leather Books",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/books-stack.png",
  },
  {
    id: "moss-quote-beauty",
    name: "Beauty Tag",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/quote-beauty.png",
  },
  {
    id: "moss-quote-memories",
    name: "Memories Plaque",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/quote-memories.png",
  },
  {
    id: "moss-quote-things",
    name: "Wax Seal Scrap",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/quote-things.png",
  },
  {
    id: "moss-globe",
    name: "Desk Globe",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/globe.png",
  },
  {
    id: "moss-suitcase",
    name: "Travel Suitcase",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/suitcase.png",
  },
  {
    id: "moss-travel-tag",
    name: "Travel Tag",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/travel-tag.png",
  },
  {
    id: "moss-ticket",
    name: "Admit One",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/ticket.png",
  },
  {
    id: "moss-polaroids",
    name: "Polaroids",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/polaroids.png",
  },
  {
    id: "moss-clock-face",
    name: "Station Clock",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/clock-face.png",
  },
  {
    id: "moss-pocket-watch",
    name: "Pocket Watch",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/pocket-watch.png",
  },
  {
    id: "moss-camera",
    name: "Film Camera",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/camera.png",
  },
  {
    id: "moss-lantern",
    name: "Oil Lantern",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/lantern.png",
  },
  {
    id: "moss-gramophone",
    name: "Gramophone",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/gramophone.png",
  },
  {
    id: "moss-vinyl",
    name: "Vintage Melodies",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/vinyl.png",
  },
  {
    id: "moss-hand-mirror",
    name: "Ornate Mirror",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/hand-mirror.png",
  },
  {
    id: "moss-padlock-heart",
    name: "Heart Padlock",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/padlock-heart.png",
  },
  {
    id: "moss-teacup",
    name: "Rose Teacup",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/teacup.png",
  },
  {
    id: "moss-stamp-green",
    name: "Green Stamp",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/stamp-green.png",
  },
  {
    id: "moss-stamp-red",
    name: "Red Stamp",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/stamp-red.png",
  },
  {
    id: "moss-roses-dried",
    name: "Dried Roses",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/roses-dried.png",
  },
  {
    id: "moss-babys-breath",
    name: "Baby's Breath",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/babys-breath.png",
  },
  {
    id: "moss-moth",
    name: "Moth",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/moth.png",
  },
  {
    id: "moss-tag-365",
    name: "Botanical Tag",
    villageId: "mosshollow",
    src: "/stickers/villages/mosshollow/pack/tag-365.png",
  },
];

export function stickerSrc(kind: StickerKind) {
  const opt = STICKER_OPTIONS.find((o) => o.id === kind);
  return opt?.src || `/stickers/${kind}.png`;
}

export function stickersForVillage(villageId: string | null | undefined) {
  return STICKER_OPTIONS.filter(
    (o) => !o.villageId || o.villageId === villageId
  );
}

export function villagePackStickers(villageId: string | null | undefined) {
  if (!villageId) return [];
  return STICKER_OPTIONS.filter((o) => o.villageId === villageId);
}

export function sharedStickers() {
  return STICKER_OPTIONS.filter((o) => !o.villageId);
}

export const SCRAP_OPTIONS: { id: ScrapKind; name: string; text: string }[] = [
  {
    id: "quote-trees",
    name: "Talking Trees",
    text: "The trees can hear you if you talk to them",
  },
  {
    id: "quote-heal",
    name: "Healing Place",
    text: "You cannot heal in the same environment where you got sick",
  },
  {
    id: "quote-bones",
    name: "Ancient Knowing",
    text: "You carry centuries of knowing in your bones",
  },
  {
    id: "quote-wild",
    name: "Wild Things",
    text: "Find me where the wild things are",
  },
  {
    id: "quote-earth",
    name: "Touch Earth",
    text: "Touch the earth and remember who you are",
  },
  { id: "ticket", name: "Train Ticket", text: "ONE WAY · MOSS STATION" },
  { id: "postmark", name: "Postmark", text: "WHIMPOST · FOREST MAIL" },
  { id: "tea-stain", name: "Tea Stain", text: "" },
];
