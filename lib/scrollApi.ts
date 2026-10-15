import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import { TIMING } from "./sceneConstants";

/** Lets UI controls drive the master scroll position without owning the timeline. */
let trigger: ST | null = null;

export const setMasterTrigger = (st: ST | null): void => {
  trigger = st;
};

export const unitsToScrollY = (units: number): number | null => {
  if (!trigger) return null;
  const f = Math.min(Math.max(units / TIMING.end, 0), 1);
  return trigger.start + f * (trigger.end - trigger.start);
};

export const scrollYToUnits = (y: number): number => {
  if (!trigger) return 0;
  const f = (y - trigger.start) / Math.max(trigger.end - trigger.start, 1);
  return Math.min(Math.max(f, 0), 1) * TIMING.end;
};

export const scrollToUnits = (units: number, reduced = false): void => {
  const y = unitsToScrollY(units);
  if (y === null) return;
  window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
};
