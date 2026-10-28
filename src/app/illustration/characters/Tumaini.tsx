// ============================================================
// TUMAINI DRAWING
// ------------------------------------------------------------
// Tumaini is drawn with SVG shapes (circles, rectangles, lines)
// instead of an image file, so it works offline and we can
// change its face whenever we like.
//
// Use it like this:
//   <Tumaini mood="happy" waving size={220} />
//
// mood:   "happy" | "thinking" | "confused" | "excited" | "unsure" | "worried"
// waving: true = right arm waves back and forth
// size:   width in pixels (height is worked out automatically)
// screen: optional drawing to show on the face screen instead of
//         the face (Scene 1 uses this for the bar chart).
//         The screen area is x 52–148, y 53–117.
//
// The animations (floating, blinking, waving, antenna light)
// are done in tumaini.css using the class names below.
// ============================================================

import type { ReactNode } from "react";
import type { TumainiMood } from "../types";

// Colours used in the drawing (same as the CSS palette).
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const OUTLINE = "#13303A";
const SCREEN = "#0E2A33";
export const GLOW = "#8BE9F5"; // the glowing colour of the face

// Words used to describe each mood to screen readers.
const MOOD_WORDS: Record<TumainiMood, string> = {
  happy: "happy",
  thinking: "thoughtful",
  confused: "confused",
  excited: "excited",
  unsure: "unsure",
  worried: "worried",
};

// ---------- The face on the screen, one drawing per mood ----------
function Face({ mood }: { mood: TumainiMood }) {
  const line = {
    stroke: GLOW,
    strokeWidth: 5,
    strokeLinecap: "round" as const,
    fill: "none",
  };

  switch (mood) {
    case "thinking":
      return (
        <>
          {/* Eyes looking up */}
          <g className="tm-eyes">
            <circle cx="80" cy="74" r="6" fill={GLOW} />
            <circle cx="120" cy="74" r="6" fill={GLOW} />
          </g>
          {/* Small straight mouth */}
          <line className="tm-mouth" x1="90" y1="100" x2="110" y2="100" {...line} />
        </>
      );

    case "confused":
      return (
        <>
          {/* One big eye, one small eye */}
          <g className="tm-eyes">
            <circle cx="80" cy="80" r="9" fill={GLOW} />
            <circle cx="121" cy="82" r="5" fill={GLOW} />
          </g>
          {/* Wavy mouth */}
          <path className="tm-mouth" d="M82 102 q6 -6 12 0 t12 0 t12 0" {...line} />
        </>
      );

    case "excited":
      return (
        <>
          {/* Big round eyes with a sparkle */}
          <g className="tm-eyes">
            <circle cx="80" cy="78" r="10" fill={GLOW} />
            <circle cx="120" cy="78" r="10" fill={GLOW} />
            <circle cx="83" cy="75" r="3" fill={SCREEN} />
            <circle cx="123" cy="75" r="3" fill={SCREEN} />
          </g>
          {/* Wide open smile */}
          <path className="tm-mouth" d="M82 94 q18 22 36 0 z" fill={GLOW} stroke={GLOW} strokeWidth="3" strokeLinejoin="round" />
        </>
      );

    case "unsure":
      return (
        <>
          {/* Small eyes */}
          <g className="tm-eyes">
            <circle cx="82" cy="80" r="4" fill={GLOW} />
            <circle cx="118" cy="80" r="4" fill={GLOW} />
          </g>
          {/* Flat mouth */}
          <line className="tm-mouth" x1="88" y1="102" x2="112" y2="102" {...line} />
        </>
      );

    case "worried":
      return (
        <>
          {/* Eyebrows slanting up in the middle */}
          <path d="M70 68 L88 62 M130 68 L112 62" {...line} strokeWidth={4} />
          <g className="tm-eyes">
            <circle cx="80" cy="80" r="6" fill={GLOW} />
            <circle cx="120" cy="80" r="6" fill={GLOW} />
          </g>
          {/* Upside-down smile */}
          <path className="tm-mouth" d="M86 106 q14 -12 28 0" {...line} />
        </>
      );

    case "happy":
    default:
      return (
        <>
          {/* Eyes shaped like upside-down "U"s */}
          <g className="tm-eyes">
            <path d="M70 84 q10 -14 20 0" {...line} />
            <path d="M110 84 q10 -14 20 0" {...line} />
          </g>
          {/* Curved smile */}
          <path className="tm-mouth" d="M84 96 q16 14 32 0" {...line} />
        </>
      );
  }
}

