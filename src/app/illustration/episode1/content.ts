// ============================================================
// EPISODE 1 CONTENT: "What is AI?"
// ------------------------------------------------------------
// All the words, questions and numbers for Episode 1 live here.
// To change what a character says, edit the text below.
// The scene engine (../engine) reads this and plays it.
// ============================================================

import type { CropStage, EpisodeContent, PlayableScene } from "../types";

const MAIN_MESSAGE =
  "I learn patterns from past data, so I can warn people early, and they can act early!";

// ------------------------------------------------------------
// DATA: Mama's notebook (made-up teaching data)
// Each day: [dark clouds, ants flying, wind from lake, rained]
// 1 = yes, 0 = no
// ------------------------------------------------------------
export const NOTEBOOK_DAYS: [number, number, number, number][] = [
  [1, 1, 0, 1], [1, 0, 1, 1], [0, 0, 0, 0], [1, 1, 1, 1], [0, 1, 0, 0], [0, 0, 1, 0],
  [1, 0, 0, 1], [0, 0, 0, 0], [1, 1, 0, 1], [0, 1, 1, 0], [1, 0, 0, 0], [0, 0, 1, 0],
];

export const SIGNS = [
  { id: "clouds", label: "Dark clouds" },
  { id: "ants", label: "Ants flying" },
  { id: "wind", label: "Wind from the lake" },
] as const;

export type SignId = (typeof SIGNS)[number]["id"];

// ------------------------------------------------------------
// DATA: Kisumu rainfall (mm per month, January to December)
// Averages for 1991–2021, Climate-Data.org.
// ------------------------------------------------------------
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const NORMAL_RAIN = [115, 94, 190, 288, 213, 109, 98, 107, 113, 202, 248, 189];

// A made-up year when the long rains came late.
export const LATE_RAIN = [115, 94, 60, 140, 290, 220, 110, 107, 113, 202, 248, 189];

// What Mama does each month, and how the maize looks.
export const FARM_CALENDAR: { activity: string; crop: CropStage }[] = [
  { activity: "Dry season. Prepare the land.", crop: "bare" },
  { activity: "Dig the fields before the rains.", crop: "bare" },
  { activity: "Long rains begin. Plant maize!", crop: "sprouts" },
  { activity: "Heaviest rain. Crops grow fast. Watch for floods.", crop: "growing" },
  { activity: "Weed the fields.", crop: "tall" },
  { activity: "Rain eases. Maize ripens.", crop: "cobs" },
  { activity: "Harvest time!", crop: "golden" },
  { activity: "Dry and store the grain.", crop: "bare" },
  { activity: "Prepare for the short rains.", crop: "bare" },
  { activity: "Short rains begin. Plant again.", crop: "sprouts" },
  { activity: "Short rains peak. Crops growing.", crop: "tall" },
  { activity: "Rain tapers off. Crops ripen.", crop: "cobs" },
];

export const DATA_NOTE =
  "Kisumu monthly rainfall: averages for 1991–2021, Climate-Data.org. All other numbers are made-up examples for teaching.";

