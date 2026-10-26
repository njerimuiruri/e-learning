// ============================================================
// BRAIN MATHS  (the logic behind chapter 2: neural networks)
// ------------------------------------------------------------
// A tiny neural network:
//   4 inputs (clouds, humidity, wind, temperature, each 0–10 ÷ 10)
//   → 3 hidden neurons → 1 output neuron = "chance of a storm"
//
// Each connection has a WEIGHT (its strength). A neuron adds up
// its inputs × weights, then squashes the total into 0–1 with the
// "sigmoid" curve: very negative → near 0, very positive → near 1.
//
// LEARNING (backpropagation): guess, compare with the real answer,
// then nudge every weight a little in the direction that makes the
// mistake smaller. Repeat many small times.
//
// Checked: before learning it gets 4 of 8 days right; after the
// 8 lessons it gets 8 of 8; for today's weather (8, 9, 6, 7) it
// says about 90% storm.
// ============================================================

export interface Brain {
  /** w1[input][hidden]: input → hidden connections */
  w1: number[][];
  b1: number[];
  /** w2[hidden]: hidden → output connections */
  w2: number[];
  b2: number;
}

/** A weather day: four dials (0–10) and whether a storm came. */
export interface Day {
  dials: [number, number, number, number];
  storm: boolean;
}

export const LEARNING_RATE = 1;
export const STEPS_PER_LESSON = 15;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** A seeded random number maker: the same "random" start every time. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A brand-new brain with small random weights (it knows nothing yet). */
export function newBrain(seed = 7): Brain {
  const random = seededRandom(seed);
  const w = () => random() * 2 - 1;
  return {
    w1: [0, 1, 2, 3].map(() => [w(), w(), w()]),
    b1: [w(), w(), w()],
    w2: [w(), w(), w()],
    b2: w(),
  };
}

/** Dials 0–10 → inputs 0–1. */
export const toInputs = (dials: number[]) => dials.map((v) => v / 10);

/**
 * Run the brain forwards: inputs → hidden neurons → output.
 * Returns how strongly each neuron "fires" (0–1) and the chance of a storm.
 */
export function forward(brain: Brain, inputs: number[]): { hidden: number[]; output: number } {
  const hidden = [0, 1, 2].map((j) => sigmoid(brain.b1[j] + inputs.reduce((sum, x, i) => sum + x * brain.w1[i][j], 0)));
  const output = sigmoid(brain.b2 + hidden.reduce((sum, h, j) => sum + h * brain.w2[j], 0));
  return { hidden, output };
}

/** One small learning step on some days. Returns a NEW brain (the old one is unchanged). */
export function trainStep(brain: Brain, days: Day[], learningRate = LEARNING_RATE): Brain {
  const g = { w1: brain.w1.map((r) => r.map(() => 0)), b1: [0, 0, 0], w2: [0, 0, 0], b2: 0 };
  for (const day of days) {
    const x = toInputs(day.dials);
    const { hidden, output } = forward(brain, x);
    // How wrong was the guess? (positive = guessed too high)
    const outError = output - (day.storm ? 1 : 0);
    g.b2 += outError;
    for (let j = 0; j < 3; j++) {
      g.w2[j] += outError * hidden[j];
      // Pass the blame back to each hidden neuron, by how much it contributed
      const hiddenError = outError * brain.w2[j] * hidden[j] * (1 - hidden[j]);
      g.b1[j] += hiddenError;
      for (let i = 0; i < 4; i++) g.w1[i][j] += hiddenError * x[i];
    }
  }
  // Nudge every weight a little against its blame
  const k = learningRate / days.length;
  return {
    w1: brain.w1.map((row, i) => row.map((w, j) => w - k * g.w1[i][j])),
    b1: brain.b1.map((b, j) => b - k * g.b1[j]),
    w2: brain.w2.map((w, j) => w - k * g.w2[j]),
    b2: brain.b2 - k * g.b2,
  };
}

/** One lesson: several small steps on all the days seen so far. */
export function learn(brain: Brain, daysSeen: Day[], steps = STEPS_PER_LESSON): Brain {
  let b = brain;
  for (let s = 0; s < steps; s++) b = trainStep(b, daysSeen);
  return b;
}

/** The chance of a storm, as a whole percentage (capped at 1–99%: never totally sure). */
export function stormPercent(brain: Brain, dials: number[]): number {
  return Math.min(99, Math.max(1, Math.round(forward(brain, toInputs(dials)).output * 100)));
}

/** How many days the brain gets right (over 50% = "storm"). */
export function accuracy(brain: Brain, days: Day[]): number {
  return days.filter((d) => forward(brain, toInputs(d.dials)).output > 0.5 === d.storm).length;
}

/** The brain after learning all the days, one lesson at a time (used after the teaching). */
export function trainedBrain(days: Day[]): Brain {
  let b = newBrain();
  days.forEach((_, i) => {
    b = learn(b, days.slice(0, i + 1));
  });
  return b;
}
