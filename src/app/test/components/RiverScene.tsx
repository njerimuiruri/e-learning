"use client";

// ============================================================
// RIVER SCENE
// ------------------------------------------------------------
// The Nyando River from the side, on a rainy evening:
//   • high ground (a hill) on the left - the safe place
//   • Mama's house and two goats on the river bank
//   • a wooden gauge post in the water, marked 0–6 metres,
//     with a red DANGER line at 4.5 m
//
//   <RiverScene level={2.4} rain={0.5} goats="home" />
//
// level: how high the river is, in metres (0–6). When it
//        changes, the water slides smoothly to the new height.
// rain:  0 = no rain, 1 = very heavy rain
// goats: "home" (by the house) or "uphill" (walked to safety)
// fit:   "cover" fills its box and keeps the ground in view
//        (used behind the characters); "contain" shows it all.
// ============================================================

import { useId } from "react";
import { useAnimatedNumber } from "./useAnimatedNumbers";

export const DANGER_LEVEL = 4.5; // metres

const OUTLINE = "#13303A";

// ---------- Where things are in the drawing ----------
const RIVER_BED = 480; // y position of 0 m on the gauge
const PX_PER_M = 45; // how many drawing units one metre is
const BANK_TOP = 330; // y position of the flat river bank
const BANK_LEVEL = (RIVER_BED - BANK_TOP) / PX_PER_M; // ≈ 3.3 m: above this the bank floods
const POST_X = 790;

/** The y position (up and down) of a height in metres. */
export const yOf = (metres: number) => RIVER_BED - metres * PX_PER_M;

/** How far left the water reaches. Above the bank, it spreads towards the house. */
function waterLeftEdge(level: number) {
  if (level <= BANK_LEVEL) {
    // Inside the river channel: follow the sloping bank
    const y = yOf(level);
    return 560 + ((y - BANK_TOP) / (RIVER_BED - BANK_TOP)) * 60;
  }
  // Over the top of the bank: spread across the flat ground
  return Math.max(200, 560 - (level - BANK_LEVEL) * 290);
}

// ---------- A goat ----------
function Goat({ colour, moving }: { colour: string; moving: boolean }) {
  return (
    <g className={moving ? "tm-goat is-walking" : "tm-goat"}>
      {/* Legs */}
      {[-12, -5, 6, 13].map((x, i) => (
        <line key={x} className={i % 2 ? "tm-goat-leg-b" : "tm-goat-leg-a"} x1={x} y1="-14" x2={x} y2="0" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
      ))}
      {/* Body, tail, head, horns, ear */}
      <ellipse cx="0" cy="-22" rx="20" ry="11" fill={colour} stroke={OUTLINE} strokeWidth="3" />
      <path d="M-19 -27 l-7 -6" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="22" cy="-34" rx="8" ry="7" fill={colour} stroke={OUTLINE} strokeWidth="3" />
      <path d="M19 -40 q2 -8 -4 -10 M24 -40 q4 -8 0 -11" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M16 -34 l-6 4" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="25" cy="-35" r="1.6" fill={OUTLINE} />
    </g>
  );
}

// Where each goat stands: by the house, or up on the hill
const GOAT_SPOTS = {
  home: [
    { x: 495, y: 330 },
    { x: 535, y: 330 },
  ],
  uphill: [
    { x: 60, y: 197 },
    { x: 115, y: 196 },
  ],
};

interface RiverSceneProps {
  level: number;
  rain?: number;
  goats?: "home" | "uphill";
  fit?: "cover" | "contain";
  /** Show the water height in metres beside the gauge */
  /** Show the water-height marker and the DANGER sign (off when the river is just a background) */
  showReading?: boolean;
  className?: string;
}

