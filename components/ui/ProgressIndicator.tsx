"use client";

import { CHAPTERS, TIMING } from "@/lib/sceneConstants";
import { useUi } from "@/lib/uiStore";

/** Thin progress rail plus the name of the current chapter. The fill is scrubbed by the master timeline. */
export function ProgressIndicator() {
  const chapter = useUi((s) => s.chapter);
  const current = CHAPTERS.find((c) => c.id === chapter);
  return (
    <div className="rail" aria-hidden="true">
      <div className="rail__track">
        <div className="rail__fill" data-progress />
        {CHAPTERS.map((c) => (
          <span
            key={c.id}
            className="rail__tick"
            data-active={c.id === chapter}
            style={{ ["--at" as string]: `${(c.start / TIMING.end) * 100}%` }}
          />
        ))}
      </div>
      <p className="rail__label">{current?.title}</p>
    </div>
  );
}
