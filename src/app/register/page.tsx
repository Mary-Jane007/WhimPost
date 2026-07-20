import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/AuthForms";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inbox");

  return (
    <main className="auth-page">
      <div className="auth-panel">
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
