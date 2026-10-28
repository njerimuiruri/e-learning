// ============================================================
// WEATHER SIGN ICONS
// ------------------------------------------------------------
// Simple drawings for the signs in Mama's notebook, plus
// "it rained" (a raindrop) and "it stayed dry" (a sun).
// ============================================================

const OUTLINE = "#13303A";

export type IconId = "clouds" | "ants" | "wind" | "rain" | "sun";

const LABELS: Record<IconId, string> = {
  clouds: "Dark clouds",
  ants: "Ants flying",
  wind: "Wind from the lake",
  rain: "It rained",
  sun: "It stayed dry",
};

function Drawing({ id }: { id: IconId }) {
  switch (id) {
    case "clouds":
      return (
        <>
          <path d="M12 44 a10 10 0 0 1 3 -19 a14 14 0 0 1 26 -4 a11 11 0 0 1 18 9 a8 8 0 0 1 -1 14 Z" fill="#5B6670" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 52 l-3 7 M32 52 l-3 7 M44 52 l-3 7" stroke="#5B6670" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "ants":
      // A flying ant (kumbi kumbi) with two wings
      return (
        <>
          <ellipse cx="22" cy="24" rx="12" ry="7" fill="#DDF0F7" stroke={OUTLINE} strokeWidth="2.5" transform="rotate(-30 22 24)" />
          <ellipse cx="42" cy="24" rx="12" ry="7" fill="#DDF0F7" stroke={OUTLINE} strokeWidth="2.5" transform="rotate(30 42 24)" />
          <circle cx="32" cy="28" r="5" fill="#5E3721" stroke={OUTLINE} strokeWidth="2" />
          <ellipse cx="32" cy="38" rx="5" ry="6" fill="#5E3721" stroke={OUTLINE} strokeWidth="2" />
          <ellipse cx="32" cy="51" rx="6" ry="8" fill="#5E3721" stroke={OUTLINE} strokeWidth="2" />
          <path d="M29 24 l-4 -8 M35 24 l4 -8" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "wind":
      return (
        <path
          d="M6 22 H38 a7 7 0 1 0 -7 -7 M6 34 H50 a7 7 0 1 1 -7 7 M10 46 H30"
          stroke="#1B6E8E"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "rain":
      return (
        <path d="M32 6 C32 6 14 28 14 40 a18 18 0 0 0 36 0 C50 28 32 6 32 6 Z" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="3" />
      );
    case "sun":
      return (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="32" y1="4" x2="32" y2="12" stroke="#E09A1F" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="14" fill="#F2B544" stroke={OUTLINE} strokeWidth="3" />
        </>
      );
  }
}

interface SignIconProps {
  id: IconId;
  size?: number;
  decorative?: boolean;
  /** Position, when the icon is placed inside another SVG drawing */
  x?: number;
  y?: number;
}

export default function SignIcon({ id, size = 48, decorative = false, x, y }: SignIconProps) {
  return (
    <svg
      x={x}
      y={y}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : LABELS[id]}
      aria-hidden={decorative ? true : undefined}
    >
      <Drawing id={id} />
    </svg>
  );
}
