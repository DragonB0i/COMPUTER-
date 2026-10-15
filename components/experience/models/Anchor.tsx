"use client";

import { useEffect, useRef } from "react";
import type { Object3D } from "three";
import { registerWorldAnchor } from "@/lib/anchors";

interface AnchorProps {
  id: string;
  position: readonly [number, number, number];
}

/** Invisible marker that HTML labels and leader lines can follow on screen. */
export function Anchor({ id, position }: AnchorProps) {
  const ref = useRef<Object3D>(null);
  useEffect(() => {
    const obj = ref.current;
    if (!obj) return;
    return registerWorldAnchor(id, { object: obj, local: [0, 0, 0] });
  }, [id]);
  return <object3D ref={ref} position={[position[0], position[1], position[2]]} />;
}
