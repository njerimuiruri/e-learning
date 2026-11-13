// ============================================================
// PART 1 CONTENT: "Climate change"
// ------------------------------------------------------------
// KISS: one idea per slide. Title = the question, text = the
// short answer. Pictures only where they explain. ONE exercise.
//
//   Scene 1  What is climate change?  why it matters, weather vs climate, causes
//   Scene 2  How does it affect us?   floods, drought, heat, food & water, who, fairness
//   Scene 3  What is the world doing? policy, Paris, Kenya, mitigation vs adaptation,
//                                     the exercise, the lesson board
//
// (AI_OR_NOT and LEARN_SORT below are kept for the later AI parts.)
//
// Facts checked against: WMO State of the Global Climate 2024;
// Kenya's updated NDC (2020); ReliefWeb / Kenya Ministry of Interior
// (2024 floods); the Lake Victoria Basin Commission (2020 record
// level); WMO (2020–22 drought).
// See docs/tumaini/climate-and-ai-coverage.md for the sources.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { CardSortConfig } from "../engine/CardSortActivity";
import { PHOTOS } from "../photos";

// ------------------------------------------------------------
// CARD GAMES (used by the card-sort activity in engine/CardSortActivity.tsx)
// ------------------------------------------------------------
export const CUT_OR_ADAPT: CardSortConfig = {
  bins: [
    { emoji: "✂️", label: "Mitigation: cut the gases" },
    { emoji: "🛡️", label: "Adaptation: get ready" },
  ],
  cards: [
    { emoji: "☀️", text: "Solar and geothermal power instead of coal", bin: 0, why: "Clean power makes far less of the gases that thicken the blanket." },
    { emoji: "📱", text: "Flood warnings by SMS", bin: 1, why: "A warning doesn't stop the flood, but it gives people time to get ready." },
    { emoji: "🌳", text: "Protecting forests and planting trees", bin: 0, why: "Trees take carbon dioxide out of the air. (They also hold soil and water, so they help us adapt too!)" },
    { emoji: "🌱", text: "Drought-tolerant seed", bin: 1, why: "It doesn't change the climate, but it helps crops survive dry spells." },
    { emoji: "🍳", text: "Cleaner cooking stoves", bin: 0, why: "They burn less wood and charcoal, so less smoke and gas goes into the air." },
    { emoji: "🏠", text: "Raising houses near the river", bin: 1, why: "It keeps families safe when floods come." },
  ],
  finish: "Great sorting! The world needs BOTH: mitigation AND adaptation.",
};

export const AI_OR_NOT: CardSortConfig = {
  bins: [
    { emoji: "🤖", label: "AI: it learned" },
    { emoji: "⚙️", label: "Not AI: fixed rules" },
  ],
  cards: [
    { emoji: "🧮", text: "A calculator adding numbers", bin: 1, why: "It follows rules a person wrote. It never learns anything new." },
    { emoji: "📱", text: "A phone that unlocks when it sees your face", bin: 0, why: "It learned what your face looks like from examples." },
    { emoji: "⏰", text: "An alarm clock", bin: 1, why: "It just rings at the time you set. No learning." },
    { emoji: "🌧️", text: "A weather app that learns from past data to forecast rain", bin: 0, why: "It finds patterns in years of weather records, like Mama's notebook." },
    { emoji: "🗣️", text: "An app that translates Kiswahili into English", bin: 0, why: "It learned from millions of sentences that people had already translated." },
    { emoji: "💡", text: "A light switch", bin: 1, why: "On or off: it does exactly the same thing every time." },
  ],
  finish: "Well done! AI is a program that LEARNS from examples. Fixed rules are not AI.",
};

export const LEARN_SORT: CardSortConfig = {
  bins: [
    { emoji: "🏷️", label: "Supervised: answers given" },
    { emoji: "🔍", label: "Unsupervised: finds groups alone" },
  ],
  cards: [
    { emoji: "🍃", text: "Leaves that Mama has labelled \"healthy\" or \"sick\"", bin: 0, why: "Every example comes with the right answer, so the machine learns from a teacher." },
    { emoji: "🏘️", text: "Villages grouped by their flood and drought history, with no labels", bin: 1, why: "Nobody says what the groups are. The machine discovers them." },
    { emoji: "⛈️", text: "Storms with the river height written next to each one", bin: 0, why: "Each storm comes with its answer: how high the river rose." },
    { emoji: "🛰️", text: "Satellite photos sorted into areas that look alike, without saying what they are", bin: 1, why: "The machine finds similar areas by itself. People decide later what each group means." },
  ],
  finish: "You've got it! Supervised = learning with the answers. Unsupervised = finding groups without answers.",
};

