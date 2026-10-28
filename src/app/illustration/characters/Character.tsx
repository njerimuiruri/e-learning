// ============================================================
// CHARACTER PICKER
// ------------------------------------------------------------
// Draws any character by its id, so the scene engine can say
// "draw whoever is in this scene" without knowing each one.
//
// talking: true while their words are being typed. Their mouth
//          moves (the "tm-mouth-moving" class in motion.css)
//          and they nod, bounce or blink faster.
// ============================================================

import type { BabaMood, CharacterId, MamaMood, Mood, OtienoMood, TumainiMood } from "../types";
import Tumaini from "./Tumaini";
import Mama from "./Mama";
import Otieno from "./Otieno";
import BabaOchieng from "./BabaOchieng";

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  tumaini: "Tumaini",
  mama: "Mama Akinyi",
  otieno: "Otieno",
  baba: "Baba Ochieng",
};

interface CharacterProps {
  id: CharacterId;
  mood?: Mood;
  size?: number;
  talking?: boolean;
  /** Only used by Tumaini: wave hello */
  waving?: boolean;
  /** Only used by Mama: what she holds in her hands */
  mamaHolds?: "notebook" | "seeds" | "phone";
  className?: string;
}

export default function Character({ id, mood, size, talking, waving, mamaHolds, className = "" }: CharacterProps) {
  const classes = `${talking ? "tm-mouth-moving" : ""} ${className}`;

  switch (id) {
    case "mama":
      return (
        <Mama
          mood={mood as MamaMood}
          size={size ? size * 0.8 : undefined}
          talking={talking}
          holdingNotebook={mamaHolds === "notebook"}
          holdingSeeds={mamaHolds === "seeds"}
          holdingPhone={mamaHolds === "phone"}
          className={classes}
        />
      );
    case "otieno":
      return <Otieno mood={mood as OtienoMood} size={size ? size * 0.7 : undefined} talking={talking} className={classes} />;
    case "baba":
      return <BabaOchieng mood={mood as BabaMood} size={size ? size * 0.8 : undefined} talking={talking} className={classes} />;
    case "tumaini":
    default:
      return (
        <Tumaini
          mood={mood as TumainiMood}
          size={size}
          waving={waving}
          className={`${talking ? "tm-talking-bob" : ""} ${classes}`}
        />
      );
  }
}
