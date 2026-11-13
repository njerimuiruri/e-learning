"use client";

// ============================================================
// EXERCISE: "Use the model"  (Part 3)
// ------------------------------------------------------------
// Drag the rain amount. The model y = 0.04x + 0.5 predicts the
// river height. The bar turns red when it passes the danger line
// (3 m), which also shows the idea of a THRESHOLD.
// "Next" unlocks once the river has reached the danger line.
// Calm on purpose: no animation.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import { RIVER_C, RIVER_DANGER, RIVER_M } from "./Charts";

export default function RiverModelActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [rain, setRain] = useState(done ? 70 : 20);
  const height = RIVER_M * rain + RIVER_C;
  const danger = height >= RIVER_DANGER;
  const message = danger
    ? `Danger! ${height.toFixed(1)} m is above the 3 m line. Time to warn people and move to higher ground.`
    : `${height.toFixed(1)} m: safe for now.`;

  useEffect(() => {
    onSpeech(message);
    if (danger) onComplete();
  }, [danger, message, onComplete, onSpeech]);

  const max = 5; // metres shown on the gauge
  return (
    <div className="tm-model">
      <div className="tm-model-sum" aria-hidden="true">
        y = 0.04 × <strong>{rain}</strong> + 0.5 = <strong>{height.toFixed(1)} m</strong>
      </div>

      <div className="tm-model-body">
        <label className="tm-model-slider">
          <span>Rain upstream: <strong>{rain} mm</strong></span>
          <input type="range" min={0} max={100} step={5} value={rain} onChange={(e) => setRain(Number(e.target.value))} />
        </label>

        <div className="tm-model-gauge" role="img" aria-label={`River gauge: ${height.toFixed(1)} metres. Danger line at 3 metres.`}>
          <div className="tm-model-danger" style={{ bottom: `${(RIVER_DANGER / max) * 100}%` }}>
            <span>3 m danger</span>
          </div>
          <div className={`tm-model-water ${danger ? "is-danger" : ""}`} style={{ height: `${(height / max) * 100}%` }} />
        </div>
      </div>

      <p className={`tm-model-result ${danger ? "is-danger" : ""}`} aria-live="polite">
        {message}
      </p>
    </div>
  );
}
