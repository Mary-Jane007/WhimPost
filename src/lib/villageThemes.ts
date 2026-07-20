import type { VillageId } from "@/lib/villages";

export type VillageThemeTokens = {
  color: string;
  colorSoft: string;
  accent: string;
  cream: string;
  ink: string;
  gold: string;
  bgGlow: string;
};

/** Per-village visual identity. Only Clovermeadow is fully styled for now. */
export const VILLAGE_THEMES: Partial<Record<VillageId, VillageThemeTokens>> = {
  clovermeadow: {
    color: "#d4849a",
    colorSoft: "#f2c4d0",
    accent: "#a8c4a8",
    cream: "#fff4f7",
    ink: "#5c3a44",
    gold: "#e8a0b5",
    bgGlow:
      "radial-gradient(ellipse at 18% 8%, rgba(242, 196, 208, 0.55), transparent 45%), radial-gradient(ellipse at 85% 10%, rgba(168, 196, 168, 0.28), transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(120, 70, 90, 0.45), transparent 55%), linear-gradient(165deg, #3a2430 0%, #4a2f3a 32%, #5c3a48 62%, #3a2430 100%)",
  },
};

export type CloverStickerId =
  | "bow-pink"
  | "bow-sage"
  | "bow-sage-small"
  | "cherries-gingham"
  | "mushrooms-pink"
  | "lily-pink"
  | "hibiscus-pink"
  | "rose-circle"
  | "flowers-sage"
  | "butterfly-pink"
  | "butterfly-iridescent"
  | "butterfly-green"
  | "butterfly-cream"
  | "bird-pink"
  | "jellyfish-pink"
  | "puppy-frog"
  | "star-gradient"
  | "heart-pink"
  | "gingham-circle"
  | "books-stack"
  | "peony-scrap"
  | "quote-happy"
  | "tulip-frame"
  | "apple-blush";

export const CLOVERMEADOW_STICKERS: {
  id: CloverStickerId;
  name: string;
  src: string;
}[] = [
  { id: "bow-pink", name: "Pink Bow", src: "/stickers/villages/clovermeadow/bow-pink.png" },
  { id: "bow-sage", name: "Sage Bow", src: "/stickers/villages/clovermeadow/bow-sage.png" },
  {
    id: "bow-sage-small",
    name: "Little Ribbon",
    src: "/stickers/villages/clovermeadow/bow-sage-small.png",
  },
  {
    id: "cherries-gingham",
    name: "Gingham Cherries",
    src: "/stickers/villages/clovermeadow/cherries-gingham.png",
  },
  {
    id: "mushrooms-pink",
    name: "Pink Toadstools",
    src: "/stickers/villages/clovermeadow/mushrooms-pink.png",
  },
  { id: "lily-pink", name: "Pink Lily", src: "/stickers/villages/clovermeadow/lily-pink.png" },
  {
    id: "hibiscus-pink",
    name: "Hibiscus",
    src: "/stickers/villages/clovermeadow/hibiscus-pink.png",
  },
  {
    id: "rose-circle",
    name: "Rose Medallion",
    src: "/stickers/villages/clovermeadow/rose-circle.png",
  },
  {
    id: "flowers-sage",
    name: "Sage Blooms",
    src: "/stickers/villages/clovermeadow/flowers-sage.png",
  },
  {
    id: "butterfly-pink",
    name: "Pink Butterfly",
    src: "/stickers/villages/clovermeadow/butterfly-pink.png",
  },
  {
    id: "butterfly-iridescent",
    name: "Meadow Butterfly",
    src: "/stickers/villages/clovermeadow/butterfly-iridescent.png",
  },
  {
    id: "butterfly-green",
    name: "Sage Butterfly",
    src: "/stickers/villages/clovermeadow/butterfly-green.png",
  },
  {
    id: "butterfly-cream",
    name: "Cream Butterfly",
    src: "/stickers/villages/clovermeadow/butterfly-cream.png",
  },
  { id: "bird-pink", name: "Songbird", src: "/stickers/villages/clovermeadow/bird-pink.png" },
  {
    id: "jellyfish-pink",
    name: "Garden Jelly",
    src: "/stickers/villages/clovermeadow/jellyfish-pink.png",
  },
  {
    id: "tulip-frame",
    name: "Tulip Frame",
    src: "/stickers/villages/clovermeadow/tulip-frame.png",
  },
  {
    id: "puppy-frog",
    name: "Puppy & Frog",
    src: "/stickers/villages/clovermeadow/puppy-frog.png",
  },
  {
    id: "star-gradient",
    name: "Meadow Star",
    src: "/stickers/villages/clovermeadow/star-gradient.png",
  },
  { id: "heart-pink", name: "Soft Heart", src: "/stickers/villages/clovermeadow/heart-pink.png" },
  {
    id: "gingham-circle",
    name: "Gingham Patch",
    src: "/stickers/villages/clovermeadow/gingham-circle.png",
  },
  {
    id: "books-stack",
    name: "Garden Books",
    src: "/stickers/villages/clovermeadow/books-stack.png",
  },
  {
    id: "peony-scrap",
    name: "Peony Scrap",
    src: "/stickers/villages/clovermeadow/peony-scrap.png",
  },
  {
    id: "quote-happy",
    name: "Incandescent",
    src: "/stickers/villages/clovermeadow/quote-happy.png",
  },
  {
    id: "apple-blush",
    name: "Blush Apple",
    src: "/stickers/villages/clovermeadow/apple-blush.png",
  },
];

export const CLOVERMEADOW_DECOR: {
  id: CloverStickerId;
  className: string;
}[] = [
  { id: "bow-pink", className: "decor-fern-tl" },
  { id: "bow-sage", className: "decor-mushroom-tr" },
  { id: "butterfly-iridescent", className: "decor-moon-tr" },
  { id: "cherries-gingham", className: "decor-fox-bl" },
  { id: "mushrooms-pink", className: "decor-moth-br" },
  { id: "lily-pink", className: "decor-leaf-ml" },
  { id: "butterfly-pink", className: "decor-butterfly-mr" },
  { id: "heart-pink", className: "decor-acorn-bm" },
  { id: "tulip-frame", className: "decor-crow-tm" },
  { id: "rose-circle", className: "decor-sun-tr2" },
  { id: "jellyfish-pink", className: "decor-spiral-bl2" },
  { id: "flowers-sage", className: "decor-flower-br2" },
];

export function cloverStickerSrc(id: CloverStickerId) {
  return (
    CLOVERMEADOW_STICKERS.find((s) => s.id === id)?.src ||
    `/stickers/villages/clovermeadow/${id}.png`
  );
}

export function getVillageTheme(villageId: string | null | undefined) {
  if (!villageId) return null;
  return VILLAGE_THEMES[villageId as VillageId] || null;
}
