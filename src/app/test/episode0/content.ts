// ============================================================
// EPISODE 0 CONTENT: "The Big Picture"
// ------------------------------------------------------------
// The foundation for the whole series, before any AI method:
//   🌍 What is climate change?        (weather vs climate, the greenhouse blanket, Kenya)
//   🤝 The Paris Agreement            (1.5 °C / 2 °C, every country's plan, cut vs adapt)
//   🤖 What is AI?                    (AI, machine learning, supervised vs unsupervised)
//   🌦️ Why AI for climate?            (huge data, early warnings, and AI's own footprint)
//
// Facts checked against: WMO State of the Global Climate 2024; the
// IEA "Energy and AI" report (2025); Kenya's updated NDC (2020);
// ReliefWeb / Kenya Ministry of Interior (2024 floods); the Lake
// Victoria Basin Commission (2020 record level); WMO (2020–22 drought).
// See docs/tumaini/climate-and-ai-coverage.md for the sources.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import type { CardSortConfig } from "../engine/CardSortActivity";

const MAIN_MESSAGE =
  "I learn patterns from past data, so I can warn people early, and they can act early!";

// ------------------------------------------------------------
// CARD GAMES (used by the card-sort activity in engine/CardSortActivity.tsx)
// ------------------------------------------------------------
export const CUT_OR_ADAPT: CardSortConfig = {
  bins: [
    { emoji: "✂️", label: "Cut the gases" },
    { emoji: "🛡️", label: "Adapt and be ready" },
  ],
  cards: [
    { emoji: "☀️", text: "Solar and geothermal power instead of coal", bin: 0, why: "Clean power makes far less of the gases that thicken the blanket." },
    { emoji: "📱", text: "Flood warnings by SMS", bin: 1, why: "A warning doesn't stop the flood, but it gives people time to get ready." },
    { emoji: "🌳", text: "Protecting forests and planting trees", bin: 0, why: "Trees take carbon dioxide out of the air. (They also hold soil and water, so they help us adapt too!)" },
    { emoji: "🌱", text: "Drought-tolerant seed", bin: 1, why: "It doesn't change the climate, but it helps crops survive dry spells." },
    { emoji: "🍳", text: "Cleaner cooking stoves", bin: 0, why: "They burn less wood and charcoal, so less smoke and gas goes into the air." },
    { emoji: "🏠", text: "Raising houses near the river", bin: 1, why: "It keeps families safe when floods come." },
  ],
  finish: "Great sorting! The world needs BOTH: cutting the gases AND adapting.",
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
const ALL_LINKS = [L.paris, L.unfccc, L.sdg13, L.sendai, L.kenyaNdc, L.kenyaAct, L.unesco, L.auAi, L.kenyaAi, L.wmo, L.iea];

// ------------------------------------------------------------
// THE STORY: The Big Picture
// ------------------------------------------------------------
const story: PlayableScene = {
  id: "big-picture",
  number: 0,
  title: "Our Changing Climate, and a Robot Called Tumaini",
  idea: "Climate change, the Paris Agreement, AI and machine learning",
  setting: "house",
  mamaHolds: "notebook",
  cast: ["mama", "otieno", "tumaini"],
  lateArrivals: ["tumaini"],
  walkIn: ["mama", "otieno"],
  chapters: {
    1: { icon: "🌍", label: "Climate change" },
    2: { icon: "🤝", label: "The Paris Agreement" },
    3: { icon: "🤖", label: "What is AI?" },
    4: { icon: "🌦️", label: "Why AI for climate?" },
    5: { icon: "📝", label: "What we learned" },
  },
  facilitatorNotes: [
    "This episode gives the big picture before the AI methods in Episodes 1–5. Take your time here: everything later builds on it.",
    "Weather vs climate: weather is what happens today; climate is the usual pattern over many years (scientists usually look at 30 years). Ask: \"What changes have your parents or grandparents seen in the rains?\"",
    "The greenhouse effect: gases such as carbon dioxide (CO₂) and methane trap heat like a blanket. Since the 1800s, burning coal, oil and gas and cutting forests have thickened it. 2024 was the warmest year on record, about 1.55 °C above the late-1800s average; long-term warming is about 1.3–1.4 °C (WMO).",
    "Kenya: Lake Victoria reached a record 13.42 m in May 2020; five rainy seasons in a row failed in 2020–2022 (the longest drought in 40 years); the 2024 long-rains floods displaced over 200,000 people.",
    "Fairness: African countries have released only a small share of the world's greenhouse gases, but are among the hardest hit. This is often called climate justice.",
    "The Paris Agreement (adopted December 2015, in force November 2016): keep warming well below 2 °C and try to limit it to 1.5 °C. Each country writes its own plan (an NDC) and updates it every 5 years. Kenya's updated NDC (2020) aims to cut emissions by 32% by 2030 compared with business as usual, and includes adaptation.",
    "AI: computer programs that do tasks that usually need human thinking. Machine learning = learning patterns from examples instead of following rules a person wrote. Supervised learning uses examples WITH answers (labels); unsupervised learning finds groups WITHOUT answers. Episodes 1–3 show both in action.",
    "Other climate agreements: the UN Framework Convention on Climate Change (UNFCCC, 1992) is the treaty behind all the yearly COP meetings; the Paris Agreement sits under it. In 2015 the world also agreed the Sustainable Development Goals (SDG 13: climate action) and the Sendai Framework for Disaster Risk Reduction 2015–2030, whose Target G is more early warning systems for people by 2030. Kenya's Climate Change Act came into force in May 2016.",
    "AI agreements: UNESCO's Recommendation on the Ethics of AI (November 2021, all 193 member states) includes protecting the environment. The African Union's Continental AI Strategy was endorsed in July 2024. Kenya launched its National AI Strategy 2025–2030 in March 2025; agriculture and sustainability are among its priority areas.",
    "Be honest about AI's costs: data centres used about 1.5% of the world's electricity in 2024, and this could roughly double by 2030 (IEA). AI should be used where it really helps, and powered with clean energy.",
  ],
  links: ALL_LINKS,
  beats: [
    // 🌍 Climate change
    {
      part: 1, type: "say", who: "mama", mood: "worried",
      text: "When I was a girl, the long rains came every March, like clockwork. Now they come late, or they come all at once and flood the river.",
    },
    {
      type: "say", who: "otieno", mood: "curious",
      text: "Why is the weather changing, Grandma?",
    },
    {
      type: "say", who: "tumaini", mood: "happy", enters: true, action: "wave", picture: "weather-vs-climate",
      text: "Hello! I'm Tumaini, a robot that learns. Let me help. WEATHER is what happens today: rain, sun, wind. CLIMATE is the usual pattern over many years. Climate change means that usual pattern is shifting.",
    },
    {
      type: "interactive", activity: "greenhouse", prompt: "Why is the Earth getting warmer?",
      help: "Move the slider from long ago to today. Watch the blanket of gases get thicker, more heat get trapped, and the thermometer rise.",
    },
    {
      type: "say", who: "tumaini", mood: "thinking", picture: "fossil-causes",
      text: "Gases like carbon dioxide act like a blanket around the Earth. Burning coal, oil and gas, for power stations, cars and factories, and cutting down forests make the blanket thicker. Today the world is about 1.3 °C warmer than in the 1800s, and 2024 was the hottest year ever measured.",
    },
    {
      type: "say", who: "mama", mood: "worried", picture: "kenya-impacts",
      text: "And we feel it here. In 2020, Lake Victoria rose higher than ever recorded. From 2020 to 2022, five rainy seasons in a row failed. In 2024, floods forced over 200,000 Kenyans from their homes.",
    },
    {
      optional: true, type: "say", who: "otieno", mood: "thinking",
      text: "But Africa burned very little of that coal and oil. That doesn't seem fair!",
    },
    {
      optional: true, type: "say", who: "tumaini", mood: "unsure",
      text: "You're right. Africa caused only a small part of the problem, but feels it strongly. That's one reason the whole world agreed to work together.",
    },

    // 🤝 The Paris Agreement
    {
      part: 2, type: "say", who: "otieno", mood: "excited", picture: "paris-promise",
      text: "We learned this at school! In 2015, almost every country in the world signed the Paris Agreement. They promised to keep warming well below 2 °C, and to try hard to stop at 1.5 °C.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "To keep that promise, there are two kinds of action. CUT: make less of the gases that thicken the blanket. ADAPT: get ready for the changes that are already happening. Let's sort some examples!",
    },
    {
      type: "interactive", activity: "cut-or-adapt", prompt: "Cut the gases, or adapt and be ready?",
      help: "Read each card and tap the group it belongs in. Tumaini will tell you why.",
    },
    {
      type: "say", who: "tumaini", mood: "happy",
      text: "Every country writes its own climate plan and updates it every 5 years. Kenya's plan aims to cut its emissions by 32% by 2030, and to help people adapt. My job is mostly on the ADAPT side: helping people get warnings early.",
    },
    {
      type: "say", who: "tumaini", mood: "thinking", picture: "climate-promises",
      text: "Paris isn't the only promise. In 1992, countries agreed the UN climate treaty that all later climate talks build on. In 2015, they also agreed the Sustainable Development Goals (Goal 13 is climate action) and the Sendai Framework, which aims to give far more people early warnings of disasters by 2030. And Kenya has its own Climate Change Act, from 2016.",
    },

    // 🤖 What is AI?
    {
      part: 3, type: "say", who: "otieno", mood: "curious",
      text: "So what exactly IS AI, Tumaini?",
    },
    {
      type: "say", who: "tumaini", mood: "excited", picture: "rules-vs-learning",
      text: "AI means artificial intelligence: computer programs that do things that usually need human thinking, like spotting patterns, making predictions or understanding language. Most AI today learns from examples instead of following rules a person wrote. That is called machine learning.",
    },
    {
      type: "interactive", activity: "ai-or-not", prompt: "AI or not AI?",
      help: "Does it LEARN from examples, or does it just follow fixed rules? Tap your answer for each card.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "supervised-unsupervised",
      text: "Machines learn in two main ways. SUPERVISED learning: every example comes with the answer, like leaves labelled \"healthy\" or \"sick\". UNSUPERVISED learning: no answers are given, and the machine finds groups by itself, like villages with similar problems.",
    },
    {
      type: "interactive", activity: "learn-sort", prompt: "Supervised or unsupervised?",
      help: "Ask yourself: does each example come with its answer? If yes, it's supervised. If not, it's unsupervised.",
    },

    // 🌦️ Why AI for climate?
    {
      part: 4, type: "predict", who: "mama",
      question: "Why do YOU think AI is useful for climate problems?",
      options: [
        { text: "It can read huge amounts of data fast", emoji: "📊" },
        { text: "It can spot patterns people might miss", emoji: "🔍" },
        { text: "It can help warn people early", emoji: "⏰" },
      ],
      reply: "In fact, all three are true! Let me show you.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "climate-big-data",
      text: "Rain gauges, weather stations and satellites send millions of numbers every day. That's far too much for people to read, but I can find the patterns in it quickly. Then people get warnings early, and can plan ahead.",
    },
    {
      type: "say", who: "tumaini", mood: "unsure", picture: "ai-footprint",
      text: "One honest thing: AI runs on big computers that use a lot of electricity and water. They already use about 1.5% of the world's electricity. So AI should be used where it really helps, and powered with clean energy, like Kenya's geothermal and solar.",
    },
    {
      type: "say", who: "tumaini", mood: "happy", picture: "ai-promises",
      text: "There are promises about AI too. In 2021, all 193 member countries of UNESCO agreed that AI must be fair, safe, open about how it works, and good for people and the planet. In 2024, the African Union agreed a plan for AI that works for Africa. In 2025, Kenya launched its own National AI Strategy, with farming and sustainability among its priorities.",
    },
    {
      type: "say", who: "mama", mood: "proud",
      text: "So AI won't stop climate change by itself. But it can help us prepare. And people still make the decisions.",
    },

    // 📝 What we learned
    {
      part: 5, type: "lesson",
      title: "Today we learned: the big picture",
      rows: [
        { label: "Climate change", text: "The usual weather pattern is shifting, because gases from burning coal, oil and gas, and from cutting forests, trap more heat. Kenya already feels it: floods, droughts, late rains." },
        { label: "Paris Agreement", text: "In 2015, almost every country promised to keep warming well below 2 °C, and try for 1.5 °C. Two kinds of action: CUT the gases, and ADAPT." },
        { label: "AI", text: "Computer programs that do things that usually need human thinking." },
        {
          label: "Machine learning", text: "AI that learns patterns from examples instead of following rules a person wrote.",
          list: ["Supervised: the examples come with answers (\"healthy\" or \"sick\")", "Unsupervised: no answers; the machine finds groups by itself"],
        },
        { label: "Why AI for climate", text: "It finds patterns in huge amounts of weather data and helps warn people early. Use it wisely: it needs energy too." },
        {
          label: "Other promises", text: "The world has made more promises that link climate and AI (tap one to read it):",
          list: [
            { text: "1992: the UN climate treaty", href: L.unfccc.href },
            { text: "2015: the Paris Agreement", href: L.paris.href },
            { text: "2015: Sustainable Development Goal 13, climate action", href: L.sdg13.href },
            { text: "2015: the Sendai Framework (early warnings for all)", href: L.sendai.href },
            { text: "2016: Kenya's Climate Change Act", href: L.kenyaAct.href },
            { text: "2021: UNESCO's ethics of AI", href: L.unesco.href },
            { text: "2024: the African Union's AI strategy", href: L.auAi.href },
            { text: "2025: Kenya's National AI Strategy", href: L.kenyaAi.href },
          ],
        },
      ],
      tumainiSays: "Now let's see AI at work! First, I learn from Mama's notebook.",
    },
  ],
};

// ------------------------------------------------------------
// The whole episode
// ------------------------------------------------------------
export const EPISODE_0: EpisodeContent = {
  scenes: [story],
  quiz: [
    {
      question: "What is climate change?",
      options: [
        { text: "A long-term shift in the usual weather patterns", correct: true },
        { text: "The weather today" },
        { text: "Only very hot days" },
      ],
      praise: "Yes! Climate is the pattern over many years, and that pattern is shifting.",
      hint: "Remember: weather is today, climate is the pattern over many years. Try again!",
    },
    {
      question: "What did countries promise in the Paris Agreement?",
      options: [
        { text: "To keep warming well below 2 °C, and try for 1.5 °C", correct: true },
        { text: "To stop all rain" },
        { text: "To build more coal power stations" },
      ],
      praise: "Correct! Well below 2 °C, and try hard for 1.5 °C.",
      hint: "Remember the marks on the thermometer? Try again!",
    },
    {
      question: "A computer learns from leaves labelled \"healthy\" or \"sick\". What kind of learning is that?",
      options: [
        { text: "Supervised learning", correct: true },
        { text: "Unsupervised learning" },
        { text: "No learning at all" },
      ],
      praise: "Right! The examples come with answers, so it's supervised.",
      hint: "Does each example come with its answer? Try again!",
    },
    {
      question: "Why is AI useful for climate problems?",
      options: [
        { text: "It finds patterns in huge amounts of data and helps warn people early", correct: true },
        { text: "It controls the weather" },
        { text: "It replaces farmers" },
      ],
      praise: "Yes! AI helps people prepare. People still make the decisions.",
      hint: "Can a computer control the rain? Try again!",
    },
  ],
  summary: {
    points: [
      "Climate change: the usual weather pattern is shifting, and Kenya already feels it",
      "The Paris Agreement: well below 2 °C, try for 1.5 °C; cut the gases AND adapt",
      "AI learns patterns from examples: machine learning",
      "Supervised (answers given) and unsupervised (finds groups alone)",
      "AI helps by finding patterns in huge data and warning early, if used wisely",
    ],
    message: MAIN_MESSAGE,
  },
  links: ALL_LINKS,
  teaser: {
    text: "Next time, Mama shows me her old weather notebook, and I try to learn when the rain will come!",
    picture: "notebook-teaser",
    mood: "excited",
  },
};
