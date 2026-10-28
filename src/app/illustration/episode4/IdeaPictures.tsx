import type { Episode4PictureId, IdeaPicture } from "../types";

const OUTLINE = "#13303A";

export const EPISODE4_PICTURES: Record<Episode4PictureId, IdeaPicture> = {
  "forest-mud": {
    caption: "Fewer trees leave more soil to wash into the river",
    label: "A forested hill on one side and a farm on the other, with rain washing brown soil into a river",
    draw: (
      <>
        <rect width="240" height="160" fill="#CDEAF5" />
        <path d="M0 95 Q42 34 92 86 L125 120 H0 Z" fill="#2F6A2B" stroke={OUTLINE} strokeWidth="2" />
        <path d="M90 88 Q146 56 202 90 L240 119 H102 Z" fill="#B5D36B" stroke={OUTLINE} strokeWidth="2" />
        {[25, 52, 78].map((x) => (
          <g key={x}>
            <rect x={x - 2} y="78" width="4" height="18" fill="#7A4A2E" />
            <circle cx={x} cy="72" r="12" fill="#4C8E44" stroke={OUTLINE} strokeWidth="1.5" />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <line key={i} x1={132 + i * 20} y1={60 + (i % 2) * 8} x2={128 + i * 20} y2={89 + (i % 2) * 8} stroke="#1B6E8E" strokeWidth="3" strokeLinecap="round" />
        ))}
        <path d="M0 128 Q80 112 145 133 T240 127 V160 H0 Z" fill="#3E8DAB" />
        <path d="M103 109 Q125 125 148 126" fill="none" stroke="#8A5A36" strokeWidth="7" strokeLinecap="round" />
        <text x="44" y="22" textAnchor="middle" fontSize="11" fontWeight="900" fill={OUTLINE}>FOREST</text>
        <text x="178" y="22" textAnchor="middle" fontSize="11" fontWeight="900" fill={OUTLINE}>FARM</text>
        <text x="175" y="151" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF">RIVER + MUD</text>
      </>
    ),
  },
  "neuron-relay": {
    caption: "Neurons pass clues forward, and the last one gives an answer",
    label: "A simple neural network: four input clues connect to three small calculators, then to a storm prediction",
    draw: (
      <>
        <rect width="240" height="160" fill="#0E2A33" />
        <text x="34" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#8BE9F5">CLUES</text>
        <text x="120" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#8BE9F5">CALCULATORS</text>
        <text x="208" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#8BE9F5">ANSWER</text>
        {[42, 68, 94, 120].map((y, i) =>
          [52, 84, 116].map((middleY, j) => (
            <line key={`${i}-${j}`} x1="44" y1={y} x2="108" y2={middleY} stroke="#8BE9F5" strokeOpacity="0.55" strokeWidth="1.5" />
          )),
        )}
        {[52, 84, 116].map((y, i) => (
          <line key={i} x1="124" y1={y} x2="193" y2="84" stroke="#F2B544" strokeOpacity="0.8" strokeWidth="2" />
        ))}
        {[42, 68, 94, 120].map((y, i) => (
          <circle key={i} cx="34" cy={y} r="8" fill="#1B6E8E" stroke="#BFDCE8" strokeWidth="2" />
        ))}
        {[52, 84, 116].map((y, i) => (
          <circle key={i} cx="116" cy={y} r="10" fill="#F2B544" stroke="#FFFFFF" strokeWidth="2" className="tm-pop" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
        <circle cx="204" cy="84" r="17" fill="#E0533D" stroke="#FFFFFF" strokeWidth="3" />
        <text x="204" y="88" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF">STORM?</text>
        <text x="120" y="151" textAnchor="middle" fontSize="9" fontWeight="800" fill="#BFDCE8">clues → signals → decision</text>
      </>
    ),
  },
};
