// ============================================================
// MAMA AKINYI DRAWING
// ------------------------------------------------------------
// A warm, wise farmer, about 55, drawn in a lifelike storybook
// style: natural proportions, a maize-yellow patterned headwrap
// (duku), a green kitenge dress with a soil-brown wrap (lesso),
// gold earrings and soft shading.
//
//   <Mama mood="happy" size={180} talking holdingNotebook />
//   <Mama mood="happy" holdingSeeds />   (a small sack of maize seed)
//   <Mama mood="happy" holdingPhone />   (her new smartphone)
//
// mood:    "happy" | "worried" | "proud" | "curious"
// talking: true = she nods gently while speaking
// ============================================================

import { useId } from "react";
import type { MamaMood } from "../types";
import HumanFace, { type Expression } from "./HumanFace";

const SKIN = "#8B5A3C";
const SKIN_SHADOW = "#6E4429";
const SKIN_LIGHT = "#A06A48";
const LINE = "#3A2A22";
const MAIZE = "#F2B544";
const SOIL = "#A4532F";
const LEAF = "#4C8E44";
const LEAF_DARK = "#2F6A2B";

const EXPRESSIONS: Record<MamaMood, Expression> = {
  happy: { eyes: "open", brows: "flat", mouth: "smile" },
  worried: { eyes: "open", brows: "worried", mouth: "frown" },
  proud: { eyes: "smile", brows: "flat", mouth: "grin" },
  curious: { eyes: "wide", brows: "raised", mouth: "o" },
};

const MOOD_WORDS: Record<MamaMood, string> = {
  happy: "smiling kindly",
  worried: "looking worried",
  proud: "looking proud",
  curious: "looking curious",
};

