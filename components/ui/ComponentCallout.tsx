"use client";

import { useEffect, useRef } from "react";
import { registerLeader } from "@/lib/anchors";
import type { CasePartInfo } from "@/types/hardware";

interface Props {
  part: CasePartInfo;
  index: number;
  total: number;
}

/**
 * Label for one part of the exploded computer. The leader line is drawn in the shared SVG layer
 * and updated from the render loop so it follows the part as the camera moves.
 */
export function ComponentCallout({ part, index, total }: Props) {
  const box = useRef<HTMLElement>(null);
  const group = useRef<SVGGElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!box.current || !group.current || !line.current || !dot.current) return;
    return registerLeader(`case:${part.id}`, {
      worldId: `case:${part.id}`,
      box: box.current,
      line: line.current,
      dot: dot.current,
      group: group.current,
    });
  }, [part.id]);

  return (
    <>
      <svg className="stage__leaders" aria-hidden="true" focusable="false">
        <g ref={group} data-leader={index}>
          <line ref={line} />
          <circle ref={dot} r={3.5} />
        </g>
      </svg>
      <article
        ref={box}
        className={`callout callout--${part.side}`}
        data-callout={index}
        aria-labelledby={`callout-${part.id}`}
      >
        <p className="callout__count">
          {index + 1} of {total}
        </p>
        <h3 id={`callout-${part.id}`}>{part.name}</h3>
        <p className="callout__summary">{part.summary}</p>
        <dl>
          <dt>What it does</dt>
          <dd>{part.role}</dd>
          <dt>How it connects</dt>
          <dd>{part.relation}</dd>
        </dl>
      </article>
    </>
  );
}
