// ============================================================
// EPISODE 2 CONTENT: "Predicts and sorts"
// ------------------------------------------------------------
// All the words, questions and numbers for Episode 2 live here,
// in the same shape as episode1/content.ts. The scene engine
// (../engine) reads this and plays it.
//
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { Point } from "./regressionMath";
import type { LeafData } from "./leafMath";

const MAIN_MESSAGE =
  "I learn patterns from past data, so I can warn people early, and they can act early!";

export const DATA_NOTE = "All storm and leaf numbers in this episode are made-up examples for teaching.";

// ------------------------------------------------------------
// DATA: Baba Ochieng's 10 storms (made-up teaching data)
// hours of heavy rain → how high the river rose (metres)
// ------------------------------------------------------------
export const STORMS: Point[] = [
  { x: 1, y: 1.1 },
  { x: 2, y: 1.7 },
  { x: 3, y: 1.9 },
  { x: 4, y: 2.5 },
  { x: 5, y: 2.6 },
  { x: 6, y: 3.3 },
  { x: 7, y: 3.4 },
  { x: 8, y: 4.0 },
  { x: 9, y: 4.2 },
  { x: 10, y: 4.7 },
];

// The order Tumaini learns them in (hours). This order makes the
// line wobble at first, then settle down as more storms arrive.
export const STORM_ORDER = [3, 4, 10, 1, 7, 5, 8, 2, 6, 9];

/** The storms in learning order. */
export const STORMS_IN_ORDER: Point[] = STORM_ORDER.map((h) => STORMS.find((s) => s.x === h)!);

// ------------------------------------------------------------
// DATA: maize leaves (made-up teaching data)
// [spots 0–8, yellowness 0–1, truly sick? 1 = yes]
// ------------------------------------------------------------
const toLeaves = (rows: [number, number, number][]): LeafData[] =>
  rows.map(([spots, yellowness, sick]) => ({ spots, yellowness, sick: sick === 1 }));

/** The 6 leaves the audience sorts, to teach Tumaini. */
export const TRAINING_LEAVES = toLeaves([
  [0, 0.1, 0], [6, 0.7, 1], [1, 0.25, 0], [4, 0.55, 1], [0, 0.35, 0], [7, 0.4, 1],
]);

/** The 8 new leaves Tumaini sorts by itself. [3, 0.45] sits right by the line, and Tumaini gets it wrong. */
export const TEST_LEAVES = toLeaves([
  [1, 0.15, 0], [5, 0.65, 1], [2, 0.3, 0], [8, 0.8, 1], [3, 0.45, 1], [0, 0.2, 0], [3, 0.35, 0], [6, 0.5, 1],
]);

