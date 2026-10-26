// ============================================================
// EPISODE 0 IDEA PICTURES
// ------------------------------------------------------------
// Small pictures that pop up beside a speech bubble, so people
// can SEE the idea. Same pattern as the other episodes.
// Add the name to Episode0PictureId in types.ts to use a new one.
// ============================================================

import type { Episode0PictureId, IdeaPicture } from "../types";
import { Arrow, Cross, MiniRobot, Tick } from "../components/PictureParts";

const OUTLINE = "#13303A";
const LAKE = "#1B6E8E";
const MAIZE = "#F2B544";
const SOIL = "#8A5A36";
const LEAF = "#4C8E44";
const RED = "#E0533D";

function Sun({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={x} y1={y - r - 8} x2={x} y2={y - r - 3} stroke="#E09A1F" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 45} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill={MAIZE} stroke={OUTLINE} strokeWidth="2.5" />
    </g>
  );
}
function Cloud({ x, y, s = 1, fill = "#9FB7BF" }: { x: number; y: number; s?: number; fill?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 20 a8 8 0 0 1 2 -15 a11 11 0 0 1 20 -3 a9 9 0 0 1 16 6 a6 6 0 0 1 2 12 Z" fill={fill} stroke={OUTLINE} strokeWidth={2 / s} />;
}
const label = (x: number, y: number, text: string, colour = OUTLINE, size = 12) => (
  <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="900" fill={colour}>
    {text}
  </text>
);

/** A milestone on a timeline: a year in a circle, with a short label under it. */
function Milestone({ x, year, lines, colour, delay }: { x: number; year: string; lines: string[]; colour: string; delay: number }) {
  return (
    <g className="tm-pop" style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy="64" r="17" fill={colour} stroke={OUTLINE} strokeWidth="2.5" />
      <text x={x} y="69" textAnchor="middle" fontSize="11" fontWeight="900" fill="#FFFFFF">{year}</text>
      {lines.map((line, i) => (
        <text key={line} x={x} y={98 + i * 13} textAnchor="middle" fontSize="10" fontWeight="800" fill={OUTLINE}>{line}</text>
      ))}
    </g>
  );
}

export const EPISODE0_PICTURES: Record<Episode0PictureId, IdeaPicture> = {
  "climate-promises": {
    caption: "Promises the world made about climate, and Kenya's own law",
    label: "A timeline: 1992 UN climate treaty; 2015 Paris Agreement, Sustainable Development Goals and Sendai Framework; 2016 Kenya's Climate Change Act",
    draw: (
      <>
        <rect width="240" height="160" fill="#F4FBF1" />
        <line x1="20" y1="64" x2="222" y2="64" stroke={OUTLINE} strokeWidth="3" />
        <Milestone x={36} year="1992" lines={["UN climate", "treaty"]} colour={LAKE} delay={0} />
        <Milestone x={96} year="2015" lines={["Paris", "Agreement"]} colour={LEAF} delay={0.3} />
        <Milestone x={152} year="2015" lines={["SDG 13 +", "Sendai"]} colour={MAIZE} delay={0.6} />
        <Milestone x={206} year="2016" lines={["Kenya's", "Climate Act"]} colour={RED} delay={0.9} />
        {label(120, 24, "PROMISES ABOUT CLIMATE", OUTLINE, 12)}
        {label(120, 150, "cut the gases · adapt · warn people early", LEAF, 10)}
      </>
    ),
  },

  "ai-promises": {
    caption: "Promises about AI: fair, safe, open, and good for people and the planet",
    label: "A timeline: 2021 UNESCO ethics of AI agreed by 193 countries; 2024 African Union AI strategy; 2025 Kenya's National AI Strategy",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        <line x1="30" y1="64" x2="210" y2="64" stroke={OUTLINE} strokeWidth="3" />
        <Milestone x={46} year="2021" lines={["UNESCO:", "ethics of AI"]} colour="#2F6FD0" delay={0} />
        <Milestone x={120} year="2024" lines={["African Union", "AI strategy"]} colour={LEAF} delay={0.3} />
        <Milestone x={194} year="2025" lines={["Kenya's", "AI strategy"]} colour={RED} delay={0.6} />
        {label(120, 24, "PROMISES ABOUT AI", OUTLINE, 12)}
        {label(120, 150, "fair · safe · open · good for the planet", LAKE, 10)}
      </>
    ),
  },

  "weather-vs-climate": {
    caption: "Weather = one day · Climate = the usual pattern over many years",
    label: "On the left, one day of rain. On the right, a calendar of many years showing the usual pattern",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        <line x1="96" y1="10" x2="96" y2="150" stroke={OUTLINE} strokeWidth="2" strokeDasharray="5 4" />
        {label(48, 24, "WEATHER", LAKE, 13)}
        <Cloud x={26} y={50} s={1.1} />
        <path d="M34 84 l-4 10 M46 84 l-4 10 M58 84 l-4 10" stroke={LAKE} strokeWidth="3" strokeLinecap="round" />
        {label(48, 120, "today:")}
        {label(48, 136, "rain")}
        {label(168, 24, "CLIMATE", LEAF, 13)}
        {/* Many years: rainy months coloured */}
        {[0, 1, 2, 3].map((row) => (
          <g key={row} className="tm-pop" style={{ animationDelay: `${row * 0.25}s` }}>
            {Array.from({ length: 12 }, (_, m) => (
              <rect key={m} x={110 + m * 10} y={40 + row * 22} width="8" height="16" rx="2" fill={(m >= 2 && m <= 4) || m >= 9 ? LAKE : "#DDF0F7"} stroke={OUTLINE} strokeWidth="1" />
            ))}
          </g>
        ))}
        {label(168, 146, "the usual pattern")}
      </>
    ),
  },

  "fossil-causes": {
    caption: "Burning coal, oil and gas, and cutting forests, thicken the blanket",
    label: "A factory chimney, a car and a cut tree stump, all sending smoke up into a grey blanket in the sky",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        <path className="tm-pop" d="M0 34 Q120 6 240 34 L240 52 Q120 26 0 52 Z" fill="#9C8F78" opacity="0.8" />
        {label(120, 26, "blanket of gases", "#FFFFFF", 11)}
        {/* Factory */}
        <rect x="14" y="100" width="56" height="40" fill="#A4532F" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="46" y="70" width="14" height="32" fill="#7A5232" stroke={OUTLINE} strokeWidth="2.5" />
        <path className="tm-fly-away" d="M53 66 q-6 -10 2 -16 q8 -6 2 -14" stroke="#5B6670" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Car */}
        <rect x="92" y="118" width="54" height="18" rx="6" fill={LAKE} stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M100 118 l8 -12 h24 l8 12" fill="#BFDCE8" stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="104" cy="138" r="6" fill={OUTLINE} />
        <circle cx="134" cy="138" r="6" fill={OUTLINE} />
        <path className="tm-fly-away" style={{ animationDelay: "0.6s" }} d="M88 128 q-8 -4 -12 -14" stroke="#5B6670" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Cut tree */}
        <rect x="180" y="118" width="22" height="20" fill={SOIL} stroke={OUTLINE} strokeWidth="2.5" />
        <ellipse cx="191" cy="118" rx="11" ry="4" fill="#D9B980" stroke={OUTLINE} strokeWidth="2" />
        <Cross x={214} y={100} delay={0.8} />
        <rect y="140" width="240" height="20" fill="#6FAE5F" />
      </>
    ),
  },

  "kenya-impacts": {
    caption: "Already happening in Kenya: record lake level, failed rains, floods",
    label: "Three panels: Lake Victoria at a record level in 2020, failed rains from 2020 to 2022, and floods in 2024",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        {[
          { x: 40, year: "2020", text: "Record lake", fill: "#BFDCE8" },
          { x: 120, year: "2020–22", text: "5 failed rains", fill: "#FCEFD0" },
          { x: 200, year: "2024", text: "Big floods", fill: "#D6E4EA" },
        ].map((p, i) => (
          <g key={p.year} className="tm-pop" style={{ animationDelay: `${i * 0.35}s` }}>
            <rect x={p.x - 36} y="20" width="72" height="104" rx="10" fill={p.fill} stroke={OUTLINE} strokeWidth="2.5" />
            {label(p.x, 40, p.year, OUTLINE, 13)}
            {label(p.x, 140, p.text, OUTLINE, 11)}
          </g>
        ))}
        {/* Lake rising */}
        <rect x="8" y="80" width="64" height="40" fill={LAKE} />
        <path d="M14 76 h52" stroke={RED} strokeWidth="3" strokeDasharray="4 3" />
        {/* Dry cracked ground with sun */}
        <Sun x={120} y={66} r={12} />
        <path d="M90 108 l10 6 l-4 8 M128 104 l-6 10 l10 6" stroke="#7A5232" strokeWidth="2.5" fill="none" />
        {/* Floods: a house in water */}
        <rect x="186" y="66" width="28" height="22" fill="#C98B5A" stroke={OUTLINE} strokeWidth="2" />
        <path d="M182 68 L200 54 L218 68 Z" fill="#AEB8BE" stroke={OUTLINE} strokeWidth="2" />
        <rect x="168" y="82" width="64" height="38" fill="#7A6A4F" opacity="0.9" />
      </>
    ),
  },

  "paris-promise": {
    caption: "Paris Agreement (2015): keep warming well below 2 °C, try for 1.5 °C",
    label: "A thermometer with marks at 1.5 and 2 degrees, and many hands joining together for the Paris Agreement",
    draw: (
      <>
        <rect width="240" height="160" fill="#F4FBF1" />
        {label(150, 24, "PARIS AGREEMENT", LAKE, 14)}
        {label(150, 42, "2015 · almost every country", OUTLINE, 11)}
        {/* Thermometer */}
        <rect x="26" y="16" width="24" height="112" rx="12" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.5" />
        <rect className="tm-bar-grow" x="32" y="62" width="12" height="66" rx="6" fill={RED} />
        <circle cx="38" cy="136" r="14" fill={RED} stroke={OUTLINE} strokeWidth="2.5" />
        <line x1="20" y1="46" x2="60" y2="46" stroke={MAIZE} strokeWidth="3" />
        <line x1="20" y1="60" x2="60" y2="60" stroke={LEAF} strokeWidth="3" />
        <text x="64" y="50" fontSize="12" fontWeight="900" fill={OUTLINE}>2 °C</text>
        <text x="64" y="64" fontSize="12" fontWeight="900" fill={LEAF}>1.5 °C</text>
        {/* Hands joining */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="tm-pop" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
            <circle cx={110 + i * 26} cy="96" r="11" fill={["#6E4529", "#C98B5A", "#8A5A36", "#E8C39E", "#5E3721"][i]} stroke={OUTLINE} strokeWidth="2" />
            <rect x={102 + i * 26} y="108" width="16" height="28" rx="6" fill={[LAKE, MAIZE, LEAF, RED, "#2C4F9E"][i]} stroke={OUTLINE} strokeWidth="2" />
          </g>
        ))}
        <path d="M112 118 H222" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },

  "rules-vs-learning": {
    caption: "Old way: a person writes every rule · Machine learning: learn from examples",
    label: "On the left, a long list of rules written by a person. On the right, many examples going into Tumaini, which finds the pattern itself",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        <line x1="120" y1="10" x2="120" y2="150" stroke={OUTLINE} strokeWidth="2" strokeDasharray="5 4" />
        {label(60, 22, "RULES", RED, 13)}
        <rect x="18" y="32" width="84" height="96" rx="6" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="2" />
        {["IF yellow…", "AND soft…", "AND smells…", "THEN ripe", "IF … ???"].map((t, i) => (
          <text key={t} x="26" y={50 + i * 17} fontSize="11" fontWeight="800" fill={OUTLINE}>{t}</text>
        ))}
        {label(60, 146, "written by a person", OUTLINE, 10)}
        {label(180, 22, "LEARNING", LEAF, 13)}
        {[0, 1, 2].map((i) => (
          <ellipse key={i} className="tm-pop" style={{ animationDelay: `${i * 0.2}s` }} cx={140 + i * 16} cy={52} rx="8" ry="10" fill={i === 1 ? "#8DBF4A" : "#F29F2E"} stroke={OUTLINE} strokeWidth="2" />
        ))}
        <Arrow x={168} y={70} delay={0.7} />
        <MiniRobot x={180} y={118} />
        <Tick x={218} y={46} delay={1.1} />
        {label(180, 158, "finds the pattern itself", OUTLINE, 10)}
      </>
    ),
  },

  "supervised-unsupervised": {
    caption: "Supervised: examples come with answers · Unsupervised: find groups alone",
    label: "On the left, leaves with labels saying healthy or sick. On the right, dots with no labels that form groups by themselves",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        <line x1="120" y1="10" x2="120" y2="150" stroke={OUTLINE} strokeWidth="2" strokeDasharray="5 4" />
        {label(60, 22, "SUPERVISED", LAKE, 12)}
        {[
          { y: 46, c: "#4FA043", t: "healthy" },
          { y: 80, c: "#B5A23C", t: "sick" },
          { y: 114, c: "#4FA043", t: "healthy" },
        ].map((l, i) => (
          <g key={i} className="tm-pop" style={{ animationDelay: `${i * 0.2}s` }}>
            <path d={`M14 ${l.y} q16 -12 36 -8 q12 2 18 8 q-6 6 -18 8 q-20 4 -36 -8 Z`} fill={l.c} stroke={OUTLINE} strokeWidth="2" />
            <rect x="72" y={l.y - 9} width="44" height="18" rx="9" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="1.5" />
            <text x="94" y={l.y + 4} textAnchor="middle" fontSize="10" fontWeight="900" fill={OUTLINE}>{l.t}</text>
          </g>
        ))}
        {label(60, 146, "the answers are given", OUTLINE, 10)}
        {label(180, 22, "UNSUPERVISED", LEAF, 12)}
        {/* Three groups found by themselves */}
        {[
          { cx: 150, cy: 54, c: "#2F6FD0" },
          { cx: 206, cy: 64, c: MAIZE },
          { cx: 168, cy: 112, c: LEAF },
        ].map((g, gi) => (
          <g key={gi} className="tm-pop" style={{ animationDelay: `${0.5 + gi * 0.3}s` }}>
            <circle cx={g.cx} cy={g.cy} r="20" fill="none" stroke={g.c} strokeWidth="2.5" strokeDasharray="4 3" />
            {[[-7, -5], [6, -4], [-2, 7], [8, 6]].map(([dx, dy], i) => (
              <circle key={i} cx={g.cx + dx} cy={g.cy + dy} r="4" fill={g.c} />
            ))}
          </g>
        ))}
        {label(180, 146, "no answers: groups appear", OUTLINE, 10)}
      </>
    ),
  },

  "climate-big-data": {
    caption: "Millions of readings every day: too many for people, just right for AI",
    label: "Rain gauges, weather stations and a satellite all sending numbers to Tumaini",
    draw: (
      <>
        <rect width="240" height="160" fill="#E6F3F8" />
        {/* Satellite */}
        <g className="tm-pop">
          <rect x="18" y="20" width="16" height="12" fill={LAKE} stroke={OUTLINE} strokeWidth="2" />
          <rect x="34" y="16" width="14" height="20" rx="3" fill={MAIZE} stroke={OUTLINE} strokeWidth="2" />
          <rect x="48" y="20" width="16" height="12" fill={LAKE} stroke={OUTLINE} strokeWidth="2" />
        </g>
        {/* Weather station */}
        <g className="tm-pop" style={{ animationDelay: "0.2s" }}>
          <line x1="40" y1="140" x2="40" y2="92" stroke={OUTLINE} strokeWidth="3" />
          <path className="tm-spin-slow" style={{ transformOrigin: "40px 92px" }} d="M40 92 l-12 -4 M40 92 l12 -4 M40 92 l0 12" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* Rain gauge */}
        <g className="tm-pop" style={{ animationDelay: "0.4s" }}>
          <rect x="74" y="104" width="16" height="36" rx="3" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2" />
          <rect x="76" y="122" width="12" height="16" fill={LAKE} />
        </g>
        {/* Numbers flying to Tumaini */}
        {["12.4", "88", "3.1", "205", "0.7", "41"].map((n, i) => (
          <text key={n} className="tm-pop" style={{ animationDelay: `${0.5 + i * 0.15}s` }} x={104 + (i % 3) * 26} y={44 + Math.floor(i / 3) * 30} fontSize="12" fontWeight="900" fill={LAKE}>
            {n}
          </text>
        ))}
        <Arrow x={164} y={70} delay={1.2} />
        <MiniRobot x={208} y={110} />
        <rect y="140" width="240" height="20" fill="#6FAE5F" />
      </>
    ),
  },

  "ai-footprint": {
    caption: "AI uses electricity and water, so use it wisely and power it cleanly",
    label: "A big computer building plugged into the power grid, with a choice between a smoky coal plant and clean geothermal and solar power",
    draw: (
      <>
        <rect width="240" height="160" fill="#FFFFFF" />
        {/* Data centre */}
        <rect x="84" y="40" width="72" height="80" rx="6" fill="#5E6E7B" stroke={OUTLINE} strokeWidth="2.5" />
        {[52, 70, 88, 106].map((y) => (
          <g key={y}>
            <rect x="92" y={y} width="56" height="10" rx="2" fill="#1E2B36" />
            <circle className="tm-antenna-light" cx="142" cy={y + 5} r="2" fill="#8BE9F5" />
          </g>
        ))}
        {label(120, 136, "AI computers", OUTLINE, 11)}
        {/* Coal: smoky */}
        <g className="tm-pop" style={{ animationDelay: "0.3s" }}>
          <rect x="14" y="80" width="40" height="40" fill="#7A5232" stroke={OUTLINE} strokeWidth="2" />
          <path className="tm-fly-away" d="M30 76 q-6 -10 2 -16 q8 -6 2 -14" stroke="#5B6670" strokeWidth="6" fill="none" strokeLinecap="round" />
          {label(34, 136, "coal", OUTLINE, 11)}
          <Cross x={52} y={70} delay={0.6} />
        </g>
        {/* Clean: sun and geothermal steam */}
        <g className="tm-pop" style={{ animationDelay: "0.6s" }}>
          <Sun x={202} y={58} r={13} />
          <rect x="182" y="96" width="40" height="24" fill="#BFDCE8" stroke={OUTLINE} strokeWidth="2" />
          <path d="M190 92 q-4 -8 2 -14 M204 92 q-4 -8 2 -14" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
          {label(202, 136, "solar, geothermal", LEAF, 10)}
          <Tick x={226} y={84} delay={0.9} />
        </g>
        <path d="M56 100 H84 M156 108 H182" stroke={MAIZE} strokeWidth="4" strokeDasharray="6 4" />
      </>
    ),
  },
};
