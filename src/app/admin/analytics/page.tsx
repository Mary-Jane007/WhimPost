import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { OwnerAnalyticsDashboard } from "@/components/OwnerAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function OwnerAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/analytics");
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    redirect("/village");
  }

  return (
    <main className="app-main forest-panel oa-page">
      <OwnerAnalyticsDashboard />
    </main>
  );
}
