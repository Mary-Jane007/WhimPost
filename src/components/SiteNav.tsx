"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserPublic } from "@/lib/types";
import type { NavBadges } from "@/lib/notifications";

const links: Array<{
  href: string;
  label: string;
  badgeKey?: keyof NavBadges;
}> = [
  { href: "/village", label: "Village", badgeKey: "unlocks" },
  { href: "/inbox", label: "Inbox", badgeKey: "inbox" },
  { href: "/sent", label: "Sent" },
  { href: "/compose", label: "Write" },
  { href: "/friends", label: "Friends", badgeKey: "friends" },
  { href: "/profile", label: "Profile" },
];

function formatBadge(n: number) {
  if (n <= 0) return null;
  return n > 99 ? "99+" : String(n);
}

export function SiteNav({
  user,
  badges = { inbox: 0, friends: 0, unlocks: 0 },
}: {
  user: UserPublic | null;
  badges?: NavBadges;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-nav">
      <Link href={user ? "/village" : "/"} className="brand-mark">
        <span className="brand-icon" aria-hidden>
          {user?.villageId === "mosshollow"
            ? "🦉"
            : user?.villageId === "clovermeadow"
              ? "🐝"
              : user?.villageId === "moonmere"
                ? "🦋"
                : user?.villageId === "bramblewood"
                  ? "🦊"
                  : user?.villageId === "hearthwick"
                    ? "🦔"
                    : "✿"}
        </span>
        <span className="brand-text">WhimPost</span>
      </Link>

      {user ? (
        <nav className="nav-links" aria-label="Main">
          {links.map((link) => {
            const count = link.badgeKey ? badges[link.badgeKey] : 0;
            const badge = formatBadge(count);
            const title =
              link.badgeKey === "inbox" && count
                ? `${count} unread letter${count === 1 ? "" : "s"}`
                : link.badgeKey === "friends" && count
                  ? `${count} friend request${count === 1 ? "" : "s"}`
                  : link.badgeKey === "unlocks" && count
                    ? `${count} new cottage unlock${count === 1 ? "" : "s"}`
                    : undefined;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={pathname.startsWith(link.href) ? "active" : ""}
                title={title}
                aria-label={
                  badge ? `${link.label}, ${title}` : undefined
                }
              >
                <span>{link.label}</span>
                {badge ? (
                  <span className="nav-badge" aria-hidden>
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button type="button" className="nav-ghost" onClick={logout}>
            Sign out
          </button>
          <Link
            href={`/profile/${user.username}`}
            className={
              pathname.startsWith("/profile") ? "nav-user active" : "nav-user"
            }
          >
            {user.displayName}
            {user.isOwner ? <span className="owner-badge">Owner</span> : null}
          </Link>
        </nav>
      ) : (
        <nav className="nav-links" aria-label="Main">
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="nav-cta">
            Join the post
          </Link>
        </nav>
      )}
    </header>
  );
}
