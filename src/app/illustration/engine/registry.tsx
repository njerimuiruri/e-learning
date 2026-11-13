// ============================================================
// REGISTRY
// ------------------------------------------------------------
// Links the names used in content files (like "cut-or-adapt") to
// the actual components that draw them. When you build a new
// activity, teaser picture or explaining picture, add it here.
// ============================================================

import type { ComponentType } from "react";
import type { ActivityId, IdeaPicture, IdeaPictureId, PictureId } from "../types";
// Part 1: Climate change
import GreenhouseActivity from "../episode0/GreenhouseActivity";
import NotebookTeaserPicture from "../episode0/NotebookTeaserPicture";
import { EPISODE0_PICTURES } from "../episode0/IdeaPictures";
import { AI_OR_NOT, CUT_OR_ADAPT, LEARN_SORT } from "../episode0/content";
import { makeCardSort } from "./CardSortActivity";
// Part 2: Adaptation & resilience
import { LATE_RAINS } from "../part2/content";
import { makeChoice } from "./ChoiceActivity";
// Part 3: Modelling
import RiverModelActivity from "../part3/RiverModelActivity";
import { RainByMonth, RiverModel, TemperatureTrend } from "../part3/Charts";
import type { ChartId } from "../types";
// Part 4: Decisions
import RiskMapActivity from "../part4/RiskMapActivity";
import DecisionTreeActivity from "../part4/DecisionTreeActivity";
import ForestVoteActivity from "../part4/ForestVoteActivity";
import GroupVillagesActivity from "../part4/GroupVillagesActivity";
// Shared
import RiverStormPicture from "../components/RiverStormPicture";

/** Every activity receives these. */
export interface ActivityProps {
  /** true if the audience already finished this task (e.g. after pressing Back) */
  done: boolean;
  /** Call this when the task is finished, to unlock "Next". */
  onComplete: () => void;
  /** Tell the 🔊 button what Tumaini is saying right now. */
  onSpeech: (text: string) => void;
}

export const ACTIVITIES: Record<ActivityId, ComponentType<ActivityProps>> = {
  greenhouse: GreenhouseActivity,
  "cut-or-adapt": makeCardSort(CUT_OR_ADAPT),
  "ai-or-not": makeCardSort(AI_OR_NOT),
  "learn-sort": makeCardSort(LEARN_SORT),
  "late-rains-choice": makeChoice(LATE_RAINS),
  "river-model": RiverModelActivity,
  "risk-map": RiskMapActivity,
  "walk-tree": DecisionTreeActivity,
  "forest-vote": ForestVoteActivity,
  "group-villages": GroupVillagesActivity,
};

/** The simple still charts used on slides. */
export const CHARTS: Record<ChartId, ComponentType> = {
  "rain-by-month": RainByMonth,
  "temperature-trend": TemperatureTrend,
  "river-model": RiverModel,
};

/** Pictures for the "Next time…" teaser. */
export const PICTURES: Record<PictureId, ComponentType> = {
  "river-storm": RiverStormPicture,
  "notebook-teaser": NotebookTeaserPicture,
};

/** The small explaining pictures shown beside speech bubbles. */
export const IDEA_PICTURES: Record<Exclude<IdeaPictureId, "big-message">, IdeaPicture> = {
  ...EPISODE0_PICTURES,
};
