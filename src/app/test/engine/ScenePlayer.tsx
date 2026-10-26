"use client";

// ============================================================
// SCENE PLAYER  (the "scene engine")
// ------------------------------------------------------------
// Plays one scene, beat by beat, from the data in a content
// file. It knows how to show each kind of beat:
//   say         -> the stage with a speech bubble
//   announce    -> the same, but a radio speaks instead of a person
//   predict     -> "What do YOU think?" The audience guesses first
//   interactive -> an activity; "Next" stays locked until done
//   lesson      -> the chalkboard
//   question    -> a check question; "Next" unlocks when correct
//
// AUTO-PLAY (on by default): after a line has typed out and
// there has been time to read it, the scene moves on by itself.
// A bar filling up inside the Next button shows when. Activities
// and guesses always wait for the audience.
//
// SHORT VERSION (off by default): beats marked "optional" in the
// content are skipped, for a quicker session.
//
// ONE-STORY EPISODES: a beat can change the background ("setting"),
// and people can walk in at that beat ("walkIn"). The journey bar can
// use the scene's own chapter names ("chapters").
//
// VOICE (off by default): the computer reads every line aloud.
// With voice on, auto-play waits until the voice has finished.
//
// Controls: Back / Next, the journey bar, auto-play, short
// version, voice, 🔊 read once, "Start this scene again", and the
// facilitator panel. Arrow keys work too: → Next, ← Back.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { itemText, type Beat, type CharacterId, type Mood, type PlayableScene, type ScenePart } from "../types";
import Stage from "./Stage";
import LessonBoard from "./LessonBoard";
import QuestionCard from "./QuestionCard";
import PredictCard from "./PredictCard";
import FacilitatorPanel from "./FacilitatorPanel";
import { ACTIVITIES } from "./registry";
import { getSetting, saveSetting } from "../progress";

// The mood each character starts a scene with.
const STARTING_MOODS: Record<CharacterId, Mood> = {
  tumaini: "happy",
  mama: "happy",
  otieno: "happy",
  baba: "calm",
};

// The parts a scene can have. The journey bar only shows the parts a scene uses.
const PARTS: Record<ScenePart, { icon: string; label: string }> = {
  1: { icon: "❓", label: "The problem" },
  2: { icon: "💡", label: "It's like…" },
  3: { icon: "🧠", label: "Tumaini learns" },
  4: { icon: "🤝", label: "Tumaini helps" },
  5: { icon: "📝", label: "What we learned" },
  6: { icon: "✅", label: "Quick check" },
};
const PART_NUMBERS: ScenePart[] = [1, 2, 3, 4, 5, 6];

/** The text that the voice should read for a beat. */
function speechFor(beat: Beat): string {
  switch (beat.type) {
    case "say":
    case "announce":
      return beat.text;
    case "predict":
      return `${beat.question} ${beat.options.map((o) => `${o.text}.`).join(" ")}`;
    case "question":
      return `${beat.question} ${beat.options.map((o, i) => `${"ABC"[i]}: ${o.text}.`).join(" ")}`;
    case "lesson":
      return `${beat.title}. ${beat.rows.map((r) => `${r.label}: ${r.text} ${(r.list ?? []).map(itemText).join(". ")}`).join(" ")} ${beat.tumainiSays ?? ""}`;
    case "interactive":
      return `${beat.prompt} ${beat.help ?? ""}`;
  }
}

/** How long to leave words on screen so people can read them (ms). */
function readingTime(text: string, min: number, max: number) {
  const words = text.split(/\s+/).length;
  return Math.min(max, Math.max(min, 1200 + words * 260));
}

/** Start reading text aloud. Returns a function that stops it. */
function speak(text: string, onEnd: () => void): () => void {
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // a little slower, easier to follow
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    synth.speak(utterance);
    // Some browsers forget to say "finished", so we also stop waiting
    // after the longest time the sentence could take.
    const fallback = setTimeout(onEnd, 3000 + text.split(/\s+/).length * 500);
    return () => {
      clearTimeout(fallback);
      utterance.onend = null;
      utterance.onerror = null;
      synth.cancel();
    };
  } catch {
    onEnd();
    return () => {};
  }
}

