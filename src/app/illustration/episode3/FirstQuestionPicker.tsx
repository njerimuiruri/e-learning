"use client";

// ============================================================
// SCENE 5 ACTIVITY: "Which question should we ask FIRST?"
// ------------------------------------------------------------
// The audience presses one of Mama's three questions. The 16
// season cards slide into a "Yes" pile and a "No" pile. Each
// pile shows how mixed it is (good and poor harvests), and the
// sorting meter shows how many seasons the question sorts
// correctly (worked out by sortedCorrectly() in treeMath.ts):
//   rains 12 of 16 · dry spell 11 of 16 · soil 10 of 16
// They can try all three. "Next" unlocks once "Have the rains
// started?" has been tried.
// ============================================================

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import type { TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import SeasonCard, { SeasonCardKey } from "./SeasonCard";
import { QUESTIONS, bestQuestion, sortedCorrectly, splitSeasons, type QuestionId, type Season } from "./treeMath";
import { SEASONS } from "./content";

const TOTAL = SEASONS.length;
const BEST = bestQuestion(SEASONS, QUESTIONS.map((q) => q.id)); // "rains"

/** Good harvests first, then poor, so you can see how mixed a pile is. */
const goodFirst = (pile: Season[]) => [...pile].sort((a, b) => Number(b.good) - Number(a.good) || a.id - b.id);

function Pile({ title, seasons, delayStart }: { title: string; seasons: Season[]; delayStart: number }) {
  const good = seasons.filter((s) => s.good).length;
  const poor = seasons.length - good;
  const clean = seasons.length > 0 && (good === 0 || poor === 0);
  return (
    <div className={`tm-pile ${clean ? "is-clean" : ""}`}>
      <p className="tm-pile-title">
        <strong>{title}</strong> · {seasons.length} seasons
        {clean && <span className="tm-pile-clean">✨ Clean pile!</span>}
      </p>
      {/* How mixed is this pile? */}
      <div className="tm-mix-bar" role="img" aria-label={`${good} good and ${poor} poor harvests`}>
        {good > 0 && <span className="tm-mix-good" style={{ flex: good }}>{good} good</span>}
        {poor > 0 && <span className="tm-mix-poor" style={{ flex: poor }}>{poor} poor</span>}
      </div>
      <div className="tm-pile-cards">
        {goodFirst(seasons).map((s, i) => (
          <SeasonCard key={s.id} season={s} className="tm-card-slide" style={{ animationDelay: `${(delayStart + i) * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}

function reaction(chosen: QuestionId | null): { mood: TumainiMood; text: string } {
  if (!chosen) return { mood: "thinking", text: "Which question splits the good and poor seasons best? Press one to try!" };
  if (chosen === BEST) {
    return { mood: "excited", text: "Look! Every season where the rains hadn't started was a poor harvest. That pile is perfectly clean!" };
  }
  return { mood: "thinking", text: "Hmm, these piles are more mixed. Try another question!" };
}

export default function FirstQuestionPicker({ done, onComplete, onSpeech }: ActivityProps) {
  const [chosen, setChosen] = useState<QuestionId | null>(done ? BEST : null);
  const [tried, setTried] = useState<QuestionId[]>(done ? [BEST] : []);

  useEffect(() => {
    if (tried.includes(BEST)) onComplete();
  }, [tried, onComplete]);

  const { mood, text } = reaction(chosen);
  useEffect(() => {
    onSpeech(text);
  }, [text, onSpeech]);

  const choose = (q: QuestionId) => {
    setChosen(q);
    setTried((t) => (t.includes(q) ? t : [...t, q]));
  };

  const score = chosen ? sortedCorrectly(SEASONS, chosen) : 0;
  const piles = chosen ? splitSeasons(SEASONS, chosen) : null;

  return (
    <div className="tm-activity">
      {/* ---------- The three questions ---------- */}
      <div className={`tm-question-buttons ${tried.length === 0 ? "tm-attention-group" : ""}`}>
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            className={`tm-question-button ${chosen === q.id ? "is-chosen" : ""}`}
            onClick={() => choose(q.id)}
            aria-pressed={chosen === q.id}
          >
            {q.short}
            {tried.includes(q.id) && <span className="tm-question-score">{sortedCorrectly(SEASONS, q.id)} of {TOTAL}</span>}
          </button>
        ))}
      </div>

      {/* ---------- The sorting meter ---------- */}
      {chosen && (
        <div className="tm-sort-meter" aria-live="polite">
          <p>
            This question sorts <strong>{score} of {TOTAL}</strong> seasons correctly
          </p>
          <div className="tm-sort-meter-track" aria-hidden="true">
            <div className="tm-sort-meter-fill" style={{ width: `${(score / TOTAL) * 100}%` }} />
          </div>
          {tried.length > 1 && (
            <p className="tm-sort-compare">
              {QUESTIONS.filter((q) => tried.includes(q.id))
                .map((q) => `${q.short} ${sortedCorrectly(SEASONS, q.id)}${q.id === BEST && tried.length === QUESTIONS.length ? " ⭐" : ""}`)
                .join("  ·  ")}
            </p>
          )}
        </div>
      )}

      <div className="tm-feedback">
        <Tumaini mood={mood} size={110} />
        <SpeechBubble text={text} name="Tumaini" small instant />
      </div>

      {/* ---------- The cards: all together, or split into two piles ---------- */}
      {!piles ? (
        <>
          <SeasonCardKey />
          <div className="tm-season-grid">
            {SEASONS.map((s) => (
              <SeasonCard key={s.id} season={s} />
            ))}
          </div>
        </>
      ) : (
        // "key" makes the piles re-appear (and slide in again) for each new question
        <div key={chosen}>
          <p className="tm-piles-question">{QUESTIONS.find((q) => q.id === chosen)!.short}</p>
          <div className="tm-piles">
            <Pile title="No" seasons={piles.no} delayStart={0} />
            <Pile title="Yes" seasons={piles.yes} delayStart={piles.no.length} />
          </div>
        </div>
      )}
    </div>
  );
}
