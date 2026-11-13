// ============================================================
// EPISODE DATA (the "parts" of the course)
// ------------------------------------------------------------
// Everything about each part lives in this ONE array.
// The home-screen cards AND the part pages are both built
// from it, so to add or change a part you only edit here.
//
// Planned parts (KISS: one idea per slide, one exercise each):
//   1 Climate change            (built: episode0/content.ts)
//   2 Adaptation & resilience   (built: part2/content.ts)
//   3 Modelling (basic maths)   (built: part3/content.ts)
//   4 Decisions                 (built: part4/content.ts)
//
//   slug      -> the part after "#" in the URL (e.g. #part-1)
//   color     -> background colour of the number circle
//   textColor -> colour of the number inside the circle
//   icon      -> which small drawing to show (see components/EpisodeIcon.tsx)
//   content   -> the playable scenes. Parts without content
//                show a "coming soon" placeholder.
// ============================================================

import type { Episode } from "./types";
import { EPISODE_0 } from "./episode0/content";
import { PART_2 } from "./part2/content";
import { PART_3 } from "./part3/content";
import { PART_4 } from "./part4/content";

export const EPISODES: Episode[] = [
  {
    number: 1,
    slug: "part-1",
    title: "Climate change",
    description: "What climate change is, how it affects us, and what the world is doing about it.",
    tags: ["What it is", "How it affects us", "Climate policy"],
    time: "about 15 minutes",
    icon: "globe",
    color: "#2F6FD0",
    textColor: "#FFFFFF",
    scenes: EPISODE_0.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: EPISODE_0,
  },
  {
    number: 2,
    slug: "part-2",
    title: "Adaptation & resilience",
    description: "Why some people suffer more, how we adapt, and how we bounce back.",
    tags: ["Risk", "Adaptation", "Resilience"],
    time: "about 15 minutes",
    icon: "shield",
    color: "var(--tm-leaf)",
    textColor: "#FFFFFF",
    scenes: PART_2.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: PART_2,
  },
  {
    number: 3,
    slug: "part-3",
    title: "Modelling",
    description: "How data, graphs and simple maths help us predict what's coming.",
    tags: ["Data & averages", "y = mx + c", "Thresholds"],
    time: "about 15 minutes",
    icon: "gauge",
    color: "var(--tm-lake)",
    textColor: "#FFFFFF",
    scenes: PART_3.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: PART_3,
  },
  {
    number: 4,
    slug: "part-4",
    title: "Decisions",
    description: "Risk maps, decision trees, random forests and clustering: how AI and people decide who to help first.",
    tags: ["Risk maps", "Decision trees", "Random forest", "Clustering"],
    time: "about 20 minutes",
    icon: "tree",
    color: "var(--tm-soil)",
    textColor: "#FFFFFF",
    scenes: PART_4.scenes.map(({ number, title, idea }) => ({ number, title, idea })),
    content: PART_4,
  },
];
