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
  const [signedIn, setSignedIn] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSignedIn(false);
    const form = e.currentTarget as HTMLFormElement;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ login, password }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        user?: { displayName?: string };
      } | null;
      if (!res.ok) {
        setError(data?.error || "Could not sign in");
        setLoading(false);
        return;
      }

      // Confirm the browser actually stored the session before navigating.
      // Retry once — some preview hosts settle the Set-Cookie a tick late.
      const confirmSession = async () => {
        const me = await fetch("/api/auth/me", { credentials: "same-origin" });
        const meData = (await me.json().catch(() => null)) as {
          user?: { id?: string };
        } | null;
        return Boolean(me.ok && meData?.user?.id);
      };

      if (await confirmSession()) {
        setSignedIn(true);
        window.location.replace("/village");
        return;
      }
      await new Promise((r) => setTimeout(r, 120));
      if (await confirmSession()) {
        setSignedIn(true);
        window.location.replace("/village");
        return;
      }

      // Last resort: classic form POST (HTML redirect) so the browser
      // stores the cookie during a top-level navigation.
      setSignedIn(true);
      form.submit();
    } catch {
      setError("Could not reach the forest post. Try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <form
      className="auth-form"
      action="/api/auth/login"
      method="post"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="next" value="/village" />
      <label>
        Username, display name, or email
        <input
          name="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          required
          disabled={loading || signedIn}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={loading || signedIn}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {signedIn && (
        <p className="form-success" role="status">
          Signed in — opening your village…
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={loading || signedIn}>
        {signedIn
          ? "Heading to your village…"
          : loading
            ? "Opening mailbox…"
            : "Enter the forest post"}
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
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          displayName,
          email,
          password,
          forestName,
          villageId,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error || "Could not create mailbox");
        setLoading(false);
        return;
      }
      window.location.replace("/village");
    } catch {
      setError("Could not reach the forest post. Try again in a moment.");
      setLoading(false);
    }
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
          <strong>{displayName || username}</strong>. That becomes your{" "}
          <strong>home village</strong> — you can visit others or retake the
          quiz later without losing your belonging.
        </p>
        {error && <p className="form-error">{error}</p>}
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={createMailbox}
        >
          {loading ? "Planting your mailbox…" : "Make this my home"}
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
