"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserPublic } from "@/lib/types";

export function ProfileEditor({ user }: { user: UserPublic }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [forestName, setForestName] = useState(user.forestName);
  const [bio, setBio] = useState(user.bio);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, forestName, bio }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save profile");
      return;
    }
    setMessage("Profile updated");
    router.refresh();
  }

  return (
    <form className="profile-edit" onSubmit={save}>
      <h2>Edit your profile</h2>
      <label>
        Display name
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
        />
      </label>
      <label>
        Forest name
        <input
          value={forestName}
          onChange={(e) => setForestName(e.target.value)}
          maxLength={60}
          placeholder="Your cottage nickname"
        />
      </label>
      <label>
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={4}
          placeholder="A few words about you…"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
