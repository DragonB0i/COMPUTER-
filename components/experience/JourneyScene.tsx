"use client";

import { lazy, Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { updateAnchors } from "@/lib/anchors";
import { journey } from "@/lib/journey";
import { computeRig, rigPose } from "@/lib/rig";
import { useUi } from "@/lib/uiStore";
import { HeroScene } from "./scenes/HeroScene";
import { HistoricalTimelineScene } from "./scenes/HistoricalTimelineScene";

// Later chapters are loaded on demand, one chapter ahead of the viewer.
const ComputerCaseScene = lazy(() => import("./scenes/ComputerCaseScene"));
const MotherboardScene = lazy(() => import("./scenes/MotherboardScene"));
const SoftwareScene = lazy(() => import("./scenes/SoftwareScene"));

/** Frame order: rig (-10) -> scene updates (0) -> screen projection (1) -> render (2). */
function RigDriver({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  useFrame((state) => {
    const aspect = state.size.width / Math.max(state.size.height, 1);
    computeRig(journey, aspect, state.clock.elapsedTime, rigPose);
    const cam = state.camera;
    cam.position.set(0, rigPose.camY, rigPose.camDist);
    cam.lookAt(0, 0, 0);
    const g = groupRef.current;
    if (g) {
      g.position.set(rigPose.posX, rigPose.posY, 0);
      g.scale.setScalar(rigPose.scale);
      g.rotation.set(rigPose.rotX, rigPose.rotY, rigPose.rotZ);
    }
  }, -10);
  return null;
}

/** Keeps HTML labels and leader lines locked to 3D anchors after every transform has updated. */
function AnchorProjector() {
  useFrame((state) => {
    state.scene.updateMatrixWorld();
    updateAnchors(state.camera, state.gl.domElement);
  }, 1);
  return null;
}

/** Positive priorities switch R3F to manual rendering, which keeps the order above deterministic. */
function Renderer() {
  useFrame((state) => {
    state.gl.render(state.scene, state.camera);
  }, 2);
  return null;
}

export function JourneyScene() {
  const group = useRef<Group>(null);
  const phase = useUi((s) => s.phase);

  return (
    <>
      <RigDriver groupRef={group} />
      <group ref={group}>
        <HeroScene />
        <HistoricalTimelineScene />
        <Suspense fallback={null}>
          {phase >= 1 && (
            <>
              <ComputerCaseScene />
              <MotherboardScene />
            </>
          )}
          {phase >= 2 && <SoftwareScene />}
        </Suspense>
      </group>
      <AnchorProjector />
      <Renderer />
    </>
  );
}
