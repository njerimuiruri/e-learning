"use client";

// ============================================================
// CLIMATE & AI BASICS WITH TUMAINI  -  page at /illustration
// ------------------------------------------------------------
// Folders and files:
//   page.tsx        -> this file: home screen, part pages, navigation
//   episodes.ts     -> the list of parts (edit parts here)
//   types.ts        -> the "shape" of our data
//   progress.ts     -> remembers finished parts
//   characters/     -> Tumaini, Mama Akinyi, Otieno
//   components/     -> speech bubble, icons, backgrounds, maize, confetti
//   engine/         -> the scene engine that plays any part
//   episode0/       -> Module 1 (Climate change); part2/ to part4/ -> Modules 2 to 4
//   tumaini.css     -> home screen styles and Tumaini's animations
//   engine.css      -> scene, controls, lesson board, quiz styles
//   episode1.css    -> shared sliders and small animations
//   motion.css      -> walking, talking, moving scenery, auto-play bar
//   slides.css      -> the calm KISS slides (title, one visual, one line)
//   part4.css       -> Module 4 tasks: risk map, decision tree, forest vote, grouping
//   fit.css         -> one screen, no scrolling: home and lesson layout
//   episode0.css    -> Module 1: greenhouse blanket, card-sort game
//   episode2.css    -> shared river, phone and goat styles (used by backgrounds)
//   episode3.css    -> old Episode 3 styles (kept for now; safe to trim later)
// ============================================================

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import "./tumaini.css";
import "./engine.css";
import "./episode1.css";
import "./motion.css";
import "./episode2.css";
import "./episode0.css";
import "./episode3.css";
import "./slides.css";
import "./part4.css";
import "./fit.css";
import type { Episode } from "./types";
import { EPISODES } from "./episodes";
import { getCompletedEpisodes } from "./progress";
import Tumaini from "./characters/Tumaini";
import SpeechBubble from "./components/SpeechBubble";
import EpisodeIcon from "./components/EpisodeIcon";
import EpisodePlayer from "./engine/EpisodePlayer";

const WELCOME_TEXT =
  "Hi, I'm Tumaini! My name means 'hope'. I'll be your guide.";

// ============================================================
// NAVIGATION HELPERS
// The URL hash (the part after "#") decides what we show:
//   #home or nothing -> home screen
//   #part-1          -> part 1
// Because the browser remembers hashes in its history, the
// Back and Forward buttons work for free.
// ============================================================

function viewFromHash() {
  const hash = window.location.hash.replace("#", "");
  const episode = EPISODES.find((e) => e.slug === hash);
  return episode ? episode.slug : "home";
}

function toggleFullscreen() {
  // Fail quietly if the browser doesn't allow full screen.
  try {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.()?.catch(() => {});
    }
  } catch {
    // Not supported - do nothing.
  }
}

// ============================================================
// SMALL SHARED PIECES
// ============================================================

