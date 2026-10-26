"use client";

// ============================================================
// EPISODE PLAYER
// ------------------------------------------------------------
// Runs a whole episode in this order:
//   0. A "Last time…" recap card, if the episode has one (10 seconds)
//   1. Title card ("Episode 1: What is AI?") for 3 seconds
//   2. Each scene, one after another (using ScenePlayer)
//   3. The episode quiz
//   4. The summary and the "Next time…" teaser
// Any episode with "content" in episodes.ts can be played.
// ============================================================

import { useEffect, useState } from "react";
import type { Episode } from "../types";
import ScenePlayer from "./ScenePlayer";
import QuestionCard from "./QuestionCard";
import { PICTURES } from "./registry";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import Confetti from "../components/Confetti";
import IdeaPictureCard from "./IdeaPictureCard";
import { markEpisodeCompleted } from "../progress";

type Phase =
  | { kind: "recap" }
  | { kind: "title" }
  | { kind: "scene"; index: number }
  | { kind: "quiz" }
  | { kind: "summary" }
  | { kind: "draft" }; // TEMPORARY: "more coming" card while an episode is being built

export default function EpisodePlayer({ episode }: { episode: Episode }) {
  const content = episode.content!;
  // Where the episode starts: the recap card if there is one, otherwise the title card
  const firstPhase: Phase = content.recap ? { kind: "recap" } : { kind: "title" };
  const [phase, setPhase] = useState<Phase>(firstPhase);

  // Start at the top of the page whenever we move to a new part.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  switch (phase.kind) {
    case "recap":
      return <RecapCard text={content.recap!.text} onDone={() => setPhase({ kind: "title" })} />;

    case "title":
      return <TitleCard episode={episode} onDone={() => setPhase({ kind: "scene", index: 0 })} />;

    case "scene": {
      const i = phase.index;
      return (
        <ScenePlayer
          key={content.scenes[i].id}
          scene={content.scenes[i]}
          sceneIndex={i}
          sceneCount={content.scenes.length}
          onFinish={() =>
            setPhase(
              i + 1 < content.scenes.length
                ? { kind: "scene", index: i + 1 }
                : content.draft
                  ? { kind: "draft" }
                  : { kind: "quiz" },
            )
          }
          onBackFromStart={i > 0 ? () => setPhase({ kind: "scene", index: i - 1 }) : undefined}
        />
      );
    }

    case "quiz":
      return <Quiz episode={episode} onDone={() => setPhase({ kind: "summary" })} />;

    case "summary":
      return <Summary episode={episode} onReplay={() => setPhase(firstPhase)} />;

    case "draft":
      return <DraftCard episode={episode} onReplay={() => setPhase(firstPhase)} />;
  }
}

// ============================================================
// TEMPORARY: shown at the end of an episode that is still being
// built (content.draft = true), instead of the quiz and summary.
// ============================================================

function DraftCard({ episode, onReplay }: { episode: Episode; onReplay: () => void }) {
  const Extra = episode.content!.draftExtra;
  return (
    <section className="tm-summary tm-view" aria-labelledby="tm-draft-title">
      <div className="tm-summary-card">
        <h2 id="tm-draft-title">🚧 That&apos;s all of Episode {episode.number} so far!</h2>
        <p>The next parts are still being built. Come back soon.</p>
        <div className="tm-feedback">
          <Tumaini mood="thinking" size={120} />
          <SpeechBubble text="I'm still learning the rest of this episode!" name="Tumaini" small />
        </div>
      </div>
      {Extra && <Extra />}
      <div className="tm-summary-buttons">
        <button type="button" className="tm-button tm-button-big tm-button-secondary" onClick={onReplay}>
          ↺ Watch again
        </button>
        <a href="#home" className="tm-button tm-button-big">
          ← Back to all episodes
        </a>
      </div>
    </section>
  );
}

// ============================================================
// 0. "LAST TIME…" RECAP CARD
// Tumaini reminds everyone what happened in the last episode.
// Moves on by itself after 10 seconds, or with the button.
// ============================================================

function RecapCard({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 10000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <section className="tm-recap" aria-labelledby="tm-recap-title">
      <h2 id="tm-recap-title" className="tm-recap-title">
        Last time…
      </h2>
      <div className="tm-recap-body">
        <Tumaini mood="happy" waving size={180} />
        <SpeechBubble text={text} name="Tumaini" tail="left" />
      </div>
      <button type="button" className="tm-button tm-button-big" onClick={onDone}>
        Continue ▶
      </button>
      {/* A bar that fills up over the 10 seconds */}
      <span className="tm-recap-timer" aria-hidden="true" />
    </section>
  );
}

// ============================================================
// 1. TITLE CARD
// ============================================================

function TitleCard({ episode, onDone }: { episode: Episode; onDone: () => void }) {
  // Move on by itself after 3 seconds.
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button type="button" className="tm-title-card" onClick={onDone} aria-label={`Episode ${episode.number}: ${episode.title}. Click to start.`}>
      <span className="tm-title-card-label">Episode {episode.number}</span>
      <span className="tm-title-card-title">{episode.title}</span>
      <Tumaini mood="excited" waving size={200} />
      <span className="tm-title-card-hint">Click to start ▶</span>
    </button>
  );
}

