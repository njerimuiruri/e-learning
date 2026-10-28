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
  beats: [
    // ❓ The problem
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "flooded-house",
      text: "Otieno, look at those clouds. Last year the river came into the house in the night. We lost two goats.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "curious",
      text: "If only we knew before the river rises. Then we could move in time.",
    },
    {
      type: "say", who: "tumaini", mood: "confused", enters: true,
      text: "Maybe I can help! But I don't know anything about rivers… yet.",
    },
    {
      type: "say", who: "baba", mood: "calm", enters: true, picture: "storm-notebook", action: "show-notebook",
      text: "I have written down every big storm for ten years: how many hours of heavy rain fell, and how high the river rose.",
    },

    // 📈 Chapter 1: Predict a number
    {
      part: 2, optional: true, type: "say", who: "otieno", mood: "thinking", picture: "bus-fare",
      text: "So Tumaini looks at old storms to guess the next one? That's like bus fare! If the fare goes up by about the same amount every year, I can guess next year's fare.",
    },
    {
      type: "predict", who: "tumaini",
      question: "What do YOU think? The more hours of heavy rain, the…",
      options: [
        { text: "Higher the river", emoji: "📈" },
        { text: "Lower the river", emoji: "📉" },
        { text: "No change", emoji: "➖" },
      ],
      reply: "Let's check with Baba's storms!",
    },
    {
      type: "interactive", activity: "storm-graph", prompt: "Give Tumaini a storm.",
      help: "Press the yellow button. Each storm becomes a dot on the graph. Watch Tumaini's line move, and settle down as it learns more storms.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "y-mx-c",
      text: "Here is the pattern: for every extra hour of heavy rain, the river rises about 39 centimetres. It's the y = mx + c from maths class: m is the rise for each hour (0.39 m), and c is where the river starts (0.81 m). Drawing the best line through past examples to predict a number is called linear regression.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "excited", action: "jump",
      text: "So the maths we learn in class is how a computer predicts floods!",
    },
    {
      type: "interactive", activity: "beat-the-computer", prompt: "Can YOU draw a better line than Tumaini?",
      help: "Drag the two orange handles. The dashed lines are your mistakes. The mistake meter adds them up: the smaller the score, the better your line.",
    },
    {
      type: "announce", source: "radio",
      text: "Weather forecast: heavy rain expected tomorrow.",
    },
    {
      optional: true, type: "say", who: "mama", mood: "worried",
      text: "Tumaini, how high will the river go?",
    },
    {
      type: "interactive", activity: "river-forecast", prompt: "How many hours of heavy rain tomorrow?",
      help: "Move the big slider. Tumaini goes up from the hours to its line, then across to read the river height. What happens at the red DANGER line?",
    },
    {
      type: "say", who: "mama", mood: "proud", picture: "safe-uphill",
      text: "This time, we are ready. The warning came early, so we moved the goats before the water came.",
    },
    {
      optional: true, type: "say", who: "baba", mood: "calm", action: "show-notebook", picture: "storm-notebook",
      text: "And my old notebook helped! Writing things down matters.",
    },

    // 🍃 Chapter 2: Sort into groups (a few weeks later, at the farm)
    {
      part: 3, setting: "farm", walkIn: ["mama", "otieno", "tumaini"],
      type: "say", who: "mama", mood: "worried", picture: "spreading-disease",
      text: "The floods have gone… but now some of my maize leaves are turning yellow with spots. If it's a disease, it can spread to the whole field.",
    },
    {
      type: "say", who: "otieno", mood: "curious",
      text: "The extension officer said warm, wet weather like this helps some crop diseases spread.",
    },
    {
      type: "say", who: "tumaini", mood: "thinking", picture: "photo-check",
      text: "This is a different kind of job. I don't need to predict a number this time. I need to put each leaf in a group: healthy or sick. If I learn from examples, a farmer could take a photo and I could tell them.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "thinking", picture: "tomato-sorting",
      text: "Like sorting tomatoes at the market. After sorting enough of them, you can tell good from rotten at a glance.",
    },
    {
      type: "interactive", activity: "leaf-sorter", prompt: "You sort the leaves. Tumaini watches and learns!",
      help: "Is each leaf healthy or sick? Look at the spots and the colour. Mama checks every answer, so Tumaini learns from correct examples.",
    },
    {
      type: "interactive", activity: "ai-learns", prompt: "Let Tumaini learn.",
      help: "Press the button. Tumaini draws a line that splits the healthy leaves from the sick ones.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "Leaves with many spots and lots of yellow fall on the sick side of my line. Putting things into groups, after learning from examples that someone has already labelled, is called classification. Mama gave me the right answers, so this is supervised learning again.",
    },
    {
      type: "predict", who: "mama",
      question: "Now Tumaini sorts 8 new leaves by itself. How many do YOU think it gets right?",
      options: [
        { text: "All 8", emoji: "💯" },
        { text: "Most of them", emoji: "👍" },
        { text: "Only a few", emoji: "🤏" },
      ],
      reply: "Let's watch and count!",
    },
    {
      type: "interactive", activity: "ai-sorter", prompt: "Tumaini sorts the rest.",
      help: "Press Start. For each leaf, Tumaini says how sure it is. Watch what happens with a leaf that is very close to the line.",
    },
    {
      type: "say", who: "mama", mood: "proud", picture: "ask-expert",
      text: "Seven out of eight is very good. But when Tumaini isn't sure, we should still ask the extension officer.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "excited", action: "jump",
      text: "So a farmer can take a photo, and get an answer fast, before the disease spreads!",
    },

    // 📝 What we learned: both ideas side by side
    {
      part: 4, type: "lesson",
      title: "Today we learned: Predicting and sorting",
      rows: [
        {
          label: "Linear regression", text: "Draw the best straight line through past examples, then follow it to predict a NUMBER, like how high the river will rise.",
          list: [
            "y = mx + c: m ≈ 0.39 m more river for each extra hour of rain; c ≈ 0.81 m with no heavy rain",
            "The \"best\" line has the smallest total mistake",
            "More examples = a steadier line",
          ],
        },
        {
          label: "Classification", text: "Sort things into GROUPS, like healthy or sick, after learning from labelled examples.",
          list: [
            "AI says how sure it is",
            "Cases close to the dividing line are the hardest, and AI can get them wrong",
          ],
        },
        { label: "The difference", text: "Regression answers \"How much?\". Classification answers \"Which group?\"." },
        { label: "Both are supervised", text: "Baba's storms came with the river heights, and Mama labelled every leaf. The answers were given, so both are supervised learning." },
        { label: "Climate use", text: "Flood warnings by SMS, and phone apps that spot crop disease early." },
      ],
      tumainiSays: "Both start the same way: learning patterns from past examples!",
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
    text: "Last time, I learned from Mama's notebook and found the two rainy seasons. Today, I learn to predict and to sort!",
  },
};
