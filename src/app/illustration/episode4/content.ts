// ============================================================
// EPISODE 4 CONTENT: "Sees, thinks and talks"
// ------------------------------------------------------------
// One story in three chapters, then one lesson board:
//   👁️ Seeing from space      -> image recognition (pixels, labelled examples)
//   🧠 Inside Tumaini's head   -> neural networks (guess, check, adjust)
//   💬 Talking                 -> language AI (predict the next word)
//
// All maps, weather days and word percentages are made up for
// teaching. Checked in code: forest 43% → 22% of the land;
// 8 planting squares by the river; the brain goes from 4 of 8
// right to 8 of 8, and gives about 90% storm for today's weather.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { Day } from "./brainMath";
import { parseMap } from "./imageMath";

const MAIN_MESSAGE =
  "I learn patterns from past data, so I can warn people early, and they can act early!";

export const DATA_NOTE = "All maps, weather days and word percentages in this episode are made-up examples for teaching.";

// ------------------------------------------------------------
// DATA: the satellite map, 20 columns × 12 rows
// W = water (Lake Victoria on the left, plus the river), F = forest, A = farmland
// ------------------------------------------------------------
const MAP_2005_ROWS = [
  "WWWWAAAFFFFFFFFFFFFF",
  "WWWWAAAFFFFFFFFFFFFF",
  "WWWAAAAAFFFFFFFFFWFF",
  "WWWAAAAAAFFFFFFFWFFF",
  "WWWAAAAAAAFFFFFWFFFF",
  "WWWWAAAAAAAFFFWFFFFF",
  "WWWWWWAAAAAAAWAFFFFF",
  "WWWWAAWWWAAAWAAAFFFF",
  "WWWAAAAAAWWWAAAAAFFF",
  "WWWAAAAAAAAAAAAAAAFF",
  "WWWWAAAAAAAAAAAAAAAF",
  "WWWWAAAAAAAAAAAAAAAA",
];
const MAP_2025_ROWS = [
  "WWWWAAAAAAAAAFFFFFFF",
  "WWWWAAAAAAAAAAFFFFFF",
  "WWWAAAAAAAAAAAFFFWFF",
  "WWWAAAAAAAAAFFFFWFFF",
  "WWWAAAAAAAAAAFFWFFFF",
  "WWWWAAAAAAAAAFWFFFFF",
  "WWWWWWAAAAAAAWAAAFFF",
  "WWWWAAWWWAAAWAAAAAAA",
  "WWWAAAAAAWWWAAAAAAAA",
  "WWWAAAAAAAAAAAAAAAAA",
  "WWWWAAAAAAAAAAAAAAAA",
  "WWWWAAAAAAAAAAAAAAAA",
];
export const MAP_COLUMNS = 20;
export const MAP_ROWS = 12;
export const MAP_2005 = parseMap(MAP_2005_ROWS);
export const MAP_2025 = parseMap(MAP_2025_ROWS);

// ------------------------------------------------------------
// DATA: Baba's 8 afternoons [clouds, humidity, wind, temperature], 0–10, and whether a storm came
// ------------------------------------------------------------
export const DIAL_NAMES = [
  { name: "Clouds", icon: "☁️" },
  { name: "Humidity", icon: "💧" },
  { name: "Wind", icon: "💨" },
  { name: "Temperature", icon: "🌡️" },
] as const;

const DAY_ROWS: [number, number, number, number, number][] = [
  [9, 9, 7, 8, 1],
  [2, 3, 2, 6, 0],
  [8, 8, 3, 7, 1],
  [3, 2, 8, 5, 0],
  [7, 9, 6, 9, 1],
  [1, 4, 1, 4, 0],
  [6, 5, 2, 3, 0],
  [9, 7, 8, 6, 1],
];
export const DAYS: Day[] = DAY_ROWS.map(([c, h, w, t, storm]) => ({ dials: [c, h, w, t], storm: storm === 1 }));

/** This afternoon's weather, for the storm check */
export const TODAY: [number, number, number, number] = [8, 9, 6, 7];

// ------------------------------------------------------------
// DATA: the next-word game. The guesses depend on the LAST word.
// ------------------------------------------------------------
export const SENTENCE_START = ["Farmers", "should", "plant", "when", "the"];
export const MAX_ADDED_WORDS = 6;
export const NEXT_WORDS: Record<string, [string, number][]> = {
  the: [["rains", 58], ["soil", 27], ["sun", 9]],
  rains: [["begin", 61], ["are", 17], ["stop", 8]],
  soil: [["is", 66], ["feels", 21], ["turns", 6]],
  sun: [["sets", 40], ["shines", 35], ["is", 12]],
  begin: [[".", 55], ["in", 30], ["early", 9]],
  are: [["steady", 50], ["reliable", 30], ["heavy", 10]],
  is: [["moist", 62], ["wet", 25], ["warm", 7]],
  feels: [["damp", 55], ["soft", 30], ["cool", 10]],
  turns: [["dark", 60], ["soft", 30], ["red", 10]],
  in: [["March", 48], ["April", 37], ["October", 10]],
};
/** Any other last word → "." (the sentence ends) */
export const END_ONLY: [string, number][] = [[".", 100]];

