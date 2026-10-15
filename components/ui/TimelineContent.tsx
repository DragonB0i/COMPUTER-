"use client";

import { useEffect, useRef } from "react";
import { registerLabel } from "@/lib/anchors";
import { MILESTONES } from "@/data/milestones";
import { MilestoneText } from "./MilestoneText";

const VN_LABELS = ["CPU", "CU", "ALU", "MEMORY", "I/O", "BUS"] as const;

/** Small tags that follow the von Neumann diagram inside the cube. */
function VonNeumannLabels() {
  const refs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    const offs = VN_LABELS.map((name, i) => {
      const el = refs.current[i];
      return el ? registerLabel(`vn:${name}`, { worldId: `vn:${name}`, el }) : () => {};
    });
    return () => offs.forEach((off) => off());
  }, []);
  return (
    <div className="vn-labels" data-vn-labels aria-hidden="true">
      {VN_LABELS.map((name, i) => (
        <span
          key={name}
          className="vn-label"
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

/** The six milestone text blocks. The master timeline fades them in and out as the cube moves. */
export function TimelineContent() {
  return (
    <div className="timeline" data-timeline>
      {MILESTONES.map((m) => {
        if (m.textSide === "both") {
          const left = m.callouts?.filter((c) => c.side === "left") ?? [];
          const right = m.callouts?.filter((c) => c.side === "right") ?? [];
          return (
            <article key={m.id} className="ms ms--both" data-ms={m.index} aria-labelledby={`ms-${m.id}`}>
              <header className="vn__head">
                <p className="ms__date" data-part>
                  {m.date}
                </p>
                <h2 id={`ms-${m.id}`} className="ms__title" data-part>
                  {m.title}
                </h2>
                <p className="ms__credit" data-part>
                  {m.credit}
                </p>
              </header>
              {/* On desktop the wrapper is transparent (display: contents); on phones it becomes one grid. */}
              <div className="vn__cols">
                <div className="vn__col vn__col--left">
                  {left.map((c) => (
                    <div key={c.title} className="vn__callout" data-part>
                      <h3>{c.title}</h3>
                      <p>{c.text}</p>
                    </div>
                  ))}
                  <p className="ms__more vn__body" data-part>
                    {m.body[0]}
                  </p>
                </div>
                <div className="vn__col vn__col--right">
                  {right.map((c) => (
                    <div key={c.title} className="vn__callout" data-part>
                      <h3>{c.title}</h3>
                      <p>{c.text}</p>
                    </div>
                  ))}
                  <p className="ms__more vn__body" data-part>
                    {m.body[1]}
                  </p>
                </div>
                <p className="vn__lead" data-part>
                  {m.lead}
                </p>
              </div>
              <p className="sr-only">{m.diagram}</p>
            </article>
          );
        }
        return (
          <article
            key={m.id}
            className={`ms ms--${m.textSide}`}
            data-ms={m.index}
            aria-labelledby={`ms-${m.id}`}
          >
            <div className="ms__inner">
              <MilestoneText milestone={{ ...m }} />
              <p className="sr-only">{m.diagram}</p>
            </div>
          </article>
        );
      })}
      <VonNeumannLabels />
    </div>
  );
}
