// ============================================================
// IDEA PICTURES
// ------------------------------------------------------------
// Small pictures that pop up beside a speech bubble, so people
// can SEE what the character is talking about, not only read it.
// Each has a short caption in plain words.
//
// To use one, add  picture: "mangoes"  to a "say" beat in
// content.ts. To add a new one, draw it here and add its name
// to Episode1PictureId in types.ts.
// ============================================================

import type { Episode1PictureId, IdeaPicture } from "../types";
import SignIcon from "./SignIcon";
import Maize from "../components/Maize";
import { Arrow, Cross, MiniRobot, Tick } from "../components/PictureParts";

const OUTLINE = "#13303A";
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const SOIL = "#A4532F";
const LEAF = "#4C8E44";
const RED = "#E0533D";

// ---------- Small reusable drawings ----------


function Mango({ x, y, ripe, delay = 0 }: { x: number; y: number; ripe: boolean; delay?: number }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx={x} cy={y} rx="15" ry="19" fill={ripe ? "#F29F2E" : "#8DBF4A"} stroke={OUTLINE} strokeWidth="3" transform={`rotate(-20 ${x} ${y})`} />
      <path d={`M${x + 2} ${y - 18} q6 -8 14 -6 q-6 6 -14 6`} fill={LEAF} stroke={OUTLINE} strokeWidth="2" />
    </g>
  );
}




// A month-by-month rain chart with two humps
const RAIN = [115, 94, 190, 288, 213, 109, 98, 107, 113, 202, 248, 189];
function RainBars({ values = RAIN, highlight = true }: { values?: number[]; highlight?: boolean }) {
  return (
    <>
      {values.map((mm, i) => {
        const h = (mm / 300) * 100;
        const rainy = highlight && ((i >= 2 && i <= 4) || i >= 9);
        return (
          <rect
            key={i}
            className="tm-bar-grow"
            style={{ animationDelay: `${i * 0.06}s` }}
            x={14 + i * 18}
            y={128 - h}
            width="14"
            height={h}
            rx="3"
            fill={rainy ? LAKE : "#B5D8E4"}
            stroke={OUTLINE}
            strokeWidth="1.5"
          />
        );
      })}
      <line x1="10" y1="129" x2="232" y2="129" stroke={OUTLINE} strokeWidth="3" />
      {"JFMAMJJASOND".split("").map((m, i) => (
        <text key={i} x={21 + i * 18} y="146" textAnchor="middle" fontSize="12" fontWeight="700" fill={OUTLINE}>
          {m}
        </text>
      ))}
    </>
  );
}

// ---------- The pictures ----------

