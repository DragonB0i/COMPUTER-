"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { assign } from "@/lib/assign";
import { journey, type JourneyState } from "@/lib/journey";
import type { MeshData, SolidPart } from "@/lib/geometry/solids";

/** Charcoal used for every outline in the light chapter. */
export const INK = "#1b1a18";

interface SolidProps extends Omit<ThreeElements["group"], "ref"> {
  part: SolidPart;
  /** Visibility from 0 to 1, evaluated every frame. Below a hair's breadth the object is not drawn at all. */
  fade: (j: JourneyState, time: number) => number;
  /** Optionally changes the fill colour (it multiplies the baked colours) every frame. */
  tint?: (j: JourneyState, colour: THREE.Color) => void;
  /** Opacity of the main outlines and of the fainter detail lines when fully visible. */
  lineAlpha?: number;
  softAlpha?: number;
  /** Draw order inside the transparent pass; later objects are painted on top of earlier ones. */
  order?: number;
}

const fillGeometry = (m: MeshData): THREE.BufferGeometry => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute("color", new THREE.BufferAttribute(m.colors, 3));
  g.computeBoundingSphere();
  return g;
};

const lineGeometry = (p: Float32Array): THREE.BufferGeometry => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.computeBoundingSphere();
  return g;
};

/**
 * One finished object of the light chapter: flat-shaded faces with vertex colours, charcoal
 * outlines and fainter detail lines. Geometry and materials are built once and disposed on unmount;
 * everything that changes (visibility, tint) is written imperatively from the render loop.
 */
export function Solid({ part, fade, tint, lineAlpha = 0.92, softAlpha = 0.38, order = 0, children, ...rest }: SolidProps) {
  const group = useRef<THREE.Group>(null);

  const { fill, lines, soft, fillMat, lineMat, softMat } = useMemo(() => {
    const hasFill = part.fill.positions.length > 0;
    const hasLines = part.lines.length > 0;
    const hasSoft = !!part.soft && part.soft.length > 0;
    return {
      fill: hasFill ? fillGeometry(part.fill) : null,
      lines: hasLines ? lineGeometry(part.lines) : null,
      soft: hasSoft && part.soft ? lineGeometry(part.soft) : null,
      fillMat: new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        toneMapped: false,
      }),
      lineMat: new THREE.LineBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false }),
      softMat: new THREE.LineBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false }),
    };
  }, [part]);

  useEffect(() => {
    return () => {
      fill?.dispose();
      lines?.dispose();
      soft?.dispose();
      fillMat.dispose();
      lineMat.dispose();
      softMat.dispose();
    };
  }, [fill, lines, soft, fillMat, lineMat, softMat]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const f = Math.min(Math.max(fade(journey, state.clock.elapsedTime), 0), 1);
    g.visible = f > 0.004;
    if (!g.visible) return;
    // Fully visible objects take part in the opaque pass, so they sort and occlude exactly.
    assign(fillMat, { opacity: f, transparent: f < 0.999 });
    assign(lineMat, { opacity: f * lineAlpha });
    assign(softMat, { opacity: f * softAlpha });
    if (tint) tint(journey, fillMat.color);
  });

  return (
    <group ref={group} {...rest}>
      {fill && <mesh geometry={fill} material={fillMat} frustumCulled={false} renderOrder={order} />}
      {lines && <lineSegments geometry={lines} material={lineMat} frustumCulled={false} renderOrder={order + 1} />}
      {soft && <lineSegments geometry={soft} material={softMat} frustumCulled={false} renderOrder={order + 1} />}
      {children}
    </group>
  );
}
