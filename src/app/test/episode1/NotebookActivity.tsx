"use client";

// ============================================================
// SCENE 1 ACTIVITY: "Give Tumaini a page"
// ------------------------------------------------------------
// Left:   today's notebook page (the signs seen, and the result)
// Middle: Tumaini, whose face screen turns into a little chart
// Right:  big bars - "When I saw this sign, it rained…"
//
// Each click sends one page flying into Tumaini, and the bars
// update. "Next" unlocks after all 12 pages.
// ============================================================

import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini, { GLOW } from "../characters/Tumaini";
import SpeechBubble, { usePrefersReducedMotion } from "../components/SpeechBubble";
import SignIcon from "./SignIcon";
import { NOTEBOOK_DAYS, SIGNS } from "./content";
import { signCounts, signPercentages } from "./notebookMath";

const TOTAL = NOTEBOOK_DAYS.length;
const BAR_COLOURS = [GLOW, "#F2B544", "#9BE08F"];

// What Tumaini says, depending on how many pages it has seen.
function reaction(learned: number): { mood: TumainiMood; text: string } {
  if (learned === 0) return { mood: "happy", text: "Give me a page from Mama's notebook!" };
  if (learned <= 2) return { mood: "confused", text: "Hmm… I've only seen a few days. I'm not sure yet." };
  if (learned <= 6) return { mood: "thinking", text: "I'm starting to see something…" };
  if (learned < TOTAL) return { mood: "happy", text: "Dark clouds seem to come before rain a lot!" };
  return { mood: "excited", text: "I've learned from all 12 days!" };
}

// The tiny bar chart shown on Tumaini's face screen.
function ScreenChart({ percents }: { percents: (number | null)[] }) {
  return (
    <>
      {percents.map((p, i) => {
        const x = 62 + i * 27;
        return (
          <g key={i}>
            <rect x={x} y="62" width="20" height="46" fill="#1F4450" rx="3" />
            {p === null ? (
              <text x={x + 10} y="94" textAnchor="middle" fontSize="18" fontWeight="bold" fill={GLOW}>
                ?
              </text>
            ) : (
              <rect
                className="tm-screen-bar"
                x={x}
                y="62"
                width="20"
                height="46"
                rx="3"
                fill={BAR_COLOURS[i]}
                style={{ transform: `scaleY(${p / 100})` }}
              />
            )}
          </g>
        );
      })}
      <line x1="58" y1="109" x2="142" y2="109" stroke={GLOW} strokeWidth="2" />
    </>
  );
}

export default function NotebookActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const reduced = usePrefersReducedMotion();
  const [learned, setLearned] = useState(done ? TOTAL : 0);
  const [flying, setFlying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const percents = signPercentages(learned);
  const counts = signCounts(learned);
  const { mood, text } = reaction(learned);
  const finished = learned >= TOTAL;

  // Unlock "Next" once every page is learned.
  useEffect(() => {
    if (finished) onComplete();
  }, [finished, onComplete]);

  // Tell the 🔊 button what Tumaini is saying.
  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const givePage = () => {
    if (flying || finished) return;
    setFlying(true);
    // Wait for the "fly" animation to finish, then count the page.
    timer.current = setTimeout(() => {
      setLearned((n) => n + 1);
      setFlying(false);
    }, reduced ? 0 : 650);
  };

  const giveAll = () => {
    clearTimeout(timer.current);
    setFlying(false);
    setLearned(TOTAL);
  };

  const day = NOTEBOOK_DAYS[learned];

  return (
    <div className="tm-activity">
      <div className="tm-notebook">
        {/* ---------- The notebook page ---------- */}
        <div className="tm-page-slot">
          {!finished ? (
            <div key={learned} className={`tm-page ${flying ? "tm-page-fly" : "tm-page-in"}`} aria-live="polite">
              <p className="tm-page-day">Day {learned + 1}</p>
              <ul className="tm-page-signs">
                {SIGNS.map((sign, i) => (
                  <li key={sign.id} className={day[i] ? "is-yes" : "is-no"}>
                    <SignIcon id={sign.id} size={40} decorative />
                    <span>{sign.label}</span>
                    <strong>{day[i] ? "✔ Yes" : "✘ No"}</strong>
                  </li>
                ))}
              </ul>
              <p className={`tm-page-result ${day[3] ? "is-rain" : "is-dry"}`}>
                <SignIcon id={day[3] ? "rain" : "sun"} size={40} decorative />
                {day[3] ? "It rained" : "It stayed dry"}
              </p>
            </div>
          ) : (
            <div className="tm-page tm-page-done">
              <p className="tm-page-day">All 12 pages learned! ✔</p>
              <p>Tumaini has read the whole notebook.</p>
            </div>
          )}
        </div>

        {/* ---------- Tumaini with the chart on its face ---------- */}
        <div className="tm-notebook-robot">
          {/* Each time a page lands, Tumaini does a happy little hop and "+1 page" floats up */}
          <div key={learned} className={learned > 0 ? "tm-munch" : ""}>
            {learned > 0 && (
              <span className="tm-plus-one" aria-hidden="true">
                +1 page
              </span>
            )}
            <Tumaini mood={mood} size={190} screen={<ScreenChart percents={percents} />} label="Tumaini, with a small bar chart on its face screen" />
          </div>
          <SpeechBubble text={text} name="Tumaini" tail="top" small />
        </div>

        {/* ---------- The big bars ---------- */}
        <div className="tm-bars">
          <p className="tm-bars-title">When I saw this sign, it rained…</p>
          {SIGNS.map((sign, i) => {
            const p = percents[i];
            return (
              <div key={sign.id} className="tm-bar-row">
                <SignIcon id={sign.id} size={40} decorative />
                <div className="tm-bar-body">
                  <span className="tm-bar-label">{sign.label}</span>
                  {/* The working: how we got the percentage */}
                  <span className="tm-bar-count">
                    {counts[i].total === 0
                      ? "not seen yet"
                      : `rained on ${counts[i].rained} of ${counts[i].total} day${counts[i].total === 1 ? "" : "s"}`}
                  </span>
                  <div className="tm-bar-track" role="img" aria-label={`${sign.label}: ${p === null ? "not seen yet" : `${Math.round(p)} percent`}`}>
                    <div className="tm-bar-fill" style={{ width: `${p ?? 0}%`, background: BAR_COLOURS[i] }} />
                  </div>
                </div>
                <span className="tm-bar-value">{p === null ? "?" : `${Math.round(p)}%`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Counter and buttons ---------- */}
      <div className="tm-activity-controls">
        <div className="tm-counter">
          <p>
            Pages learned: <strong>{learned}</strong> of {TOTAL}
          </p>
          <div className="tm-counter-pips" aria-hidden="true">
            {NOTEBOOK_DAYS.map((_, i) => (
              <span key={i} className={i < learned ? "is-on" : ""} />
            ))}
          </div>
        </div>
        <div className="tm-activity-buttons">
          <button
            type="button"
            className={`tm-button tm-button-big ${learned === 0 ? "tm-attention" : ""}`}
            onClick={givePage}
            disabled={finished || flying}
          >
            📄 Give Tumaini a page
          </button>
          <button type="button" className="tm-button tm-button-secondary" onClick={giveAll} disabled={finished}>
            Give all 12 pages
          </button>
        </div>
      </div>
    </div>
  );
}