export const EPISODE1_PICTURES: Record<Episode1PictureId, IdeaPicture> = {
  "dry-seeds": {
    caption: "No rain → the seeds dry out",
    label: "A hot sun over cracked dry soil, with seeds that cannot grow",
    draw: (
      <>
        <rect width="240" height="160" fill="#FCEFD0" />
        <g className="tm-sun-pulse">
          <circle cx="190" cy="40" r="22" fill={MAIZE} stroke="#E09A1F" strokeWidth="3" />
        </g>
        <rect y="100" width="240" height="60" fill="#B98A5A" />
        <path d="M20 112 l14 12 l-6 14 M90 106 l-8 18 l14 12 M150 112 l12 10 l-4 18 M205 108 l-10 16" stroke="#7A5232" strokeWidth="3" fill="none" />
        {[50, 120, 180].map((x, i) => (
          <g key={x}>
            <Maize stage="dried" x={x} y={104} scale={1.3} />
            <Cross x={x + 22} y={76} delay={0.4 + i * 0.25} />
          </g>
        ))}
      </>
    ),
  },

  notebook: {
    caption: "Every day: what she saw + did it rain?",
    label: "Mama's notebook: each row shows the signs she saw and whether it rained",
    draw: (
      <>
        <rect x="20" y="10" width="200" height="140" rx="8" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="3" />
        <line x1="120" y1="10" x2="120" y2="150" stroke={OUTLINE} strokeWidth="2" />
        {[0, 1, 2].map((row) => (
          <g key={row} className="tm-pop" style={{ animationDelay: `${row * 0.35}s` }}>
            <text x="30" y={46 + row * 40} fontSize="13" fontWeight="800" fill={OUTLINE}>
              Day {row + 1}
            </text>
            <SignIcon id={row === 1 ? "ants" : "clouds"} size={30} x={74} y={24 + row * 40} decorative />
            <text x="128" y={46 + row * 40} fontSize="13" fontWeight="700" fill={OUTLINE}>
              →
            </text>
            <SignIcon id={row === 2 ? "sun" : "rain"} size={30} x={150} y={24 + row * 40} decorative />
          </g>
        ))}
      </>
    ),
  },

  mangoes: {
    caption: "See many mangoes → learn what “ripe” looks like",
    label: "Many mangoes, green and ripe. After seeing many, you know which one is ripe",
    draw: (
      <>
        <rect width="240" height="160" fill="#EAF6E6" />
        <Mango x={30} y={50} ripe={false} delay={0} />
        <Mango x={72} y={45} ripe delay={0.15} />
        <Mango x={30} y={110} ripe delay={0.3} />
        <Mango x={72} y={110} ripe={false} delay={0.45} />
        <text x="52" y="152" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>many examples</text>
        <Arrow x={104} y={80} delay={0.7} />
        <g className="tm-pop" style={{ animationDelay: "1s" }}>
          <ellipse cx="180" cy="82" rx="28" ry="36" fill="#F29F2E" stroke={OUTLINE} strokeWidth="3.5" transform="rotate(-20 180 82)" />
          <path d="M184 48 q10 -14 24 -10 q-10 10 -24 10" fill={LEAF} stroke={OUTLINE} strokeWidth="2.5" />
        </g>
        <Tick x={210} y={124} delay={1.3} />
        <text x="180" y="152" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>“That's ripe!”</text>
      </>
    ),
  },

  "learn-flow": {
    caption: "Examples → Tumaini → finds the pattern",
    label: "Notebook pages go into Tumaini, and Tumaini finds a pattern",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        {[0, 1, 2].map((i) => (
          <rect key={i} className="tm-pop" style={{ animationDelay: `${i * 0.2}s` }} x={14 + i * 6} y={50 + i * 6} width="40" height="52" rx="4" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="2.5" />
        ))}
        <text x="40" y="136" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>examples</text>
        <Arrow x={72} y={80} delay={0.6} />
        <MiniRobot x={130} y={86} />
        <Arrow x={164} y={80} delay={1} />
        <g className="tm-pop" style={{ animationDelay: "1.3s" }}>
          <SignIcon id="clouds" size={34} x={196} y={44} decorative />
          <text x="213" y="94" textAnchor="middle" fontSize="20" fontWeight="900" fill={OUTLINE}>=</text>
          <SignIcon id="rain" size={30} x={198} y={98} decorative />
        </g>
        <text x="213" y="148" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>pattern</text>
      </>
    ),
  },

  clues: {
    caption: "Dark clouds = strong clue · Wind = weak clue",
    label: "Dark clouds have a long bar, a strong clue. Wind from the lake has a short bar, a weak clue",
    draw: (
      <>
        <rect width="240" height="160" fill="#0E2A33" />
        {[
          { id: "clouds" as const, pct: 83, colour: "#8BE9F5" },
          { id: "ants" as const, pct: 60, colour: MAIZE },
          { id: "wind" as const, pct: 40, colour: "#9BE08F" },
        ].map((c, i) => (
          <g key={c.id}>
            <rect x="10" y={18 + i * 46} width="38" height="38" rx="8" fill="#DDF0F7" />
            <SignIcon id={c.id} size={34} x={12} y={20 + i * 46} decorative />
            <rect x="58" y={28 + i * 46} width="140" height="18" rx="9" fill="#1F4450" />
            <rect className="tm-bar-grow-x" style={{ animationDelay: `${i * 0.25}s` }} x="58" y={28 + i * 46} width={1.4 * c.pct} height="18" rx="9" fill={c.colour} />
            <text x="232" y={43 + i * 46} textAnchor="end" fontSize="15" fontWeight="900" fill={MAIZE}>
              {c.pct}%
            </text>
          </g>
        ))}
      </>
    ),
  },

  "many-days": {
    caption: "More examples → better learning",
    label: "A small pile of 12 days, then a huge pile of thousands of days from weather stations",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        {/* small pile */}
        {[0, 1].map((i) => (
          <rect key={i} x="24" y={110 - i * 10} width="48" height="10" rx="2" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="2" />
        ))}
        <text x="48" y="140" textAnchor="middle" fontSize="13" fontWeight="800" fill={OUTLINE}>12 days</text>
        <Arrow x={88} y={90} delay={0.3} />
        {/* big pile growing */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} className="tm-pop" style={{ animationDelay: `${0.5 + i * 0.12}s` }} x="132" y={110 - i * 10} width="56" height="10" rx="2" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="2" />
        ))}
        {/* weather station */}
        <g className="tm-pop" style={{ animationDelay: "1.5s" }}>
          <line x1="212" y1="120" x2="212" y2="50" stroke={OUTLINE} strokeWidth="3" />
          <path className="tm-spin-slow" style={{ transformOrigin: "212px 50px" }} d="M212 50 l-14 -6 M212 50 l14 -6 M212 50 l0 14" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
          <circle cx="212" cy="50" r="4" fill={MAIZE} stroke={OUTLINE} strokeWidth="2" />
        </g>
        <text x="172" y="140" textAnchor="middle" fontSize="13" fontWeight="800" fill={OUTLINE}>thousands!</text>
      </>
    ),
  },

  "two-seasons": {
    caption: "Two rainy seasons every year: long rains + short rains",
    label: "A rain chart for the year with two humps: March to May, and October to December",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        <RainBars />
        <text x="68" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill={LAKE}>Long rains</text>
        <text x="194" y="38" textAnchor="middle" fontSize="12" fontWeight="900" fill={LAKE}>Short rains</text>
      </>
    ),
  },

  "wasted-seed": {
    caption: "Plant at the wrong time → seed and money lost",
    label: "A bag of seed and coins flying away",
    draw: (
      <>
        <rect width="240" height="160" fill="#FBE9E4" />
        <path d="M50 60 q30 -14 60 0 l8 80 h-76 z" fill="#E9DDBF" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
        <text x="80" y="110" textAnchor="middle" fontSize="16" fontWeight="900" fill={SOIL}>SEED</text>
        {[0, 1, 2].map((i) => (
          <g key={i} className="tm-fly-away" style={{ animationDelay: `${i * 0.5}s` }}>
            <circle cx={150 + i * 24} cy={90 - i * 16} r="13" fill={MAIZE} stroke={OUTLINE} strokeWidth="3" />
            <text x={150 + i * 24} y={95 - i * 16} textAnchor="middle" fontSize="13" fontWeight="900" fill={OUTLINE}>KSh</text>
          </g>
        ))}
        <Cross x={200} y={130} delay={0.4} />
      </>
    ),
  },

  timetable: {
    caption: "Same time every year, like school holidays",
    label: "Two years of calendars. The holiday months are coloured at the same time each year",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        {["2024", "2025"].map((year, row) => (
          <g key={year} className="tm-pop" style={{ animationDelay: `${row * 0.4}s` }}>
            <text x="10" y={52 + row * 60} fontSize="13" fontWeight="900" fill={OUTLINE}>{year}</text>
            {Array.from({ length: 12 }, (_, i) => {
              const holiday = i === 3 || i === 7 || i === 11;
              return (
                <rect key={i} x={50 + i * 15} y={36 + row * 60} width="13" height="24" rx="3" fill={holiday ? MAIZE : "#DDF0F7"} stroke={OUTLINE} strokeWidth="1.5" />
              );
            })}
          </g>
        ))}
        <text x="140" y="150" textAnchor="middle" fontSize="12" fontWeight="800" fill={SOIL}>yellow = holidays</text>
      </>
    ),
  },

  "late-rain": {
    caption: "What if the rain comes late?",
    label: "March with an empty cloud and a big question mark",
    draw: (
      <>
        <rect width="240" height="160" fill="#FCEFD0" />
        <rect x="30" y="30" width="90" height="100" rx="10" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" />
        <rect x="30" y="30" width="90" height="26" rx="10" fill={RED} stroke={OUTLINE} strokeWidth="3" />
        <text x="75" y="49" textAnchor="middle" fontSize="15" fontWeight="900" fill="#FFFFFF">MARCH</text>
        <SignIcon id="sun" size={50} x={50} y={66} decorative />
        <text className="tm-wobble" x="180" y="110" textAnchor="middle" fontSize="80" fontWeight="900" fill={LAKE} stroke={OUTLINE} strokeWidth="2">?</text>
      </>
    ),
  },

  "saved-seed": {
    caption: "Early warning → wait → plant when rain comes → seed saved!",
    label: "A warning sign, then waiting, then a healthy maize plant with a tick",
    draw: (
      <>
        <rect width="240" height="160" fill="#EAF6E6" />
        <g className="tm-pop">
          <path d="M34 50 l22 -38 l22 38 z" fill={MAIZE} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
          <text x="56" y="45" textAnchor="middle" fontSize="22" fontWeight="900" fill={OUTLINE}>!</text>
          <text x="56" y="72" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>warning</text>
        </g>
        <Arrow x={86} y={36} delay={0.4} />
        <g className="tm-pop" style={{ animationDelay: "0.6s" }}>
          <SignIcon id="rain" size={40} x={124} y={14} decorative />
          <text x="144" y="72" textAnchor="middle" fontSize="12" fontWeight="800" fill={OUTLINE}>rain comes</text>
        </g>
        <Arrow x={174} y={36} delay={0.9} />
        <g className="tm-pop" style={{ animationDelay: "1.1s" }}>
          <rect y="128" width="240" height="32" fill="#8A5A36" />
          <Maize stage="tall" x={210} y={132} scale={0.9} />
          <Maize stage="growing" x={120} y={132} scale={0.9} />
          <Maize stage="sprouts" x={40} y={132} scale={1.2} />
        </g>
        <Tick x={210} y={20} delay={1.4} />
      </>
    ),
  },
};
