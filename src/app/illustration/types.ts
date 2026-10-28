// ============================================================
// TYPES
// ------------------------------------------------------------
// These describe the "shape" of our data. TypeScript uses them
// to warn us if, for example, we spell a mood wrong or forget
// a scene title. They don't appear on the page.
// ============================================================

import type { ComponentType, ReactNode } from "react";

export type CharacterId = "tumaini" | "mama" | "otieno" | "baba";

export type TumainiMood = "happy" | "thinking" | "confused" | "excited" | "unsure" | "worried";
export type MamaMood = "happy" | "worried" | "proud" | "curious";
export type OtienoMood = "curious" | "excited" | "thinking" | "happy";
export type BabaMood = "calm" | "worried" | "proud";
export type Mood = TumainiMood | MamaMood | OtienoMood | BabaMood;

export type Setting = "house" | "farm" | "river";
/** What Mama can hold in her hands */
export type MamaHolds = "notebook" | "seeds" | "phone";
export type CropStage = "bare" | "sprouts" | "growing" | "tall" | "cobs" | "golden" | "dried";

// Pictures that can be used for the "Next time…" teaser.
export type PictureId = "river-storm" | "planting-day" | "notebook-teaser" | "exam-robots";
export type IconName = "globe" | "notebook" | "gauge" | "tree" | "satellite" | "shield";

// Small explaining pictures that pop up beside a speech bubble.
// Each episode draws its own in episodeN/IdeaPictures.tsx, and
// engine/registry.tsx puts them all together.
export type Episode1PictureId =
  | "dry-seeds"
  | "notebook"
  | "mangoes"
  | "learn-flow"
  | "clues"
  | "many-days"
  | "two-seasons"
  | "wasted-seed"
  | "timetable"
  | "late-rain"
  | "saved-seed";
export type Episode2PictureId =
  // Scene 3
  | "flooded-house"
  | "storm-notebook"
  | "bus-fare"
  | "y-mx-c"
  | "safe-uphill"
  // Scene 4
  | "spreading-disease"
  | "photo-check"
  | "tomato-sorting"
  | "ask-expert";
// "big-message" is the 4-step main message, shared by every episode.
export type Episode3PictureId = "plant-timing" | "three-questions" | "doctor-questions";
export type Episode0PictureId =
  | "weather-vs-climate"
  | "fossil-causes"
  | "kenya-impacts"
  | "paris-promise"
  | "rules-vs-learning"
  | "supervised-unsupervised"
  | "climate-big-data"
  | "ai-footprint"
  | "climate-promises"
  | "ai-promises";
export type Episode4PictureId = "forest-mud" | "neuron-relay";
export type IdeaPictureId = Episode0PictureId | Episode1PictureId | Episode2PictureId | Episode3PictureId | Episode4PictureId | "big-message";

/** One explaining picture: the drawing, a caption, and words for screen readers. */
export interface IdeaPicture {
  caption: string;
  label: string;
  draw: ReactNode;
}

// The interactive parts we have built. Add a new name here when you
// build a new activity, then register it in engine/registry.tsx.
export type ActivityId =
  // Episode 1
  | "notebook"
  | "sky-guess"
  | "play-year"
  | "late-rains"
  // Episode 2
  | "storm-graph"
  | "beat-the-computer"
  | "river-forecast"
  | "leaf-sorter"
  | "ai-learns"
  | "ai-sorter"
  // Episode 3
  | "first-question"
  | "grow-tree"
  // Episode 4
  | "pixel-zoom"
  | "teach-labels"
  | "forest-change"
  | "brain-trainer"
  | "storm-check"
  | "next-word"
  | "phone-chat"
  // Episode 0
  | "greenhouse"
  | "cut-or-adapt"
  | "ai-or-not"
  | "learn-sort";

// Every scene follows the same 6 parts:
// 1 the problem, 2 "it's like…", 3 Tumaini learns, 4 Tumaini helps,
// 5 lesson board, 6 check question.
export type ScenePart = 1 | 2 | 3 | 4 | 5 | 6;

// Little movements a character can make during their line.
export type StageAction = "show-notebook" | "wave" | "jump";

// ---------- Beats: the steps inside a scene ----------

/** Things every beat can have. */
interface BaseBeat {
  /** Put this on the FIRST beat of each part. Later beats carry it on. */
  part?: ScenePart;
  /**
   * true = a nice extra that the "⚡ Short version" skips.
   * (Never mark a beat optional if a character "enters" on it.)
   */
  optional?: boolean;
  /** Change the background from this beat on (e.g. from the river to the farm). Later beats carry it on. */
  setting?: Setting;
}

/** One choice in a "What do YOU think?" guess. */
export interface PredictOption {
  text: string;
  emoji?: string;
}

/** The audience guesses first, before Tumaini learns. There is no wrong answer. */
export interface PredictBeat extends BaseBeat {
  type: "predict";
  who: CharacterId;
  question: string;
  options: PredictOption[];
  /** What Tumaini says after the guess (default: "Let's find out!") */
  reply?: string;
}

