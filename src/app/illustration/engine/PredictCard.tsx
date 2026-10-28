"use client";

// ============================================================
// PREDICT CARD  ("What do YOU think?")
// ------------------------------------------------------------
// Before Tumaini learns something, the audience makes a guess.
// There is no wrong answer: any choice unlocks "Next", and
// Tumaini says "Let's find out!". Guessing first makes people
// curious about the answer, so they watch the next part closely.
// ============================================================

import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import type { PredictOption } from "../types";

interface PredictCardProps {
  options: PredictOption[];
  /** What Tumaini says after the guess (default: "Let's find out!") */
  reply?: string;
  /** The option already chosen (e.g. after pressing Back) */
  chosen?: number;
  onChoose: (index: number) => void;
}

export default function PredictCard({ options, reply = "Let's find out!", chosen, onChoose }: PredictCardProps) {
  const picked = chosen !== undefined ? options[chosen] : null;
  return (
    <div className="tm-predict">
      <p className="tm-predict-label">🤔 What do YOU think?</p>
      <div className={`tm-predict-options ${picked ? "" : "tm-attention-group"}`}>
        {options.map((option, i) => (
          <button
            key={option.text}
            type="button"
            className={`tm-predict-option ${chosen === i ? "is-chosen" : ""} ${picked && chosen !== i ? "is-other" : ""}`}
            onClick={() => onChoose(i)}
            aria-pressed={chosen === i}
          >
            {option.emoji && (
              <span className="tm-predict-emoji" aria-hidden="true">
                {option.emoji}
              </span>
            )}
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      {picked && (
        <div className="tm-feedback">
          <Tumaini mood="excited" size={100} />
          <SpeechBubble key={chosen} text={`You think: "${picked.text}". ${reply}`} name="Tumaini" small />
        </div>
      )}
    </div>
  );
}
