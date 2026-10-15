"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { journey, type JourneyState } from "@/lib/journey";

export type LineFrame = (
  obj: THREE.LineSegments,
  mat: THREE.LineBasicMaterial,
  j: JourneyState,
  time: number,
) => void;

interface LineSetProps extends Omit<ThreeElements["group"], "ref"> {
  positions: Float32Array;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  additive?: boolean;
  /** Hide the lines behind solid faces. Off by default: the dark chapters draw pure line work on top. */
  depth?: boolean;
  /** Called every frame; mutate opacity / drawRange / colour here instead of using React state. */
  onFrame?: LineFrame;
}

/** Sets opacity and hides the object entirely when it is effectively invisible. */
export const setFade = (obj: THREE.Object3D, mat: THREE.Material, value: number): void => {
  mat.opacity = value;
  obj.visible = value > 0.004;
};

/** Limits how much of the geometry is drawn (progressive construction). `fraction` is 0..1. */
export const setDraw = (obj: THREE.LineSegments, fraction: number): void => {
  const total = obj.geometry.getAttribute("position").count;
  const count = Math.floor((total * Math.min(Math.max(fraction, 0), 1)) / 2) * 2;
  obj.geometry.setDrawRange(0, count);
};

/**
 * A set of line segments rendered as one draw call. Geometry and material are created once and
 * disposed on unmount.
 */
export function LineSet({
  positions,
  color = "#ffffff",
  opacity = 1,
  additive = false,
  depth = false,
  onFrame,
  ...rest
}: LineSetProps) {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.computeBoundingSphere();
    return g;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: depth,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      }),
    // Initial values only; later changes are driven through `onFrame`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const obj = ref.current;
    if (obj && onFrame) onFrame(obj, material, journey, state.clock.elapsedTime);
  });

  return (
    <group {...rest}>
      <lineSegments ref={ref} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
