"use client";

// ============================================================
// VILLAGE MAP
// ------------------------------------------------------------
// A chart that looks like a map:
//   across = floods in the last 10 years (0–10)
//   up     = dry spells in the last 10 years (0–10)
//
// Each village is a little house. Its ROOF colour shows its group
// (grey = no group yet). Group centres are big stars. When the
// stars move, they slide smoothly to their new place.
//
// Props:
//   villages     the 24 villages
//   groupOf      for each village, its group number (or null = grey)
//   centres      the star positions (leave empty for no stars)
//   colours      the colour of each group / star
//   showLines    thin lines from each house to its star (Step A)
//   labels       optional words beside each star, e.g. "Lower risk"
// ============================================================

import type { CSSProperties } from "react";
import { useAnimatedNumbers } from "../components/useAnimatedNumbers";
import type { Village, XY } from "./clusterMath";

const MAP = { left: 62, right: 502, top: 18, bottom: 398, max: 10 };
export const mx = (floods: number) => MAP.left + (floods / MAP.max) * (MAP.right - MAP.left);
export const my = (dry: number) => MAP.bottom - (dry / MAP.max) * (MAP.bottom - MAP.top);

const OUTLINE = "#13303A";
const GREY = "#B8C2C7";

/** A five-pointed star centred on (0, 0). */
function starPath(r: number) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(radius * Math.cos(a)).toFixed(1)},${(radius * Math.sin(a)).toFixed(1)}`;
  });
  return `M${points.join(" L")} Z`;
}
const STAR = starPath(22);

interface VillageMapProps {
  villages: Village[];
  groupOf?: (number | null)[];
  centres?: XY[];
  colours: string[];
  showLines?: boolean;
  labels?: (string | null)[];
  className?: string;
}

export default function VillageMap({ villages, groupOf, centres = [], colours, showLines = false, labels, className = "" }: VillageMapProps) {
  // Slide the stars smoothly: animate all their x and y numbers together.
  const flat = useAnimatedNumbers(centres.flatMap((c) => [c.x, c.y]), 900);
  const shownCentres: XY[] = centres.map((_, i) => ({ x: flat[i * 2] ?? centres[i].x, y: flat[i * 2 + 1] ?? centres[i].y }));

  const description = centres.length
    ? `Map of ${villages.length} villages with ${centres.length} group centres.`
    : `Map of ${villages.length} villages, not yet in groups.`;

  return (
    <svg className={`tm-graph tm-village-map ${className}`} viewBox="0 0 520 456" role="img" aria-label={description}>
      {/* Map background: land colour with soft grid lines */}
      <rect width="520" height="456" rx="18" fill="#F3EBD3" />
      {/* Hints of the landscape in the corners: lake and river bottom right, dry hills top left */}
      <path d={`M${mx(7)} ${MAP.bottom} Q${mx(8.5)} ${my(2.5)} ${MAP.right} ${my(3.5)} L${MAP.right} ${MAP.bottom} Z`} fill="#BFDCE8" opacity="0.7" />
      <path d={`M${MAP.left} ${my(6.5)} Q${mx(2.5)} ${my(8.5)} ${mx(4.5)} ${MAP.top} L${MAP.left} ${MAP.top} Z`} fill="#E5C99A" opacity="0.7" />

      {Array.from({ length: 6 }, (_, i) => {
        const v = i * 2;
        return (
          <g key={v}>
            <line x1={mx(v)} y1={MAP.top} x2={mx(v)} y2={MAP.bottom} stroke="#DCCFAE" strokeWidth="1.5" />
            <line x1={MAP.left} y1={my(v)} x2={MAP.right} y2={my(v)} stroke="#DCCFAE" strokeWidth="1.5" />
            <text x={mx(v)} y={MAP.bottom + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill="#5E4A2E">{v}</text>
            <text x={MAP.left - 10} y={my(v) + 5} textAnchor="end" fontSize="15" fontWeight="700" fill="#5E4A2E">{v}</text>
          </g>
        );
      })}
      <line x1={MAP.left} y1={MAP.bottom} x2={MAP.right} y2={MAP.bottom} stroke="#5E4A2E" strokeWidth="3" />
      <line x1={MAP.left} y1={MAP.top} x2={MAP.left} y2={MAP.bottom} stroke="#5E4A2E" strokeWidth="3" />
      <text x={(MAP.left + MAP.right) / 2} y="448" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1B6E8E">
        🌊 Floods in the last 10 years →
      </text>
      <text x="20" y={(MAP.top + MAP.bottom) / 2} textAnchor="middle" fontSize="16" fontWeight="800" fill="#A4532F" transform={`rotate(-90 20 ${(MAP.top + MAP.bottom) / 2})`}>
        ☀️ Dry spells in the last 10 years →
      </text>

      {/* Step A: lines from each house to its nearest star */}
      {showLines &&
        groupOf &&
        villages.map((v, i) => {
          const g = groupOf[i];
          if (g === null || !shownCentres[g]) return null;
          return (
            <line
              key={`l${v.id}`}
              className="tm-join-line"
              x1={mx(v.x)}
              y1={my(v.y)}
              x2={mx(shownCentres[g].x)}
              y2={my(shownCentres[g].y)}
              stroke={colours[g]}
              strokeWidth="2.5"
            />
          );
        })}

      {/* The villages: little houses */}
      {villages.map((v, i) => {
        const g = groupOf?.[i] ?? null;
        const roof = g === null ? GREY : colours[g];
        const x = mx(v.x);
        const y = my(v.y);
        return (
          <g key={v.id} aria-label={v.name}>
            <title>{`${v.name}: ${v.x} floods, ${v.y} dry spells`}</title>
            <rect x={x - 8} y={y - 3} width="16" height="13" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="2" />
            <path className="tm-roof" d={`M${x - 12} ${y - 2} L${x} ${y - 13} L${x + 12} ${y - 2} Z`} fill={roof} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
            <rect x={x - 2.5} y={y + 3} width="5" height="7" fill="#A4532F" />
          </g>
        );
      })}

      {/* The group centres: big stars, dropping in with a bounce */}
      {shownCentres.map((c, i) => (
        <g key={`c${i}`} style={{ transform: `translate(${mx(c.x)}px, ${my(c.y)}px)` } as CSSProperties}>
          <g className="tm-star-drop" style={{ animationDelay: `${i * 0.2}s` }}>
            <path d={STAR} fill={colours[i]} stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" />
            <path d={STAR} fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          </g>
          {labels?.[i] && (() => {
            // "Flood-prone (near the lake and river)" → two lines
            const [main, extra] = labels[i]!.split(" (");
            return (
              <g className="tm-group-label">
                <rect x="-88" y="26" width="176" height={extra ? 46 : 30} rx="14" fill="#FFFFFF" stroke={colours[i]} strokeWidth="3" />
                <text x="0" y="46" textAnchor="middle" fontSize="15" fontWeight="900" fill={OUTLINE}>
                  {main}
                </text>
                {extra && (
                  <text x="0" y="64" textAnchor="middle" fontSize="12" fontWeight="700" fill={OUTLINE}>
                    ({extra}
                  </text>
                )}
              </g>
            );
          })()}
        </g>
      ))}
    </svg>
  );
}
