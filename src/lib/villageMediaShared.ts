/** Shared village media helpers (safe for client + server). */

export type VillageMediaMap = Record<string, string>;

export function villageMediaKey(...parts: string[]) {
  return parts.map((p) => String(p).trim()).filter(Boolean).join(":");
}

export function resolveVillageImage(
  overrides: VillageMediaMap,
  key: string,
  fallback: string
) {
  return overrides[key] || fallback;
}

export function isValidVillageMediaKey(key: string) {
  return /^[a-z0-9][a-z0-9:_-]{1,120}$/i.test(key);
}

export function isValidVillageMediaUrl(url: string) {
  return /^\/(api\/uploads\/[a-f0-9-]+\.(jpe?g|png|webp|gif)|[a-z0-9/_-]+\.(jpe?g|png|webp|gif))$/i.test(
    url
  );
}
