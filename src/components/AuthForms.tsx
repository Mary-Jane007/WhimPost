"use client";

import { useState } from "react";
import Link from "next/link";
import { VILLAGES, type VillageId } from "@/lib/villages";
import { VillageMascot } from "@/components/VillageMascot";

export function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    window.location.assign("/village");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Username, display name, or email
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Opening mailbox…" : "Enter the forest post"}
      </button>
      <p className="auth-switch">
        New here? <Link href="/register">Create a mailbox</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [forestName, setForestName] = useState("");
  const [password, setPassword] = useState("");
  const [villageId, setVillageId] = useState<VillageId | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!villageId) {
      setError("Choose a village to call home");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        displayName,
        email,
        password,
        forestName,
        villageId,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not create mailbox");
      return;
    }
    window.location.assign("/village");
  }

  return (
    <form className="auth-form register-wide" onSubmit={onSubmit}>
      <label>
        Username
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          pattern="[A-Za-z0-9_]{3,24}"
          title="3–24 letters, numbers, or underscores"
          required
        />
      </label>
      <label>
        Display name
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={40}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Forest name <span className="optional">(optional)</span>
        <input
          value={forestName}
          onChange={(e) => setForestName(e.target.value)}
          placeholder="Mossglen, Fernhollow…"
          maxLength={60}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </label>

      <fieldset className="village-picker">
        <legend>Choose your village</legend>
        <p className="village-picker-lead">
          Your home shapes the colors, mascot, and spirit of your WhimPost life.
        </p>
        <div className="village-picker-grid">
          {VILLAGES.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`village-card ${villageId === v.id ? "selected" : ""}`}
              style={
                {
                  "--village-color": v.color,
                  "--village-soft": v.colorSoft,
                } as React.CSSProperties
              }
              onClick={() => setVillageId(v.id)}
            >
              <VillageMascot village={v} size="md" />
              <strong>{v.name}</strong>
              <em>{v.motto}</em>
              <span className="village-belongs">{v.belongs.slice(0, 2).join(" · ")}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="btn-primary"
        disabled={loading || !villageId}
      >
        {loading ? "Planting your mailbox…" : "Move into my village"}
      </button>
      <p className="auth-switch">
        Already have a mailbox? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
