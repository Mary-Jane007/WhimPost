import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";
import { ForestStickers } from "@/components/ForestDecor";
import { StickerArt } from "@/components/stickers/StickerArt";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/village");

  return (
    <main className="auth-page auth-page-wide">
      <ForestStickers density="auth" />
      <div className="auth-panel moss-panel auth-panel-wide">
        <div className="auth-stickers" aria-hidden>
          <StickerArt kind="frogs-tandem" className="w-12 h-12" />
          <StickerArt kind="leafy-branch" className="w-12 h-12" />
          <StickerArt kind="sunflower" className="w-12 h-12" />
        </div>
        <h1>Claim your mailbox</h1>
        <p className="lede">
          Choose a woodland name, then Discover your belonging — the forest will
          guide you home before your first letter is written.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
