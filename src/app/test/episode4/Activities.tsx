"use client";

import { useEffect, useState } from "react";
import type { ActivityProps } from "../engine/registry";
import NeuralNet from "./NeuralNet";
import Phone, { type ChatMessage } from "./Phone";
import Satellite from "./Satellite";
import SatelliteView, { cellKey, LandKey } from "./SatelliteView";
import {
  CHAT,
  DAYS,
  DIAL_NAMES,
  END_ONLY,
  MAP_2005,
  MAP_2025,
  NEXT_WORDS,
  SENTENCE_START,
  TODAY,
  MAX_ADDED_WORDS,
} from "./content";
import {
  hasEveryLabel,
  labelByNearestExample,
  plantingSquares,
  forestPercent,
  type Example,
  type LandType,
} from "./imageMath";
import { accuracy, learn, newBrain, stormPercent, trainedBrain } from "./brainMath";

export function PixelZoom({ done, onComplete, onSpeech }: ActivityProps) {
  const [zoomed, setZoomed] = useState(done);

  useEffect(() => {
    if (zoomed) onComplete();
    onSpeech(zoomed ? "Each square is a pixel with a number." : "Let's zoom in on the satellite picture.");
  }, [zoomed, onComplete, onSpeech]);

  return (
    <div className="tm-activity">
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Satellite size={110} />
        <SatelliteView cells={MAP_2005} zoom={zoomed ? "pixels" : "picture"} label="Satellite view of the land in 2005" />
      </div>
      <p>{zoomed ? "Each square now shows its greenness number." : "This is the land seen from above."}</p>
      <button type="button" className="tm-button tm-button-big" onClick={() => setZoomed(true)} disabled={zoomed}>
        🔍 Zoom in
      </button>
    </div>
  );
}

const LAND_TYPES: LandType[] = ["forest", "farm", "water"];

export function TeachLabels({ done, onComplete, onSpeech }: ActivityProps) {
  const [selected, setSelected] = useState<LandType>("forest");
  const [examples, setExamples] = useState<Example[]>(() =>
    done
      ? LAND_TYPES.flatMap((label) => {
          const cell = MAP_2005.find((candidate) => candidate.type === label);
          return cell ? [{ row: cell.row, col: cell.col, label }] : [];
        })
      : [],
  );
  const complete = hasEveryLabel(examples);
  const labels = examples.length ? labelByNearestExample(MAP_2005, examples) : undefined;

  useEffect(() => {
    if (complete) onComplete();
    onSpeech(complete ? "Tumaini can now label the map using your examples." : "Choose a label, then tap a matching square.");
  }, [complete, onComplete, onSpeech]);

  const addExample = (cell: (typeof MAP_2005)[number]) => {
    setExamples((current) => [
      ...current.filter((example) => example.row !== cell.row || example.col !== cell.col),
      { row: cell.row, col: cell.col, label: selected },
    ]);
  };

  return (
    <div className="tm-activity">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {LAND_TYPES.map((label) => (
          <button
            key={label}
            type="button"
            className="tm-button"
            aria-pressed={selected === label}
            onClick={() => setSelected(label)}
          >
            {label === "forest" ? "🌳" : label === "farm" ? "🌾" : "💧"} {label}
          </button>
        ))}
      </div>
      <SatelliteView
        cells={MAP_2005}
        zoom="picture"
        labels={labels}
        examples={examples}
        onCellClick={addExample}
        label="Tap squares to show Tumaini examples of forest, farm and water"
      />
      <LandKey withLabels />
      <p aria-live="polite">
        Examples: {LAND_TYPES.filter((label) => examples.some((example) => example.label === label)).join(", ") || "none yet"}
        {complete ? " — all three labels taught!" : " — teach all three labels to continue."}
      </p>
    </div>
  );
}

