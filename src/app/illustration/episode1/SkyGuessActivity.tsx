"use client";

// ============================================================
// SCENE 1 ACTIVITY: "What do you see in today's sky?"
// ------------------------------------------------------------
// The audience ticks the signs they see. Tumaini uses what it
// learned from the notebook to guess the chance of rain:
// the AVERAGE of the bars for the ticked signs.
//   e.g. dark clouds (83%) + ants (60%) -> (83 + 60) ÷ 2 ≈ 72%
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import SignIcon from "./SignIcon";
import { SIGNS } from "./content";
import { chanceOfRain, rainWords, signPercentages } from "./notebookMath";

const LEARNED = signPercentages(12) as number[];

/** The working, in words: "(83% + 60%) ÷ 2 = 72%" */
function working(seen: boolean[], chance: number | null) {
  if (chance === null) return "Tick a sign to see Tumaini's maths.";
  const parts = LEARNED.filter((_, i) => seen[i]).map((p) => `${Math.round(p)}%`);
  if (parts.length === 1) return `Tumaini remembers: on days with this sign, it rained ${parts[0]} of the time.`;
  return `Tumaini takes the average: (${parts.join(" + ")}) ÷ ${parts.length} = ${Math.round(chance)}%`;
}

const NO_SIGNS_TEXT = "In Mama's notebook, it never rained on days with no signs. Probably dry today.";

// ---------- The big gauge (like a speedometer) ----------
function Gauge({ chance }: { chance: number | null }) {
  const value = chance ?? 0;
  // 0% points left (-90°), 100% points right (+90°)
  const angle = -90 + value * 1.8;

  // A slice of the gauge's arc between two percentages
  const arc = (from: number, to: number) => {
    const point = (pct: number) => {
      const a = ((-180 + pct * 1.8) * Math.PI) / 180;
      return `${100 + 80 * Math.cos(a)} ${100 + 80 * Math.sin(a)}`;
    };
    return `M ${point(from)} A 80 80 0 0 1 ${point(to)}`;
  };

  return (
    <svg viewBox="0 0 200 130" className="tm-gauge" role="img" aria-label={chance === null ? "Chance of rain: no guess yet" : `Chance of rain: ${Math.round(value)} percent`}>
      <path d={arc(0, 40)} stroke="#F2B544" strokeWidth="22" fill="none" />
      <path d={arc(40, 65)} stroke="#9FB7BF" strokeWidth="22" fill="none" />
      <path d={arc(65, 100)} stroke="#1B6E8E" strokeWidth="22" fill="none" />
      <text x="14" y="124" fontSize="14" fontWeight="bold" fill="#13303A">Dry</text>
      <text x="186" y="124" fontSize="14" fontWeight="bold" fill="#13303A" textAnchor="end">Rain</text>
      <g className="tm-needle" style={{ transform: `rotate(${angle}deg)` }}>
        <line x1="100" y1="100" x2="100" y2="34" stroke="#13303A" strokeWidth="6" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="10" fill="#13303A" />
    </svg>
  );
}

// ---------- A small window showing rain, clouds or sun ----------
function WeatherWindow({ chance }: { chance: number | null }) {
  const kind = chance === null || chance < 40 ? "sun" : chance < 65 ? "mixed" : "rain";
  return (
    <svg viewBox="0 0 160 110" className={`tm-weather tm-weather-${kind}`} aria-hidden="true">
      <rect width="160" height="110" rx="14" fill={kind === "rain" ? "#8FA6B2" : "#CDEAF5"} />
      {kind !== "rain" && (
        <g className="tm-sun-spin" style={{ transformOrigin: "110px 40px" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="110" y1="12" x2="110" y2="20" stroke="#E09A1F" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 110 40)`} />
          ))}
          <circle cx="110" cy="40" r="16" fill="#F2B544" />
        </g>
      )}
      {kind !== "sun" && (
        <path d="M30 62 a14 14 0 0 1 4 -27 a20 20 0 0 1 36 -6 a16 16 0 0 1 28 12 a11 11 0 0 1 -2 21 Z" fill={kind === "rain" ? "#5B6670" : "#FFFFFF"} />
      )}
      {kind === "rain" &&
        [40, 58, 76, 94, 50, 68, 86].map((x, i) => (
          <line key={i} className="tm-drop" x1={x} y1="68" x2={x - 4} y2="80" stroke="#1B6E8E" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: `${i * 0.13}s` }} />
        ))}
    </svg>
  );
}

export default function SkyGuessActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [seen, setSeen] = useState<boolean[]>(SIGNS.map(() => false));
  const [changed, setChanged] = useState(done);

  const chance = chanceOfRain(seen);
  const message = chance === null ? NO_SIGNS_TEXT : `Chance of rain: ${Math.round(chance)}%. ${rainWords(chance)}`;

  useEffect(() => {
    if (changed) onComplete();
  }, [changed, onComplete]);

  useEffect(() => {
    onSpeech(message);
  }, [message, onSpeech]);

  const toggle = (i: number) => {
    setSeen((s) => s.map((v, j) => (j === i ? !v : v)));
    setChanged(true);
  };

  return (
    <div className="tm-activity">
      <div className="tm-sky-guess">
        {/* ---------- Tick boxes ---------- */}
        <fieldset className={`tm-ticks ${changed ? "" : "tm-attention-group"}`}>
          <legend className="tm-sr-only">Signs in today&apos;s sky</legend>
          {SIGNS.map((sign, i) => (
            <label key={sign.id} className={`tm-tick ${seen[i] ? "is-on" : ""}`}>
              <input type="checkbox" checked={seen[i]} onChange={() => toggle(i)} />
              <span className="tm-tick-box" aria-hidden="true">
                {seen[i] ? "✔" : ""}
              </span>
              <SignIcon id={sign.id} size={52} decorative />
              <span className="tm-tick-label">{sign.label}</span>
            </label>
          ))}
        </fieldset>

        {/* ---------- Tumaini's guess ---------- */}
        <div className="tm-guess">
          <div className="tm-guess-visuals">
            <div className="tm-gauge-box">
              <Gauge chance={chance} />
              <p className="tm-gauge-value">{chance === null ? "–" : `${Math.round(chance)}%`}</p>
            </div>
            <WeatherWindow chance={chance} />
          </div>
          <p className="tm-working">{working(seen, chance)}</p>
          <div className="tm-feedback">
            <Tumaini mood={chance === null ? "thinking" : chance >= 65 ? "excited" : "happy"} size={110} />
            <SpeechBubble text={message} name="Tumaini" small />
          </div>
        </div>
      </div>
    </div>
  );
}