// ------------------------------------------------------------
// THE STORY: Mama's Notebook and the Year on the Farm
// One story in two chapters, with one lesson board at the end:
//   📒 Learning from examples (the house)   -> machine learning, supervised
//   📅 Patterns over time      (the farm)    -> the normal rhythm of the rains
// ------------------------------------------------------------
const story: PlayableScene = {
  id: "notebook-and-year",
  number: 1,
  title: "Mama's Notebook and the Year on the Farm",
  idea: "Learning from examples and patterns over time",
  setting: "house",
  cast: ["mama", "otieno", "tumaini"],
  lateArrivals: ["tumaini"],
  walkIn: ["mama", "otieno"],
  chapters: {
    1: { icon: "❓", label: "The problem" },
    2: { icon: "📒", label: "Learning from examples" },
    3: { icon: "📅", label: "Patterns over time" },
    4: { icon: "📝", label: "What we learned" },
  },
  facilitatorNotes: [
    "This episode is one story in two chapters. Chapter 1: Tumaini learns which weather signs come before rain, from Mama's notebook. Chapter 2: Tumaini learns the yearly rhythm of the rains, and notices when a year is different.",
    "Each bar answers: \"On days I saw this sign, how often did it rain?\" With 2 pages, the bars are shaky. With 12, they settle. That's what \"training\" an AI means. Every page comes with its answer (rain or no rain), which is why this is SUPERVISED learning (see Episode 0).",
    "Ask: \"Which sign is the best clue? Which is the weakest?\" (Dark clouds about 83%; wind from the lake only 40%.) \"What signs do your parents or grandparents use to predict rain?\"",
    "The wheel shows average monthly rainfall in Kisumu for 1991–2021 (modelled estimates from Climate-Data.org). Ask: \"Which is the wettest month? The driest?\" (April is wettest at about 288 mm; February is driest at about 94 mm.) \"When do farmers here plant?\"",
    "The late-rains year and the notebook numbers are made-up examples. Real AI weather systems use thousands of days and many more measurements (temperature, humidity, air pressure). The Kenya Meteorological Department makes seasonal forecasts that advise farmers when to plant.",
  ],
  dataNote: DATA_NOTE,
  beats: [
    // ❓ The problem
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "dry-seeds",
      text: "I want to plant my maize this week. But will it rain tomorrow? If I plant and the rain doesn't come, my seeds will dry out.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "curious",
      text: "Grandma, how do you usually know when rain is coming?",
    },
    {
      type: "say", who: "mama", mood: "happy", picture: "notebook", action: "show-notebook",
      text: "Experience! For many years I've written in this notebook what I saw each morning, and whether it rained that day.",
    },
    {
      type: "say", who: "tumaini", mood: "confused", enters: true, action: "wave",
      text: "Hello again! I can learn from examples… but I don't know anything about the rain here. Yet! Can your notebook teach me?",
    },

    // 📒 Chapter 1: Learning from examples
    {
      part: 2, optional: true, type: "say", who: "otieno", mood: "thinking", picture: "mangoes",
      text: "Like how I learned what a ripe mango looks like: by seeing lots of mangoes, not by reading a rule!",
    },
    {
      type: "predict", who: "tumaini",
      question: "Before I learn: which sign do YOU think comes before rain most often?",
      options: [
        { text: "Dark clouds", emoji: "☁️" },
        { text: "Ants flying", emoji: "🐜" },
        { text: "Wind from the lake", emoji: "💨" },
      ],
      reply: "Let's see what Mama's notebook says!",
    },
    {
      type: "interactive", activity: "notebook", prompt: "Give Tumaini a page.",
      help: "Press the yellow button. Each page is one morning from Mama's notebook. Watch the bars: they show how often it rained after each sign.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "clues",
      text: "Dark clouds are my strongest clue: it rained on 5 of the 6 days with dark clouds. Wind from the lake is a weak clue. And notice: every page told me the answer, rain or no rain. Learning from examples that come with their answers is called supervised learning.",
    },
    {
      type: "interactive", activity: "sky-guess", prompt: "What do you see in today's sky?",
      help: "Tick the signs you can see today. Tumaini uses what it learned to guess the chance of rain, and shows its working.",
    },
    {
      type: "say", who: "mama", mood: "proud", action: "show-notebook",
      text: "Tumaini learned the same way I did, from experience. But it remembers every page perfectly.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "excited", picture: "many-days", action: "jump",
      text: "And imagine if it read thousands of days, from weather stations all over Kenya!",
    },

    // 📅 Chapter 2: Patterns over time (on the farm)
    {
      part: 3, setting: "farm", walkIn: ["mama", "otieno", "tumaini"],
      type: "say", who: "mama", mood: "worried", picture: "two-seasons",
      text: "My notebook shows something bigger too. Here in Kisumu, the rain comes in two seasons every year. If I plant at the right time, my maize grows well. If I plant at the wrong time, I waste seed and money.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "thinking", picture: "timetable",
      text: "So the rains have a timetable? Like school holidays. They come at the same time every year, so we'd notice at once if they moved.",
    },
    {
      type: "predict", who: "tumaini",
      question: "Which month do YOU think brings the most rain to Kisumu?",
      options: [
        { text: "January", emoji: "☀️" },
        { text: "April", emoji: "🌧️" },
        { text: "August", emoji: "🌤️" },
        { text: "November", emoji: "🌦️" },
      ],
      reply: "Let's play the whole year and find out!",
    },
    {
      type: "interactive", activity: "play-year", prompt: "Play the year.",
      help: "Press Play. Each slice of the wheel is one month: a longer slice means more rain. Watch the farm change with the rain.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "two-seasons", action: "wave",
      text: "I found the rhythm: two rainy seasons every year, the long rains and the short rains. The wettest month is April. And because I know what NORMAL looks like, I can notice when a year is different.",
    },
    {
      type: "say", who: "otieno", mood: "curious", picture: "late-rain",
      text: "But Tumaini, what if one year the rain comes late?",
    },
    {
      type: "interactive", activity: "late-rains", prompt: "Show a year when the long rains came late.",
      help: "Press the switch. The dashed line shows a normal year, so you can compare. What happens to Mama's seeds?",
    },
    {
      type: "say", who: "mama", mood: "proud", picture: "saved-seed",
      text: "If Tumaini warns me early, I can wait and plant when the rain really starts. I save my seed!",
    },

    // 📝 What we learned
    {
      part: 4, type: "lesson",
      title: "Today we learned: Learning from examples",
      rows: [
        { label: "Machine learning", text: "AI learns patterns from examples, instead of following rules someone wrote. More examples = better learning." },
        { label: "Supervised learning", text: "Every page of Mama's notebook gave the answer (rain or no rain), so Tumaini learned with a teacher." },
        { label: "Patterns over time", text: "The rains follow a yearly rhythm: the long rains (March–May) and the short rains (October–December). AI learns the normal rhythm, so it notices when a year is different. (Scientists call this time-series analysis.)" },
        { label: "It's like", text: "Learning what a ripe mango looks like by seeing many mangoes; knowing when school holidays come." },
        { label: "Climate use", text: "Rain forecasts and early warnings that help farmers plant at the right time." },
      ],
      tumainiSays: "I learned from your examples, and now I can warn you early!",
    },
  ],
};

