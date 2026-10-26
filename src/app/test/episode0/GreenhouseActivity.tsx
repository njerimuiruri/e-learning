"use client";

// ============================================================
// EPISODE 0 ACTIVITY: "Why is the Earth getting warmer?"
// ------------------------------------------------------------
// The greenhouse effect as a blanket. Sunlight comes in and
// warms the Earth; the Earth sends heat back out. Gases such as
// carbon dioxide form a "blanket" in the air that sends some of
// that heat back down. More gases = a thicker blanket = more heat
// trapped = a warmer Earth.
//
// A slider moves through time. The warming numbers are rounded
// from real measurements (WMO): about +1.3 °C today compared with
// the 1800s, and about +3 °C by 2100 if emissions keep rising.
// "Next" unlocks once the slider has reached "Today".
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import { useAnimatedNumber } from "../components/useAnimatedNumbers";

interface Era {
  label: string;
  /** Warming compared with the 1800s, °C */
  warming: number;
  /** How thick the blanket of gases is: 0 = thin … 3 = very thick */
  blanket: number;
  text: string;
}

const ERAS: Era[] = [
  {
    label: "Long ago (1850)",
    warming: 0,
    blanket: 0,
    text: "A thin blanket of gases keeps the Earth just warm enough for life. Some heat escapes back to space.",
  },
  {
    label: "1950",
    warming: 0.3,
    blanket: 1,
    text: "Factories, cars and power stations burn more and more coal, oil and gas. The blanket starts to get thicker.",
  },
  {
    label: "Today",
    warming: 1.3,
    blanket: 2,
    text: "The blanket is much thicker. More heat is trapped. The Earth is now about 1.3 °C warmer than in the 1800s.",
  },
  {
    label: "2100, if nothing changes",
    warming: 3,
    blanket: 3,
    text: "If we keep burning more, the Earth could be about 3 °C warmer by 2100. That is why the world made a promise.",
  },
];

const OUTLINE = "#13303A";
const TODAY = 2;

// The thermometer: 0 °C at the bottom, 3.5 °C at the top
const T_TOP = 60;
const T_BOTTOM = 300;
const ty = (c: number) => T_BOTTOM - (c / 3.5) * (T_BOTTOM - T_TOP);

