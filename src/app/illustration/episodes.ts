// ============================================================
// EPISODE DATA
// ------------------------------------------------------------
// Everything about each episode lives in this ONE array.
// The home-screen cards AND the episode pages are both built
// from it, so to add or change an episode you only edit here.
//
//   slug      -> the part after "#" in the URL (e.g. #episode-2)
//   color     -> background colour of the number circle
//   textColor -> colour of the number inside the circle
//   icon      -> which small drawing to show (see components/EpisodeIcon.tsx)
//   content   -> the playable scenes. Episodes without content
//                show a "coming soon" placeholder.
// ============================================================

import type { Episode } from "./types";
import { EPISODE_0 } from "./episode0/content";
import { EPISODE_1 } from "./episode1/content";
import { EPISODE_2 } from "./episode2/content";
import { EPISODE_3 } from "./episode3/content";

export const EPISODES: Episode[] = [
  {
    number: 0,
    slug: "episode-0",
    title: "The big picture",
    description:
      "What is climate change? What did the world promise in Paris? What is AI, and why use it for the climate?",
    tags: ["Climate change", "Paris Agreement", "AI & machine learning", "Supervised & unsupervised"],
    time: "about 20 minutes",
    icon: "globe",
    color: "#2F6FD0",
    textColor: "#FFFFFF",
    scenes: EPISODE_0.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: EPISODE_0,
  },
  {
    number: 1,
    slug: "episode-1",
    title: "Learning from examples",
    description:
      "Tumaini learns to predict rain from Mama Akinyi's weather notebook.",
    tags: ["Learning from examples", "Patterns over time"],
    time: "about 20 minutes",
    icon: "notebook",
    color: "var(--tm-lake)",
    textColor: "#FFFFFF",
    scenes: EPISODE_1.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: EPISODE_1,
  },
  {
    number: 2,
    slug: "episode-2",
    title: "Predicts and sorts",
    description:
      "The river is rising! Tumaini learns to warn the village in time.",
    tags: ["Linear regression", "Classification"],
    time: "about 25 minutes",
    icon: "gauge",
    color: "var(--tm-leaf)",
    textColor: "#FFFFFF",
    scenes: EPISODE_2.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: EPISODE_2,
  },
  {
    number: 3,
    slug: "episode-3",
    title: "Decides and groups",
    description: "Should Mama plant today? Which villages need help first?",
    tags: ["Decision trees", "Clustering"],
    time: "about 25 minutes",
    icon: "tree",
    color: "var(--tm-soil)",
    textColor: "#FFFFFF",
    scenes: [
      { number: 5, title: "Should I Plant Today?", idea: "Decision trees" },
      { number: 6, title: "Neighbours in Trouble", idea: "Clustering" },
    ],
    content: EPISODE_3,
  },
  {
    number: 4,
    slug: "episode-4",
    title: "Sees, thinks and talks",
    description: "Satellites, robot brains and a phone that speaks Kiswahili.",
    tags: ["Image recognition", "Neural networks", "Language AI"],
    time: "about 30 minutes",
    icon: "satellite",
    color: "var(--tm-maize)",
    textColor: "var(--tm-text)",
    scenes: [
      { number: 7, title: "Eyes in the Sky", idea: "Image recognition" },
      { number: 8, title: "Inside Tumaini's Head", idea: "Neural networks" },
      { number: 9, title: "Nipande Lini?", idea: "Language AI" },
    ],
  },
  {
    number: 5,
    slug: "episode-5",
    title: "Using AI wisely",
    description: "When can we trust AI, and who makes the final decision?",
    tags: ["Overfitting", "Uncertainty", "Data quality", "Responsible AI"],
    time: "about 30 minutes",
    icon: "shield",
    color: "var(--tm-text)",
    textColor: "#FFFFFF",
    scenes: [
      { number: 10, title: "Exam Day", idea: "Overfitting" },
      { number: 11, title: "Five Forecasts", idea: "Uncertainty" },
      { number: 12, title: "The Foggy Map", idea: "Data quality" },
      { number: 13, title: "The Broken Bridge", idea: "Responsible AI" },
    ],
  },
];
