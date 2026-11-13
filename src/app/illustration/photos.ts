// ============================================================
// PHOTOS  (files live in public/illustration/photos/)
// ------------------------------------------------------------
// One list for every part, so a photo is described once.
//
// TODO before sharing widely: confirm each photo's source and
// licence, then fill in its "credit". News-agency photos (AP,
// Reuters, AFP, Getty) need permission or a free replacement.
// ============================================================

import type { SlidePhoto } from "./types";

const P = "/illustration/photos";

export const PHOTOS = {
  // People
  wanjiku: { src: `${P}/farmer.webp`, alt: "Wanjiku, a smiling woman farmer standing in her maize field" },

  // Part 1: Climate change
  floodsAerial: { src: `${P}/floods-aerial.webp`, alt: "Aerial view of a river in Kenya that has burst its banks, flooding the land and buildings" },
  droughtMaize: { src: `${P}/drought-maize.webp`, alt: "A field of maize dried out and dying from drought" },
  heatMaize: { src: `${P}/heat-maize.webp`, alt: "Close-up of maize leaves scorched brown by heat" },
  floodsSettlement: { src: `${P}/floods-settlement.webp`, alt: "A man carrying water tanks through floodwater in a crowded neighbourhood" },
  windTurkana: { src: `${P}/wind-turkana.webp`, alt: "Wind turbines at the Lake Turkana wind farm in northern Kenya" },
  waterTanks: { src: `${P}/water-tanks.webp`, alt: "Large green tanks collecting rainwater from a roof" },

  // Part 2: Adaptation & resilience
  houseRiver: { src: `${P}/house-river.webp`, alt: "A house built right beside a river" },
  farmSorghum: { src: `${P}/farm-sorghum.webp`, alt: "A field of sorghum, a crop that needs little water" },
} satisfies Record<string, SlidePhoto>;
