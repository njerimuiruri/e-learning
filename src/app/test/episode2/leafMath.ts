// ============================================================
// LEAF MATHS  (the maths behind Scene 4: classification)
// ------------------------------------------------------------
// Each leaf is described by two numbers:
//   spots       0–8   (how many brown spots)
//   yellowness  0–1   (0 = fresh green, 1 = yellow-brown)
//
// Tumaini's dividing line is:   spots ÷ 8 + yellowness = 0.85
//
//   score = spots ÷ 8 + yellowness − 0.85
//   score > 0  → the leaf is on the "sick" side of the line
//   score ≤ 0  → the leaf is on the "healthy" side
//
// The further a leaf is from the line, the surer Tumaini is:
//   confidence = 1 ÷ (1 + e^(−8 × |score|))
// A leaf right on the line gives 50% ("I really don't know").
// ============================================================

export interface LeafData {
  spots: number;
  yellowness: number;
  /** The true answer, as checked by Mama */
  sick: boolean;
}

export const LINE_VALUE = 0.85;

/** How far the leaf is from the dividing line (positive = sick side). */
export function leafScore(leaf: Pick<LeafData, "spots" | "yellowness">): number {
  return leaf.spots / 8 + leaf.yellowness - LINE_VALUE;
}

/** Tumaini's answer: is the leaf on the sick side of the line? */
export function looksSick(leaf: Pick<LeafData, "spots" | "yellowness">): boolean {
  return leafScore(leaf) > 0;
}

/** How sure Tumaini is, from 0.5 (not sure at all) to almost 1 (very sure). */
export function confidence(score: number): number {
  return 1 / (1 + Math.exp(-8 * Math.abs(score)));
}

/**
 * Confidence as a whole percentage for the screen. Capped at 99%,
 * because an AI is never truly 100% sure (Scene 4's question
 * says exactly that).
 */
export function confidencePercent(score: number): number {
  return Math.min(99, Math.round(confidence(score) * 100));
}

/** The yellowness where the line crosses, for a number of spots (used to draw it). */
export function lineYellowness(spots: number): number {
  return LINE_VALUE - spots / 8;
}
