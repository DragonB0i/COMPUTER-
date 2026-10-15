import type { Group } from "three";
import { BOARD_POSE } from "./geometry/pc";
import { smootherstep } from "./animation";
import type { JourneyState } from "./journey";

/** Places an object in the motherboard's pose inside the case, following the exploded view. */
export const applyBoardTransform = (g: Group, j: JourneyState): void => {
  const e = smootherstep(0, 1, j.explode);
  const [px, py, pz] = BOARD_POSE.position;
  const [ex, ey, ez] = BOARD_POSE.explode;
  g.position.set(px + ex * e, py + ey * e, pz + ez * e);
  g.rotation.set(0, BOARD_POSE.rotationY, 0);
};
