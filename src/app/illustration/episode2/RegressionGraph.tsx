"use client";

// ============================================================
// REGRESSION GRAPH  ("Tumaini's screen" in Scene 3)
// ------------------------------------------------------------
// Across:  hours of heavy rain, 0 to 12
// Up:      river height in metres, 0 to 6
// Red dashed line: DANGER at 4.5 m
//
// It can show:
//   • the storms as dots (the newest one drops in from above)
//   • Tumaini's best-fit line, which slides smoothly when it changes
//   • the "mistakes": thin dashed lines from each dot to the line
//
// Step (c) will reuse this graph for "Beat the computer" and
// the forecast, so it also accepts extra drawings (children).
// ============================================================

import { useId, type ReactNode } from "react";
import { useAnimatedNumbers } from "../components/useAnimatedNumbers";
import { GLOW } from "../characters/Tumaini";
import { predict, type Line, type Point } from "./regressionMath";

// ---------- Turning numbers into positions on the graph ----------
export const GRAPH = { left: 64, right: 500, top: 18, bottom: 286, maxX: 12, maxY: 6 };
export const DANGER = 4.5;

/** Hours of rain → position across */
export const gx = (hours: number) => GRAPH.left + (hours / GRAPH.maxX) * (GRAPH.right - GRAPH.left);
/** River height → position up and down (a bigger height is higher up, so a smaller y) */
export const gy = (metres: number) => GRAPH.bottom - (metres / GRAPH.maxY) * (GRAPH.bottom - GRAPH.top);

const MISTAKE_COLOUR = "#F6B8A8";

/** Smoothly animates a line when it changes. Returns null while there is no line. */
export function useAnimatedLine(line: Line | null): Line | null {
  const [m, c] = useAnimatedNumbers(line ? [line.m, line.c] : [0, 0], 700);
  return line ? { m, c } : null;
}

interface RegressionGraphProps {
  points: Point[];
  /** The hours of the newest storm, so only that dot plays the "drop" animation */
  newestX?: number;
  line?: Line | null;
  showMistakes?: boolean;
  /** Extra drawings on top (used in step (c)) */
  children?: ReactNode;
  label: string;
  className?: string;
}

export default function RegressionGraph({ points, newestX, line = null, showMistakes = true, children, label, className = "" }: RegressionGraphProps) {
  const clipId = `clip-${useId().replace(/:/g, "")}`;
  const shownLine = useAnimatedLine(line);

  return (
    <svg className={`tm-graph ${className}`} viewBox="0 0 520 336" role="img" aria-label={label}>
      <defs>
        <clipPath id={clipId}>
          <rect x={GRAPH.left} y={GRAPH.top} width={GRAPH.right - GRAPH.left} height={GRAPH.bottom - GRAPH.top} />
        </clipPath>
      </defs>

      {/* Screen background and grid */}
      <rect width="520" height="336" rx="18" fill="#0E2A33" />
      {Array.from({ length: 7 }, (_, m) => (
        <g key={`y${m}`}>
          <line x1={GRAPH.left} y1={gy(m)} x2={GRAPH.right} y2={gy(m)} stroke="#1F4450" strokeWidth="1.5" />
          <text x={GRAPH.left - 10} y={gy(m) + 6} textAnchor="end" fontSize="16" fontWeight="700" fill="#BFDCE8">
            {m}
          </text>
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const h = i * 2;
        return (
          <g key={`x${h}`}>
            <line x1={gx(h)} y1={GRAPH.top} x2={gx(h)} y2={GRAPH.bottom} stroke="#1F4450" strokeWidth="1.5" />
            <text x={gx(h)} y={GRAPH.bottom + 20} textAnchor="middle" fontSize="16" fontWeight="700" fill="#BFDCE8">
              {h}
            </text>
          </g>
        );
      })}
      <line x1={GRAPH.left} y1={GRAPH.bottom} x2={GRAPH.right} y2={GRAPH.bottom} stroke="#BFDCE8" strokeWidth="3" />
      <line x1={GRAPH.left} y1={GRAPH.top} x2={GRAPH.left} y2={GRAPH.bottom} stroke="#BFDCE8" strokeWidth="3" />

      {/* Axis titles */}
      <text x={(GRAPH.left + GRAPH.right) / 2} y="330" textAnchor="middle" fontSize="16" fontWeight="800" fill={GLOW}>
        Hours of heavy rain →
      </text>
      <text x="18" y={(GRAPH.top + GRAPH.bottom) / 2} textAnchor="middle" fontSize="16" fontWeight="800" fill={GLOW} transform={`rotate(-90 18 ${(GRAPH.top + GRAPH.bottom) / 2})`}>
        River height (metres) →
      </text>

      {/* DANGER line (flashes when the graph has the class "is-danger") */}
      <g className="tm-graph-danger">
        <line x1={GRAPH.left} y1={gy(DANGER)} x2={GRAPH.right} y2={gy(DANGER)} stroke="#E0533D" strokeWidth="3" strokeDasharray="10 6" />
        {/* Just BELOW the line on the left: the storms there are far lower, and height labels sit above the line */}
        <text x={GRAPH.left + 8} y={gy(DANGER) + 20} fontSize="14" fontWeight="900" fill="#FF8A75">
          DANGER 4.5 m
        </text>
      </g>

      <g clipPath={`url(#${clipId})`}>
        {/* Mistakes: from each dot straight up or down to the line */}
        {shownLine &&
          showMistakes &&
          points.map((p) => (
            <line
              key={`mistake-${p.x}`}
              x1={gx(p.x)}
              y1={gy(p.y)}
              x2={gx(p.x)}
              y2={gy(predict(shownLine, p.x))}
              stroke={MISTAKE_COLOUR}
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          ))}

        {/* Tumaini's best-fit line */}
        {shownLine && (
          <line
            x1={gx(0)}
            y1={gy(predict(shownLine, 0))}
            x2={gx(GRAPH.maxX)}
            y2={gy(predict(shownLine, GRAPH.maxX))}
            stroke={GLOW}
            strokeWidth="5"
            strokeLinecap="round"
            className="tm-best-line"
          />
        )}
      </g>

      {/* The storms */}
      {points.map((p) => (
        <circle
          key={`dot-${p.x}`}
          className={p.x === newestX ? "tm-dot-drop" : undefined}
          cx={gx(p.x)}
          cy={gy(p.y)}
          r="9"
          fill="#F2B544"
          stroke="#13303A"
          strokeWidth="3"
        />
      ))}

      {children}
    </svg>
  );
}

// ---------- A tiny copy for Tumaini's face screen ----------
// The face screen is the box x 52–148, y 53–117 in Tumaini's drawing.
export function MiniGraph({ points, line }: { points: Point[]; line: Line | null }) {
  const mx = (h: number) => 60 + (h / 12) * 82;
  const my = (m: number) => 110 - (m / 6) * 50;
  const shownLine = useAnimatedLine(line);
  return (
    <>
      <path d="M60 60 V110 H142" stroke={GLOW} strokeWidth="2" fill="none" />
      {shownLine && (
        <line
          x1={mx(0)}
          y1={Math.max(58, Math.min(112, my(predict(shownLine, 0))))}
          x2={mx(12)}
          y2={Math.max(58, Math.min(112, my(predict(shownLine, 12))))}
          stroke={GLOW}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {points.map((p) => (
        <circle key={p.x} cx={mx(p.x)} cy={my(p.y)} r="2.8" fill="#F2B544" />
      ))}
    </>
  );
}
