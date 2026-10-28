// ============================================================
// DECISION TREE DRAWING
// ------------------------------------------------------------
// A cartoon tree that grows UPWARDS like a real one:
//   • the trunk at the bottom, the first question just above it
//   • thick brown branches labelled "Yes" and "No"
//   • questions in green "leaf" boxes
//   • advice in round "fruit" boxes at the ends of the branches
//
// Props:
//   tree        the tree from buildTree() in treeMath.ts
//   grownDepth  how many levels of branches have grown (0 = just
//               the first question). New branches GROW from
//               nothing, then their boxes pop out.
//   showSeasons small dots for the 16 seasons, sitting at the
//               furthest grown box they reach (they slide when
//               the tree grows): gold = good, brown = poor
//   showCounts  the "x of y past seasons" line in each fruit box
//   answers     the answers so far when following the tree: those
//               branches GLOW, the others fade a little
//   reached     true when the answers have reached an ending: that
//               fruit box grows bigger
// ============================================================

import type { CSSProperties, ReactNode } from "react";
import { questionById, type Answer, type LeafNode, type TreeNode } from "./treeMath";
import { adviceFor, type AdviceKind } from "./content";

const OUTLINE = "#13303A";
const BRANCH = "#8A5A36";
const BRANCH_DARK = "#5F3E25";

const W = 800;
const H = 600;
const ROOT_Y = 492; // the first question
const LEVEL_GAP = 124; // how far up each level is
const Q_BOX = { w: 236, h: 58 };
const FRUIT = { w: 184, h: 108 }; // tall enough for the advice, the count and a row of season dots

const FRUIT_COLOURS: Record<AdviceKind, string> = {
  plant: "#7CCB5B",
  wait: "#F6B26B",
  "dry-spell": "#F08C6C",
};

// ---------- Working out where everything goes ----------
interface Placed {
  node: TreeNode;
  x: number;
  y: number;
}

/** Give every node a position. Endings are spread evenly across; each question sits between its two branches. */
function layout(tree: TreeNode): Map<string, Placed> {
  const placed = new Map<string, Placed>();
  const leaves: TreeNode[] = [];
  const collect = (n: TreeNode) => {
    if (n.kind === "leaf") leaves.push(n);
    else {
      collect(n.no);
      collect(n.yes);
    }
  };
  collect(tree);
  const gap = (W - 2 * 100) / Math.max(1, leaves.length - 1);
  const place = (n: TreeNode): number => {
    const y = ROOT_Y - n.depth * LEVEL_GAP;
    let x: number;
    if (n.kind === "leaf") x = 100 + leaves.indexOf(n) * gap;
    else x = (place(n.no) + place(n.yes)) / 2;
    placed.set(n.path, { node: n, x, y });
    return x;
  };
  place(tree);
  return placed;
}

/** Split words into short lines, so they fit in a box. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** Where a season ends up, if the tree has only grown this far. */
function furthestNode(tree: TreeNode, season: LeafNode["seasons"][number], grownDepth: number): TreeNode {
  let node = tree;
  while (node.kind === "question" && node.depth < grownDepth) {
    node = season[node.question] ? node.yes : node.no;
  }
  return node;
}

/** The short count line inside a fruit box. */
function shortCount(leaf: LeafNode) {
  const total = leaf.seasons.length;
  return leaf.plant ? `Good: ${leaf.goodCount} of ${total} seasons` : `Failed: ${total - leaf.goodCount} of ${total} seasons`;
}

/** The tree in words, for screen readers. */
function describe(node: TreeNode, grownDepth: number): string {
  if (node.kind === "leaf") return `advice: ${adviceFor(node.path, node.plant).text}`;
  const q = questionById(node.question).short;
  if (node.depth >= grownDepth) return `the question "${q}"`;
  return `the question "${q}". If no, ${describe(node.no, grownDepth)}. If yes, ${describe(node.yes, grownDepth)}`;
}

