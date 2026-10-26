// ============================================================
// LEAF CHART  ("Tumaini's screen" in Scene 4)
// ------------------------------------------------------------
// Across: number of spots, 0 to 8
// Up:     how yellow, from fresh green (bottom) to yellow-brown (top)
//
// Each leaf is a dot:  green = healthy,  brown = sick.
// When "showLine" is on, Tumaini's dividing line draws itself
// across the chart, and the two sides are lightly shaded:
// green for "looks healthy", brown for "looks sick".
// ============================================================

import { leafColour } from "../components/Leaf";
import { LINE_VALUE, lineYellowness } from "./leafMath";

const CHART = { left: 64, right: 404, top: 20, bottom: 262 };
export const sx = (spots: number) => CHART.left + (spots / 8) * (CHART.right - CHART.left);
export const sy = (yellowness: number) => CHART.bottom - yellowness * (CHART.bottom - CHART.top);

export const HEALTHY_COLOUR = "#4FC060";
export const SICK_COLOUR = "#B5762C";

export interface ChartDot {
  key: string;
  spots: number;
  yellowness: number;
  /** The colour group to show: true = brown (sick), false = green (healthy) */
  sick: boolean;
  /** Tumaini got this one wrong: show a red ring and ✘ */
  wrong?: boolean;
  /** The leaf being looked at right now: show a pulsing ring */
  current?: boolean;
  /** A leaf Tumaini sorted by itself (drawn as a square, not a circle) */
  sortedByAI?: boolean;
}

interface LeafChartProps {
  dots: ChartDot[];
  showLine?: boolean;
  label: string;
}

// Where the line meets the bottom of the chart (yellowness 0): spots = 0.85 × 8 = 6.8
const LINE_END_SPOTS = LINE_VALUE * 8;

export default function LeafChart({ dots, showLine = false, label }: LeafChartProps) {
  // The two shaded areas, split by the line
  const healthyArea = `M${sx(0)} ${sy(0)} L${sx(0)} ${sy(LINE_VALUE)} L${sx(LINE_END_SPOTS)} ${sy(0)} Z`;
  const sickArea = `M${sx(0)} ${sy(LINE_VALUE)} L${sx(0)} ${sy(1)} L${sx(8)} ${sy(1)} L${sx(8)} ${sy(0)} L${sx(LINE_END_SPOTS)} ${sy(0)} Z`;

  return (
    <svg className="tm-graph tm-leaf-chart" viewBox="0 0 420 316" role="img" aria-label={label}>
      <rect width="420" height="316" rx="18" fill="#0E2A33" />

      {/* Shaded sides (fade in with the line) */}
      {showLine && (
        <g className="tm-chart-shade">
          <path d={healthyArea} fill={HEALTHY_COLOUR} opacity="0.18" />
          <path d={sickArea} fill={SICK_COLOUR} opacity="0.22" />
          <text x={sx(0.4)} y={sy(0.08)} fontSize="16" fontWeight="900" fill={HEALTHY_COLOUR}>
            looks healthy
          </text>
          <text x={sx(7.6)} y={sy(0.9)} textAnchor="end" fontSize="16" fontWeight="900" fill="#E0A55A">
            looks sick
          </text>
        </g>
      )}

      {/* Grid */}
      {Array.from({ length: 9 }, (_, s) => (
        <g key={`x${s}`}>
          <line x1={sx(s)} y1={CHART.top} x2={sx(s)} y2={CHART.bottom} stroke="#1F4450" strokeWidth="1.5" />
          <text x={sx(s)} y={CHART.bottom + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill="#BFDCE8">
            {s}
          </text>
        </g>
      ))}
      {[0.25, 0.5, 0.75, 1].map((y) => (
        <line key={y} x1={CHART.left} y1={sy(y)} x2={CHART.right} y2={sy(y)} stroke="#1F4450" strokeWidth="1.5" />
      ))}
      <line x1={CHART.left} y1={CHART.bottom} x2={CHART.right} y2={CHART.bottom} stroke="#BFDCE8" strokeWidth="3" />

      {/* The "how yellow" scale: a colour strip from green to yellow-brown */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={CHART.left - 22} y={sy((i + 1) / 10)} width="14" height={(CHART.bottom - CHART.top) / 10 + 0.5} fill={leafColour((i + 0.5) / 10)} />
      ))}
      <rect x={CHART.left - 22} y={CHART.top} width="14" height={CHART.bottom - CHART.top} fill="none" stroke="#BFDCE8" strokeWidth="2" />

      {/* Axis titles */}
      <text x={(CHART.left + CHART.right) / 2} y="310" textAnchor="middle" fontSize="16" fontWeight="800" fill="#8BE9F5">
        Number of spots →
      </text>
      <text x="22" y={(CHART.top + CHART.bottom) / 2} textAnchor="middle" fontSize="16" fontWeight="800" fill="#8BE9F5" transform={`rotate(-90 22 ${(CHART.top + CHART.bottom) / 2})`}>
        How yellow →
      </text>

      {/* Tumaini's dividing line: draws itself (see .tm-divider in episode2.css) */}
      {showLine && (
        <line
          className="tm-divider"
          pathLength={1}
          x1={sx(0)}
          y1={sy(lineYellowness(0))}
          x2={sx(LINE_END_SPOTS)}
          y2={sy(0)}
          stroke="#8BE9F5"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}

      {/* The leaves */}
      {dots.map((d) => {
        const x = sx(d.spots);
        const y = sy(d.yellowness);
        const colour = d.sick ? SICK_COLOUR : HEALTHY_COLOUR;
        return (
          <g key={d.key} className="tm-chart-dot">
            {d.current && <circle className="tm-dot-ring" cx={x} cy={y} r="18" fill="none" stroke="#F2B544" strokeWidth="3" />}
            {d.sortedByAI ? (
              <rect x={x - 9} y={y - 9} width="18" height="18" rx="3" fill={colour} stroke={d.wrong ? "#E0533D" : "#FFFFFF"} strokeWidth="3" />
            ) : (
              <circle cx={x} cy={y} r="9" fill={colour} stroke="#FFFFFF" strokeWidth="3" />
            )}
            {d.wrong && (
              <text x={x + 14} y={y - 10} fontSize="20" fontWeight="900" fill="#FF8A75">
                ✘
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** The legend under the chart */
export function LeafChartKey({ withAI = false }: { withAI?: boolean }) {
  return (
    <div className="tm-graph-legend" aria-hidden="true">
      <span>
        <i className="tm-key-dot" style={{ background: HEALTHY_COLOUR }} /> healthy
      </span>
      <span>
        <i className="tm-key-dot" style={{ background: SICK_COLOUR }} /> sick
      </span>
      {withAI && (
        <span>
          <i className="tm-key-square" /> sorted by Tumaini
        </span>
      )}
    </div>
  );
}
