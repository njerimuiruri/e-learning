"use client";

// ============================================================
// SCENE 5 ACTIVITY: "Grow the tree"
// ------------------------------------------------------------
// Each press of "Grow" grows the next level of the decision tree
// (the branches grow, then the boxes pop out), and the 16 season
// dots slide along into their branches, so you can see which
// past seasons end up at each piece of advice.
// When the tree is complete, each fruit box shows its
// "x of y past seasons" number. "Next" unlocks then.
//
// Tumaini's words are worked out from the tree itself, so they
// always match what was drawn.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import DecisionTree from "./DecisionTree";
import { buildTree, questionById, treeDepth, type TreeNode } from "./treeMath";
import { SEASONS, adviceFor } from "./content";

export const TREE = buildTree(SEASONS);
const DEPTH = treeDepth(TREE);

/** All the boxes at one level of the tree. */
function nodesAtDepth(node: TreeNode, depth: number): TreeNode[] {
  if (node.depth === depth) return [node];
  if (node.kind === "leaf") return [];
  return [...nodesAtDepth(node.no, depth), ...nodesAtDepth(node.yes, depth)];
}

/** What Tumaini says after growing to a level. */
function words(grown: number): { mood: TumainiMood; text: string } {
  if (grown === 0) return { mood: "happy", text: "Press Grow, and I'll ask my best first question." };
  if (grown >= DEPTH) {
    return { mood: "excited", text: "My tree is complete! Look how many past seasons reached each piece of advice." };
  }
  // The question that was just asked, and any advice that just appeared
  const asked = nodesAtDepth(TREE, grown - 1).filter((n) => n.kind === "question");
  const newAdvice = nodesAtDepth(TREE, grown).filter((n) => n.kind === "leaf");
  const question = asked[0]?.kind === "question" ? questionById(asked[0].question).short : "";
  const ending = newAdvice
    .map((n) => (n.kind === "leaf" ? `${n.seasons.length} seasons went to "${adviceFor(n.path, n.plant).title}"` : ""))
    .join(", ");
  return {
    mood: "thinking",
    text: `${grown === 1 ? "First" : "Next"} I ask: "${question}"${ending ? ` ${ending}.` : ""} Press Grow again!`,
  };
}

export default function TreeGrower({ done, onComplete, onSpeech }: ActivityProps) {
  const [grown, setGrown] = useState(done ? DEPTH : 0);
  const complete = grown >= DEPTH;

  useEffect(() => {
    if (complete) onComplete();
  }, [complete, onComplete]);

  const { mood, text } = words(grown);
  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  return (
    <div className="tm-activity">
      <div className="tm-tree-layout">
        <div className="tm-tree-box-frame">
          <DecisionTree tree={TREE} grownDepth={grown} showSeasons showCounts={complete} />
          <div className="tm-graph-legend tm-tree-legend" aria-hidden="true">
            <span><i className="tm-key-dot" style={{ background: "#F2B544" }} /> a good season</span>
            <span><i className="tm-key-dot" style={{ background: "#8A5A36" }} /> a poor season</span>
          </div>
        </div>
      </div>

      <div className="tm-activity-controls">
        <div className="tm-counter">
          <p>
            Levels grown: <strong>{grown}</strong> of {DEPTH}
          </p>
        </div>
        <div className="tm-activity-buttons">
          <button
            type="button"
            className={`tm-button tm-button-big ${grown === 0 ? "tm-attention" : ""}`}
            onClick={() => setGrown((g) => Math.min(DEPTH, g + 1))}
            disabled={complete}
          >
            🌱 Grow
          </button>
          <button type="button" className="tm-button tm-button-secondary" onClick={() => setGrown(0)} disabled={grown === 0}>
            ↺ Start again
          </button>
        </div>
      </div>

      <div className="tm-feedback">
        <Tumaini mood={mood} size={110} />
        <SpeechBubble text={text} name="Tumaini" small />
      </div>
    </div>
  );
}
