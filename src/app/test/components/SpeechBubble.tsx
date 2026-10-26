"use client";

// ============================================================
// SPEECH BUBBLE (with typing effect)
// ------------------------------------------------------------
// Shows text one letter at a time, like someone is typing it.
// Every character in the series uses this:
//
//   <SpeechBubble text="Hi! I'm Tumaini." name="Tumaini" />
//
// text:  what the character says
// name:  optional speaker name shown at the top
// speed: milliseconds between letters (smaller = faster)
// tail:  where the little pointer is: "left" (beside the
//        speaker), "bottom" (speaker is below the bubble)
//        or "top" (speaker is above the bubble)
// tailX: for "bottom" tails, how far across the pointer sits,
//        e.g. "20%" when the speaker stands on the left
//
// People who turn on "reduce motion" on their device see the
// whole text at once, with no typing.
// ============================================================

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Small helper: is "reduce motion" turned on in this device's settings?
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

interface SpeechBubbleProps {
  text: string;
  name?: string;
  speed?: number;
  tail?: "left" | "bottom" | "top";
  tailX?: string;
  small?: boolean;
  /** Wait this many milliseconds before starting to type (e.g. while someone walks in). */
  delay?: number;
  /** Called once when all the text is showing. */
  onDone?: () => void;
  /** true = no typing, show the words at once (for words that change often, e.g. with a slider) */
  instant?: boolean;
}

export default function SpeechBubble({
  text,
  name,
  speed = 35,
  tail = "left",
  tailX = "50%",
  small = false,
  delay = 0,
  onDone,
  instant = false,
}: SpeechBubbleProps) {
  const reduced = usePrefersReducedMotion();

  // "count" = how many letters are showing right now.
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(delay === 0);
  const done = reduced || instant || count >= text.length;

  // When the text changes, start typing again from the first letter
  // (after the delay, if there is one).
  useEffect(() => {
    setCount(0);
    if (delay === 0) {
      setStarted(true);
      return;
    }
    setStarted(false);
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  // Show one more letter after a short wait, until we reach the end.
  useEffect(() => {
    if (done || !started) return;
    const timer = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [count, done, started, speed]);

  // Tell whoever is listening that the typing has finished.
  // (A "ref" remembers the latest onDone without restarting anything.)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done, text]);

  const shownText = done ? text : text.slice(0, count);

  return (
    <div
      className={`tm-bubble tm-bubble-tail-${tail} ${small ? "tm-bubble-small" : ""} ${started || reduced ? "" : "is-waiting"}`}
      style={{ "--tm-tail-x": tailX } as CSSProperties}
    >
      {name && <p className="tm-bubble-name">{name}</p>}

      {/* Screen readers get the full sentence straight away... */}
      <p className="tm-sr-only" aria-live="polite">{text}</p>

      {/* ...while sighted people watch it being typed.
          The invisible "ghost" copy keeps the bubble the same size
          the whole time, so nothing jumps around while typing. */}
      <p className="tm-bubble-text" aria-hidden="true">
        <span className="tm-ghost">{text}</span>
        <span className="tm-typed">
          {shownText}
          {!done && <span className="tm-cursor">|</span>}
        </span>
      </p>

      {!small && (
        <div className="tm-bubble-actions">
          {!done ? (
            <button type="button" className="tm-link-button" onClick={() => setCount(text.length)}>
              Skip ⏭
            </button>
          ) : (
            !reduced && (
              <button type="button" className="tm-link-button" onClick={() => setCount(0)}>
                Say it again ↻
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