/** Which beats to play: all of them, or (short version) all except the optional ones. */
function visibleBeats(scene: PlayableScene, short: boolean): number[] {
  return scene.beats.map((_, i) => i).filter((i) => !(short && scene.beats[i].optional));
}

interface ScenePlayerProps {
  scene: PlayableScene;
  sceneIndex: number;
  sceneCount: number;
  onFinish: () => void;
  /** What "Back" does on the very first beat (e.g. go to the previous scene). */
  onBackFromStart?: () => void;
}

export default function ScenePlayer({ scene, sceneIndex, sceneCount, onFinish, onBackFromStart }: ScenePlayerProps) {
  // Presenter settings (remembered between visits)
  const [autoPlay, setAutoPlay] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [short, setShort] = useState(false);

  // "index" counts the beats being PLAYED (so it skips optional beats in
  // the short version). "beatNo" is the beat's real number in the content.
  const visible = useMemo(() => visibleBeats(scene, short), [scene, short]);
  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0); // the furthest beat reached (real number)
  const [completed, setCompleted] = useState<number[]>([]); // real numbers of beats whose task is done
  const [guesses, setGuesses] = useState<Record<number, number>>({}); // predict beats: the option chosen
  const [runKey, setRunKey] = useState(0); // changes on "Start again" to reset everything
  const [activitySpeech, setActivitySpeech] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  // Going Back pauses auto-play for THAT step only (the real beat number), not for good.
  const [heldBeat, setHeldBeat] = useState<number | null>(null);
  // Counts touches on an activity, so auto-play waits while people are still exploring.
  const [touches, setTouches] = useState(0);

  // Progress through the current beat
  const [typed, setTyped] = useState(false); // speech bubble finished typing
  const [voiceDone, setVoiceDone] = useState(false); // voice finished reading

  const safeIndex = Math.min(index, visible.length - 1);
  const beatNo = visible[safeIndex];
  const beat = scene.beats[beatNo];
  const isLast = safeIndex === visible.length - 1;
  const needsTask = beat.type === "interactive" || beat.type === "question" || beat.type === "predict";
  const taskDone = beat.type === "predict" ? guesses[beatNo] !== undefined : completed.includes(beatNo);
  const locked = needsTask && !taskDone;

  // ---------- Which part (1–6) is each beat in? ----------
  const partOfBeat = useMemo(() => {
    let current: ScenePart = 1;
    return scene.beats.map((b) => {
      if (b.part) current = b.part;
      return current;
    });
  }, [scene]);
  const currentPart = partOfBeat[beatNo];

  // ---------- Where is each beat? (the background can change mid-scene) ----------
  const settingOfBeat = useMemo(() => {
    let current = scene.setting;
    return scene.beats.map((b) => {
      if (b.setting) current = b.setting;
      return current;
    });
  }, [scene]);
  const setting = settingOfBeat[beatNo];

  /** The scene's own name for a part, or the usual one. */
  const partInfo = (part: ScenePart) => scene.chapters?.[part] ?? PARTS[part];
  const partsUsed = PART_NUMBERS.filter((p) => visible.some((i) => partOfBeat[i] === p));

  // ---------- Who is on stage, and how do they feel? ----------
  // We look back through every beat up to now. The last mood each
  // character had is their mood now. That way "Back" always shows
  // the right faces.
  const { moods, present } = useMemo(() => {
    const m: Partial<Record<CharacterId, Mood>> = { ...STARTING_MOODS };
    const arrived = new Set<CharacterId>();
    for (let i = 0; i <= beatNo; i++) {
      const b = scene.beats[i];
      if (b.type === "say") {
        m[b.who] = b.mood;
        if (b.enters) arrived.add(b.who);
      }
    }
    const late = scene.lateArrivals ?? [];
    const castHere = scene.castBySetting?.[settingOfBeat[beatNo]] ?? scene.cast;
    return { moods: m, present: castHere.filter((id) => !late.includes(id) || arrived.has(id)) };
  }, [beatNo, scene, settingOfBeat]);

  // ---------- Load and save presenter settings ----------
  useEffect(() => {
    setAutoPlay(getSetting("autoplay-v2", true));
    setVoiceOn(getSetting("voice", false));
    setShort(getSetting("short", false));
    setCanSpeak("speechSynthesis" in window);
  }, []);

  const toggleAutoPlay = () => {
    setAutoPlay((on) => {
      saveSetting("autoplay-v2", !on);
      return !on;
    });
  };
  const toggleVoice = () => {
    setVoiceOn((on) => {
      saveSetting("voice", !on);
      if (on) window.speechSynthesis?.cancel();
      return !on;
    });
  };
  // Switching to/from the short version keeps your place in the scene.
  const toggleShort = () => {
    const nextShort = !short;
    const nextVisible = visibleBeats(scene, nextShort);
    let nextIndex = 0;
    nextVisible.forEach((n, i) => {
      if (n <= beatNo) nextIndex = i;
    });
    saveSetting("short", nextShort);
    setShort(nextShort);
    setIndex(nextIndex);
  };

  // ---------- Moving between beats ----------
  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      setFurthest((f) => Math.max(f, visible[i] ?? 0));
    },
    [visible],
  );

  const goNext = useCallback(() => {
    if (locked) return;
    if (isLast) onFinish();
    else goTo(safeIndex + 1);
  }, [locked, isLast, onFinish, goTo, safeIndex]);

  // Going back means the presenter wants to talk about something,
  // so auto-play pauses.
  const goBack = useCallback(() => {
    if (safeIndex > 0) {
      setHeldBeat(visible[safeIndex - 1]);
      setIndex(safeIndex - 1);
    } else onBackFromStart?.();
  }, [safeIndex, onBackFromStart, visible]);

  const restart = () => {
    setIndex(0);
    setFurthest(0);
    setCompleted([]);
    setGuesses({});
    setRunKey((k) => k + 1);
  };

  const markDone = useCallback((n: number) => {
    setCompleted((done) => (done.includes(n) ? done : [...done, n]));
  }, []);

  // A new beat starts: reset its progress, stop any old voice.
  useEffect(() => {
    setActivitySpeech("");
    setTyped(false);
    setVoiceDone(false);
  }, [beatNo, runKey]);

  // ---------- Voice: read each beat aloud ----------
  // Characters walking in at the start: wait for them, like the bubble does.
  const walkingIn = beat.type === "say" && beat.walkIn ? beat.walkIn : safeIndex === 0 ? scene.walkIn : undefined;
  const arrivalDelay = (walkingIn?.length ?? 0) > 0 || (beat.type === "say" && beat.enters) ? 1600 : 0;

  useEffect(() => {
    if (!voiceOn || !canSpeak) return;
    let stop = () => {};
    const timer = setTimeout(() => {
      stop = speak(speechFor(beat), () => setVoiceDone(true));
    }, arrivalDelay);
    return () => {
      clearTimeout(timer);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatNo, runKey, voiceOn, canSpeak]);

  // ---------- Auto-play: when is this beat "ready" to move on? ----------
  let waitMs: number | null = null;
  if ((beat.type === "say" || beat.type === "announce") && typed && (!voiceOn || voiceDone)) {
    waitMs = voiceOn ? 1200 : readingTime(beat.text, 2500, 7000);
  } else if (beat.type === "lesson" && (!voiceOn || voiceDone)) {
    const allText = [...beat.rows.map((r) => `${r.text} ${(r.list ?? []).map(itemText).join(" ")}`), beat.tumainiSays ?? ""].join(" ");
    waitMs = voiceOn ? 2500 : readingTime(allText, 9000, 18000);
  } else if (beat.type === "question" && taskDone) {
    waitMs = 3500; // time to enjoy the celebration
  } else if (beat.type === "predict" && taskDone) {
    waitMs = 2500; // "Let's find out!"
  } else if (beat.type === "interactive" && taskDone) {
    // Done! Move on after a little while. Every touch on the activity
    // starts the wait again, so it never cuts people off mid-play.
    waitMs = 8000;
  }

  const counting = autoPlay && !panelOpen && waitMs !== null && heldBeat !== beatNo;

  useEffect(() => {
    if (!counting || waitMs === null) return;
    const timer = setTimeout(goNext, waitMs);
    return () => clearTimeout(timer);
  }, [counting, waitMs, goNext, touches]);

  const touched = () => setTouches((t) => t + 1);

  // ---------- Arrow keys ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panelOpen) return;
      // Don't steal arrow keys from sliders or text boxes.
      // (Drag handles have role="slider" and use the arrow keys too.)
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target?.getAttribute?.("role") === "slider") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goBack, panelOpen]);

  // 🔊 Read the current words once.
  const readAloud = () => {
    speak(activitySpeech || speechFor(beat), () => {});
  };

  // ---------- What to show for this beat ----------
  const stageBasics = { setting, mamaHolds: scene.mamaHoldsBySetting?.[setting] ?? scene.mamaHolds, cast: present, moods };

  const renderBeat = () => {
    switch (beat.type) {
      case "say":
        return (
          <Stage
            {...stageBasics}
            speaker={beat.who}
            text={beat.text}
            entering={beat.enters ? beat.who : undefined}
            walkIn={walkingIn}
            action={beat.action}
            picture={beat.picture}
            onTypingDone={() => setTyped(true)}
          />
        );

      case "announce":
        return <Stage {...stageBasics} announcer={beat.source} text={beat.text} onTypingDone={() => setTyped(true)} />;

      case "predict":
        return (
          <>
            <Stage {...stageBasics} speaker={beat.who} text={beat.question} onTypingDone={() => setTyped(true)} />
            <PredictCard
              options={beat.options}
              reply={beat.reply}
              chosen={guesses[beatNo]}
              onChoose={(i) => setGuesses((g) => ({ ...g, [beatNo]: i }))}
            />
          </>
        );

      case "interactive": {
        const Activity = ACTIVITIES[beat.activity];
        return (
          <div className="tm-activity-wrap" onPointerDown={touched} onKeyDown={touched} onInput={touched}>
            <h3 className="tm-prompt">{beat.prompt}</h3>
            {beat.help && (
              <p className="tm-help">
                <span className="tm-help-hand" aria-hidden="true">👆</span> {beat.help}
              </p>
            )}
            <Activity done={taskDone} onComplete={() => markDone(beatNo)} onSpeech={setActivitySpeech} />
          </div>
        );
      }

      case "lesson":
        return <LessonBoard beat={beat} />;

      case "question":
        return (
          <>
            <Stage {...stageBasics} speaker={beat.who} text={beat.question} onTypingDone={() => setTyped(true)} />
            <QuestionCard
              options={beat.options}
              correctReply={beat.correctReply}
              wrongReply={beat.wrongReply}
              onCorrect={() => markDone(beatNo)}
              alreadyAnswered={taskDone}
            />
          </>
        );
    }
  };

  // The first played beat of each part, for jumping with the journey bar.
  const firstIndexOfPart = (part: ScenePart) => visible.findIndex((n) => partOfBeat[n] === part);

  return (
    <section className="tm-scene" aria-labelledby="tm-scene-title">
      <header className="tm-scene-header">
        {sceneCount > 1 && (
          <p className="tm-scene-count">
            Scene {sceneIndex + 1} of {sceneCount}
          </p>
        )}
        <h2 id="tm-scene-title">{scene.title}</h2>
      </header>

      {/* ---------- The journey through the scene's parts ---------- */}
      <nav className="tm-journey" aria-label="Parts of this scene">
        <ol style={{ gridTemplateColumns: `repeat(${partsUsed.length}, minmax(0, 1fr))` }}>
          {partsUsed.map((part) => {
            const start = firstIndexOfPart(part);
            const reached = start >= 0 && visible[start] <= furthest;
            const state = part < currentPart ? "is-done" : part === currentPart ? "is-now" : "";
            return (
              <li key={part}>
                <button
                  type="button"
                  className={`tm-journey-step ${state}`}
                  disabled={!reached || part === currentPart}
                  onClick={() => {
                    setHeldBeat(visible[start]);
                    setIndex(start);
                  }}
                  aria-current={part === currentPart ? "step" : undefined}
                >
                  <span className="tm-journey-icon" aria-hidden="true">
                    {part < currentPart ? "✔" : partInfo(part).icon}
                  </span>
                  <span className="tm-journey-label">{partInfo(part).label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="tm-beat" key={`${runKey}-${beatNo}`}>
        {renderBeat()}
      </div>

      {/* ---------- Main controls ---------- */}
      <div className="tm-controls">
        <button
          type="button"
          className="tm-button tm-button-big tm-button-secondary"
          onClick={goBack}
          disabled={safeIndex === 0 && !onBackFromStart}
        >
          ← Back
        </button>

        <div className="tm-progress">
          <div className="tm-dots" aria-hidden="true">
            {visible.map((n, i) => (
              <span key={n} className={`tm-dot ${i < safeIndex ? "is-past" : ""} ${i === safeIndex ? "is-now" : ""}`} />
            ))}
          </div>
          <p className="tm-progress-text">
            Step {safeIndex + 1} of {visible.length}
          </p>
        </div>

        <button
          type="button"
          className={`tm-button tm-button-big tm-next ${needsTask && taskDone && !counting ? "tm-pulse" : ""}`}
          onClick={goNext}
          disabled={locked}
          aria-describedby="tm-next-hint"
        >
          {isLast ? (sceneIndex + 1 < sceneCount ? "Next scene →" : "Finish ✔") : "Next →"}
          {counting && (
            <span key={`${beatNo}-${runKey}-${waitMs}-${touches}`} className="tm-next-timer" style={{ animationDuration: `${waitMs}ms` }} aria-hidden="true" />
          )}
        </button>
      </div>

      <p id="tm-next-hint" className="tm-locked-hint" aria-live="polite">
        {locked
          ? beat.type === "question"
            ? "Choose the right answer to continue."
            : beat.type === "predict"
              ? "Make a guess to continue. There's no wrong answer!"
              : "Finish the task above to continue."
          : beat.type === "interactive"
            ? counting
              ? "Well done! Moving on in a few seconds… (keep playing to stay here)"
              : "Well done! Press Next when you're ready →"
            : counting
              ? "Moving on by itself…"
              : heldBeat === beatNo && autoPlay
                ? "Paused here. Press Next to carry on."
                : " "}
      </p>

      {/* ---------- Presenter controls ---------- */}
      <div className="tm-controls-extra">
        <button
          type="button"
          role="switch"
          aria-checked={autoPlay}
          className={`tm-toggle ${autoPlay ? "is-on" : ""}`}
          onClick={toggleAutoPlay}
        >
          {autoPlay ? "⏸ Auto-play on" : "▶ Auto-play off"}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={short}
          className={`tm-toggle ${short ? "is-on" : ""}`}
          onClick={toggleShort}
          title="Skips the extra lines, for a quicker session"
        >
          {short ? "⚡ Short version on" : "⚡ Short version off"}
        </button>
        {canSpeak && (
          <button
            type="button"
            role="switch"
            aria-checked={voiceOn}
            className={`tm-toggle ${voiceOn ? "is-on" : ""}`}
            onClick={toggleVoice}
          >
            {voiceOn ? "🗣️ Voice on" : "🔇 Voice off"}
          </button>
        )}
        {canSpeak && !voiceOn && (
          <button type="button" className="tm-link-button" onClick={readAloud} aria-label="Read these words aloud once">
            🔊 Read aloud
          </button>
        )}
        <button type="button" className="tm-link-button" onClick={restart}>
          ↺ Start this scene again
        </button>
        <button type="button" className="tm-link-button" onClick={() => setPanelOpen(true)}>
          📋 For the facilitator
        </button>
      </div>

      {scene.dataNote && <p className="tm-data-note">{scene.dataNote}</p>}

      <FacilitatorPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        sceneTitle={`Scene ${scene.number}: ${scene.title}`}
        notes={scene.facilitatorNotes}
        dataNote={scene.dataNote}
        links={scene.links}
      />
    </section>
  );
}
