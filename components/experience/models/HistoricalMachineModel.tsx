"use client";

import { useMemo } from "react";
import { MACHINE_BUILDERS } from "@/lib/geometry/machines";
import { AnimGroup } from "./AnimGroup";
import { Anchor } from "./Anchor";
import { LineSet, setDraw, setFade } from "./LineSet";

interface Props {
  index: number;
}

/**
 * One historical machine drawn inside the cube. `build` constructs the schematic segment by
 * segment (draw range), `vis` fades it, and `hl` brightens the accent geometry the milestone
 * is about.
 */
export function HistoricalMachineModel({ index }: Props) {
  const geo = useMemo(() => {
    const build = MACHINE_BUILDERS[index];
    if (!build) throw new Error(`No machine builder for milestone ${index}`);
    return build();
  }, [index]);

  return (
    <AnimGroup
      onFrame={(g, j) => {
        g.visible = (j.vis[index] ?? 0) > 0.004;
      }}
    >
      <LineSet
        positions={geo.base}
        color="#cfcfcf"
        onFrame={(obj, mat, j) => {
          setDraw(obj, j.build[index] ?? 0);
          setFade(obj, mat, (j.vis[index] ?? 0) * (0.5 + 0.1 * (j.hl[index] ?? 0)));
        }}
      />
      <LineSet
        positions={geo.accent}
        additive
        onFrame={(obj, mat, j, t) => {
          const hl = j.hl[index] ?? 0;
          // The vacuum tubes of ENIAC flicker very slightly, like warm filaments.
          const flicker = index === 3 ? 0.92 + 0.08 * Math.sin(t * 6.5) : 1;
          setDraw(obj, j.build[index] ?? 0);
          setFade(obj, mat, (j.vis[index] ?? 0) * (0.55 + 0.45 * hl) * flicker);
        }}
      />
      {geo.labels?.map((l) => (
        <Anchor key={l.text} id={`vn:${l.text}`} position={l.position} />
      ))}
    </AnimGroup>
  );
}
