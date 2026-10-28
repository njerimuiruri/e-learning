// ============================================================
// EPISODE 2 IDEA PICTURES
// ------------------------------------------------------------
// Small pictures that pop up beside a speech bubble, so people
// can SEE the idea. Same pattern as episode1/IdeaPictures.tsx.
// Add the name to Episode2PictureId in types.ts to use a new one.
// ============================================================

import type { Episode2PictureId, IdeaPicture } from "../types";
import { Cross, Tick } from "../components/PictureParts";

const OUTLINE = "#13303A";
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const SOIL = "#A4532F";
const RED = "#E0533D";

// A small maize leaf for pictures: (x, y) is its base, "spots" brown dots
function MiniLeaf({ x, y, colour, spots = 0, delay = 0, angle = 0 }: { x: number; y: number; colour: string; spots?: number; delay?: number; angle?: number }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        <path d="M0 0 Q20 -16 50 -12 Q70 -8 80 0 Q70 8 50 12 Q20 16 0 0 Z" fill={colour} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M2 0 H76" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" />
        {[18, 34, 50, 62].slice(0, spots).map((sx, i) => (
          <circle key={sx} cx={sx} cy={i % 2 ? 4 : -4} r="3.5" fill="#6B3F1E" />
        ))}
      </g>
    </g>
  );
}

