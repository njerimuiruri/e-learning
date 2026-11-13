// ============================================================
// PART 3 CONTENT: "Modelling (basic maths)"
// ------------------------------------------------------------
// KISS: one idea per slide. Title = the question, text = the
// exact definition, up to 3 short points. One visual per slide.
// Still charts, no extra animation. ONE exercise ("Use the model").
//
//   Scene 1  Reading data          data, average, graphs, trend
//   Scene 2  Simple models         model, y = mx + c, exercise, anomaly, probability
//   Scene 3  From numbers to action threshold, models aren't perfect, AI, lesson board
//
// Example numbers are simple and made up for teaching (the river
// model), or approximate and labelled (rain by month; WMO warming).
// TODO: swap the 📏 and 🌧️ icons for rain-gauge / river-gauge photos.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import { PHOTOS } from "../photos";
import { AGREEMENT_LINKS as L } from "../episode0/content";

const WANJIKU = { photo: PHOTOS.wanjiku };

// ------------------------------------------------------------
// SCENE 1: Reading data
// ------------------------------------------------------------
const readingData: PlayableScene = {
  id: "model-data",
  number: 1,
  title: "Reading data",
  idea: "Data, averages, graphs and trends",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "happy",
      title: "Why numbers matter",
      text: "A forecast told Wanjiku the rains would start late. She waited a week to plant, and her seed was saved.",
      visual: WANJIKU,
    },
    {
      type: "slide",
      title: "What is data?",
      text: "Data is facts and numbers that we measure and record.",
      points: [
        "Rain gauges measure how much rain falls each day.",
        "Weather stations also record temperature and wind.",
        "Satellites measure rain and plant growth from space.",
      ],
      visual: { icon: "🌧️" },
    },
    {
      type: "slide",
      title: "What is an average?",
      text: "An average is the \"normal\" value. Add up all the values, then divide by how many there are.",
      points: [
        "March rain over 5 years: 80, 120, 100, 140, 60 mm.",
        "Add them: 500 mm. Divide by 5: 100 mm.",
        "So 100 mm is a normal March.",
      ],
      visual: { stat: { value: "100 mm", label: "average March rain (example)" } },
    },
    {
      type: "slide",
      title: "Graphs show patterns",
      text: "A graph turns numbers into a picture, so patterns are easy to see.",
      points: ["Most of Kenya has two rainy seasons.", "The long rains (March–May) and the short rains (October–December)."],
      visual: { chart: "rain-by-month" },
    },
    {
      type: "slide", mood: "thinking",
      title: "What is a trend?",
      text: "A trend is the general direction of data over a long time: going up, going down, or staying the same.",
      points: ["The world's temperature has an upward trend.", "Single years go up and down, but the trend keeps rising."],
      visual: { chart: "temperature-trend" },
    },
  ],
  facilitatorNotes: [
    "Data sources in Kenya: the Kenya Meteorological Department runs weather stations and rain gauges; satellites (e.g. CHIRPS rainfall estimates) fill gaps where there are no gauges.",
    "Average (mean): add the values and divide by how many. Climate \"normals\" are usually 30-year averages.",
    "The rain-by-month chart is approximate, for central Kenya; the pattern (two rainy seasons) is what matters. The temperature line is approximate, from WMO data.",
  ],
  links: [L.wmo],
};

// ------------------------------------------------------------
// SCENE 2: Simple models (with the one exercise)
// ------------------------------------------------------------
const simpleModels: PlayableScene = {
  id: "model-simple",
  number: 2,
  title: "Simple models",
  idea: "What a model is, a straight-line model, anomaly and probability",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide",
      title: "What is a model?",
      text: "A model is a simple version of the real world that helps us understand it and predict what will happen.",
      points: ["A map is a model of a place.", "A weather forecast comes from a model of the air and oceans."],
      visual: { icon: "🗺️" },
    },
    {
      type: "slide", mood: "thinking",
      title: "A straight-line model: y = mx + c",
      text: "The more rain falls upstream, the higher the river rises. A straight line can describe this.",
      points: [
        "y = the river height, x = the rain upstream.",
        "m = how much the river rises for each mm of rain.",
        "c = the river height when there is no rain.",
      ],
      visual: { chart: "river-model" },
    },
    {
      type: "interactive", activity: "river-model", prompt: "Use the model",
      help: "Drag the slider. How much rain makes the river pass the danger line?",
    },
    {
      type: "slide", mood: "excited",
      title: "What is linear regression?",
      text: "Linear regression means finding the straight line that best fits past data, then using it to predict.",
      points: [
        "Each dot is a past storm: how much rain, and how high the river rose.",
        "The computer finds the line closest to all the dots.",
        "It is one of the simplest machine learning methods.",
      ],
      visual: { chart: "river-model" },
    },
    {
      type: "slide", mood: "worried",
      title: "What is an anomaly?",
      text: "An anomaly is how far a value is from normal.",
      points: ["Normal March rain: 100 mm. This March: 60 mm.", "That is 40% below normal: a dry anomaly."],
      visual: { stat: { value: "−40%", label: "this March's rain compared with normal (example)" } },
    },
    {
      type: "slide",
      title: "What is probability?",
      text: "Probability is the chance that something will happen, from 0% (impossible) to 100% (certain).",
      points: ["Forecasts give chances, not promises.", "60% chance of above-normal rain: likely, but not certain."],
      visual: { stat: { value: "60%", label: "chance of above-normal rain (example)" } },
    },
  ],
  facilitatorNotes: [
    "The river model is made up for teaching: river height (m) = 0.04 × rain (mm) + 0.5. Real river models use many more inputs (soil wetness, upstream gauges, land shape).",
    "y = mx + c: m is the slope (how steep the line is), c is where the line starts (the intercept). Learners can check: 50 mm of rain → 0.04 × 50 + 0.5 = 2.5 m.",
    "Seasonal forecasts from the Kenya Meteorological Department and ICPAC are given as probabilities (e.g. above-, near- or below-normal rain).",
  ],
};

