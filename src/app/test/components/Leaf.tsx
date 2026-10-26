// ============================================================
// MAIZE LEAF
// ------------------------------------------------------------
// One maize leaf, drawn from two numbers:
//
//   <Leaf spots={4} yellowness={0.55} size={200} />
//
// spots:      0–8 brown dots (more spots = looks sicker)
// yellowness: 0 = fresh green, 1 = yellow-brown
//
// These are the same two numbers Tumaini uses to sort leaves
// in Scene 4, so what you SEE matches what Tumaini "measures".
// ============================================================

const OUTLINE = "#13303A";

// Three colours to blend between: fresh green → yellow-green → yellow-brown
const COLOUR_STOPS: [number, number, number][] = [
  [79, 160, 67],
  [190, 182, 64],
  [168, 118, 44],
];

/** Mixes the leaf colour for a yellowness between 0 and 1. */
export function leafColour(yellowness: number) {
  const t = Math.max(0, Math.min(1, yellowness)) * 2; // 0–2 across the two halves
  const i = Math.min(1, Math.floor(t));
  const f = t - i;
  const [a, b] = [COLOUR_STOPS[i], COLOUR_STOPS[i + 1]];
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

// Where the spots go, in order (the 1st spot, the 2nd spot, …)
const SPOT_PLACES = [
  { x: 70, y: 34, r: 6 },
  { x: 120, y: 46, r: 7 },
  { x: 150, y: 30, r: 5 },
  { x: 95, y: 52, r: 5 },
  { x: 172, y: 44, r: 6 },
  { x: 48, y: 46, r: 5 },
  { x: 132, y: 34, r: 5 },
  { x: 192, y: 40, r: 4 },
];

function describe(spots: number, yellowness: number) {
  const colour = yellowness < 0.3 ? "fresh green" : yellowness < 0.6 ? "a little yellow" : "very yellow";
  return `A maize leaf, ${colour}, with ${spots} brown spot${spots === 1 ? "" : "s"}`;
}

interface LeafProps {
  spots: number;
  yellowness: number;
  size?: number;
  className?: string;
  /** false = hide from screen readers (when the words are shown elsewhere) */
  labelled?: boolean;
}

export default function Leaf({ spots, yellowness, size = 220, className = "", labelled = true }: LeafProps) {
  const count = Math.max(0, Math.min(8, Math.round(spots)));
  return (
    <svg
      className={`tm-leaf ${className}`}
      viewBox="0 0 230 84"
      width={size}
      height={size * (84 / 230)}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? describe(count, yellowness) : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {/* Stalk */}
      <rect x="2" y="37" width="16" height="8" rx="3" fill="#6E8F3A" stroke={OUTLINE} strokeWidth="2.5" />
      {/* Leaf shape: wide at the base, pointed at the tip */}
      <path
        d="M14 41 Q60 4 140 16 Q200 26 226 42 Q200 58 140 66 Q60 78 14 41 Z"
        fill={leafColour(yellowness)}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Middle vein and side veins */}
      <path d="M16 41 Q120 36 222 42" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 39 q14 -10 30 -14 M100 38 q14 -10 30 -12 M60 43 q14 10 30 14 M100 44 q14 10 30 12" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      {/* Brown spots */}
      {SPOT_PLACES.slice(0, count).map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r + 2.5} fill="#C99B4A" opacity="0.7" />
          <circle cx={s.x} cy={s.y} r={s.r} fill="#6B3F1E" />
        </g>
      ))}
    </svg>
  );
}
