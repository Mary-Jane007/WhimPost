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
  | "pretzel";

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
  status: "draft" | "sent";
  isRead: boolean;
  createdAt: string;
  sentAt: string | null;
  sender: UserPublic;
  recipient: UserPublic;
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

export const STICKER_OPTIONS: { id: StickerKind; name: string }[] = [
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
];

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
