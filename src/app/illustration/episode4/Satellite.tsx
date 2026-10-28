// ============================================================
// SATELLITE
// ------------------------------------------------------------
// A small cartoon satellite with solar panels, drifting gently.
// Tumaini's face glows on its body: Tumaini has "become" the
// satellite looking down at the land.
// ============================================================

const OUTLINE = "#13303A";

export default function Satellite({ size = 150, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`tm-satellite ${className}`} viewBox="0 0 200 90" width={size} height={size * 0.45} role="img" aria-label="Tumaini as a satellite, drifting in space and looking down">
      {/* Solar panels */}
      {[8, 132].map((x) => (
        <g key={x}>
          <rect x={x} y="28" width="60" height="30" rx="3" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="3" />
          {[1, 2].map((i) => (
            <line key={i} x1={x + i * 20} y1="28" x2={x + i * 20} y2="58" stroke="#8BE9F5" strokeWidth="1.5" />
          ))}
          <line x1={x} y1="43" x2={x + 60} y2="43" stroke="#8BE9F5" strokeWidth="1.5" />
        </g>
      ))}
      <line x1="68" y1="43" x2="132" y2="43" stroke={OUTLINE} strokeWidth="4" />
      {/* Body with Tumaini's face */}
      <rect x="76" y="18" width="48" height="50" rx="12" fill="#F2B544" stroke={OUTLINE} strokeWidth="3" />
      <rect x="83" y="26" width="34" height="26" rx="7" fill="#0E2A33" />
      <path d="M89 38 q4 -5 8 0 M103 38 q4 -5 8 0 M93 44 q7 5 14 0" stroke="#8BE9F5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Camera looking down */}
      <rect x="92" y="68" width="16" height="10" rx="3" fill="#5E6E7B" stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="100" cy="80" r="4" fill="#8BE9F5" stroke={OUTLINE} strokeWidth="2" />
      {/* Antenna */}
      <line x1="100" y1="18" x2="100" y2="6" stroke={OUTLINE} strokeWidth="3" />
      <circle className="tm-antenna-light" cx="100" cy="5" r="4" fill="#F2B544" stroke={OUTLINE} strokeWidth="2" />
    </svg>
  );
}
