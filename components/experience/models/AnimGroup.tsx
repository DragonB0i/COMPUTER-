"use client";

import { useRef, type ReactNode } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import type { Group } from "three";
import { journey, type JourneyState } from "@/lib/journey";

interface AnimGroupProps extends Omit<ThreeElements["group"], "ref"> {
  onFrame?: (g: Group, j: JourneyState, time: number, delta: number) => void;
  children?: ReactNode;
}

/** A group whose transform is driven imperatively every frame. */
export function AnimGroup({ onFrame, children, ...rest }: AnimGroupProps) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (ref.current && onFrame) onFrame(ref.current, journey, state.clock.elapsedTime, delta);
  });
  return (
    <group ref={ref} {...rest}>
      {children}
    </group>
  );
}
