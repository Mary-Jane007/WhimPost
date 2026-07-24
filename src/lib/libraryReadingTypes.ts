export type ReadingPosition = {
  cfi?: string | null;
  percent: number;
  page?: number | null;
  total?: number | null;
  label?: string;
  updatedAt: string;
};

export type ReadingPositions = Record<string, ReadingPosition>;

export const ANNOTATION_INKS = [
  { id: "moss", label: "Forest moss", swatch: "#4a6b45" },
  { id: "rose", label: "Rosehip", swatch: "#a35d72" },
  { id: "gold", label: "Candle gold", swatch: "#c9a227" },
  { id: "indigo", label: "Midnight indigo", swatch: "#3a4868" },
  { id: "berry", label: "Berry jam", swatch: "#8b3a4a" },
] as const;

export type AnnotationInk = (typeof ANNOTATION_INKS)[number]["id"];

export type LibraryAnnotation = {
  id: string;
  bookId: string;
  cfi: string | null;
  pageLabel: string;
  percent: number;
  selectedText: string;
  body: string;
  ink: AnnotationInk;
  createdAt: string;
  updatedAt: string;
};
