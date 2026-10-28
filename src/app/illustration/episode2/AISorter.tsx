"use client";

// ============================================================
// SCENE 4 ACTIVITY: "Tumaini sorts the rest"
// ------------------------------------------------------------
// 8 new leaves ride the belt. For each one, Tumaini:
//   1. puts its dot on the chart,
//   2. decides healthy or sick by which side of the line it is on,
//   3. says how sure it is (e.g. "92% sure: sick"),
//   4. drops it into a basket,
// and then Mama checks it: ✅ or ❌.
//
// The leaf [3 spots, 0.45 yellow] sits right next to the line.
// Tumaini says "healthy" (only 55% sure) but it is really sick.
// Tumaini PAUSES after that mistake so the group can talk about
// it, then "Continue" carries on. Final score: 7 of 8.
// "Next" unlocks after all 8 leaves are sorted.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble, { usePrefersReducedMotion } from "../components/SpeechBubble";
import Conveyor, { type BeltStage } from "./Conveyor";
import LeafChart, { LeafChartKey, type ChartDot } from "./LeafChart";
import { TEST_LEAVES, TRAINING_LEAVES } from "./content";
import { confidencePercent, leafScore, looksSick, type LeafData } from "./leafMath";

const TOTAL = TEST_LEAVES.length;

type Stage = "idle" | "arriving" | "deciding" | "checking" | "dropping";

/** Tumaini's decision about one leaf. */
function decide(leaf: LeafData) {
  const saysSick = looksSick(leaf);
  return {
    saysSick,
    percent: confidencePercent(leafScore(leaf)),
    label: saysSick ? "sick" : "healthy",
    correct: saysSick === leaf.sick,
  };
}

const DECISIONS = TEST_LEAVES.map(decide);
const FINAL_CORRECT = DECISIONS.filter((d) => d.correct).length;

const TRAINING_DOTS: ChartDot[] = TRAINING_LEAVES.map((leaf, i) => ({
  key: `t${i}`,
  spots: leaf.spots,
  yellowness: leaf.yellowness,
  sick: leaf.sick,
}));