export function ForestChange({ done, onComplete, onSpeech }: ActivityProps) {
  const [year, setYear] = useState<2005 | 2025>(2005);
  const [asked, setAsked] = useState(done);
  const cells = year === 2005 ? MAP_2005 : MAP_2025;
  const targetSquares = plantingSquares(MAP_2005, MAP_2025);
  const stats = forestPercent(cells);

  useEffect(() => {
    if (asked) onComplete();
    onSpeech(asked ? `Forest cover changed from ${forestPercent(MAP_2005).percent}% to ${forestPercent(MAP_2025).percent}%.` : "Compare the two years, then ask where to plant trees.");
  }, [asked, onComplete, onSpeech]);

  return (
    <div className="tm-activity">
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[2005, 2025].map((value) => (
          <button key={value} type="button" className="tm-button" aria-pressed={year === value} onClick={() => setYear(value as 2005 | 2025)}>
            {value}
          </button>
        ))}
      </div>
      <SatelliteView
        cells={cells}
        zoom="picture"
        highlight={asked ? new Set(targetSquares.map(cellKey)) : undefined}
        label={`Satellite view of the land in ${year}${asked ? ", with suggested planting areas highlighted" : ""}`}
      />
      <LandKey />
      <p>Forest covers {stats.percent}% of the land in {year}.</p>
      <button type="button" className="tm-button tm-button-big" onClick={() => setAsked(true)} disabled={asked}>
        🌱 Ask Tumaini where to plant
      </button>
      {asked && <p aria-live="polite">Start with the {targetSquares.length} red squares near the river.</p>}
    </div>
  );
}

export function BrainTrainer({ done, onComplete, onSpeech }: ActivityProps) {
  const [learned, setLearned] = useState(done ? DAYS.length : 0);
  const [brain, setBrain] = useState(() => (done ? trainedBrain(DAYS) : newBrain()));
  const dials = DAYS[Math.min(learned, DAYS.length - 1)].dials;
  const complete = learned === DAYS.length;

  useEffect(() => {
    if (complete) onComplete();
    onSpeech(complete ? "The brain learned from all eight days." : `Tumaini has learned from ${learned} of ${DAYS.length} weather days.`);
  }, [complete, learned, onComplete, onSpeech]);

  const teachDay = () => {
    if (complete) return;
    const nextLearned = learned + 1;
    setBrain((current) => learn(current, DAYS.slice(0, nextLearned)));
    setLearned(nextLearned);
  };

  return (
    <div className="tm-activity">
      <NeuralNet brain={brain} dials={dials} pulse={learned} label={`Tumaini's neural network after learning ${learned} days`} />
      <p>Days learned: <strong>{learned}</strong> of {DAYS.length}; currently correct: {accuracy(brain, DAYS)} of {DAYS.length}.</p>
      <button type="button" className="tm-button tm-button-big" onClick={teachDay} disabled={complete}>
        🧠 Show Tumaini a day
      </button>
      <p>Inputs: {DIAL_NAMES.map((dial, index) => `${dial.name} ${dials[index]}`).join(" · ")}</p>
    </div>
  );
}

export function StormCheck({ done, onComplete, onSpeech }: ActivityProps) {
  const [dials, setDials] = useState<number[]>([...TODAY]);
  const [checked, setChecked] = useState(done);
  const brain = trainedBrain(DAYS);
  const chance = stormPercent(brain, dials);

  useEffect(() => {
    if (checked) onComplete();
    onSpeech(`Tumaini estimates a ${chance}% chance of a storm.`);
  }, [checked, chance, onComplete, onSpeech]);

  return (
    <div className="tm-activity">
      <NeuralNet brain={brain} dials={dials} pulse={checked ? 1 : 0} label={`Trained neural network predicts a ${chance}% chance of a storm`} />
      <div style={{ display: "grid", gap: 8, maxWidth: 520, margin: "16px auto" }}>
        {DIAL_NAMES.map((dial, index) => (
          <label key={dial.name}>
            {dial.icon} {dial.name}: <strong>{dials[index]}</strong>
            <input
              type="range"
              min={0}
              max={10}
              value={dials[index]}
              onChange={(event) => setDials((current) => current.map((value, i) => (i === index ? Number(event.target.value) : value)))}
            />
          </label>
        ))}
      </div>
      <button type="button" className="tm-button tm-button-big" onClick={() => setChecked(true)} disabled={checked}>
        ⛈️ Ask Tumaini
      </button>
      {checked && <p aria-live="polite">{chance}% chance of a storm. Baba should stay on shore if the risk is high.</p>}
    </div>
  );
}

