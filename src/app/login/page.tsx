import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";
import { ForestStickers } from "@/components/ForestDecor";
import { StickerArt } from "@/components/stickers/StickerArt";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inbox");

  return (
    <main className="auth-page">
      <ForestStickers density="auth" />
      <div className="auth-panel moss-panel">
        <div className="auth-stickers" aria-hidden>
          <StickerArt kind="fox" className="w-12 h-12" />
          <StickerArt kind="mushroom" className="w-12 h-12" />
          <StickerArt kind="moon" className="w-12 h-12" />
        </div>
        <h1>Welcome back</h1>
        <p className="lede">Slip into your forest mailbox.</p>
        <LoginForm />
      </div>
    </main>
  );
}
