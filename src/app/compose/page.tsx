import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import { ComposeStudio } from "@/components/ComposeStudio";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const friends = listFriends(user.id);
  const params = await searchParams;
  const preferred = params.to?.toLowerCase();
  const ordered = preferred
    ? [
        ...friends.filter((f) => f.username.toLowerCase() === preferred),
        ...friends.filter((f) => f.username.toLowerCase() !== preferred),
      ]
    : friends;

  return (
    <main className="app-main">
      <header className="page-header">
        <h1>Write a letter</h1>
        <p>
          Pick paper and an envelope, scatter stickers and scraps, then seal it
          shut.
        </p>
      </header>
      <ComposeStudio friends={ordered} />
    </main>
  );
}