// ---------- The drawing ----------
interface DecisionTreeProps {
  tree: TreeNode;
  grownDepth?: number;
  showSeasons?: boolean;
  showCounts?: boolean;
  answers?: Answer[];
  reached?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function DecisionTree({
  tree,
  grownDepth = 99,
  showSeasons = false,
  showCounts = false,
  answers = [],
  reached = false,
  className = "",
  children,
}: DecisionTreeProps) {
  const placed = layout(tree);
  const all = Array.from(placed.values());

  // Which boxes are on the path the answers have taken?
  const visited = new Set<string>([tree.path]);
  let current: TreeNode = tree;
  for (const a of answers) {
    if (current.kind === "leaf") break;
    current = a === "yes" ? current.yes : current.no;
    visited.add(current.path);
  }
  const following = answers.length > 0;

  const isGrown = (n: TreeNode) => n.depth <= grownDepth;

  // ---------- Branches (drawn first, so the boxes sit on top) ----------
  const branches = all.flatMap(({ node, x, y }) => {
    if (node.kind === "leaf" || node.depth >= grownDepth) return [];
    return (["no", "yes"] as Answer[]).map((answer) => {
      const child = placed.get(node[answer].path)!;
      const fromY = y - Q_BOX.h / 2;
      const toY = child.y + (child.node.kind === "leaf" ? FRUIT.h : Q_BOX.h) / 2;
      const midY = (fromY + toY) / 2;
      const d = `M${x} ${fromY} C${x} ${midY} ${child.x} ${midY} ${child.x} ${toY}`;
      const glowing = visited.has(child.node.path);
      const faded = following && !glowing;
      // The "Yes" / "No" label sits partway along the branch
      const labelX = x + (child.x - x) * 0.55;
      const labelY = fromY + (toY - fromY) * 0.5;
      return (
        <g key={child.node.path} className={`tm-branch ${faded ? "is-faded" : ""}`}>
          <path className="tm-branch-grow" pathLength={1} d={d} stroke={BRANCH_DARK} strokeWidth="22" fill="none" strokeLinecap="round" />
          <path className="tm-branch-grow" pathLength={1} d={d} stroke={BRANCH} strokeWidth="14" fill="none" strokeLinecap="round" />
          {glowing && <path className="tm-branch-glow" pathLength={1} d={d} stroke="#FFE38A" strokeWidth="8" fill="none" strokeLinecap="round" />}
          <g className="tm-branch-label">
            <rect x={labelX - 26} y={labelY - 15} width="52" height="30" rx="15" fill={answer === "yes" ? "#E3F2DF" : "#FBE0DA"} stroke={OUTLINE} strokeWidth="2.5" />
            <text x={labelX} y={labelY + 6} textAnchor="middle" fontSize="16" fontWeight="900" fill={OUTLINE}>
              {answer === "yes" ? "Yes" : "No"}
            </text>
          </g>
        </g>
      );
    });
  });

  // ---------- Boxes ----------
  const boxes = all.filter(({ node }) => isGrown(node)).map(({ node, x, y }) => {
    const onPath = visited.has(node.path);
    const faded = following && !onPath;
    const isCurrent = following && node.path === current.path;

    if (node.kind === "question") {
      const lines = wrap(questionById(node.question).short, 20);
      return (
        <g key={node.path} className={`tm-tree-box ${faded ? "is-faded" : ""}`} style={{ animationDelay: node.depth ? "0.7s" : "0s" }}>
          {isCurrent && <rect className="tm-tree-current" x={x - Q_BOX.w / 2 - 8} y={y - Q_BOX.h / 2 - 8} width={Q_BOX.w + 16} height={Q_BOX.h + 16} rx="36" fill="none" stroke="#FFE38A" strokeWidth="5" />}
          <rect x={x - Q_BOX.w / 2} y={y - Q_BOX.h / 2} width={Q_BOX.w} height={Q_BOX.h} rx="29" fill="#9BD48A" stroke={OUTLINE} strokeWidth="3.5" />
          {lines.map((line, i) => (
            <text key={i} x={x} y={y + 7 + (i - (lines.length - 1) / 2) * 20} textAnchor="middle" fontSize="18" fontWeight="900" fill={OUTLINE}>
              {line}
            </text>
          ))}
        </g>
      );
    }

    const advice = adviceFor(node.path, node.plant);
    const lines = wrap(advice.title, 16);
    const big = reached && isCurrent;
    return (
      <g
        key={node.path}
        className={`tm-tree-box tm-fruit ${faded ? "is-faded" : ""} ${big ? "is-reached" : ""}`}
        style={{ animationDelay: "0.7s", "--fx": `${x}px`, "--fy": `${y}px` } as CSSProperties}
      >
        {/* A little stalk and leaf, so it looks like fruit */}
        <path d={`M${x} ${y - FRUIT.h / 2} q4 -14 14 -18`} stroke={BRANCH_DARK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={`M${x + 8} ${y - FRUIT.h / 2 - 10} q14 -10 22 0 q-10 8 -22 0`} fill="#4C8E44" stroke={OUTLINE} strokeWidth="2" />
        <rect x={x - FRUIT.w / 2} y={y - FRUIT.h / 2} width={FRUIT.w} height={FRUIT.h} rx="40" fill={FRUIT_COLOURS[advice.kind]} stroke={OUTLINE} strokeWidth="3.5" />
        {/* Inside the fruit, top to bottom: the advice, the count, then the season dots */}
        {lines.map((line, i) => (
          <text key={i} x={x} y={y - 10 + (i - (lines.length - 1) / 2) * 18} textAnchor="middle" fontSize="16" fontWeight="900" fill={OUTLINE}>
            {line}
          </text>
        ))}
        {showCounts && (
          <text className="tm-fruit-count" x={x} y={y + 26} textAnchor="middle" fontSize="13" fontWeight="800" fill={OUTLINE}>
            {shortCount(node)}
          </text>
        )}
      </g>
    );
  });

  // ---------- Season dots ----------
  // Each season sits at the furthest box it has reached:
  //   • at an ending: in a row INSIDE the fruit, under the count
  //   • at a question the tree hasn't grown past yet: beside it, on the right
  // (Never below a box, where they would cover the "Yes" / "No" labels.)
  const reachedBy = tree.seasons.map((season) => furthestNode(tree, season, grownDepth));
  const totals = new Map<string, number>();
  reachedBy.forEach((node) => totals.set(node.path, (totals.get(node.path) ?? 0) + 1));
  const groups = new Map<string, number>();
  const dots = showSeasons
    ? tree.seasons.map((season, s) => {
        const node = reachedBy[s];
        const p = placed.get(node.path)!;
        const n = groups.get(node.path) ?? 0;
        groups.set(node.path, n + 1);
        let dx: number;
        let dy: number;
        if (node.kind === "leaf") {
          const count = totals.get(node.path)!;
          dx = (n - (count - 1) / 2) * 15;
          dy = FRUIT.h / 2 - 14;
        } else {
          dx = Q_BOX.w / 2 + 16 + (n % 6) * 14;
          dy = (Math.floor(n / 6) - 1) * 14;
        }
        return (
          <circle
            key={season.id}
            className="tm-season-dot"
            r="6.5"
            cx={0}
            cy={0}
            fill={season.good ? "#F2B544" : "#8A5A36"}
            stroke="#FFFFFF"
            strokeWidth="2"
            style={{ transform: `translate(${p.x + dx}px, ${p.y + dy}px)` }}
          />
        );
      })
    : null;

  const root = placed.get(tree.path)!;

  return (
    <svg
      className={`tm-tree ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`A decision tree. It starts with ${describe(tree, grownDepth)}.`}
    >
      {/* Ground and trunk */}
      <rect x="0" y={H - 30} width={W} height="30" fill="#6FAE5F" />
      <path d={`M${root.x - 34} ${H - 22} Q${root.x - 12} ${ROOT_Y + 60} ${root.x - 14} ${ROOT_Y + 20} L${root.x + 14} ${ROOT_Y + 20} Q${root.x + 12} ${ROOT_Y + 60} ${root.x + 34} ${H - 22} Z`} fill={BRANCH} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />
      {branches}
      {boxes}
      {dots}
      {children}
    </svg>
  );
}
