// ============================================================
// CONFETTI
// ------------------------------------------------------------
// A small burst of coloured paper pieces for right answers.
// Each piece is a <span> that falls using a CSS animation.
// (With "reduce motion" on, the CSS hides it completely.)
// ============================================================

import type { CSSProperties } from "react";

const COLOURS = ["#F2B544", "#1B6E8E", "#4C8E44", "#A4532F", "#E0533D", "#8BE9F5"];

export default function Confetti() {
  return (
    <div className="tm-confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: COLOURS[i % COLOURS.length],
              animationDelay: `${(i % 7) * 0.08}s`,
              animationDuration: `${1.2 + (i % 5) * 0.2}s`,
              "--tm-spin": `${(i % 2 ? 1 : -1) * (200 + i * 20)}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
