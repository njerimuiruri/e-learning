"use client";

// ============================================================
// CARD SORT  (a reusable "which group does this belong in?" game)
// ------------------------------------------------------------
// One card at a time. The audience taps one of two bins. Tumaini
// says whether it was right and, most importantly, WHY. Then
// "Next card". The score shows at the end, and "Next" unlocks.
//
// The cards and bins are data (see episode0/content.ts), so the
// same game is used for "Cut or adapt?", "AI or not AI?" and
// "Supervised or unsupervised?":
//
//   "cut-or-adapt": makeCardSort(CUT_OR_ADAPT)   (in registry.tsx)
// ============================================================

import { useEffect, useState, type ComponentType } from "react";
import type { ActivityProps } from "./registry";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";

export interface SortBin {
  emoji: string;
  label: string;
}

export interface SortCard {
  emoji: string;
  text: string;
  /** Which bin it belongs in: 0 (left) or 1 (right) */
  bin: 0 | 1;
  /** Why: the explanation Tumaini gives after the answer */
  why: string;
}

export interface CardSortConfig {
  bins: [SortBin, SortBin];
  cards: SortCard[];
  /** What Tumaini says when every card is sorted */
  finish: string;
}

export function makeCardSort(config: CardSortConfig): ComponentType<ActivityProps> {
  const { bins, cards, finish } = config;

  function CardSort({ done, onComplete, onSpeech }: ActivityProps) {
    const [index, setIndex] = useState(done ? cards.length : 0);
    const [chosen, setChosen] = useState<0 | 1 | null>(null);
    const [results, setResults] = useState<{ card: SortCard; right: boolean }[]>(
      done ? cards.map((card) => ({ card, right: true })) : [],
    );
    const finished = index >= cards.length;
    const card = finished ? null : cards[index];
    const right = card !== null && chosen === card.bin;

    useEffect(() => {
      if (finished) onComplete();
    }, [finished, onComplete]);

    const score = results.filter((r) => r.right).length;
    const text = finished
      ? done
        ? finish
        : `${finish} You got ${score} of ${cards.length} right.`
      : chosen === null || !card
        ? "Which group does this card belong in?"
        : right
          ? `Yes! ${card.why}`
          : `Not quite: this one goes in "${bins[card.bin].label}". ${card.why}`;

    useEffect(() => {
      onSpeech(text);
    }, [text, onSpeech]);

    const choose = (bin: 0 | 1) => {
      if (!card || chosen !== null) return;
      setChosen(bin);
      setResults((r) => [...r, { card, right: bin === card.bin }]);
    };
    const nextCard = () => {
      setChosen(null);
      setIndex((i) => i + 1);
    };

    return (
      <div className="tm-activity">
        {/* ---------- The two bins, with the cards sorted so far ---------- */}
        <div className="tm-sort-bins">
          {bins.map((bin, b) => (
            <div key={bin.label} className={`tm-sort-bin ${chosen === b ? (right ? "is-right" : "is-wrong") : ""}`}>
              <p className="tm-sort-bin-title">
                <span aria-hidden="true">{bin.emoji}</span> {bin.label}
              </p>
              <div className="tm-sort-bin-cards">
                {results
                  .filter((r) => r.card.bin === b)
                  .map((r) => (
                    <span key={r.card.text} className="tm-sort-chip" title={r.card.text}>
                      <span aria-hidden="true">{r.card.emoji}</span> {r.card.text}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- The card to sort ---------- */}
        {card && (
          <div key={index} className="tm-sort-card">
            <span className="tm-sort-card-emoji" aria-hidden="true">
              {card.emoji}
            </span>
            <span className="tm-sort-card-text">{card.text}</span>
            <span className="tm-sort-card-count">
              Card {index + 1} of {cards.length}
            </span>
          </div>
        )}

        {card && chosen === null && (
          <div className="tm-sort-choices tm-attention-group">
            {bins.map((bin, b) => (
              <button key={bin.label} type="button" className="tm-sort-button" onClick={() => choose(b as 0 | 1)}>
                <span aria-hidden="true">{bin.emoji}</span> {bin.label}
              </button>
            ))}
          </div>
        )}

        <div className="tm-feedback">
          <Tumaini mood={finished ? "excited" : chosen === null ? "thinking" : right ? "happy" : "unsure"} size={100} />
          <SpeechBubble text={text} name="Tumaini" small instant />
        </div>

        {card && chosen !== null && (
          <div className="tm-activity-controls">
            <span />
            <button type="button" className="tm-button tm-button-big tm-attention" onClick={nextCard}>
              {index + 1 < cards.length ? "Next card →" : "See my score ✔"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return CardSort;
}
