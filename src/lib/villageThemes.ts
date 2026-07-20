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
  bramblewood: {
    color: "#e07020",
    colorSoft: "#f0a868",
    accent: "#f08a3a",
    cream: "#fff1e0",
    ink: "#3a1f12",
    gold: "#ffc857",
    bgGlow:
      "radial-gradient(ellipse at 14% 8%, rgba(240, 168, 104, 0.42), transparent 46%), radial-gradient(ellipse at 86% 12%, rgba(224, 112, 32, 0.28), transparent 42%), radial-gradient(ellipse at 50% 100%, rgba(42, 22, 12, 0.9), transparent 55%), linear-gradient(165deg, #2a160c 0%, #3d2214 28%, #5a3218 58%, #1f120a 100%)",
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

export type BramblewoodStickerId =
  | "fox-sleeping"
  | "fox-sitting"
  | "fox-face"
  | "fox-standing"
  | "autumn-leaves"
  | "misty-pines"
  | "candle-jar"
  | "star-lights"
  | "book-leaf"
  | "pumpkin"
  | "red-bow"
  | "maple-branch"
  | "berry-sprig"
  | "ladybug"
  | "teapot"
  | "knit-socks"
  | "blankets"
  | "compass"
  | "full-moon"
  | "eucalyptus"
  | "monarch"
  | "bouquet"
  | "mushroom"
  | "autumn-tree";

export const BRAMBLEWOOD_STICKERS: {
  id: BramblewoodStickerId;
  name: string;
  src: string;
}[] = [
  {
    id: "fox-sleeping",
    name: "Sleeping Fox",
    src: "/stickers/villages/bramblewood/fox-sleeping.png",
  },
  {
    id: "fox-sitting",
    name: "Sitting Fox",
    src: "/stickers/villages/bramblewood/fox-sitting.png",
  },
  {
    id: "fox-face",
    name: "Fox Portrait",
    src: "/stickers/villages/bramblewood/fox-face.png",
  },
  {
    id: "fox-standing",
    name: "Standing Fox",
    src: "/stickers/villages/bramblewood/fox-standing.png",
  },
  {
    id: "autumn-leaves",
    name: "Oak Leaves",
    src: "/stickers/villages/bramblewood/autumn-leaves.png",
  },
  {
    id: "misty-pines",
    name: "Autumn Tree",
    src: "/stickers/villages/bramblewood/misty-pines.png",
  },
  {
    id: "autumn-tree",
    name: "Autumn Tree",
    src: "/stickers/villages/bramblewood/pack/autumn-tree.png",
  },
  {
    id: "candle-jar",
    name: "Hello Fall Candle",
    src: "/stickers/villages/bramblewood/candle-jar.png",
  },
  {
    id: "star-lights",
    name: "Monarch",
    src: "/stickers/villages/bramblewood/star-lights.png",
  },
  {
    id: "monarch",
    name: "Monarch",
    src: "/stickers/villages/bramblewood/pack/monarch.png",
  },
  {
    id: "book-leaf",
    name: "Story Stack",
    src: "/stickers/villages/bramblewood/book-leaf.png",
  },
  {
    id: "pumpkin",
    name: "Pumpkin Pie",
    src: "/stickers/villages/bramblewood/pumpkin.png",
  },
  {
    id: "red-bow",
    name: "Autumn Bouquet",
    src: "/stickers/villages/bramblewood/red-bow.png",
  },
  {
    id: "bouquet",
    name: "Autumn Bouquet",
    src: "/stickers/villages/bramblewood/pack/bouquet.png",
  },
  {
    id: "maple-branch",
    name: "Maple Leaf",
    src: "/stickers/villages/bramblewood/maple-branch.png",
  },
  {
    id: "berry-sprig",
    name: "Fly Agaric",
    src: "/stickers/villages/bramblewood/berry-sprig.png",
  },
  {
    id: "mushroom",
    name: "Fly Agaric",
    src: "/stickers/villages/bramblewood/pack/mushroom.png",
  },
  {
    id: "ladybug",
    name: "Ladybug",
    src: "/stickers/villages/bramblewood/ladybug.png",
  },
  {
    id: "teapot",
    name: "Foxflower Teapot",
    src: "/stickers/villages/bramblewood/teapot.png",
  },
  {
    id: "knit-socks",
    name: "Knit Socks",
    src: "/stickers/villages/bramblewood/knit-socks.png",
  },
  {
    id: "blankets",
    name: "Cozy Blankets",
    src: "/stickers/villages/bramblewood/blankets.png",
  },
  {
    id: "compass",
    name: "Explorer Compass",
    src: "/stickers/villages/bramblewood/compass.png",
  },
  {
    id: "full-moon",
    name: "Warm Moon",
    src: "/stickers/villages/bramblewood/full-moon.png",
  },
  {
    id: "eucalyptus",
    name: "Eucalyptus",
    src: "/stickers/villages/bramblewood/eucalyptus.png",
  },
];

export const BRAMBLEWOOD_DECOR: {
  id: BramblewoodStickerId;
  className: string;
}[] = [
  { id: "maple-branch", className: "decor-fern-tl" },
  { id: "autumn-leaves", className: "decor-mushroom-tr" },
  { id: "misty-pines", className: "decor-moon-tr" },
  { id: "fox-sleeping", className: "decor-fox-bl" },
  { id: "fox-sitting", className: "decor-moth-br" },
  { id: "monarch", className: "decor-leaf-ml" },
  { id: "candle-jar", className: "decor-butterfly-mr" },
  { id: "pumpkin", className: "decor-acorn-bm" },
  { id: "teapot", className: "decor-crow-tm" },
  { id: "bouquet", className: "decor-sun-tr2" },
  { id: "mushroom", className: "decor-spiral-bl2" },
  { id: "fox-face", className: "decor-flower-br2" },
];

export function bramblewoodStickerSrc(id: BramblewoodStickerId) {
  return (
    BRAMBLEWOOD_STICKERS.find((s) => s.id === id)?.src ||
    `/stickers/villages/bramblewood/${id}.png`
  );
}

export function getVillageTheme(villageId: string | null | undefined) {
  if (!villageId) return null;
  return VILLAGE_THEMES[villageId as VillageId] || null;
}
