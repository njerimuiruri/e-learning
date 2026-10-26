// ============================================================
// OTIENO DRAWING
// ------------------------------------------------------------
// Mama's grandson, about 16, drawn in a lifelike storybook style:
// natural proportions, short coily hair, and his school uniform:
// a blue V-neck sweater over a white shirt collar, grey trousers
// and black school shoes.
//
//   <Otieno mood="curious" size={160} talking />
//
// mood:    "curious" | "excited" | "thinking" | "happy"
// talking: true = a small bounce while he speaks
// ============================================================

import type { OtienoMood } from "../types";
import HumanFace, { type Expression } from "./HumanFace";

const SKIN = "#6B4226";
const SKIN_SHADOW = "#53321C";
const SKIN_LIGHT = "#7E5233";
const HAIR = "#1E1410";
const SWEATER = "#2C4F9E";
const SWEATER_DARK = "#203B78";
const TROUSERS = "#5B6670";
const LINE = "#2A2220";

const EXPRESSIONS: Record<OtienoMood, Expression> = {
  curious: { eyes: "wide", brows: "raised", mouth: "o" },
  excited: { eyes: "wide", brows: "raised", mouth: "grin" },
  thinking: { eyes: "up", brows: "one-up", mouth: "side" },
  happy: { eyes: "open", brows: "flat", mouth: "smile" },
};

const MOOD_WORDS: Record<OtienoMood, string> = {
  curious: "looking curious",
  excited: "looking excited",
  thinking: "thinking with his hand on his chin",
  happy: "smiling",
};

// Little curls that give his short hair texture
const CURLS = [
  [-12, -18], [-6, -22], [0, -24], [6, -22], [12, -18], [-15, -11], [-9, -15], [-3, -18], [3, -18], [9, -15], [15, -11],
];

/** A sleeve from shoulder to wrist, drawn as a thick curved stroke. */
function Sleeve({ d }: { d: string }) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d={d} stroke={SWEATER} strokeWidth="11.5" fill="none" strokeLinecap="round" />
    </>
  );
}

function Hand({ x, y }: { x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx="5.4" ry="6.2" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.3" />;
}

interface OtienoProps {
  mood?: OtienoMood;
  size?: number;
  talking?: boolean;
  className?: string;
}

export default function Otieno({ mood = "happy", size = 150, talking = false, className = "" }: OtienoProps) {
  const bounce = talking || mood === "excited";

  return (
    <svg
      className={`tm-character tm-human ${bounce ? "tm-talking-bounce" : ""} ${className}`}
      viewBox="0 0 140 250"
      width={size}
      height={size * 1.786}
      role="img"
      aria-label={`Otieno, a secondary school student in a blue school sweater, ${MOOD_WORDS[mood]}`}
    >
      {/* Shadow */}
      <ellipse cx="70" cy="244" rx="36" ry="4.5" fill="#13303A" opacity="0.15" />

      <g className="tm-body">
        {/* Legs in grey school trousers, and black shoes */}
        <g className="tm-leg-l">
          <path d="M45 148 L43 232 L60 232 L69 150 Z" fill={TROUSERS} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M40 232 Q40 242 52 242 L62 242 Q63 234 60 232 Z" fill="#111111" />
        </g>
        <g className="tm-leg-r">
          <path d="M71 150 L80 232 L97 232 L95 148 Z" fill={TROUSERS} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M80 232 Q77 234 78 242 L88 242 Q100 242 100 232 Z" fill="#111111" />
        </g>

        {/* Neck */}
        <path d="M63 62 L63 82 Q70 86 77 82 L77 62 Z" fill={SKIN_SHADOW} />

        {/* Left arm (always down) */}
        <Sleeve d="M40 88 Q30 110 30 148" />
        <Hand x={30} y={155} />

        {/* Right arm: up to the chin when thinking, waving up when excited, else down */}
        {mood === "thinking" ? (
          <Sleeve d="M100 88 Q114 108 106 124 Q98 104 84 82" />
        ) : mood === "excited" ? (
          <>
            <Sleeve d="M100 88 Q116 70 114 46" />
            <Hand x={114} y={40} />
          </>
        ) : (
          <>
            <Sleeve d="M100 88 Q110 110 110 148" />
            <Hand x={110} y={155} />
          </>
        )}

        {/* Sweater, with a ribbed hem and a shaded side */}
        <path d="M37 84 C47 77 93 77 103 84 L107 152 Q70 158 33 152 Z" fill={SWEATER} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M92 80 L103 84 L107 152 Q100 154 92 155 L96 100 Z" fill="#000000" opacity="0.13" />
        <path d="M34 146 Q70 152 106 146 L107 152 Q70 158 33 152 Z" fill={SWEATER_DARK} />
        {/* V-neck and white shirt collar */}
        <path d="M59 79 L70 101 L81 79 Z" fill="#FFFFFF" stroke={LINE} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M58 78 L64 90 L70 82 Z M82 78 L76 90 L70 82 Z" fill="#FFFFFF" stroke={LINE} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M59 79 L70 101 L81 79" stroke={SWEATER_DARK} strokeWidth="3" fill="none" />

        {/* Head */}
        <g transform="translate(70 44) scale(1.08)">
          <ellipse cx="-17.8" cy="3" rx="3.4" ry="5.6" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <ellipse cx="17.8" cy="3" rx="3.4" ry="5.6" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <ellipse cx="0" cy="2" rx="17.5" ry="21.5" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
          <ellipse cx="-4" cy="-8" rx="6" ry="3.5" fill={SKIN_LIGHT} opacity="0.5" />
          <path d="M-13 16 Q0 26 13 16 Q0 22 -13 16 Z" fill={SKIN_SHADOW} opacity="0.35" />
          <HumanFace {...EXPRESSIONS[mood]} shadow={SKIN_SHADOW} lipColour="#5A2E22" />
          {/* Short coily hair */}
          <path d="M-18 -2 C-19 -22 -8 -27 0 -27 C9 -27 19 -22 18 -2 C15 -10 11 -13 6 -14 C2 -12 -6 -12 -10 -13.5 C-14 -11 -17 -7 -18 -2 Z" fill={HAIR} />
          {CURLS.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r="2.2" fill="#2E2018" />
          ))}
        </g>

        {/* When thinking, his hand rests on his chin (drawn on top of the face) */}
        {mood === "thinking" && <Hand x={82} y={72} />}
      </g>
    </svg>
  );
}
