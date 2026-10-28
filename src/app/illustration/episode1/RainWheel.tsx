"use client";

// ============================================================
// RAINFALL WHEEL
// ------------------------------------------------------------
// A round chart with one wedge per month, starting with
// January at the top and going clockwise like a clock.
// The longer the wedge, the more rain fell that month.
//
// values:   rainfall for each month (mm)
// compare:  optional second year, drawn as a dashed outline
// month:    which month to highlight (0 = January)
// seasons:  true = label the two rainy "humps"
//
// When "values" changes, the wedges grow or shrink smoothly
// (see components/useAnimatedNumbers.ts).
// ============================================================

import { useAnimatedNumbers } from "../components/useAnimatedNumbers";
import { MONTHS } from "./content";

const MIN_R = 22; // radius of a month with no rain
const MAX_R = 150; // radius of a month with 300 mm
const MAX_MM = 300;

const radius = (mm: number) => MIN_R + (Math.min(mm, MAX_MM) / MAX_MM) * (MAX_R - MIN_R);

// A point on a circle. Angle 0 = top, going clockwise.
function point(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}

// The shape of one wedge (a slice of pizza)
function wedgePath(month: number, r: number) {
  const gap = 1.5; // small gap between wedges
  const [x1, y1] = point(month * 30 + gap, r);
  const [x2, y2] = point((month + 1) * 30 - gap, r);
  return `M0 0 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

// An arc around the outside, used to mark a season
function seasonArc(fromMonth: number, toMonth: number, r: number) {
  const [x1, y1] = point(fromMonth * 30 + 2, r);
  const [x2, y2] = point((toMonth + 1) * 30 - 2, r);
  return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
}


// Wetter months get a deeper blue
function wedgeColour(mm: number) {
  if (mm >= 200) return "#1B6E8E";
  if (mm >= 150) return "#3E8DAB";
  if (mm >= 110) return "#7DB7CC";
  return "#B5D8E4";
}

interface RainWheelProps {
  values: number[];
  compare?: number[];
  month: number;
  seasons?: boolean;
}

export default function RainWheel({ values, compare, month, seasons = false }: RainWheelProps) {
  const shown = useAnimatedNumbers(values);

  return (
    <svg
      className="tm-wheel"
      viewBox="-260 -225 520 450"
      role="img"
      aria-label={`Rainfall wheel. ${MONTHS[month]}: about ${Math.round(values[month])} millimetres of rain.${
        seasons ? " Two rainy seasons: the long rains from March to May, and the short rains from October to December." : ""
      }`}
    >
      {/* Guide rings for 100, 200 and 300 mm */}
      {[100, 200, 300].map((mm) => (
        <g key={mm}>
          <circle r={radius(mm)} fill="none" stroke="#9FB7BF" strokeWidth="1.5" strokeDasharray="4 5" />
          <text x="4" y={-radius(mm) - 3} fontSize="12" fill="#35535D">
            {mm} mm
          </text>
        </g>
      ))}

      {/* The wedges */}
      {shown.map((mm, i) => (
        <path
          key={i}
          d={wedgePath(i, radius(mm))}
          fill={i === month ? "#F2B544" : wedgeColour(mm)}
          stroke="#13303A"
          strokeWidth={i === month ? 4 : 2}
          strokeLinejoin="round"
        />
      ))}

      {/* A normal year as a dashed outline, for comparing */}
      {compare?.map((mm, i) => (
        <path key={`c${i}`} d={wedgePath(i, radius(mm))} fill="none" stroke="#A4532F" strokeWidth="3" strokeDasharray="7 5" />
      ))}

      <circle r={MIN_R - 4} fill="#FFFFFF" stroke="#13303A" strokeWidth="3" />

      {/* Month letters around the outside */}
      {MONTHS.map((name, i) => {
        const [x, y] = point(i * 30 + 15, 168);
        return (
          <text
            key={name}
            x={x}
            y={y + 6}
            textAnchor="middle"
            fontSize="18"
            fontWeight={i === month ? 900 : 700}
            fill={i === month ? "#A4532F" : "#13303A"}
          >
            {name.slice(0, 3)}
          </text>
        );
      })}

      {/* The two rainy seasons */}
      {seasons && (
        <g className="tm-season-labels">
          <path d={seasonArc(2, 4, 188)} stroke="#4C8E44" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d={seasonArc(9, 11, 188)} stroke="#4C8E44" strokeWidth="9" fill="none" strokeLinecap="round" />
          <SeasonLabel x={200} y={152} lines={["Long rains", "(Mar–May)"]} />
          <SeasonLabel x={-192} y={-186} lines={["Short rains", "(Oct–Dec)"]} />
        </g>
      )}
    </svg>
  );
}

function SeasonLabel({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  return (
    <g>
      <rect x={x - 54} y={y - 20} width="108" height="46" rx="10" fill="#FFFFFF" stroke="#4C8E44" strokeWidth="3" />
      {lines.map((line, i) => (
        <text key={line} x={x} y={y + i * 19} textAnchor="middle" fontSize="15" fontWeight={i === 0 ? 800 : 600} fill="#13303A">
          {line}
        </text>
      ))}
    </g>
  );
}
