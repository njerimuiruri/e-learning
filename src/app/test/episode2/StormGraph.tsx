"use client";

// ============================================================
// SCENE 3 ACTIVITY: "Give Tumaini a storm"
// ------------------------------------------------------------
// Left:  a page from Baba's notebook (one storm), and Tumaini
//        with a tiny graph on its face
// Right: the big graph (Tumaini's screen)
//
// Each click sends one storm page flying, its dot drops onto the
// graph, and Tumaini works out the best-fit line again. With few
// storms the line wobbles; with all 10 it settles at about
//   river height ≈ 0.39 × (hours of rain) + 0.81
// "Next" unlocks after all 10 storms.
// ============================================================

import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble, { usePrefersReducedMotion } from "../components/SpeechBubble";
import RegressionGraph, { MiniGraph } from "./RegressionGraph";
import { fitLine } from "./regressionMath";
import { STORMS_IN_ORDER } from "./content";

const TOTAL = STORMS_IN_ORDER.length;

// What Tumaini says, depending on how many storms it has seen.
function reaction(learned: number): { mood: TumainiMood; text: string } {
  if (learned === 0) return { mood: "happy", text: "Give me a storm from Baba's notebook!" };
  if (learned === 1) return { mood: "confused", text: "I need at least 2 storms to draw a line!" };
  if (learned === 2) return { mood: "confused", text: "Hmm… I'm guessing. I'm not sure at all!" };
  if (learned <= 6) return { mood: "thinking", text: "Ooh, I see a pattern! More rain, higher river." };
  if (learned < TOTAL) return { mood: "happy", text: "My line is getting steadier with every storm!" };
  return { mood: "excited", text: "Got it! For every extra hour of heavy rain, the river rises about 40 centimetres." };
}

/** Rounds to 2 decimal places, for showing the line in words. */
const two = (n: number) => n.toFixed(2);

export default function StormGraph({ done, onComplete, onSpeech }: ActivityProps) {
  const reduced = usePrefersReducedMotion();
  const [learned, setLearned] = useState(done ? TOTAL : 0);
  const [flying, setFlying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const points = STORMS_IN_ORDER.slice(0, learned);
  const line = fitLine(points);
  const { mood, text } = reaction(learned);
  const finished = learned >= TOTAL;
  const nextStorm = STORMS_IN_ORDER[learned];

  // Unlock "Next" once every storm is learned.
  useEffect(() => {
    if (finished) onComplete();
  }, [finished, onComplete]);

  // Tell the 🔊 button what Tumaini is saying.
  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  // Clean-up: stop the timer if we leave this activity mid-flight.
  useEffect(() => () => clearTimeout(timer.current), []);

  const giveStorm = () => {
    if (flying || finished) return;
    setFlying(true);
    // Wait for the page to fly, then the dot drops onto the graph.
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

  const graphLabel = line
    ? `Graph with ${learned} storms. Tumaini's line: river height is about ${two(line.m)} times hours of rain, plus ${two(line.c)}.`
    : `Graph with ${learned} storm${learned === 1 ? "" : "s"}. No line yet.`;

  return (
    <div className="tm-activity">
      <div className="tm-storm-layout">
        {/* ---------- Left: Baba's page and Tumaini ---------- */}
        <div className="tm-storm-side">
          <div className="tm-page-slot tm-storm-page-slot">
            {!finished ? (
              <div key={learned} className={`tm-page tm-storm-page ${flying ? "tm-page-fly" : "tm-page-in"}`} aria-live="polite">
                <p className="tm-page-day">Storm {learned + 1}</p>
                <p className="tm-storm-row">
                  <span aria-hidden="true">⛈️</span> <strong>{nextStorm.x} hours</strong> of heavy rain
                </p>
                <p className="tm-storm-row">
                  <span aria-hidden="true">🌊</span> River rose to <strong>{nextStorm.y.toFixed(1)} m</strong>
                </p>
              </div>
            ) : (
              <div className="tm-page tm-page-done">
                <p className="tm-page-day">All 10 storms learned! ✔</p>
                <p>Tumaini has read Baba&apos;s whole notebook.</p>
              </div>
            )}
          </div>

          <div className="tm-notebook-robot">
            <div key={learned} className={learned > 0 ? "tm-munch" : ""}>
              {learned > 0 && (
                <span className="tm-plus-one" aria-hidden="true">
                  +1 storm
                </span>
              )}
              <Tumaini mood={mood} size={150} screen={<MiniGraph points={points} line={line} />} label="Tumaini, with a tiny graph on its face screen" />
            </div>
            <SpeechBubble text={text} name="Tumaini" tail="top" small />
          </div>
        </div>

        {/* ---------- Right: the big graph ---------- */}
        <div className="tm-graph-box">
          <p className="tm-graph-title">Tumaini&apos;s screen</p>
          <RegressionGraph points={points} newestX={points[points.length - 1]?.x} line={line} label={graphLabel} />
          <div className="tm-graph-legend" aria-hidden="true">
            <span><i className="tm-key-dot" /> a storm</span>
            <span><i className="tm-key-line" /> Tumaini&apos;s line</span>
            <span><i className="tm-key-mistake" /> mistakes</span>
          </div>
          <p className={`tm-formula ${finished ? "is-final" : ""}`} aria-live="polite">
            {line ? (
              <>
                River height ≈ <strong>{two(line.m)}</strong> × (hours of rain) + <strong>{two(line.c)}</strong>
                {finished && " ✔"}
              </>
            ) : (
              "No line yet: Tumaini needs at least 2 storms."
            )}
          </p>
        </div>
      </div>

      {/* ---------- Counter and buttons ---------- */}
      <div className="tm-activity-controls">
        <div className="tm-counter">
          <p>
            Storms learned: <strong>{learned}</strong> of {TOTAL}
          </p>
          <div className="tm-counter-pips" aria-hidden="true">
            {STORMS_IN_ORDER.map((_, i) => (
              <span key={i} className={i < learned ? "is-on" : ""} />
            ))}
          </div>
        </div>
        <div className="tm-activity-buttons">
          <button
            type="button"
            className={`tm-button tm-button-big ${learned === 0 ? "tm-attention" : ""}`}
            onClick={giveStorm}
            disabled={finished || flying}
          >
            ⛈️ Give Tumaini a storm
          </button>
          <button type="button" className="tm-button tm-button-secondary" onClick={giveAll} disabled={finished}>
            Give all 10 storms
          </button>
        </div>
      </div>
    </div>
  );
}
