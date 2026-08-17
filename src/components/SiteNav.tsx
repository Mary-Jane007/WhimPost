"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserPublic } from "@/lib/types";
import type { NavBadges } from "@/lib/notifications";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links: Array<{
    href: string;
    label: string;
    badgeKey?: keyof NavBadges;
  }> = user
    ? [
        { href: "/village", label: "Village", badgeKey: "unlocks" },
        ...(user.villageId === "bramblewood"
          ? [{ href: "/workshop", label: "Workshop" }]
          : []),
        ...(user.villageId === "mosshollow"
          ? [{ href: "/library", label: "Library" }]
          : []),
        ...(user.villageId === "clovermeadow"
          ? [{ href: "/garden", label: "Garden" }]
          : []),
        ...(user.villageId === "hearthwick"
          ? [{ href: "/fireside", label: "Fireside" }]
          : []),
        ...(user.villageId === "moonmere"
          ? [{ href: "/observatory", label: "Observatory" }]
          : []),
        { href: "/tv-corner", label: "TV" },
        { href: "/meeting-bench", label: "Bench" },
        ...(user.isOwner
          ? [{ href: "/admin/analytics", label: "Analytics" }]
          : []),
        { href: "/inbox", label: "Inbox", badgeKey: "inbox" },
        { href: "/sent", label: "Sent" },
        { href: "/compose", label: "Write" },
        { href: "/friends", label: "Friends", badgeKey: "friends" },
      ]
    : [];

  return (
    <header className={`site-nav${menuOpen ? " is-open" : ""}`}>
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

      <button
        type="button"
        className="nav-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-nav-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="nav-menu-bars" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="nav-menu-label">{menuOpen ? "Close" : "Menu"}</span>
      </button>

      <nav
        id="site-nav-menu"
        className="nav-links"
        aria-label="Main"
        data-open={menuOpen ? "true" : "false"}
      >
        {user ? (
          <>
            <div className="nav-primary">
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
                    aria-label={badge ? `${link.label}, ${title}` : undefined}
                    onClick={() => setMenuOpen(false)}
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
            </div>
            <div className="nav-account">
              <Link
                href={`/profile/${user.username}`}
                className={
                  pathname.startsWith("/profile")
                    ? "nav-user active"
                    : "nav-user"
                }
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-user-name">{user.displayName}</span>
                {user.isOwner ? (
                  <span className="owner-badge">Owner</span>
                ) : null}
              </Link>
              <form
                action="/api/auth/logout"
                method="post"
                className="nav-logout"
              >
                <button type="submit" className="nav-ghost">
                  Sign out
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="nav-account nav-account-guest">
            <Link
              href="/login"
              className="nav-ghost-link"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="nav-cta"
              onClick={() => setMenuOpen(false)}
            >
              Join
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
