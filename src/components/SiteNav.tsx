"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserPublic } from "@/lib/types";

const links = [
  { href: "/inbox", label: "Inbox" },
  { href: "/sent", label: "Sent" },
  { href: "/compose", label: "Write" },
  { href: "/friends", label: "Friends" },
];

export function SiteNav({ user }: { user: UserPublic | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-nav">
      <Link href={user ? "/inbox" : "/"} className="brand-mark">
        <span className="brand-icon" aria-hidden>
          ✿
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
          <span className="nav-user">{user.displayName}</span>
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
