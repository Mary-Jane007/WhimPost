import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  countUserLetters,
  getOrCreateCottage,
} from "@/lib/cottageState";
import { getDb } from "@/lib/db";
import {
  getFriendshipRelation,
  getUserByUsername,
} from "@/lib/letters";
import { listReadingListBooks, listClubBooks } from "@/lib/libraryBooks";
import { getLibraryProgress } from "@/lib/library";
import { getUserVillageStats } from "@/lib/villageProgress";
import { getVillage } from "@/lib/villages";
import { CottageProfile } from "@/components/CottageProfile";
import { PageCrest } from "@/components/PageCrest";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");

  const { username } = await params;
  const profile = getUserByUsername(username);
  if (!profile) notFound();

  const isSelf = viewer.id === profile.id;
  const homeVillageId = profile.homeVillageId || profile.villageId;
  const village = getVillage(homeVillageId);
  const visitingVillage =
    profile.villageId && profile.villageId !== homeVillageId
      ? getVillage(profile.villageId)
      : null;
  const db = getDb();
  const stats = getUserVillageStats(db, profile.id);
  const letterCount = countUserLetters(db, profile.id);
  const cottage = getOrCreateCottage(
    db,
    {
      id: profile.id,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
      reputation: profile.reputation,
      homeVillageId: profile.homeVillageId,
      villageId: profile.villageId,
    },
    stats.collectibles,
    letterCount
  );
  const relation = isSelf
    ? ({ status: "none" } as const)
    : getFriendshipRelation(viewer.id, profile.id);

  let shelfBooks: {
    id: string;
    title: string;
    author: string;
    status: "none" | "reading" | "finished" | "wishlist";
  }[] = [];
  try {
    const progress = getLibraryProgress(profile.id);
    const books = [...listReadingListBooks(), ...listClubBooks()];
    const seen = new Set<string>();
    for (const book of books) {
      if (seen.has(book.id)) continue;
      const status =
        progress.readingStatus[book.id] ||
        (progress.finishedBooks[book.id]
          ? "finished"
          : progress.wishlist[book.id]
            ? "wishlist"
            : "none");
      if (status === "none") continue;
      seen.add(book.id);
      shelfBooks.push({
        id: book.id,
        title: book.title,
        author: book.author,
        status,
      });
    }
    shelfBooks = shelfBooks.slice(0, 12);
  } catch {
    shelfBooks = [];
  }

  return (
    <main className="app-main cottage-main">
      <PageCrest kinds={["hand-mirror", "candle-jar", "leafy-branch"]} />
      <CottageProfile
        profile={profile}
        village={village}
        visitingVillage={visitingVillage}
        collectibles={stats.collectibles}
        isSelf={isSelf}
        relation={relation}
        shareVillage={Boolean(
          !isSelf &&
            (viewer.homeVillageId || viewer.villageId) &&
            (profile.homeVillageId || profile.villageId) &&
            (viewer.homeVillageId || viewer.villageId) ===
              (profile.homeVillageId || profile.villageId)
        )}
        initialCottage={cottage}
        shelfBooks={shelfBooks}
      />
    </main>
  );
}
