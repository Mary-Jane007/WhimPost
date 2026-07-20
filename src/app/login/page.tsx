import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inbox");

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <h1>Welcome back</h1>
        <p className="lede">Slip into your forest mailbox.</p>
        <LoginForm />
      </div>
    </main>
  );
}
