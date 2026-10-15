"use client";

import { useMemo } from "react";
import { lerp, smootherstep, smoothstep } from "@/lib/animation";
import { CPU_PKG } from "@/lib/geometry/software";
import { getSoftware } from "@/lib/geometry/softwareCache";
import type { JourneyState } from "@/lib/journey";
import { rigPose } from "@/lib/rig";
import { DESK, DRAWER_DIMS } from "@/lib/sceneConstants";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { LineSet, setFade } from "../LineSet";
import { INK, Solid } from "../Solid";

/** How far the tray slides out of the drawer, in local units. */
export const DRAWER_OPEN = 1.1;

const FZ = DRAWER_DIMS.z / 2;

/** The processor package fades in when it returns, and stays as the body of the drawer. */
const bodyVisible = (j: JourneyState): number => smoothstep(0.55, 0.95, j.sw.cpu);
const chipVisible = (j: JourneyState): number => bodyVisible(j) * (1 - smoothstep(0, 0.3, j.sw.drawer));
const drawerVisible = (j: JourneyState): number => smoothstep(0.45, 0.9, j.sw.drawer);

const tintSand = (_j: JourneyState, c: { set: (hex: number) => unknown }): void => {
  c.set(0xe9e0cc);
};

/**
 * The protagonist of the light chapter. One box, scaled by the rig: the processor package first,
 * then the storage drawer, which finally slides underneath the tabletop. The heat spreader and pins
 * ride on the package; the drawer's front panel, tray and files ride on the drawer.
 */
export function Protagonist() {
  const g = useMemo(() => getSoftware(), []);

  return (
    <AnimGroup
      onFrame={(grp, j) => {
        const u = smootherstep(0, 1, j.sw.under);
        grp.position.set(lerp(0, DESK.drawer[0], u), lerp(0, DESK.drawer[1], u), lerp(0, DESK.drawer[2], u));
      }}
    >
      <AnimGroup
        onFrame={(b) => {
          b.scale.set(rigPose.dimX, rigPose.dimY, rigPose.dimZ);
        }}
      >
        <Solid part={g.unit} fade={bodyVisible} tint={tintSand} />
      </AnimGroup>

      {/* Heat spreader and die on top of the package. */}
      <AnimGroup
        onFrame={(t) => {
          t.position.y = rigPose.dimY / 2;
          const k = rigPose.dimX / CPU_PKG.w;
          t.scale.set(k, 1, k);
        }}
      >
        <Solid part={g.chipTop} fade={chipVisible} />
      </AnimGroup>

      {/* Pin grid under the package. */}
      <AnimGroup
        onFrame={(p) => {
          p.position.y = -rigPose.dimY / 2;
          const k = rigPose.dimX / CPU_PKG.w;
          p.scale.set(k, 1, k);
        }}
      >
        <LineSet positions={g.chipPins} color={INK} depth onFrame={(o, m, j) => setFade(o, m, 0.55 * chipVisible(j))} />
      </AnimGroup>

      <Anchor id="tag:storage" position={[DRAWER_DIMS.x / 2, -0.38, 0.75]} />

      {/* The dark opening the tray slides out of. */}
      <Solid part={g.drawerSlot} fade={(j) => drawerVisible(j) * smoothstep(0.02, 0.14, j.sw.open)} />

      {/* Front panel with its handle: leaves with the tray. */}
      <AnimGroup
        onFrame={(f, j) => {
          f.position.z = smootherstep(0, 1, j.sw.open) * DRAWER_OPEN;
        }}
      >
        <Solid part={g.drawer.front} fade={drawerVisible}>
          <Anchor id="sw:storage" position={[0, 0.08, FZ + 0.2]} />
        </Solid>
      </AnimGroup>

      {/* Tray and the folders and files standing in it. */}
      <AnimGroup
        onFrame={(f, j) => {
          f.position.z = smootherstep(0, 1, j.sw.open) * DRAWER_OPEN;
        }}
      >
        <Solid part={g.drawer.tray} fade={drawerVisible} />
        <Solid part={g.drawer.items} fade={(j) => drawerVisible(j) * smoothstep(0.02, 0.2, j.sw.open)} />
      </AnimGroup>
    </AnimGroup>
  );
}