// ------------------------------------------------------------
// DATA: the phone chat
// (Please have a fluent Kiswahili speaker check the Kiswahili before presenting.)
// ------------------------------------------------------------
export const CHAT = {
  kiswahili: {
    question: "Nipande lini?",
    questionEnglish: "When should I plant?",
    answer: "Mvua za masika zinatarajiwa kuanza wiki ijayo. Subiri udongo ulowe vizuri, kisha panda.",
    answerEnglish: "The long rains are expected to start next week. Wait until the soil is well soaked, then plant.",
    reaction: { who: "mama" as const, text: "It answered in my own language!" },
  },
  tricky: {
    question: "How much rain will fall in Nyakach on 1 December 2030?",
    answer: "Exactly 23.4 mm of rain will fall in Nyakach on 1 December 2030.",
    reactions: [
      { who: "otieno" as const, text: "Wait… nobody can know that exactly, years ahead!" },
      { who: "tumaini" as const, text: "Right. My words SOUNDED right, but I didn't know. Chatbots can sound sure and still be wrong." },
    ],
  },
};

// ------------------------------------------------------------
// THE STORY
// ------------------------------------------------------------
const story: PlayableScene = {
  id: "sees-thinks-talks",
  number: 4,
  title: "Eyes in the Sky, a Brain, and a Phone",
  idea: "Image recognition, neural networks and language AI",
  setting: "farm",
  cast: ["mama", "otieno", "tumaini"],
  castBySetting: { river: ["baba", "otieno", "tumaini"] },
  lateArrivals: ["baba"],
  walkIn: ["mama", "otieno", "tumaini"],
  mamaHoldsBySetting: { house: "phone" },
  chapters: {
    1: { icon: "👁️", label: "Seeing from space" },
    2: { icon: "🧠", label: "Inside Tumaini's head" },
    3: { icon: "💬", label: "Talking" },
    4: { icon: "📝", label: "What we learned" },
  },
  facilitatorNotes: [
    "This is the hardest episode in the series. Aim for the general picture, not the technical details.",
    "Image recognition: real satellite images have millions of pixels, and each stores several numbers (red, green, blue and infrared light). Here each square has one number, its greenness. Tumaini copies the label of the example with the closest number. Real systems are more advanced, but the idea is the same: learn from labelled examples (supervised learning).",
    "Ask: \"What happened when someone gave Tumaini a wrong example?\" (The map came out wrong. Bad examples = bad results.) \"Why do trees near rivers matter for floods?\" (Trees hold soil and slow water: less mud, smaller floods.) Real forest maps of Kenya come from satellites such as Landsat and Sentinel.",
    "Neural networks: each neuron combines its inputs using connection strengths (weights) and passes a signal on. Learning means adjusting the weights to make mistakes smaller; the method is called backpropagation. This one is tiny (4 inputs, 3 hidden neurons, 1 output); real ones have millions or billions of connections.",
    "Ask: \"Which dials matter most for storms?\" (Watch which lines grow thickest: usually clouds and humidity.) \"If Tumaini had learned from only 2 days, would you trust its warning?\" Real storm warnings for Lake Victoria come from the Kenya Meteorological Department and regional early-warning projects.",
    "Language AI (large language models) learns patterns from huge amounts of text and builds answers by predicting a likely next word (more exactly, the next small piece of a word). Because it predicts likely-sounding words, it can give confident but wrong answers, sometimes called \"hallucinations\".",
    "Ask: \"When would you trust a chatbot? When would you check with a person?\" \"Which languages would help farmers here most?\" (Kiswahili, Dholuo, English…). Please have a fluent Kiswahili speaker check the Kiswahili sentences before presenting.",
  ],
  dataNote: DATA_NOTE,
  // KISS: one idea per slide. Title = the idea, text = the short answer.
  beats: [
    // 👁️ Chapter 1: Seeing from space
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "forest-mud",
      title: "The forest is shrinking",
      text: "Fewer trees, more mud in the river, worse floods.",
    },
    {
      type: "say", who: "tumaini", mood: "excited", action: "jump",
      text: "Let's look from space, like a satellite!",
    },
    {
      type: "interactive", activity: "pixel-zoom", prompt: "Tumaini's view from space",
      help: "Press Zoom in.",
    },
    {
      type: "interactive", activity: "teach-labels", prompt: "Forest, farm or water?",
      help: "Pick a label, tap a square. Then let Tumaini do the rest.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      title: "Image recognition",
      text: "I learned what forest, farm and water look like from YOUR labels.",
    },
    {
      type: "predict", who: "mama",
      question: "How much forest was lost, 2005 to 2025?",
      options: [
        { text: "Almost none", emoji: "🌳" },
        { text: "A quarter", emoji: "🌲" },
        { text: "Half", emoji: "🪓" },
      ],
      reply: "Let's look from space!",
    },
    {
      type: "interactive", activity: "forest-change", prompt: "2005 → 2025",
      help: "Move the switch. Then press 'Ask Tumaini'.",
    },
    {
      type: "say", who: "mama", mood: "worried",
      text: "We plant trees on the red squares first.",
    },

    // 🧠 Chapter 2: Inside Tumaini's head (at the lakeshore)
    {
      part: 2, setting: "river", walkIn: ["otieno", "tumaini"],
      type: "say", who: "baba", mood: "worried", enters: true,
      text: "Lake storms come fast. I need to know before I go fishing.",
    },
    {
      type: "say", who: "tumaini", mood: "excited", picture: "neuron-relay",
      title: "Neural network",
      text: "Tiny calculators (neurons) pass clues forward, like a relay race.",
    },
    {
      type: "interactive", activity: "brain-trainer", prompt: "Teach Tumaini's brain",
      help: "Turn a dial. Then press 'Show Tumaini a day'.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      title: "How it learns",
      text: "Guess. Check. Adjust a little. Repeat.",
    },
    {
      type: "predict", who: "baba",
      question: "Clouds 8, humidity 9, wind 6. Go fishing?",
      options: [
        { text: "Go fishing", emoji: "🎣" },
        { text: "Stay on shore", emoji: "🏖️" },
      ],
      reply: "Let's ask Tumaini!",
    },
    {
      type: "interactive", activity: "storm-check", prompt: "Should Baba go out?",
      help: "Move the dials if you like.",
    },
    {
      type: "say", who: "baba", mood: "proud",
      text: "I stay on shore today. Thank you, Tumaini!",
    },

    // 💬 Chapter 3: Talking (on Mama's veranda)
    {
      part: 3, setting: "house", walkIn: ["mama", "otieno", "tumaini"],
      type: "say", who: "mama", mood: "curious",
      text: "My new phone answers questions. Can I ask in Kiswahili?",
    },
    {
      type: "say", who: "tumaini", mood: "excited",
      title: "Language AI",
      text: "Chatbots guess the next word, again and again. Like WhatsApp suggestions, but giant.",
    },
    {
      type: "interactive", activity: "next-word", prompt: "Build a sentence",
      help: "Tap a word, or let Tumaini pick.",
    },
    {
      type: "interactive", activity: "phone-chat", prompt: "Ask the phone",
      help: "Press Send. Then try Otieno's question.",
    },
    {
      type: "say", who: "mama", mood: "happy",
      title: "Check big decisions",
      text: "Chatbots can sound sure and still be wrong. I check with experts.",
    },

    // 📝 What we learned
    {
      part: 4, type: "lesson",
      title: "Today we learned",
      rows: [
        { label: "Image recognition", text: "Learns to see forest, farm and water from labels." },
        { label: "Neural networks", text: "Guess, check, adjust, repeat." },
        { label: "Language AI", text: "Guesses the next word. Check what it says." },
      ],
      tumainiSays: "It all starts with examples!",
    },
  ],
};