// ------------------------------------------------------------
// The whole episode
// ------------------------------------------------------------
export const EPISODE_1: EpisodeContent = {
  scenes: [story],
  quiz: [
    {
      question: "What is AI?",
      options: [
        { text: "A robot that thinks like a human" },
        { text: "A computer program that learns patterns from examples", correct: true },
        { text: "A machine that controls the weather" },
      ],
      praise: "Yes! I learn patterns from examples.",
      hint: "Think about how I learned from Mama's notebook. Try again!",
    },
    {
      question: "What helps Tumaini learn better?",
      options: [
        { text: "More examples", correct: true },
        { text: "Fewer examples" },
        { text: "Shouting at it" },
      ],
      praise: "Right! More examples = better learning.",
      hint: "Remember: my bars were shaky after 2 pages, but steady after 12. Try again!",
    },
    {
      question: "What are the two rainy seasons in Kisumu?",
      options: [
        { text: "The long rains and the short rains", correct: true },
        { text: "Summer and winter" },
        { text: "There is only one" },
      ],
      praise: "Correct! The long rains and the short rains.",
      hint: "Remember the two humps on the rainfall wheel? Try again!",
    },
  ],
  summary: {
    points: [
      "AI learns from examples",
      "More examples = better learning",
      "AI learns patterns over time and spots changes",
    ],
    message: MAIN_MESSAGE,
  },
  teaser: {
    text: "Next time, the river starts rising… and I'll need your help to warn the village!",
    picture: "river-storm",
  },
};
