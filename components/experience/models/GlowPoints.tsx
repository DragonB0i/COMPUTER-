"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey, type JourneyState } from "@/lib/journey";

let glowTexture: THREE.CanvasTexture | null = null;

/** Soft round sprite used for illuminated nodes. Created lazily and shared. */
export const getGlowTexture = (): THREE.CanvasTexture => {
  if (glowTexture) return glowTexture;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.75)");
    g.addColorStop(0.45, "rgba(255,255,255,0.16)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
};

interface GlowPointsProps {
  positions: Float32Array;
  size?: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  onFrame?: (pts: THREE.Points, mat: THREE.PointsMaterial, j: JourneyState, time: number) => void;
}

/** Illuminated nodes drawn as additive point sprites. */
export function GlowPoints({ positions, size = 0.2, color = "#ffffff", opacity = 1, onFrame }: GlowPointsProps) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: getGlowTexture(),
        size,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        toneMapped: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const p = ref.current;
    if (p && onFrame) onFrame(p, material, journey, state.clock.elapsedTime);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
