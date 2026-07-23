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
  const isBramblewood = user.villageId === "bramblewood";

  return (
    <main
      className={`app-main forest-panel ${
        isHearthwick
          ? "compose-page-hearthwick"
          : isBramblewood
            ? "compose-page-bramblewood"
            : ""
      }`}
    >
      <PageCrest
        kinds={
          isHearthwick
            ? ["pie", "candle-jar", "jam-jar"]
            : isBramblewood
              ? ["fox-seated", "mushroom-amanita", "leafy-branch"]
              : ["frogs-tandem", "butterfly-green", "narcissus"]
        }
      />
      <header className="page-header">
        <h1>
          {isHearthwick
            ? "Write by the hearth"
            : isBramblewood
              ? "Write on the trail"
              : "Write a letter"}
        </h1>
        <p>
          {isHearthwick
            ? "Lined cottage parchment, a meadow hedgehog in the corner, and room for whatever you need to say."
            : isBramblewood
              ? "Cream trail paper with a quiet border, a fox on mossy stones, and plenty of room to decorate."
              : "Pick paper and an envelope, scatter stickers and scraps, then seal it shut."}
        </p>
      </header>
      <ComposeStudio friends={ordered} villageId={user.villageId} />
    </main>
  );
}
