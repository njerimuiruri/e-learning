"use client";

// ============================================================
// SCENE 3 ACTIVITY: "Can YOU draw a better line than me?"
// ------------------------------------------------------------
// The audience moves their own (orange) line by dragging two
// round handles up and down. The "mistake meter" shows their
// mistake score: each mistake (dashed line) multiplied by itself,
// all added up. Smaller = better.
//
// "Show Tumaini's line" reveals the best-fit line and its score.
// Tumaini's line always has the smallest possible score, because
// that is exactly what least squares finds. "Next" unlocks after
// the reveal.
//
// Dragging uses POINTER events, which work for a mouse, a finger
// or a pen. Keyboard: Tab to a handle, then ↑ / ↓.
// ============================================================

import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import RegressionGraph, { GRAPH, gx, gy } from "./RegressionGraph";
import { fitLine, mistakes, predict, totalMistake, type Line } from "./regressionMath";
import { STORMS } from "./content";

const BEST = fitLine(STORMS)!;
const BEST_SCORE = totalMistake(STORMS, BEST);

// The two handles sit at 1 hour and 11 hours; they only move up and down.
const HANDLE_X: [number, number] = [1, 11];
const START_HEIGHTS: [number, number] = [3, 3]; // a flat line: a poor start, on purpose
const METER_MAX = 13; // a score this big fills the whole meter

const USER_COLOUR = "#FF8A3D";

/** The straight line through the two handles. */
function lineThrough(heights: [number, number]): Line {
  const m = (heights[1] - heights[0]) / (HANDLE_X[1] - HANDLE_X[0]);
  return { m, c: heights[0] - m * HANDLE_X[0] };
}

const clampHeight = (h: number) => Math.max(0, Math.min(6, h));

/** Turn a pointer position on the screen into a river height on the graph. */
function heightAtPointer(e: PointerEvent<SVGGElement>): number | null {
  const svg = e.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return null;
  const point = svg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  const inGraph = point.matrixTransform(matrix.inverse());
  return ((GRAPH.bottom - inGraph.y) / (GRAPH.bottom - GRAPH.top)) * GRAPH.maxY;
}

function message(revealed: boolean, score: number): { mood: TumainiMood; text: string } {
  if (revealed) {
    return score <= BEST_SCORE * 1.05
      ? { mood: "excited", text: "Wow, your line is almost as good as mine! You think like an AI!" }
      : { mood: "happy", text: "My line has the smallest total mistake. That's what 'best fit' means!" };
  }
  if (score > 3) return { mood: "thinking", text: "Drag the orange handles. Try to make your line pass through the middle of the dots!" };
  if (score > 0.5) return { mood: "happy", text: "Getting better! Can you make your mistake score even smaller?" };
  return { mood: "excited", text: "Very good! When you're ready, press 'Show Tumaini's line'." };
}

