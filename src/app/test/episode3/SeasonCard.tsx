// ============================================================
// SEASON CARD
// ------------------------------------------------------------
// One of Mama's past seasons: the three answers as ✓ or ✗,
// and the result: a full maize cob ("Good harvest") or a dry,
// broken plant ("Poor harvest").
//
//   <SeasonCard season={season} />           the full card
//   <SeasonCard season={season} compact />   a small chip (for piles)
// ============================================================

import type { CSSProperties } from "react";
import type { Season } from "./treeMath";

const OUTLINE = "#13303A";

// ---------- Little icons ----------
export function RainIcon({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M7 18 a6 6 0 0 1 2 -11 a8 8 0 0 1 14 -1 a6 6 0 0 1 3 12 Z" fill="#9FB7BF" stroke={OUTLINE} strokeWidth="2" />
      <path d="M10 22 l-2 6 M16 22 l-2 6 M22 22 l-2 6" stroke="#1B6E8E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SoilIcon({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect x="3" y="16" width="26" height="12" rx="3" fill="#8A5A36" stroke={OUTLINE} strokeWidth="2" />
      <path d="M16 3 C16 3 10 10 10 13 a6 6 0 0 0 12 0 C22 10 16 3 16 3 Z" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}

export function DrySpellIcon({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1="16" y1="2" x2="16" y2="6" stroke="#E09A1F" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${i * 45} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="8" fill="#F2B544" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}

export function GoodHarvestIcon({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <path d="M12 34 Q8 22 14 10 M28 34 Q32 22 26 10" stroke="#4C8E44" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="20" rx="7" ry="15" fill="#F2B544" stroke={OUTLINE} strokeWidth="2" />
      {[10, 15, 20, 25, 30].map((y) => (
        <line key={y} x1="14" y1={y} x2="26" y2={y} stroke="#C98B1E" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export function PoorHarvestIcon({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <rect x="4" y="32" width="32" height="5" rx="2" fill="#B98A5A" />
      <path d="M20 33 L20 20 L28 12" stroke="#9C6B3A" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 26 q-8 2 -12 8 M21 20 q6 0 8 6" stroke="#B98A5A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ---------- The card ----------
const ROWS = [
  { key: "rains" as const, label: "Rains started", Icon: RainIcon },
  { key: "moist" as const, label: "Soil moist", Icon: SoilIcon },
  { key: "drySpell" as const, label: "Dry spell forecast", Icon: DrySpellIcon },
];

interface SeasonCardProps {
  season: Season;
  compact?: boolean;
  className?: string;
  /** Extra styles, e.g. a delay so cards slide in one after another */
  style?: CSSProperties;
}

export default function SeasonCard({ season, compact = false, className = "", style }: SeasonCardProps) {
  const result = season.good ? "Good harvest" : "Poor harvest";
  const answers = ROWS.map((r) => `${r.label}: ${season[r.key] ? "yes" : "no"}`).join(", ");

  if (compact) {
    return (
      <span
        className={`tm-season-chip ${season.good ? "is-good" : "is-poor"} ${className}`}
        title={`Season ${season.id}: ${result}`}
        aria-label={`Season ${season.id}: ${result}`}
      >
        {season.good ? <GoodHarvestIcon size={22} /> : <PoorHarvestIcon size={22} />}
        <span>{season.id}</span>
      </span>
    );
  }

  return (
    <div style={style} className={`tm-season-card ${season.good ? "is-good" : "is-poor"} ${className}`} role="group" aria-label={`Season ${season.id}. ${answers}. ${result}.`}>
      <p className="tm-season-title" aria-hidden="true">
        Season {season.id}
      </p>
      <ul className="tm-season-answers" aria-hidden="true">
        {ROWS.map(({ key, label, Icon }) => (
          <li key={key} title={label}>
            <Icon />
            <strong className={season[key] ? "is-yes" : "is-no"}>{season[key] ? "✓" : "✗"}</strong>
          </li>
        ))}
      </ul>
      <p className="tm-season-result" aria-hidden="true">
        {season.good ? <GoodHarvestIcon /> : <PoorHarvestIcon />}
        <span>{result}</span>
      </p>
    </div>
  );
}

/** The key that explains the three icons, shown once above a grid of cards. */
export function SeasonCardKey() {
  return (
    <div className="tm-season-key" aria-hidden="true">
      {ROWS.map(({ key, label, Icon }) => (
        <span key={key}>
          <Icon size={22} /> {label}
        </span>
      ))}
    </div>
  );
}
