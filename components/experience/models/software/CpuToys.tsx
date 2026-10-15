"use client";

import { useMemo, type ReactNode } from "react";
import { lerp, smootherstep, smoothstep, tri } from "@/lib/animation";
import { CPU_PKG } from "@/lib/geometry/software";
import { getSoftware } from "@/lib/geometry/softwareCache";
import type { JourneyState } from "@/lib/journey";
import { rigPose } from "@/lib/rig";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { LineSet, setFade } from "../LineSet";
import { Shadow } from "../Shadow";
import { INK, Solid } from "../Solid";

/** Height of the chip's top surface, where the illustrations stand. */
const TOP = CPU_PKG.t / 2 + 0.078;

/** Where each illustration stands on the chip (x, z from its centre). The book floats beside it. */
const LAYOUT = {
  core: [-0.42, -0.34],
  registers: [0.46, -0.48],
  alu: [0.56, 0.46],
  worker: [-0.8, 0.8],
} as const;
const BOOK = { x: 2.05, y: 0.62, z: 0.05 } as const;

/** Visibility of illustration `i`: it appears with its concept and leaves as the chip becomes a drawer. */
const toyVisible = (j: JourneyState, i: number): number => smootherstep(0, 1, j.sw.toy[i] ?? 0) * (1 - smoothstep(0, 0.25, j.sw.drawer));

interface ToyProps {
  index: number;
  x: number;
  z: number;
  /** Extra height above the chip surface. */
  lift?: number;
  /** Keep the illustration facing the viewer (for flat, standing cut-outs). */
  billboard?: boolean;
  children: ReactNode;
}

/** Positions an illustration, pops it in with its concept and gives it a small lift while it is in focus. */
function Toy({ index, x, z, lift = 0, billboard = false, children }: ToyProps) {
  return (
    <AnimGroup
      onFrame={(g, j, t) => {
        const v = smootherstep(0, 1, j.sw.toy[index] ?? 0);
        const focus = tri(j.sw.focus, index, 0.55);
        g.position.set(x, TOP + lift + (1 - v) * 0.5 + focus * 0.03 + Math.sin(t * 1.3 + index) * 0.008, z);
        g.scale.setScalar(lerp(0.45, 1, v) * (1 + 0.04 * focus));
        if (billboard) g.rotation.y = -rigPose.rotY;
      }}
    >
      {children}
    </AnimGroup>
  );
}

/**
 * The five ideas that explain a processor, as small objects on a miniature chip: a core, registers, an
 * ALU, a control unit and, floating apart because it is a specification and not a part, the ISA.
 */
export function CpuToys() {
  const g = useMemo(() => getSoftware(), []);
  const fade = (i: number) => (j: JourneyState) => toyVisible(j, i);

  return (
    <>
      {/* 0 — CPU core */}
      <Toy index={0} x={LAYOUT.core[0]} z={LAYOUT.core[1]}>
        <Solid part={g.core.base} fade={fade(0)} />
        <AnimGroup
          onFrame={(r, _j, t) => {
            r.rotation.y = t * 0.55;
          }}
        >
          <Solid part={g.core.ring} fade={fade(0)} />
        </AnimGroup>
        <AnimGroup
          onFrame={(h, _j, t) => {
            h.scale.setScalar(1 + 0.08 * Math.sin(t * 2.4));
          }}
        >
          <Solid
            part={g.core.heart}
            fade={fade(0)}
            tint={(_j, c) => {
              c.set(0xffffff);
            }}
          />
        </AnimGroup>
        <Anchor id="sw:core" position={[0, 0.16, 0]} />
        <Shadow size={[0.9, 0.9]} fade={fade(0)} alpha={0.16} position={[0, 0.002, 0]} />
      </Toy>

      {/* 1 — Registers */}
      <Toy index={1} x={LAYOUT.registers[0]} z={LAYOUT.registers[1]}>
        <Solid part={g.registers} fade={fade(1)} />
        <Anchor id="sw:registers" position={[0, 0.3, 0]} />
        <Shadow size={[0.95, 0.65]} fade={fade(1)} alpha={0.16} position={[0, 0.002, 0]} />
      </Toy>

      {/* 2 — ALU: a calculator with its three symbols hovering above */}
      <Toy index={2} x={LAYOUT.alu[0]} z={LAYOUT.alu[1]}>
        <Solid part={g.alu.body} fade={fade(2)} />
        <AnimGroup
          onFrame={(s, _j, t) => {
            s.rotation.y = -rigPose.rotY;
            s.position.y = 0.42 + Math.sin(t * 1.5) * 0.02;
          }}
        >
          {(
            [
              [g.alu.plus, -0.2, 0],
              [g.alu.minus, 0, 0.1],
              [g.alu.equals, 0.2, 0],
            ] as const
          ).map(([part, x, y], k) => (
            <group key={k} position={[x, y, 0]}>
              <Solid part={part} fade={fade(2)} />
            </group>
          ))}
        </AnimGroup>
        <Anchor id="sw:alu" position={[0, 0.2, 0.1]} />
        <Shadow size={[0.9, 1.1]} fade={fade(2)} alpha={0.16} position={[0, 0.002, 0]} />
      </Toy>

      {/* 3 — Control unit: a worker in a hard hat who points the way */}
      <Toy index={3} x={LAYOUT.worker[0]} z={LAYOUT.worker[1]} billboard>
        <Solid part={g.worker.body} fade={fade(3)} />
        <AnimGroup
          position={[g.worker.shoulder[0], g.worker.shoulder[1], 0.036]}
          onFrame={(a, _j, t) => {
            a.rotation.z = 0.28 + Math.sin(t * 1.7) * 0.22;
          }}
        >
          <Solid part={g.worker.arm} fade={fade(3)} />
        </AnimGroup>
        <Anchor id="sw:control" position={[0.05, 0.62, 0.04]} />
      </Toy>

      {/* 4 — ISA: a rulebook that floats beside the chip, outside it */}
      <AnimGroup
        onFrame={(grp, j, t) => {
          const v = smootherstep(0, 1, j.sw.toy[4] ?? 0);
          const focus = tri(j.sw.focus, 4, 0.55);
          grp.position.set(BOOK.x, TOP + BOOK.y - 0.5 + v * 0.5 + Math.sin(t * 1.1) * 0.05 + focus * 0.04, BOOK.z);
          grp.scale.setScalar(lerp(0.5, 1, v));
        }}
      >
        <AnimGroup
          onFrame={(b, _j, t) => {
            b.rotation.y = 0.4 + Math.sin(t * 0.5) * 0.25;
          }}
        >
          <Solid part={g.book} fade={fade(4)} />
        </AnimGroup>
        <Anchor id="sw:isa" position={[0, 0.1, 0]} />
        <Anchor id="tag:isa" position={[0, 0.4, 0]} />
      </AnimGroup>
      {/* A dashed ring marks the book as a conceptual layer next to the chip, not a part of it. */}
      <group position={[BOOK.x, TOP - 0.02, BOOK.z]}>
        <LineSet positions={g.bookRing} color={INK} onFrame={(o, m, j) => setFade(o, m, 0.5 * toyVisible(j, 4))} />
      </group>
    </>
  );
}