export const EPISODE2_PICTURES: Record<Episode2PictureId, IdeaPicture> = {
  "spreading-disease": {
    caption: "One sick plant can spread disease to the whole field",
    label: "A sick leaf with brown spots, and arrows showing the disease spreading to healthy leaves",
    draw: (
      <>
        <rect width="240" height="160" fill="#EAF6E6" />
        <MiniLeaf x={12} y={50} colour="#B5A23C" spots={4} />
        <text x="52" y="86" textAnchor="middle" fontSize="12" fontWeight="800" fill={SOIL}>sick</text>
        <path className="tm-pop" style={{ animationDelay: "0.4s" }} d="M100 50 C120 30 140 30 150 40 m-8 -8 l8 8 l-10 4" stroke={RED} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path className="tm-pop" style={{ animationDelay: "0.6s" }} d="M100 60 C120 90 140 110 150 112 m-10 -8 l10 8 l-10 4" stroke={RED} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <MiniLeaf x={152} y={34} colour="#8DBF4A" spots={1} delay={0.8} angle={-10} />
        <MiniLeaf x={152} y={110} colour="#8DBF4A" spots={1} delay={1} angle={10} />
      </>
    ),
  },

  "photo-check": {
    caption: "Take a photo → Tumaini says: healthy or sick",
    label: "A phone taking a photo of a leaf, and the answer: sick, 92 percent sure",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        <rect x="70" y="6" width="100" height="148" rx="16" fill="#1E2B36" stroke={OUTLINE} strokeWidth="3" />
        <rect x="78" y="20" width="84" height="80" rx="6" fill="#EAF6E6" />
        <MiniLeaf x={82} y={60} colour="#B5A23C" spots={3} angle={0} />
        {/* Camera focus corners */}
        <path d="M84 28 h10 M84 28 v10 M156 28 h-10 M156 28 v10 M84 92 h10 M84 92 v-10 M156 92 h-10 M156 92 v-10" stroke={MAIZE} strokeWidth="3" />
        <g className="tm-pop" style={{ animationDelay: "0.8s" }}>
          <rect x="78" y="106" width="84" height="38" rx="8" fill="#FBE9DA" stroke={SOIL} strokeWidth="2.5" />
          <text x="120" y="122" textAnchor="middle" fontSize="13" fontWeight="900" fill={SOIL}>SICK</text>
          <text x="120" y="138" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>92% sure</text>
        </g>
      </>
    ),
  },

  "tomato-sorting": {
    caption: "Sort enough tomatoes → you can tell good from rotten at a glance",
    label: "Two crates: one with good red tomatoes and a tick, one with rotten brown tomatoes and a cross",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFF8EC" />
        {[
          { x: 18, colour: "#E0533D", label: "good", good: true },
          { x: 130, colour: "#7A5A3A", label: "rotten", good: false },
        ].map((crate, c) => (
          <g key={crate.label}>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle
                key={i}
                className="tm-pop"
                style={{ animationDelay: `${c * 0.6 + i * 0.1}s` }}
                cx={crate.x + 18 + (i % 3) * 28 + (i > 2 ? 14 : 0)}
                cy={i > 2 ? 62 : 82}
                r="13"
                fill={crate.colour}
                stroke={OUTLINE}
                strokeWidth="2.5"
              />
            ))}
            <rect x={crate.x} y="84" width="92" height="40" rx="4" fill="#C9A26B" stroke={OUTLINE} strokeWidth="3" />
            <line x1={crate.x} y1="104" x2={crate.x + 92} y2="104" stroke="#9C7A48" strokeWidth="3" />
            <text x={crate.x + 46} y="146" textAnchor="middle" fontSize="13" fontWeight="900" fill={OUTLINE}>{crate.label}</text>
          </g>
        ))}
        <Tick x={104} y={30} delay={0.5} />
        <Cross x={218} y={30} delay={1.1} />
      </>
    ),
  },

  "ask-expert": {
    caption: "Not sure? Ask the extension officer",
    label: "An extension officer with a clipboard looking at a leaf that has a question mark",
    draw: (
      <>
        <rect width="240" height="160" fill="#EAF6E6" />
        {/* The officer */}
        <g className="tm-pop">
          <circle cx="70" cy="46" r="18" fill="#6E4529" stroke={OUTLINE} strokeWidth="3" />
          <path d="M52 40 q18 -20 36 0 z" fill="#2F6A2B" stroke={OUTLINE} strokeWidth="2.5" />
          <rect x="44" y="66" width="52" height="64" rx="12" fill="#4C8E44" stroke={OUTLINE} strokeWidth="3" />
          <rect x="84" y="80" width="26" height="34" rx="3" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.5" />
          <path d="M89 90 h16 M89 98 h16 M89 106 h10" stroke="#9FB7BF" strokeWidth="2" />
          <text x="70" y="148" textAnchor="middle" fontSize="11" fontWeight="900" fill={OUTLINE}>extension officer</text>
        </g>
        <MiniLeaf x={130} y={90} colour="#B5A23C" spots={2} delay={0.5} angle={-15} />
        <text className="tm-wobble" x="200" y="64" textAnchor="middle" fontSize="44" fontWeight="900" fill={LAKE} stroke={OUTLINE} strokeWidth="1.5">?</text>
      </>
    ),
  },

  "flooded-house": {
    caption: "Last year: the river came into the house at night",
    label: "At night, brown flood water is halfway up the walls of a house",
    draw: (
      <>
        <rect width="240" height="160" fill="#2E3B46" />
        <circle cx="200" cy="30" r="14" fill="#F4F1E6" />
        <rect x="60" y="60" width="110" height="70" fill="#C98B5A" stroke={OUTLINE} strokeWidth="3" />
        <path d="M48 64 L115 28 L182 64 Z" fill="#AEB8BE" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <rect x="100" y="86" width="26" height="44" fill={SOIL} stroke={OUTLINE} strokeWidth="2.5" />
        {/* The flood water rises up the walls */}
        <g className="tm-river-rise">
          <path d="M0 104 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 L240 160 L0 160 Z" fill="#7A6A4F" opacity="0.92" />
        </g>
        <Cross x={206} y={120} delay={0.6} />
      </>
    ),
  },

  "storm-notebook": {
    caption: "10 years of storms: hours of rain → how high the river rose",
    label: "Baba's notebook. Each row shows the hours of heavy rain and how high the river rose",
    draw: (
      <>
        <rect x="20" y="8" width="200" height="144" rx="8" fill="#F1E6C8" stroke={OUTLINE} strokeWidth="3" />
        <text x="120" y="32" textAnchor="middle" fontSize="15" fontWeight="900" fill={OUTLINE}>
          STORMS
        </text>
        <text x="70" y="52" textAnchor="middle" fontSize="12" fontWeight="800" fill={SOIL}>hours of rain</text>
        <text x="172" y="52" textAnchor="middle" fontSize="12" fontWeight="800" fill={SOIL}>river height</text>
        {[
          ["3 h", "1.9 m"],
          ["7 h", "3.4 m"],
          ["10 h", "4.7 m"],
        ].map(([h, m], i) => (
          <g key={h} className="tm-pop" style={{ animationDelay: `${0.2 + i * 0.35}s` }}>
            <text x="70" y={80 + i * 26} textAnchor="middle" fontSize="18" fontWeight="900" fill={OUTLINE}>{h}</text>
            <text x="121" y={80 + i * 26} textAnchor="middle" fontSize="18" fontWeight="900" fill={OUTLINE}>→</text>
            <text x="172" y={80 + i * 26} textAnchor="middle" fontSize="18" fontWeight="900" fill={LAKE}>{m}</text>
          </g>
        ))}
      </>
    ),
  },

  "bus-fare": {
    caption: "The fare goes up by the same amount each year → guess next year!",
    label: "Bus fares for four years: 50, 60 and 70 shillings, and a question mark for next year",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        <line x1="20" y1="132" x2="228" y2="132" stroke={OUTLINE} strokeWidth="3" />
        {[50, 60, 70].map((fare, i) => {
          const h = fare * 1.3;
          return (
            <g key={fare} className="tm-pop" style={{ animationDelay: `${i * 0.3}s` }}>
              <rect x={32 + i * 50} y={132 - h} width="34" height={h} rx="4" fill={MAIZE} stroke={OUTLINE} strokeWidth="2.5" />
              <text x={49 + i * 50} y={126 - h} textAnchor="middle" fontSize="13" fontWeight="900" fill={OUTLINE}>{fare}</text>
              <text x={49 + i * 50} y="148" textAnchor="middle" fontSize="11" fontWeight="700" fill={OUTLINE}>year {i + 1}</text>
            </g>
          );
        })}
        {/* Next year: continue the pattern */}
        <g className="tm-pop" style={{ animationDelay: "1.1s" }}>
          <rect x="182" y={132 - 104} width="34" height="104" rx="4" fill="#FFF4D6" stroke={OUTLINE} strokeWidth="2.5" strokeDasharray="6 4" />
          <text x="199" y="90" textAnchor="middle" fontSize="28" fontWeight="900" fill={LAKE}>?</text>
          <text x="199" y="148" textAnchor="middle" fontSize="11" fontWeight="700" fill={OUTLINE}>next</text>
        </g>
        <path className="tm-pop" style={{ animationDelay: "0.9s" }} d="M49 60 L199 18" stroke={RED} strokeWidth="3" strokeDasharray="7 5" />
      </>
    ),
  },

  "safe-uphill": {
    caption: "Warned early → everyone and the goats are safe on high ground",
    label: "The family and their goats standing safely on a hill while flood water covers the low ground",
    draw: (
      <>
        <rect width="240" height="160" fill="#BFD3DD" />
        <path d="M0 70 C50 60 90 70 130 110 L0 160 Z" fill="#5E9A4F" />
        <path d="M0 160 L0 120 Q120 112 240 120 L240 160 Z" fill="#7A6A4F" />
        {/* People */}
        {[30, 54].map((x, i) => (
          <g key={x} className="tm-pop" style={{ animationDelay: `${i * 0.25}s` }}>
            <circle cx={x} cy={44 + i * 2} r="7" fill="#6E4529" stroke={OUTLINE} strokeWidth="2" />
            <rect x={x - 7} y={52 + i * 2} width="14" height="20" rx="5" fill={i ? "#2C4F9E" : "#4C8E44"} stroke={OUTLINE} strokeWidth="2" />
          </g>
        ))}
        {/* Goats */}
        {[80, 104].map((x, i) => (
          <g key={x} className="tm-pop" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
            <ellipse cx={x} cy={78 + i * 8} rx="10" ry="6" fill={i ? "#8B6A4E" : "#EDE6DA"} stroke={OUTLINE} strokeWidth="2" />
            <circle cx={x + 10} cy={72 + i * 8} r="4" fill={i ? "#8B6A4E" : "#EDE6DA"} stroke={OUTLINE} strokeWidth="2" />
          </g>
        ))}
        <Tick x={210} y={30} delay={1} />
      </>
    ),
  },

  "y-mx-c": {
    caption: "Maths class meets the river!",
    label: "y equals m x plus c. y is the river height, x is the hours of rain, m is the rise per hour, c is the starting height",
    draw: (
      <>
        <rect width="240" height="160" fill="#24493A" />
        <text x="120" y="70" textAnchor="middle" fontSize="40" fontWeight="900" fill="#F4F1E6" fontFamily="'Comic Sans MS', 'Trebuchet MS', sans-serif">
          y = m x + c
        </text>
        {[
          { x: 42, label: "river height", colour: "#8BE9F5" },
          { x: 108, label: "rise per hour", colour: MAIZE },
          { x: 140, label: "hours", colour: "#9BE08F" },
          { x: 202, label: "start", colour: "#F6B8A8" },
        ].map((t, i) => (
          <g key={t.label} className="tm-pop" style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
            <line x1={t.x} y1="80" x2={t.x} y2={i % 2 ? 124 : 100} stroke={t.colour} strokeWidth="2.5" />
            <text x={t.x} y={i % 2 ? 140 : 116} textAnchor="middle" fontSize="12" fontWeight="800" fill={t.colour}>
              {t.label}
            </text>
          </g>
        ))}
      </>
    ),
  },
};