export default function RiverScene({
  level,
  rain = 0.4,
  goats = "home",
  fit = "contain",
  showReading = true,
  className = "",
}: RiverSceneProps) {
  const id = useId().replace(/:/g, "");
  const shown = useAnimatedNumber(Math.max(0, Math.min(6.2, level)), 1200);
  const waterY = yOf(shown);
  const left = waterLeftEdge(shown);
  const danger = shown >= DANGER_LEVEL;
  const drops = Math.round(rain * 70);
  const goatsMoving = goats === "uphill";

  // The water's top edge is a gentle wave
  const wave = `M${left} ${waterY} ` + Array.from({ length: 14 }, (_, i) => `q 25 -6 50 0 t 50 0`).join(" ");

  return (
    <svg
      className={`tm-river ${className}`}
      viewBox="0 0 1000 500"
      preserveAspectRatio={fit === "cover" ? "xMidYMax slice" : "xMidYMid meet"}
      role="img"
      aria-label={`The Nyando River at ${shown.toFixed(1)} metres${danger ? ", above the danger line" : ""}. ${
        goats === "uphill" ? "The goats are safe on the hill." : "Mama's house and goats are on the river bank."
      }`}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#55697C" />
          <stop offset="1" stopColor="#D6B08A" />
        </linearGradient>
      </defs>

      {/* ---------- Evening sky, darker when it rains more ---------- */}
      <rect width="1000" height="500" fill={`url(#${id}-sky)`} />
      <ellipse cx="880" cy="330" rx="160" ry="60" fill="#F2B544" opacity={0.35 - rain * 0.25} />
      <rect width="1000" height="500" fill="#1E2B36" opacity={rain * 0.35} />
      {[
        [60, 30, 1.8],
        [330, 10, 2.2],
        [640, 40, 1.9],
        [850, 14, 1.5],
      ].map(([x, y, s], i) => (
        <g key={i} className="tm-bg-cloud" style={{ animationDelay: `${-i * 5}s` }}>
          <path
            transform={`translate(${x} ${y}) scale(${s})`}
            d="M0 40 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z"
            fill={rain > 0.5 ? "#3A4855" : "#5E6E7B"}
          />
        </g>
      ))}

      {/* ---------- Land: the hill (safe, high ground) and the river bank ---------- */}
      <rect x="560" y={BANK_TOP} width="440" height="170" fill="#6E5B45" />
      <path
        d={`M0 200 C90 188 170 210 240 268 C270 296 300 ${BANK_TOP} 340 ${BANK_TOP} L560 ${BANK_TOP} L620 ${RIVER_BED} L620 500 L0 500 Z`}
        fill="#5E9A4F"
      />
      <path d={`M560 ${BANK_TOP} L620 ${RIVER_BED}`} stroke="#7A5232" strokeWidth="10" />
      <text x="80" y="250" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FFFFFF" opacity="0.85">
        high ground
      </text>

      {/* ---------- Mama's house ---------- */}
      <g>
        <rect x="320" y="262" width="150" height="68" fill="#C98B5A" stroke={OUTLINE} strokeWidth="4" />
        <path d="M305 268 L395 222 L485 268 Z" fill="#AEB8BE" stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round" />
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={318 + i * 30} y1={264} x2={395} y2={227} stroke="#8D989E" strokeWidth="2" />
        ))}
        <rect x="380" y="286" width="30" height="44" rx="3" fill="#A4532F" stroke={OUTLINE} strokeWidth="3" />
        <rect x="335" y="280" width="30" height="24" fill="#F2D27A" stroke={OUTLINE} strokeWidth="3" />
      </g>

      {/* ---------- Goats ---------- */}
      {GOAT_SPOTS[goats].map((spot, i) => (
        <g
          key={i}
          className="tm-goat-move"
          style={{ transform: `translate(${spot.x}px, ${spot.y}px)`, transitionDelay: `${i * 0.2}s` }}
        >
          {/* Face the way they are walking: left when going uphill */}
          <g transform={goats === "uphill" ? "scale(-1 1)" : undefined}>
            <Goat colour={i === 0 ? "#EDE6DA" : "#8B6A4E"} moving={goatsMoving} />
          </g>
        </g>
      ))}

      {/* ---------- Gauge post (drawn before the water, so the water covers its bottom) ---------- */}
      <rect x={POST_X - 14} y={yOf(6.3)} width="28" height={RIVER_BED - yOf(6.3) + 20} rx="4" fill="#9C6B3A" stroke={OUTLINE} strokeWidth="4" />
      {Array.from({ length: 13 }, (_, i) => {
        const m = i / 2;
        const whole = i % 2 === 0;
        return (
          <g key={i}>
            <line x1={POST_X - 14} y1={yOf(m)} x2={POST_X + (whole ? 10 : 0)} y2={yOf(m)} stroke="#FFFFFF" strokeWidth={whole ? 4 : 2.5} />
            {whole && (
              <text x={POST_X - 24} y={yOf(m) + 7} textAnchor="end" fontSize="20" fontWeight="900" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="4" paintOrder="stroke">
                {m}
              </text>
            )}
          </g>
        );
      })}
      <text x={POST_X} y={yOf(6.3) - 10} textAnchor="middle" fontSize="16" fontWeight="800" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="4" paintOrder="stroke">
        metres
      </text>

      {/* ---------- The water ---------- */}
      <path
        d={`${wave} L1000 500 L${left} 500 Z`}
        fill="#7A6A4F"
        opacity="0.9"
      />
      <path className="tm-water-shine" d={wave} stroke="#A99A78" strokeWidth="4" fill="none" />

      {/* ---------- DANGER line ---------- */}
      <g className={danger ? "tm-danger is-flashing" : "tm-danger"}>
        <line x1="560" y1={yOf(DANGER_LEVEL)} x2="1000" y2={yOf(DANGER_LEVEL)} stroke="#E0533D" strokeWidth="5" strokeDasharray="14 8" />
        <rect x={POST_X - 14} y={yOf(DANGER_LEVEL) - 4} width="28" height="8" fill="#E0533D" />
        {/* The sign sits at the LEFT end of the line, away from the water-height marker by the post.
            (Hidden when the river is only a background behind the characters.) */}
        {showReading && (
          <>
            <rect x="600" y={yOf(DANGER_LEVEL) - 36} width="122" height="30" rx="8" fill="#E0533D" stroke={OUTLINE} strokeWidth="3" />
            <text x="661" y={yOf(DANGER_LEVEL) - 15} textAnchor="middle" fontSize="17" fontWeight="900" fill="#FFFFFF">
              DANGER 4.5 m
            </text>
          </>
        )}
      </g>

      {/* ---------- Water height reading ---------- */}
      {showReading && (
        <g>
          <path d={`M${POST_X + 18} ${waterY} l14 -10 h62 v20 h-62 z`} fill="#F2B544" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
          <text x={POST_X + 63} y={waterY + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill={OUTLINE}>
            {shown.toFixed(1)} m
          </text>
        </g>
      )}

      {/* ---------- Rain ---------- */}
      {Array.from({ length: drops }, (_, i) => {
        const x = (i * 61) % 1010;
        const y = 70 + ((i * 37) % 260);
        return (
          <line
            key={i}
            className="tm-rain-line"
            x1={x}
            y1={y}
            x2={x - 8}
            y2={y + 20}
            stroke="#BFD3DD"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ animationDelay: `${(i % 8) * 0.1}s` }}
          />
        );
      })}
    </svg>
  );
}
