// ============================================================
// CONVEYOR BELT
// ------------------------------------------------------------
// One leaf at a time rides in on a moving belt and stops in the
// middle. After it is sorted, it drops into a basket below:
// the 🌿 Healthy basket (left) or the 🍂 Sick basket (right).
//
// Used by both "You sort the leaves" and "Tumaini sorts the rest".
//
// stage:  "arriving"   the leaf slides in from the left
//         "resting"    the leaf waits in the middle
//         "to-healthy" / "to-sick"   the leaf drops into a basket
// badge:  ✅ or ❌ shown on the leaf after Mama checks it
// ============================================================

import Leaf from "../components/Leaf";
import type { LeafData } from "./leafMath";

export type BeltStage = "arriving" | "resting" | "to-healthy" | "to-sick";

interface ConveyorProps {
  leaf: LeafData | null;
  /** Changes for every new leaf, so its "arrive" animation plays */
  leafKey: string;
  stage: BeltStage;
  badge?: "✅" | "❌" | null;
  healthyCount: number;
  sickCount: number;
}

export default function Conveyor({ leaf, leafKey, stage, badge = null, healthyCount, sickCount }: ConveyorProps) {
  return (
    <div className="tm-conveyor">
      <div className="tm-belt-area">
        {leaf && (
          <div key={leafKey} className={`tm-belt-leaf is-${stage}`}>
            <Leaf spots={leaf.spots} yellowness={leaf.yellowness} size={240} />
            {badge && (
              <span className="tm-leaf-badge" aria-label={badge === "✅" ? "Correct" : "Wrong"}>
                {badge}
              </span>
            )}
          </div>
        )}
        {/* The belt: the stripes move while a leaf is arriving */}
        <div className={`tm-belt ${stage === "arriving" ? "is-moving" : ""}`} aria-hidden="true">
          <span className="tm-roller tm-roller-left" />
          <span className="tm-roller tm-roller-right" />
        </div>
      </div>

      <div className="tm-baskets">
        <div className={`tm-basket tm-basket-healthy ${stage === "to-healthy" ? "is-catching" : ""}`}>
          <span className="tm-basket-label">🌿 Healthy</span>
          <span className="tm-basket-count" aria-label={`${healthyCount} healthy leaves`}>
            {healthyCount}
          </span>
        </div>
        <div className={`tm-basket tm-basket-sick ${stage === "to-sick" ? "is-catching" : ""}`}>
          <span className="tm-basket-label">🍂 Sick</span>
          <span className="tm-basket-count" aria-label={`${sickCount} sick leaves`}>
            {sickCount}
          </span>
        </div>
      </div>
    </div>
  );
}