export default function BeatTheComputer({ done, onComplete, onSpeech }: ActivityProps) {
  const [heights, setHeights] = useState<[number, number]>(START_HEIGHTS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(done);
  const [moved, setMoved] = useState(false);

  const userLine = lineThrough(heights);
  const score = totalMistake(STORMS, userLine);
  const { mood, text } = message(revealed, score);

  useEffect(() => {
    if (revealed) onComplete();
  }, [revealed, onComplete]);

  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  const setHeight = (which: number, h: number) => {
    setHeights((old) => {
      const next: [number, number] = [...old];
      next[which] = Math.round(clampHeight(h) * 100) / 100;
      return next;
    });
    setMoved(true);
  };

  // ---------- Dragging (mouse, touch and pen) ----------
  const onPointerDown = (which: number) => (e: PointerEvent<SVGGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId); // keep following, even off the handle
    setDragging(which);
  };
  const onPointerMove = (which: number) => (e: PointerEvent<SVGGElement>) => {
    if (dragging !== which) return;
    const h = heightAtPointer(e);
    if (h !== null) setHeight(which, h);
  };
  const onPointerUp = () => setDragging(null);

  // ---------- Keyboard ----------
  const onKeyDown = (which: number) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      setHeight(which, heights[which] + 0.1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHeight(which, heights[which] - 0.1);
    }
  };

  const userMistakes = mistakes(STORMS, userLine);

  return (
    <div className="tm-activity">
      <div className="tm-beat-layout">
        {/* ---------- The graph with the audience's line ---------- */}
        <div className="tm-graph-box">
          <p className="tm-graph-title">Drag the orange handles ↕</p>
          <RegressionGraph
            points={STORMS}
            line={revealed ? BEST : null}
            showMistakes={false}
            label={`Graph with all 10 storms and your orange line.${revealed ? " Tumaini's blue line is also shown." : ""}`}
          >
            {/* Your mistakes: dashed lines from each dot to your line */}
            {STORMS.map((p, i) => (
              <line
                key={`m${p.x}`}
                x1={gx(p.x)}
                y1={gy(p.y)}
                x2={gx(p.x)}
                y2={gy(clampHeight(p.y - userMistakes[i]))}
                stroke={USER_COLOUR}
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            ))}
            {/* Your line */}
            <line
              x1={gx(0.3)}
              y1={gy(clampHeight(predict(userLine, 0.3)))}
              x2={gx(11.7)}
              y2={gy(clampHeight(predict(userLine, 11.7)))}
              stroke={USER_COLOUR}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* The two handles */}
            {HANDLE_X.map((hx, which) => (
              <g
                key={hx}
                className={`tm-handle ${dragging === which ? "is-dragging" : ""} ${!moved ? "tm-handle-hint" : ""}`}
                tabIndex={0}
                role="slider"
                aria-label={`${which === 0 ? "Left" : "Right"} handle of your line`}
                aria-valuemin={0}
                aria-valuemax={6}
                aria-valuenow={heights[which]}
                aria-valuetext={`${heights[which].toFixed(1)} metres`}
                onPointerDown={onPointerDown(which)}
                onPointerMove={onPointerMove(which)}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown(which)}
              >
                {/* A big invisible circle makes the handle easy to grab with a finger */}
                <circle cx={gx(hx)} cy={gy(heights[which])} r="30" fill="transparent" />
                <circle className="tm-handle-dot" cx={gx(hx)} cy={gy(heights[which])} r="16" fill={USER_COLOUR} stroke="#FFFFFF" strokeWidth="4" />
                <path
                  d={`M${gx(hx)} ${gy(heights[which]) - 7} l-5 5 h10 z M${gx(hx)} ${gy(heights[which]) + 7} l-5 -5 h10 z`}
                  fill="#FFFFFF"
                />
              </g>
            ))}
          </RegressionGraph>
        </div>

        {/* ---------- The mistake meter ---------- */}
        <div className="tm-meter">
          <p className="tm-meter-title">Mistake meter</p>
          <p className="tm-meter-help">Each mistake × itself, all added up. <strong>Smaller is better!</strong></p>

          <div className="tm-meter-row">
            <span className="tm-meter-label">Your line</span>
            <div className="tm-meter-track" role="img" aria-label={`Your mistake score: ${score.toFixed(2)}`}>
              <div className="tm-meter-fill tm-meter-you" style={{ width: `${Math.min(100, (score / METER_MAX) * 100)}%` }} />
            </div>
            <span className="tm-meter-value">{score.toFixed(2)}</span>
          </div>

          {revealed && (
            <div className="tm-meter-row tm-meter-reveal">
              <span className="tm-meter-label">Tumaini</span>
              <div className="tm-meter-track" role="img" aria-label={`Tumaini's mistake score: ${BEST_SCORE.toFixed(2)}`}>
                <div className="tm-meter-fill tm-meter-ai" style={{ width: `${Math.max(1.5, (BEST_SCORE / METER_MAX) * 100)}%` }} />
              </div>
              <span className="tm-meter-value">{BEST_SCORE.toFixed(2)}</span>
            </div>
          )}

          <div className="tm-feedback">
            <Tumaini mood={mood} size={110} />
            <SpeechBubble text={text} name="Tumaini" small instant />
          </div>
        </div>
      </div>

      <div className="tm-activity-controls">
        <span />
        <div className="tm-activity-buttons">
          <button
            type="button"
            className={`tm-button tm-button-big ${moved && !revealed ? "tm-attention" : ""}`}
            onClick={() => setRevealed(true)}
            disabled={revealed}
          >
            🤖 Show Tumaini&apos;s line
          </button>
          <button
            type="button"
            className="tm-button tm-button-secondary"
            onClick={() => {
              setHeights(START_HEIGHTS);
              setMoved(false);
            }}
          >
            ↺ Reset my line
          </button>
        </div>
      </div>
    </div>
  );
}
