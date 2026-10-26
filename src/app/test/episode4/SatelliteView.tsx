// ============================================================
// SATELLITE VIEW
// ------------------------------------------------------------
// The land seen from above, as a grid of 20 × 12 squares.
//
//   zoom "picture": looks like a map (water with waves, forest
//                   with round tree tops, farms with stripes)
//   zoom "pixels":  the squares pull apart and each shows its
//                   NUMBER, the way a computer sees the picture
//
// Optional extras:
//   labels     Tumaini's colour for each square (spreads in a wave)
//   highlight  red, pulsing squares (where to plant trees)
//   examples   squares the audience marked, with an outline and tag
//   onCellClick  makes the squares tappable
// ============================================================

import type { CSSProperties } from "react";
import type { Cell, Example, LandType } from "./imageMath";

const CELL = 20;
const OUTLINE = "#13303A";

const LAND_FILL: Record<LandType, string> = { water: "#3E8DAB", farm: "#B5D36B", forest: "#2F6A2B" };
export const LABEL_COLOUR: Record<LandType, string> = { water: "#2F6FD0", farm: "#F2B544", forest: "#1E5A23" };
export const LABEL_ICON: Record<LandType, string> = { water: "💧", farm: "🌾", forest: "🌳" };

/** The little picture inside each square (in picture mode) */
function Decoration({ type, x, y }: { type: LandType; x: number; y: number }) {
  if (type === "water") return <path d={`M${x + 3} ${y + 11} q3.5 -3 7 0 t7 0`} stroke="#BFE4F2" strokeWidth="1.4" fill="none" />;
  if (type === "forest")
    return (
      <>
        <circle cx={x + 7} cy={y + 8} r="4.6" fill="#4C8E44" />
        <circle cx={x + 13.5} cy={y + 13} r="4.2" fill="#3E7A38" />
      </>
    );
  return <rect x={x} y={y + 8} width={CELL} height="4" fill="#E8C85A" />;
}

interface SatelliteViewProps {
  cells: Cell[];
  zoom: "picture" | "pixels";
  labels?: (LandType | null)[];
  highlight?: Set<string>;
  examples?: Example[];
  onCellClick?: (cell: Cell) => void;
  /** Where Tumaini's labels start spreading from (column) */
  waveFrom?: number;
  label: string;
  className?: string;
}

export const cellKey = (c: { row: number; col: number }) => `${c.row},${c.col}`;

export default function SatelliteView({ cells, zoom, labels, highlight, examples = [], onCellClick, waveFrom = 0, label, className = "" }: SatelliteViewProps) {
  const pixels = zoom === "pixels";
  const exampleAt = new Map(examples.map((e) => [cellKey(e), e]));

  return (
    <svg
      className={`tm-satview ${pixels ? "is-pixels" : "is-picture"} ${onCellClick ? "is-clickable" : ""} ${className}`}
      viewBox={`-2 -2 ${20 * CELL + 4} ${12 * CELL + 4}`}
      role="img"
      aria-label={label}
    >
      <rect x="-2" y="-2" width={20 * CELL + 4} height={12 * CELL + 4} fill={pixels ? "#0E2A33" : OUTLINE} rx="6" />
      {cells.map((cell, i) => {
        const x = cell.col * CELL;
        const y = cell.row * CELL;
        const l = labels?.[i] ?? null;
        const ex = exampleAt.get(cellKey(cell));
        const delay = `${Math.abs(cell.col - waveFrom) * 35 + cell.row * 10}ms`;
        return (
          <g
            key={cellKey(cell)}
            className="tm-satcell"
            onClick={onCellClick ? () => onCellClick(cell) : undefined}
            style={{ "--tm-delay": delay } as CSSProperties}
          >
            {/* The land itself */}
            <rect className="tm-satcell-land" x={x} y={y} width={CELL} height={CELL} fill={LAND_FILL[cell.type]} />
            <g className="tm-satcell-deco">
              <Decoration type={cell.type} x={x} y={y} />
            </g>
            {/* Tumaini's label colour, spreading in a wave */}
            {labels && (
              <rect
                className={`tm-satcell-label ${l ? "is-on" : ""}`}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={l ? LABEL_COLOUR[l] : "transparent"}
                style={{ transitionDelay: delay }}
              />
            )}
            {/* The pixel's number */}
            <text className="tm-pixel-num" x={x + CELL / 2} y={y + 14} textAnchor="middle" fontSize="11" fontWeight="900" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2.4" paintOrder="stroke">
              {cell.green}
            </text>
            {/* Red highlight: plant trees here */}
            {highlight?.has(cellKey(cell)) && <rect className="tm-satcell-red" x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} fill="none" stroke="#E0533D" strokeWidth="3" />}
            {/* An example the audience marked */}
            {ex && (
              <g className="tm-satcell-example">
                <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} fill="none" stroke={LABEL_COLOUR[ex.label]} strokeWidth="3.5" />
                <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} fill="none" stroke="#FFFFFF" strokeWidth="1" />
                <text x={x + CELL - 1} y={y + 7} textAnchor="end" fontSize="8">
                  {LABEL_ICON[ex.label]}
                </text>
              </g>
            )}
            {/* A bigger invisible target, so tapping is easy */}
            {onCellClick && <rect x={x} y={y} width={CELL} height={CELL} fill="transparent" />}
          </g>
        );
      })}
    </svg>
  );
}

/** The key under the map */
export function LandKey({ withLabels = false }: { withLabels?: boolean }) {
  const colours = withLabels ? LABEL_COLOUR : LAND_FILL;
  return (
    <div className="tm-graph-legend tm-land-key" aria-hidden="true">
      {(["forest", "farm", "water"] as LandType[]).map((t) => (
        <span key={t}>
          <i className="tm-key-square" style={{ background: colours[t] }} /> {LABEL_ICON[t]} {t}
        </span>
      ))}
    </div>
  );
}
