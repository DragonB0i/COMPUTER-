import { useSyncExternalStore } from "react";
import type { BoardComponentId } from "../types/hardware";
import type { ChapterId } from "./sceneConstants";

/**
 * Small external store for *discrete* UI state (changes a handful of times per session).
 * High-frequency animation values live in `journey` instead.
 */
export interface UiState {
  chapter: ChapterId;
  /** Index of the milestone currently on screen, -1 outside the history chapter. */
  milestone: number;
  /** Index of the case part in focus, -1 when none. */
  casePart: number;
  /** Motherboard component currently highlighted by scrolling. */
  boardScroll: BoardComponentId | null;
  boardHover: BoardComponentId | null;
  boardPinned: BoardComponentId | null;
  /** Highest chapter index reached; later 3D scenes are loaded lazily from this. */
  phase: number;
  /** Pinned stage is on screen, so the renderer should run. */
  stageActive: boolean;
  /** Index of the software concept on screen (see SOFTWARE_CONCEPTS), -1 when none. */
  swStep: number;
}

let state: UiState = {
  chapter: "awakening",
  milestone: -1,
  casePart: -1,
  boardScroll: null,
  boardHover: null,
  boardPinned: null,
  phase: 0,
  stageActive: true,
  swStep: -1,
};

const listeners = new Set<() => void>();

export const getUi = (): UiState => state;

export const setUi = (patch: Partial<UiState>): void => {
  let changed = false;
  for (const key of Object.keys(patch) as Array<keyof UiState>) {
    if (state[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const subscribeUi = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(
    subscribeUi,
    () => selector(state),
    () => selector(state),
  );
}

export const resetUi = (): void => {
  state = {
    chapter: "awakening",
    milestone: -1,
    casePart: -1,
    boardScroll: null,
    boardHover: null,
    boardPinned: null,
    phase: 0,
    stageActive: true,
    swStep: -1,
  };
  listeners.forEach((l) => l());
};
