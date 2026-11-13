// ============================================================
// PART 3 CHARTS  (simple, flat and still: no animation)
// ------------------------------------------------------------
//   rain-by-month      -> bars: Kenya's two rainy seasons
//   temperature-trend  -> line: the world getting warmer
//   river-model        -> straight line: y = mx + c
// The numbers are approximate, for teaching (labelled on the chart).
// ============================================================

const INK = "#13303A";
const MUTED = "#5B747C";
const GRID = "#DCE6E9";
const LAKE = "#1B6E8E";
const SOIL = "#A4532F";

// Approximate monthly rain in central Kenya (mm): long rains Mar–May, short rains Oct–Dec.
const RAIN = [50, 50, 90, 200, 150, 40, 20, 25, 30, 60, 150, 90];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const RAINY = new Set([2, 3, 4, 9, 10, 11]);

export function RainByMonth() {
  const max = 220;
  const x0 = 40, y0 = 170, w = 260, h = 140;
  const bw = w / RAIN.length;
  return (
    <svg viewBox="0 0 320 210" role="img" aria-label="Bar chart of rain each month. Two peaks: March to May (the long rains) and October to December (the short rains).">
      {[0, 100, 200].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x0 + w} y1={y0 - (v / max) * h} y2={y0 - (v / max) * h} stroke={GRID} />
          <text x={x0 - 6} y={y0 - (v / max) * h + 4} fontSize="10" textAnchor="end" fill={MUTED}>{v}</text>
        </g>
      ))}
      {RAIN.map((v, i) => (
        <g key={i}>
          <rect x={x0 + i * bw + 3} y={y0 - (v / max) * h} width={bw - 6} height={(v / max) * h} rx="3" fill={RAINY.has(i) ? LAKE : "#9FB7BF"} />
          <text x={x0 + i * bw + bw / 2} y={y0 + 14} fontSize="10" textAnchor="middle" fill={INK}>{MONTHS[i]}</text>
        </g>
      ))}
      <text x={x0 + 3.5 * bw} y="22" fontSize="11" fontWeight="700" textAnchor="middle" fill={LAKE}>Long rains</text>
      <text x={x0 + 10.5 * bw} y="22" fontSize="11" fontWeight="700" textAnchor="middle" fill={LAKE}>Short rains</text>
      <text x="12" y="100" fontSize="10" fill={MUTED} transform="rotate(-90 12 100)" textAnchor="middle">rain (mm)</text>
      <text x={x0 + w / 2} y="204" fontSize="9" textAnchor="middle" fill={MUTED}>Example: approximate monthly rain, central Kenya</text>
    </svg>
  );
}

// Approximate world temperature compared with the late 1800s (°C), WMO.
const TEMP: [number, number][] = [[1960, 0.3], [1980, 0.4], [2000, 0.75], [2010, 0.95], [2020, 1.25], [2024, 1.55]];

export function TemperatureTrend() {
  const x0 = 44, y0 = 170, w = 250, h = 140;
  const px = (year: number) => x0 + ((year - 1960) / (2024 - 1960)) * w;
  const py = (t: number) => y0 - (t / 1.6) * h;
  const path = TEMP.map(([yr, t], i) => `${i ? "L" : "M"}${px(yr)} ${py(t)}`).join(" ");
  return (
    <svg viewBox="0 0 320 210" role="img" aria-label="Line chart: world temperature rising from about 0.3 degrees warmer in 1960 to about 1.5 degrees warmer in 2024, compared with the late 1800s.">
      {[0, 0.5, 1, 1.5].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x0 + w} y1={py(v)} y2={py(v)} stroke={GRID} />
          <text x={x0 - 6} y={py(v) + 4} fontSize="10" textAnchor="end" fill={MUTED}>{`+${v}°`}</text>
        </g>
      ))}
      {[1960, 1980, 2000, 2020].map((yr) => (
        <text key={yr} x={px(yr)} y={y0 + 14} fontSize="10" textAnchor="middle" fill={INK}>{yr}</text>
      ))}
      <path d={path} fill="none" stroke={SOIL} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(2024)} cy={py(1.55)} r="5" fill={SOIL} />
      <text x={px(2024) - 6} y={py(1.55) - 10} fontSize="11" fontWeight="700" textAnchor="end" fill={SOIL}>2024: hottest year</text>
      <text x={x0 + w / 2} y="204" fontSize="9" textAnchor="middle" fill={MUTED}>World temperature compared with the late 1800s (approx., WMO)</text>
    </svg>
  );
}

// The teaching model: river height (m) = 0.04 × rain (mm) + 0.5
export const RIVER_M = 0.04;
export const RIVER_C = 0.5;
export const RIVER_DANGER = 3;
// Past storms (example): [rain in mm, river height in m], scattered around the line
const PAST_STORMS: [number, number][] = [[10, 1.1], [20, 1.1], [30, 1.9], [45, 2.1], [55, 3.0], [65, 2.9], [80, 3.9], [90, 3.9]];

export function RiverModel() {
  const x0 = 44, y0 = 170, w = 250, h = 140;
  const px = (rain: number) => x0 + (rain / 100) * w;
  const py = (m: number) => y0 - (m / 5) * h;
  return (
    <svg viewBox="0 0 320 210" role="img" aria-label="Dots for past storms, and a straight line through them: the more rain upstream, the higher the river. With no rain the river is half a metre high; each millimetre of rain raises it by 4 centimetres.">
      {[0, 1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x0 + w} y1={py(v)} y2={py(v)} stroke={GRID} />
          <text x={x0 - 6} y={py(v) + 4} fontSize="10" textAnchor="end" fill={MUTED}>{v} m</text>
        </g>
      ))}
      {[0, 50, 100].map((r) => (
        <text key={r} x={px(r)} y={y0 + 14} fontSize="10" textAnchor="middle" fill={INK}>{r} mm</text>
      ))}
      {/* Past storms (example data): the line is the best fit through them */}
      {PAST_STORMS.map(([r, m]) => (
        <circle key={r} cx={px(r)} cy={py(m)} r="4" fill="#9FB7BF" />
      ))}
      <line x1={px(0)} y1={py(RIVER_C)} x2={px(100)} y2={py(RIVER_M * 100 + RIVER_C)} stroke={LAKE} strokeWidth="4" strokeLinecap="round" />
      <circle cx={px(0)} cy={py(RIVER_C)} r="5" fill={LAKE} />
      <text x={px(0) + 8} y={py(RIVER_C) + 16} fontSize="11" fontWeight="700" fill={LAKE}>c = 0.5 m</text>
      <text x={px(60)} y={py(RIVER_M * 60 + RIVER_C) - 12} fontSize="12" fontWeight="700" fill={LAKE}>y = 0.04x + 0.5</text>
      <text x={x0 + w / 2} y="204" fontSize="9" textAnchor="middle" fill={MUTED}>Example model: river height (y) from rain upstream (x)</text>
    </svg>
  );
}
