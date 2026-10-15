"use client";

import { useMemo } from "react";
import { clamp, lerp, smootherstep, smoothstep } from "@/lib/animation";
import { getSoftware } from "@/lib/geometry/softwareCache";
import type { JourneyState } from "@/lib/journey";
import { DESK } from "@/lib/sceneConstants";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { Shadow } from "../Shadow";
import { Solid } from "../Solid";

const P = DESK.process;
const T = DESK.thread;
const e3 = (x: number): number => smootherstep(0, 1, x);

/** Names used by the tags, in the order code, textures, audio, data; and the side each tag sits on. */
const FILE_TAGS = [
  { id: "file-code", dx: -0.3 },
  { id: "file-textures", dx: 0.3 },
  { id: "file-audio", dx: -0.3 },
  { id: "file-data", dx: 0.3 },
] as const;

/** Where the highlight sits while the processor works on thread `execAt` (0..2). */
const execZ = (execAt: number): number => {
  const a = clamp(execAt, 0, 2);
  const i0 = Math.floor(a);
  const i1 = Math.min(2, i0 + 1);
  const f = smoothstep(0.3, 0.7, a - i0);
  return lerp(DESK.threadZ[i0] ?? 0, DESK.threadZ[i1] ?? 0, f);
};

/**
 * Everything that appears on the empty tabletop: the game, the files that are made available,
 * the process that groups the running game, and the threads inside it.
 */
export function TableItems() {
  const g = useMemo(() => getSoftware(), []);

  return (
    <>
      {/* The game: an application, drawn as a tile. */}
      <AnimGroup
        position={[DESK.tile[0], DESK.tile[1], DESK.tile[2]]}
        onFrame={(grp, j) => {
          const v = e3(j.sw.game);
          grp.position.y = DESK.tile[1] + (1 - v) * 0.7;
          grp.scale.setScalar(lerp(0.4, 1, v));
        }}
      >
        <Solid part={g.tile} fade={(j) => smoothstep(0, 0.45, j.sw.game)} />
        <Anchor id="sw:app" position={[0, 0.1, 0]} />
        <Anchor id="tag:app" position={[0, 0.1, -0.2]} />
        <Shadow size={[1.2, 1.2]} position={[0, 0.003, 0]} fade={(j) => j.sw.game} alpha={0.14} />
      </AnimGroup>

      {/* Files and assets. The first one grows into the process. */}
      {g.files.map((part, i) => {
        const [fx, , fz] = DESK.files[i] ?? [0, 0, 0];
        const tag = FILE_TAGS[i];
        const vis = (j: JourneyState) => smoothstep(0, 0.45, j.sw.file[i] ?? 0) * (i === 0 ? 1 - smoothstep(0, 0.45, j.sw.proc) : 1);
        return (
          <AnimGroup
            key={i}
            position={[fx, 0, fz]}
            onFrame={(grp, j) => {
              const v = e3(j.sw.file[i] ?? 0);
              const m = i === 0 ? e3(j.sw.proc) : 0;
              grp.position.y = (1 - v) * 0.55;
              grp.scale.setScalar(lerp(0.4, 1, v) * (1 - 0.45 * m));
            }}
          >
            <Solid part={part} fade={vis} />
            {tag && <Anchor id={`tag:${tag.id}`} position={[tag.dx, 0.04, 0]} />}
          </AnimGroup>
        );
      })}
      <Anchor id="sw:files" position={[-1.6, 0.04, 0.6]} />

      {/* The process: a rounded boundary that grows out of the code file. */}
      <AnimGroup
        onFrame={(grp, j) => {
          const m = e3(j.sw.proc);
          const [f0x, , f0z] = DESK.files[0];
          grp.position.set(lerp(f0x, P.x, m), 0, lerp(f0z, P.z, m));
          grp.scale.set(lerp(0.2, 1, m), 1, lerp(0.33, 1, m));
        }}
      >
        <Solid part={g.process} fade={(j) => smoothstep(0, 0.3, j.sw.proc)}>
          <Anchor id="sw:process" position={[P.w / 2 - 0.1, 0.06, 0]} />
          <Anchor id="tag:process" position={[-P.w / 2 + 0.22, 0.06, -P.d / 2 + 0.2]} />
        </Solid>
        <group position={[P.w / 2 - 0.34, 0.05, -P.d / 2 + 0.3]} scale={0.34}>
          <Solid part={g.miniTile} fade={(j) => smoothstep(0.5, 1, j.sw.proc)} />
        </group>
      </AnimGroup>

      {/* A highlight under the thread the processor is working on. */}
      <AnimGroup
        onFrame={(grp, j) => {
          grp.position.set(P.x, 0.052, execZ(j.sw.execAt));
        }}
      >
        <Solid part={g.halo} fade={(j) => 0.95 * smoothstep(0.05, 0.4, j.sw.exec) * smoothstep(0, 0.3, j.sw.thread[0] ?? 0)} />
      </AnimGroup>

      {/* Threads: all inside the same process boundary. */}
      {g.threads.map((part, i) => (
        <AnimGroup
          key={i}
          onFrame={(grp, j) => {
            const v = e3(j.sw.thread[i] ?? 0);
            const hit = clamp(1 - Math.abs(j.sw.execAt - i) / 0.6) * j.sw.exec;
            grp.position.set(P.x, 0.05 + (1 - v) * 0.8 + hit * 0.035, DESK.threadZ[i] ?? 0);
          }}
        >
          <Solid part={part} fade={(j) => smoothstep(0, 0.45, j.sw.thread[i] ?? 0)} />
          <Anchor id={`tag:thread-${i}`} position={[0, 0.1, 0.02]} />
          {i === 0 && <Anchor id="sw:threads" position={[T.w / 2 - 0.15, 0.09, 0.3]} />}
        </AnimGroup>
      ))}
    </>
  );
}
