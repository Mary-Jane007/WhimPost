import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import {
  getOrCreateVillageRoom,
  listFriendRooms,
  listChannelsForUser,
} from "@/lib/tvCorner";
import { getVillage, VILLAGES, type VillageId } from "@/lib/villages";
import { TvCorner } from "@/components/TvCorner";
import { PageCrest } from "@/components/PageCrest";

/**
 * Native unmute — works even if the React tree fails to hydrate.
 * Browsers require a real user gesture to start audio on autoplayed video.
 */
const TV_SOUND_BOOT = `
(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;
  function videoEl() {
    return document.querySelector("video.tv-video");
  }
  function setPrompt(visible) {
    document.querySelectorAll(".tv-sound-prompt").forEach(function (el) {
      el.style.display = visible ? "" : "none";
    });
    document.querySelectorAll(".tv-screen-shield").forEach(function (el) {
      if (visible) el.classList.add("tv-screen-shield-muted");
      else el.classList.remove("tv-screen-shield-muted");
      if (visible) {
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", "Turn sound on");
      } else {
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
      }
    });
    document.querySelectorAll("[data-tv-sound-toggle]").forEach(function (btn) {
      var label = btn.querySelector("[data-tv-sound-label]");
      if (visible) {
        btn.setAttribute("aria-label", "Turn sound on");
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("tv-knob-lit");
        if (label) label.textContent = "Sound";
      } else {
        btn.setAttribute("aria-label", "Turn sound off");
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("tv-knob-lit");
        if (label) label.textContent = "Mute";
      }
    });
  }
  function unmute() {
    var v = videoEl();
    if (!v) return false;
    v.muted = false;
    try { v.volume = 1; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    setPrompt(false);
    return true;
  }
  function mute() {
    var v = videoEl();
    if (!v) return false;
    v.muted = true;
    setPrompt(true);
    return true;
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var toggle = t.closest("[data-tv-sound-toggle]");
    if (toggle) {
      var v = videoEl();
      if (v && !v.muted) mute();
      else unmute();
      e.preventDefault();
      return;
    }
    if (t.closest(".tv-screen-shield-muted") || t.closest(".tv-sound-prompt")) {
      unmute();
      e.preventDefault();
    }
  }, true);
})();
`;

export default async function TvCornerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["moon-full", "mushroom-amanita", "fox-seated"]} />
        <header className="page-header">
          <h1>TV Corner</h1>
          <p>Join a village first — every lounge needs a hearth and neighbors.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your home,
          then come back for cartoons by the fire.
        </p>
      </main>
    );
  }

  const village = getVillage(user.villageId as VillageId)!;
  const room = getOrCreateVillageRoom(user, user.villageId as VillageId);
  const channels = listChannelsForUser(user, room);
  const friendRooms = listFriendRooms(user);
  const friends = listFriends(user.id);
  const villageOptions = VILLAGES.map((v) => ({ id: v.id, name: v.name }));

  return (
    <main className={`app-main forest-panel tv-corner-page village-${village.id}`}>
      <Script id="tv-sound-boot" strategy="afterInteractive">
        {TV_SOUND_BOOT}
      </Script>
      <TvCorner
        user={user}
        villageId={village.id}
        villageName={village.name}
        mascot={village.mascot}
        mascotImage={village.mascotImage || null}
        villageOptions={villageOptions}
        initialRoom={room}
        initialChannels={channels}
        initialFriendRooms={friendRooms}
        friendCount={friends.length}
      />
    </main>
  );
}