// ------------------------------------------------------------
// LINKS to the official texts (all checked October 2026).
// Used on the lesson board, in the facilitator panel and on the summary.
// They open in a new tab and need internet.
// ------------------------------------------------------------
export const AGREEMENT_LINKS = {
  unfccc: { label: "UN climate treaty, UNFCCC (1992): full text", href: "https://unfccc.int/resource/docs/convkp/conveng.pdf" },
  paris: { label: "The Paris Agreement (2015)", href: "https://unfccc.int/process-and-meetings/the-paris-agreement" },
  sdg13: { label: "Sustainable Development Goal 13: Climate action", href: "https://sdgs.un.org/goals/goal13" },
  sendai: { label: "Sendai Framework for Disaster Risk Reduction 2015–2030", href: "https://www.undrr.org/implementing-sendai-framework/what-sendai-framework" },
  kenyaAct: { label: "Kenya's Climate Change Act (2016), on Kenya Law", href: "https://new.kenyalaw.org/akn/ke/act/2016/11" },
  kenyaNdc: { label: "Kenya's climate plan (updated NDC, 2020)", href: "https://leap.unep.org/en/countries/ke/national-legislation/kenyas-updated-nationally-determined-contribution-ndc-2020-2030" },
  unesco: { label: "UNESCO Recommendation on the Ethics of AI (2021)", href: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics" },
  auAi: { label: "African Union Continental AI Strategy (2024)", href: "https://au.int/en/node/44004" },
  kenyaAi: { label: "Kenya's National AI Strategy 2025–2030 (ICT Ministry)", href: "https://ict.go.ke/ict-ministry-set-launch-national-artificial-intelligence-strategy-2025-2030" },
  wmo: { label: "WMO: State of the Global Climate 2024 (the warming facts)", href: "https://wmo.int/files/state-of-global-climate-2024" },
  iea: { label: "IEA: Energy and AI (AI's electricity use)", href: "https://www.iea.org/reports/energy-and-ai" },
};
const L = AGREEMENT_LINKS;
const CLIMATE_LINKS = [L.paris, L.unfccc, L.kenyaNdc, L.kenyaAct, L.sdg13, L.sendai, L.wmo];

// ------------------------------------------------------------
// THE STORY: Wanjiku, a maize farmer. One story slide opens each
// scene, so the ideas explain what happens to a real person.
// Her photo is PHOTOS.wanjiku (see ../photos.ts).
// ------------------------------------------------------------
const WANJIKU = { photo: PHOTOS.wanjiku };

// ------------------------------------------------------------
// SCENE 1: What is climate change?
// ------------------------------------------------------------
const whatItIs: PlayableScene = {
  id: "climate-what",
  number: 1,
  title: "What is climate change?",
  idea: "Weather vs climate, the greenhouse effect, and the causes",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "worried",
      title: "Why should we care?",
      text: "In 2024, floods forced over 200,000 Kenyans from their homes.",
      visual: { photo: PHOTOS.floodsAerial },
    },
    {
      type: "slide",
      title: "Meet Wanjiku",
      text: "Wanjiku grows maize in Machakos. Her mother always planted when the long rains came in March. Now the rains don't come on time.",
      visual: WANJIKU,
    },
    {
      type: "slide",
      title: "Weather or climate?",
      text: "They are not the same thing.",
      visual: {
        compare: [
          { icon: "☀️🌧️", title: "Weather", text: "The rain, sun, heat and wind in a place today or this week" },
          { icon: "📅", title: "Climate", text: "The average weather in a place over a long time, usually 30 years" },
        ],
      },
    },
    {
      type: "slide", mood: "thinking",
      title: "What is climate change?",
      text: "Climate change is a long-term shift in the Earth's usual temperatures and weather patterns.",
      points: [
        "It happens over decades, not days.",
        "Since the 1800s, people have been the main cause.",
        "The Earth is now about 1.3 °C warmer than in the late 1800s.",
      ],
      visual: { icon: "🌡️" },
    },
    {
      type: "slide", mood: "thinking",
      title: "What is the greenhouse effect?",
      text: "Some gases in the air let sunlight in, but stop heat from escaping, like a blanket around the Earth.",
      points: [
        "These are called greenhouse gases, e.g. carbon dioxide (CO₂) and methane.",
        "A little is good: without it, the Earth would be too cold for life.",
        "More gas = a thicker blanket = a hotter Earth.",
      ],
      visual: { diagram: "greenhouse-blanket" },
    },
    {
      type: "slide", mood: "unsure",
      title: "What causes climate change?",
      text: "People are adding more greenhouse gases to the air.",
      points: [
        "Burning coal, oil and gas for power, transport and factories releases CO₂.",
        "Cutting down forests: fewer trees to take CO₂ out of the air.",
        "Livestock, rubbish dumps and some farming release methane.",
      ],
      visual: { picture: "fossil-causes" },
    },
  ],
  facilitatorNotes: [
    "Definition (UN): climate change refers to long-term shifts in temperatures and weather patterns. Since the 1800s, human activities have been the main driver, mainly burning fossil fuels.",
    "Weather vs climate: weather is the conditions today or this week; climate is the average over a long time (scientists usually use 30 years). Ask: \"What changes have your parents or grandparents seen in the rains?\"",
    "The greenhouse effect is natural and keeps the Earth warm enough for life. The problem is the EXTRA gases people add, which thicken the blanket.",
    "2024 was the warmest year on record, about 1.55 °C above the late-1800s average; long-term warming is about 1.3 °C (WMO).",
  ],
  links: [L.wmo],
};

