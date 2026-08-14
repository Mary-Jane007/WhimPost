import path from "path";

/**
 * Leaf path constants for TV media catalogs.
 * Keep this free of app imports so production bundles never see
 * undefined paths from circular module graphs.
 */
export const PERSISTENT_TV_MEDIA_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-tv-media.json"
);

export const TV_CACHE_DIR = path.join(process.cwd(), "data", "tv-cache");
