// ============================================================
// MAIZE PLANT
// ------------------------------------------------------------
// One maize plant at a growth stage. Its base sits at (x, y)
// and it grows upwards. Used in the backgrounds and on the farm.
//
//   bare     -> just a little mound of soil
//   sprouts  -> small green shoots
//   dried    -> shoots that turned brown (no rain came)
//   growing  -> knee-high
//   tall     -> fully grown, with a tassel on top
//   cobs     -> tall with cobs
//   golden   -> dry and golden, ready to harvest
// ============================================================

import type { CropStage } from "../types";

const GREEN = "#4C8E44";
const DARK_GREEN = "#2F6A2B";
const BROWN = "#9C6B3A";
const GOLD = "#D9B45A";
const SOIL = "#7A4A2E";
const MAIZE = "#F2B544";
const OUTLINE = "#13303A";

// A leaf: a curved shape starting at (sx, sy) going left or right
function Leaf({ sx, sy, dir, len, color }: { sx: number; sy: number; dir: 1 | -1; len: number; color: string }) {
  const ex = sx + dir * len;
  return (
    <path
      d={`M${sx} ${sy} Q${sx + dir * len * 0.5} ${sy - len * 0.55} ${ex} ${sy - len * 0.1} Q${sx + dir * len * 0.5} ${sy - len * 0.2} ${sx} ${sy}`}
      fill={color}
      stroke={OUTLINE}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}

interface MaizeProps {
  stage: CropStage;
  x: number;
  y: number;
  scale?: number;
  /** true = the plant sways gently in the wind */
  sway?: boolean;
}

export default function Maize({ stage, x, y, scale = 1, sway = false }: MaizeProps) {
  const mound = <ellipse cx="0" cy="0" rx="16" ry="5" fill={SOIL} />;
  let plant = null;

  if (stage === "sprouts" || stage === "dried") {
    const c = stage === "dried" ? BROWN : GREEN;
    plant = (
      <g>
        <line x1="0" y1="0" x2="0" y2="-16" stroke={c} strokeWidth="3" strokeLinecap="round" />
        {/* Dried shoots droop down */}
        <Leaf sx={0} sy={stage === "dried" ? -8 : -10} dir={-1} len={12} color={c} />
        <Leaf sx={0} sy={stage === "dried" ? -10 : -14} dir={1} len={12} color={c} />
      </g>
    );
  } else if (stage !== "bare") {
    const height = stage === "growing" ? 55 : 100;
    const stalk = stage === "golden" ? GOLD : GREEN;
    const leaf = stage === "golden" ? GOLD : stage === "growing" ? GREEN : DARK_GREEN;
    const leafCount = stage === "growing" ? 3 : 6;
    plant = (
      <g>
        <line x1="0" y1="0" x2="0" y2={-height} stroke={stalk} strokeWidth="5" strokeLinecap="round" />
        {Array.from({ length: leafCount }, (_, i) => (
          <Leaf
            key={i}
            sx={0}
            sy={-((i + 1) * height) / (leafCount + 1)}
            dir={i % 2 ? 1 : -1}
            len={stage === "growing" ? 22 : 30}
            color={leaf}
          />
        ))}
        {/* Tassel on top of tall plants */}
        {stage !== "growing" && (
          <path d={`M0 ${-height} l-6 -12 M0 ${-height} l0 -14 M0 ${-height} l6 -12`} stroke={stage === "golden" ? "#B08A3A" : MAIZE} strokeWidth="2.5" strokeLinecap="round" />
        )}
        {/* Cobs */}
        {(stage === "cobs" || stage === "golden") && (
          <>
            <ellipse cx="7" cy={-height * 0.5} rx="6" ry="13" fill={MAIZE} stroke={OUTLINE} strokeWidth="1.5" transform={`rotate(20 7 ${-height * 0.5})`} />
            <path d={`M2 ${-height * 0.4} q8 -6 11 -22`} stroke={stage === "golden" ? "#B08A3A" : GREEN} strokeWidth="3" fill="none" />
          </>
        )}
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {mound}
      {plant && (
        <g className="tm-grow" key={stage}>
          {/* Each plant starts swaying at a different moment, so the field looks natural */}
          <g className={sway ? "tm-sway" : undefined} style={sway ? { animationDelay: `${(x % 7) * -0.4}s` } : undefined}>
            {plant}
          </g>
        </g>
      )}
    </g>
  );
}
