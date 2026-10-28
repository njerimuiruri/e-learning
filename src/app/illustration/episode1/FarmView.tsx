// ============================================================
// FARM VIEW
// ------------------------------------------------------------
// Mama's maize field for one month: the sky gets greyer and
// more rain falls in wet months, the sun shines in dry months,
// and the maize grows through its stages.
// ============================================================

import type { CropStage, MamaMood } from "../types";
import Maize from "../components/Maize";
import { Cloud } from "../components/Backgrounds";
import Mama from "../characters/Mama";

interface FarmViewProps {
  rain: number; // mm this month
  crop: CropStage;
  mamaMood: MamaMood;
  label: string;
}

export default function FarmView({ rain, crop, mamaMood, label }: FarmViewProps) {
  const wet = rain >= 150;
  const drops = Math.round(rain / 12);
  const sky = wet ? "#9FB3BD" : rain >= 100 ? "#BFDCE8" : "#CDEAF5";

  return (
    <div className="tm-farm">
      <svg viewBox="0 0 600 340" className="tm-farm-svg" role="img" aria-label={label}>
        <rect width="600" height="340" fill={sky} className="tm-farm-sky" />
        {!wet && <circle cx="520" cy="62" r="32" fill="#F2B544" stroke="#E09A1F" strokeWidth="4" />}
        {rain >= 100 && (
          <>
            <Cloud x={70} y={30} scale={1.2} />
            <Cloud x={300} y={20} scale={1.4} />
            {wet && <Cloud x={430} y={46} scale={1.1} />}
          </>
        )}
        {/* Grey clouds tint for very wet months */}
        {wet && <rect width="600" height="110" fill="#5B6670" opacity="0.25" />}

        {/* Rain drops: more rain = more drops */}
        {Array.from({ length: drops }, (_, i) => {
          const x = (i * 53) % 600;
          const y = 90 + ((i * 37) % 120);
          return (
            <line
              key={i}
              className="tm-rain-line"
              x1={x}
              y1={y}
              x2={x - 6}
              y2={y + 16}
              stroke="#1B6E8E"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ animationDelay: `${(i % 6) * 0.15}s` }}
            />
          );
        })}

        <path d="M0 230 C150 200 300 215 600 210 L600 340 L0 340 Z" fill="#6FAE5F" />
        <rect x="0" y="252" width="600" height="88" fill="#8A5A36" />
        <path d="M0 290 Q300 282 600 290" stroke="#6E4428" strokeWidth="5" fill="none" />

        {/* A row of maize */}
        {[180, 250, 320, 390, 460, 530].map((x) => (
          <Maize key={x} stage={crop} x={x} y={262} scale={1.15} sway={crop !== "bare"} />
        ))}
      </svg>

      <div className="tm-farm-mama">
        <Mama mood={mamaMood} size={78} />
      </div>
    </div>
  );
}