export default function GreenhouseActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [era, setEra] = useState(done ? TODAY : 0);
  const [reachedToday, setReachedToday] = useState(done);
  const current = ERAS[era];
  const warming = useAnimatedNumber(current.warming, 900);
  const blanket = useAnimatedNumber(current.blanket, 900);

  useEffect(() => {
    if (era >= TODAY) setReachedToday(true);
  }, [era]);
  useEffect(() => {
    if (reachedToday) onComplete();
  }, [reachedToday, onComplete]);
  useEffect(() => {
    onSpeech(`${current.label}. ${current.text}`);
  }, [current, onSpeech]);

  // More blanket = more heat arrows bounce back down
  const trapped = Math.round(blanket + 1);
  const thickness = 16 + blanket * 18;

  return (
    <div className="tm-activity">
      <div className="tm-greenhouse">
        <svg viewBox="0 0 640 360" className="tm-greenhouse-svg" role="img" aria-label={`${current.label}: the blanket of gases is ${["thin", "getting thicker", "thick", "very thick"][current.blanket]}. The Earth is about ${current.warming} degrees warmer than in the 1800s.`}>
          {/* Space */}
          <rect width="640" height="360" fill="#13253A" />
          {[40, 120, 210, 330, 420, 470].map((x, i) => (
            <circle key={x} cx={x} cy={20 + (i * 37) % 90} r="1.8" fill="#FFFFFF" opacity="0.8" />
          ))}

          {/* The sun, and sunlight coming in */}
          <circle cx="60" cy="60" r="34" fill="#F2B544" stroke="#E09A1F" strokeWidth="4" />
          {[0, 1, 2].map((i) => (
            <path key={i} className="tm-ray" style={{ animationDelay: `${i * 0.4}s` }} d={`M${95 + i * 20} ${80 + i * 8} L${190 + i * 70} ${250}`} stroke="#F2B544" strokeWidth="5" strokeLinecap="round" markerEnd="url(#tm-arrow-sun)" />
          ))}

          {/* The blanket of gases: thicker = more heat trapped */}
          <path
            d={`M0 ${290 - thickness - 30} Q320 ${200 - thickness - 30} 640 ${290 - thickness - 30} L640 330 L0 330 Z`}
            fill="#B8A07A"
            opacity={0.2 + blanket * 0.13}
          />
          <text x="20" y={300 - thickness - 40} fontSize="15" fontWeight="800" fill="#E8D9B8">
            blanket of gases
          </text>

          {/* Heat going back out: some escapes, some bounces back down */}
          {[0, 1, 2, 3].map((i) => {
            const x = 250 + i * 70;
            const bounces = i < trapped;
            const topY = bounces ? 236 - thickness : 30;
            return (
              <path
                key={i}
                className="tm-heat"
                style={{ animationDelay: `${i * 0.3}s` }}
                d={bounces ? `M${x} 262 q-8 -20 0 -40 T${x} ${topY} q14 8 18 40` : `M${x} 262 q-8 -20 0 -40 t0 -40 t0 -40 T${x} ${topY}`}
                stroke={bounces ? "#FF6B4A" : "#FFB09A"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* The Earth, getting warmer (redder) */}
          <path d="M0 300 Q320 200 640 300 L640 360 L0 360 Z" fill="#3E8DAB" />
          <path d="M120 286 Q220 240 300 252 Q360 262 420 248 Q500 236 560 278 L560 360 L120 360 Z" fill="#4C8E44" />
          <path d="M0 300 Q320 200 640 300 L640 360 L0 360 Z" fill="#E0533D" opacity={warming / 6} />

          {/* Thermometer */}
          <g>
            <rect x="590" y={T_TOP - 10} width="30" height={T_BOTTOM - T_TOP + 20} rx="15" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" />
            <rect x="598" y={ty(warming)} width="14" height={T_BOTTOM - ty(warming) + 6} rx="7" fill="#E0533D" />
            <circle cx="605" cy={T_BOTTOM + 18} r="18" fill="#E0533D" stroke={OUTLINE} strokeWidth="3" />
            {/* The Paris Agreement limits */}
            {[
              { c: 1.5, label: "1.5 °C" },
              { c: 2, label: "2 °C" },
            ].map((m) => (
              <g key={m.label}>
                <line x1="575" y1={ty(m.c)} x2="630" y2={ty(m.c)} stroke="#F2B544" strokeWidth="3" strokeDasharray="5 4" />
                <text x="570" y={ty(m.c) + 5} textAnchor="end" fontSize="14" fontWeight="900" fill="#F2B544">
                  {m.label}
                </text>
              </g>
            ))}
            <text x="605" y={T_TOP - 18} textAnchor="middle" fontSize="16" fontWeight="900" fill="#FFFFFF">
              +{warming.toFixed(1)} °C
            </text>
          </g>

          <defs>
            <marker id="tm-arrow-sun" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="#F2B544" />
            </marker>
          </defs>
        </svg>

        <div className="tm-greenhouse-info">
          <p className="tm-greenhouse-era">{current.label}</p>
          <p className="tm-greenhouse-warming">
            About <strong>+{current.warming} °C</strong> warmer than in the 1800s
          </p>
          <p>{current.text}</p>
          <p className="tm-greenhouse-key">
            <span className="tm-key-sun" aria-hidden="true" /> sunlight in
            <span className="tm-key-heat" aria-hidden="true" /> heat going out
            <span className="tm-key-paris" aria-hidden="true" /> Paris Agreement limits
          </p>
        </div>
      </div>

      <label className="tm-slider tm-big-slider">
        <span>
          Move through time: <strong>{current.label}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={ERAS.length - 1}
          step={1}
          value={era}
          onChange={(e) => setEra(Number(e.target.value))}
          aria-valuetext={current.label}
          className={reachedToday ? "" : "tm-attention"}
        />
        {/* One label under each stop of the slider */}
        <span className="tm-slider-ends" aria-hidden="true">
          <span>1850</span>
          <span>1950</span>
          <span>Today</span>
          <span>2100?</span>
        </span>
      </label>

      <div className="tm-feedback">
        <Tumaini mood={era >= 3 ? "worried" : era === 2 ? "thinking" : "happy"} size={100} />
        <SpeechBubble text={current.text} name="Tumaini" small instant />
      </div>
    </div>
  );
}
