// ============================================================
// BABA OCHIENG DRAWING
// ------------------------------------------------------------
// A fisherman on Lake Victoria, about 60, drawn in a lifelike
// storybook style: natural proportions, a faded blue cap, short
// grey hair and a short grey beard, a brown jacket over a light
// shirt, and his old notebook of storms.
//
//   <BabaOchieng mood="calm" size={170} talking />
//
// mood:    "calm" | "worried" | "proud"
// talking: true = he nods gently while speaking
// ============================================================

import type { BabaMood } from "../types";
import HumanFace, { type Expression } from "./HumanFace";

const SKIN = "#6E4529";
const SKIN_SHADOW = "#56351F";
const SKIN_LIGHT = "#835536";
const GREY = "#C9CCCF";
const GREY_DARK = "#9EA3A8";
const CAP = "#5B7FA6";
const CAP_DARK = "#46668A";
const JACKET = "#7B5232";
const JACKET_DARK = "#5F3E25";
const SHIRT = "#E8E2D0";
const TROUSERS = "#3F4A52";
const LINE = "#2A2220";

const EXPRESSIONS: Record<BabaMood, Expression> = {
  calm: { eyes: "open", brows: "flat", mouth: "smile" },
  worried: { eyes: "open", brows: "worried", mouth: "frown" },
  proud: { eyes: "smile", brows: "flat", mouth: "grin" },
};

const MOOD_WORDS: Record<BabaMood, string> = {
  calm: "looking calm and wise",
  worried: "looking worried",
  proud: "looking proud",
};

interface BabaProps {
  mood?: BabaMood;
  size?: number;
  talking?: boolean;
  /** true (the default) = he holds his notebook of storms */
  holdingNotebook?: boolean;
  className?: string;
}