/** A character speaks in a speech bubble. */
export interface SayBeat extends BaseBeat {
  type: "say";
  who: CharacterId;
  mood: Mood;
  text: string;
  /** true = this character arrives on stage at this beat (e.g. Tumaini rolls in). */
  enters?: boolean;
  /** Characters who walk onto the stage at this beat (e.g. after moving to a new place). */
  walkIn?: CharacterId[];
  /** A small explaining picture shown beside the bubble. */
  picture?: IdeaPictureId;
  /** A movement the speaker makes. */
  action?: StageAction;
}

/** The audience must do something before "Next" unlocks. */
export interface InteractiveBeat extends BaseBeat {
  type: "interactive";
  activity: ActivityId;
  prompt: string;
  /** A simple "what to do" line shown under the prompt. */
  help?: string;
}

/** Something that is not a character speaks, like a radio. */
export interface AnnounceBeat extends BaseBeat {
  type: "announce";
  source: "radio";
  text: string;
}

/** A link to read more, e.g. the official text of an agreement. */
export interface LearnMoreLink {
  label: string;
  href: string;
}

/** A line in a lesson-board list: plain words, or words that are a link. */
export type ListItem = string | { text: string; href: string };

/** The words of a list item (for reading aloud and timing). */
export const itemText = (item: ListItem) => (typeof item === "string" ? item : item.text);

/** The chalkboard drops down with the key idea. */
export interface LessonBeat extends BaseBeat {
  type: "lesson";
  title: string;
  /** Each row: a label, its text, and (optionally) a short list under it. A list item can be a link. */
  rows: { label: string; text: string; list?: ListItem[] }[];
  /** Optional words Tumaini says while pointing at the board. */
  tumainiSays?: string;
}

export interface AnswerOption {
  text: string;
  correct?: boolean;
}

/** A multiple-choice check question. "Next" unlocks after the right answer. */
export interface QuestionBeat extends BaseBeat {
  type: "question";
  who: CharacterId;
  question: string;
  options: AnswerOption[];
  correctReply: string;
  wrongReply: string;
}

export type Beat = SayBeat | AnnounceBeat | PredictBeat | InteractiveBeat | LessonBeat | QuestionBeat;

// ---------- Scenes and episodes ----------

/** The short scene info shown in lists. */
export interface SceneSummary {
  number: number;
  title: string;
  idea: string;
}

/** A fully built scene that can be played. */
export interface PlayableScene extends SceneSummary {
  id: string;
  setting: Setting;
  /** Who stands on the stage, from left to right. */
  cast: CharacterId[];
  /** Characters who only appear from their "enters" beat onwards. */
  lateArrivals?: CharacterId[];
  /** Characters who walk onto the stage when the scene starts. */
  walkIn?: CharacterId[];
  /** What Mama holds in this scene (default: her notebook at the house) */
  mamaHolds?: MamaHolds;
  /** What Mama holds in each place, if it changes during the story (overrides mamaHolds there) */
  mamaHoldsBySetting?: Partial<Record<Setting, MamaHolds>>;
  /**
   * Who is on stage in each place, if it changes during the scene
   * (e.g. Baba stays at the river). Default: "cast".
   */
  castBySetting?: Partial<Record<Setting, CharacterId[]>>;
  /** The scene's own names for its parts in the journey bar, e.g. { 2: { icon: "📈", label: "Predict a number" } } */
  chapters?: Partial<Record<ScenePart, { icon: string; label: string }>>;
  beats: Beat[];
  facilitatorNotes: string[];
  /** Links for the facilitator panel (official texts, sources) */
  links?: LearnMoreLink[];
  dataNote?: string;
}

export interface QuizQuestion {
  question: string;
  options: AnswerOption[];
  praise: string;
  hint: string;
}

/** Everything needed to play an episode from start to finish. */
export interface EpisodeContent {
  scenes: PlayableScene[];
  quiz: QuizQuestion[];
  summary: {
    points: string[];
    message: string;
  };
  teaser: {
    text: string;
    picture: PictureId;
    /** How Tumaini looks while it says the teaser (default: worried) */
    mood?: TumainiMood;
  };
  /** Optional links to read more (official texts of agreements, sources), shown on the summary */
  links?: LearnMoreLink[];
  /** Optional "Last time…" card shown before the title card */
  recap?: {
    text: string;
  };
  /**
   * While an episode is being built: true = after the last built
   * scene, show a "more coming" card instead of the quiz and summary.
   */
  draft?: boolean;
  /** While building: an optional test panel to show on the "more coming" card. */
  draftExtra?: ComponentType;
}

export interface Episode {
  number: number;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  time: string;
  icon: IconName;
  color: string;
  textColor: string;
  scenes: SceneSummary[];
  /** Only episodes that have been built have content. The rest show a placeholder. */
  content?: EpisodeContent;
  /** While building: a test panel shown on the placeholder page, before any scene exists. */
  sneakPeek?: ComponentType;
}