/** A bent forearm with a hand, from the elbow to the hand. */
function Forearm({ from, to }: { from: [number, number]; to: [number, number] }) {
  const d = `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return (
    <>
      <path d={d} stroke={SKIN_SHADOW} strokeWidth="11" strokeLinecap="round" />
      <path d={d} stroke={SKIN} strokeWidth="8.5" strokeLinecap="round" />
    </>
  );
}

function Hand({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx="5.6" ry="6.4" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
      <path d={`M${x - 3} ${y + 2} q3 2 6 0`} stroke={SKIN_SHADOW} strokeWidth="1" fill="none" />
    </g>
  );
}

interface MamaProps {
  mood?: MamaMood;
  size?: number;
  talking?: boolean;
  holdingNotebook?: boolean;
  holdingSeeds?: boolean;
  holdingPhone?: boolean;
  className?: string;
}

export default function Mama({
  mood = "happy",
  size = 170,
  talking = false,
  holdingNotebook = false,
  holdingSeeds = false,
  holdingPhone = false,
  className = "",
}: MamaProps) {
  // Each drawing needs its own pattern ids, so two Mamas on a page don't clash.
  const id = useId().replace(/:/g, "");
  const wrapPattern = `mama-wrap-${id}`;
  const dressPattern = `mama-dress-${id}`;
  const holding = holdingNotebook || holdingSeeds || holdingPhone;

  return (
    <svg
      className={`tm-character tm-human ${talking ? "tm-talking-nod" : ""} ${className}`}
      viewBox="0 0 160 260"
      width={size}
      height={size * 1.625}
      role="img"
      aria-label={`Mama Akinyi, a farmer in a yellow headwrap and green kitenge dress, ${MOOD_WORDS[mood]}${holdingNotebook ? ", holding her weather notebook" : holdingSeeds ? ", holding a bag of maize seed" : holdingPhone ? ", holding her new phone" : ""}`}
    >
      <defs>
        {/* Zigzags on the headwrap */}
        <pattern id={wrapPattern} width="10" height="8" patternUnits="userSpaceOnUse">
          <rect width="10" height="8" fill={MAIZE} />
          <path d="M0 6 l2.5 -3.5 l2.5 3.5 l2.5 -3.5 l2.5 3.5" stroke={SOIL} strokeWidth="1.3" fill="none" />
        </pattern>
        {/* Kitenge: dots and diamonds */}
        <pattern id={dressPattern} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={LEAF} />
          <circle cx="4" cy="4" r="1.9" fill={MAIZE} />
          <path d="M12 8 l3.5 3.5 l-3.5 3.5 l-3.5 -3.5 z" fill={LEAF_DARK} />
        </pattern>
      </defs>

      {/* Shadow on the ground */}
      <ellipse cx="80" cy="254" rx="40" ry="4.5" fill="#13303A" opacity="0.15" />

      {/* Feet in sandals */}
      <g className="tm-leg-l">
        <ellipse cx="66" cy="246" rx="7.5" ry="4" fill={SKIN} />
        <ellipse cx="66" cy="249" rx="10" ry="4" fill="#5E3721" />
      </g>
      <g className="tm-leg-r">
        <ellipse cx="94" cy="246" rx="7.5" ry="4" fill={SKIN} />
        <ellipse cx="94" cy="249" rx="10" ry="4" fill="#5E3721" />
      </g>

      {/* Neck */}
      <path d="M73 76 L73 96 Q80 101 87 96 L87 76 Z" fill={SKIN_SHADOW} />

      {/* Kitenge dress, with soft folds and a shaded side */}
      <path d="M44 94 C54 88 106 88 116 94 L124 142 L132 242 Q80 249 28 242 L36 142 Z" fill={`url(#${dressPattern})`} stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M104 96 L116 94 L124 142 L132 242 Q120 245 108 246 L112 150 Z" fill="#000000" opacity="0.12" />
      <path d="M62 152 L56 240 M98 152 L104 240" stroke="#000000" strokeWidth="1.4" opacity="0.15" fill="none" />
      {/* Round neckline */}
      <path d="M66 90 Q80 104 94 90" fill={SKIN} stroke={LINE} strokeWidth="1.4" />
      {/* Lesso wrap around the waist, tied at the side */}
      <path d="M34 150 Q80 140 126 152 L129 176 Q80 166 31 176 Z" fill={SOIL} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M36 158 Q80 149 125 160" stroke={MAIZE} strokeWidth="2" fill="none" strokeDasharray="5 4" />
      <path d="M118 160 q10 4 8 16 q-6 -6 -10 -8 z" fill={SOIL} stroke={LINE} strokeWidth="1.4" />

      {/* Sleeves (short, puffed kitenge sleeves) */}
      <path d="M46 92 Q30 96 30 114 L33 130 L49 126 L51 100 Z" fill={`url(#${dressPattern})`} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M114 92 Q130 96 130 114 L127 130 L111 126 L109 100 Z" fill={`url(#${dressPattern})`} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />

      {/* Arms */}
      {holding ? (
        <g className="tm-held-notebook">
          <Forearm from={[40, 128]} to={[62, 156]} />
          <Forearm from={[120, 128]} to={[98, 156]} />
          {holdingPhone ? (
            <g>
              {/* Her new smartphone, screen glowing */}
              <rect x="68" y="138" width="24" height="40" rx="4" fill="#1E2B36" stroke={LINE} strokeWidth="1.6" />
              <rect x="70.5" y="142" width="19" height="31" rx="2" fill="#8BE9F5" opacity="0.85" />
              <path d="M73 148 h12 M73 153 h9 M73 158 h12" stroke="#1B6E8E" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ) : holdingSeeds ? (
            <g>
              {/* A small sack of maize seed */}
              <path d="M60 150 Q57 186 80 188 Q103 186 100 150 Z" fill="#C9A26B" stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M61 151 Q80 143 99 151" stroke="#9C7A48" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M64 164 h32 M64 174 h32" stroke="#B8905A" strokeWidth="1.5" />
              {[74, 81, 87].map((x, i) => (
                <ellipse key={x} cx={x} cy={146 - (i % 2) * 2} rx="3" ry="2.2" fill="#F2D27A" stroke={LINE} strokeWidth="0.8" />
              ))}
            </g>
          ) : (
            <g transform="rotate(-5 80 152)">
              {/* Her old exercise book */}
              <rect x="58" y="136" width="44" height="32" rx="2" fill="#E9DDBF" stroke={LINE} strokeWidth="1.6" />
              <line x1="80" y1="136" x2="80" y2="168" stroke={LINE} strokeWidth="1.2" />
              <path d="M63 145 h13 M63 152 h13 M63 159 h10 M84 145 h13 M84 152 h13" stroke="#8FA8B2" strokeWidth="1.3" />
            </g>
          )}
          <Hand x={63} y={157} />
          <Hand x={97} y={157} />
        </g>
      ) : (
        <>
          <path d="M34 128 Q30 160 35 188 L43 188 Q46 160 47 126 Z" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
          <path d="M126 128 Q130 160 125 188 L117 188 Q114 160 113 126 Z" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
          <Hand x={39} y={193} />
          <Hand x={121} y={193} />
        </>
      )}

      {/* Head: nods when she talks */}
      <g className="tm-head">
        <g transform="translate(80 58) scale(1.08)">
          {/* Ears and gold earrings */}
          <ellipse cx="-19.5" cy="2" rx="3.6" ry="6" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <ellipse cx="19.5" cy="2" rx="3.6" ry="6" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.2" />
          <circle cx="-19.8" cy="10" r="2.6" fill="none" stroke="#D9A21E" strokeWidth="1.4" />
          <circle cx="19.8" cy="10" r="2.6" fill="none" stroke="#D9A21E" strokeWidth="1.4" />
          {/* Face, with a light on the forehead and shade under the jaw */}
          <ellipse cx="0" cy="2" rx="19" ry="23" fill={SKIN} stroke={SKIN_SHADOW} strokeWidth="1.4" />
          <ellipse cx="-5" cy="-9" rx="7" ry="4" fill={SKIN_LIGHT} opacity="0.5" />
          <path d="M-14 17 Q0 28 14 17 Q0 24 -14 17 Z" fill={SKIN_SHADOW} opacity="0.35" />
          <HumanFace {...EXPRESSIONS[mood]} wrinkles shadow={SKIN_SHADOW} />
          {/* Headwrap (duku), tied in a knot on top */}
          <path d="M-21 -4 C-23 -26 -10 -36 2 -36 C16 -36 25 -26 21 -4 C15 -12 8 -15 0 -15 C-8 -15 -16 -12 -21 -4 Z" fill={`url(#${wrapPattern})`} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M-16 -12 Q0 -22 16 -12 M-14 -25 Q2 -32 17 -24" stroke="#B07A1C" strokeWidth="1.2" fill="none" opacity="0.8" />
          <path d="M-12 -32 C-10 -47 14 -49 18 -34 C10 -40 -4 -40 -12 -32 Z" fill={`url(#${wrapPattern})`} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
