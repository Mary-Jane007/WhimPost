/** Forever lounge channels that must always stay global and undeletable. */
export const PROTECTED_SHARED_TV_TITLES = [
  "cottage cartoons",
  "the storybook cinema",
  "storybook cinema",
] as const;

export function isSharedTvChannelTitle(title: string) {
  const t = title.trim().toLowerCase();
  if ((PROTECTED_SHARED_TV_TITLES as readonly string[]).includes(t)) return true;
  // Accept historical spellings / missing leading "the".
  const stripped = t.replace(/^the\s+/, "");
  return (
    stripped === "storybook cinema" ||
    stripped === "cottage cartoons" ||
    stripped === "cottage cartoon"
  );
}

export function isProtectedTvChannelTitle(title: string) {
  return isSharedTvChannelTitle(title);
}
