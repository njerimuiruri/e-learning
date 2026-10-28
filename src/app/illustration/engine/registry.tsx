// ============================================================
// REGISTRY
// ------------------------------------------------------------
// Links the names used in content files (like "notebook") to
// the actual components that draw them. When you build a new
// activity, teaser picture or explaining picture, add it here.
// ============================================================

import type { ComponentType } from "react";
import type { ActivityId, IdeaPicture, IdeaPictureId, PictureId } from "../types";
// Episode 0
import GreenhouseActivity from "../episode0/GreenhouseActivity";
import NotebookTeaserPicture from "../episode0/NotebookTeaserPicture";
import { EPISODE0_PICTURES } from "../episode0/IdeaPictures";
import { AI_OR_NOT, CUT_OR_ADAPT, LEARN_SORT } from "../episode0/content";
import { makeCardSort } from "./CardSortActivity";
// Episode 1
import NotebookActivity from "../episode1/NotebookActivity";
import SkyGuessActivity from "../episode1/SkyGuessActivity";
import { PlayYearActivity, LateRainsActivity } from "../episode1/SeasonActivities";
import RiverStormPicture from "../episode1/RiverStormPicture";
import { EPISODE1_PICTURES } from "../episode1/IdeaPictures";
// Episode 2
import StormGraph from "../episode2/StormGraph";
import BeatTheComputer from "../episode2/BeatTheComputer";
import RiverForecast from "../episode2/RiverForecast";
import LeafSorter from "../episode2/LeafSorter";
import AILearns from "../episode2/AILearns";
import AISorter from "../episode2/AISorter";
import { EPISODE2_PICTURES } from "../episode2/IdeaPictures";
import PlantingDayPicture from "../episode2/PlantingDayPicture";
// Episode 3
import FirstQuestionPicker from "../episode3/FirstQuestionPicker";
import TreeGrower from "../episode3/TreeGrower";
import { EPISODE3_PICTURES } from "../episode3/IdeaPictures";
// Episode 4
import { BrainTrainer, ForestChange, NextWord, PhoneChat, PixelZoom, StormCheck, TeachLabels } from "../episode4/Activities";
import ExamRobotsPicture from "../episode4/ExamRobotsPicture";
import { EPISODE4_PICTURES } from "../episode4/IdeaPictures";

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
  // Episode 0
  greenhouse: GreenhouseActivity,
  "cut-or-adapt": makeCardSort(CUT_OR_ADAPT),
  "ai-or-not": makeCardSort(AI_OR_NOT),
  "learn-sort": makeCardSort(LEARN_SORT),
  // Episode 1
  notebook: NotebookActivity,
  "sky-guess": SkyGuessActivity,
  "play-year": PlayYearActivity,
  "late-rains": LateRainsActivity,
  // Episode 2
  "storm-graph": StormGraph,
  "beat-the-computer": BeatTheComputer,
  "river-forecast": RiverForecast,
  "leaf-sorter": LeafSorter,
  "ai-learns": AILearns,
  "ai-sorter": AISorter,
  // Episode 3
  "first-question": FirstQuestionPicker,
  "grow-tree": TreeGrower,
  // Episode 4
  "pixel-zoom": PixelZoom,
  "teach-labels": TeachLabels,
  "forest-change": ForestChange,
  "brain-trainer": BrainTrainer,
  "storm-check": StormCheck,
  "next-word": NextWord,
  "phone-chat": PhoneChat,
};

/** Pictures for the "Next time…" teaser. */
export const PICTURES: Record<PictureId, ComponentType> = {
  "river-storm": RiverStormPicture,
  "planting-day": PlantingDayPicture,
  "notebook-teaser": NotebookTeaserPicture,
  "exam-robots": ExamRobotsPicture,
};

/** The small explaining pictures shown beside speech bubbles, from every episode. */
export const IDEA_PICTURES: Record<Exclude<IdeaPictureId, "big-message">, IdeaPicture> = {
  ...EPISODE0_PICTURES,
  ...EPISODE1_PICTURES,
  ...EPISODE2_PICTURES,
  ...EPISODE3_PICTURES,
  ...EPISODE4_PICTURES,
};
