"use client";

// ============================================================
// SCENE 4 ACTIVITY: "You sort the leaves"
// ------------------------------------------------------------
// 6 leaves ride the conveyor belt, one at a time. For each one
// the audience presses 🌿 Healthy or 🍂 Sick. Mama checks it,
// the leaf drops into the right basket, and it appears as a dot
// on Tumaini's screen (green = healthy, brown = sick).
// These sorted leaves are the EXAMPLES Tumaini learns from next.
// "Next" unlocks after all 6 leaves are sorted.
//
// Each leaf goes through stages, moved on by timers:
//   arriving → resting (wait for an answer) → Mama checks →
//   drops into a basket → the next leaf arrives
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import Mama from "../characters/Mama";
import SpeechBubble, { usePrefersReducedMotion } from "../components/SpeechBubble";
import Conveyor, { type BeltStage } from "./Conveyor";
import LeafChart, { LeafChartKey, type ChartDot } from "./LeafChart";
import { TRAINING_LEAVES } from "./content";
import type { LeafData } from "./leafMath";

const TOTAL = TRAINING_LEAVES.length;

/** What Mama says after checking the audience's answer. */
function mamaCheck(leaf: LeafData, saidSick: boolean): string {
  const right = saidSick === leaf.sick;
  if (leaf.sick) return right ? "Yes, that one is sick. See the spots?" : "Look closely, that one is sick: see the spots?";
  return right ? "Yes, that one is healthy." : "Look again, that one is healthy: fresh and green.";
}

export default function LeafSorter({ done, onComplete, onSpeech }: ActivityProps) {
  const reduced = usePrefersReducedMotion();
  // If we come back with Back, show everything already sorted (score unknown).
  const [index, setIndex] = useState(done ? TOTAL : 0); // which leaf is on the belt
  const [stage, setStage] = useState<BeltStage>("arriving");
  const [answers, setAnswers] = useState<boolean[]>(done ? TRAINING_LEAVES.map((l) => l.sick) : []); // what the audience said: true = sick
  const restored = done;

  const finished = index >= TOTAL;
  const leaf = finished ? null : TRAINING_LEAVES[index];
  const answered = answers.length > index; // has the leaf on the belt been answered?

  // Timings (ms). Shorter when "reduce motion" is on.
  const T = reduced ? { arrive: 100, check: 1400, drop: 100 } : { arrive: 900, check: 1800, drop: 700 };

  // ---------- The stages, moved on by timers ----------
  useEffect(() => {
    if (finished) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (stage === "arriving") {
      timer = setTimeout(() => setStage("resting"), T.arrive);
    } else if (stage === "resting" && answered && leaf) {
      // Mama has checked it: drop it into the basket it really belongs in.
      timer = setTimeout(() => setStage(leaf.sick ? "to-sick" : "to-healthy"), T.check);
    } else if (stage === "to-sick" || stage === "to-healthy") {
      timer = setTimeout(() => {
        setIndex((i) => i + 1);
        setStage("arriving");
      }, T.drop);
    }
    // Clean-up: cancel the timer if things change or we leave
    return () => clearTimeout(timer);
  }, [stage, answered, finished, leaf, T.arrive, T.check, T.drop]);

  useEffect(() => {
    if (finished) onComplete();
  }, [finished, onComplete]);

  const choose = (saidSick: boolean) => {
    if (stage !== "resting" || answered || finished) return;
    setAnswers((a) => [...a, saidSick]);
  };

  // ---------- Words ----------
  const correct = answers.filter((saidSick, i) => saidSick === TRAINING_LEAVES[i].sick).length;
  const mamaText = finished
    ? "All sorted! Now Tumaini has examples to learn from."
    : answered && leaf
      ? mamaCheck(leaf, answers[index])
      : `Leaf ${index + 1} of ${TOTAL}. Is it healthy or sick?`;

  useEffect(() => {
    onSpeech(mamaText);
  }, [mamaText, onSpeech]);

  // Every answered leaf is a dot on Tumaini's screen, coloured by the TRUE answer.
  const dots: ChartDot[] = answers.map((_, i) => ({
    key: `t${i}`,
    spots: TRAINING_LEAVES[i].spots,
    yellowness: TRAINING_LEAVES[i].yellowness,
    sick: TRAINING_LEAVES[i].sick,
    current: i === index && !finished,
  }));

  const sortedSoFar = TRAINING_LEAVES.slice(0, index);
  const badge = answered && leaf ? (answers[index] === leaf.sick ? "✅" : "❌") : null;

  return (
    <div className="tm-activity">
      <div className="tm-leaf-layout">
        {/* ---------- The belt, the buttons and Mama ---------- */}
        <div className="tm-leaf-side">
          {finished ? (
            <p className="tm-all-sorted">All {TOTAL} leaves sorted! ✔</p>
          ) : (
            <Conveyor
              leaf={leaf}
              leafKey={`train-${index}`}
              stage={stage}
              badge={badge}
              healthyCount={sortedSoFar.filter((l) => !l.sick).length}
              sickCount={sortedSoFar.filter((l) => l.sick).length}
            />
          )}

          {!finished && (
            <div className={`tm-sort-buttons ${answers.length === 0 ? "tm-attention-group" : ""}`}>
              <button type="button" className="tm-sort-button tm-sort-healthy" onClick={() => choose(false)} disabled={stage !== "resting" || answered}>
                🌿 Healthy
              </button>
              <button type="button" className="tm-sort-button tm-sort-sick" onClick={() => choose(true)} disabled={stage !== "resting" || answered}>
                🍂 Sick
              </button>
            </div>
          )}

          <div className="tm-feedback">
            <Mama mood={badge === "❌" ? "worried" : badge === "✅" || finished ? "proud" : "curious"} size={80} />
            <SpeechBubble text={mamaText} name="Mama Akinyi" small instant />
          </div>
        </div>

        {/* ---------- Tumaini's screen ---------- */}
        <div className="tm-graph-box">
          <p className="tm-graph-title">Tumaini&apos;s screen: the leaves you sorted</p>
          <LeafChart dots={dots} label={`Chart with ${dots.length} sorted leaves.`} />
          <LeafChartKey />
          {!restored && answers.length > 0 && (
            <p className="tm-formula" aria-live="polite">
              You: <strong>{correct}</strong> of {answers.length} correct
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
