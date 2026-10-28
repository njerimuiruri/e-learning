"use client";

// ============================================================
// SMOOTH NUMBERS
// ------------------------------------------------------------
// Hooks that slide numbers smoothly towards new values, about
// 60 times a second, instead of jumping. Used for the rainfall
// wheel (Episode 1), the river level and the moving line on
// the storm graph (Episode 2).
//
//   const shown = useAnimatedNumbers([1, 2, 3]);  // a list
//   const level = useAnimatedNumber(4.2);         // one number
//
// With "reduce motion" on, the numbers jump straight there.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./SpeechBubble";

/** Smoothly moves a list of numbers towards new target numbers. */
export function useAnimatedNumbers(target: number[], duration = 900) {
  const reduced = usePrefersReducedMotion();
  const [values, setValues] = useState(target);
  const current = useRef(target);
  // Only restart the animation when the numbers really change,
  // not every time a new (but equal) list is passed in.
  const key = target.join(",");

  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValues(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // slow-fast-slow
      const next = target.map((v, i) => (from[i] ?? v) + (v - (from[i] ?? v)) * ease);
      current.current = next;
      setValues(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Clean-up: stop the animation if the component goes away
    // or a new target arrives.
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration, reduced]);

  return values;
}

/** The same, for a single number. */
export function useAnimatedNumber(target: number, duration = 900) {
  const list = useMemo(() => [target], [target]);
  return useAnimatedNumbers(list, duration)[0];
}
