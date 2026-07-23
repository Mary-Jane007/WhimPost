import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import { ComposeStudio } from "@/components/ComposeStudio";
import { PageCrest } from "@/components/PageCrest";

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

  const isHearthwick = user.villageId === "hearthwick";

  return (
    <main
      className={`app-main forest-panel ${isHearthwick ? "compose-page-hearthwick" : ""}`}
    >
      <PageCrest
        kinds={
          isHearthwick
            ? ["pie", "candle-jar", "jam-jar"]
            : ["frogs-tandem", "butterfly-green", "narcissus"]
        }
      />
      <header className="page-header">
        <h1>{isHearthwick ? "Write by the hearth" : "Write a letter"}</h1>
        <p>
          {isHearthwick
            ? "Lined cottage parchment, a meadow hedgehog in the corner, and room for whatever you need to say."
            : "Pick paper and an envelope, scatter stickers and scraps, then seal it shut."}
        </p>
      </header>
      <ComposeStudio friends={ordered} villageId={user.villageId} />
    </main>
  );
}