// ------------------------------------------------------------
// SCENE 3: From numbers to action
// ------------------------------------------------------------
const toAction: PlayableScene = {
  id: "model-action",
  number: 3,
  title: "From numbers to action",
  idea: "Thresholds, the limits of models, and where AI fits",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "worried",
      title: "What is a threshold?",
      text: "A threshold is a line that, when crossed, means it is time to act.",
      points: ["River above 3 m: warn people and move to higher ground.", "Rain far below normal: start drought plans."],
      visual: { icon: "📏" },
    },
    {
      type: "slide", mood: "unsure",
      title: "Models are not perfect",
      text: "A model gives a best guess, not a certain answer.",
      points: ["Check the prediction against what really happens.", "Update the model with new data."],
      visual: { icon: "🔍" },
    },
    {
      type: "slide", mood: "excited",
      title: "Where does AI fit?",
      text: "AI is a model that learns patterns from large amounts of data by itself.",
      points: [
        "It can read years of rain, river and satellite data quickly.",
        "It still makes mistakes, so people check its predictions.",
      ],
      visual: { icon: "🤖" },
    },
    {
      type: "slide", mood: "thinking",
      title: "Two ways AI learns",
      text: "It depends on whether the examples come with answers.",
      visual: {
        compare: [
          { icon: "🏷️", title: "Supervised", text: "Learns from examples WITH answers, e.g. past storms and how high the river rose" },
          { icon: "🔍", title: "Unsupervised", text: "No answers given. It finds groups by itself, e.g. villages with similar risks" },
        ],
      },
    },
    {
      part: 5, type: "lesson",
      title: "What we learned",
      rows: [
        { label: "Data", text: "Facts we measure. Averages show normal; graphs show patterns and trends." },
        { label: "Model", text: "A simple version of the world that helps us predict, e.g. y = mx + c." },
        { label: "Anomaly & probability", text: "How far from normal, and how likely." },
        { label: "Threshold", text: "The line where action starts." },
        { label: "AI", text: "Learns from data: linear regression fits a line; supervised (with answers) or unsupervised (finds groups)." },
      ],
      tumainiSays: "Now we can predict. But who acts, and where?",
    },
  ],
  facilitatorNotes: [
    "Thresholds turn a prediction into a decision. Many early-warning systems use them, e.g. river levels or rainfall amounts that trigger alerts.",
    "\"All models are wrong, but some are useful\" (George Box): a model is judged by whether it helps us decide well.",
    "AI (machine learning) finds patterns in large datasets without a person writing every rule. It is a model like any other: it needs good data and checking.",
    "Linear regression finds the line that minimises the distance to all the data points (\"line of best fit\"). Supervised learning uses labelled examples (inputs with known answers); unsupervised learning finds structure, such as groups (clusters), without labels. Module 4 uses both.",
  ],
};

// ------------------------------------------------------------
// The whole of Part 3
// ------------------------------------------------------------
export const PART_3: EpisodeContent = {
  scenes: [readingData, simpleModels, toAction],
  quiz: [
    {
      question: "Rain over 4 years was 50, 70, 90 and 110 mm. What is the average?",
      options: [{ text: "80 mm", correct: true }, { text: "320 mm" }, { text: "110 mm" }],
      praise: "Yes! 320 ÷ 4 = 80 mm.",
      hint: "Add them up, then divide by 4. Try again!",
    },
    {
      question: "In y = mx + c, what does c mean in the river model?",
      options: [
        { text: "The river height when there is no rain", correct: true },
        { text: "The amount of rain" },
        { text: "The danger line" },
      ],
      praise: "Correct! c is where the line starts.",
      hint: "What is the river height when x = 0? Try again!",
    },
    {
      question: "The river passes the 3 m danger line. What is the 3 m line called?",
      options: [{ text: "A threshold", correct: true }, { text: "An average" }, { text: "A trend" }],
      praise: "Right! Crossing a threshold means it's time to act.",
      hint: "It's the line where action starts. Try again!",
    },
  ],
  summary: {
    points: [
      "Data: facts we measure; averages show what is normal",
      "Graphs show patterns and trends",
      "A model helps us predict, e.g. y = mx + c; linear regression finds the best line",
      "Anomaly, probability and thresholds turn numbers into action",
    ],
    message: "Numbers help us see what's coming, so we can act in time.",
  },
  links: [L.wmo],
  recap: {
    text: "Last time: risk depends on hazard, exposure and vulnerability, and we adapt to lower the harm.",
  },
  teaser: {
    text: "Next: a flood is coming. Which places will be hit hardest, and who do we help first?",
    picture: "river-storm",
    mood: "worried",
  },
};