// ============================================================
// 3. EPISODE QUIZ: one question at a time, then the score
// ============================================================

function Quiz({ episode, onDone }: { episode: Episode; onDone: () => void }) {
  const questions = episode.content!.quiz;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const finished = index >= questions.length;

  const nextQuestion = () => {
    setAnswered(false);
    setIndex((i) => i + 1);
  };

  // Fewer clicks: after a right answer, move on by itself (time to enjoy
  // the celebration first). The score screen moves on to the summary too.
  useEffect(() => {
    if (!answered && !finished) return;
    const timer = setTimeout(finished ? onDone : nextQuestion, finished ? 6000 : 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, finished]);

  if (finished) {
    const perfect = score === questions.length;
    return (
      <section className="tm-quiz tm-view" aria-labelledby="tm-quiz-title">
        <h2 id="tm-quiz-title" className="tm-quiz-title">Episode quiz</h2>
        <div className="tm-score-card">
          {perfect && <Confetti />}
          <p className="tm-score">
            You got {score} out of {questions.length}! {perfect ? "🎉" : "👏"}
          </p>
          <div className="tm-feedback">
            <Tumaini mood={perfect ? "excited" : "happy"} size={130} />
            <SpeechBubble
              text={perfect ? "Amazing! You know it all!" : "Well done! You found every answer in the end."}
              name="Tumaini"
              small
            />
          </div>
          <button type="button" className="tm-button tm-button-big" onClick={onDone}>
            See what we learned →
          </button>
        </div>
      </section>
    );
  }

  const q = questions[index];
  return (
    <section className="tm-quiz tm-view" aria-labelledby="tm-quiz-title">
      <p className="tm-scene-count">
        Question {index + 1} of {questions.length}
      </p>
      <h2 id="tm-quiz-title" className="tm-quiz-title">{q.question}</h2>
      <QuestionCard
        key={index}
        options={q.options}
        correctReply={q.praise}
        wrongReply={q.hint}
        onCorrect={(firstTry) => {
          // Only answers right on the first try count towards the score.
          if (firstTry) setScore((s) => s + 1);
          setAnswered(true);
        }}
      />
      <div className="tm-controls">
        <span />
        <button
          type="button"
          className="tm-button tm-button-big"
          disabled={!answered}
          onClick={nextQuestion}
        >
          {index + 1 === questions.length ? "See my score →" : "Next question →"}
        </button>
      </div>
    </section>
  );
}

// ============================================================
// 4. SUMMARY AND "NEXT TIME…" TEASER
// ============================================================

function Summary({ episode, onReplay }: { episode: Episode; onReplay: () => void }) {
  const { summary, teaser } = episode.content!;
  const Picture = PICTURES[teaser.picture];

  // Reaching the summary = the episode is finished. Remember that.
  useEffect(() => {
    markEpisodeCompleted(episode.number);
  }, [episode.number]);

  return (
    <section className="tm-summary tm-view" aria-labelledby="tm-summary-title">
      <div className="tm-summary-card">
        <h2 id="tm-summary-title">In Episode {episode.number} you learned:</h2>
        <ul className="tm-summary-points">
          {summary.points.map((p) => (
            <li key={p}>
              <span aria-hidden="true">✔</span> {p}
            </li>
          ))}
        </ul>
        <div className="tm-feedback">
          <Tumaini mood="happy" waving size={130} />
          <SpeechBubble text={summary.message} name="Tumaini" />
        </div>
        {/* The big message, once per episode: four steps that light up one by one */}
        <div className="tm-summary-message">
          <IdeaPictureCard id="big-message" />
        </div>
      </div>

      {/* Links to the official texts (they open in a new tab, and need internet) */}
      {episode.content!.links && episode.content!.links.length > 0 && (
        <div className="tm-summary-card tm-learn-more">
          <h2>📎 Learn more: read the originals</h2>
          <ul>
            {episode.content!.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label} <span aria-hidden="true">↗</span>
                  <span className="tm-sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="tm-learn-more-note">These links open the official websites in a new tab, so they need internet.</p>
        </div>
      )}

      <div className="tm-teaser">
        <h2 className="tm-teaser-title">Next time…</h2>
        <div className="tm-teaser-picture">
          <Picture />
        </div>
        <div className="tm-feedback">
          <Tumaini mood={teaser.mood ?? "worried"} size={120} />
          <SpeechBubble text={teaser.text} name="Tumaini" small />
        </div>
      </div>

      <div className="tm-summary-buttons">
        <button type="button" className="tm-button tm-button-big tm-button-secondary" onClick={onReplay}>
          ↺ Watch Episode {episode.number} again
        </button>
        <a href="#home" className="tm-button tm-button-big">
          ← Back to all episodes
        </a>
      </div>
    </section>
  );
}
