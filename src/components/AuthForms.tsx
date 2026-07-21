"use client";

import { useState } from "react";
import Link from "next/link";
import type { VillageId } from "@/lib/villages";
import type { BelongingResult } from "@/lib/belongingQuiz";
import { BELONGING_TRAITS } from "@/lib/belongingQuiz";
import { DiscoverBelonging } from "@/components/DiscoverBelonging";

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
        Username or email
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

type RegisterStep = "account" | "belonging" | "confirm";

export function RegisterForm() {
  const [step, setStep] = useState<RegisterStep>("account");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [forestName, setForestName] = useState("");
  const [password, setPassword] = useState("");
  const [villageId, setVillageId] = useState<VillageId | "">("");
  const [belonging, setBelonging] = useState<BelongingResult | null>(null);
  const [quizKey, setQuizKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function continueToBelonging(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().length < 3) {
      setError("Choose a username of at least 3 characters");
      return;
    }
    if (displayName.trim().length < 2) {
      setError("Add a display name");
      return;
    }
    if (!email.includes("@")) {
      setError("Add a valid email");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters");
      return;
    }
    setStep("belonging");
  }

  function onBelongingComplete(id: VillageId, result: BelongingResult) {
    setVillageId(id);
    setBelonging(result);
    setStep("confirm");
  }

  function retakeBelonging() {
    setVillageId("");
    setBelonging(null);
    setQuizKey((k) => k + 1);
    setStep("belonging");
  }

  async function createMailbox() {
    if (!villageId) {
      setError("Discover your belonging before settling in");
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

  if (step === "belonging") {
    return (
      <div className="auth-form register-wide belonging-step">
        <DiscoverBelonging
          key={quizKey}
          displayName={displayName || username}
          onComplete={onBelongingComplete}
        />
        <p className="auth-switch">
          <button
            type="button"
            className="linkish"
            onClick={() => setStep("account")}
          >
            ← Back to mailbox details
          </button>
        </p>
      </div>
    );
  }

  if (step === "confirm" && belonging && villageId) {
    const trait = BELONGING_TRAITS[villageId];
    return (
      <div className="auth-form register-wide belonging-confirm">
        <p className="belonging-kicker">Ready to settle</p>
        <h2>
          <span aria-hidden>{trait.emoji} </span>
          {trait.label} is waiting
        </h2>
        <p className="belonging-lead">
          Your mailbox will open in <strong>{trait.label}</strong> as{" "}
          <strong>{displayName || username}</strong>. You can change villages
          later whenever the path calls.
        </p>
        {error && <p className="form-error">{error}</p>}
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={createMailbox}
        >
          {loading ? "Planting your mailbox…" : "Move into my village"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={retakeBelonging}
        >
          Retake Discover your belonging
        </button>
        <p className="auth-switch">
          Already have a mailbox? <Link href="/login">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form register-wide" onSubmit={continueToBelonging}>
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

      <div className="belonging-account-cue">
        <p className="belonging-kicker">Next</p>
        <p>
          After your mailbox details, you&apos;ll{" "}
          <strong>Discover your belonging</strong> — a short path of twelve
          questions that chooses your village.
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary">
        Continue to Discover your belonging
      </button>
      <p className="auth-switch">
        Already have a mailbox? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
