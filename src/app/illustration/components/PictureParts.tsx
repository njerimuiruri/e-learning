// ============================================================
// PICTURE PARTS
// ------------------------------------------------------------
// Small drawings used inside the explaining pictures of every
// episode: an arrow, a tick, a cross and a mini Tumaini.
// Things with the class "tm-pop" pop in (see motion.css);
// "delay" says how many seconds to wait first.
// ============================================================

const OUTLINE = "#13303A";
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const LEAF = "#4C8E44";
const RED = "#E0533D";

export function Arrow({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <path
      className="tm-pop"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y} h26 m-9 -9 l9 9 l-9 9`}
      stroke={OUTLINE}
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function Tick({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy={y} r="14" fill={LEAF} stroke={OUTLINE} strokeWidth="3" />
      <path d={`M${x - 6} ${y} l4 5 l8 -10`} stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Cross({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy={y} r="14" fill={RED} stroke={OUTLINE} strokeWidth="3" />
      <path d={`M${x - 6} ${y - 6} l12 12 m0 -12 l-12 12`} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

export function MiniRobot({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-30" x2="0" y2="-40" stroke={OUTLINE} strokeWidth="3" />
      <circle className="tm-antenna-light" cx="0" cy="-42" r="4" fill={MAIZE} stroke={OUTLINE} strokeWidth="2" />
      <rect x="-24" y="-30" width="48" height="36" rx="12" fill={LAKE} stroke={OUTLINE} strokeWidth="3" />
      <rect x="-17" y="-24" width="34" height="24" rx="7" fill="#0E2A33" />
      <path d="M-10 -12 q4 -6 8 0 M2 -12 q4 -6 8 0 M-6 -5 q6 5 12 0" stroke="#8BE9F5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="-20" y="8" width="40" height="26" rx="10" fill={LAKE} stroke={OUTLINE} strokeWidth="3" />
    </g>
  );
}
