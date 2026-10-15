"use client";

import { useMemo } from "react";
import { LineBuilder } from "@/lib/lineBuilder";
import { cubeCorners } from "@/lib/geometry/cpu";
import { rigPose } from "@/lib/rig";
import { TOWER_DIMS } from "@/lib/sceneConstants";
import { smoothstep } from "@/lib/animation";
import { easeOutCubic } from "@/lib/ease";
import { AnimGroup } from "./AnimGroup";
import { GlowPoints } from "./GlowPoints";
import { LineSet, setDraw, setFade } from "./LineSet";

/**
 * The protagonist. One unit box scaled non-uniformly: a flat slab (the CPU package), a cube
 * (the history chapter) and a tower (the desktop computer) are all this same outline.
 */
export function WireframeCube() {
  const edges = useMemo(() => new LineBuilder().box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5).build(), []);
  const corners = useMemo(() => cubeCorners(), []);

  return (
    <AnimGroup
      onFrame={(g, j) => {
        g.scale.set(rigPose.dimX, rigPose.dimY, rigPose.dimZ);
        // While the tower flattens into its front panel, the front face stays where it is.
        g.position.z = j.sw.face > 0.001 ? (TOWER_DIMS.z - rigPose.dimZ) / 2 : 0;
      }}
    >
      <LineSet
        positions={edges}
        onFrame={(obj, mat, j) => {
          const intro = easeOutCubic(j.intro);
          const gone = 1 - smoothstep(0, 0.6, j.boardFocus);
          setDraw(obj, intro);
          setFade(obj, mat, 0.95 * gone * (1 - smoothstep(0.35, 0.7, j.sw.swarm)));
        }}
      />
      <GlowPoints
        positions={corners}
        size={0.2}
        onFrame={(pts, mat, j, t) => {
          const gone = 1 - smoothstep(0, 0.5, j.boardFocus);
          const pulse = 0.78 + 0.22 * Math.sin(t * 1.6);
          mat.size = 0.2 * Math.max(rigPose.scale, 0.6);
          mat.opacity = easeOutCubic(j.intro) * pulse * gone * (1 - smoothstep(0.3, 0.6, j.sw.swarm));
          pts.visible = mat.opacity > 0.004;
        }}
      />
    </AnimGroup>
  );
}
