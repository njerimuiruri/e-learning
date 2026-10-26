// ============================================================
// NEURAL NETWORK DIAGRAM  (Tumaini's brain)
// ------------------------------------------------------------
//   4 input circles (clouds, humidity, wind, temperature)
//   → 3 hidden circles → 1 output circle ("Storm?")
//
//   Line THICKNESS = how strong a connection is (its weight)
//   Line COLOUR    = blue for "pushes towards storm",
//                    orange for "pushes away from storm"
//   Circle BRIGHTNESS = how strongly that neuron is firing
//
// When the dials change, little sparks run along the lines from
// left to right (pulseKey changes = new sparks). When the brain
// learns, the lines smoothly change thickness and colour.
// ============================================================

import type { Brain } from "./brainMath";
import { forward, toInputs } from "./brainMath";
import { DIAL_NAMES } from "./content";

const OUTLINE = "#13303A";
const IN_X = 92;
const HID_X = 250;
const OUT_X = 398;
const IN_Y = [48, 116, 184, 252];
const HID_Y = [82, 150, 218];
const OUT_Y = 150;

/** Mix two colours by t (0–1): dark when quiet, bright yellow when firing. */
function glow(t: number) {
  const a = [31, 68, 80];
  const b = [255, 227, 138];
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
}

function Connection({ x1, y1, x2, y2, weight, sparkDelay, pulse, animate }: { x1: number; y1: number; x2: number; y2: number; weight: number; sparkDelay: number; pulse: number; animate: boolean }) {
  const width = 1.2 + Math.min(Math.abs(weight), 4) * 1.5;
  return (
    <g>
      <line className="tm-nn-line" x1={x1} y1={y1} x2={x2} y2={y2} stroke={weight >= 0 ? "#3B82F6" : "#F08C3C"} strokeWidth={width} strokeLinecap="round" opacity="0.85" />
      {animate && pulse > 0 && (
        <circle key={pulse} r="4.5" fill="#FFE38A" opacity="0">
          <animateMotion dur="0.6s" begin={`${sparkDelay}s`} fill="freeze" path={`M${x1} ${y1} L${x2} ${y2}`} />
          <animate attributeName="opacity" values="0;1;1;0" dur="0.6s" begin={`${sparkDelay}s`} fill="freeze" />
        </circle>
      )}
    </g>
  );
}

interface NeuralNetProps {
  brain: Brain;
  dials: number[];
  /** Change this number to send new sparks through the network */
  pulse: number;
  /** false = no sparks (reduce motion) */
  animate?: boolean;
  label: string;
}

export default function NeuralNet({ brain, dials, pulse, animate = true, label }: NeuralNetProps) {
  const inputs = toInputs(dials);
  const { hidden, output } = forward(brain, inputs);

  return (
    <svg className="tm-graph tm-nn" viewBox="0 0 470 300" role="img" aria-label={label}>
      <rect width="470" height="300" rx="18" fill="#0E2A33" />
      <text x={IN_X} y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8BE9F5">what I see</text>
      <text x={HID_X} y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8BE9F5">tiny calculators</text>
      <text x={OUT_X} y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8BE9F5">my answer</text>

      {/* Connections: inputs → hidden, then hidden → output */}
      {IN_Y.map((iy, i) =>
        HID_Y.map((hy, j) => <Connection key={`a${i}${j}`} x1={IN_X + 18} y1={iy} x2={HID_X - 18} y2={hy} weight={brain.w1[i][j]} sparkDelay={0} pulse={pulse} animate={animate} />),
      )}
      {HID_Y.map((hy, j) => (
        <Connection key={`b${j}`} x1={HID_X + 18} y1={hy} x2={OUT_X - 26} y2={OUT_Y} weight={brain.w2[j]} sparkDelay={0.6} pulse={pulse} animate={animate} />
      ))}

      {/* Input neurons with their icons */}
      {IN_Y.map((y, i) => (
        <g key={`in${i}`}>
          <text x={IN_X - 30} y={y + 7} textAnchor="end" fontSize="20">{DIAL_NAMES[i].icon}</text>
          <circle cx={IN_X} cy={y} r="18" fill={glow(inputs[i])} stroke="#BFDCE8" strokeWidth="3" className="tm-nn-node" />
          <text x={IN_X} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill={inputs[i] > 0.55 ? OUTLINE : "#FFFFFF"}>{dials[i]}</text>
        </g>
      ))}
      {/* Hidden neurons */}
      {HID_Y.map((y, j) => (
        <circle key={`h${j}`} cx={HID_X} cy={y} r="18" fill={glow(hidden[j])} stroke="#BFDCE8" strokeWidth="3" className="tm-nn-node" />
      ))}
      {/* Output neuron */}
      <circle cx={OUT_X} cy={OUT_Y} r="26" fill={glow(output)} stroke="#FFFFFF" strokeWidth="3.5" className="tm-nn-node" />
      <text x={OUT_X} y={OUT_Y + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill={output > 0.55 ? OUTLINE : "#FFFFFF"}>
        {Math.min(99, Math.max(1, Math.round(output * 100)))}%
      </text>
      <text x={OUT_X} y={OUT_Y + 48} textAnchor="middle" fontSize="14" fontWeight="900" fill="#FFFFFF">Storm?</text>

      {/* Key */}
      <g fontSize="11" fontWeight="700" fill="#BFDCE8">
        <line x1="300" y1="276" x2="322" y2="276" stroke="#3B82F6" strokeWidth="4" />
        <text x="327" y="280">→ storm</text>
        <line x1="380" y1="276" x2="402" y2="276" stroke="#F08C3C" strokeWidth="4" />
        <text x="407" y="280">→ calm</text>
      </g>
    </svg>
  );
}
