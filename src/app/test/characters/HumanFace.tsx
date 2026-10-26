// ============================================================
// HUMAN FACE  (shared by Mama Akinyi, Otieno and Baba Ochieng)
// ------------------------------------------------------------
// A more lifelike face: almond-shaped eyes with whites and brown
// irises, real eyebrows, a nose, lips, and (for older people)
// smile lines. Each character chooses an expression for each mood.
//
// It is drawn around (0, 0), the middle of the face. The character
// file moves and sizes it with a transform.
//
// Class names used by the animations:
//   tm-eyes  -> blinking      tm-mouth -> moving while talking
// ============================================================

export type EyeShape = "open" | "wide" | "smile" | "up";
export type BrowShape = "flat" | "worried" | "raised" | "one-up";
export type MouthShape = "smile" | "grin" | "frown" | "o" | "flat" | "side";

export interface Expression {
  eyes: EyeShape;
  brows: BrowShape;
  mouth: MouthShape;
}

interface HumanFaceProps extends Expression {
  /** Smile lines and crow's feet, for older people */
  wrinkles?: boolean;
  browColour?: string;
  lipColour?: string;
  shadow: string;
}

const LINE = "#2A1A10";

function Eye({ cx, shape }: { cx: number; shape: EyeShape }) {
  if (shape === "smile") {
    // Happy, crinkled-up eyes
    return <path d={`M${cx - 3.8} 0.8 Q${cx} -2.4 ${cx + 3.8} 0.8`} stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  }
  const open = shape === "wide" ? 3.4 : 2.7;
  const lookUp = shape === "up" ? -1 : 0;
  return (
    <g>
      <path d={`M${cx - 3.8} 0 Q${cx} ${-open} ${cx + 3.8} 0 Q${cx} ${open * 0.85} ${cx - 3.8} 0 Z`} fill="#FBF7F0" />
      <circle cx={cx + (shape === "up" ? 0.6 : 0)} cy={0.1 + lookUp} r={shape === "wide" ? 2.2 : 1.9} fill="#3B2416" />
      <circle cx={cx + (shape === "up" ? 0.6 : 0)} cy={0.1 + lookUp} r="0.9" fill="#100804" />
      <circle cx={cx + 0.7} cy={-0.6 + lookUp} r="0.55" fill="#FFFFFF" />
      {/* Upper eyelid */}
      <path d={`M${cx - 4} -0.2 Q${cx} ${-open - 0.8} ${cx + 4} -0.2`} stroke={LINE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Brows({ shape, colour }: { shape: BrowShape; colour: string }) {
  const brow = (side: -1 | 1, lift: number, tilt: number) => {
    // side -1 = left brow, 1 = right brow. tilt > 0 raises the inner end (worried).
    const outer = side * 11.5;
    const inner = side * 4.5;
    return (
      <path
        key={side}
        d={`M${outer} ${-6 - lift} Q${side * 8} ${-7.8 - lift - tilt * 0.3} ${inner} ${-6.6 - lift - tilt}`}
        stroke={colour}
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
      />
    );
  };
  switch (shape) {
    case "worried":
      return <>{[brow(-1, 0, 1.8), brow(1, 0, 1.8)]}</>;
    case "raised":
      return <>{[brow(-1, 1.8, 0), brow(1, 1.8, 0)]}</>;
    case "one-up":
      return <>{[brow(-1, 2, 0), brow(1, 0, -0.6)]}</>;
    default:
      return <>{[brow(-1, 0, 0), brow(1, 0, 0)]}</>;
  }
}

function Mouth({ shape, lips }: { shape: MouthShape; lips: string }) {
  switch (shape) {
    case "grin":
      return (
        <g className="tm-mouth">
          <path d="M-7.5 11.6 Q0 19.5 7.5 11.6 Z" fill="#4A2018" />
          <path d="M-6 12.2 Q0 14.2 6 12.2 L5.5 13.3 Q0 15.1 -5.5 13.3 Z" fill="#FBF7F0" />
          <path d="M-7.8 11.4 Q0 13.2 7.8 11.4" stroke={lips} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      );
    case "frown":
      return <path className="tm-mouth" d="M-6 14.2 Q0 11.6 6 14.2" stroke={lips} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "o":
      return <ellipse className="tm-mouth" cx="0" cy="13" rx="2.3" ry="2.9" fill="#4A2018" stroke={lips} strokeWidth="1.2" />;
    case "flat":
      return <path className="tm-mouth" d="M-5 13 Q0 13.6 5 13" stroke={lips} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "side":
      return <path className="tm-mouth" d="M-2.5 13.6 Q2.5 12.4 6 12.6" stroke={lips} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "smile":
    default:
      return (
        <g className="tm-mouth">
          <path d="M-7 12 Q0 17.2 7 12 Q0 14.8 -7 12 Z" fill={lips} />
          <path d="M-7.2 11.8 Q0 16.6 7.2 11.8" stroke="#3A1A12" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

export default function HumanFace({ eyes, brows, mouth, wrinkles = false, browColour = LINE, lipColour = "#6E3A2E", shadow }: HumanFaceProps) {
  return (
    <g>
      <Brows shape={brows} colour={browColour} />
      <g className="tm-eyes">
        <Eye cx={-8} shape={eyes} />
        <Eye cx={8} shape={eyes} />
      </g>
      {/* Nose */}
      <path d="M-0.6 -0.5 Q-1.6 4.2 -3.2 6.4 Q0 7.9 3.2 6.4" stroke={shadow} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Soft cheeks */}
      <ellipse cx="-10.5" cy="7" rx="3.6" ry="2.2" fill="#C0705A" opacity="0.28" />
      <ellipse cx="10.5" cy="7" rx="3.6" ry="2.2" fill="#C0705A" opacity="0.28" />
      {wrinkles && (
        <path
          d="M-6.4 8 Q-7.6 10.8 -6.4 13.4 M6.4 8 Q7.6 10.8 6.4 13.4 M-12.8 0.6 l-2.2 -1 M-12.8 1.9 l-2.2 0.7 M12.8 0.6 l2.2 -1 M12.8 1.9 l2.2 0.7"
          stroke={shadow}
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}
      <Mouth shape={mouth} lips={lipColour} />
    </g>
  );
}
