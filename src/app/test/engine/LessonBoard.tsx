// ============================================================
// LESSON BOARD
// ------------------------------------------------------------
// A cartoon chalkboard that drops down with a bounce,
// showing the name and meaning of today's idea.
// Tumaini stands beside it, pointing (and, if the beat has
// "tumainiSays", saying something about it).
// A row can also have a short list, e.g. what y, x, m and c mean.
// ============================================================

import type { LessonBeat } from "../types";
import Tumaini from "../characters/Tumaini";
import SpeechBubble from "../components/SpeechBubble";

export default function LessonBoard({ beat }: { beat: LessonBeat }) {
  return (
    <div className="tm-lesson">
      <div className="tm-board">
        <h3 className="tm-board-title">{beat.title}</h3>
        <dl className="tm-board-rows">
          {beat.rows.map((row) => (
            <div key={row.label} className="tm-board-row">
              <dt>{row.label}</dt>
              <dd>
                {row.text}
                {row.list && (
                  <ul className="tm-board-list">
                    {row.list.map((item) =>
                      typeof item === "string" ? (
                        <li key={item}>{item}</li>
                      ) : (
                        <li key={item.text}>
                          {/* Opens the official page in a new tab (needs internet) */}
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className="tm-board-link">
                            {item.text} <span aria-hidden="true">↗</span>
                            <span className="tm-sr-only"> (opens in a new tab)</span>
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="tm-lesson-tumaini">
        {beat.tumainiSays && <SpeechBubble text={beat.tumainiSays} name="Tumaini" tail="bottom" small delay={900} />}
        <Tumaini mood="happy" waving size={140} label="Tumaini pointing at the lesson board" />
      </div>
    </div>
  );
}
