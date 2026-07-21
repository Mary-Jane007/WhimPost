"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BELONGING_INTRO,
  BELONGING_QUESTIONS,
  BELONGING_RESULTS,
  BELONGING_TRAITS,
  scoreBelongingQuiz,
  type BelongingResult,
} from "@/lib/belongingQuiz";
import { getVillage, type VillageId } from "@/lib/villages";
import { VillageMascot } from "@/components/VillageMascot";

type Phase = "intro" | "questions" | "cinematic" | "result";

type CinematicBeat =
  | "fade"
  | "lantern"
  | "listened"
  | "path"
  | "sign"
  | "welcome";

const CINEMATIC_BEATS: { id: CinematicBeat; ms: number }[] = [
  { id: "fade", ms: 900 },
  { id: "lantern", ms: 1400 },
  { id: "listened", ms: 1800 },
  { id: "path", ms: 1800 },
  { id: "sign", ms: 2200 },
  { id: "welcome", ms: 1600 },
];

const PATH_SIGNS: Record<
  VillageId,
  { emoji: string; label: string; className: string }
> = {
  mosshollow: {
    emoji: "🍄",
    label: "Mushrooms glow along the roots",
    className: "path-mosshollow",
  },
  clovermeadow: {
    emoji: "🌼",
    label: "Flowers bloom beside the trail",
    className: "path-clovermeadow",
  },
  moonmere: {
    emoji: "🌙",
    label: "Lanterns appear over still water",
    className: "path-moonmere",
  },
  bramblewood: {
    emoji: "🦊",
    label: "Pawprints mark the leaves",
    className: "path-bramblewood",
  },
  hearthwick: {
    emoji: "🔥",
    label: "Smoke rises from a warm chimney",
    className: "path-hearthwick",
  },
};

export function DiscoverBelonging({
  displayName,
  onComplete,
}: {
  displayName: string;
  onComplete: (villageId: VillageId, result: BelongingResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<VillageId[]>([]);
  const [result, setResult] = useState<BelongingResult | null>(null);
  const [beat, setBeat] = useState<CinematicBeat>("fade");

  const question = BELONGING_QUESTIONS[index];
  const progress = Math.round((answers.length / BELONGING_QUESTIONS.length) * 100);
  const welcomeName = displayName.trim() || "traveler";

  useEffect(() => {
    if (phase !== "cinematic" || !result) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;

    const advance = () => {
      if (cancelled) return;
      const current = CINEMATIC_BEATS[i];
      setBeat(current.id);
      if (i >= CINEMATIC_BEATS.length - 1) {
        timer = setTimeout(() => {
          if (!cancelled) setPhase("result");
        }, current.ms);
        return;
      }
      timer = setTimeout(() => {
        i += 1;
        advance();
      }, current.ms);
    };

    advance();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, result]);

  function choose(villageId: VillageId) {
    const next = [...answers, villageId];
    setAnswers(next);
    if (next.length >= BELONGING_QUESTIONS.length) {
      const scored = scoreBelongingQuiz(next);
      setResult(scored.result);
      setPhase("cinematic");
      return;
    }
    setIndex((n) => n + 1);
  }

  function finish() {
    if (!result) return;
    onComplete(result.villageId, result);
  }

  return (
    <div className="belonging-quiz">
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.section
            key="intro"
            className="belonging-intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
          >
            <p className="belonging-kicker">Discover your belonging</p>
            <h2>The forest is listening</h2>
            <p className="belonging-lead">{BELONGING_INTRO}</p>
            <ul className="belonging-traits" aria-label="Village spirits">
              {Object.entries(BELONGING_TRAITS).map(([id, trait]) => (
                <li key={id}>
                  <span aria-hidden>{trait.emoji}</span>
                  <strong>{trait.label}</strong>
                  <em>{trait.traits}</em>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setPhase("questions")}
            >
              Follow the lanterns
            </button>
          </motion.section>
        ) : null}

        {phase === "questions" && question ? (
          <motion.section
            key={`q-${question.id}`}
            className="belonging-question"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            <div className="belonging-progress" aria-hidden>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="belonging-kicker">
              Question {question.id} of {BELONGING_QUESTIONS.length}
            </p>
            <h2>{question.prompt}</h2>
            <div className="belonging-options">
              {question.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className="belonging-option"
                  onClick={() => choose(opt.villageId)}
                >
                  <span className="belonging-option-key">{opt.key}</span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          </motion.section>
        ) : null}

        {phase === "cinematic" && result ? (
          <motion.section
            key="cinematic"
            className={`belonging-cinematic ${PATH_SIGNS[result.villageId].className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="belonging-cinema-stage" aria-live="polite">
              <AnimatePresence mode="wait">
                {beat === "fade" ? (
                  <motion.p
                    key="fade"
                    className="cinema-line muted-line"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    The lanterns dim…
                  </motion.p>
                ) : null}
                {beat === "lantern" ? (
                  <motion.div
                    key="lantern"
                    className="cinema-lantern"
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.7 }}
                  >
                    <span aria-hidden>🏮</span>
                    <p>A lantern lifts from the moss.</p>
                  </motion.div>
                ) : null}
                {beat === "listened" ? (
                  <motion.p
                    key="listened"
                    className="cinema-line"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    The villages have listened…
                  </motion.p>
                ) : null}
                {beat === "path" ? (
                  <motion.p
                    key="path"
                    className="cinema-line"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    A path begins glowing beneath your feet.
                  </motion.p>
                ) : null}
                {beat === "sign" ? (
                  <motion.div
                    key="sign"
                    className="cinema-path-sign"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65 }}
                  >
                    <span className="cinema-path-emoji" aria-hidden>
                      {PATH_SIGNS[result.villageId].emoji}
                    </span>
                    <p>{PATH_SIGNS[result.villageId].label}</p>
                    <div className="cinema-path-glow" aria-hidden />
                  </motion.div>
                ) : null}
                {beat === "welcome" ? (
                  <motion.p
                    key="welcome"
                    className="cinema-welcome"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Welcome home, {welcomeName}.
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.section>
        ) : null}

        {phase === "result" && result ? (
          <motion.section
            key="result"
            className="belonging-result"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="belonging-kicker">Your belonging</p>
            <div className="belonging-result-hero">
              <VillageMascot
                village={getVillage(result.villageId)!}
                size="lg"
              />
              <h2>
                <span aria-hidden>
                  {BELONGING_TRAITS[result.villageId].emoji}{" "}
                </span>
                {result.title}
              </h2>
            </div>
            <p className="belonging-result-blurb">“{result.blurb}”</p>
            <dl className="belonging-result-meta">
              <div>
                <dt>Your village</dt>
                <dd>{BELONGING_TRAITS[result.villageId].label}</dd>
              </div>
              <div>
                <dt>Your companion</dt>
                <dd>
                  <span aria-hidden>{result.companionEmoji} </span>
                  {result.companion}
                </dd>
              </div>
              <div>
                <dt>Your first quest</dt>
                <dd>{result.firstQuest}</dd>
              </div>
            </dl>
            <p className="belonging-result-note">
              You can change villages later from your village page — but this is
              where your story begins.
            </p>
            <button type="button" className="btn-primary" onClick={finish}>
              Settle in {BELONGING_TRAITS[result.villageId].label}
            </button>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
