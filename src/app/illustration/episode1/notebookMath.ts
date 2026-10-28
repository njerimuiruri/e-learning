// ============================================================
// NOTEBOOK MATHS
// ------------------------------------------------------------
// This is what Tumaini "learns". For each sign it asks:
//   "On the days I saw this sign, how often did it rain?"
//
//   percentage = (days with the sign AND rain) ÷ (days with the sign) × 100
//
// If a sign hasn't appeared yet, we can't say anything, so the
// answer is null (shown on screen as "?").
//
// After all 12 pages: dark clouds 83%, ants flying 60%, wind 40%.
// ============================================================

import { NOTEBOOK_DAYS, SIGNS } from "./content";

export function signPercentages(pagesLearned: number): (number | null)[] {
  const pages = NOTEBOOK_DAYS.slice(0, pagesLearned);

  return SIGNS.map((_, signIndex) => {
    const daysWithSign = pages.filter((day) => day[signIndex] === 1);
    if (daysWithSign.length === 0) return null;
    const rainyDays = daysWithSign.filter((day) => day[3] === 1);
    return (rainyDays.length / daysWithSign.length) * 100;
  });
}

/** The counts behind each bar, e.g. "rained on 5 of the 6 days with dark clouds". */
export function signCounts(pagesLearned: number): { rained: number; total: number }[] {
  const pages = NOTEBOOK_DAYS.slice(0, pagesLearned);
  return SIGNS.map((_, signIndex) => {
    const daysWithSign = pages.filter((day) => day[signIndex] === 1);
    return { rained: daysWithSign.filter((day) => day[3] === 1).length, total: daysWithSign.length };
  });
}

/** Tumaini's guess for today: the average of the bars for the signs we can see. */
export function chanceOfRain(seen: boolean[]): number | null {
  const learned = signPercentages(NOTEBOOK_DAYS.length);
  const picked = learned.filter((_, i) => seen[i]) as number[];
  if (picked.length === 0) return null;
  return picked.reduce((sum, p) => sum + p, 0) / picked.length;
}

export function rainWords(chance: number): string {
  if (chance >= 65) return "Rain is likely! 🌧️";
  if (chance >= 40) return "It could go either way 🌥️";
  return "Probably dry ☀️";
}
