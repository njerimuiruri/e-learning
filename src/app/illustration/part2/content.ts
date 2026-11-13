// ============================================================
// PART 2 CONTENT: "Adaptation & resilience"
// ------------------------------------------------------------
// KISS: one idea per slide. Title = the question, text = the
// exact definition, up to 3 short points. One visual per slide.
// No extra animation. ONE exercise ("What would you do?").
//
//   Scene 1  Why do some suffer more?  hazard, exposure, vulnerability, risk
//   Scene 2  How do we adapt?          adaptation, farm, home, early warning, exercise
//   Scene 3  What is resilience?       resilience, prepare/respond/recover, lesson board
//
// Definitions follow the IPCC (the UN's climate science panel),
// in plain words. Kenyan examples: Kenya Meteorological Department
// forecasts; NDMA (National Drought Management Authority) bulletins;
// Kenya's National Adaptation Plan 2015–2030.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { ChoiceConfig } from "../engine/ChoiceActivity";
import { PHOTOS } from "../photos";
import { AGREEMENT_LINKS as L } from "../episode0/content";

const WANJIKU = { photo: PHOTOS.wanjiku };

// ------------------------------------------------------------
// THE EXERCISE: "What would you do?"
// ------------------------------------------------------------
export const LATE_RAINS: ChoiceConfig = {
  situation: "The forecast says the long rains will start late and be short this year. What should Wanjiku do?",
  options: [
    {
      icon: "🌽",
      text: "Plant maize now, as she always does",
      result: "The seeds dry out before the rain comes. She loses her seed and her money.",
    },
    {
      icon: "🌾",
      text: "Wait for the rain, then plant drought-tolerant sorghum",
      result: "Good choice! Sorghum needs less water, and planting with the rain gives it the best start.",
      best: true,
    },
    {
      icon: "🤞",
      text: "Do nothing and hope the forecast is wrong",
      result: "Hoping is not a plan. If the forecast is right, her harvest fails.",
    },
  ],
};

// ------------------------------------------------------------
// SCENE 1: Why do some people suffer more?
// ------------------------------------------------------------
const risk: PlayableScene = {
  id: "adapt-risk",
  number: 1,
  title: "Why do some suffer more?",
  idea: "Hazard, exposure, vulnerability and risk",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "thinking",
      title: "Same drought, different results",
      text: "Wanjiku and her neighbour Musa live in the same village. Why did one lose so much more?",
      visual: {
        compare: [
          { icon: "👩🏾‍🌾", title: "Wanjiku", text: "Planted only maize. Lost her whole harvest." },
          { icon: "👨🏿‍🌾", title: "Musa", text: "Had drought seed and a water tank. Kept most of his harvest." },
        ],
      },
    },
    {
      type: "slide", mood: "worried",
      title: "What is a hazard?",
      text: "A hazard is a dangerous event that can cause harm.",
      points: ["Floods, droughts, heatwaves and storms.", "Climate change makes many hazards stronger or more frequent."],
      visual: { icon: "⚠️" },
    },
    {
      type: "slide", mood: "thinking",
      title: "What is exposure?",
      text: "Exposure means people, homes, farms or animals are in the place where a hazard can hit.",
      points: ["A house built beside a river is exposed to floods.", "A farm that depends only on rain is exposed to drought."],
      visual: { photo: PHOTOS.houseRiver },
    },
    {
      type: "slide", mood: "thinking",
      title: "What is vulnerability?",
      text: "Vulnerability is how easily someone is harmed, and how hard it is for them to recover.",
      points: ["No savings, or only one source of food or income.", "Weak houses, poor health, or no access to warnings."],
      visual: { icon: "🩹" },
    },
    {
      type: "slide", mood: "happy",
      title: "What is risk?",
      text: "Risk is the chance of harm. It depends on all three.",
      points: [
        "We cannot stop the hazard, but we can lower exposure and vulnerability.",
        "Musa lowered his vulnerability, so his risk was lower.",
      ],
      visual: {
        steps: {
          items: [
            { icon: "⚠️", title: "Hazard" },
            { icon: "📍", title: "Exposure" },
            { icon: "🩹", title: "Vulnerability" },
          ],
          joiner: "+",
          result: "Risk",
        },
      },
    },
  ],
  facilitatorNotes: [
    "These terms follow the IPCC: risk comes from the combination of a hazard, exposure to it, and vulnerability. Lowering any one of them lowers the risk.",
    "Hazard: a dangerous event (flood, drought, heatwave). Exposure: people and things in harm's way. Vulnerability: how easily they are harmed and how hard it is to recover.",
    "Ask: \"In your area, what makes people more vulnerable to floods or drought?\"",
  ],
};

