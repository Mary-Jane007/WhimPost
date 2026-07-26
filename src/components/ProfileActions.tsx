"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FriendshipRelation } from "@/lib/letters";

export function ProfileActions({
  username,
  relation,
}: {
  username: string;
  relation: FriendshipRelation;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(relation);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendRequest() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not send request");
      return;
    }
    setStatus({ status: "pending_out" });
    router.refresh();
  }

  async function respond(action: "accept" | "decline") {
    if (status.status !== "pending_in") return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: status.requestId, action }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not respond");
      return;
    }
    setStatus(action === "accept" ? { status: "friends" } : { status: "none" });
    router.refresh();
  }

  return (
    <div className="profile-actions">
      {status.status === "friends" && (
        <Link
          className="cottage-tool cottage-tool-primary"
          href={`/compose?to=${username}`}
        >
          <span aria-hidden>✉</span>
          Write
        </Link>
      )}
      {status.status === "none" && (
        <form
          action="/api/friends/request"
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            void sendRequest();
          }}
        >
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="next" value={`/profile/${username}`} />
          <button
            type="submit"
            className="cottage-tool cottage-tool-primary"
            disabled={busy}
          >
            <span aria-hidden>🌼</span>
            {busy ? "Sending…" : "Add friend"}
          </button>
        </form>
      )}
      {status.status === "pending_out" && (
        <span className="cottage-tool is-disabled">
          <span aria-hidden>⏳</span>
          Pending
        </span>
      )}
      {status.status === "pending_in" && (
        <>
          <form
            action="/api/friends/respond"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              void respond("accept");
            }}
          >
            <input type="hidden" name="requestId" value={status.requestId} />
            <input type="hidden" name="action" value="accept" />
            <input type="hidden" name="next" value={`/profile/${username}`} />
            <button
              type="submit"
              className="cottage-tool cottage-tool-primary"
              disabled={busy}
            >
              <span aria-hidden>✓</span>
              Accept
            </button>
          </form>
          <form
            action="/api/friends/respond"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              void respond("decline");
            }}
          >
            <input type="hidden" name="requestId" value={status.requestId} />
            <input type="hidden" name="action" value="decline" />
            <input type="hidden" name="next" value={`/profile/${username}`} />
            <button type="submit" className="cottage-tool" disabled={busy}>
              Decline
            </button>
          </form>
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
