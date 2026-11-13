// ============================================================
// PART 4 CONTENT: "Decisions"
// ------------------------------------------------------------
// How AI and people use predictions to decide. Hands-on: four
// short, calm tasks, one for each method.
//
//   Scene 1  Where will it hit?      risk map            (Task 1: risk map)
//   Scene 2  Decision trees          decision tree,      (Task 2: walk the tree)
//                                    random forest       (Task 3: the forest votes)
//   Scene 3  Grouping and deciding   clustering          (Task 4: group the villages)
//                                    uncertainty, people decide, the big picture
//
// Villages, numbers and votes are made-up examples for teaching.
// TODO: swap the 🤝 icon for a community-meeting photo.
// ============================================================

import type { EpisodeContent, PlayableScene } from "../types";
import { PHOTOS } from "../photos";
import { AGREEMENT_LINKS as L } from "../episode0/content";

// ------------------------------------------------------------
// SCENE 1: Where will it hit?
// ------------------------------------------------------------
const whereWillItHit: PlayableScene = {
  id: "decide-where",
  number: 1,
  title: "Where will it hit?",
  idea: "From prediction to decision, and risk maps",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "worried",
      title: "Who do we help first?",
      text: "Heavy rain is forecast. There are 2 rescue boats and 4 villages. Where should help go first?",
      visual: { photo: PHOTOS.floodsAerial },
    },
    {
      type: "slide", mood: "thinking",
      title: "From prediction to decision",
      text: "A forecast tells us WHAT may happen. Knowing the risk tells us WHERE it will hurt most.",
      visual: {
        steps: {
          items: [
            { icon: "🌧️", title: "Forecast" },
            { icon: "⚠️", title: "Risk" },
          ],
          joiner: "+",
          result: "Decision",
        },
      },
    },
    {
      type: "slide",
      title: "What is a risk map?",
      text: "A risk map shows where harm is most likely, by putting hazard, exposure and vulnerability on one map.",
      points: ["Red areas: highest risk. Help goes there first.", "Counties use risk maps to plan for floods and drought."],
      visual: { icon: "🗺️" },
    },
    {
      type: "interactive", activity: "risk-map", prompt: "Read the risk map",
      help: "Switch on the layers. Then tap the village most at risk.",
    },
  ],
  facilitatorNotes: [
    "A risk map combines layers: the hazard (where water goes), exposure (homes, schools, roads, farms) and vulnerability (who will struggle to cope). Overlapping layers show the hot spots.",
    "In Kenya, the National Disaster Operations Centre, NDMA and county governments use risk and hazard maps for planning. Satellites and AI increasingly help draw them.",
    "Ask: \"If you drew a risk map of your area, where would the red zones be?\"",
  ],
};

// ------------------------------------------------------------
// SCENE 2: Decision trees and random forests
// ------------------------------------------------------------
const decisionTrees: PlayableScene = {
  id: "decide-trees",
  number: 2,
  title: "Decision trees",
  idea: "Decision trees and random forests (supervised learning)",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "thinking",
      title: "What is a decision tree?",
      text: "A decision tree makes a decision by asking a series of yes/no questions, one after another.",
      points: [
        "Each answer leads to the next question.",
        "The last step is the decision.",
        "AI can learn the best questions from past floods: supervised learning.",
      ],
      visual: { icon: "🌳" },
    },
    {
      type: "interactive", activity: "walk-tree", prompt: "Walk the decision tree",
      help: "Answer each question about a household near the river.",
    },
    {
      type: "slide", mood: "excited",
      title: "What is a random forest?",
      text: "A random forest is many decision trees working together. Each tree looks at different data, then they vote.",
      points: ["One tree can make mistakes.", "The majority vote of many trees is usually more reliable."],
      visual: { icon: "🌳🌳🌳" },
    },
    {
      type: "interactive", activity: "forest-vote", prompt: "The forest votes",
      help: "Tap the button to see what each tree decides.",
    },
  ],
  facilitatorNotes: [
    "A decision tree splits data with simple questions (e.g. \"river forecast above 3 m?\"). Trained on past cases with known outcomes, it is supervised learning.",
    "A random forest trains many trees on different random samples of the data and features, then takes a majority vote. It is usually more accurate and stable than a single tree.",
    "The tree and votes in these tasks are made-up examples for teaching.",
  ],
};

