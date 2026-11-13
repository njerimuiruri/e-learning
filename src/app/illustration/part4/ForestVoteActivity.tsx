"use client";

// ============================================================
// TASK 3: THE FOREST VOTES  (Part 4)
// ------------------------------------------------------------
// One household, five decision trees. Each tree looked at
// different data, so they don't all agree. Tap "Ask the forest":
// every tree shows its vote, and the majority wins. That is a
// random forest. "Next" unlocks after the vote. No animation.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";

const TREES = [
  { looked: "Rain forecast", vote: "Evacuate" },
  { looked: "River level", vote: "Evacuate" },
  { looked: "Soil wetness", vote: "Prepare" },
  { looked: "Past floods", vote: "Evacuate" },
  { looked: "Height of the land", vote: "Evacuate" },
] as const;

export default function ForestVoteActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [asked, setAsked] = useState(done);
  const evacuate = TREES.filter((t) => t.vote === "Evacuate").length;
  const result = `${evacuate} of ${TREES.length} trees say Evacuate, so the forest decides: Evacuate.`;

  useEffect(() => {
    onSpeech(asked ? result : "Five trees will each vote. Tap Ask the forest.");
    if (asked) onComplete();
  }, [asked, result, onComplete, onSpeech]);

  return (
    <div className="tm-p4">
      <p className="tm-choice-situation">A family lives near the river. Heavy rain is forecast. What should they do?</p>

      <div className="tm-p4-forest">
        {TREES.map((t, i) => (
          <div key={t.looked} className={`tm-p4-tree ${asked ? (t.vote === "Evacuate" ? "is-evacuate" : "is-prepare") : ""}`}>
            <span className="tm-p4-tree-icon" aria-hidden="true">🌳</span>
            <strong>Tree {i + 1}</strong>
            <span className="tm-p4-tree-looked">looked at: {t.looked}</span>
            <span className="tm-p4-tree-vote">{asked ? t.vote : "?"}</span>
          </div>
        ))}
      </div>

      {asked ? (
        <p className="tm-choice-result is-best" aria-live="polite">✔ {result}</p>
      ) : (
        <button type="button" className="tm-p4-ask-btn" onClick={() => setAsked(true)}>
          🌲 Ask the forest
        </button>
      )}
    </div>
  );
}
