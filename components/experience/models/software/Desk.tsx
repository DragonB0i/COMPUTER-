"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { lerp, smootherstep, smoothstep } from "@/lib/animation";
import { DESK_FLOOR, RAM_STICK } from "@/lib/geometry/software";
import { getSoftware } from "@/lib/geometry/softwareCache";
import { DESK, TABLE_DIMS } from "@/lib/sceneConstants";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { LineSet, setFade } from "../LineSet";
import { Shadow } from "../Shadow";
import { INK, Solid } from "../Solid";

const STICK_GREEN = new THREE.Color(0xc7e5d3);
const TABLE_TONE = new THREE.Color(0xfaf5e8);

/**
 * The memory stick that stretches into the tabletop. The tabletop is a metaphor for working
 * memory, not the shape of a real module: first the stick appears, then it widens into an empty
 * slab, then it settles above the drawer that has slid underneath.
 */
export function Desk() {
  const g = useMemo(() => getSoftware(), []);
  const R = RAM_STICK;
  const T = TABLE_DIMS;

  return (
    <>
      {/* The stick / table body */}
      <AnimGroup
        onFrame={(grp, j, t) => {
          const S = j.sw;
          const stretch = smootherstep(0, 1, smoothstep(0, 0.7, S.table));
          const drop = smootherstep(0, 1, smoothstep(0.65, 1, S.table));
          const hover = (1 - drop) * (Math.sin(t * 1.2) * 0.03 + 0.02);
          grp.position.set(
            0,
            lerp(DESK.stickStart[1], -T.y / 2, drop) + hover * (1 - stretch),
            lerp(DESK.stickStart[2], 0, stretch),
          );
          grp.scale.set(lerp(R.x, T.x, stretch), lerp(R.y, T.y, stretch), lerp(R.z, T.z, stretch));
        }}
      >
        <Solid
          part={g.unit}
          fade={(j) => smoothstep(0, 0.4, j.sw.ram)}
          tint={(j, c) => {
            c.copy(STICK_GREEN).lerp(TABLE_TONE, smoothstep(0, 0.6, j.sw.table));
          }}
        />
      </AnimGroup>

      {/* Chips and contacts: they belong to the stick and fade as it widens. */}
      <AnimGroup
        onFrame={(grp, j, t) => {
          const hover = Math.sin(t * 1.2) * 0.03 + 0.02;
          grp.position.set(0, DESK.stickStart[1] + hover, DESK.stickStart[2]);
          grp.visible = j.sw.table < 0.5;
        }}
      >
        <Solid part={g.stickDetail} fade={(j) => smoothstep(0, 0.4, j.sw.ram) * (1 - smoothstep(0, 0.3, j.sw.table))} />
      </AnimGroup>

      {/* Border on the tabletop, legs and the shadow the desk casts. */}
      <AnimGroup position={[0, -T.y / 2, 0]}>
        <LineSet positions={g.tableMarks} color={INK} depth onFrame={(o, m, j) => setFade(o, m, 0.3 * smoothstep(0.85, 1, j.sw.table))} />
      </AnimGroup>
      <Solid part={g.legs} fade={(j) => smoothstep(0.9, 1, j.sw.table)} />
      <Shadow
        size={[T.x + 1.4, T.z + 1.2]}
        position={[-0.2, DESK_FLOOR + 0.01, 0.2]}
        fade={(j) => smoothstep(0.8, 1, j.sw.table)}
        alpha={0.2}
      />

      {/* Anchors for the explanation and the tag. */}
      <Anchor id="sw:ram" position={[1.0, 0, 1.2]} />
      <Anchor id="tag:ram" position={[-0.55, 0, -1.7]} />
    </>
  );
}
