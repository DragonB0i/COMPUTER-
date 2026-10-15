"use client";

import { useMemo } from "react";
import { clamp, lerp, smoothstep } from "@/lib/animation";
import { FACE } from "@/lib/geometry/software";
import { getSoftware } from "@/lib/geometry/softwareCache";
import type { JourneyState } from "@/lib/journey";
import { TOWER_DIMS } from "@/lib/sceneConstants";
import { AnimGroup } from "../AnimGroup";
import { Anchor } from "../Anchor";
import { GlowPoints } from "../GlowPoints";
import { LineSet, setFade } from "../LineSet";

/** The front panel is visible once the tower has flattened, and gives way to the swarm. */
const faceVisible = (j: JourneyState): number => smoothstep(0.5, 1, j.sw.face) * (1 - smoothstep(0.3, 0.78, j.sw.swarm));

/** How far each of the two pulse rings has travelled (0..1) for a given button brightness. */
const ringProgress = (power: number, delay: number): number => clamp((power - 0.5 - delay) / (0.5 - delay));

/**
 * The reassembled computer seen from the front: slits, drive bay and ports, and the round power
 * button. The button glows softly while the machine waits, then brightens and sends out pulses.
 */
export function PowerFace() {
  const g = useMemo(() => getSoftware(), []);
  const glow = useMemo(() => new Float32Array([0, 0, 0]), []);
  const [bx, by] = FACE.button;

  return (
    <group position={[0, 0, TOWER_DIMS.z / 2 + 0.003]}>
      <LineSet positions={g.face} color="#e4e4e4" onFrame={(o, m, j) => setFade(o, m, 0.8 * faceVisible(j))} />

      <group position={[bx, by, 0.004]}>
        <LineSet
          positions={g.button}
          onFrame={(o, m, j) => setFade(o, m, faceVisible(j) * (0.45 + 0.55 * j.sw.power))}
        />
        <GlowPoints
          positions={glow}
          size={0.85}
          onFrame={(pts, mat, j, t) => {
            const breathe = 0.5 + 0.5 * Math.sin(t * 2.1);
            mat.opacity = faceVisible(j) * (0.12 + 0.12 * breathe + 0.7 * j.sw.power);
            mat.size = 0.7 + 0.5 * j.sw.power;
            pts.visible = mat.opacity > 0.004;
          }}
        />
        {[0, 0.16].map((delay) => (
          <AnimGroup
            key={delay}
            onFrame={(grp, j) => {
              const p = ringProgress(j.sw.power, delay);
              const s = FACE.buttonR * lerp(1.1, 9, 1 - (1 - p) * (1 - p));
              grp.scale.set(s, s, 1);
            }}
          >
            <LineSet
              positions={g.ring}
              onFrame={(o, m, j) => {
                const p = ringProgress(j.sw.power, delay);
                setFade(o, m, p > 0.001 ? faceVisible(j) * 0.85 * (1 - p) * (1 - p) : 0);
              }}
            />
          </AnimGroup>
        ))}
        <Anchor id="sw:power" position={[0, 0, 0]} />
      </group>
    </group>
  );
}
