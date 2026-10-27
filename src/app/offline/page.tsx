import Link from "next/link";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="app-main" style={{ padding: "2rem 1.25rem", maxWidth: 28 + "rem", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", marginBottom: "0.5rem" }}>
        WhimPost is opening…
      </h1>
      <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
        The cottage is waking up. Pages you have already visited are kept on
        this device so WhimPost can open like an app — even while the network
        catches up.
      </p>
      <p style={{ marginTop: "1.25rem" }}>
        <Link href="/village" className="btn-primary">
          Open my village
        </Link>
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        <Link href="/login" className="btn-secondary">
          Sign in
        </Link>
      </p>
    </main>
  );
}
