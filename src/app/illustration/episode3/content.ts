// ============================================================
// EPISODE 3 CONTENT: "Decides and groups"
// ------------------------------------------------------------
// All the words, questions and numbers for Episode 3 live here,
// in the same shape as episode1/content.ts and episode2/content.ts.
//
// BUILD STATUS (remove this note when Episode 3 is finished):
//   ✔ step (a): data, SeasonCard, DecisionTree, VillageMap
//   ✔ step (b): Scene 5 part 1 (first question, grow the tree)
//   … step (c): Scene 5 part 2 (follow the tree, lesson, question)
//   … step (d): Scene 6 (clustering, help matching, lesson, question)
//   … step (e): recap card, quiz, summary, teaser
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { Season } from "./treeMath";
import type { Village } from "./clusterMath";
import Episode3Preview from "./Preview";

const MAIN_MESSAGE =
  "I learn patterns from past data, so I can warn people early, and they can act early!";

export const DATA_NOTE = "All season and village numbers in this episode are made-up examples for teaching.";

// ------------------------------------------------------------
// DATA: Mama's 16 past seasons (made-up teaching data)
// [rains started?, soil moist?, dry spell forecast?, good harvest?]  1 = yes
// ------------------------------------------------------------
const SEASON_ROWS: [number, number, number, number][] = [
  [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 1, 1, 0],
  [0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 1], [1, 1, 0, 1],
  [1, 1, 0, 1], [1, 1, 0, 1], [1, 0, 0, 0], [1, 0, 1, 0],
  [1, 1, 1, 0], [1, 1, 1, 0], [1, 0, 0, 1], [1, 1, 0, 1],
];

export const SEASONS: Season[] = SEASON_ROWS.map(([rains, moist, drySpell, good], i) => ({
  id: i + 1,
  rains: rains === 1,
  moist: moist === 1,
  drySpell: drySpell === 1,
  good: good === 1,
}));

// The advice at each end of the tree. The key is the path of answers
// that leads there (worked out by buildTree in treeMath.ts).
export type AdviceKind = "plant" | "wait" | "dry-spell";
export interface Advice {
  /** Short words for the tree's fruit box */
  title: string;
  /** The full advice, shown when following the tree */
  text: string;
  kind: AdviceKind;
}

export const ADVICE: Record<string, Advice> = {
  "rains:no": { title: "WAIT", text: "WAIT. Planting now risks your seed drying out.", kind: "wait" },
  "rains:yes>drySpell:yes": { title: "WAIT, or drought-tolerant seed", text: "WAIT, or plant a fast-growing, drought-tolerant variety.", kind: "dry-spell" },
  "rains:yes>drySpell:no>moist:yes": { title: "PLANT NOW! 🌱", text: "PLANT NOW! 🌱", kind: "plant" },
  "rains:yes>drySpell:no>moist:no": { title: "WAIT 2–3 days", text: "WAIT 2–3 days for more rain.", kind: "wait" },
};

/** The advice for an ending, with a safe fallback if the tree ever changes shape. */
export function adviceFor(path: string, plant: boolean): Advice {
  return ADVICE[path] ?? (plant ? ADVICE["rains:yes>drySpell:no>moist:yes"] : ADVICE["rains:no"]);
}

// ------------------------------------------------------------
// DATA: 24 villages (made-up teaching data)
// [floods in the last 10 years, dry spells in the last 10 years]
// The order is MIXED UP on purpose, so the groups are not obvious
// from the list. Tumaini has to find them.
// ------------------------------------------------------------
const VILLAGE_ROWS: [number, number][] = [
  [1, 2], [9, 3], [1, 9], [8, 2], [4, 2], [3, 8], [2, 6], [8, 1],
  [2, 2], [3, 2], [7, 2], [2, 8], [2, 9], [3, 3], [6, 2], [9, 1],
  [1, 7], [1, 1], [8, 3], [2, 7], [2, 3], [7, 1], [3, 9], [3, 1],
];

export const VILLAGES: Village[] = VILLAGE_ROWS.map(([x, y], i) => ({
  id: i + 1,
  name: `Village ${i + 1}`,
  x,
  y,
}));

/** Where the 3 group centres start in the normal demo (always finds the right groups). */
export const START_CENTRES = [
  { x: 5, y: 9 },
  { x: 9, y: 5 },
  { x: 5, y: 5 },
];

/** The colours of the three stars: blue, yellow, green. */
export const GROUP_COLOURS = ["#2F6FD0", "#F2B544", "#4C8E44"];

