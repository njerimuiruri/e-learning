"use client";

// ============================================================
// SCENE 4 ACTIVITY: "Let Tumaini learn"
// ------------------------------------------------------------
// Tumaini looks at the 6 leaves the audience sorted, then a
// dividing line draws itself across the chart:
//     spots ÷ 8 + yellowness = 0.85
// The sick side is shaded brown, the healthy side green.
// "Next" unlocks once the line has been drawn.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble, { usePrefersReducedMotion } from "../components/SpeechBubble";
import LeafChart, { LeafChartKey, type ChartDot } from "./LeafChart";
import { TRAINING_LEAVES } from "./content";

type Phase = "idle" | "thinking" | "drawn";

const WORDS: Record<Phase, { mood: TumainiMood; text: string }> = {
  idle: { mood: "happy", text: "Press the button, and I'll study the 6 leaves you sorted." },
  thinking: { mood: "thinking", text: "Hmm… green dots down here, brown dots up there…" },
  drawn: {
    mood: "happy",
    text: "I've drawn a line between healthy and sick. Leaves on this side look sick; leaves on that side look healthy!",
  },
};

const DOTS: ChartDot[] = TRAINING_LEAVES.map((leaf, i) => ({
  key: `t${i}`,
  spots: leaf.spots,
  yellowness: leaf.yellowness,
  sick: leaf.sick,
}));

export default function AILearns({ done, onComplete, onSpeech }: ActivityProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(done ? "drawn" : "idle");

  // Thinking takes a moment, then the line appears.
  useEffect(() => {
    if (phase !== "thinking") return;
    const timer = setTimeout(() => setPhase("drawn"), reduced ? 300 : 2000);
    return () => clearTimeout(timer);
  }, [phase, reduced]);

  useEffect(() => {
    if (phase === "drawn") onComplete();
  }, [phase, onComplete]);

  const { mood, text } = WORDS[phase];
  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  return (
    <div className="tm-activity">
      <div className="tm-leaf-layout">
        <div className="tm-leaf-side tm-learn-side">
          <div className={phase === "thinking" ? "tm-thinking-hard" : ""}>
            <Tumaini mood={mood} size={170} />
          </div>
          <SpeechBubble text={text} name="Tumaini" tail="top" small />
          <button
            type="button"
            className={`tm-button tm-button-big ${phase === "idle" ? "tm-attention" : ""}`}
            onClick={() => setPhase("thinking")}
            disabled={phase !== "idle"}
          >
            🧠 Let Tumaini learn
          </button>
        </div>

        <div className="tm-graph-box">
          <p className="tm-graph-title">Tumaini&apos;s screen</p>
          <LeafChart
            dots={DOTS}
            showLine={phase === "drawn"}
            label={
              phase === "drawn"
                ? "Chart with 6 leaves and Tumaini's dividing line. Leaves with more spots and more yellow are on the sick side."
                : "Chart with the 6 leaves you sorted."
            }
          />
          <LeafChartKey />
          {phase === "drawn" && (
            <p className="tm-formula tm-pop-in-block">
              Sick side: <strong>spots ÷ 8 + yellowness</strong> is more than <strong>0.85</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
