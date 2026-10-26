// ============================================================
// IDEA PICTURE CARD
// ------------------------------------------------------------
// The card that pops up beside a speech bubble with a small
// explaining picture and a caption. The pictures themselves
// are drawn in each episode's IdeaPictures.tsx file and put
// together in registry.tsx.
//
// "big-message" is special: the 4-step main message that
// lights up one step at a time, used at the end of every scene.
// ============================================================

import type { IdeaPictureId } from "../types";
import { IDEA_PICTURES } from "./registry";

const MESSAGE_STEPS = [
  { icon: "📚", text: "AI learns patterns from past data" },
  { icon: "⚠️", text: "It warns us early" },
  { icon: "🏃", text: "We act early" },
  { icon: "💪", text: "We are more resilient" },
];

function BigMessage() {
  return (
    <ol className="tm-message-chain" aria-label="The big message">
      {MESSAGE_STEPS.map((step, i) => (
        <li key={step.text} className="tm-message-step" style={{ animationDelay: `${0.6 + i * 0.8}s` }}>
          <span className="tm-message-icon" aria-hidden="true">
            {step.icon}
          </span>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

export default function IdeaPictureCard({ id }: { id: IdeaPictureId }) {
  if (id === "big-message") {
    return (
      <div className="tm-idea tm-idea-wide">
        <BigMessage />
      </div>
    );
  }
  const picture = IDEA_PICTURES[id];
  return (
    <figure className="tm-idea">
      <svg viewBox="0 0 240 160" role="img" aria-label={picture.label}>
        {picture.draw}
      </svg>
      <figcaption>{picture.caption}</figcaption>
    </figure>
  );
}