export function NextWord({ done, onComplete, onSpeech }: ActivityProps) {
  const [words, setWords] = useState<string[]>(() =>
    done ? [...SENTENCE_START, "rains", "begin", "."] : [...SENTENCE_START],
  );
  const complete = words[words.length - 1] === "." || words.length - SENTENCE_START.length >= MAX_ADDED_WORDS;
  const options = NEXT_WORDS[words[words.length - 1].toLowerCase()] ?? END_ONLY;

  useEffect(() => {
    if (complete) onComplete();
    onSpeech(`The sentence so far is: ${words.join(" ")}`);
  }, [complete, words, onComplete, onSpeech]);

  const addWord = (word: string) => {
    if (complete) return;
    setWords((current) => [...current, word]);
  };

  return (
    <div className="tm-activity">
      <p aria-live="polite" style={{ fontSize: "1.3rem", fontWeight: 800 }}>{words.join(" ")}</p>
      <p>Choose a possible next word:</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(([word, likelihood]) => (
          <button key={word} type="button" className="tm-button" onClick={() => addWord(word)} disabled={complete}>
            {word} <small>{likelihood}%</small>
          </button>
        ))}
        <button type="button" className="tm-button tm-button-secondary" onClick={() => addWord(options[0][0])} disabled={complete}>
          Let Tumaini pick
        </button>
      </div>
      <p>{complete ? "Sentence complete!" : `Words added: ${words.length - SENTENCE_START.length} of ${MAX_ADDED_WORDS}`}</p>
    </div>
  );
}

export function PhoneChat({ done, onComplete, onSpeech }: ActivityProps) {
  const [step, setStep] = useState(done ? 2 : 0);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    done
      ? [
          { from: "me", text: CHAT.kiswahili.question, translation: CHAT.kiswahili.questionEnglish },
          { from: "bot", text: CHAT.kiswahili.answer, translation: CHAT.kiswahili.answerEnglish },
          { from: "me", text: CHAT.tricky.question },
          { from: "bot", text: CHAT.tricky.answer },
        ]
      : [],
  );

  useEffect(() => {
    if (step === 2) onComplete();
    onSpeech(step === 0 ? "Ask the phone Mama's question." : step === 1 ? "Now try the question nobody can know exactly." : "Check important answers with a person.");
  }, [step, onComplete, onSpeech]);

  const send = () => {
    if (step === 0) {
      setMessages([
        { from: "me", text: CHAT.kiswahili.question, translation: CHAT.kiswahili.questionEnglish },
        { from: "bot", text: CHAT.kiswahili.answer, translation: CHAT.kiswahili.answerEnglish },
      ]);
      setStep(1);
      return;
    }
    if (step === 1) {
      setMessages((current) => [
        ...current,
        { from: "me", text: CHAT.tricky.question },
        { from: "bot", text: CHAT.tricky.answer },
      ]);
      setStep(2);
    }
  };

  return (
    <div className="tm-activity">
      <Phone
        messages={messages}
        draft={step === 0 ? CHAT.kiswahili.question : step === 1 ? CHAT.tricky.question : ""}
        draftNote={step === 0 ? CHAT.kiswahili.questionEnglish : undefined}
        onSend={step < 2 ? send : undefined}
      />
      {step === 2 && <p aria-live="polite">Chatbots can sound certain and still be wrong. Check important advice with an expert.</p>}
    </div>
  );
}
