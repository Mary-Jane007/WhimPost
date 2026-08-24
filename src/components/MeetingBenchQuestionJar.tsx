"use client";

import { useEffect, useMemo, useState } from "react";
import type { BenchItem } from "@/lib/meetingBench";
import {
  DEFAULT_POLL_OPTIONS,
  DEFAULT_QUESTION,
  findQuestionJarItem,
  pollOptionsFromItem,
} from "@/lib/meetingBenchScene";

const STORAGE_KEY = "whimpost.meeting-bench.question-jar";

type StoredAnswers = Record<string, string>;

function readAnswers(): StoredAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as StoredAnswers;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeAnswers(next: StoredAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function MeetingBenchQuestionJar({ items }: { items: BenchItem[] }) {
  const jarItem = useMemo(() => findQuestionJarItem(items), [items]);
  const jarKey = jarItem?.id || "default-jar";
  const question = jarItem?.title || DEFAULT_QUESTION;
  const options = jarItem
    ? pollOptionsFromItem(jarItem)
    : DEFAULT_POLL_OPTIONS;

  const [choice, setChoice] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const answers = readAnswers();
    const existing = answers[jarKey] || null;
    setSaved(existing);
    setChoice(existing || "");
    setStatus("");
  }, [jarKey]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!choice) {
      setStatus("Pick an answer first.");
      return;
    }
    const next = { ...readAnswers(), [jarKey]: choice };
    writeAnswers(next);
    setSaved(choice);
    setStatus("Tucked into the jar — thank you.");
  }

  return (
    <section className="mb-question-jar" aria-labelledby="mb-jar-title">
      <div className="mb-jar-visual" aria-hidden>
        <span className="mb-jar-glyph">🫙</span>
        <span className="mb-jar-glow" />
      </div>
      <div className="mb-jar-copy">
        <p className="mb-jar-kicker">Question jar</p>
        <h2 id="mb-jar-title">{question}</h2>
        <p className="mb-jar-lead">
          Drop a thought in the jar. The keeper reads these when tending the
          bench.
        </p>

        {saved ? (
          <p className="mb-jar-saved" role="status">
            Your note says: <strong>{saved}</strong>
          </p>
        ) : null}

        <form className="mb-jar-form" onSubmit={submit}>
          <fieldset>
            <legend className="sr-only">Choose an answer</legend>
            <ul className="mb-jar-options">
              {options.map((opt) => (
                <li key={opt}>
                  <label className={choice === opt ? "on" : ""}>
                    <input
                      type="radio"
                      name="jar-answer"
                      value={opt}
                      checked={choice === opt}
                      onChange={() => setChoice(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <button type="submit" className="btn-primary">
            {saved ? "Update answer" : "Submit answer"}
          </button>
          {status ? <p className="mb-jar-status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}
