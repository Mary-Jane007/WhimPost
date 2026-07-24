import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";
import { ForestStickers } from "@/components/ForestDecor";
import { StickerArt } from "@/components/stickers/StickerArt";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/village");

  return (
    <main className="auth-page">
      <ForestStickers density="auth" />
      <div className="auth-panel moss-panel">
        <div className="auth-stickers" aria-hidden>
          <StickerArt kind="fox-seated" className="w-12 h-12" />
          <StickerArt kind="mushroom-amanita" className="w-12 h-12" />
          <StickerArt kind="moon-full" className="w-12 h-12" />
        </div>
        <h1>Welcome back</h1>
        <p className="lede">
          Slip into your forest mailbox — you&apos;ll land in your village after
          signing in.
        </p>
        <p className="lede muted" style={{ marginTop: "-0.35rem" }}>
          If you only see a single “token” password box, open port 3333 from
          Cursor&apos;s Ports panel first — that screen is Cursor&apos;s gate,
          not WhimPost.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
