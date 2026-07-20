"use client";

import { useMemo, useState, useTransition } from "react";
import type { UserPublic } from "@/lib/types";

interface FriendRequest {
  id: string;
  createdAt: string;
  user: UserPublic;
}

export function FriendsPanel({
  initialFriends,
  initialIncoming,
  initialOutgoing,
}: {
  initialFriends: UserPublic[];
  initialIncoming: FriendRequest[];
  initialOutgoing: FriendRequest[];
}) {
  const [friends, setFriends] = useState(initialFriends);
  const [incoming, setIncoming] = useState(initialIncoming);
  const [outgoing, setOutgoing] = useState(initialOutgoing);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const [searchTimer, setSearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  async function refresh() {
    const res = await fetch("/api/friends");
    const data = await res.json();
    if (res.ok) {
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    }
  }

  function searchUsers(value: string) {
    setQuery(value);
    if (searchTimer) clearTimeout(searchTimer);
    if (value.trim().length < 2) {
      setResults([]);
      setSearchTimer(null);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `/api/friends/search?q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      if (res.ok) setResults(data.users);
    }, 200);
    setSearchTimer(timer);
  }

  async function sendRequest(name: string) {
    setError("");
    setMessage("");
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not send request");
      return;
    }
    setMessage(`Invitation sent to @${name}`);
    setUsername("");
    setQuery("");
    setResults([]);
    startTransition(() => {
      void refresh();
    });
  }

  async function respond(requestId: string, action: "accept" | "decline") {
    await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    await refresh();
  }

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  return (
    <div className="friends-panel">
      <section className="friends-section">
        <h2>Invite a friend</h2>
        <p className="section-lead">
          Search for someone who already has a WhimPost mailbox, or send a request
          by username.
        </p>
        <div className="friend-invite-row">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Exact username"
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => sendRequest(username.trim())}
            disabled={!username.trim()}
          >
            Send request
          </button>
        </div>
        <input
          className="search-input"
          value={query}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search display names or usernames…"
        />
        {results.length > 0 && (
          <ul className="user-list">
            {results
              .filter((u) => !friendIds.has(u.id))
              .map((u) => (
                <li key={u.id}>
                  <div>
                    <strong>{u.displayName}</strong>
                    <span>@{u.username}</span>
                    {u.forestName && <em>{u.forestName}</em>}
                  </div>
                  <button type="button" onClick={() => sendRequest(u.username)}>
                    Add
                  </button>
                </li>
              ))}
          </ul>
        )}
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </section>

      {incoming.length > 0 && (
        <section className="friends-section">
          <h2>Waiting on your porch</h2>
          <ul className="user-list">
            {incoming.map((req) => (
              <li key={req.id}>
                <div>
                  <strong>{req.user.displayName}</strong>
                  <span>@{req.user.username}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => respond(req.id, "accept")}>
                    Accept
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => respond(req.id, "decline")}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="friends-section">
          <h2>Sent invitations</h2>
          <ul className="user-list soft">
            {outgoing.map((req) => (
              <li key={req.id}>
                <div>
                  <strong>{req.user.displayName}</strong>
                  <span>@{req.user.username}</span>
                </div>
                <em className="pending-tag">Pending</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="friends-section">
        <h2>Your circle</h2>
        {friends.length === 0 ? (
          <p className="muted">
            No friends yet. Invite someone and your letters can start traveling.
          </p>
        ) : (
          <ul className="user-list">
            {friends.map((f) => (
              <li key={f.id}>
                <div>
                  <strong>{f.displayName}</strong>
                  <span>@{f.username}</span>
                  {f.forestName && <em>{f.forestName}</em>}
                  {f.bio && <p>{f.bio}</p>}
                </div>
                <a className="btn-secondary" href={`/compose?to=${f.username}`}>
                  Write
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
