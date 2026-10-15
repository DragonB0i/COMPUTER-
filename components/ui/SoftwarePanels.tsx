"use client";

import { useEffect, useRef } from "react";
import { registerLeader } from "@/lib/anchors";
import { SOFTWARE_CONCEPTS } from "@/data/softwareChapter";
import { useUi } from "@/lib/uiStore";

/**
 * The frosted-glass annotation panels of the software chapter. One panel per concept, all stacked in
 * the same place on the right (or along the bottom on phones); the master timeline fades exactly one
 * of them in at a time, draws its connector line, and fades it out again. A connector is attached to
 * the panel's nearest edge and to the 3D anchor of the concept, so it follows the object.
 */
export function SoftwarePanels() {
  const step = useUi((s) => s.swStep);
  const concept = SOFTWARE_CONCEPTS[step];

  return (
    <>
      <svg className="stage__leaders stage__leaders--sw" aria-hidden="true" focusable="false">
        {SOFTWARE_CONCEPTS.map((c) => (
          <Leader key={c.id} id={c.id} anchor={c.anchor} />
        ))}
      </svg>
      <div className="sw-panels">
        {SOFTWARE_CONCEPTS.map((c) => (
          <article
            key={c.id}
            id={`sw-panel-${c.id}`}
            className="sw-panel"
            data-sw-panel={c.id}
            aria-labelledby={`sw-title-${c.id}`}
          >
            <p className="sw-panel__kicker" data-sw-part>
              {c.kicker}
            </p>
            <h3 id={`sw-title-${c.id}`} className="sw-panel__title" data-sw-part>
              {c.title}
            </h3>
            <p className="sw-panel__text" data-sw-part>
              {c.text}
            </p>
            {c.note && (
              <p className="sw-panel__note" data-sw-part>
                {c.note}
              </p>
            )}
          </article>
        ))}
      </div>
      {/* The panels are hidden from assistive technology while they are faded out, so the current one is announced here. */}
      <p className="sr-only" role="status" aria-live="polite">
        {concept ? `${concept.title}. ${concept.text} ${concept.picture}` : ""}
      </p>
    </>
  );
}

/** A connector line from a panel to a 3D anchor. Its drawing is scrubbed by the master timeline. */
function Leader({ id, anchor }: { id: string; anchor: string }) {
  const group = useRef<SVGGElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const g = group.current;
    const l = line.current;
    const d = dot.current;
    const box = document.getElementById(`sw-panel-${id}`);
    if (!g || !l || !d || !box) return;
    return registerLeader(`sw:${id}`, { worldId: anchor, box, line: l, dot: d, group: g });
  }, [id, anchor]);

  return (
    <g ref={group} data-sw-leader={id} style={{ visibility: "hidden" }}>
      <line ref={line} pathLength={1} data-sw-line />
      <circle ref={dot} r={3.5} data-sw-dot />
    </g>
  );
}
