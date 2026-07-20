import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StickerArt } from "@/components/stickers/StickerArt";
import { EnvelopeFace } from "@/components/EnvelopeFace";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/inbox");

  return (
    <main>
      <section className="hero" aria-label="WhimPost">
        <div className="hero-visual" aria-hidden />
        <div className="hero-content">
          <h1 className="hero-brand">WhimPost</h1>
          <p className="hero-line">
            Send cottagecore letters through the trees — stickers, scraps, seals,
            and all.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn-primary">
              Open a mailbox
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <div className="motif-strip" aria-hidden>
        <StickerArt kind="fox" />
        <StickerArt kind="moth" />
        <StickerArt kind="mushroom" />
        <StickerArt kind="moon" />
        <StickerArt kind="fern" />
      </div>

      <section className="landing-section">
        <h2>Mail that feels handmade</h2>
        <p>
          WhimPost is a quiet place to write real letters online — parchment and
          kraft, pressed petals, wax seals, and junk-journal scraps your friends
          can open like something found in a mossy postbox.
        </p>
        <div className="feature-flow">
          <div className="feature-visual">
            <div className="demo-envelope">
              <EnvelopeFace
                style="sage"
                toName="Your friend"
                fromName="The woods"
                stampStyle="moth"
                waxSeal="spiral"
              />
            </div>
          </div>
          <div className="feature-copy">
            <ol>
              <li>
                <strong>Find your circle</strong>
                <span>Invite friends who also keep a WhimPost mailbox.</span>
              </li>
              <li>
                <strong>Compose at your desk</strong>
                <span>
                  Choose paper and envelopes, then scatter stickers and quote
                  scraps across the page.
                </span>
              </li>
              <li>
                <strong>Seal & send</strong>
                <span>
                  Add a wax seal and postage stamp, then watch the letter land in
                  their inbox.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
