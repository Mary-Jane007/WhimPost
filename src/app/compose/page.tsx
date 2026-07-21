import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import { ComposeStudio } from "@/components/ComposeStudio";
import { PageCrest } from "@/components/PageCrest";
import type { StickerKind } from "@/lib/types";

const COMPOSE_COPY: Record<
  string,
  { title: string; lead: string; crest: StickerKind[] }
> = {
  mosshollow: {
    title: "Write among the shelves",
    lead: "Sage Mosshollow paper, a quiet border, and the library owl — with room to decorate the page yourself.",
    crest: ["mushroom-amanita", "leafy-branch", "moon-full"],
  },
  clovermeadow: {
    title: "Write in the meadow",
    lead: "Blush Clovermeadow paper, a quiet border, and a honeybee — with room to decorate the page yourself.",
    crest: ["sunflower", "butterfly-green", "gingham-bow"],
  },
  moonmere: {
    title: "Write by moonlight",
    lead: "Misty Moonmere paper, a quiet border, and a luna moth — with room to decorate the page yourself.",
    crest: ["moon-crescent", "moon-full", "dragonfly"],
  },
  bramblewood: {
    title: "Write on the trail",
    lead: "Cream trail paper with a quiet border, a fox on mossy stones, and plenty of room to decorate.",
    crest: ["fox-seated", "mushroom-amanita", "leafy-branch"],
  },
  hearthwick: {
    title: "Write by the hearth",
    lead: "Warm Hearthwick parchment, a quiet border, and a hedgehog — with room to decorate the page yourself.",
    crest: ["pie", "candle-jar", "jam-jar"],
  },
};

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

  const copy = (user.villageId && COMPOSE_COPY[user.villageId]) || null;

  return (
    <main
      className={`app-main forest-panel ${
        copy && user.villageId ? `compose-page-${user.villageId}` : ""
      }`}
    >
      <PageCrest
        kinds={
          copy?.crest || ["frogs-tandem", "butterfly-green", "narcissus"]
        }
      />
      <header className="page-header">
        <h1>{copy?.title || "Write a letter"}</h1>
        <p>
          {copy?.lead ||
            "Pick paper and an envelope, scatter stickers and scraps, then seal it shut."}
        </p>
      </header>
      <ComposeStudio friends={ordered} villageId={user.villageId} />
    </main>
  );
}
