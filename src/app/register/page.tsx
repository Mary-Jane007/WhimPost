import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";
import { ForestStickers } from "@/components/ForestDecor";
import { StickerArt } from "@/components/stickers/StickerArt";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inbox");

  return (
    <main className="auth-page">
      <ForestStickers density="auth" />
      <div className="auth-panel moss-panel">
        <div className="auth-stickers" aria-hidden>
          <StickerArt kind="moth" className="w-12 h-12" />
          <StickerArt kind="fern" className="w-12 h-12" />
          <StickerArt kind="sun" className="w-12 h-12" />
        </div>
        <h1>Claim your mailbox</h1>
        <p className="lede">
          Choose a woodland name and begin writing letters that feel found, not
          typed.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
