// ============================================================
// DECISION TREE MATHS  (the logic behind Scene 5)
// ------------------------------------------------------------
// Each past season has three yes/no answers and a result:
//   rains:    had the rains started?
//   moist:    was the soil moist to the depth of a hand?
//   drySpell: was a dry spell of 10+ days forecast?
//   good:     was the harvest good?
//
// How good is a question? Split the seasons by its answer, then
// on each side count the seasons that match that side's most
// common result. More "sorted correctly" = a better question.
//   rains → 12 of 16,  drySpell → 11 of 16,  moist → 10 of 16
//
// buildTree keeps doing this: ask the best question, split the
// seasons, then on each branch ask the best of the questions
// left. It stops when a pile is all one result, or there are no
// questions left.
//
// Every function here is "pure": it only reads its inputs and
// returns an answer, so it is easy to check and test.
// ============================================================

export type QuestionId = "rains" | "moist" | "drySpell";
export type Answer = "yes" | "no";

export interface Season {
  id: number;
  rains: boolean;
  moist: boolean;
  drySpell: boolean;
  good: boolean;
}

export interface Question {
  id: QuestionId;
  /** Short words for the tree's question boxes */
  short: string;
  /** The full question, for buttons and the big question when following the tree */
  full: string;
}

export const QUESTIONS: Question[] = [
  { id: "rains", short: "Have the rains started?", full: "Have the rains started?" },
  { id: "moist", short: "Is the soil moist?", full: "Is the soil moist to the depth of your hand?" },
  { id: "drySpell", short: "Is a dry spell forecast?", full: "Is a dry spell of 10 days or more forecast?" },
];

export const questionById = (id: QuestionId) => QUESTIONS.find((q) => q.id === id)!;

/** Split seasons into the "yes" pile and the "no" pile for one question. */
export function splitSeasons(seasons: Season[], question: QuestionId): { yes: Season[]; no: Season[] } {
  return {
    yes: seasons.filter((s) => s[question]),
    no: seasons.filter((s) => !s[question]),
  };
}

/** In one pile, how many seasons match the pile's most common result? */
export function majorityCount(pile: Season[]): number {
  const good = pile.filter((s) => s.good).length;
  return Math.max(good, pile.length - good);
}

/** How many seasons a question sorts correctly (both piles added together). */
export function sortedCorrectly(seasons: Season[], question: QuestionId): number {
  const { yes, no } = splitSeasons(seasons, question);
  return majorityCount(yes) + majorityCount(no);
}

/** The best question for these seasons, from the ones allowed. Ties go to the earlier question. */
export function bestQuestion(seasons: Season[], allowed: QuestionId[]): QuestionId {
  let best = allowed[0];
  for (const q of allowed) {
    if (sortedCorrectly(seasons, q) > sortedCorrectly(seasons, best)) best = q;
  }
  return best;
}

// ---------- The tree ----------

export interface LeafNode {
  kind: "leaf";
  /** The answers that lead here, e.g. "rains:yes>drySpell:no" */
  path: string;
  depth: number;
  seasons: Season[];
  goodCount: number;
  /** Planting usually went well here (a 50/50 tie counts as "no": be careful with seed) */
  plant: boolean;
}

export interface QuestionNode {
  kind: "question";
  path: string;
  depth: number;
  question: QuestionId;
  seasons: Season[];
  no: TreeNode;
  yes: TreeNode;
}

export type TreeNode = LeafNode | QuestionNode;

const isPure = (pile: Season[]) => pile.every((s) => s.good) || pile.every((s) => !s.good);

/** Grow the whole tree from the seasons. */
export function buildTree(
  seasons: Season[],
  allowed: QuestionId[] = QUESTIONS.map((q) => q.id),
  path = "",
  depth = 0,
): TreeNode {
  if (isPure(seasons) || allowed.length === 0) {
    const goodCount = seasons.filter((s) => s.good).length;
    return { kind: "leaf", path, depth, seasons, goodCount, plant: goodCount > seasons.length - goodCount };
  }
  const question = bestQuestion(seasons, allowed);
  const left = allowed.filter((q) => q !== question);
  const { yes, no } = splitSeasons(seasons, question);
  const step = (answer: Answer) => `${path ? `${path}>` : ""}${question}:${answer}`;
  return {
    kind: "question",
    path,
    depth,
    question,
    seasons,
    no: buildTree(no, left, step("no"), depth + 1),
    yes: buildTree(yes, left, step("yes"), depth + 1),
  };
}

/** Follow answers down the tree, e.g. ["yes", "no"]. Returns where you end up. */
export function followTree(tree: TreeNode, answers: Answer[]): TreeNode {
  let node = tree;
  for (const a of answers) {
    if (node.kind === "leaf") break;
    node = a === "yes" ? node.yes : node.no;
  }
  return node;
}

/** The tree's depth: how many levels of questions it has. */
export function treeDepth(node: TreeNode): number {
  return node.kind === "leaf" ? node.depth : Math.max(treeDepth(node.yes), treeDepth(node.no));
}

/** The "x of y past seasons" line for an ending. */
export function leafCountText(leaf: LeafNode): string {
  const total = leaf.seasons.length;
  return leaf.plant
    ? `Good harvest in ${leaf.goodCount} of ${total} past seasons.`
    : `Planting failed in ${total - leaf.goodCount} of ${total} past seasons.`;
}
