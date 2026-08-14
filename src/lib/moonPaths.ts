import path from "path";

/** Shared path constants for Celestial Sounds (avoids circular imports). */
export const MOON_SOUND_DIR = path.join(
  process.cwd(),
  "data",
  "uploads",
  "moon-sounds"
);
