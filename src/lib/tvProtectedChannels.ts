/** Forever lounge channels that must always stay global and undeletable. */
export const PROTECTED_SHARED_TV_TITLES = [
  "cottage cartoons",
  "the storybook cinema",
] as const;

export function isSharedTvChannelTitle(title: string) {
  const t = title.trim().toLowerCase();
  return (PROTECTED_SHARED_TV_TITLES as readonly string[]).includes(t);
}

export function isProtectedTvChannelTitle(title: string) {
  return isSharedTvChannelTitle(title);
}