export default function AISorter({ done, onComplete, onSpeech }: ActivityProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(done ? TOTAL : 0);
  const [stage, setStage] = useState<Stage>("idle");
  const [running, setRunning] = useState(false);

  const finished = index >= TOTAL;
  const leaf = finished ? null : TEST_LEAVES[index];
  const decision = finished ? null : DECISIONS[index];

  // Timings (ms) for each stage of one leaf
  const T = reduced
    ? { arrive: 150, decide: 1600, check: 1500, drop: 150 }
    : { arrive: 800, decide: 1500, check: 1400, drop: 650 };

  // ---------- The stages, moved on by timers while running ----------
  useEffect(() => {
    if (!running || finished || !decision) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (stage === "arriving") timer = setTimeout(() => setStage("deciding"), T.arrive);
    if (stage === "deciding") timer = setTimeout(() => setStage("checking"), T.decide);
    if (stage === "checking") {
      timer = setTimeout(() => {
        if (!decision.correct) {
          // A mistake! Pause here so everyone can talk about it.
          setRunning(false);
          setStage("dropping");
        } else {
          setStage("dropping");
        }
      }, T.check);
    }
    if (stage === "dropping") {
      timer = setTimeout(() => {
        setIndex((i) => i + 1);
        setStage("arriving");
      }, T.drop);
    }
    return () => clearTimeout(timer);
  }, [running, stage, finished, decision, T.arrive, T.decide, T.check, T.drop]);

  useEffect(() => {
    if (finished) {
      setRunning(false);
      onComplete();
    }
  }, [finished, onComplete]);

  // ---------- What Tumaini says ----------
  const pausedOnMistake = !running && stage === "dropping" && decision !== null && !decision.correct;
  let mood: TumainiMood = "happy";
  let text = "Press Start, and I'll sort 8 new leaves all by myself!";
  if (finished) {
    mood = "excited";
    text = `I sorted all ${TOTAL} leaves! I got ${FINAL_CORRECT} of ${TOTAL} correct.`;
  } else if (decision && (pausedOnMistake || (stage === "checking" && !decision.correct))) {
    mood = "unsure";
    text = "Oops! That one was very close to my line. I wasn't sure, and I got it wrong.";
  } else if (decision && (stage === "deciding" || stage === "checking" || stage === "dropping")) {
    mood = decision.percent < 70 ? "unsure" : "happy";
    text = `${decision.percent}% sure: ${decision.label}.${stage !== "deciding" ? " ✅ Mama says I'm right!" : ""}`;
  } else if (stage === "arriving") {
    mood = "thinking";
    text = "Here comes a new leaf…";
  }

  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  // ---------- The chart: training dots, then Tumaini's sorted leaves ----------
  const shown = stage === "deciding" || stage === "checking" || stage === "dropping";
  const sortedCount = index + (shown && !finished ? 1 : 0);
  const aiDots: ChartDot[] = TEST_LEAVES.slice(0, sortedCount).map((l, i) => {
    const checked = i < index || stage === "checking" || stage === "dropping";
    return {
      key: `ai${i}`,
      spots: l.spots,
      yellowness: l.yellowness,
      sick: DECISIONS[i].saysSick, // coloured by what TUMAINI decided
      sortedByAI: true,
      wrong: checked && !DECISIONS[i].correct,
      current: i === index && !finished,
    };
  });

  // ---------- Belt and baskets ----------
  const sorted = DECISIONS.slice(0, index); // leaves already in a basket
  // The belt: slide in, wait while Tumaini decides and Mama checks, then drop
  // into the basket TUMAINI chose (paused on a mistake = the leaf waits).
  let beltStage: BeltStage = "resting";
  if (stage === "arriving") beltStage = "arriving";
  if (stage === "dropping" && running) beltStage = decision?.saysSick ? "to-sick" : "to-healthy";
  const badge = decision && (stage === "checking" || stage === "dropping") ? (decision.correct ? "✅" : "❌") : null;
  const correctSoFar = sorted.filter((d) => d.correct).length;
  const checkedSoFar = index;

  const start = () => {
    setStage("arriving");
    setRunning(true);
  };
  const sortAll = () => {
    setRunning(false);
    setIndex(TOTAL);
  };

  return (
    <div className="tm-activity">
      <div className="tm-leaf-layout">
        {/* ---------- The belt and Tumaini ---------- */}
        <div className="tm-leaf-side">
          {finished ? (
            <p className="tm-all-sorted">
              Tumaini: {FINAL_CORRECT} of {TOTAL} correct ✔
            </p>
          ) : (
            <Conveyor
              leaf={leaf}
              leafKey={`test-${index}`}
              stage={beltStage}
              badge={badge}
              healthyCount={sorted.filter((d) => !d.saysSick).length}
              sickCount={sorted.filter((d) => d.saysSick).length}
            />
          )}

          {/* How sure is Tumaini? */}
          {decision && shown && (
            <div className="tm-sure">
              <span className="tm-sure-label">How sure?</span>
              <div className="tm-sure-track" role="img" aria-label={`${decision.percent} percent sure`}>
                <div className={`tm-sure-fill ${decision.percent < 70 ? "is-low" : ""}`} style={{ width: `${decision.percent}%` }} />
              </div>
              <span className="tm-sure-value">{decision.percent}%</span>
            </div>
          )}

          <div className="tm-feedback">
            <Tumaini mood={mood} size={110} />
            <SpeechBubble text={text} name="Tumaini" small instant />
          </div>

          {pausedOnMistake && (
            <p className="tm-pause-note">⏸ Paused. Why do you think Tumaini got this one wrong?</p>
          )}
        </div>

        {/* ---------- Tumaini's screen ---------- */}
        <div className="tm-graph-box">
          <p className="tm-graph-title">Tumaini&apos;s screen</p>
          <LeafChart dots={[...TRAINING_DOTS, ...aiDots]} showLine label={`Chart with Tumaini's dividing line and ${aiDots.length} leaves sorted by Tumaini.`} />
          <LeafChartKey withAI />
          {(checkedSoFar > 0 || finished) && (
            <p className="tm-formula" aria-live="polite">
              Tumaini: <strong>{finished ? FINAL_CORRECT : correctSoFar}</strong> of {finished ? TOTAL : checkedSoFar} correct
            </p>
          )}
        </div>
      </div>

      {/* ---------- Buttons ---------- */}
      {!finished && (
        <div className="tm-activity-controls">
          <span className="tm-counter">
            <p>
              Leaves sorted: <strong>{index}</strong> of {TOTAL}
            </p>
          </span>
          <div className="tm-activity-buttons">
            {stage === "idle" ? (
              <button type="button" className="tm-button tm-button-big tm-attention" onClick={start}>
                ▶ Start sorting
              </button>
            ) : running ? (
              <button type="button" className="tm-button tm-button-big" onClick={() => setRunning(false)}>
                ⏸ Pause
              </button>
            ) : (
              <button type="button" className={`tm-button tm-button-big ${pausedOnMistake ? "tm-attention" : ""}`} onClick={() => setRunning(true)}>
                ▶ Continue
              </button>
            )}
            <button type="button" className="tm-button tm-button-secondary" onClick={sortAll}>
              ⏩ Sort all at once
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
