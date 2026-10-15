"use client";

import { ArrowUp } from "lucide-react";
import { SOFTWARE_CLOSING, SOFTWARE_NEXT } from "@/data/softwareChapter";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrollToUnits } from "@/lib/scrollApi";

/** Where the software chapter ends: one closing thought, what comes next, and a way back to the top. */
export function SoftwareEpilogue({ id }: { id: string }) {
  const reduced = useReducedMotion();
  return (
    <section id={id} className="sw-end" aria-labelledby="sw-end-title">
      <div className="sw-end__inner">
        <p className="sw-end__eyebrow">End of this chapter</p>
        <h2 id="sw-end-title" className="sw-end__title">
          A game, from a file to a running process
        </h2>
        <p className="sw-end__lead">{SOFTWARE_CLOSING}</p>
        <div className="sw-end__next">
          <h3>Still to come</h3>
          <ul>
            {SOFTWARE_NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="sw-end__top" onClick={() => scrollToUnits(0, reduced)}>
          <ArrowUp size={16} aria-hidden="true" />
          Back to the beginning
        </button>
      </div>
    </section>
  );
}
