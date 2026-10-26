// ============================================================
// REGRESSION MATHS  (the maths behind Scene 3)
// ------------------------------------------------------------
// A straight line is   y = m × x + c
//   x = hours of heavy rain (what we know)
//   y = river height in metres (what we predict)
//   m = how much the river rises for each extra hour
//   c = the river height with no heavy rain
//
// Tumaini's "best" line uses LEAST SQUARES: of all possible
// straight lines, it picks the one where the mistakes, each
// multiplied by itself (squared), add up to the smallest total.
//
// With all 10 of Baba's storms:  m ≈ 0.39,  c ≈ 0.81
// ============================================================

export interface Point {
  x: number; // hours of heavy rain
  y: number; // river height (metres)
}

export interface Line {
  m: number; // slope: metres per extra hour
  c: number; // where the line starts at 0 hours
}

/** The height the line predicts for x hours of rain: y = m × x + c */
export function predict(line: Line, x: number): number {
  return line.m * x + line.c;
}

/**
 * The best-fit line through the points (least squares).
 * Needs at least 2 points with different x values, otherwise
 * there is no line yet, so it returns null.
 */
export function fitLine(points: Point[]): Line | null {
  const n = points.length;
  if (n < 2) return null;

  // 1. The average x and the average y
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  // 2. How x and y move together, compared with how x moves on its own
  let together = 0;
  let xAlone = 0;
  for (const p of points) {
    together += (p.x - meanX) * (p.y - meanY);
    xAlone += (p.x - meanX) * (p.x - meanX);
  }
  if (xAlone === 0) return null; // all storms had the same hours: no slope

  // 3. The slope, then the starting height (the line passes through the averages)
  const m = together / xAlone;
  const c = meanY - m * meanX;
  return { m, c };
}

/** Each point's mistake: how far it is above (+) or below (−) the line. */
export function mistakes(points: Point[], line: Line): number[] {
  return points.map((p) => p.y - predict(line, p.x));
}

/**
 * The total mistake score: every mistake multiplied by itself, added up.
 * Squaring makes every mistake positive, and makes big mistakes count
 * much more than small ones. Tumaini's line always has the smallest score.
 */
export function totalMistake(points: Point[], line: Line): number {
  return mistakes(points, line).reduce((sum, d) => sum + d * d, 0);
}

/** How many hours of rain make the line reach a height (e.g. the danger line). */
export function hoursToReach(line: Line, height: number): number {
  return (height - line.c) / line.m;
}
