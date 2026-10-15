"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { assign } from "@/lib/assign";
import { journey, type JourneyState } from "@/lib/journey";

let shadowTexture: THREE.CanvasTexture | null = null;

const getShadowTexture = (): THREE.CanvasTexture => {
  if (shadowTexture) return shadowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(27,26,24,1)");
    g.addColorStop(0.5, "rgba(27,26,24,0.55)");
    g.addColorStop(1, "rgba(27,26,24,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  shadowTexture = new THREE.CanvasTexture(canvas);
  shadowTexture.colorSpace = THREE.SRGBColorSpace;
  return shadowTexture;
};

interface ShadowProps extends Omit<ThreeElements["group"], "ref"> {
  /** Width (x) and depth (z) of the soft shadow. */
  size: readonly [number, number];
  /** Strength from 0 to 1, evaluated every frame. */
  fade: (j: JourneyState) => number;
  /** Peak opacity of the centre. */
  alpha?: number;
}

/** A soft contact shadow lying flat in the xz plane: it gives floating objects a sense of height. */
export function Shadow({ size, fade, alpha = 0.22, ...rest }: ShadowProps) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const f = Math.min(Math.max(fade(journey), 0), 1);
    m.visible = f > 0.004;
    assign(material, { opacity: f * alpha });
  });

  return (
    <group {...rest}>
      <mesh ref={ref} geometry={geometry} material={material} scale={[size[0], 1, size[1]]} renderOrder={-2} />
    </group>
  );
}
