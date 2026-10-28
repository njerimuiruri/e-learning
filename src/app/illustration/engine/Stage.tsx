"use client";

// ============================================================
// STAGE
// ------------------------------------------------------------
// The big picture area of a scene: the background, the
// characters standing in a row, the speech bubble above them,
// and (sometimes) a small picture card explaining the idea.
//
// To make it feel alive:
//   • characters can WALK in (Tumaini ROLLS in, wheels turning)
//   • the speaker's mouth moves while their words are typing
//   • everyone else leans a little towards the speaker
//   • a speaker can do an action: show the notebook, wave, jump
// ============================================================

import { useEffect, useState, type CSSProperties } from "react";
import type { CharacterId, IdeaPictureId, Mood, Setting, StageAction } from "../types";
import Background from "../components/Backgrounds";
import Character, { CHARACTER_NAMES } from "../characters/Character";
import SpeechBubble from "../components/SpeechBubble";
import IdeaPictureCard from "./IdeaPictureCard";

const WALK_TIME = 1600; // ms, how long walking in takes

// A crackling radio with sound waves, for "announce" beats.
function Radio() {
  return (
    <svg className="tm-radio" viewBox="0 0 120 100" role="img" aria-label="A radio crackling with the weather forecast">
      {/* Sound waves */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          className="tm-radio-wave"
          style={{ animationDelay: `${i * 0.25}s` }}
          d={`M${96 + i * 8} ${40 - i * 6} q${8 + i * 3} ${18 + i * 6} 0 ${36 + i * 12}`}
          stroke="#F2B544"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <line x1="30" y1="34" x2="14" y2="6" stroke="#13303A" strokeWidth="4" strokeLinecap="round" />
      <rect x="8" y="32" width="86" height="56" rx="12" fill="#A4532F" stroke="#13303A" strokeWidth="4" />
      <circle cx="34" cy="60" r="16" fill="#5F3E25" stroke="#13303A" strokeWidth="3" />
      {[52, 60, 68].map((y) => (
        <line key={y} x1="22" y1={y} x2="46" y2={y} stroke="#C9B48A" strokeWidth="2.5" />
      ))}
      <rect x="58" y="44" width="28" height="12" rx="3" fill="#F2D27A" stroke="#13303A" strokeWidth="2.5" />
      <circle cx="64" cy="72" r="6" fill="#F2B544" stroke="#13303A" strokeWidth="2.5" />
      <circle cx="80" cy="72" r="6" fill="#F2B544" stroke="#13303A" strokeWidth="2.5" />
    </svg>
  );
}

interface StageProps {
  setting: Setting;
  cast: CharacterId[];
  moods: Partial<Record<CharacterId, Mood>>;
  speaker?: CharacterId;
  text?: string;
  /** A character who arrives with a "roll in" animation */
  entering?: CharacterId;
  /** Characters who walk in from the side (start of a scene) */
  walkIn?: CharacterId[];
  action?: StageAction;
  picture?: IdeaPictureId;
  /** Called when the speech bubble has finished typing */
  onTypingDone?: () => void;
  /** Something that is not a character is speaking (shown as a drawing) */
  announcer?: "radio";
  /** What Mama holds (default: her notebook at the house) */
  mamaHolds?: "notebook" | "seeds" | "phone";
}

export default function Stage({ setting, cast, moods, speaker, text, entering, walkIn = [], action, picture, onTypingDone, announcer, mamaHolds }: StageProps) {
  const [typing, setTyping] = useState(true);
  useEffect(() => setTyping(true), [text]);

  const speakerIndex = speaker ? cast.indexOf(speaker) : -1;
  // Each character gets an equal-width column, so the middle of
  // column i is at (i + 0.5) / count of the width.
  const tailX = speakerIndex >= 0 ? `${((speakerIndex + 0.5) / cast.length) * 100}%` : "50%";

  // If someone is walking or rolling in, wait for them before talking.
  const arriving = walkIn.length > 0 || Boolean(entering);
  const bubbleDelay = arriving ? WALK_TIME : 0;

  return (
    <div className={`tm-stage-box tm-setting-${setting}`}>
      <Background setting={setting} />

      <div className={`tm-stage-top ${picture ? "has-picture" : ""} ${picture === "big-message" ? "has-wide-picture" : ""}`}>
        {announcer === "radio" && <Radio />}
        <div className="tm-stage-bubble">
          {text && (speaker || announcer) && (
            <SpeechBubble
              text={text}
              name={speaker ? CHARACTER_NAMES[speaker] : "Radio"}
              tail={speaker ? "bottom" : "left"}
              tailX={tailX}
              delay={bubbleDelay}
              onDone={() => {
                setTyping(false);
                onTypingDone?.();
              }}
            />
          )}
        </div>
        {picture && (
          <div className="tm-stage-picture" style={{ animationDelay: `${bubbleDelay + 300}ms` }}>
            <IdeaPictureCard id={picture} />
          </div>
        )}
      </div>

      <div className="tm-cast" style={{ gridTemplateColumns: `repeat(${cast.length}, 1fr)` } as CSSProperties}>
        {cast.map((id, i) => {
          const isSpeaker = speaker === id;
          // Listeners lean towards whoever is talking.
          const lean = !isSpeaker && speakerIndex >= 0 ? (i < speakerIndex ? "tm-lean-right" : "tm-lean-left") : "";
          // Arriving mid-scene: Tumaini rolls in on its wheels, people walk in.
          const walking = walkIn.includes(id) || (entering === id && id !== "tumaini") ? "tm-walk-in" : "";
          const rolling = entering === id && id === "tumaini" ? "tm-roll-in" : "";
          const doing = isSpeaker && action ? `tm-action-${action}` : "";
          return (
            <div
              key={id}
              className={`tm-slot tm-slot-${id} ${isSpeaker ? "is-speaking" : ""} ${lean} ${walking} ${rolling} ${doing}`}
              style={{ animationDelay: walking ? `${i * 150}ms` : undefined }}
            >
              <div className="tm-slot-inner">
                <Character
                  id={id}
                  mood={moods[id]}
                  size={200}
                  talking={isSpeaker && typing}
                  waving={id === "tumaini" && isSpeaker && action === "wave"}
                  mamaHolds={id === "mama" ? (mamaHolds ?? (setting === "house" ? "notebook" : undefined)) : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
