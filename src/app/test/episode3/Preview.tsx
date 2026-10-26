"use client";

// ============================================================
// EPISODE 3 SNEAK PEEK  (TEMPORARY - for testing step (a))
// ------------------------------------------------------------
// Shows the new drawings with buttons, so you can check them
// before the scenes are built. It appears on the Episode 3 page
// while Episode 3 is still a placeholder, and will be deleted
// when the real episode is finished in step (e).
// ============================================================

import { useMemo, useState } from "react";
import SeasonCard, { SeasonCardKey } from "./SeasonCard";
import DecisionTree from "./DecisionTree";
import VillageMap from "./VillageMap";
import { buildTree, followTree, questionById, treeDepth, type Answer } from "./treeMath";
import { GROUP_LABELS, groupKind, runToEnd } from "./clusterMath";
import { GROUP_COLOURS, SEASONS, START_CENTRES, VILLAGES, adviceFor } from "./content";

type MapView = "grey" | "start" | "found";

export default function Episode3Preview() {
  const tree = useMemo(() => buildTree(SEASONS), []);
  const depth = treeDepth(tree);
  const [grown, setGrown] = useState(0);
  const [seasonsOn, setSeasonsOn] = useState(true);
  const [countsOn, setCountsOn] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const result = useMemo(() => runToEnd(VILLAGES, START_CENTRES), []);
  const [view, setView] = useState<MapView>("grey");
  const [linesOn, setLinesOn] = useState(false);

  const here = followTree(tree, answers);
  const followingTree = answers.length > 0 || grown >= depth;

  return (
    <section className="tm-preview" aria-labelledby="tm-preview3-title">
      <h2 id="tm-preview3-title">🔍 Sneak peek: new drawings for Episode 3</h2>
      <p className="tm-preview-note">This test panel is temporary. It shows the new pieces before the scenes are built.</p>

      {/* ---------- Season cards ---------- */}
      <div className="tm-preview-card">
        <h3>Mama&apos;s 16 seasons</h3>
        <SeasonCardKey />
        <div className="tm-season-grid">
          {SEASONS.map((s) => (
            <SeasonCard key={s.id} season={s} />
          ))}
        </div>
        <p className="tm-preview-subtitle">Small version (for piles):</p>
        <div className="tm-preview-row">
          {SEASONS.map((s) => (
            <SeasonCard key={s.id} season={s} compact />
          ))}
        </div>
      </div>

      {/* ---------- Decision tree ---------- */}
      <div className="tm-preview-card">
        <h3>The decision tree (built by the code from the 16 seasons)</h3>
        <div className="tm-preview-tree">
          <DecisionTree tree={tree} grownDepth={grown} showSeasons={seasonsOn} showCounts={countsOn} answers={answers} reached={here.kind === "leaf" && answers.length > 0} />
        </div>
        <div className="tm-preview-controls">
          <button type="button" className="tm-button" onClick={() => setGrown((g) => Math.min(depth, g + 1))} disabled={grown >= depth}>
            🌱 Grow ({grown} of {depth})
          </button>
          <button type="button" className="tm-button tm-button-secondary" onClick={() => { setGrown(0); setAnswers([]); }}>
            ↺ Reset
          </button>
          <button type="button" className="tm-toggle" role="switch" aria-checked={seasonsOn} onClick={() => setSeasonsOn((v) => !v)}>
            {seasonsOn ? "● Season dots on" : "○ Season dots off"}
          </button>
          <button type="button" className="tm-toggle" role="switch" aria-checked={countsOn} onClick={() => setCountsOn((v) => !v)}>
            {countsOn ? "# Counts on" : "# Counts off"}
          </button>
        </div>
        {followingTree && (
          <div className="tm-preview-controls">
            {here.kind === "question" ? (
              <>
                <strong>{questionById(here.question).full}</strong>
                <button type="button" className="tm-button" onClick={() => setAnswers((a) => [...a, "yes"])}>Yes</button>
                <button type="button" className="tm-button" onClick={() => setAnswers((a) => [...a, "no"])}>No</button>
              </>
            ) : (
              <strong>Advice: {adviceFor(here.path, here.plant).text}</strong>
            )}
            {answers.length > 0 && (
              <button type="button" className="tm-button tm-button-secondary" onClick={() => setAnswers([])}>
                Try different answers
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- Village map ---------- */}
      <div className="tm-preview-card">
        <h3>The village map</h3>
        <div className="tm-preview-map">
          <VillageMap
            villages={VILLAGES}
            groupOf={view === "found" ? result.assignment : undefined}
            centres={view === "grey" ? [] : view === "start" ? START_CENTRES : result.centres}
            colours={GROUP_COLOURS}
            showLines={linesOn && view === "found"}
            labels={view === "found" ? result.centres.map((c) => GROUP_LABELS[groupKind(c)]) : undefined}
          />
        </div>
        <div className="tm-preview-controls">
          <button type="button" className="tm-toggle" onClick={() => setView("grey")}>All grey</button>
          <button type="button" className="tm-toggle" onClick={() => setView("start")}>⭐ Stars at the start</button>
          <button type="button" className="tm-toggle" onClick={() => setView("found")}>✔ Groups found ({result.rounds} rounds)</button>
          <button type="button" className="tm-toggle" role="switch" aria-checked={linesOn} onClick={() => setLinesOn((v) => !v)}>
            {linesOn ? "Lines on" : "Lines off"}
          </button>
        </div>
      </div>
    </section>
  );
}
