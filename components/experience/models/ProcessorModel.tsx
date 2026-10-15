"use client";

import { useMemo } from "react";
import { LineBuilder } from "@/lib/lineBuilder";
import { cpuPins, cpuTopDetail } from "@/lib/geometry/cpu";
import { CPU_DIMS } from "@/lib/sceneConstants";
import { rigPose } from "@/lib/rig";
import { smoothstep } from "@/lib/animation";
import { easeOutCubic } from "@/lib/ease";
import { AnimGroup } from "./AnimGroup";
import { GlowPoints } from "./GlowPoints";
import { LineSet, setDraw, setFade } from "./LineSet";

/**
 * Details of the opening processor package: raised heat spreader, the die floorplan, surface
 * mount capacitors and the pin grid. They fade as the package grows into the cube.
 */
export function ProcessorModel() {
  const top = useMemo(() => cpuTopDetail(), []);
  const pins = useMemo(() => cpuPins(), []);
  const ihs = useMemo(() => {
    const h = CPU_DIMS.ihsHalf;
    return new LineBuilder().box(-h, 0, -h, h, CPU_DIMS.ihsHeight, h).build();
  }, []);
  const dieGlow = useMemo(() => new Float32Array([0, 0, 0]), []);
  const xz = () => rigPose.dimX / CPU_DIMS.width;

  const detail = (j: { morph: number; intro: number }) =>
    (1 - smoothstep(0.02, 0.45, j.morph)) * (0.3 + 0.7 * easeOutCubic(j.intro));

  return (
    <>
      {/* Heat spreader plate and the face detail that sits on it. */}
      <AnimGroup
        onFrame={(g) => {
          g.position.y = rigPose.dimY / 2;
          g.scale.set(xz(), 1, xz());
        }}
      >
        <LineSet
          positions={ihs}
          onFrame={(obj, mat, j) => {
            setDraw(obj, easeOutCubic(j.intro));
            setFade(obj, mat, 0.85 * detail(j));
          }}
        />
        <LineSet
          positions={top}
          position={[0, CPU_DIMS.ihsHeight + 0.002, 0]}
          color="#e8e8e8"
          onFrame={(obj, mat, j) => {
            setDraw(obj, Math.min(1, easeOutCubic(j.intro) * 1.1));
            setFade(obj, mat, 0.9 * detail(j));
          }}
        />
        <GlowPoints
          positions={dieGlow}
          size={1.5}
          onFrame={(pts, mat, j, t) => {
            pts.position.y = CPU_DIMS.ihsHeight + 0.01;
            mat.opacity = 0.22 * detail(j) * (0.8 + 0.2 * Math.sin(t * 1.3)) * j.intro;
            pts.visible = mat.opacity > 0.004;
          }}
        />
      </AnimGroup>

      {/* Pin grid hanging under the substrate. */}
      <AnimGroup
        onFrame={(g) => {
          g.position.y = -rigPose.dimY / 2;
          g.scale.set(xz(), 1, xz());
        }}
      >
        <LineSet
          positions={pins}
          color="#cfcfcf"
          onFrame={(obj, mat, j) => {
            setDraw(obj, easeOutCubic(Math.max(0, j.intro * 1.3 - 0.3)));
            setFade(obj, mat, 0.7 * detail(j));
          }}
        />
      </AnimGroup>
    </>
  );
}
