import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getFriendshipRelation,
  getUserByUsername,
} from "@/lib/letters";
import { getVillage, rankFromRep } from "@/lib/villages";
import { PageCrest } from "@/components/PageCrest";
import { ProfileActions } from "@/components/ProfileActions";
import { ProfileEditor } from "@/components/ProfileEditor";
import { VillageMascot } from "@/components/VillageMascot";

function formatJoined(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

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
  const village = getVillage(profile.villageId);
  const rank = rankFromRep(profile.reputation);
  const relation = isSelf
    ? ({ status: "none" } as const)
    : getFriendshipRelation(viewer.id, profile.id);

  return (
    <main className="app-main forest-panel">
      <PageCrest kinds={["hand-mirror", "skeleton-key", "leafy-branch"]} />
      <header className="page-header profile-header">
        <p className="profile-kicker">Villager profile</p>
        <h1>{profile.displayName}</h1>
        <p>
          @{profile.username}
          {profile.isOwner ? " · Owner" : ""}
        </p>
      </header>

      <section className="profile-sheet">
        <div className="profile-identity">
          {village ? (
            <div className="profile-village">
              <VillageMascot village={village} size="lg" />
              <div>
                <strong>{village.name}</strong>
                <span>{village.motto}</span>
              </div>
            </div>
          ) : (
            <p className="muted">Still choosing a village.</p>
          )}

          <dl className="profile-meta">
            {profile.forestName ? (
              <>
                <dt>Forest name</dt>
                <dd>{profile.forestName}</dd>
              </>
            ) : null}
            <dt>Rank</dt>
            <dd>
              {rank.emoji} {rank.label}
              <span className="profile-rep">{profile.reputation} rep</span>
            </dd>
            <dt>Joined</dt>
            <dd>{formatJoined(profile.createdAt)}</dd>
          </dl>

          <div className="profile-bio">
            <h2>About</h2>
            {profile.bio ? (
              <p>{profile.bio}</p>
            ) : (
              <p className="muted">
                {isSelf
                  ? "You haven’t written a bio yet."
                  : "This villager hasn’t written a bio yet."}
              </p>
            )}
          </div>

          {isSelf ? (
            <p className="profile-self-note muted">
              This is your porch. Neighbors can visit anytime.
            </p>
          ) : (
            <ProfileActions username={profile.username} relation={relation} />
          )}

          {!isSelf && viewer.villageId && profile.villageId === viewer.villageId ? (
            <p className="muted profile-neighbor">
              You share a village — say hello from the{" "}
              <Link href="/village">Meeting Bench</Link>.
            </p>
          ) : null}
        </div>

        {isSelf ? <ProfileEditor user={profile} /> : null}
      </section>
    </main>
  );
}
