"use client";

// ============================================================
// TASK 1: RISK MAP  (Part 4)
// ------------------------------------------------------------
// Switch on map layers (river, low ground, homes & school). Where
// the river and the low ground meet, a red flood zone appears.
// Then tap the village most at risk. "Next" unlocks on the right
// one; every other village explains why it is less at risk.
// Calm on purpose: layers just appear, no animation.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";

type Layer = "river" | "low" | "homes";

interface Village {
  id: string;
  letter: string;
  name: string;
  x: number;
  y: number;
  homes: number;
  school?: boolean;
  best?: boolean;
  why: string;
}

const VILLAGES: Village[] = [
  { id: "river", letter: "A", name: "River Village", x: 125, y: 150, homes: 4, school: true, best: true, why: "Yes! Low ground, right beside the river, with many homes and a school. This is the highest risk." },
  { id: "market", letter: "B", name: "Market Town", x: 70, y: 52, homes: 3, why: "Market Town is near the river, but on high ground. Floodwater is less likely to reach it." },
  { id: "hill", letter: "C", name: "Hill Village", x: 290, y: 50, homes: 2, why: "Hill Village is high up and far from the river. Low risk." },
  { id: "farm", letter: "D", name: "Farm Village", x: 285, y: 185, homes: 2, why: "Farm Village is on low ground, but far from the river. Some risk, but less than the village beside the river." },
];

const LAYERS: { id: Layer; label: string }[] = [
  { id: "river", label: "🌊 River" },
  { id: "low", label: "⬇️ Low ground" },
  { id: "homes", label: "🏠 Homes & school" },
];

export default function RiskMapActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [on, setOn] = useState<Record<Layer, boolean>>({ river: true, low: done, homes: done });
  const [picked, setPicked] = useState<string | null>(done ? "river" : null);
  const village = VILLAGES.find((v) => v.id === picked) ?? null;

  useEffect(() => {
    onSpeech(village ? village.why : "Switch on the layers, then tap the village most at risk.");
    if (village?.best) onComplete();
  }, [village, onComplete, onSpeech]);

  const toggle = (layer: Layer) => setOn((s) => ({ ...s, [layer]: !s[layer] }));

  return (
    <div className="tm-p4">
      <div className="tm-p4-toggles" role="group" aria-label="Map layers">
        {LAYERS.map((l) => (
          <button key={l.id} type="button" className={`tm-p4-toggle ${on[l.id] ? "is-on" : ""}`} aria-pressed={on[l.id]} onClick={() => toggle(l.id)}>
            {l.label}
          </button>
        ))}
      </div>

      <svg className="tm-p4-map" viewBox="0 0 360 240" role="img" aria-label="Map of four villages, A to D, and a river running through low ground on the left.">
        <rect width="360" height="240" rx="12" fill="#EEF3E6" />
        {/* High ground (hills) */}
        <path d="M200 0 H360 V110 Q300 120 240 95 Q210 60 200 0Z" fill="#DDE6CF" />
        <path d="M0 0 H130 Q110 40 60 75 Q30 85 0 80Z" fill="#DDE6CF" />
        {on.low && <path d="M0 110 Q90 100 170 130 Q230 150 360 150 V240 H0Z" fill="#CFE0EC" />}
        {on.low && <text x="330" y="232" fontSize="10" fill="#35535D" textAnchor="end">low ground</text>}
        {on.river && on.low && <path d="M40 120 Q100 115 170 145 Q190 175 150 200 Q90 215 40 190Z" fill="#A4532F" opacity="0.28" />}
        {on.river && on.low && <text x="60" y="205" fontSize="11" fontWeight="700" fill="#A4532F">flood zone</text>}
        {on.river && <path d="M150 0 Q120 60 150 110 Q180 160 110 240" fill="none" stroke="#1B6E8E" strokeWidth="10" strokeLinecap="round" />}
        {VILLAGES.map((v) => (
          <g key={v.id}>
            {on.homes &&
              Array.from({ length: v.homes }).map((_, i) => (
                <text key={i} x={v.x - 22 + i * 12} y={v.y + 24} fontSize="12" aria-hidden="true">🏠</text>
              ))}
            {on.homes && v.school && <text x={v.x + 22} y={v.y + 4} fontSize="14" aria-hidden="true">🏫</text>}
            <circle cx={v.x} cy={v.y} r="13" fill={picked === v.id ? (v.best ? "#4C8E44" : "#A4532F") : "#13303A"} />
            <text x={v.x} y={v.y + 5} fontSize="13" fontWeight="800" fill="#FFFFFF" textAnchor="middle">{v.letter}</text>
          </g>
        ))}
      </svg>

      <div className="tm-choice-options tm-p4-two">
        {VILLAGES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`tm-choice-option ${picked === v.id ? (v.best ? "is-best" : "is-weak") : ""}`}
            aria-pressed={picked === v.id}
            onClick={() => setPicked(v.id)}
          >
            <strong>{v.letter}</strong> {v.name}
          </button>
        ))}
      </div>

      <p className={`tm-choice-result ${village ? (village.best ? "is-best" : "is-weak") : ""}`} aria-live="polite">
        {village ? `${village.best ? "✔" : "✖"} ${village.why}${village.best ? "" : " Try another."}` : ""}
      </p>
    </div>
  );
}
