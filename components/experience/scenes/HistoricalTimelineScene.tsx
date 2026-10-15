"use client";

import { MILESTONE_COUNT } from "@/lib/sceneConstants";
import { HistoricalMachineModel } from "../models/HistoricalMachineModel";

/** The six machines live inside the cube; the scroll timeline decides which one is built. */
export function HistoricalTimelineScene() {
  return (
    <>
      {Array.from({ length: MILESTONE_COUNT }, (_, i) => (
        <HistoricalMachineModel key={i} index={i} />
      ))}
    </>
  );
}
