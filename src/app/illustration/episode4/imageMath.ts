// ============================================================
// IMAGE MATHS  (the logic behind chapter 1: image recognition)
// ------------------------------------------------------------
// A satellite picture is a grid of squares called PIXELS.
// To a computer, each pixel is just a number. Here the number is
// "greenness", 0–9:
//   water 0–1 · farmland 4–5 · forest 8–9
// (The gaps between the groups mean that ANY set of correct examples
// gives a perfect map: no square is ever exactly halfway between two.)
//
// Tumaini learns from labelled examples (supervised learning):
// each square gets the label of the example whose number is
// closest. If an example is wrong, the whole map comes out wrong.
//
// Every function here is "pure": it only reads its inputs and
// returns an answer, so it is easy to check and test.
// ============================================================

export type LandType = "water" | "farm" | "forest";

export interface Cell {
  row: number;
  col: number;
  type: LandType;
  /** The pixel's number: how green it is, 0–9 */
  green: number;
}

export interface Example {
  row: number;
  col: number;
  label: LandType;
}

const LETTERS: Record<string, LandType> = { W: "water", A: "farm", F: "forest" };

/**
 * How green a square is. The exact number inside each range comes from the
 * row and column, so it looks natural but is the same every time.
 */
export function greenness(type: LandType, row: number, col: number): number {
  const wobble = (row * 7 + col * 13 + row * col) % 2; // 0 or 1
  if (type === "water") return wobble; // 0 or 1
  if (type === "farm") return 4 + wobble; // 4 or 5
  return 8 + wobble; // 8 or 9
}

/** Turn rows of letters (W, A, F) into cells with their numbers. */
export function parseMap(rows: string[]): Cell[] {
  return rows.flatMap((line, row) =>
    line.split("").map((letter, col) => {
      const type = LETTERS[letter];
      return { row, col, type, green: greenness(type, row, col) };
    }),
  );
}

/** Label every square: copy the label of the example with the closest number. */
export function labelByNearestExample(cells: Cell[], examples: Example[], allCells: Cell[] = cells): LandType[] {
  const exampleGreens = examples.map((e) => ({
    label: e.label,
    green: allCells.find((c) => c.row === e.row && c.col === e.col)!.green,
  }));
  return cells.map((cell) => {
    let best = exampleGreens[0];
    for (const e of exampleGreens) {
      if (Math.abs(e.green - cell.green) < Math.abs(best.green - cell.green)) best = e;
    }
    return best.label;
  });
}

/** Are all the examples labelled with the TRUE type of their square? */
export function wrongExamples(cells: Cell[], examples: Example[]): Example[] {
  return examples.filter((e) => cells.find((c) => c.row === e.row && c.col === e.col)!.type !== e.label);
}

/** Does every label (forest, farm, water) have at least one example? */
export function hasEveryLabel(examples: Example[]): boolean {
  return (["forest", "farm", "water"] as LandType[]).every((l) => examples.some((e) => e.label === l));
}

/** How much of the LAND (not water) is forest. */
export function forestPercent(cells: Cell[]): { forest: number; land: number; percent: number } {
  const land = cells.filter((c) => c.type !== "water").length;
  const forest = cells.filter((c) => c.type === "forest").length;
  return { forest, land, percent: Math.round((forest / land) * 100) };
}

/** River squares: water away from the lake (the lake is the far-left columns). */
export function riverCells(cells: Cell[], lakeColumns = 6): Cell[] {
  return cells.filter((c) => c.type === "water" && c.col >= lakeColumns);
}

/**
 * Where to plant trees first: squares that were forest in 2005, are farm
 * in 2025, AND are within 2 squares of the river.
 */
export function plantingSquares(map2005: Cell[], map2025: Cell[], distance = 2): Cell[] {
  const river = riverCells(map2005);
  return map2025.filter((now, i) => {
    const then = map2005[i];
    const nearRiver = river.some((r) => Math.max(Math.abs(r.row - now.row), Math.abs(r.col - now.col)) <= distance);
    return then.type === "forest" && now.type === "farm" && nearRiver;
  });
}
