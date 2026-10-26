// ============================================================
// CLUSTERING MATHS  (k-means, the logic behind Scene 6)
// ------------------------------------------------------------
// Each village is a point:
//   x = floods in the last 10 years
//   y = dry spells in the last 10 years
//
// k-means with k = 3 groups repeats two steps:
//   Step A: every village joins the NEAREST group centre
//   Step B: every centre moves to the MIDDLE (average) of its villages
// When a full round changes nothing, the groups are found.
//
// Every function here is "pure": it only reads its inputs and
// returns an answer, so it is easy to check and test.
// ============================================================

export interface XY {
  x: number;
  y: number;
}

export interface Village extends XY {
  id: number;
  name: string;
}

/** Squared distance (we only compare distances, so no square root is needed). */
const distance2 = (a: XY, b: XY) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * Step A: for each village, the number (0, 1, 2…) of its nearest centre.
 * If two centres are exactly as close, the village joins the first one.
 */
export function assignToNearest(villages: XY[], centres: XY[]): number[] {
  return villages.map((v) => {
    let best = 0;
    centres.forEach((c, i) => {
      if (distance2(v, c) < distance2(v, centres[best])) best = i;
    });
    return best;
  });
}

/**
 * Step B: move each centre to the average position of its villages.
 * A centre with no villages stays where it is.
 */
export function moveCentres(villages: XY[], assignment: number[], centres: XY[]): XY[] {
  return centres.map((centre, i) => {
    const members = villages.filter((_, j) => assignment[j] === i);
    if (members.length === 0) return centre;
    return {
      x: members.reduce((sum, v) => sum + v.x, 0) / members.length,
      y: members.reduce((sum, v) => sum + v.y, 0) / members.length,
    };
  });
}

/** Have the groups stopped changing? (Same assignment as last time.) */
export function hasConverged(before: number[] | null, after: number[]): boolean {
  return before !== null && before.length === after.length && before.every((g, i) => g === after[i]);
}

/**
 * Run Step A and Step B again and again until nothing changes.
 * Returns the final groups, the final centres and how many rounds it took.
 */
export function runToEnd(villages: XY[], start: XY[], maxRounds = 50): { assignment: number[]; centres: XY[]; rounds: number } {
  let centres = start;
  let assignment: number[] | null = null;
  for (let round = 1; round <= maxRounds; round++) {
    const next = assignToNearest(villages, centres);
    if (hasConverged(assignment, next)) return { assignment: next, centres, rounds: round };
    assignment = next;
    centres = moveCentres(villages, assignment, centres);
  }
  return { assignment: assignment ?? assignToNearest(villages, centres), centres, rounds: maxRounds };
}

export type GroupKind = "flood" | "drought" | "lower";

/** Decide what a group is, from where its centre ended up. */
export function groupKind(centre: XY): GroupKind {
  if (centre.x >= 5 && centre.x > centre.y) return "flood"; // many floods, few dry spells
  if (centre.y >= 5 && centre.y > centre.x) return "drought"; // many dry spells, few floods
  return "lower";
}

export const GROUP_LABELS: Record<GroupKind, string> = {
  flood: "Flood-prone (near the lake and river)",
  drought: "Drought-prone (dry uplands)",
  lower: "Lower risk",
};

/** Random starting centres somewhere on the map (for "Try random starting centres"). */
export function randomCentres(count: number, random: () => number = Math.random): XY[] {
  return Array.from({ length: count }, () => ({
    x: Math.round((0.5 + random() * 9) * 10) / 10,
    y: Math.round((0.5 + random() * 9) * 10) / 10,
  }));
}
