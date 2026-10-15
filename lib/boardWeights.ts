import { BOARD_COMPONENT_ORDER } from "./geometry/board";
import type { BoardComponentId } from "../types/hardware";

/** Smoothed 0..1 emphasis of every motherboard component, refreshed once per frame. */
export const boardWeights: Record<BoardComponentId, number> = Object.fromEntries(
  BOARD_COMPONENT_ORDER.map((id) => [id, 0]),
) as Record<BoardComponentId, number>;
