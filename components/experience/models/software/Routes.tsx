"use client";

import { clamp, smootherstep, smoothstep } from "@/lib/animation";
import type { JourneyState } from "@/lib/journey";
import type { P3 } from "@/lib/polyline";
import { rigPose } from "@/lib/rig";
import { GPU_DIMS } from "@/lib/geometry/software";
import { DESK } from "@/lib/sceneConstants";
import { RouteLine } from "../RouteLine";
import { cpuHeight } from "./Processors";

const P = DESK.process;
const CPU = DESK.cpu;
const TZ = DESK.threadZ;
const THREAD_TOP = 0.15;

const set = (p: P3, x: number, y: number, z: number): void => {
  p[0] = x;
  p[1] = y;
  p[2] = z;
};

/**
 * Where the drawer's items leave from, where each file lands (code, textures, audio, data), and the
 * lane the line travels in. Front-row files are reached straight on; back-row files are reached by a
 * lane through the gap between the columns or around the right side, so no line crosses another file.
 */
const LOAD_ROUTES = [
  { from: [-2.17, -0.5, 2.0], x: DESK.files[0][0], z: DESK.files[0][2], lane: -1.6 },
  { from: [-1.04, -0.5, 2.0], x: DESK.files[1][0], z: DESK.files[1][2], lane: -0.6 },
  { from: [-2.04, -0.5, 1.52], x: DESK.files[2][0], z: DESK.files[2][2], lane: null },
  { from: [-0.95, -0.5, 1.52], x: DESK.files[3][0], z: DESK.files[3][2], lane: null },
] as const;

/** Index of the thread the execution line points at, with a quick hop between neighbours. */
const execTarget = (execAt: number): { z: number; x: number } => {
  const a = clamp(execAt, 0, 2);
  const i0 = Math.floor(a);
  const i1 = Math.min(2, i0 + 1);
  const f = smoothstep(0.3, 0.7, a - i0);
  const z = (TZ[i0] ?? 0) + ((TZ[i1] ?? 0) - (TZ[i0] ?? 0)) * f;
  return { z, x: 1.15 + 0.3 * (i0 + f) };
};

const pulseTrain = (t: number, drawn: number, n: number, speed: number): number[] =>
  Array.from({ length: n }, (_, k) => (((t * speed + k / n) % 1) * drawn));

/**
 * The conceptual lines of the tabletop scene: files travelling from the drawer to the table, the
 * processor linked to the table and to the thread it executes, and graphics work on its way to the
 * GPU. They are pictures of relationships, not cables.
 */
export function Routes() {
  return (
    <>
      {/* Files leave the drawer's tray and arrive on the tabletop. */}
      {LOAD_ROUTES.map((r, i) => (
        <RouteLine
          key={i}
          count={6}
          update={(_j, pts) => {
            const [sx, sy, sz] = r.from;
            const lane = r.lane ?? sx;
            set(pts[0]!, sx, sy, sz);
            set(pts[1]!, sx, 0.5, sz);
            set(pts[2]!, lane, 0.5, sz);
            set(pts[3]!, lane, 0.5, r.z);
            set(pts[4]!, r.x, 0.5, r.z);
            set(pts[5]!, r.x, 0.06, r.z);
          }}
          draw={(j) => smoothstep(i * 0.12, i * 0.12 + 0.6, j.sw.load)}
          fade={(j) => 1 - 0.5 * smoothstep(0, 1, j.sw.proc)}
          pulses={(j, t) => pulseTrain(t, smoothstep(i * 0.12, i * 0.12 + 0.6, j.sw.load), 2, 0.34 + i * 0.03)}
          dot={0.12}
        />
      ))}

      {/* The processor is linked to the tabletop. */}
      <RouteLine
        count={2}
        update={(j, pts) => {
          const y = cpuHeight(j.sw.cpu2) - 0.07;
          set(pts[0]!, 0.65, y, CPU[2]);
          set(pts[1]!, 0.65, 0.07, CPU[2]);
        }}
        draw={(j) => smoothstep(0.35, 1, j.sw.cpu2)}
        fade={(j) => smoothstep(0.2, 0.7, j.sw.cpu2)}
        dot={0.12}
      />

      {/* Execution: the processor works on one thread at a time. */}
      <RouteLine
        count={4}
        update={(j, pts) => {
          const tg = execTarget(j.sw.execAt);
          const y = cpuHeight(j.sw.cpu2) - 0.07;
          set(pts[0]!, tg.x, y, CPU[2]);
          set(pts[1]!, tg.x, 0.62, CPU[2]);
          set(pts[2]!, tg.x, 0.62, tg.z);
          set(pts[3]!, tg.x, THREAD_TOP, tg.z);
        }}
        draw={(j) => smootherstep(0, 1, j.sw.exec)}
        fade={(j) => smoothstep(0, 0.2, j.sw.exec)}
        pulses={(j, t) => pulseTrain(t, smootherstep(0, 1, j.sw.exec), 2, 0.55)}
        dot={0.16}
      />

      {/* Graphics work leaves the render thread for the GPU. */}
      <RouteLine
        count={4}
        update={(_j, pts) => {
          const g = rigPose.gpu;
          const x0 = P.x + DESK.thread.w / 2 + 0.03;
          set(pts[0]!, x0, 0.14, TZ[1]);
          if (rigPose.compact > 0.5) {
            // Narrow layout: out over the table's right edge, then forward to the card in front of it.
            set(pts[1]!, 3.05, 0.14, TZ[1]);
            set(pts[2]!, 3.05, 0.22, g[2]);
            set(pts[3]!, g[0] + GPU_DIMS.x / 2, 0.22, g[2]);
          } else {
            set(pts[1]!, 3.0, 0.14, TZ[1]);
            set(pts[2]!, 3.0, 0.14, TZ[1]);
            set(pts[3]!, 3.38, 0.22, TZ[1]);
          }
        }}
        draw={(j) => smootherstep(0, 1, j.sw.gfx)}
        fade={(j) => smoothstep(0, 0.2, j.sw.gfx)}
        pulses={(j, t) => pulseTrain(t, smootherstep(0, 1, j.sw.gfx), 3, 0.5)}
        dot={0.15}
      />

      {/* The graphics card and its own memory are joined to each other, not to the tabletop. */}
      <RouteLine
        count={2}
        update={(_j, pts) => {
          set(pts[0]!, rigPose.vram[0], 0.08, rigPose.vram[2] - 0.3);
          set(pts[1]!, rigPose.vram[0], 0.08, rigPose.gpu[2] + 0.5);
        }}
        draw={(j) => smootherstep(0.2, 1, j.sw.vram)}
        fade={(j: JourneyState) => smoothstep(0.1, 0.5, j.sw.vram)}
        dot={0.11}
      />
    </>
  );
}
