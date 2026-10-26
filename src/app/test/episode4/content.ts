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
      { who: "tumaini" as const, text: "You're right. I produced words that SOUNDED right, but I don't actually know. Chatbots can sound very sure and still be wrong." },
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
  beats: [
    // 👁️ Chapter 1: Seeing from space
    {
      part: 1, type: "say", who: "mama", mood: "worried", picture: "forest-mud",
      text: "When I was a girl, these hills were covered in forest. Now they're mostly farms. And every year, the river carries more mud, and the floods get worse.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "curious",
      text: "Is the forest really disappearing? How much? It's hard to see from down here.",
    },
    {
      type: "say", who: "tumaini", mood: "excited", action: "jump",
      text: "Then let's look from up high! I'll go up as a satellite and look down from space.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "thinking",
      text: "Like when my phone finds faces in photos? It just knows where the faces are.",
    },
    {
      type: "interactive", activity: "pixel-zoom", prompt: "Tumaini's view from space",
      help: "This is the land seen from a satellite. Press Zoom in to see how a computer really sees a picture.",
    },
    {
      type: "interactive", activity: "teach-labels", prompt: "Teach Tumaini: forest, farm or water?",
      help: "Choose a label, then tap a square on the map. Show at least one forest, one farm and one water square. Then let Tumaini label the rest.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "That's image recognition: I learned what forest, farm and water look like from YOUR labelled examples. So it's supervised learning again. And if the examples are wrong, I learn the wrong thing.",
    },
    {
      type: "predict", who: "mama",
      question: "From 2005 to 2025, how much of the forest on these hills do YOU think was lost?",
      options: [
        { text: "Almost none", emoji: "🌳" },
        { text: "About a quarter", emoji: "🌲" },
        { text: "About half", emoji: "🪓" },
      ],
      reply: "Let's compare the two years from space!",
    },
    {
      type: "interactive", activity: "forest-change", prompt: "Then and now: 2005 → 2025",
      help: "Move the switch to 2025 and watch the forest. Then press 'Ask Tumaini' to find where to plant trees first.",
    },
    {
      type: "say", who: "mama", mood: "worried",
      text: "Without trees, the rain washes the soil straight into the river. That's the mud we see, and it makes the floods worse. So we plant trees on those red squares first.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "excited", action: "jump",
      text: "We could plant trees there with my school's environment club!",
    },

    // 🧠 Chapter 2: Inside Tumaini's head (at the lakeshore)
    {
      part: 2, setting: "river", walkIn: ["otieno", "tumaini"],
      type: "say", who: "baba", mood: "worried", enters: true,
      text: "Storms on the lake can come very fast. Every year, fishermen are caught out on the water. I need to know before I go out.",
    },
    {
      type: "say", who: "otieno", mood: "curious",
      text: "Tumaini, you've learned so many things. But how do you actually THINK?",
    },
    {
      type: "say", who: "tumaini", mood: "excited", picture: "neuron-relay",
      text: "Let me show you inside my head! My brain is a network of tiny calculators called neurons. Each one passes a signal forward, like a relay race: each runner adds a small clue, and the last one announces the answer. Scientists call this a neural network.",
    },
    {
      type: "interactive", activity: "brain-trainer", prompt: "Teach Tumaini's brain",
      help: "Turn a dial and watch the signals move. Then press 'Show Tumaini a day': it guesses first, sees the real answer, and adjusts its connections.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "That's how a neural network learns: guess, check the real answer, and adjust the connections a little. Again and again.",
    },
    {
      type: "predict", who: "baba",
      question: "This afternoon: clouds 8, humidity 9, wind 6, temperature 7. Should I go fishing?",
      options: [
        { text: "Go fishing", emoji: "🎣" },
        { text: "Stay on shore", emoji: "🏖️" },
      ],
      reply: "Let's ask Tumaini's trained brain!",
    },
    {
      type: "interactive", activity: "storm-check", prompt: "This afternoon: should Baba go out?",
      help: "These are this afternoon's dials. Tumaini's trained brain gives the chance of a storm. You can move the dials too.",
    },
    {
      type: "say", who: "baba", mood: "proud",
      text: "Today, I'm safe on shore. Tumaini, you may have saved my life.",
    },

    // 💬 Chapter 3: Talking (on Mama's veranda)
    {
      part: 3, setting: "house", walkIn: ["mama", "otieno", "tumaini"],
      type: "say", who: "mama", mood: "curious",
      text: "Otieno bought me a phone! People say I can ask it questions and it answers like a person. But how does it understand me? And can I ask in Kiswahili?",
    },
    {
      type: "say", who: "tumaini", mood: "excited",
      text: "Phones that chat use language AI, also called chatbots. You know how WhatsApp suggests your next word when you type? A chatbot is a giant version of that, which has read millions of books and websites.",
    },
    {
      type: "interactive", activity: "next-word", prompt: "Build a sentence, one word at a time",
      help: "Tap a word to add it. The numbers show how likely each word is to come next. Or let Tumaini pick the most likely one.",
    },
    {
      optional: true, type: "say", who: "tumaini", mood: "thinking",
      text: "Real chatbots learned their guesses by reading huge amounts of text, including Kiswahili. That's why they can answer in many languages.",
    },
    {
      type: "interactive", activity: "phone-chat", prompt: "Ask the phone",
      help: "Press Send to ask Mama's question. Then try Otieno's tricky question.",
    },
    {
      type: "say", who: "mama", mood: "happy",
      text: "So I use it for ideas. But for important decisions, I still check with the extension officer and the weather service.",
    },

    // 📝 What we learned
    {
      part: 4, type: "lesson",
      title: "Today we learned: how AI sees, thinks and talks",
      rows: [
        {
          label: "Image recognition", text: "To a computer, a picture is a grid of numbers called pixels. AI learns from labelled examples to recognise forest, farmland and water.",
          list: ["Wrong examples teach it the wrong thing"],
        },
        {
          label: "Neural networks", text: "Many tiny calculators (neurons) in layers pass signals forward and decide together.",
          list: ["They learn: guess → check the real answer → adjust a little → repeat"],
        },
        {
          label: "Language AI", text: "Chatbots predict the next word, again and again. They can answer in Kiswahili and many other languages.",
          list: ["Careful: they can sound sure and still be wrong. Check important advice with experts."],
        },
        { label: "Climate use", text: "Tracking forest loss and choosing where to plant trees, storm warnings for fishermen, and advice for farmers in their own language." },
      ],
      tumainiSays: "Seeing, thinking, talking: it all starts with learning patterns from examples!",
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
    text: "Next time: when can you trust AI, and who makes the final decision? The most important episode of all!",
    picture: "exam-robots",
    mood: "thinking",
  },
  recap: {
    text: "Last time, I grew a decision tree and found groups of villages by myself. Today, I look down from space, show you inside my head, and learn to talk!",
  },
};
