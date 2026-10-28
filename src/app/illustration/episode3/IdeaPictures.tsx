// ============================================================
// EPISODE 3 IDEA PICTURES
// ------------------------------------------------------------
// Small pictures that pop up beside a speech bubble, so people
// can SEE the idea. Same pattern as Episodes 1 and 2.
// Add the name to Episode3PictureId in types.ts to use a new one.
// ============================================================

import type { Episode3PictureId, IdeaPicture } from "../types";
import { Arrow, Cross } from "../components/PictureParts";

const OUTLINE = "#13303A";
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const SOIL = "#8A5A36";
const LEAF = "#4C8E44";

// ---------- Small drawings used below ----------
function Cloud({ x, y, s = 1, fill = "#9FB7BF" }: { x: number; y: number; s?: number; fill?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 20 a8 8 0 0 1 2 -15 a11 11 0 0 1 20 -3 a9 9 0 0 1 16 6 a6 6 0 0 1 2 12 Z" fill={fill} stroke={OUTLINE} strokeWidth={2 / s} />;
}
function Sun({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={x} y1={y - r - 8} x2={x} y2={y - r - 3} stroke="#E09A1F" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 45} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill={MAIZE} stroke={OUTLINE} strokeWidth="2.5" />
    </g>
  );
}
function Drop({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -14 C0 -14 -9 -3 -9 3 a9 9 0 0 0 18 0 C9 -3 0 -14 0 -14 Z" fill={LAKE} stroke={OUTLINE} strokeWidth={2 / s} />;
}
function QBox({ x, y, text, delay = 0, fill = "#9BD48A" }: { x: number; y: number; text: string; delay?: number; fill?: string }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <rect x={x - 44} y={y - 15} width="88" height="30" rx="15" fill={fill} stroke={OUTLINE} strokeWidth="2.5" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill={OUTLINE}>{text}</text>
    </g>
  );
}

export const EPISODE3_PICTURES: Record<Episode3PictureId, IdeaPicture> = {
  "plant-timing": {
    caption: "Too early: the seeds dry out · Too late: the rain is missed",
    label: "Two pictures. Too early: hot sun on dry soil and seeds that die. Too late: the rain clouds have already gone",
    draw: (
      <>
        <rect width="120" height="160" fill="#FCEFD0" />
        <rect x="120" width="120" height="160" fill="#E6F3F8" />
        <line x1="120" y1="0" x2="120" y2="160" stroke={OUTLINE} strokeWidth="3" />
        <text x="60" y="22" textAnchor="middle" fontSize="15" fontWeight="900" fill={OUTLINE}>Too early</text>
        <text x="180" y="22" textAnchor="middle" fontSize="15" fontWeight="900" fill={OUTLINE}>Too late</text>
        {/* Too early: hot sun, cracked soil */}
        <g className="tm-sun-pulse"><Sun x={60} y={60} /></g>
        <rect y="110" width="120" height="50" fill="#B98A5A" />
        <path d="M14 120 l12 10 l-4 12 M70 116 l-8 14 l10 10" stroke="#7A5232" strokeWidth="2.5" fill="none" />
        <Cross x={92} y={132} delay={0.5} />
        {/* Too late: the rain clouds are leaving */}
        <g className="tm-pop" style={{ animationDelay: "0.4s" }}>
          <Cloud x={186} y={40} s={1.1} />
          <Arrow x={186} y={86} delay={0.7} />
        </g>
        <rect x="120" y="110" width="120" height="50" fill="#9C7A55" />
        <path d="M160 112 v-18 q-8 -2 -12 6 M160 100 q8 -4 12 2" stroke="#9C6B3A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Cross x={214} y={132} delay={1} />
      </>
    ),
  },

  "three-questions": {
    caption: "Mama's 3 questions: rains? soil? dry spell?",
    label: "Three pictures with question marks: rain clouds, wet soil, and a hot sun for a dry spell",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        {[
          { x: 40, label: "Rains started?", draw: <Cloud x={20} y={46} s={1} /> },
          { x: 120, label: "Soil moist?", draw: <><rect x={100} y={70} width="40" height="18" rx="4" fill={SOIL} stroke={OUTLINE} strokeWidth="2" /><Drop x={120} y={58} s={1.1} /></> },
          { x: 200, label: "Dry spell?", draw: <Sun x={200} y={66} r={13} /> },
        ].map((q, i) => (
          <g key={q.label} className="tm-pop" style={{ animationDelay: `${i * 0.35}s` }}>
            {q.draw}
            <text x={q.x} y="34" textAnchor="middle" fontSize="26" fontWeight="900" fill={LAKE} stroke={OUTLINE} strokeWidth="1">?</text>
            <text x={q.x} y="118" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>{q.label}</text>
          </g>
        ))}
        <text x="120" y="148" textAnchor="middle" fontSize="13" fontWeight="900" fill={LEAF}>→ plant, or wait?</text>
      </>
    ),
  },

  "doctor-questions": {
    caption: "Each answer leads to the next question, until the doctor decides",
    label: "A chain: Fever? Yes. Sore throat? Yes. Then the doctor decides",
    draw: (
      <>
        <rect width="240" height="160" fill="#F4FBF1" />
        <QBox x={56} y={30} text="Fever?" />
        <text className="tm-pop" style={{ animationDelay: "0.4s" }} x="72" y="62" fontSize="12" fontWeight="900" fill={LEAF}>Yes ↓</text>
        <QBox x={120} y={80} text="Sore throat?" delay={0.6} />
        <text className="tm-pop" style={{ animationDelay: "1s" }} x="136" y="112" fontSize="12" fontWeight="900" fill={LEAF}>Yes ↓</text>
        <g className="tm-pop" style={{ animationDelay: "1.2s" }}>
          <rect x="138" y="122" width="96" height="32" rx="16" fill={MAIZE} stroke={OUTLINE} strokeWidth="2.5" />
          <text x="186" y="143" textAnchor="middle" fontSize="13" fontWeight="900" fill={OUTLINE}>Decision!</text>
        </g>
        {/* A red cross for the clinic */}
        <g className="tm-pop" style={{ animationDelay: "0.2s" }}>
          <rect x="176" y="14" width="44" height="44" rx="8" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.5" />
          <path d="M198 22 v28 M184 36 h28" stroke="#E0533D" strokeWidth="8" />
        </g>
      </>
    ),
  },
};