// ------------------------------------------------------------
// SCENE 2: How does it affect us?
// ------------------------------------------------------------
const howItAffectsUs: PlayableScene = {
  id: "climate-affects",
  number: 2,
  title: "How does it affect us?",
  idea: "Floods, drought, heat, food, water and health, and who is hit hardest",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "worried",
      title: "Wanjiku's bad year",
      text: "The rains came late, and her maize dried up. Then rain fell so hard that it washed her soil away.",
      visual: WANJIKU,
    },
    {
      // TODO: swap the icon for a flood photo when we have one.
      type: "slide", mood: "worried",
      title: "More floods",
      text: "A flood is when water covers land that is normally dry.",
      points: [
        "Warmer air holds more water, so rain falls harder.",
        "Rivers overflow, and homes, roads and farms are washed away.",
      ],
      visual: { icon: "🌊" },
    },
    {
      type: "slide", mood: "worried",
      title: "More droughts",
      text: "A drought is a long time with much less rain than normal.",
      points: [
        "Heat dries out soil and water faster.",
        "Crops fail, and animals die without water and pasture.",
      ],
      visual: { photo: PHOTOS.droughtMaize },
    },
    {
      type: "slide", mood: "worried",
      title: "Kenya's worst drought in 40 years",
      text: "Millions of people needed food aid, and millions of animals died.",
      visual: { stat: { value: "5", label: "rainy seasons failed in a row (2020–2022)" } },
    },
    {
      type: "slide", mood: "unsure",
      title: "More heat",
      text: "A heatwave is a spell of unusually hot days.",
      points: [
        "It harms health, especially for babies and older people.",
        "It scorches crops and stresses livestock.",
      ],
      visual: { photo: PHOTOS.heatMaize },
    },
    {
      type: "slide", mood: "thinking",
      title: "Food, water and health",
      text: "Climate change affects what we eat and drink, and how healthy we are.",
      points: [
        "Smaller harvests mean less food and higher prices.",
        "Floods can spread diseases like cholera.",
        "Malaria mosquitoes can spread to cooler highland areas.",
      ],
      visual: { icon: "🌾💧" },
    },
    {
      type: "slide", mood: "thinking",
      title: "Who is hit hardest?",
      text: "People who depend most on the weather, and have the least to fall back on.",
      points: [
        "Farmers and herders who rely on rain, like Wanjiku.",
        "Families living in informal settlements or near rivers.",
        "Women, children, older people and people with disabilities.",
      ],
      visual: { photo: PHOTOS.floodsSettlement },
    },
    {
      type: "slide", mood: "unsure",
      title: "Is it fair?",
      text: "No. Africa produces less than 4% of the world's greenhouse gases, but is among the hardest hit. This is called climate justice.",
      visual: {
        compare: [
          { icon: "🏭", title: "Caused most of it", text: "Rich, industrial countries" },
          { icon: "🌍", title: "Feels it strongly", text: "Africa, which caused very little" },
        ],
      },
    },
  ],
  facilitatorNotes: [
    "Kenya: five rainy seasons in a row failed in 2020–2022 (the longest drought in 40 years); the 2024 long-rains floods displaced over 200,000 people; Lake Victoria reached a record 13.42 m in May 2020.",
    "Why heavier rain: warmer air can hold about 7% more water vapour for every 1 °C of warming, so when it rains, it can pour.",
    "Ask: \"Which of these have you seen where you live?\" Let a few people share before moving on.",
    "Fairness: Africa accounts for less than 4% of global greenhouse gas emissions, but is among the most vulnerable regions. This is often called climate justice.",
  ],
};

