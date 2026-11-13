"use client";

// ============================================================
// CHOICE  (a reusable "What would you do?" exercise)
// ------------------------------------------------------------
// A short situation and 2–4 choices. The audience taps one and
// sees what happens. A weaker choice explains why, and they can
// try another. "Next" unlocks once they find the best choice.
// Calm on purpose: no animation.
//
// The situation and choices are data (see part2/content.ts):
//   "late-rains-choice": makeChoice(LATE_RAINS)   (in registry.tsx)
// ============================================================

import { useEffect, useState, type ComponentType } from "react";
import type { ActivityProps } from "./registry";

export interface ChoiceOption {
  icon: string;
  text: string;
  /** What happens if you choose this */
  result: string;
  /** true = the best choice (unlocks "Next") */
  best?: boolean;
}

export interface ChoiceConfig {
  situation: string;
  options: ChoiceOption[];
}

export function makeChoice(config: ChoiceConfig): ComponentType<ActivityProps> {
  const { situation, options } = config;
  const bestIndex = options.findIndex((o) => o.best);

  function Choice({ done, onComplete, onSpeech }: ActivityProps) {
    const [picked, setPicked] = useState<number | null>(done ? bestIndex : null);
    const option = picked === null ? null : options[picked];

    useEffect(() => {
      onSpeech(option ? option.result : situation);
      if (option?.best) onComplete();
    }, [option, onComplete, onSpeech]);

    return (
      <div className="tm-choice">
        <p className="tm-choice-situation">{situation}</p>
        <div className="tm-choice-options">
          {options.map((o, i) => (
            <button
              key={o.text}
              type="button"
              className={`tm-choice-option ${picked === i ? (o.best ? "is-best" : "is-weak") : ""}`}
              onClick={() => setPicked(i)}
              aria-pressed={picked === i}
            >
              <span className="tm-choice-icon" aria-hidden="true">{o.icon}</span>
              <span>{o.text}</span>
            </button>
          ))}
        </div>
        <p className={`tm-choice-result ${option ? (option.best ? "is-best" : "is-weak") : ""}`} aria-live="polite">
          {option ? `${option.best ? "✔ " : "✖ "}${option.result}${option.best ? "" : " Try another choice."}` : ""}
        </p>
      </div>
    );
  }
  return Choice;
}
