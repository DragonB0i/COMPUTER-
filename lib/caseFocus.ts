import { lerp, smoothstep, smootherstep, tri } from "./animation";
import type { JourneyState } from "./journey";

/** 0..1 as the cube turns into the tower and its parts appear. */
export const caseReveal = (j: JourneyState): number =>
  smoothstep(0.35, 0.95, j.caseBuild) * (1 - smoothstep(0.3, 0.7, j.sw.swarm));

/**
 * How bright a part is while the exploded view steps through the parts. When the computer is put
 * back together (software chapter) every part settles at one even brightness.
 */
export const caseFocus = (j: JourneyState, idx: number): number => {
  const u = smoothstep(-1, -0.3, j.partStep);
  const stepped = 0.78 * (1 - u) + u * (0.3 + 0.7 * tri(j.partStep, idx, 0.55));
  return lerp(stepped, 0.78, j.sw.settle);
};

/** Interior parts (everything behind the front panel) disappear while the front face is shown. */
export const caseInterior = (j: JourneyState): number => 1 - smoothstep(0, 0.85, j.sw.face);

/** Overall opacity multiplier for a case part (fades away when the motherboard takes over). */
export const casePartFade = (j: JourneyState, idx: number): number =>
  caseReveal(j) * (1 - smoothstep(0, 0.65, j.boardFocus)) * caseFocus(j, idx);

export const explodeAmount = (j: JourneyState): number => smootherstep(0, 1, j.explode);
