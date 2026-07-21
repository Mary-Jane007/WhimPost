"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserPublic } from "@/lib/types";

export function SiteNav({ user }: { user: UserPublic | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/village", label: "Village" },
    ...(user?.villageId === "bramblewood"
      ? [{ href: "/workshop", label: "Workshop" }]
      : []),
    ...(user?.villageId === "mosshollow"
      ? [{ href: "/library", label: "Library" }]
      : []),
    { href: "/tv-corner", label: "TV Corner" },
    { href: "/inbox", label: "Inbox" },
    { href: "/sent", label: "Sent" },
    { href: "/compose", label: "Write" },
    { href: "/friends", label: "Friends" },
    { href: "/profile", label: "Profile" },
  ];

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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
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
