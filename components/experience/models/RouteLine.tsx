"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { assign } from "@/lib/assign";
import { journey, type JourneyState } from "@/lib/journey";
import { pointAlong, writePartial, type P3 } from "@/lib/polyline";
import { INK } from "./Solid";

let dotTexture: THREE.CanvasTexture | null = null;

/** Soft round dot used for the pulses and the end points of the routes. */
const getDotTexture = (): THREE.CanvasTexture => {
  if (dotTexture) return dotTexture;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,1)");
    g.addColorStop(0.72, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  dotTexture = new THREE.CanvasTexture(canvas);
  dotTexture.colorSpace = THREE.SRGBColorSpace;
  return dotTexture;
};

interface RouteProps {
  /** Number of points of the route. Fixed for the life of the component. */
  count: number;
  /** Fills in the route's points (group-local space) every frame. */
  update: (j: JourneyState, pts: P3[]) => void;
  /** Fraction of the route that is drawn, 0..1. */
  draw: (j: JourneyState) => number;
  /** Overall opacity, 0..1. */
  fade?: (j: JourneyState) => number;
  /** Positions of the travelling pulses as fractions of the *whole* route; return an empty array for none. */
  pulses?: (j: JourneyState, time: number) => readonly number[];
  colour?: string;
  /** Size of the pulses and end dot in world units. */
  dot?: number;
  order?: number;
}

const MAX_PULSES = 4;

/** Writes the end dot and the pulse markers into `out`; returns how many points are in use. */
const writeDots = (pts: P3[], d: number, out: Float32Array, scratch: P3, pulses: readonly number[] | null): number => {
  const p = pointAlong(pts, d, scratch);
  out[0] = p[0];
  out[1] = p[1];
  out[2] = p[2];
  let k = 1;
  if (pulses) {
    for (const at of pulses) {
      if (at < 0 || at > d || k > MAX_PULSES) continue;
      const q = pointAlong(pts, at, scratch);
      out[k * 3] = q[0];
      out[k * 3 + 1] = q[1];
      out[k * 3 + 2] = q[2];
      k++;
    }
  }
  return k;
};

/**
 * A thin routed line that is drawn progressively, with an end dot and small pulses that travel along
 * it. It is a conceptual connection, not a cable.
 */
export function RouteLine({ count, update, draw, fade, pulses, colour = INK, dot = 0.13, order = 40 }: RouteProps) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const dotsRef = useRef<THREE.Points>(null);

  const state = useMemo(() => {
    const pts: P3[] = Array.from({ length: count }, () => [0, 0, 0] as P3);
    const lineBuffer = new Float32Array(Math.max(count - 1, 1) * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    const lineAttr = new THREE.BufferAttribute(lineBuffer, 3);
    lineAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute("position", lineAttr);
    const dotBuffer = new Float32Array((MAX_PULSES + 1) * 3);
    const dotGeo = new THREE.BufferGeometry();
    const dotAttr = new THREE.BufferAttribute(dotBuffer, 3);
    dotAttr.setUsage(THREE.DynamicDrawUsage);
    dotGeo.setAttribute("position", dotAttr);
    const lineMat = new THREE.LineBasicMaterial({ color: colour, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const dotMat = new THREE.PointsMaterial({
      map: getDotTexture(),
      size: dot,
      color: colour,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    });
    return { pts, lineBuffer, lineGeo, lineAttr, dotBuffer, dotGeo, dotAttr, lineMat, dotMat, scratch: [0, 0, 0] as P3 };
  }, [count, colour, dot]);

  useEffect(
    () => () => {
      state.lineGeo.dispose();
      state.dotGeo.dispose();
      state.lineMat.dispose();
      state.dotMat.dispose();
    },
    [state],
  );

  useFrame((s) => {
    const line = lineRef.current;
    const dots = dotsRef.current;
    if (!line || !dots) return;
    const f = fade ? fade(journey) : 1;
    const d = Math.min(Math.max(draw(journey), 0), 1);
    const visible = f > 0.004 && d > 0.002;
    line.visible = visible;
    dots.visible = visible;
    if (!visible) return;
    update(journey, state.pts);
    const n = writePartial(state.pts, d, state.lineBuffer);
    state.lineGeo.setDrawRange(0, n);
    assign(state.lineAttr, { needsUpdate: true });
    assign(state.lineMat, { opacity: 0.82 * f });

    // End dot, then the pulses (only on the part that has been drawn).
    const k = writeDots(state.pts, d, state.dotBuffer, state.scratch, pulses ? pulses(journey, s.clock.elapsedTime) : null);
    state.dotGeo.setDrawRange(0, k);
    assign(state.dotAttr, { needsUpdate: true });
    assign(state.dotMat, { opacity: f });
  });

  return (
    <>
      <lineSegments ref={lineRef} geometry={state.lineGeo} material={state.lineMat} frustumCulled={false} renderOrder={order} />
      <points ref={dotsRef} geometry={state.dotGeo} material={state.dotMat} frustumCulled={false} renderOrder={order + 1} />
    </>
  );
}