// ------------------------------------------------------------
// SCENE 3: Grouping and deciding
// ------------------------------------------------------------
const deciding: PlayableScene = {
  id: "decide-well",
  number: 3,
  title: "Grouping and deciding",
  idea: "Clustering (unsupervised), uncertainty, and people decide",
  setting: "house",
  cast: ["tumaini"],
  beats: [
    {
      part: 1, type: "slide", mood: "thinking",
      title: "What is clustering?",
      text: "Clustering means putting similar things into groups. The AI finds the groups by itself, with no answers given.",
      points: ["This is unsupervised learning.", "Villages with similar risks end up in the same group, so help can be planned for each group."],
      visual: { icon: "🏘️" },
    },
    {
      type: "interactive", activity: "group-villages", prompt: "Group the villages",
      help: "Read each village's clues. Put it in a group, then compare with the AI.",
    },
    {
      type: "slide", mood: "unsure",
      title: "What is uncertainty?",
      text: "Uncertainty means we can't be 100% sure. A forecast may say a 70% chance of flooding.",
      points: [
        "Acting and no flood comes: some cost and effort.",
        "Not acting and a flood comes: homes, crops and lives lost.",
        "So we often act early, even when we're not certain.",
      ],
      visual: { stat: { value: "70%", label: "chance of flooding (example)" } },
    },
    {
      type: "slide",
      title: "People decide, not models",
      text: "Models and AI give advice. People make the final decision.",
      points: ["Communities know their land and neighbours.", "County officials plan the response.", "Everyone checks: does this prediction make sense?"],
      visual: { icon: "🤝" },
    },
    {
      type: "slide", mood: "excited",
      title: "The big picture",
      text: "This is how numbers and AI help us live with a changing climate.",
      visual: {
        steps: {
          items: [
            { icon: "📊", title: "Data" },
            { icon: "🔮", title: "Prediction" },
            { icon: "🏃", title: "Early action" },
            { icon: "💪", title: "Resilience" },
          ],
          joiner: "→",
        },
      },
    },
    {
      part: 5, type: "lesson",
      title: "What we learned",
      rows: [
        { label: "Risk map", text: "Shows where harm is most likely, so help goes there first." },
        { label: "Decision tree & random forest", text: "Yes/no questions lead to a decision; many trees vote for a better answer." },
        { label: "Clustering", text: "AI groups similar villages by itself (unsupervised)." },
        { label: "Deciding", text: "Act early, even with uncertainty. Models advise; people decide." },
      ],
      tumainiSays: "You've finished the course! Data, prediction, early action, resilience.",
    },
  ],
  facilitatorNotes: [
    "Clustering (e.g. k-means) groups items by similarity without labels: unsupervised learning. Here, villages are grouped by distance to the river, land height and flood history.",
    "Anticipatory action: humanitarian agencies and governments increasingly act on forecasts (e.g. releasing cash or supplies) before a disaster, using agreed thresholds.",
    "Close the course by asking: \"What is one thing you will do differently when you hear a forecast?\"",
  ],
  links: [L.sendai, L.kenyaNdc],
};

// ------------------------------------------------------------
// The whole of Part 4
// ------------------------------------------------------------
export const PART_4: EpisodeContent = {
  scenes: [whereWillItHit, decisionTrees, deciding],
  quiz: [
    {
      question: "What does a risk map show?",
      options: [{ text: "Where harm is most likely", correct: true }, { text: "Tomorrow's weather only" }, { text: "Roads for tourists" }],
      praise: "Yes! It combines hazard, exposure and vulnerability.",
      hint: "Think about where help should go first. Try again!",
    },
    {
      question: "What is a random forest?",
      options: [
        { text: "Many decision trees that vote together", correct: true },
        { text: "A forest that grows randomly" },
        { text: "One very big decision tree" },
      ],
      praise: "Correct! The majority vote is usually more reliable.",
      hint: "Think about the five trees voting. Try again!",
    },
    {
      question: "AI groups villages by their clues, with no answers given. What is this called?",
      options: [{ text: "Clustering (unsupervised learning)", correct: true }, { text: "Linear regression" }, { text: "A threshold" }],
      praise: "Right! It finds the groups by itself.",
      hint: "No answers were given. Try again!",
    },
    {
      question: "Who makes the final decision?",
      options: [{ text: "People", correct: true }, { text: "The AI model" }, { text: "Nobody" }],
      praise: "Yes! Models advise; people decide.",
      hint: "Models give advice. Try again!",
    },
  ],
  summary: {
    points: [
      "Risk maps show where harm is most likely",
      "Decision trees ask yes/no questions; random forests let many trees vote",
      "Clustering groups similar villages by itself (unsupervised)",
      "Act early, even with uncertainty: models advise, people decide",
    ],
    message: "Data → prediction → early action → resilience.",
  },
  links: [L.sendai, L.kenyaNdc, L.paris],
  recap: {
    text: "Last time: data, graphs and models like y = mx + c help us predict, and thresholds tell us when to act.",
  },
  teaser: {
    text: "You've finished all four modules! Share what you learned with your family and community.",
    picture: "notebook-teaser",
    mood: "excited",
  },
};
