import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLibraryProgress } from "@/lib/library";
import {
  featuredClubBookMerged,
  listClubBooks,
  listReadingListBooks,
} from "@/lib/libraryBooks";
import { MosshollowLibrary } from "@/components/MosshollowLibrary";
import { PageCrest } from "@/components/PageCrest";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
    return (
      <main className="app-main forest-panel">
        <PageCrest
          kinds={["moss-books-stack", "leafy-branch", "moss-ink-bottle"]}
        />
        <header className="page-header">
          <h1>The Grand Library</h1>
          <p>Join Mosshollow first — every archive needs a quiet home.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your
          place among the moss and shelves.
        </p>
      </main>
    );
  }

  if (user.villageId !== "mosshollow") {
    return (
      <main className="app-main forest-panel">
        <PageCrest
          kinds={["moss-books-stack", "leafy-branch", "moss-ink-bottle"]}
        />
        <header className="page-header">
          <h1>The Grand Library</h1>
          <p>
            This library is exclusive to Mosshollow. Settle among the owls if
            you wish to become an Archivist.
          </p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
    );
  }

  const progress = getLibraryProgress(user.id);
  const clubBooks = listClubBooks();
  const readingList = listReadingListBooks();
  const featuredBook = featuredClubBookMerged() || clubBooks[0];

  return (
    <main className="app-main forest-panel mh-library-page village-mosshollow">
      <PageCrest
        kinds={[
          "moss-books-stack",
          "moss-ink-bottle",
          "leafy-branch",
          "candle-jar",
        ]}
      />
      {featuredBook ? (
        <MosshollowLibrary
          user={user}
          initialProgress={progress}
          clubBooks={clubBooks}
          readingList={readingList}
          featuredBook={featuredBook}
        />
      ) : (
        <p className="muted">The shelves are empty for now.</p>
      )}
    </main>
  );
}