// ------------------------------------------------------------
// SCENE 3: What is the world doing? (policy + the one exercise)
// ------------------------------------------------------------
const climatePolicy: PlayableScene = {
  id: "climate-policy",
  number: 3,
  title: "What is the world doing?",
  idea: "Climate policy: the Paris Agreement, Kenya's plan, mitigation and adaptation",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide",
      title: "What can be done?",
      text: "Wanjiku can't fix the climate alone. So what are countries doing, and what can she do?",
      visual: WANJIKU,
    },
    {
      type: "slide",
      title: "What is climate policy?",
      text: "Climate policy is the laws, plans and agreements that governments make to tackle climate change.",
      points: [
        "Global: agreements between countries, like the Paris Agreement.",
        "National: each country's own laws and plans.",
        "Local: county plans, e.g. for water and farming.",
      ],
      visual: { icon: "📜" },
    },
    {
      type: "slide",
      title: "The Paris Agreement (2015)",
      text: "A promise by almost every country in the world to limit global warming.",
      points: [
        "Keep warming well below 2 °C, and try to stop at 1.5 °C.",
        "Every country writes its own climate plan (an NDC).",
        "Plans are updated every 5 years, each one stronger.",
      ],
      visual: { picture: "paris-promise" },
    },
    {
      type: "slide",
      title: "Kenya's plan",
      text: "Kenya's Climate Change Act (2016) is the law that guides how Kenya responds to climate change.",
      points: [
        "Kenya plans to cut its emissions by 32% by 2030.",
        "It also plans how people and farms will adapt.",
        "A National Climate Change Council, led by the President, oversees the work.",
      ],
      visual: { stat: { value: "32%", label: "cut in emissions planned by 2030" } },
    },
    {
      type: "slide",
      title: "Two ways to act",
      text: "We need both.",
      visual: {
        compare: [
          { icon: "✂️", title: "Mitigation", text: "Reducing the greenhouse gases we release, so warming slows down" },
          { icon: "🛡️", title: "Adaptation", text: "Changing how we live and farm, so climate change harms us less" },
        ],
      },
    },
    {
      type: "slide",
      title: "Mitigation: cut the gases",
      text: "Clean power instead of coal, oil and gas.",
      points: [
        "Kenya gets most of its electricity from clean sources: geothermal, water, wind and sun.",
        "The Lake Turkana wind farm is one of the biggest in Africa.",
        "Planting trees and protecting forests also helps.",
      ],
      visual: { photo: PHOTOS.windTurkana },
    },
    {
      type: "slide",
      title: "Adaptation: get ready",
      text: "Preparing for the changes that are already happening.",
      points: [
        "Saving rainwater in tanks and pans for the dry months.",
        "Planting drought-tolerant seed.",
        "Early warnings, so people can act before floods and droughts.",
      ],
      visual: { photo: PHOTOS.waterTanks },
    },
    {
      type: "slide", mood: "happy",
      title: "Back to Wanjiku",
      text: "She can't stop climate change alone, but she can adapt: plant drought-tolerant seed, and save rainwater.",
      visual: WANJIKU,
    },
    {
      type: "interactive", activity: "cut-or-adapt", prompt: "Mitigation or adaptation?",
      help: "Tap the right group for each card.",
    },
    {
      part: 5, type: "lesson",
      title: "What we learned",
      rows: [
        { label: "Climate change", text: "A long-term shift in the Earth's usual temperatures and weather patterns." },
        { label: "Cause", text: "Extra greenhouse gases from burning coal, oil and gas, and cutting forests." },
        { label: "Effects", text: "More floods, droughts and heat; less food and water. The poor are hit hardest." },
        { label: "Action", text: "Paris Agreement and Kenya's plan. Mitigation (cut the gases) and adaptation (get ready)." },
      ],
      tumainiSays: "How can Wanjiku adapt? Let's find out in Module 2!",
    },
  ],
  facilitatorNotes: [
    "The Paris Agreement (adopted December 2015 at COP21): keep warming well below 2 °C and try to limit it to 1.5 °C. Each country writes its own plan, a Nationally Determined Contribution (NDC), and updates it every 5 years.",
    "Kenya's Climate Change Act came into force in May 2016. It set up the National Climate Change Council (chaired by the President) and the Climate Change Directorate. Kenya's updated NDC (2020) aims to cut emissions by 32% by 2030 compared with business as usual, and includes adaptation.",
    "The UN Framework Convention on Climate Change (UNFCCC, 1992) is the treaty behind the yearly COP meetings; the Paris Agreement sits under it.",
    "Mitigation = reduce the gases (solar, wind, geothermal, trees, clean stoves). Adaptation = prepare for the changes (drought seed, water harvesting, early warnings, raised houses). Some actions do both, e.g. trees.",
  ],
  links: CLIMATE_LINKS,
};