// ------------------------------------------------------------
// THE STORY: The River and the Sick Leaf
// One story in two chapters, with one lesson board at the end:
//   📈 Predict a number  (the river)      -> linear regression
//   🍃 Sort into groups  (the farm, after) -> classification
// ------------------------------------------------------------
const story: PlayableScene = {
  id: "river-and-leaf",
  number: 3,
  title: "The River and the Sick Leaf",
  idea: "Linear regression and classification",
  setting: "river",
  cast: ["baba", "mama", "otieno", "tumaini"],
  // Baba stays by the river; at the farm it is just the family and Tumaini.
  castBySetting: { farm: ["mama", "otieno", "tumaini"] },
  lateArrivals: ["tumaini", "baba"],
  walkIn: ["mama", "otieno"],
  chapters: {
    1: { icon: "❓", label: "The problem" },
    2: { icon: "📈", label: "Predict a number" },
    3: { icon: "🍃", label: "Sort into groups" },
    4: { icon: "📝", label: "What we learned" },
  },
  facilitatorNotes: [
    "This episode is one story in two chapters. Chapter 1 predicts a NUMBER (how high the river will rise): linear regression. Chapter 2 sorts things into GROUPS (healthy or sick leaves): classification. Both learn from past examples.",
    "Linear regression finds the straight line that makes the mistakes (the dashed lines) as small as possible. The computer method is called \"least squares\": it squares each mistake and makes the total as small as possible. That is why Tumaini always wins \"Beat the computer\" (its score is about 0.13).",
    "m ≈ 0.39 means the river rises about 39 cm for each extra hour of heavy rain. c ≈ 0.81 means the river sits around 0.8 m before heavy rain. 6 hours of rain gives about 3.1 m (safe); about 9.5 hours or more passes the 4.5 m danger line.",
    "Ask: \"With only 2 storms, would you trust the warning?\" (No: the line wobbles. More examples = a steadier line.) \"What could make the prediction wrong?\" (Rain upstream, a blocked river, missing records.)",
    "The link between the chapters is real: floods and warm, wet weather help many crop diseases spread.",
    "Classification: each leaf is described by two numbers (spots and yellowness), and Tumaini draws a dividing line. Leaves far from the line get high confidence (90%+); leaves near it get about 50–60%. Tumaini pauses after its one mistake: ask \"Why did it get this one wrong?\" (It was close to the line.) and \"What should a farmer do then?\" (Ask an expert.)",
    "Real flood forecasting uses rainfall, river gauges, soil moisture and more; real crop-disease apps learn from thousands of photos. The numbers here are made up for teaching.",
  ],
  dataNote: DATA_NOTE,
  // KISS: one idea per slide. Title = the idea, text = the short answer.
  beats: [
    // ❓ The problem
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "flooded-house",
      title: "The river floods",
      text: "Last year the river came into the house at night. We lost two goats.",
    },
    {
      type: "say", who: "tumaini", mood: "confused", enters: true,
      text: "If we knew early, we could move in time. Let me learn!",
    },
    {
      type: "say", who: "baba", mood: "calm", enters: true, picture: "storm-notebook", action: "show-notebook",
      text: "Ten years of storms: hours of rain, and how high the river rose.",
    },

    // 📈 Chapter 1: Predict a number
    {
      part: 2, type: "predict", who: "tumaini",
      question: "More hours of rain means the river goes…",
      options: [
        { text: "Higher", emoji: "📈" },
        { text: "Lower", emoji: "📉" },
        { text: "No change", emoji: "➖" },
      ],
      reply: "Let's check Baba's storms!",
    },
    {
      type: "interactive", activity: "storm-graph", prompt: "Give Tumaini a storm.",
      help: "Press the yellow button. Watch the line settle.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "y-mx-c",
      title: "The pattern",
      text: "Each extra hour of rain lifts the river about 39 cm.",
    },
    {
      type: "say", who: "tumaini", mood: "excited",
      title: "Linear regression",
      text: "Draw the best line through past examples. Use it to predict a NUMBER.",
    },
    {
      type: "interactive", activity: "beat-the-computer", prompt: "Can YOU draw a better line?",
      help: "Drag the orange handles. Smaller mistake score = better.",
    },
    {
      type: "announce", source: "radio",
      text: "Heavy rain expected tomorrow.",
    },
    {
      type: "interactive", activity: "river-forecast", prompt: "How many hours of rain tomorrow?",
      help: "Move the slider. Watch the red DANGER line.",
    },
    {
      type: "say", who: "mama", mood: "proud", picture: "safe-uphill",
      title: "Warned in time",
      text: "We moved the goats before the water came.",
    },

    // 🍃 Chapter 2: Sort into groups (a few weeks later, at the farm)
    {
      part: 3, setting: "farm", walkIn: ["mama", "otieno", "tumaini"],
      type: "say", who: "mama", mood: "worried", picture: "spreading-disease",
      title: "Sick leaves",
      text: "Yellow spots on my maize. A disease can spread to the whole field.",
    },
    {
      type: "say", who: "tumaini", mood: "thinking", picture: "photo-check",
      text: "New job: put each leaf in a group. Healthy or sick?",
    },
    {
      type: "interactive", activity: "leaf-sorter", prompt: "You sort. Tumaini learns!",
      help: "Healthy or sick? Look at the spots and colour.",
    },
    {
      type: "interactive", activity: "ai-learns", prompt: "Let Tumaini learn.",
      help: "Press the button.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      title: "Classification",
      text: "Sort things into GROUPS, after learning from labelled examples.",
    },
    {
      type: "predict", who: "mama",
      question: "Tumaini sorts 8 new leaves. How many right?",
      options: [
        { text: "All 8", emoji: "💯" },
        { text: "Most", emoji: "👍" },
        { text: "A few", emoji: "🤏" },
      ],
      reply: "Let's count!",
    },
    {
      type: "interactive", activity: "ai-sorter", prompt: "Tumaini sorts the rest.",
      help: "Press Start.",
    },
    {
      type: "say", who: "mama", mood: "proud", picture: "ask-expert",
      title: "Not sure? Ask",
      text: "7 of 8 is good. When Tumaini isn't sure, ask the extension officer.",
    },

    // 📝 What we learned
    {
      part: 4, type: "lesson",
      title: "Today we learned",
      rows: [
        { label: "Regression", text: "Predicts a NUMBER: how much?" },
        { label: "Classification", text: "Sorts into GROUPS: which one?" },
        { label: "Both", text: "Learn from examples with answers (supervised)." },
      ],
      tumainiSays: "Both learn from past examples!",
    },
  ],
};

// ------------------------------------------------------------
// The whole episode
// ------------------------------------------------------------
export const EPISODE_2: EpisodeContent = {
  scenes: [story],
  quiz: [
    {
      question: "In y = mx + c, what does m tell us about the river?",
      options: [
        { text: "How much the river rises for each extra hour of rain", correct: true },
        { text: "The name of the river" },
        { text: "How many goats Mama has" },
      ],
      praise: "Yes! m is how much the river rises for each extra hour.",
      hint: "Think about the slope of my line. Try again!",
    },
    {
      question: "What does the 'best' line do?",
      options: [
        { text: "Touches every dot" },
        { text: "Makes the smallest total mistake", correct: true },
        { text: "Goes straight up" },
      ],
      praise: "Right! The best line has the smallest total mistake.",
      hint: "Remember the mistake meter when you tried to beat me? Try again!",
    },
    {
      question: "What is classification?",
      options: [
        { text: "Sorting things into groups, like healthy or sick", correct: true },
        { text: "Drawing pictures" },
        { text: "Making it rain" },
      ],
      praise: "Correct! Classification means sorting into groups.",
      hint: "Remember the leaves on the conveyor belt? Try again!",
    },
  ],
  summary: {
    points: [
      "Linear regression: the best line predicts a number",
      "More examples = a steadier line",
      "Classification: AI sorts things into groups",
      "AI tells us how sure it is, and can be wrong on hard cases",
    ],
    message: MAIN_MESSAGE,
  },
  teaser: {
    text: "Next time, Mama asks me: 'Should I plant today?' And we find out which villages need help first!",
    picture: "planting-day",
    mood: "thinking",
  },
  recap: {
    text: "Last time: I found the two rainy seasons. Today: I predict and sort!",
  },
};
