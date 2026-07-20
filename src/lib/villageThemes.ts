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

/** Per-village visual identity. */
export const VILLAGE_THEMES: Partial<Record<VillageId, VillageThemeTokens>> = {
  mosshollow: {
    color: "#1a3d2e",
    colorSoft: "#6b8f71",
    accent: "#c4a574",
    cream: "#e8dcc8",
    ink: "#1f2a1e",
    gold: "#c9a227",
    bgGlow:
      "radial-gradient(ellipse at 16% 10%, rgba(95, 127, 101, 0.38), transparent 48%), radial-gradient(ellipse at 88% 8%, rgba(201, 162, 39, 0.12), transparent 38%), radial-gradient(ellipse at 50% 100%, rgba(18, 28, 22, 0.95), transparent 55%), linear-gradient(165deg, #0c120e 0%, #152019 30%, #1a2a22 58%, #0e1510 100%)",
  },
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
  moonmere: {
    color: "#2a3548",
    colorSoft: "#8a9b88",
    accent: "#7a8fa8",
    cream: "#ebe4d4",
    ink: "#2a241c",
    gold: "#c4a574",
    bgGlow:
      "radial-gradient(ellipse at 16% 8%, rgba(138, 155, 136, 0.28), transparent 46%), radial-gradient(ellipse at 88% 12%, rgba(122, 143, 168, 0.22), transparent 42%), radial-gradient(ellipse at 50% 100%, rgba(18, 22, 32, 0.92), transparent 55%), linear-gradient(165deg, #12161e 0%, #1a2230 30%, #243040 58%, #10141c 100%)",
  },
  hearthwick: {
    color: "#8b5a2b",
    colorSoft: "#e2c39a",
    accent: "#d4783a",
    cream: "#f3e6d4",
    ink: "#2c1e14",
    gold: "#e8b86d",
    bgGlow:
      "radial-gradient(ellipse at 18% 10%, rgba(232, 184, 109, 0.38), transparent 46%), radial-gradient(ellipse at 82% 14%, rgba(212, 120, 58, 0.28), transparent 42%), radial-gradient(ellipse at 50% 100%, rgba(44, 30, 20, 0.92), transparent 55%), linear-gradient(165deg, #2c1e14 0%, #4a3224 30%, #6b4226 58%, #241810 100%)",
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

export type MoonmereStickerId =
  | "moon-full"
  | "moon-crescent"
  | "moth-sage"
  | "luna-moth"
  | "butterfly-etching"
  | "fairy-moon"
  | "fairy-starry"
  | "starfield"
  | "lantern-star"
  | "quote-from-moon"
  | "ticket-observatory"
  | "library-card"
  | "stamp-daphne"
  | "wallpaper-floral"
  | "pine-forest";

export const MOONMERE_STICKERS: {
  id: MoonmereStickerId;
  name: string;
  src: string;
}[] = [
  { id: "moon-full", name: "Full Moon", src: "/stickers/villages/moonmere/moon-full.png" },
  {
    id: "moon-crescent",
    name: "Man in the Moon",
    src: "/stickers/villages/moonmere/moon-crescent.png",
  },
  { id: "moth-sage", name: "Sage Moth", src: "/stickers/villages/moonmere/moth-sage.png" },
  { id: "luna-moth", name: "Luna Moth", src: "/stickers/villages/moonmere/luna-moth.png" },
  {
    id: "butterfly-etching",
    name: "Etched Butterfly",
    src: "/stickers/villages/moonmere/butterfly-etching.png",
  },
  { id: "fairy-moon", name: "Moon Fairy", src: "/stickers/villages/moonmere/fairy-moon.png" },
  {
    id: "fairy-starry",
    name: "Starry Fairy",
    src: "/stickers/villages/moonmere/fairy-starry.png",
  },
  { id: "starfield", name: "Night Sky", src: "/stickers/villages/moonmere/starfield.png" },
  {
    id: "lantern-star",
    name: "Star Lantern",
    src: "/stickers/villages/moonmere/lantern-star.png",
  },
  {
    id: "quote-from-moon",
    name: "From the Moon",
    src: "/stickers/villages/moonmere/quote-from-moon.png",
  },
  {
    id: "ticket-observatory",
    name: "Observatory Ticket",
    src: "/stickers/villages/moonmere/ticket-observatory.png",
  },
  {
    id: "library-card",
    name: "Moon Poems Card",
    src: "/stickers/villages/moonmere/library-card.png",
  },
  {
    id: "stamp-daphne",
    name: "Daphne Stamp",
    src: "/stickers/villages/moonmere/stamp-daphne.png",
  },
  {
    id: "wallpaper-floral",
    name: "Floral Scrap",
    src: "/stickers/villages/moonmere/wallpaper-floral.png",
  },
  {
    id: "pine-forest",
    name: "Night Pines",
    src: "/stickers/villages/moonmere/pine-forest.png",
  },
];

export const MOONMERE_DECOR: {
  id: MoonmereStickerId;
  className: string;
}[] = [
  { id: "moon-crescent", className: "decor-fern-tl" },
  { id: "fairy-moon", className: "decor-mushroom-tr" },
  { id: "moon-full", className: "decor-moon-tr" },
  { id: "moth-sage", className: "decor-fox-bl" },
  { id: "luna-moth", className: "decor-moth-br" },
  { id: "starfield", className: "decor-leaf-ml" },
  { id: "fairy-starry", className: "decor-butterfly-mr" },
  { id: "lantern-star", className: "decor-acorn-bm" },
  { id: "quote-from-moon", className: "decor-crow-tm" },
  { id: "stamp-daphne", className: "decor-sun-tr2" },
  { id: "pine-forest", className: "decor-spiral-bl2" },
  { id: "wallpaper-floral", className: "decor-flower-br2" },
];

export function cloverStickerSrc(id: CloverStickerId) {
  return (
    CLOVERMEADOW_STICKERS.find((s) => s.id === id)?.src ||
    `/stickers/villages/clovermeadow/${id}.png`
  );
}

export function moonmereStickerSrc(id: MoonmereStickerId) {
  return (
    MOONMERE_STICKERS.find((s) => s.id === id)?.src ||
    `/stickers/villages/moonmere/${id}.png`
  );
}

export type HearthwickStickerId =
  | "hedgehog"
  | "teapot"
  | "teacup"
  | "muffin"
  | "knit-blanket"
  | "flower-basket"
  | "candle"
  | "lavender";

export const HEARTHWICK_STICKERS: {
  id: HearthwickStickerId;
  name: string;
  src: string;
}[] = [
  {
    id: "hedgehog",
    name: "Hearth Hedgehog",
    src: "/stickers/villages/hearthwick/hedgehog.png",
  },
  {
    id: "teapot",
    name: "Leaf Teapot",
    src: "/stickers/villages/hearthwick/teapot.png",
  },
  {
    id: "teacup",
    name: "Flower Teacup",
    src: "/stickers/villages/hearthwick/teacup.png",
  },
  {
    id: "muffin",
    name: "Berry Muffin",
    src: "/stickers/villages/hearthwick/muffin.png",
  },
  {
    id: "knit-blanket",
    name: "Knit Blanket",
    src: "/stickers/villages/hearthwick/knit-blanket.png",
  },
  {
    id: "flower-basket",
    name: "Flower Basket",
    src: "/stickers/villages/hearthwick/flower-basket.png",
  },
  {
    id: "candle",
    name: "Mantel Candle",
    src: "/stickers/villages/hearthwick/candle.png",
  },
  {
    id: "lavender",
    name: "Lavender Sprig",
    src: "/stickers/villages/hearthwick/lavender.png",
  },
];

export const HEARTHWICK_DECOR: {
  id: HearthwickStickerId;
  className: string;
}[] = [
  { id: "lavender", className: "decor-fern-tl" },
  { id: "candle", className: "decor-mushroom-tr" },
  { id: "teapot", className: "decor-fox-bl" },
  { id: "knit-blanket", className: "decor-moth-br" },
  { id: "muffin", className: "decor-butterfly-mr" },
  { id: "flower-basket", className: "decor-sun-tr2" },
];

export function hearthwickStickerSrc(id: HearthwickStickerId) {
  return (
    HEARTHWICK_STICKERS.find((s) => s.id === id)?.src ||
    `/stickers/villages/hearthwick/${id}.png`
  );
}

export function getVillageTheme(villageId: string | null | undefined) {
  if (!villageId) return null;
  return VILLAGE_THEMES[villageId as VillageId] || null;
}
