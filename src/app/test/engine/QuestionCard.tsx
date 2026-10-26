"use client";

// ============================================================
// QUESTION CARD
// ------------------------------------------------------------
// Big tappable answers (A, B, C). A wrong answer is crossed
// out and Tumaini gives a gentle hint, so people can try again.
// The right answer gets a tick, confetti and Tumaini cheering.
// Used for the check questions AND the episode quiz.
// ============================================================

import { useState } from "react";
import type { AnswerOption } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import Confetti from "../components/Confetti";

interface QuestionCardProps {
  options: AnswerOption[];
  correctReply: string;
  wrongReply: string;
  /** Called once, when the right answer is chosen. firstTry = no wrong answers before it. */
  onCorrect: (firstTry: boolean) => void;
  /** true = show the question as already answered (e.g. after pressing Back) */
  alreadyAnswered?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E"];

export default function QuestionCard({ options, correctReply, wrongReply, onCorrect, alreadyAnswered = false }: QuestionCardProps) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(alreadyAnswered);
  const [lastPick, setLastPick] = useState<number | null>(null);

  const choose = (i: number) => {
    if (solved || wrong.includes(i)) return;
    setLastPick(i);
    if (options[i].correct) {
      setSolved(true);
      onCorrect(wrong.length === 0);
    } else {
      setWrong((w) => [...w, i]);
    }
  };

  const showWrongHint = !solved && lastPick !== null;

  return (
    <div className="tm-question">
      <div className="tm-options">
        {options.map((option, i) => {
          const isWrong = wrong.includes(i);
          const isRight = solved && option.correct;
          return (
            <button
              key={option.text}
              type="button"
              className={`tm-option ${isWrong ? "is-wrong" : ""} ${isRight ? "is-right" : ""}`}
              onClick={() => choose(i)}
              disabled={solved || isWrong}
              aria-label={`${LETTERS[i]}: ${option.text}${isWrong ? " (not quite)" : ""}${isRight ? " (correct)" : ""}`}
            >
              <span className="tm-option-letter" aria-hidden="true">
                {isRight ? "✔" : isWrong ? "✘" : LETTERS[i]}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {(solved || showWrongHint) && (
        <div className="tm-feedback">
          {solved && !alreadyAnswered && <Confetti />}
          <Tumaini mood={solved ? "excited" : "unsure"} size={110} />
          <SpeechBubble key={solved ? "yes" : `no-${wrong.length}`} text={solved ? correctReply : wrongReply} name="Tumaini" small />
        </div>
      )}
    </div>
  );
}
