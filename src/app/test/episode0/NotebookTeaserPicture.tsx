// ============================================================
// TEASER PICTURE: Mama's weather notebook
// ------------------------------------------------------------
// An open notebook with a few days of weather signs, and a
// question mark: "Will it rain tomorrow?". Used for Episode 0's
// "Next time…" teaser, leading into Episode 1.
// ============================================================

const OUTLINE = "#13303A";

export default function NotebookTeaserPicture() {
  return (
    <svg viewBox="0 0 600 300" className="tm-storm" role="img" aria-label="Mama's old weather notebook lying open on a table, with notes about clouds, ants and rain, and a big question mark: will it rain tomorrow?">
      <rect width="600" height="300" fill="#E9D8B4" />
      <rect y="230" width="600" height="70" fill="#C9A26B" />
      {/* The open notebook */}
      <g transform="rotate(-3 300 150)">
        <path d="M110 50 L300 66 L300 262 L110 246 Z" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round" />
        <path d="M490 50 L300 66 L300 262 L490 246 Z" fill="#FFFBEA" stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round" />
        <line x1="132" y1="60" x2="132" y2="244" stroke="#E0533D" strokeWidth="2" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <line x1="120" y1={100 + row * 40} x2="292" y2={114 + row * 40} stroke="#BFDCE8" strokeWidth="2" />
            <text x="142" y={98 + row * 40} fontSize="17" fontWeight="800" fill={OUTLINE} fontFamily="'Comic Sans MS', 'Trebuchet MS', sans-serif">
              {["Day 1: clouds, ants → rain", "Day 2: wind → dry", "Day 3: clouds → rain", "Day 4: ants → dry"][row]}
            </text>
          </g>
        ))}
        <text className="tm-wobble" x="395" y="190" textAnchor="middle" fontSize="110" fontWeight="900" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="3">
          ?
        </text>
        <text x="395" y="236" textAnchor="middle" fontSize="18" fontWeight="900" fill={OUTLINE}>
          Will it rain tomorrow?
        </text>
      </g>
    </svg>
  );
}
