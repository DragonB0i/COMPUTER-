"use client";

import { useMemo } from "react";
import { smootherstep, smoothstep } from "@/lib/animation";
import { CPU_PKG, GPU_DIMS, VRAM_DIMS } from "@/lib/geometry/software";
import { getSoftware } from "@/lib/geometry/softwareCache";
import { rigPose } from "@/lib/rig";
import { DESK } from "@/lib/sceneConstants";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { LineSet, setFade } from "../LineSet";
import { Shadow } from "../Shadow";
import { INK, Solid } from "../Solid";

const e3 = (x: number): number => smootherstep(0, 1, x);

/** Height of the hovering processor's centre above the table. */
export const cpuHeight = (cpu2: number, time = 0): number => DESK.cpu[1] + (1 - e3(cpu2)) * 1.4 + Math.sin(time * 1.1) * 0.03;

/** The processor hovering above the tabletop, and the graphics card with its own memory at the right. */
export function Processors() {
  const g = useMemo(() => getSoftware(), []);
  const [cx, , cz] = DESK.cpu;

  return (
    <>
      {/* CPU */}
      <AnimGroup
        onFrame={(grp, j, t) => {
          grp.position.set(cx, cpuHeight(j.sw.cpu2, t), cz);
          grp.scale.setScalar(DESK.cpuScale);
        }}
      >
        <Solid part={g.cpu} fade={(j) => smoothstep(0, 0.4, j.sw.cpu2)} />
        <group position={[0, -CPU_PKG.t / 2, 0]}>
          <LineSet positions={g.chipPins} color={INK} depth onFrame={(o, m, j) => setFade(o, m, 0.5 * smoothstep(0.2, 0.7, j.sw.cpu2))} />
        </group>
        <Anchor id="sw:cpu" position={[CPU_PKG.w / 2, 0.05, 0]} />
        <Anchor id="tag:cpu" position={[CPU_PKG.w / 2, 0.1, 0]} />
      </AnimGroup>
      <Shadow size={[2.0, 2.0]} position={[cx, 0.006, cz]} fade={(j) => smoothstep(0.3, 1, j.sw.cpu2)} alpha={0.16} />

      {/* GPU on its own mat, with VRAM beside it */}
      <AnimGroup
        onFrame={(grp) => {
          const p = rigPose.gpuPad;
          grp.position.set(p[0], p[1], p[2]);
        }}
      >
        <Solid part={g.gpuPad} fade={(j) => smoothstep(0, 0.4, j.sw.gpu)} />
      </AnimGroup>

      <AnimGroup
        onFrame={(grp, j) => {
          const v = e3(j.sw.gpu);
          const p = rigPose.gpu;
          grp.position.set(p[0] + (1 - v) * 1.2, p[1] + (1 - v) * 1.0, p[2]);
        }}
      >
        <Solid part={g.gpu.body} fade={(j) => smoothstep(0, 0.4, j.sw.gpu)} />
        {g.gpu.fanCenters.map((c, i) => (
          <group key={i} position={[c[0], c[1], c[2]]}>
            <LineSet positions={g.gpu.fanFrames} color={INK} depth onFrame={(o, m, j) => setFade(o, m, 0.6 * smoothstep(0.2, 0.7, j.sw.gpu))} />
            <AnimGroup
              onFrame={(r, _j, t) => {
                r.rotation.y = t * (2.2 + i * 0.3);
              }}
            >
              <LineSet positions={g.gpu.fanRotor} color={INK} depth onFrame={(o, m, j) => setFade(o, m, 0.8 * smoothstep(0.2, 0.7, j.sw.gpu))} />
            </AnimGroup>
          </group>
        ))}
        <Anchor id="sw:gpu" position={[GPU_DIMS.x / 2, 0.1, 0]} />
        <Anchor id="tag:gpu" position={[0, 0.42, 0]} />
      </AnimGroup>
      <AnimGroup
        onFrame={(grp) => {
          grp.position.set(rigPose.gpu[0], 0, rigPose.gpu[2]);
        }}
      >
        <Shadow size={[2.4, 1.4]} fade={(j) => smoothstep(0.3, 1, j.sw.gpu)} alpha={0.14} />
      </AnimGroup>

      <AnimGroup
        onFrame={(grp, j) => {
          const p = rigPose.vram;
          grp.position.set(p[0], p[1] + (1 - e3(j.sw.vram)) * 0.6, p[2]);
        }}
      >
        <Solid part={g.vram} fade={(j) => smoothstep(0, 0.45, j.sw.vram)} />
        <Anchor id="sw:vram" position={[VRAM_DIMS.x / 2, 0.08, 0]} />
        <Anchor id="tag:vram" position={[VRAM_DIMS.x / 2, 0.08, 0]} />
      </AnimGroup>
    </>
  );
}