function NumberCircle({ episode, big = false }: { episode: Episode; big?: boolean }) {
  return (
    <span
      className={`tm-number ${big ? "tm-number-big" : ""}`}
      style={{ background: episode.color, color: episode.textColor }}
      aria-hidden="true"
    >
      {episode.number}
    </span>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="tm-tags" aria-label="Ideas you will learn">
      {tags.map((tag) => (
        <li key={tag} className="tm-tag">
          {tag}
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// HOME SCREEN: clean, on ONE screen, no scrolling
//   left:  course name, one line, Start/Continue button, progress
//   right: Tumaini, the guide
//   below: the 4 modules as clean cards (no icons, no tags)
// ============================================================

/** Total minutes, read from "about 15 minutes" on each module. */
const TOTAL_MINUTES = EPISODES.reduce((sum, e) => sum + (parseInt(e.time.replace(/\D+/g, " ").trim(), 10) || 0), 0);

function HomeScreen({ headingRef, completed }: { headingRef: RefObject<HTMLHeadingElement | null>; completed: number[] }) {
  const doneCount = EPISODES.filter((e) => completed.includes(e.number)).length;
  const next = EPISODES.find((e) => !completed.includes(e.number));
  const startLabel = !next ? "Watch again from Module 1" : doneCount === 0 ? "Start Module 1" : `Continue: Module ${next.number}`;
  const startHref = `#${(next ?? EPISODES[0]).slug}`;

  return (
    <main className="tm-view tm-home" aria-labelledby="tm-home-title">
      <section className="tm-h-hero">
        <div className="tm-h-intro">
          <p className="tm-h-eyebrow">
            {EPISODES.length} modules · about {TOTAL_MINUTES} minutes
          </p>
          <h1 id="tm-home-title" ref={headingRef} tabIndex={-1}>
            Climate &amp; AI Basics
          </h1>
          <p className="tm-h-lead">From climate change to smart, data-driven decisions, explained simply.</p>

          <div className="tm-h-actions">
            <a href={startHref} className="tm-h-start">
              {startLabel} <span aria-hidden="true">→</span>
            </a>
            <div className="tm-h-progress">
              <div className="tm-h-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={EPISODES.length} aria-valuenow={doneCount} aria-label="Modules completed">
                <span style={{ width: `${(doneCount / EPISODES.length) * 100}%` }} />
              </div>
              <span>
                {doneCount} of {EPISODES.length} completed
              </span>
            </div>
          </div>
        </div>

        <div className="tm-h-guide">
          <p className="tm-h-bubble">{WELCOME_TEXT}</p>
          <Tumaini mood="happy" waving size={170} />
        </div>
      </section>

      <section aria-labelledby="tm-menu-title">
        <h2 id="tm-menu-title" className="tm-sr-only">
          Modules
        </h2>
        <ol className="tm-h-grid">
          {EPISODES.map((episode) => (
            <li key={episode.slug}>
              <ModuleCard episode={episode} done={completed.includes(episode.number)} isNext={next?.number === episode.number && doneCount > 0} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function ModuleCard({ episode, done, isNext }: { episode: Episode; done: boolean; isNext: boolean }) {
  // Cards are links to "#part-N". Links already open with Enter;
  // here we also let the Space bar open them.
  const onKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === " ") {
      event.preventDefault();
      window.location.hash = episode.slug;
    }
  };

  return (
    <a
      href={`#${episode.slug}`}
      className={`tm-h-card ${done ? "is-done" : ""} ${isNext ? "is-next" : ""}`}
      style={{ "--accent": episode.color } as CSSProperties}
      onKeyDown={onKeyDown}
      aria-label={`Module ${episode.number}: ${episode.title}. ${episode.description} ${episode.time}.${done ? " Completed." : ""}`}
    >
      <span className="tm-h-card-top">
        <span className="tm-h-num" aria-hidden="true">
          {String(episode.number).padStart(2, "0")}
        </span>
        {done && <span className="tm-h-status is-done">✓ Completed</span>}
        {isNext && <span className="tm-h-status is-next">Up next</span>}
      </span>
      <span className="tm-h-card-title">{episode.title}</span>
      <span className="tm-h-card-desc">{episode.description}</span>
      <span className="tm-h-card-foot">
        <span className="tm-h-time">{episode.time.replace("about ", "")}</span>
        <span className="tm-h-go" aria-hidden="true">
          {done ? "Watch again" : "Start"} <span className="tm-h-arrow">→</span>
        </span>
      </span>
    </a>
  );
}

// ============================================================
// EPISODE PAGE (placeholder for episodes not built yet)
// ============================================================

function PlaceholderEpisode({ episode, headingRef }: { episode: Episode; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <main className="tm-view tm-episode" aria-labelledby="tm-episode-title">
      <a href="#home" className="tm-button tm-button-secondary">
        ← Back to all modules
      </a>

      <header className="tm-episode-header">
        <NumberCircle episode={episode} big />
        <div>
          <p className="tm-episode-label">Module {episode.number}</p>
          <h1 id="tm-episode-title" ref={headingRef} tabIndex={-1}>
            {episode.title}
          </h1>
        </div>
        <div className="tm-episode-icon">
          <EpisodeIcon name={episode.icon} size={80} />
        </div>
      </header>

      <p className="tm-episode-desc">{episode.description}</p>
      <Tags tags={episode.tags} />
      <p className="tm-time">
        <span aria-hidden="true">⏱ </span>
        {episode.time}
      </p>

      {/* While an episode is being built: its test panel */}
      {episode.sneakPeek && <episode.sneakPeek />}

      <h2 className="tm-scenes-title">Lessons in this module</h2>
      <ol className="tm-scenes">
        {episode.scenes.map((scene) => (
          <li key={scene.number} className="tm-scene-item">
            <span className="tm-scene-number">Lesson {scene.number}</span>
            <span className="tm-scene-title">{scene.title}</span>
            <span className="tm-scene-idea">{scene.idea}</span>
            <span className="tm-soon">Coming soon</span>
          </li>
        ))}
      </ol>

      <div className="tm-stage tm-stage-small">
        <Tumaini mood="thinking" size={150} />
        <SpeechBubble text="I'm still learning this module. Come back soon!" tail="left" />
      </div>

      <a href="#home" className="tm-button">
        ← Back to all modules
      </a>
    </main>
  );
}

// A playable episode: a heading for screen readers, then the player.
function PlayableEpisode({ episode, headingRef }: { episode: Episode; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <main className="tm-view tm-play" aria-labelledby="tm-play-title">
      <h1 id="tm-play-title" ref={headingRef} tabIndex={-1} className="tm-play-title">
        Module {episode.number}: {episode.title}
      </h1>
      <EpisodePlayer episode={episode} />
    </main>
  );
}

// ============================================================
// THE PAGE: decides which view to show
// ============================================================

export default function TumainiPage() {
  const [view, setView] = useState<string | null>(null); // null = not ready yet
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const firstRender = useRef(true);

  // Read the hash when the page opens, and every time it changes.
  useEffect(() => {
    const update = () => {
      setView(viewFromHash());
      setCompleted(getCompletedEpisodes()); // refresh the ✔ marks
      window.scrollTo(0, 0);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  // Keep the Full screen button's label correct.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // After switching views, move keyboard focus to the new heading
  // so keyboard and screen-reader users know where they are.
  useEffect(() => {
    if (!view) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [view]);

  const episode = EPISODES.find((e) => e.slug === view);

  return (
    <div className="tm-app">
      {/* Fixed buttons for the presenter */}
      <nav className="tm-topbar" aria-label="Presenter controls">
        {/* No Home button on the home screen itself */}
        {view === "home" ? (
          <span />
        ) : (
          <a href="#home" className="tm-button tm-button-small">
            <span aria-hidden="true">🏠</span> Home
          </a>
        )}
        <button type="button" className="tm-button tm-button-small" onClick={toggleFullscreen}>
          <span aria-hidden="true">⛶</span> {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </nav>

      {/* The "key" makes React replace the view, so the fade-in plays each time */}
      {view === "home" && <HomeScreen key="home" headingRef={headingRef} completed={completed} />}
      {episode &&
        (episode.content ? (
          <PlayableEpisode key={episode.slug} episode={episode} headingRef={headingRef} />
        ) : (
          <PlaceholderEpisode key={episode.slug} episode={episode} headingRef={headingRef} />
        ))}
    </div>
  );
}
