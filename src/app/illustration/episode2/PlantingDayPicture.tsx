// ============================================================
// TEASER PICTURE: "Should I plant today?"
// ------------------------------------------------------------
// Mama stands at the edge of her bare, dug field, with seeds in
// her open hand, looking up at a sky that could go either way:
// half sun, half grey clouds. A question mark floats above her.
// Used for Episode 2's "Next time…" teaser.
// ============================================================

import Mama from "../characters/Mama";

const OUTLINE = "#13303A";

export default function PlantingDayPicture() {
  return (
    <div className="tm-planting">
      <svg viewBox="0 0 600 300" className="tm-storm" role="img" aria-label="Mama Akinyi at the edge of her dug field with seeds in her hand, looking up at a sky that is half sunny and half cloudy">
        {/* Sky: sunny on the left, grey clouds coming on the right */}
        <rect width="600" height="300" fill="#CDEAF5" />
        <rect x="300" width="300" height="300" fill="#9FB3BD" opacity="0.7" />
        <circle className="tm-sun-pulse" cx="110" cy="70" r="36" fill="#F2B544" stroke="#E09A1F" strokeWidth="4" />
        <g className="tm-bg-cloud">
          <path transform="translate(380 30) scale(1.9)" d="M0 40 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z" fill="#5E6E7B" />
        </g>
        <g className="tm-bg-cloud tm-bg-cloud-slow">
          <path transform="translate(250 60) scale(1.1)" d="M0 40 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z" fill="#FFFFFF" />
        </g>

        {/* Hills and the bare, dug field */}
        <path d="M0 200 C150 170 320 190 600 175 L600 300 L0 300 Z" fill="#6FAE5F" />
        <rect y="222" width="600" height="78" fill="#8A5A36" />
        {[240, 262, 284].map((y) => (
          <path key={y} d={`M0 ${y} Q300 ${y - 6} 600 ${y}`} stroke="#6E4428" strokeWidth="5" fill="none" />
        ))}

        {/* The big question */}
        <text className="tm-wobble" x="330" y="120" textAnchor="middle" fontSize="70" fontWeight="900" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="2.5">
          ?
        </text>

        {/* Seeds in her hand (drawn next to where Mama stands) */}
        <g className="tm-pop" style={{ animationDelay: "0.6s" }}>
          <ellipse cx="242" cy="196" rx="20" ry="8" fill="#7A4A2E" stroke={OUTLINE} strokeWidth="2.5" />
          {[232, 240, 248, 254].map((x, i) => (
            <ellipse key={x} cx={x} cy={190 - (i % 2) * 3} rx="4" ry="3" fill="#F2D27A" stroke={OUTLINE} strokeWidth="1.5" />
          ))}
        </g>
      </svg>
      {/* Mama herself (her own drawing, placed over the picture) */}
      <div className="tm-planting-mama">
        <Mama mood="curious" size={120} />
      </div>
    </div>
  );
}
