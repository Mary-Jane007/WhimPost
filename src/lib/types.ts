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
  | "mushroom"
  | "fox"
  | "moth"
  | "crow"
  | "fern"
  | "moon";

export type StickerKind =
  | "fox"
  | "moth"
  | "mushroom"
  | "crow"
  | "moon"
  | "sun"
  | "fern"
  | "butterfly"
  | "flower"
  | "spiral"
  | "acorn"
  | "leaf";

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
  { id: "mushroom", name: "Mushroom" },
  { id: "fox", name: "Fox" },
  { id: "moth", name: "Moth" },
  { id: "crow", name: "Crow" },
  { id: "fern", name: "Fern" },
  { id: "moon", name: "Moon" },
];

export const STICKER_OPTIONS: { id: StickerKind; name: string }[] = [
  { id: "fox", name: "Fox" },
  { id: "moth", name: "Moth" },
  { id: "mushroom", name: "Mushroom" },
  { id: "crow", name: "Crow" },
  { id: "moon", name: "Moon" },
  { id: "sun", name: "Sun" },
  { id: "fern", name: "Fern" },
  { id: "butterfly", name: "Butterfly" },
  { id: "flower", name: "Flower" },
  { id: "spiral", name: "Spiral" },
  { id: "acorn", name: "Acorn" },
  { id: "leaf", name: "Leaf" },
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