export default function BabaOchieng({ mood = "calm", size = 170, talking = false, holdingNotebook = true, className = "" }: BabaProps) {
  return (
    <svg
      className={`tm-character tm-human ${talking ? "tm-talking-nod" : ""} ${className}`}
      viewBox="0 0 160 260"
      width={size}
      height={size * 1.625}
      role="img"
      aria-label={`Baba Ochieng, a fisherman in a blue cap and brown jacket${holdingNotebook ? ", holding his notebook of storms" : ""}, ${MOOD_WORDS[mood]}`}
    >
      {/* Shadow */}
      <ellipse cx="80" cy="254" rx="40" ry="4.5" fill="#13303A" opacity="0.15" />

      {/* Legs and shoes */}
      <g className="tm-leg-l">
        <path d="M49 194 L47 244 L66 244 L76 196 Z" fill={TROUSERS} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M44 244 Q44 252 56 252 L68 252 Q69 246 66 244 Z" fill="#2A1C14" />
      </g>
      <g className="tm-leg-r">
        <path d="M84 196 L94 244 L113 244 L111 194 Z" fill={TROUSERS} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M94 244 Q91 246 92 252 L104 252 Q116 252 116 244 Z" fill="#2A1C14" />
      </g>

      {/* Neck */}
      <path d="M72 74 L72 92 Q80 97 88 92 L88 74 Z" fill={SKIN_SHADOW} />

      {/* Left arm (down by his side) */}
      <path d="M42 98 Q30 110 30 128 L31 178 L43 179 L46 126 Z" fill={JACKET} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="37" cy="185" rx="5.6" ry="6.4" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.3" />

      {/* Jacket over a light shirt, with lapels, buttons and a pocket */}
      <path d="M40 94 C52 88 108 88 120 94 L124 198 Q80 204 36 198 Z" fill={JACKET} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M108 92 L120 94 L124 198 Q116 200 108 201 L112 110 Z" fill="#000000" opacity="0.14" />
      <path d="M66 90 L80 132 L94 90 Z" fill={SHIRT} stroke={LINE} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M66 90 L76 124 L61 104 Z M94 90 L84 124 L99 104 Z" fill={JACKET_DARK} stroke={LINE} strokeWidth="1.2" strokeLinejoin="round" />
      {[148, 168, 188].map((y) => (
        <circle key={y} cx="80" cy={y} r="2.6" fill={JACKET_DARK} stroke={LINE} strokeWidth="0.9" />
      ))}
      <path d="M50 166 h18 v12 h-18 z" fill="none" stroke={JACKET_DARK} strokeWidth="2" />

      {/* Right arm: bent, holding the notebook against his chest */}
      {holdingNotebook ? (
        <g className="tm-held-notebook">
          <path d="M118 98 Q130 108 128 128 L126 136" stroke={LINE} strokeWidth="15" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M118 98 Q130 108 128 128 L126 136" stroke={JACKET} strokeWidth="12.5" fill="none" strokeLinecap="round" />
          <g transform="rotate(8 98 148)">
            <rect x="84" y="126" width="30" height="40" rx="2" fill="#C9B48A" stroke={LINE} strokeWidth="1.6" />
            <line x1="88" y1="126" x2="88" y2="166" stroke={LINE} strokeWidth="1.2" />
            <path d="M92 136 h17 M92 143 h17 M92 150 h13 M92 157 h17" stroke={JACKET_DARK} strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <path d="M126 134 Q120 150 104 152" stroke={LINE} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M126 134 Q120 150 104 152" stroke={JACKET} strokeWidth="11.5" fill="none" strokeLinecap="round" />
          <ellipse cx="102" cy="152" rx="6" ry="6.6" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.3" />
        </g>
      ) : (
        <>
          <path d="M118 98 Q130 110 130 128 L129 178 L117 179 L114 126 Z" fill={JACKET} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
          <ellipse cx="123" cy="185" rx="5.6" ry="6.4" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.3" />
        </>
      )}

      {/* Head: nods when he talks */}
      <g className="tm-head">
        <g transform="translate(80 52) scale(1.08)">
          <ellipse cx="-18.6" cy="3" rx="3.5" ry="5.8" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <ellipse cx="18.6" cy="3" rx="3.5" ry="5.8" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <ellipse cx="0" cy="2.5" rx="18.5" ry="23" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
          <ellipse cx="-4" cy="-8" rx="6" ry="3.5" fill={SKIN_LIGHT} opacity="0.5" />
          {/* Short grey hair at the sides, under the cap */}
          <path d="M-18.5 -4 q-2 8 1 14 l3 -1 q-2 -6 -1 -12 Z M18.5 -4 q2 8 -1 14 l-3 -1 q2 -6 1 -12 Z" fill={GREY} />
          {/* Short grey beard and moustache */}
          <path d="M-15.5 9 Q-15 25.5 0 26.5 Q15 25.5 15.5 9 Q9 18 0 18.5 Q-9 18 -15.5 9 Z" fill={GREY} stroke={GREY_DARK} strokeWidth="0.8" />
          <path d="M-7.5 10.6 Q0 7.8 7.5 10.6 Q0 12.4 -7.5 10.6 Z" fill={GREY} stroke={GREY_DARK} strokeWidth="0.6" />
          <HumanFace {...EXPRESSIONS[mood]} wrinkles shadow={SKIN_SHADOW} browColour={GREY_DARK} lipColour="#5A2E22" />
          {/* Faded blue cap with a brim */}
          <path d="M-20 -6 C-20 -28 -8 -34 0 -34 C8 -34 20 -28 20 -6 Z" fill={CAP} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M0 -34 V-6" stroke={CAP_DARK} strokeWidth="1.2" />
          <circle cx="0" cy="-33.5" r="2" fill={CAP_DARK} />
          <path d="M-22 -6 Q0 -12 22 -6 Q24 0 18 0 Q0 -5 -18 0 Q-24 0 -22 -6 Z" fill={CAP_DARK} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
