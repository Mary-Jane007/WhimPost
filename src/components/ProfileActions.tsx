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
        <Link className="btn-primary" href={`/compose?to=${username}`}>
          Write a letter
        </Link>
      )}
      {status.status === "none" && (
        <button
          type="button"
          className="btn-primary"
          onClick={sendRequest}
          disabled={busy}
        >
          {busy ? "Sending…" : "Add friend"}
        </button>
      )}
      {status.status === "pending_out" && (
        <span className="pending-tag">Invitation pending</span>
      )}
      {status.status === "pending_in" && (
        <div className="row-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => respond("accept")}
            disabled={busy}
          >
            Accept
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => respond("decline")}
            disabled={busy}
          >
            Decline
          </button>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
