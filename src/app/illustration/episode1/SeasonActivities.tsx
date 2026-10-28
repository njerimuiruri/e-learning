"use client";

// ============================================================
// SCENE 2 ACTIVITIES
// ------------------------------------------------------------
// PlayYearActivity   -> "Play the year": the wheel moves month
//                       by month and the farm changes with it.
// LateRainsActivity  -> a switch shows a year when the long
//                       rains came late, and Tumaini warns Mama.
//
// Both use the same layout: the rainfall wheel on one side,
// the farm on the other, controls underneath.
// ============================================================

import { useEffect, useState, type ReactNode } from "react";
import type { ActivityProps } from "../engine/registry";
import type { CropStage, MamaMood, TumainiMood } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";
import RainWheel from "./RainWheel";
import FarmView from "./FarmView";
import { FARM_CALENDAR, LATE_RAIN, MONTHS, NORMAL_RAIN } from "./content";

const MONTH_TIME = 1500; // milliseconds per month when playing

// ---------- Shared layout ----------
interface SeasonLayoutProps {
  values: number[];
  compare?: number[];
  month: number;
  seasons: boolean;
  crop: CropStage;
  mamaMood: MamaMood;
  sign: string;
  alert?: boolean;
  tumaini: { mood: TumainiMood; text: string };
  onMonth: (m: number) => void;
  children: ReactNode; // the buttons for this activity
}

function SeasonLayout({ values, compare, month, seasons, crop, mamaMood, sign, alert, tumaini, onMonth, children }: SeasonLayoutProps) {
  const rain = Math.round(values[month]);
  return (
    <div className="tm-activity">
      <div className="tm-seasons">
        <div className="tm-wheel-box">
          <RainWheel values={values} compare={compare} month={month} seasons={seasons} />
          <p className="tm-wheel-key">
            <span aria-hidden="true">🍕</span> Each slice is one month. <strong>Longer slice = more rain.</strong>
          </p>
          {compare && (
            <p className="tm-legend">
              <span className="tm-legend-dash" aria-hidden="true" /> Normal year
            </p>
          )}
        </div>

        <div className="tm-farm-box">
          <div className="tm-month-banner">
            <strong>{MONTHS[month]}</strong>
            <span>
              🌧️ {rain} mm of rain
            </span>
          </div>
          <FarmView rain={rain} crop={crop} mamaMood={mamaMood} label={`Mama's farm in ${MONTHS[month]}: ${sign}`} />
          <p className={`tm-farm-sign ${alert ? "is-alert" : ""}`} aria-live="polite">
            {sign}
          </p>
        </div>
      </div>

      <div className="tm-activity-controls">
        <label className="tm-slider">
          <span>Pick a month</span>
          <input
            type="range"
            min={0}
            max={11}
            step={1}
            value={month}
            onChange={(e) => onMonth(Number(e.target.value))}
            aria-valuetext={MONTHS[month]}
          />
        </label>
        <div className="tm-activity-buttons">{children}</div>
      </div>

      <div className="tm-feedback">
        {alert && (
          <span className="tm-alert-icon" aria-hidden="true">
            ⚠️
          </span>
        )}
        <Tumaini mood={tumaini.mood} size={110} />
        <SpeechBubble text={tumaini.text} name="Tumaini" small />
      </div>
    </div>
  );
}

// ============================================================
// "Play the year"
// ============================================================

export function PlayYearActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Which months have been shown so far. After all 12, the seasons appear.
  const [seen, setSeen] = useState<boolean[]>(() => MONTHS.map((_, i) => done || i === 0));
  const fullYear = seen.every(Boolean);

  // Mark each month as seen when we land on it.
  useEffect(() => {
    setSeen((s) => (s[month] ? s : s.map((v, i) => v || i === month)));
  }, [month]);

  // While playing, move to the next month every 1.5 seconds.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (month < 11) setMonth(month + 1);
      else setPlaying(false); // stop at December
    }, MONTH_TIME);
    return () => clearTimeout(timer);
  }, [playing, month]);

  useEffect(() => {
    if (fullYear) onComplete();
  }, [fullYear, onComplete]);

  const { activity, crop } = FARM_CALENDAR[month];
  const tumaini = fullYear
    ? { mood: "excited" as const, text: "Look! Two humps of rain every year. That's the pattern!" }
    : playing
      ? { mood: "thinking" as const, text: "I'm watching the rain, month by month…" }
      : { mood: "happy" as const, text: "Press Play and I'll study the whole year!" };

  useEffect(() => {
    onSpeech(`${MONTHS[month]}. ${NORMAL_RAIN[month]} millimetres of rain. ${activity}`);
  }, [month, activity, onSpeech]);

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (month === 11) setMonth(0); // start again from January
    setPlaying(true);
  };

  return (
    <SeasonLayout
      values={NORMAL_RAIN}
      month={month}
      seasons={fullYear}
      crop={crop}
      mamaMood={month === 6 ? "proud" : "happy"}
      sign={activity}
      tumaini={tumaini}
      onMonth={(m) => {
        setPlaying(false);
        setMonth(m);
      }}
    >
      <button type="button" className={`tm-button tm-button-big ${month === 0 && !playing && !fullYear ? "tm-attention" : ""}`} onClick={play}>
        {playing ? "⏸ Pause" : month === 11 ? "↺ Play the year again" : "▶ Play the year"}
      </button>
    </SeasonLayout>
  );
}

// ============================================================
// "Show a year when the long rains came late"
// ============================================================

const DRIED_SIGN = "Mama planted as usual… but the rain didn't come. The seeds dried out.";
const WARNING = "Warning! This March is much drier than normal. Wait before planting!";

export function LateRainsActivity({ done, onComplete, onSpeech }: ActivityProps) {
  const [late, setLate] = useState(false);
  const [triedSwitch, setTriedSwitch] = useState(done);
  const [month, setMonth] = useState(2); // start in March

  useEffect(() => {
    if (triedSwitch) onComplete();
  }, [triedSwitch, onComplete]);

  const lateMarch = late && month === 2;
  const { activity, crop } = FARM_CALENDAR[month];
  const sign = lateMarch ? DRIED_SIGN : activity;

  const tumaini = lateMarch
    ? { mood: "excited" as const, text: WARNING }
    : late
      ? { mood: "thinking" as const, text: "The dashed line shows a normal year. See how this year is different?" }
      : { mood: "happy" as const, text: "This is a normal year. Turn on the switch to see a year when the rains came late." };

  useEffect(() => {
    onSpeech(`${sign} ${tumaini.text}`);
  }, [sign, tumaini.text, onSpeech]);

  const toggle = () => {
    const turningOn = !late;
    setLate(turningOn);
    if (turningOn) {
      setMonth(2); // jump to March, when Mama plants
      setTriedSwitch(true);
    }
  };

  return (
    <SeasonLayout
      values={late ? LATE_RAIN : NORMAL_RAIN}
      compare={late ? NORMAL_RAIN : undefined}
      month={month}
      seasons
      crop={lateMarch ? "dried" : crop}
      mamaMood={lateMarch ? "worried" : "happy"}
      sign={sign}
      alert={lateMarch}
      tumaini={tumaini}
      onMonth={setMonth}
    >
      <button type="button" role="switch" aria-checked={late} className={`tm-switch ${late ? "is-on" : ""} ${triedSwitch ? "" : "tm-attention"}`} onClick={toggle}>
        <span className="tm-switch-track" aria-hidden="true">
          <span className="tm-switch-knob" />
        </span>
        <span>Show a year when the long rains came late</span>
      </button>
    </SeasonLayout>
  );
}