// ------------------------------------------------------------
// The whole of Part 1
// ------------------------------------------------------------
export const EPISODE_0: EpisodeContent = {
  scenes: [whatItIs, howItAffectsUs, climatePolicy],
  quiz: [
    {
      question: "What is climate change?",
      options: [
        { text: "A long-term shift in the usual weather pattern", correct: true },
        { text: "The weather today" },
        { text: "Only very hot days" },
      ],
      praise: "Yes! Climate is the pattern over many years, and it is shifting.",
      hint: "Weather is today. Climate is the pattern over many years. Try again!",
    },
    {
      question: "What makes the Earth warmer?",
      options: [
        { text: "Burning coal, oil and gas, and cutting forests", correct: true },
        { text: "Too much rain" },
        { text: "The moon" },
      ],
      praise: "Correct! These thicken the blanket of gases.",
      hint: "Think about the blanket of gases. Try again!",
    },
    {
      question: "What did the Paris Agreement promise?",
      options: [
        { text: "Keep warming below 2 °C, and try for 1.5 °C", correct: true },
        { text: "Stop all rain" },
        { text: "Build more coal power stations" },
      ],
      praise: "Right! Below 2 °C, and try for 1.5 °C.",
      hint: "It is about limiting warming. Try again!",
    },
    {
      question: "Planting drought-tolerant seed is…",
      options: [
        { text: "Adaptation: getting ready", correct: true },
        { text: "Mitigation: cutting the gases" },
      ],
      praise: "Yes! It doesn't cut gases, but it helps crops survive.",
      hint: "Does it cut gases, or help us cope? Try again!",
    },
  ],
  summary: {
    points: [
      "Climate change: a long-term shift in the Earth's usual temperatures and weather patterns",
      "Cause: extra greenhouse gases from burning coal, oil and gas, and cutting forests",
      "Effects: more floods, droughts and heat; less food and water; the poor are hit hardest",
      "Action: the Paris Agreement, Kenya's plan, mitigation and adaptation",
    ],
    message: "Climate change is already here. We must cut the gases AND get ready.",
  },
  links: CLIMATE_LINKS,
  teaser: {
    text: "Next: how can Wanjiku, and all of us, adapt and bounce back?",
    picture: "river-storm",
    mood: "thinking",
  },
};
