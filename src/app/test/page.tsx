"use client";

// ============================================================
// TUMAINI'S CLIMATE AI ADVENTURES  -  page at /test
// ------------------------------------------------------------
// Folders and files:
//   page.tsx        -> this file: home screen, episode pages, navigation
//   episodes.ts     -> the episode list (edit episodes here)
//   types.ts        -> the "shape" of our data
//   progress.ts     -> remembers finished episodes
//   characters/     -> Tumaini, Mama Akinyi, Otieno
//   components/     -> speech bubble, icons, backgrounds, maize, confetti
//   engine/         -> the scene engine that plays any episode
//   episode1/       -> Episode 1's words, data and activities
//   tumaini.css     -> home screen styles and Tumaini's animations
//   engine.css      -> scene, controls, lesson board, quiz styles
//   episode1.css    -> Episode 1 activity styles
//   motion.css      -> walking, talking, moving scenery, auto-play bar
//   episode0.css    -> Episode 0: greenhouse blanket, card-sort game
//   episode2.css    -> Episode 2: river, phone alert, leaves
//   episode3.css    -> Episode 3: season cards, decision tree, village map
// ============================================================

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import "./tumaini.css";
import "./engine.css";
import "./episode1.css";
import "./motion.css";
import "./episode2.css";
import "./episode0.css";
import "./episode3.css";
import type { Episode } from "./types";
import { EPISODES } from "./episodes";
import { getCompletedEpisodes } from "./progress";
import Tumaini from "./characters/Tumaini";
import SpeechBubble from "./components/SpeechBubble";
import EpisodeIcon from "./components/EpisodeIcon";
import EpisodePlayer from "./engine/EpisodePlayer";

const WELCOME_TEXT =
  "Hi! I'm Tumaini. My name means 'hope'. I'm a robot that learns from examples. Pick an episode and help me learn about the weather!";

// ============================================================
// NAVIGATION HELPERS
// The URL hash (the part after "#") decides what we show:
//   #home or nothing -> home screen
//   #episode-2       -> episode 2
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

// The sky, sun and clouds behind the home screen
function SkyDecorations() {
  return (
    <div className="tm-sky" aria-hidden="true">
      <svg className="tm-sun" viewBox="0 0 100 100">
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            x1="50" y1="6" x2="50" y2="18"
            stroke="#F2B544" strokeWidth="6" strokeLinecap="round"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="24" fill="#F2B544" stroke="#E09A1F" strokeWidth="3" />
      </svg>
      <Cloud className="tm-cloud tm-cloud-1" />
      <Cloud className="tm-cloud tm-cloud-2" />
      <Cloud className="tm-cloud tm-cloud-3" />
    </div>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 60">
      <path
        d="M20 50 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// Green hills and a strip of Lake Victoria along the bottom
function HillsAndLake() {
  return (
    <svg className="tm-hills" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 70 C200 20 380 30 560 70 C760 110 950 30 1200 60 L1200 140 L0 140 Z" fill="#6FAE5F" />
      <path d="M0 95 C250 60 450 80 650 95 C850 110 1000 75 1200 90 L1200 140 L0 140 Z" fill="#4C8E44" />
      <path d="M0 118 C300 108 900 108 1200 118 L1200 140 L0 140 Z" fill="#1B6E8E" />
      <path d="M120 126 h60 M420 124 h80 M760 127 h50 M1000 124 h70" stroke="#DDF0F7" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================

function HomeScreen({ headingRef, completed }: { headingRef: RefObject<HTMLHeadingElement | null>; completed: number[] }) {
  return (
    <main className="tm-view" aria-labelledby="tm-home-title">
      <section className="tm-hero">
        <SkyDecorations />

        <div className="tm-hero-text">
          <h1 id="tm-home-title" ref={headingRef} tabIndex={-1}>
            Tumaini&apos;s Climate AI Adventures
          </h1>
          <p className="tm-subtitle">
            Learn how computers help us prepare for floods, droughts and changing seasons.
          </p>
        </div>

        <div className="tm-stage">
          <Tumaini mood="happy" waving size={230} />
          <SpeechBubble text={WELCOME_TEXT} tail="left" />
        </div>

        <HillsAndLake />
      </section>

      <section className="tm-menu" aria-labelledby="tm-menu-title">
        <h2 id="tm-menu-title">Choose an episode</h2>

        <div className="tm-card-grid">
          {EPISODES.map((episode) => (
            <EpisodeCard key={episode.slug} episode={episode} done={completed.includes(episode.number)} />
          ))}
        </div>
      </section>
    </main>
  );
}

function EpisodeCard({ episode, done }: { episode: Episode; done: boolean }) {
  // Cards are links to "#episode-N". Links already open with Enter;
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
      className={`tm-card ${done ? "is-done" : ""}`}
      onKeyDown={onKeyDown}
      aria-label={`Episode ${episode.number}: ${episode.title}. ${episode.description} ${episode.time}.${done ? " Completed." : ""}`}
    >
      {done && (
        <span className="tm-done-badge" aria-hidden="true">
          ✔ Completed
        </span>
      )}
      <div className="tm-card-top">
        <NumberCircle episode={episode} />
        <EpisodeIcon name={episode.icon} />
      </div>
      <h3 className="tm-card-title">{episode.title}</h3>
      <p className="tm-card-desc">{episode.description}</p>
      <Tags tags={episode.tags} />
      <p className="tm-time">
        <span aria-hidden="true">⏱ </span>
        {episode.time}
      </p>
      <span className="tm-card-cta" aria-hidden="true">
        {done ? "Watch again ▶" : episode.content ? "Start ▶" : "Peek inside ▶"}
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
        ← Back to all episodes
      </a>

      <header className="tm-episode-header">
        <NumberCircle episode={episode} big />
        <div>
          <p className="tm-episode-label">Episode {episode.number}</p>
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

      <h2 className="tm-scenes-title">Scenes in this episode</h2>
      <ol className="tm-scenes">
        {episode.scenes.map((scene) => (
          <li key={scene.number} className="tm-scene-item">
            <span className="tm-scene-number">Scene {scene.number}</span>
            <span className="tm-scene-title">{scene.title}</span>
            <span className="tm-scene-idea">{scene.idea}</span>
            <span className="tm-soon">Coming soon</span>
          </li>
        ))}
      </ol>

      <div className="tm-stage tm-stage-small">
        <Tumaini mood="thinking" size={150} />
        <SpeechBubble text="I'm still learning this episode. Come back soon!" tail="left" />
      </div>

      <a href="#home" className="tm-button">
        ← Back to all episodes
      </a>
    </main>
  );
}

// A playable episode: a heading for screen readers, then the player.
function PlayableEpisode({ episode, headingRef }: { episode: Episode; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <main className="tm-view tm-play" aria-labelledby="tm-play-title">
      <h1 id="tm-play-title" ref={headingRef} tabIndex={-1} className="tm-play-title">
        Episode {episode.number}: {episode.title}
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
        <a href="#home" className="tm-button tm-button-small">
          <span aria-hidden="true">🏠</span> Home
        </a>
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
