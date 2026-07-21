"use client";

import { useEffect, useState } from "react";
import { LetterBodyText } from "@/components/LetterBodyText";
import type { VillageId } from "@/lib/villages";

type TemplateEdit = {
  villageId: VillageId;
  subject: string;
  body: string;
  isCustom: boolean;
  updatedAt: string | null;
};

type VillageOption = { id: VillageId; name: string };

export function WelcomeLetterEditor({
  initialVillageId,
}: {
  initialVillageId: VillageId;
}) {
  const [open, setOpen] = useState(false);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [villageId, setVillageId] = useState<VillageId>(initialVillageId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function load(nextVillage: VillageId = villageId) {
    setLoading(true);
    setError("");
    setStatus("");
    const res = await fetch(
      `/api/village/welcome-letter?villageId=${encodeURIComponent(nextVillage)}`
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load welcome letter");
      return;
    }
    const template = data.template as TemplateEdit;
    setVillages(data.villages || []);
    setVillageId(template.villageId);
    setSubject(template.subject);
    setBody(template.body);
    setIsCustom(template.isCustom);
    setUpdatedAt(template.updatedAt);
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load(initialVillageId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialVillageId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    const res = await fetch("/api/village/welcome-letter", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villageId, subject, body }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    const template = data.template as TemplateEdit;
    setIsCustom(template.isCustom);
    setUpdatedAt(template.updatedAt);
    setStatus("Saved — welcome letters for this village now use your edit.");
  }

  async function resetToDefault() {
    if (
      !window.confirm(
        "Restore the original welcome letter for this village? Your custom edit will be removed."
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setStatus("");
    const res = await fetch(
      `/api/village/welcome-letter?villageId=${encodeURIComponent(villageId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not reset");
      return;
    }
    const template = data.template as TemplateEdit;
    setSubject(template.subject);
    setBody(template.body);
    setIsCustom(template.isCustom);
    setUpdatedAt(template.updatedAt);
    setStatus("Restored the original welcome letter.");
  }

  return (
    <section className="village-panel welcome-editor-panel">
      <h2>✉ Owner · Welcome letters</h2>
      <p className="section-lead">
        As site owner, you can rewrite each village&apos;s welcome letter. Changes
        apply to new arrivals and update letters already delivered.
      </p>

      {!open ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOpen(true)}
        >
          Edit welcome letters
        </button>
      ) : (
        <form className="welcome-editor-form" onSubmit={save}>
          <label>
            Village
            <select
              value={villageId}
              onChange={(e) => {
                const next = e.target.value as VillageId;
                setVillageId(next);
                load(next);
              }}
              disabled={loading || saving}
            >
              {(villages.length
                ? villages
                : [{ id: initialVillageId, name: initialVillageId }]
              ).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>

          <p className="welcome-editor-meta">
            {loading
              ? "Loading…"
              : isCustom
                ? `Custom edit${updatedAt ? ` · last saved ${updatedAt}` : ""}`
                : "Using the original forest draft"}
          </p>

          <label>
            Subject
            <input
              className="welcome-typewriter-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              required
              disabled={loading || saving}
            />
          </label>

          <label>
            Letter body
            <textarea
              className="welcome-typewriter-field"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              maxLength={12000}
              required
              disabled={loading || saving}
              spellCheck
            />
          </label>

          <p className="welcome-editor-hint">
            Tip: use <code>**bold**</code>, <code>*italic*</code>, list lines with{" "}
            <code>* </code>, and collectible icons with{" "}
            <code>![Name](/stickers/collectibles/...)</code>.
          </p>

          <div className="welcome-editor-actions">
            <button type="submit" className="btn-primary" disabled={saving || loading}>
              {saving ? "Saving…" : "Save welcome letter"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving || loading || !isCustom}
              onClick={resetToDefault}
            >
              Restore original
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Hide preview" : "Preview"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          {error && <p className="form-error">{error}</p>}
          {status && <p className="welcome-editor-status">{status}</p>}

          {showPreview ? (
            <div className="welcome-editor-preview letter-paper paper-cream welcome-typewriter">
              <h3>{subject || "Untitled welcome"}</h3>
              <LetterBodyText body={body || " "} />
            </div>
          ) : null}
        </form>
      )}
    </section>
  );
}