// ------------------------------------------------------------
// SCENE 5: Should I Plant Today?
// ------------------------------------------------------------
const scene5: PlayableScene = {
  id: "plant-today",
  number: 5,
  title: "Should I Plant Today?",
  idea: "Decision trees",
  setting: "farm",
  mamaHolds: "seeds",
  cast: ["mama", "otieno", "tumaini"],
  walkIn: ["mama", "otieno", "tumaini"],
  facilitatorNotes: [
    "A decision tree is built by repeatedly choosing the question that best separates the outcomes. Here, \"Have the rains started?\" sorts 12 of 16 seasons correctly, better than \"Is a dry spell forecast?\" (11) and \"Is the soil moist?\" (10).",
    "Tumaini then does the same on each branch. When the rains have started, \"Is a dry spell forecast?\" is the best next question (9 of 10), so it comes second, and \"Is the soil moist?\" comes third.",
    "Decision trees are popular because people can read them and see WHY a decision was made. That builds trust.",
    "Ask: \"What other question might help Mama decide?\" (For example: the seed type, how much rain fell last week, the radio forecast.)",
    "The seasons and questions are examples for teaching. Real planting advice comes from the Kenya Meteorological Department and agricultural extension officers.",
  ],
  dataNote: DATA_NOTE,
  beats: [
    // ① The problem
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "plant-timing",
      text: "Every season I ask myself the same thing: should I plant today, or wait? If I plant too early, my seeds dry out. If I plant too late, I miss the rain.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "curious",
      text: "Grandma, how do you decide?",
    },
    {
      type: "say", who: "mama", mood: "happy", picture: "three-questions",
      text: "I ask myself a few questions. Have the rains started? Is the soil wet enough? Will there be a long dry spell?",
    },
    // ② It's like…
    {
      part: 2, type: "say", who: "otieno", mood: "thinking", picture: "doctor-questions",
      text: "Like when I'm sick and the doctor asks: Do you have a fever? Is your throat sore? Each answer leads to the next question, until the doctor decides.",
    },
    {
      type: "say", who: "tumaini", mood: "excited", action: "jump",
      text: "Yes! A chain of yes-or-no questions that ends in a decision. Scientists call it a decision tree, because it branches like a tree!",
    },
    // ③ Tumaini learns
    {
      part: 3, type: "predict", who: "mama",
      question: "Here are my last 16 seasons. Which of my three questions do YOU think matters most?",
      options: [
        { text: "Have the rains started?", emoji: "🌧️" },
        { text: "Is the soil moist?", emoji: "💧" },
        { text: "Is a dry spell forecast?", emoji: "☀️" },
      ],
      reply: "Let's test all three with Mama's 16 seasons!",
    },
    {
      type: "interactive", activity: "first-question", prompt: "Which question should we ask FIRST?",
      help: "Press a question. The 16 seasons split into a Yes pile and a No pile. The cleaner the piles, the better the question!",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "The best first question is: Have the rains started? It separates good and bad seasons best. Now I keep going, asking the next best question on each branch.",
    },
    {
      type: "interactive", activity: "grow-tree", prompt: "Grow the tree.",
      help: "Press Grow. Each press adds the next question. Watch the seasons (the little dots) move into their branches.",
    },
    {
      optional: true, type: "say", who: "tumaini", mood: "excited", action: "jump",
      text: "My tree is ready! Three questions, and four pieces of advice.",
    },
    // Coming in step (c): follow the tree, then the lesson board.
  ],
};

// ------------------------------------------------------------
// The whole episode
// ------------------------------------------------------------
export const EPISODE_3: EpisodeContent = {
  scenes: [scene5],
  quiz: [
    {
      question: "What is a decision tree?",
      options: [
        { text: "A real tree that grows maize" },
        { text: "A chain of yes-or-no questions that leads to a decision", correct: true },
        { text: "A list of random guesses" },
      ],
      praise: "Yes! Yes-or-no questions that lead to a decision.",
      hint: "Remember Mama's planting tree? Try again!",
    },
    {
      question: "In clustering, who decides what the groups are?",
      options: [
        { text: "A teacher" },
        { text: "The AI finds them by itself", correct: true },
        { text: "The villages vote" },
      ],
      praise: "Right! Nobody told me the groups. I found them myself.",
      hint: "Remember the stars moving on the village map? Try again!",
    },
    {
      question: "Why is it helpful to group villages by risk?",
      options: [
        { text: "So each group gets the help it needs most", correct: true },
        { text: "So villages can compete" },
        { text: "It isn't helpful" },
      ],
      praise: "Correct! The right help goes to the right places.",
      hint: "Remember the water tanks and flood warnings? Try again!",
    },
  ],
  summary: {
    points: [
      "Decision trees: yes-or-no questions lead to a decision",
      "The best question goes first",
      "Clustering: AI finds groups by itself",
      "Groups help send the right help to the right places",
    ],
    message: MAIN_MESSAGE,
  },
  teaser: {
    text: "Next time, I fly into space and look down at the forests, and you'll see inside my robot brain!",
    picture: "planting-day", // TEMPORARY: the satellite picture is drawn in step (e)
    mood: "excited",
  },
  // TEMPORARY while Episode 3 is being built
  draft: true,
  draftExtra: Episode3Preview,
};
