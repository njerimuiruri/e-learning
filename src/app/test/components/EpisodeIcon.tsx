// ============================================================
// EPISODE ICONS
// ------------------------------------------------------------
// Small drawings shown on each episode card.
// The "name" matches the "icon" field in episodes.ts.
// ============================================================

import type { ReactNode } from "react";
import type { IconName } from "../types";

const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const SOIL = "#A4532F";
const LEAF = "#4C8E44";
const OUTLINE = "#13303A";

const ICONS: Record<IconName, { label: string; draw: ReactNode }> = {
  // The Earth, with a thermometer
  globe: {
    label: "The Earth with a thermometer",
    draw: (
      <>
        <circle cx="28" cy="34" r="22" fill={LAKE} stroke={OUTLINE} strokeWidth="3" />
        <path d="M14 22 q8 -4 12 2 q4 8 -4 12 q-6 4 -4 12 M34 16 q10 4 8 14 q-2 8 6 10" fill={LEAF} stroke={OUTLINE} strokeWidth="2" />
        <rect x="48" y="8" width="10" height="38" rx="5" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="51" y="24" width="4" height="22" fill="#E0533D" />
        <circle cx="53" cy="50" r="7" fill="#E0533D" stroke={OUTLINE} strokeWidth="2.5" />
      </>
    ),
  },

  // An open notebook with a raindrop
  notebook: {
    label: "An open notebook with a raindrop",
    draw: (
      <>
        <path d="M8 18 L32 22 L32 56 L8 52 Z" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M56 18 L32 22 L32 56 L56 52 Z" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <line x1="13" y1="30" x2="27" y2="32" stroke="#9FB7BF" strokeWidth="2" />
        <line x1="13" y1="38" x2="27" y2="40" stroke="#9FB7BF" strokeWidth="2" />
        <line x1="37" y1="32" x2="51" y2="30" stroke="#9FB7BF" strokeWidth="2" />
        <path d="M44 4 C44 4 36 14 36 19 a8 8 0 0 0 16 0 C52 14 44 4 44 4 Z" fill={LAKE} stroke={OUTLINE} strokeWidth="2.5" />
      </>
    ),
  },

  // A river gauge (measuring post) with rising water
  gauge: {
    label: "A river gauge with rising water",
    draw: (
      <>
        <rect x="24" y="4" width="16" height="50" rx="3" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" />
        {[12, 20, 28, 36, 44].map((y) => (
          <line key={y} x1="24" y1={y} x2={y % 16 === 12 ? 34 : 31} y2={y} stroke={OUTLINE} strokeWidth="2" />
        ))}
        <rect x="28" y="2" width="8" height="8" rx="2" fill="#E0533D" />
        <path d="M2 40 q8 -6 15 0 t15 0 t15 0 t15 0 L62 62 L2 62 Z" fill={LAKE} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M50 30 l6 -8 l6 8 M56 22 v14" stroke={SOIL} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },

  // A small tree with branches
  tree: {
    label: "A small tree with branches",
    draw: (
      <>
        <path d="M32 60 L32 30 M32 42 L18 28 M32 36 L46 22" stroke={SOIL} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="18" cy="24" r="9" fill={LEAF} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="46" cy="18" r="9" fill={LEAF} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="32" cy="16" r="11" fill={LEAF} stroke={OUTLINE} strokeWidth="2.5" />
        <line x1="14" y1="60" x2="50" y2="60" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },

  // A satellite with two solar panels
  satellite: {
    label: "A satellite with solar panels",
    draw: (
      <g transform="rotate(-30 32 32)">
        <rect x="2" y="24" width="18" height="16" rx="2" fill={LAKE} stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="44" y="24" width="18" height="16" rx="2" fill={LAKE} stroke={OUTLINE} strokeWidth="2.5" />
        <line x1="11" y1="24" x2="11" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="53" y1="24" x2="53" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="20" y1="32" x2="44" y2="32" stroke={OUTLINE} strokeWidth="3" />
        <rect x="24" y="22" width="16" height="20" rx="4" fill={MAIZE} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M32 42 L32 50 M26 56 a8 6 0 0 1 12 0" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },

  // A shield with a tick
  shield: {
    label: "A shield with a tick mark",
    draw: (
      <>
        <path d="M32 4 L54 12 L54 30 C54 46 42 56 32 60 C22 56 10 46 10 30 L10 12 Z" fill={LEAF} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M21 32 L29 40 L44 23" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

export default function EpisodeIcon({ name, size = 60 }: { name: IconName; size?: number }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={icon.label}>
      {icon.draw}
    </svg>
  );
}
