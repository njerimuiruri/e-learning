const OUTLINE = "#13303A";

export default function ExamRobotsPicture() {
  return (
    <svg
      viewBox="0 0 600 300"
      className="tm-storm"
      role="img"
      aria-label="A student thinking carefully while a friendly robot offers an answer"
    >
      <rect width="600" height="300" fill="#CDEAF5" />
      <rect y="225" width="600" height="75" fill="#8FC777" />
      <circle cx="80" cy="65" r="32" fill="#F2B544" />
      <path d="M0 230 Q140 175 275 230 T600 220 V300 H0 Z" fill="#6FAE5F" />

      <g transform="translate(130 65)">
        <rect x="0" y="32" width="118" height="112" rx="24" fill="#F2B544" stroke={OUTLINE} strokeWidth="5" />
        <rect x="17" y="48" width="84" height="61" rx="14" fill="#0E2A33" />
        <circle cx="43" cy="76" r="6" fill="#8BE9F5" />
        <circle cx="76" cy="76" r="6" fill="#8BE9F5" />
        <path d="M42 91 Q59 104 78 91" fill="none" stroke="#8BE9F5" strokeWidth="5" strokeLinecap="round" />
        <line x1="59" y1="32" x2="59" y2="11" stroke={OUTLINE} strokeWidth="5" />
        <circle cx="59" cy="8" r="8" fill="#E0533D" stroke={OUTLINE} strokeWidth="3" />
        <rect x="25" y="144" width="20" height="42" rx="9" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="4" />
        <rect x="73" y="144" width="20" height="42" rx="9" fill="#1B6E8E" stroke={OUTLINE} strokeWidth="4" />
      </g>

      <g transform="translate(380 104)">
        <circle cx="58" cy="38" r="34" fill="#7A4A2E" stroke={OUTLINE} strokeWidth="4" />
        <path d="M27 36 Q58 -2 89 36 Q82 8 58 7 Q34 8 27 36" fill="#172D36" />
        <circle cx="47" cy="40" r="3" fill={OUTLINE} />
        <circle cx="69" cy="40" r="3" fill={OUTLINE} />
        <path d="M48 55 Q58 63 69 55" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        <path d="M17 153 Q20 83 58 82 Q98 83 100 153 Z" fill="#F2B544" stroke={OUTLINE} strokeWidth="4" />
        <path d="M21 125 L-5 159 M95 125 L119 159" stroke={OUTLINE} strokeWidth="10" strokeLinecap="round" />
        <path d="M28 162 L20 205 M88 162 L96 205" stroke={OUTLINE} strokeWidth="12" strokeLinecap="round" />
      </g>

      <path d="M270 74 Q300 38 336 73" fill="none" stroke="#1B6E8E" strokeWidth="4" strokeDasharray="6 8" />
      <text x="300" y="56" textAnchor="middle" fontSize="35" fontWeight="900" fill={OUTLINE}>?</text>
      <text x="300" y="274" textAnchor="middle" fontSize="21" fontWeight="900" fill={OUTLINE}>Think, check, and decide</text>
    </svg>
  );
}