// ---------- One arm: a thick outlined line with a round hand ----------
// The arm starts at (0,0) - the shoulder - and goes to (x, y).
function Arm({ x, y }: { x: number; y: number }) {
  return (
    <>
      <line x1="0" y1="0" x2={x} y2={y} stroke={OUTLINE} strokeWidth="16" strokeLinecap="round" />
      <line x1="0" y1="0" x2={x} y2={y} stroke={LAKE} strokeWidth="9" strokeLinecap="round" />
      <circle cx={x} cy={y} r="10" fill={MAIZE} stroke={OUTLINE} strokeWidth="4" />
    </>
  );
}

// ---------- The whole robot ----------
interface TumainiProps {
  mood?: TumainiMood;
  waving?: boolean;
  size?: number;
  label?: string;
  screen?: ReactNode;
  className?: string;
}

export default function Tumaini({
  mood = "happy",
  waving = false,
  size = 200,
  label,
  screen,
  className = "",
}: TumainiProps) {
  const ariaLabel =
    label ||
    `Tumaini, a small round blue robot, looking ${MOOD_WORDS[mood] || "happy"}${
      waving ? " and waving hello" : ""
    }`;

  return (
    <svg
      className={`tm-robot ${className}`}
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Shadow on the ground (does not float) */}
      <ellipse className="tm-robot-shadow" cx="100" cy="232" rx="46" ry="6" fill={OUTLINE} />

      {/* Everything inside this group floats up and down */}
      <g className="tm-float">
        {/* Antenna with a blinking light */}
        <line x1="100" y1="42" x2="100" y2="22" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" />
        <circle className="tm-antenna-light" cx="100" cy="16" r="7" fill={MAIZE} stroke={OUTLINE} strokeWidth="3" />

        {/* Left arm (always down). Drawn before the body so the shoulder hides behind it. */}
        <g transform="translate(58 154)">
          <Arm x={-24} y={32} />
        </g>

        {/* Right arm: waving up high, or resting down */}
        <g transform="translate(142 154)">
          {waving ? (
            <g className="tm-wave">
              <Arm x={30} y={-38} />
            </g>
          ) : (
            <Arm x={24} y={32} />
          )}
        </g>

        {/* Wheels (with spokes, so you can see them turn when Tumaini rolls) */}
        {[72, 128].map((cx) => (
          <g key={cx} className="tm-wheel-spin">
            <circle cx={cx} cy="212" r="14" fill={OUTLINE} />
            <path d={`M${cx - 10} 212 h20 M${cx} 202 v20`} stroke="#5E7C88" strokeWidth="3" />
            <circle cx={cx} cy="212" r="5" fill="#9FB7BF" />
          </g>
        ))}

        {/* Body with a glowing chest light */}
        <rect x="50" y="136" width="100" height="74" rx="30" fill={LAKE} stroke={OUTLINE} strokeWidth="5" />
        <circle className="tm-chest-light" cx="100" cy="170" r="11" fill={MAIZE} stroke={OUTLINE} strokeWidth="3" />

        {/* Neck */}
        <rect x="88" y="126" width="24" height="14" rx="4" fill={OUTLINE} />

        {/* Head and dark screen */}
        <rect x="38" y="40" width="124" height="90" rx="28" fill={LAKE} stroke={OUTLINE} strokeWidth="5" />
        <rect x="52" y="53" width="96" height="64" rx="18" fill={SCREEN} />

        {/* Face (changes with mood), or a custom screen drawing */}
        <g className="tm-face">{screen ?? <Face mood={mood} />}</g>

        {/* A question mark floats beside Tumaini when it is thinking */}
        {mood === "thinking" && !screen && (
          <text className="tm-think-mark" x="168" y="40" fontSize="34" fontWeight="bold" fill={MAIZE} stroke={OUTLINE} strokeWidth="1.5">
            ?
          </text>
        )}
      </g>
    </svg>
  );
}