// ------------------------------------------------------------
// SCENE 2: How do we adapt? (with the one exercise)
// ------------------------------------------------------------
const adapt: PlayableScene = {
  id: "adapt-how",
  number: 2,
  title: "How do we adapt?",
  idea: "Adaptation on the farm, at home, and with early warnings",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide",
      title: "What is adaptation?",
      text: "Adaptation means changing how we live and farm, so climate change harms us less.",
      points: ["It lowers our exposure and vulnerability.", "It works best when planned before the hazard comes."],
      visual: { icon: "🛡️" },
    },
    {
      type: "slide",
      title: "On the farm",
      text: "Grow crops that need less water, and save water for dry times.",
      points: ["Drought-tolerant crops, like sorghum and millet.", "Water tanks and water pans.", "Terraces that keep soil and water in place."],
      visual: { photo: PHOTOS.farmSorghum },
    },
    {
      type: "slide",
      title: "At home",
      text: "Make homes and families safer from floods and drought.",
      points: ["Build away from rivers and low ground.", "Store food and water for hard times.", "Save money, e.g. in a savings group (chama)."],
      visual: { icon: "🏠" },
    },
    {
      type: "slide",
      title: "What is an early warning?",
      text: "An early warning tells people a hazard is coming, before it arrives.",
      points: [
        "Kenya Meteorological Department forecasts the rains.",
        "NDMA sends drought warnings to counties.",
        "A warning only helps if people act on it in time.",
      ],
      visual: { icon: "📱" },
    },
    {
      type: "interactive", activity: "late-rains-choice", prompt: "What would you do?",
      help: "Tap a choice to see what happens.",
    },
  ],
  facilitatorNotes: [
    "Adaptation (IPCC): adjusting to actual or expected climate and its effects, to reduce harm. Kenya's National Adaptation Plan 2015–2030 sets out national priorities.",
    "Early warning: the Kenya Meteorological Department issues seasonal forecasts; the National Drought Management Authority (NDMA) publishes drought early-warning bulletins for counties.",
    "After the exercise, ask: \"What would make it hard for a farmer to follow the best choice?\" (cost of seed, no water tank, no forecast).",
  ],
};

// ------------------------------------------------------------
// SCENE 3: What is resilience?
// ------------------------------------------------------------
const resilience: PlayableScene = {
  id: "adapt-resilience",
  number: 3,
  title: "What is resilience?",
  idea: "Coping, recovering and carrying on: prepare, respond, recover",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide",
      title: "What is resilience?",
      text: "Resilience is the ability to cope with a shock, recover, and keep going, ideally stronger than before.",
      points: ["A resilient family still has food after a bad season.", "A resilient village recovers quickly after a flood."],
      visual: { icon: "💪" },
    },
    {
      type: "slide",
      title: "Three steps to resilience",
      text: "Resilient people and communities act before, during and after a hazard.",
      points: [
        "Prepare: save water, seed and money.",
        "Respond: follow warnings and move to safety.",
        "Recover: replant and rebuild, better than before.",
      ],
      visual: {
        steps: {
          items: [
            { icon: "📋", title: "Prepare" },
            { icon: "🏃", title: "Respond" },
            { icon: "🌱", title: "Recover" },
          ],
          joiner: "→",
        },
      },
    },
    {
      type: "slide", mood: "excited",
      title: "Wanjiku, the next season",
      text: "She planted sorghum, saved rainwater and joined a savings group. When the dry spell came, she was ready.",
      visual: WANJIKU,
    },
    {
      part: 5, type: "lesson",
      title: "What we learned",
      rows: [
        { label: "Risk", text: "Hazard + exposure + vulnerability. Lower any one, and risk goes down." },
        { label: "Adaptation", text: "Changing how we live and farm so climate change harms us less." },
        { label: "Early warning", text: "Only helps if people act on it in time." },
        { label: "Resilience", text: "Cope, recover and keep going: prepare, respond, recover." },
      ],
      tumainiSays: "To prepare, we need to know what's coming. That means numbers!",
    },
  ],
  facilitatorNotes: [
    "Resilience (IPCC, simplified): the capacity to cope with a hazardous event, respond and reorganise, while keeping the ability to adapt and learn.",
    "\"Bounce forward\": recovering in a way that leaves people better prepared than before, e.g. rebuilding a house on higher ground.",
    "Ask: \"What is one thing your family or community already does to prepare?\"",
  ],
  links: [L.kenyaNdc, L.sendai],
};

// ------------------------------------------------------------
// The whole of Part 2
// ------------------------------------------------------------
export const PART_2: EpisodeContent = {
  scenes: [risk, adapt, resilience],
  quiz: [
    {
      question: "A family builds their house right beside a river. What does this increase?",
      options: [{ text: "Their exposure to floods", correct: true }, { text: "Their savings" }, { text: "The amount of rain" }],
      praise: "Yes! Being where a hazard can hit is exposure.",
      hint: "Think about WHERE the house is. Try again!",
    },
    {
      question: "What is adaptation?",
      options: [
        { text: "Changing how we live and farm so climate change harms us less", correct: true },
        { text: "Stopping all floods and droughts" },
        { text: "Moving to another planet" },
      ],
      praise: "Correct! Adaptation lowers the harm.",
      hint: "We can't stop hazards. What can we change? Try again!",
    },
    {
      question: "What is resilience?",
      options: [
        { text: "Being able to cope, recover and keep going", correct: true },
        { text: "Never facing any problems" },
        { text: "Only having one crop" },
      ],
      praise: "Right! Prepare, respond, recover.",
      hint: "Think about bouncing back. Try again!",
    },
  ],
  summary: {
    points: [
      "Risk depends on the hazard, our exposure and our vulnerability",
      "Adaptation: changing how we live and farm so climate change harms us less",
      "Early warnings only help if people act in time",
      "Resilience: prepare, respond, recover, and come back stronger",
    ],
    message: "We can't stop every hazard, but we can lower the harm.",
  },
  links: [L.kenyaNdc, L.sendai, L.paris],
  recap: {
    text: "Last time: climate change is bringing more floods, droughts and heat, and the world agreed to cut the gases and adapt.",
  },
  teaser: {
    text: "Next: how do numbers and models help us see what's coming?",
    picture: "notebook-teaser",
    mood: "excited",
  },
};
