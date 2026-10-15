"use client";

import { Component, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useUi } from "@/lib/uiStore";
import { JourneyScene } from "./JourneyScene";

interface BoundaryProps {
  onError: (error: unknown) => void;
  children: ReactNode;
}

/** Catches WebGL initialisation and render failures so the page can switch to the simple view. */
class CanvasBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface Props {
  onFailure: () => void;
}

export default function ExperienceCanvas({ onFailure }: Props) {
  const active = useUi((s) => s.stageActive);
  // Cheaper pixel-ratio ceiling on phones; PerformanceMonitor lowers it further if frames drop.
  const [cap] = useState(() => (typeof window !== "undefined" && window.innerWidth < 800 ? 1.5 : 1.75));
  const [dpr, setDpr] = useState<[number, number]>(() => [1, cap]);

  return (
    <CanvasBoundary onError={onFailure}>
      <Canvas
        dpr={dpr}
        flat
        frameloop={active ? "always" : "never"}
        camera={{ fov: 35, near: 0.1, far: 200, position: [0, 0, 8.4] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
        aria-hidden="true"
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onFailure();
          });
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr([1, 1.25])}
          onIncline={() => setDpr([1, cap])}
          flipflops={3}
          onFallback={() => setDpr([1, 1])}
        />
        <JourneyScene />
      </Canvas>
    </CanvasBoundary>
  );
}
