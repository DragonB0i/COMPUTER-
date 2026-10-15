"use client";

import { useEffect, useMemo, useState } from "react";
import { seededRandom } from "@/lib/animation";
import { createJourney } from "@/lib/journey";
import { computeRig, createRigPose } from "@/lib/rig";

interface Network {
  w: number;
  h: number;
  paths: string[];
  nodes: Array<[number, number]>;
}

const COUNT = 18;

/** Circuit-trace style routes that leave the chip at its edge and run out past the viewport edges. */
const buildNetwork = (w: number, h: number): Network => {
  const rnd = seededRandom(31);
  const pose = computeRig(createJourney(), w / h, 0, createRigPose());
  const cx = w / 2;
  const cy = h / 2 - (pose.posY / pose.visH) * h;
  const r0 = ((1.3 * pose.scale) / pose.visH) * h * 1.18;
  const reach = Math.hypot(w, h);
  const paths: string[] = [];
  const nodes: Array<[number, number]> = [];

  for (let i = 0; i < COUNT; i++) {
    const base = (i / COUNT) * Math.PI * 2 + (rnd() - 0.5) * 0.18;
    // Snap the launch direction to multiples of 45 degrees for a schematic look.
    const snapped = Math.round(base / (Math.PI / 4)) * (Math.PI / 4);
    const dx = Math.cos(base);
    const dy = Math.sin(base);
    const sx = cx + dx * r0 * (0.92 + rnd() * 0.12);
    const sy = cy + dy * r0 * (0.92 + rnd() * 0.12);
    const l1 = (0.05 + rnd() * 0.16) * Math.min(w, h);
    const bx = sx + Math.cos(snapped) * l1;
    const by = sy + Math.sin(snapped) * l1;
    // After the bend, run along the dominant axis of the launch direction out of the screen.
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const sign = horizontal ? Math.sign(dx) || 1 : Math.sign(dy) || 1;
    const jog = (rnd() - 0.5) * 0.14 * Math.min(w, h);
    let mx: number;
    let my: number;
    let ex: number;
    let ey: number;
    if (horizontal) {
      mx = bx + sign * (0.08 + rnd() * 0.18) * w;
      my = by;
      ex = sign > 0 ? w + 40 : -40;
      ey = my + jog;
      paths.push(`M${sx} ${sy} L${bx} ${by} L${mx} ${my} L${mx + sign * Math.abs(jog)} ${ey} L${ex} ${ey}`);
    } else {
      mx = bx;
      my = by + sign * (0.08 + rnd() * 0.18) * h;
      ex = mx + jog;
      ey = sign > 0 ? h + 40 : -40;
      paths.push(`M${sx} ${sy} L${bx} ${by} L${mx} ${my} L${ex} ${my + sign * Math.abs(jog)} L${ex} ${ey}`);
    }
    nodes.push([bx, by], [mx, my]);
    void reach;
  }
  return { w, h, paths, nodes };
};

/**
 * Schematic network that grows out of the chip as the visitor scrolls. The master timeline scrubs
 * each path's stroke-dashoffset, so the drawing is tied to scroll progress.
 */
export function ConnectionLines() {
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const net = useMemo(() => buildNetwork(size.w, size.h), [size.w, size.h]);

  return (
    <svg
      className="stage__lines"
      data-connection-lines
      viewBox={`0 0 ${net.w} ${net.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {net.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          data-line
          pathLength={1}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
      ))}
      {net.nodes.map(([x, y], i) => (
        <circle key={i} data-node cx={x} cy={y} r={2.6} fill="#fff" opacity={0} />
      ))}
    </svg>
  );
}