// ------------------------------------------------------------
// The whole episode
// ------------------------------------------------------------
export const EPISODE_4: EpisodeContent = {
  scenes: [story],
  quiz: [
    {
      question: "To a computer, what is a satellite picture?",
      options: [
        { text: "A grid of numbers called pixels", correct: true },
        { text: "A real window into space" },
        { text: "A drawing made by hand" },
      ],
      praise: "Yes! Every picture is just numbers to me.",
      hint: "Remember when we zoomed in? What did each square show?",
    },
    {
      question: "How does a neural network learn?",
      options: [
        { text: "Guess, check the real answer, and adjust a little", correct: true },
        { text: "It never changes" },
        { text: "It asks a person every time" },
      ],
      praise: "Right! Guess, check, adjust: that's how I learn.",
      hint: "Remember the lines changing after each day? Try again!",
    },
    {
      question: "A chatbot gives you a very exact rain forecast for 5 years from now. What should you do?",
      options: [
        { text: "Believe it completely" },
        { text: "Check with experts, because chatbots can sound sure and still be wrong", correct: true },
        { text: "Share it with everyone" },
      ],
      praise: "Exactly! For important decisions, check with the experts.",
      hint: "Remember the 23.4 mm answer? Try again!",
    },
  ],
  summary: {
    points: [
      "To a computer, pictures are grids of numbers (pixels)",
      "Wrong examples teach AI the wrong thing",
      "Neural networks learn by guessing, checking and adjusting",
      "Chatbots predict the next word, and can be wrong",
    ],
    message: MAIN_MESSAGE,
  },
  teaser: {
    text: "Next time: when can you trust AI, and who decides?",
    picture: "exam-robots",
    mood: "thinking",
  },
  recap: {
    text: "Last time: I grew a decision tree. Today: I look from space, and learn to talk!",
  },
};
