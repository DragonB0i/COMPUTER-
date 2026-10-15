"use client";

import { useMemo } from "react";
import { seededRandom } from "@/lib/animation";
import { AnimGroup } from "../models/AnimGroup";
import { GlowPoints } from "../models/GlowPoints";
import { ProcessorModel } from "../models/ProcessorModel";
import { WireframeCube } from "../models/WireframeCube";

/** Fine atmospheric particles drifting around the whole journey. */
function Atmosphere() {
  const positions = useMemo(() => {
    const rnd = seededRandom(7);
    const n = 380;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      out[i * 3] = (rnd() - 0.5) * 22;
      out[i * 3 + 1] = (rnd() - 0.5) * 14;
      out[i * 3 + 2] = (rnd() - 0.5) * 12 - 2;
    }
    return out;
  }, []);
  return (
    <AnimGroup
      onFrame={(g, _j, t) => {
        g.rotation.y = t * 0.012;
        g.rotation.x = Math.sin(t * 0.05) * 0.04;
      }}
    >
      <GlowPoints
        positions={positions}
        size={0.055}
        opacity={0.28}
        onFrame={(_p, mat, j) => {
          mat.opacity = 0.3 * (1 - j.sw.light) * Math.min(1, j.intro * 1.4);
        }}
      />
    </AnimGroup>
  );
}

/** The opening: the processor package, which grows into the cube. */
export function HeroScene() {
  return (
    <>
      <Atmosphere />
      <WireframeCube />
      <ProcessorModel />
    </>
  );
}
