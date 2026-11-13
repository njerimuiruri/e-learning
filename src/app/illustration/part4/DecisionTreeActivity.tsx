"use client";

// ============================================================
// TASK 2: WALK THE DECISION TREE  (Part 4)
// ------------------------------------------------------------
// Answer up to 3 yes/no questions about a household and reach a
// decision: safe / prepare / evacuate. The path you took stays
// on screen, so you can see how the tree decided.
// "Next" unlocks when you reach a decision. No animation.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";

type Node =
  | { question: string; yes: string; no: string }
  | { decision: string; icon: string; why: string };

const TREE: Record<string, Node> = {
  start: { question: "Is the river forecast to rise above 3 m?", yes: "low", no: "safe" },
  low: { question: "Is the home on low ground near the river?", yes: "help", no: "prepare" },
  help: { question: "Does someone need help to move (a child, an older person, someone with a disability)?", yes: "evacuateHelp", no: "evacuate" },
  safe: { decision: "Safe: keep watching the forecast", icon: "✅", why: "The river is not expected to pass the danger line." },
  prepare: { decision: "Prepare: pack essentials and be ready to move", icon: "🎒", why: "The river may rise, but the home is on higher ground." },
  evacuate: { decision: "Evacuate now to higher ground", icon: "🏃", why: "High water is coming and the home is in the flood zone." },
  evacuateHelp: { decision: "Evacuate now, and get help early", icon: "🤝", why: "Move first, because it takes longer when someone needs help." },
};

export default function DecisionTreeActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [path, setPath] = useState<{ id: string; answer?: "Yes" | "No" }[]>(
    done ? [{ id: "start", answer: "Yes" }, { id: "low", answer: "Yes" }, { id: "help", answer: "No" }, { id: "evacuate" }] : [{ id: "start" }],
  );
  const current = path[path.length - 1];
  const node = TREE[current.id];
  const finished = "decision" in node;

  useEffect(() => {
    onSpeech("decision" in node ? `${node.decision}. ${node.why}` : node.question);
    if (finished) onComplete();
  }, [node, finished, onComplete, onSpeech]);

  const answer = (a: "Yes" | "No") => {
    if ("decision" in node) return;
    const next = a === "Yes" ? node.yes : node.no;
    setPath((p) => [...p.slice(0, -1), { id: current.id, answer: a }, { id: next }]);
  };

  return (
    <div className="tm-p4">
      <ol className="tm-p4-path">
        {path.slice(0, -1).map((step) => {
          const n = TREE[step.id];
          return (
            <li key={step.id}>
              <span>{"question" in n ? n.question : ""}</span>
              <strong className={step.answer === "Yes" ? "is-yes" : "is-no"}>{step.answer}</strong>
            </li>
          );
        })}
      </ol>

      {"question" in node ? (
        <div className="tm-p4-ask">
          <p className="tm-choice-situation">{node.question}</p>
          <div className="tm-p4-yesno">
            <button type="button" className="tm-choice-option" onClick={() => answer("Yes")}>👍 Yes</button>
            <button type="button" className="tm-choice-option" onClick={() => answer("No")}>👎 No</button>
          </div>
        </div>
      ) : (
        <div className="tm-p4-decision" aria-live="polite">
          <span className="tm-p4-decision-icon" aria-hidden="true">{node.icon}</span>
          <strong>{node.decision}</strong>
          <span>{node.why}</span>
          <button type="button" className="tm-p4-again" onClick={() => setPath([{ id: "start" }])}>
            ↺ Try a different household
          </button>
        </div>
      )}
    </div>
  );
}
