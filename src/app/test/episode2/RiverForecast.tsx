"use client";

// ============================================================
// SCENE 3 ACTIVITY: "How high will the river go tomorrow?"
// ------------------------------------------------------------
// A big slider sets tomorrow's hours of heavy rain (0–12).
// Tumaini follows its line to predict the river height:
//     height = m × hours + c     (m ≈ 0.39, c ≈ 0.81)
//
// As the slider moves:
//   • the cartoon rain gets heavier or lighter
//   • on the graph, a dashed guide goes UP from the hours to the
//     line, then ACROSS to the river height
//   • the river rises or falls on the gauge post
// At 4.5 m or more (about 9.5 hours): the danger line flashes,
// the flood alert arrives on Otieno's phone, and Mama and Otieno
// lead the goats uphill. "Next" unlocks after the first alert.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import Tumaini from "../characters/Tumaini";
import Mama from "../characters/Mama";
import Otieno from "../characters/Otieno";
import SpeechBubble from "../components/SpeechBubble";
import RiverScene, { DANGER_LEVEL } from "../components/RiverScene";
import PhoneAlert from "../components/PhoneAlert";
import RegressionGraph, { GRAPH, gx, gy } from "./RegressionGraph";
import { fitLine, predict } from "./regressionMath";
import { STORMS } from "./content";

const LINE = fitLine(STORMS)!;

export const FLOOD_ALERT =
  "⚠️ FLOOD ALERT: The Nyando River may pass the danger level tomorrow night. Move people, animals and belongings to higher ground.";

export default function RiverForecast({ done, onComplete, onSpeech }: ActivityProps) {
  const [hours, setHours] = useState(3);
  const [alerted, setAlerted] = useState(done);

  // Tumaini follows its line: height = m × hours + c
  const exact = predict(LINE, hours);
  const height = Math.round(exact * 10) / 10; // "about", to 1 decimal place
  const danger = height >= DANGER_LEVEL;

  // The first time the river passes the danger line, unlock "Next".
  useEffect(() => {
    if (danger) setAlerted(true);
  }, [danger]);
  useEffect(() => {
    if (alerted) onComplete();
  }, [alerted, onComplete]);

  const text = danger
    ? `About ${height.toFixed(1)} metres. That's above the danger line! Warn everyone now!`
    : `About ${height.toFixed(1)} metres. Safe.`;

  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  const where = danger ? "is-uphill" : "is-home";

  return (
    <div className="tm-activity">
      <div className="tm-forecast-layout">
        {/* ---------- The river, the family and the phone ---------- */}
        <div className="tm-forecast-river">
          <div className="tm-forecast-scene">
            <RiverScene level={exact} rain={hours / 12} goats={danger ? "uphill" : "home"} />
            {/* Mama and Otieno walk the goats to high ground when the alert comes.
                The box slides (CSS transition); the "key" restarts the legs each trip. */}
            <div className={`tm-forecast-person tm-forecast-mama ${where}`}>
              <Mama key={where} mood={danger ? "worried" : "happy"} size={60} className={alerted ? "tm-walking" : ""} />
            </div>
            <div className={`tm-forecast-person tm-forecast-otieno ${where}`}>
              <Otieno key={where} mood={danger ? "excited" : "happy"} size={52} className={alerted ? "tm-walking" : ""} />
            </div>
          </div>
          <div className="tm-forecast-phone">
            <PhoneAlert show={danger} message={FLOOD_ALERT} />
            {danger && <p className="tm-forecast-phone-label">Otieno&apos;s phone</p>}
          </div>
        </div>

        {/* ---------- Tumaini's graph with the guide lines ---------- */}
        <div className="tm-graph-box">
          <p className="tm-graph-title">Tumaini follows its line</p>
          <RegressionGraph
            points={STORMS}
            line={LINE}
            showMistakes={false}
            className={danger ? "is-danger" : ""}
            label={`Graph: ${hours} hours of heavy rain gives a river height of about ${height.toFixed(1)} metres.`}
          >
            {/* Up from the hours to the line... */}
            <line x1={gx(hours)} y1={gy(0)} x2={gx(hours)} y2={gy(exact)} stroke="#FFFFFF" strokeWidth="3" strokeDasharray="7 5" />
            {/* ...then across to the river height */}
            <line x1={gx(hours)} y1={gy(exact)} x2={GRAPH.left} y2={gy(exact)} stroke="#FFFFFF" strokeWidth="3" strokeDasharray="7 5" />
            <circle cx={gx(hours)} cy={gy(exact)} r="10" fill={danger ? "#E0533D" : "#FFFFFF"} stroke="#13303A" strokeWidth="3" />
            <rect x={GRAPH.left + 6} y={gy(exact) - 32} width="74" height="26" rx="8" fill={danger ? "#E0533D" : "#FFFFFF"} />
            <text x={GRAPH.left + 43} y={gy(exact) - 13} textAnchor="middle" fontSize="16" fontWeight="900" fill={danger ? "#FFFFFF" : "#13303A"}>
              {height.toFixed(1)} m
            </text>
          </RegressionGraph>
          <p className="tm-formula">
            <strong>{LINE.m.toFixed(2)}</strong> × {hours} hours + <strong>{LINE.c.toFixed(2)}</strong> ={" "}
            <strong className={danger ? "tm-danger-text" : ""}>{height.toFixed(1)} m</strong>
          </p>
        </div>
      </div>

      {/* ---------- The big slider ---------- */}
      <label className="tm-slider tm-big-slider">
        <span>
          Tomorrow&apos;s heavy rain: <strong>{hours} hours</strong>
        </span>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          aria-valuetext={`${hours} hours of heavy rain`}
          className={alerted ? "" : "tm-attention"}
        />
        <span className="tm-slider-ends" aria-hidden="true">
          <span>0 hours</span>
          <span>12 hours</span>
        </span>
      </label>

      <div className="tm-feedback">
        {danger && (
          <span className="tm-alert-icon" aria-hidden="true">
            ⚠️
          </span>
        )}
        <Tumaini mood={danger ? "worried" : "happy"} size={110} />
        <SpeechBubble text={text} name="Tumaini" small instant />
      </div>
    </div>
  );
}
