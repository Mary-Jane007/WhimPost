"use client";

import { useState } from "react";
import Link from "next/link";
import { CharacterPicker } from "@/components/CharacterPicker";
import {
  defaultCharacterForVillage,
  parseVillagerCharacter,
  type VillagerCharacter,
} from "@/lib/villageCharacters";
import type { VillageId } from "@/lib/villages";

export function CharacterCustomizeClient({
  villageId,
  initialCharacterJson,
  username,
}: {
  villageId: VillageId;
  initialCharacterJson: string | null;
  username: string;
}) {
  const [character, setCharacter] = useState<VillagerCharacter>(
    () =>
      parseVillagerCharacter(initialCharacterJson, villageId) ||
      defaultCharacterForVillage(villageId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile/character", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ character }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "Could not save character");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
    } catch {
      setError("Could not reach the forest post.");
      setSaving(false);
    }
  }

  return (
    <div className="character-change-page">
      <CharacterPicker
        villageId={villageId}
        value={character}
        onChange={(next) => {
          setCharacter(next);
          setSaved(false);
        }}
        heading="Choose your village character"
      />
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? (
        <p className="form-success" role="status">
          Character saved — letters and your cottage now show this resident.
        </p>
      ) : null}
      <div className="character-customize-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save character"}
        </button>
        <Link href={`/profile/${username}`} className="btn-secondary">
          Back to cottage
        </Link>
      </div>
    </div>
  );
}
