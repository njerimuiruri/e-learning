// ============================================================
// SCENE BACKGROUNDS
// ------------------------------------------------------------
// The scenery behind the characters, drawn in SVG.
//   house -> morning outside Mama's house in Nyakach
//   farm  -> Mama's maize field, seen from the side
//   river -> the Nyando River in the evening (see RiverScene.tsx)
//
// "xMidYMax slice" means: always keep the bottom (the ground)
// visible and fill the whole box, cutting off the sides or top
// if needed. That way the characters always stand on the ground.
// ============================================================

import type { Setting } from "../types";
import Maize from "./Maize";
import RiverScene from "./RiverScene";

const OUTLINE = "#13303A";

export function Cloud({ x, y, scale = 1, className = "" }: { x: number; y: number; scale?: number; className?: string }) {
  return (
    <g className={className}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <path d="M0 40 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z" fill="#FFFFFF" />
      </g>
    </g>
  );
}

function SkyAndHills() {
  return (
    <>
      <rect width="1000" height="500" fill="#CDEAF5" />
      <circle cx="880" cy="80" r="40" fill="#F2B544" stroke="#E09A1F" strokeWidth="4" />
      <Cloud x={120} y={40} scale={1.4} className="tm-bg-cloud" />
      <Cloud x={560} y={70} scale={1} className="tm-bg-cloud tm-bg-cloud-slow" />
      {/* Birds flying across the sky */}
      <g className="tm-birds">
        <path d="M0 0 q8 -8 16 0 q8 -8 16 0" stroke="#13303A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M40 18 q6 -6 12 0 q6 -6 12 0" stroke="#13303A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M22 36 q5 -5 10 0 q5 -5 10 0" stroke="#13303A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Distant hills */}
      <path d="M0 300 C150 230 300 250 450 290 C600 330 760 230 1000 270 L1000 500 L0 500 Z" fill="#8CBF7A" />
      <path d="M0 330 C200 290 420 300 600 330 C780 360 880 300 1000 320 L1000 500 L0 500 Z" fill="#6FAE5F" />
    </>
  );
}

function HouseBackground() {
  return (
    <>
      <SkyAndHills />
      {/* Maize field behind the house */}
      {Array.from({ length: 14 }, (_, i) => (
        <Maize key={i} stage="tall" x={430 + i * 42} y={372} scale={0.75} sway />
      ))}

      {/* Mama's house: mud walls and an iron-sheet roof */}
      <g>
        <rect x="70" y="250" width="250" height="125" fill="#C98B5A" stroke={OUTLINE} strokeWidth="5" />
        <path d="M50 258 L195 180 L340 258 Z" fill="#AEB8BE" stroke={OUTLINE} strokeWidth="5" strokeLinejoin="round" />
        {/* Ridges on the iron sheets */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={80 + i * 29} y1={252} x2={195} y2={186} stroke="#8D989E" strokeWidth="2" />
        ))}
        <rect x="170" y="295" width="50" height="80" rx="4" fill="#A4532F" stroke={OUTLINE} strokeWidth="4" />
        <circle cx="208" cy="337" r="4" fill="#F2B544" />
        <rect x="95" y="285" width="50" height="40" fill="#5E7C88" stroke={OUTLINE} strokeWidth="4" />
        <line x1="120" y1="285" x2="120" y2="325" stroke={OUTLINE} strokeWidth="3" />
        <rect x="248" y="285" width="50" height="40" fill="#5E7C88" stroke={OUTLINE} strokeWidth="4" />
        <line x1="273" y1="285" x2="273" y2="325" stroke={OUTLINE} strokeWidth="3" />
      </g>

      {/* Ground */}
      <rect x="0" y="370" width="1000" height="130" fill="#D8B77E" />
      <rect x="0" y="366" width="1000" height="10" fill="#6FAE5F" />
    </>
  );
}

function FarmBackground() {
  return (
    <>
      <SkyAndHills />
      {/* Rows of maize */}
      {Array.from({ length: 20 }, (_, i) => (
        <Maize key={`b${i}`} stage="tall" x={20 + i * 50} y={360} scale={0.7} sway />
      ))}
      <rect x="0" y="362" width="1000" height="138" fill="#8A5A36" />
      {/* Furrows in the soil */}
      {[392, 430, 470].map((y) => (
        <path key={y} d={`M0 ${y} Q500 ${y - 8} 1000 ${y}`} stroke="#6E4428" strokeWidth="5" fill="none" />
      ))}
    </>
  );
}

export default function Background({ setting }: { setting: Setting }) {
  // The river is its own component (it is also used in the activities),
  // shown here behind the characters at a calm level with light rain.
  if (setting === "river") {
    return (
      <div className="tm-stage-bg" aria-hidden="true">
        <RiverScene level={1.3} rain={0.35} fit="cover" showReading={false} />
      </div>
    );
  }
  return (
    <svg className="tm-stage-bg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {setting === "farm" ? <FarmBackground /> : <HouseBackground />}
    </svg>
  );
}
