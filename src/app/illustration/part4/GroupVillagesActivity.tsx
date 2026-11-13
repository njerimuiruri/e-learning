"use client";

// ============================================================
// TASK 4: GROUP THE VILLAGES  (Part 4, clustering)
// ------------------------------------------------------------
// Six villages, each with three clues. Put each one in a group:
// "High risk" or "Lower risk". When all are placed, see how the
// AI grouped them (by finding villages with similar clues, with
// no answers given: unsupervised learning).
// "Next" unlocks once you have compared. No animation.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";

type Group = "high" | "low";

const VILLAGES: { name: string; clues: string[]; ai: Group }[] = [
  { name: "Riverbend", clues: ["Beside the river", "Low ground", "Flooded 3 times"], ai: "high" },
  { name: "Kilima", clues: ["Far from the river", "On a hill", "Never flooded"], ai: "low" },
  { name: "Mto Chini", clues: ["Beside the river", "Low ground", "Flooded twice"], ai: "high" },
  { name: "Soko", clues: ["Near the river", "High ground", "Flooded once, long ago"], ai: "low" },
  { name: "Bondeni", clues: ["Near the river", "Low ground", "Flooded 4 times"], ai: "high" },
  { name: "Mlimani", clues: ["Far from the river", "High ground", "Never flooded"], ai: "low" },
];

export default function GroupVillagesActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [groups, setGroups] = useState<(Group | null)[]>(done ? VILLAGES.map((v) => v.ai) : VILLAGES.map(() => null));
  const [revealed, setRevealed] = useState(done);
  const allPlaced = groups.every((g) => g !== null);
  const matches = groups.filter((g, i) => g === VILLAGES[i].ai).length;

  useEffect(() => {
    onSpeech(
      revealed
        ? `You matched the AI on ${matches} of ${VILLAGES.length} villages. The AI grouped them by similar clues, with no answers given.`
        : "Put each village in a group: high risk or lower risk.",
    );
    if (revealed) onComplete();
  }, [revealed, matches, onComplete, onSpeech]);

  const place = (i: number, g: Group) => {
    if (revealed) return;
    setGroups((gs) => gs.map((x, n) => (n === i ? g : x)));
  };

  return (
    <div className="tm-p4">
      <div className="tm-p4-villages">
        {VILLAGES.map((v, i) => {
          const mark = revealed ? (groups[i] === v.ai ? "is-match" : "is-miss") : "";
          return (
            <div key={v.name} className={`tm-p4-village ${mark}`}>
              <strong>{v.name}</strong>
              <ul>
                {v.clues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="tm-p4-village-buttons" role="group" aria-label={`Group for ${v.name}`}>
                <button type="button" className={groups[i] === "high" ? "is-high" : ""} aria-pressed={groups[i] === "high"} onClick={() => place(i, "high")}>
                  High risk
                </button>
                <button type="button" className={groups[i] === "low" ? "is-low" : ""} aria-pressed={groups[i] === "low"} onClick={() => place(i, "low")}>
                  Lower risk
                </button>
              </div>
              {revealed && <span className="tm-p4-village-ai">AI: {v.ai === "high" ? "High risk" : "Lower risk"}</span>}
            </div>
          );
        })}
      </div>

      {revealed ? (
        <p className="tm-choice-result is-best" aria-live="polite">
          ✔ You matched the AI on {matches} of {VILLAGES.length}. It found two groups by itself, from the clues alone.
        </p>
      ) : (
        <button type="button" className="tm-p4-ask-btn" disabled={!allPlaced} onClick={() => setRevealed(true)}>
          {allPlaced ? "🤖 See how the AI grouped them" : "Place every village first"}
        </button>
      )}
    </div>
  );
}
