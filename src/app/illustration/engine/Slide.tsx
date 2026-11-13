"use client";

// ============================================================
// SLIDE  (the calm, KISS look)
// ------------------------------------------------------------
// One idea per slide:
//   big title  ->  ONE visual  ->  one short line
// Tumaini sits small in the corner as a guide (only its face
// changes). The only motion is a gentle fade, which switches
// off with "reduce motion".
// ============================================================

import { useState } from "react";
import type { SlideBeat, SlidePhoto, SlideVisual } from "../types";
import Tumaini from "../characters/Tumaini";
import IdeaPictureCard from "./IdeaPictureCard";
import { CHARTS } from "./registry";

// ---------- Photo (shows a clear placeholder if the file is missing) ----------
function Photo({ photo }: { photo: SlidePhoto }) {
  const [missing, setMissing] = useState(false);
  return (
    <figure className="tm-sl-photo">
      {missing ? (
        <div className="tm-sl-photo-empty" role="img" aria-label={photo.alt}>
          <span>📷 Photo missing</span>
          <code>{photo.src}</code>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.src} alt={photo.alt} onError={() => setMissing(true)} />
      )}
      {photo.credit && <figcaption>{photo.credit}</figcaption>}
    </figure>
  );
}

// ---------- Diagram: the blanket of gases, built up in 3 steps ----------
function GreenhouseBlanket() {
  return (
    <svg
      className="tm-sl-diagram"
      viewBox="0 0 320 200"
      role="img"
      aria-label="The Earth wrapped in a blanket of gases. Heat from the sun gets trapped inside, so the Earth warms."
    >
      <circle cx="40" cy="40" r="22" fill="#F2B544" />
      <path d="M62 52 L130 92" stroke="#F2B544" strokeWidth="4" strokeLinecap="round" />
      <circle className="tm-sl-step tm-sl-step-1" cx="190" cy="120" r="70" fill="none" stroke="#9FB7BF" strokeWidth="6" />
      <circle className="tm-sl-step tm-sl-step-2" cx="190" cy="120" r="70" fill="none" stroke="#7E98A1" strokeWidth="16" opacity="0.6" />
      <circle cx="190" cy="120" r="48" fill="#1B6E8E" />
      <path d="M160 105 q15 -15 30 0 q10 12 -5 22 q-18 6 -25 -22z" fill="#4C8E44" />
      <path d="M200 135 q12 -8 22 4 q-6 14 -22 -4z" fill="#4C8E44" />
      <path className="tm-sl-step tm-sl-step-3" d="M222 88 q30 -10 18 -34" stroke="#A4532F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path className="tm-sl-step tm-sl-step-3" d="M240 54 l-2 10 l-8 -6" stroke="#A4532F" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text className="tm-sl-step tm-sl-step-3" x="246" y="40" fontSize="14" fontWeight="700" fill="#A4532F">heat trapped</text>
      <text className="tm-sl-step tm-sl-step-1" x="118" y="196" fontSize="14" fontWeight="700" fill="#35535D">blanket of gases</text>
    </svg>
  );
}

function Visual({ visual }: { visual: SlideVisual }) {
  if ("photo" in visual) return <Photo photo={visual.photo} />;
  if ("stat" in visual)
    return (
      <div className="tm-sl-stat">
        <span className="tm-sl-stat-value">{visual.stat.value}</span>
        <span className="tm-sl-stat-label">{visual.stat.label}</span>
      </div>
    );
  if ("compare" in visual)
    return (
      <div className="tm-sl-compare">
        {visual.compare.map((side) => (
          <div key={side.title} className="tm-sl-compare-box">
            <span className="tm-sl-compare-icon" aria-hidden="true">{side.icon}</span>
            <strong>{side.title}</strong>
            <span>{side.text}</span>
          </div>
        ))}
      </div>
    );
  if ("diagram" in visual) return <GreenhouseBlanket />;
  if ("steps" in visual) {
    const { items, joiner, result } = visual.steps;
    return (
      <div className="tm-sl-steps">
        {items.map((item, n) => (
          <div key={item.title} className="tm-sl-steps-part">
            {n > 0 && <span className="tm-sl-steps-joiner" aria-hidden="true">{joiner}</span>}
            <div className="tm-sl-steps-box">
              <span className="tm-sl-steps-icon" aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
            </div>
          </div>
        ))}
        {result && (
          <div className="tm-sl-steps-part">
            <span className="tm-sl-steps-joiner" aria-hidden="true">=</span>
            <div className="tm-sl-steps-box tm-sl-steps-result">
              <strong>{result}</strong>
            </div>
          </div>
        )}
      </div>
    );
  }
  if ("chart" in visual) {
    const Chart = CHARTS[visual.chart];
    return (
      <div className="tm-sl-chart">
        <Chart />
      </div>
    );
  }
  if ("picture" in visual)
    return (
      <div className="tm-sl-picture">
        <IdeaPictureCard id={visual.picture} hideCaption />
      </div>
    );
  return (
    <span className="tm-sl-icon" aria-hidden="true">
      {visual.icon}
    </span>
  );
}

export default function Slide({ beat }: { beat: SlideBeat }) {
  return (
    <div className="tm-sl">
      <h3 className="tm-sl-title">{beat.title}</h3>
      {beat.visual && (
        <div className="tm-sl-visual">
          <Visual visual={beat.visual} />
        </div>
      )}
      <p className="tm-sl-text">{beat.text}</p>
      {beat.points && beat.points.length > 0 && (
        <ul className="tm-sl-points">
          {beat.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      <div className="tm-sl-guide">
        <Tumaini mood={beat.mood ?? "happy"} size={72} />
      </div>
    </div>
  );
}
