// ============================================================
// TEASER PICTURE: the Nyando River in a storm
// ------------------------------------------------------------
// A dark, rainy evening. The river is brown and rising up the
// measuring post. Used for the "Next time…" teaser.
// ============================================================

const OUTLINE = "#13303A";

export default function RiverStormPicture() {
  return (
    <svg viewBox="0 0 600 300" className="tm-storm" role="img" aria-label="A dark, rainy evening by the Nyando River. The water is rising up the measuring post.">
      <defs>
        <linearGradient id="tm-storm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E2B36" />
          <stop offset="1" stopColor="#47596A" />
        </linearGradient>
      </defs>
      <rect width="600" height="300" fill="url(#tm-storm-sky)" />

      {/* Lightning */}
      <path className="tm-lightning" d="M410 20 L384 92 L404 92 L380 160 L436 76 L414 76 L438 20 Z" fill="#FFF3C4" />

      {/* Dark clouds */}
      {[
        [40, 30, 1.6],
        [250, 10, 1.9],
        [440, 36, 1.4],
      ].map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 40 a16 16 0 0 1 4 -31 a22 22 0 0 1 40 -6 a18 18 0 0 1 32 12 a13 13 0 0 1 4 25 Z"
          fill="#2E3B46"
        />
      ))}

      {/* Rain */}
      {Array.from({ length: 34 }, (_, i) => {
        const x = (i * 47) % 620;
        const y = 90 + ((i * 29) % 90);
        return <line key={i} className="tm-rain-line" x1={x} y1={y} x2={x - 10} y2={y + 22} stroke="#9FB7BF" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: `${(i % 6) * 0.12}s` }} />;
      })}

      {/* River banks */}
      <path d="M0 190 C120 170 220 185 300 196 L0 230 Z" fill="#2F5A2B" />
      <path d="M600 186 C500 176 420 190 340 200 L600 236 Z" fill="#2F5A2B" />

      {/* Small house on the bank */}
      <rect x="40" y="160" width="60" height="38" fill="#7A5A40" stroke={OUTLINE} strokeWidth="3" />
      <path d="M32 164 L70 136 L108 164 Z" fill="#7E888E" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />

      {/* Measuring post with a red danger mark (drawn first, so the water covers its bottom) */}
      <rect x="470" y="130" width="22" height="160" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="3" />
      {[150, 175, 200, 225, 250].map((y) => (
        <line key={y} x1="470" y1={y} x2="482" y2={y} stroke={OUTLINE} strokeWidth="2.5" />
      ))}
      <rect x="470" y="138" width="22" height="10" fill="#E0533D" />

      {/* The rising river */}
      <g className="tm-river-rise">
        <path d="M0 214 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 L640 320 L0 320 Z" fill="#6B5A3E" opacity="0.95" />
        <path d="M0 230 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#8C7756" strokeWidth="4" fill="none" />
      </g>
    </svg>
  );
}
