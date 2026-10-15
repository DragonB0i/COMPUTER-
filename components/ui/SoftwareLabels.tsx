"use client";

import { useEffect, useRef } from "react";
import { registerLabel } from "@/lib/anchors";
import { SOFTWARE_LABELS } from "@/data/softwareChapter";

type Side = "up" | "down" | "left" | "right" | "center";

/** Which side of its anchor each tag sits on, chosen so tags never cover the objects they name. */
const SIDE: Record<string, Side> = {
  ram: "up",
  storage: "right",
  app: "up",
  "file-code": "left",
  "file-textures": "up",
  "file-audio": "down",
  "file-data": "down",
  process: "up",
  "thread-game": "center",
  "thread-render": "center",
  "thread-audio": "center",
  cpu: "right",
  gpu: "up",
  vram: "right",
  isa: "right",
};

/** Small names that sit on the objects of the scene. They follow their 3D anchors every frame. */
export function SoftwareLabels() {
  return (
    <div className="sw-tags" aria-hidden="true">
      {SOFTWARE_LABELS.map((l) => (
        <Tag key={l.id} id={l.id} anchor={l.anchor} text={l.text} short={l.short} tone={l.tone ?? "quiet"} side={SIDE[l.id] ?? "up"} />
      ))}
    </div>
  );
}

interface TagProps {
  id: string;
  anchor: string;
  text: string;
  short?: string;
  tone: string;
  side: Side;
}

function Tag({ id, anchor, text, short, tone, side }: TagProps) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    return registerLabel(`sw-tag:${id}`, { worldId: anchor, el: node });
  }, [id, anchor]);
  return (
    <span
      ref={el}
      className="sw-tag"
      data-sw-tag={id}
      data-tone={tone}
      data-side={side}
      data-has-short={short ? "" : undefined}
      style={{ visibility: "hidden" }}
    >
      <span className="sw-tag__t">
        <span className="sw-tag__full">{text}</span>
        {short && <span className="sw-tag__short">{short}</span>}
      </span>
    </span>
  );
}
