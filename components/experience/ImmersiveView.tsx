"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { BinaryBackground } from "@/components/ui/BinaryBackground";
import { ComponentCallouts } from "@/components/ui/ComponentCallouts";
import { ConnectionLines } from "@/components/ui/ConnectionLines";
import { HeroOverlay } from "@/components/ui/HeroOverlay";
import { MotherboardPanel } from "@/components/ui/MotherboardPanel";
import { NavigationControls } from "@/components/ui/NavigationControls";
import { ProgressIndicator } from "@/components/ui/ProgressIndicator";
import { BinarySwarm } from "@/components/ui/BinarySwarm";
import { SoftwareEpilogue } from "@/components/ui/SoftwareEpilogue";
import { SoftwareLabels } from "@/components/ui/SoftwareLabels";
import { SoftwarePanels } from "@/components/ui/SoftwarePanels";
import { TimelineContent } from "@/components/ui/TimelineContent";
import { ScrollController } from "./ScrollController";

// Three.js is large and needs the browser, so the canvas is loaded on the client only.
const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), { ssr: false });

interface Props {
  onFailure: () => void;
  onSimpleView: () => void;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
};

/** The scroll-driven journey: one pinned stage whose layers are all driven by the master timeline. */
export default function ImmersiveView({ onFailure, onSimpleView }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Download the later 3D chapters while the visitor is still reading the opening.
  useEffect(() => {
    const warm = () => {
      void import("./scenes/ComputerCaseScene");
      void import("./scenes/MotherboardScene");
      void import("./scenes/SoftwareScene");
    };
    const w = window as IdleWindow;
    if (w.requestIdleCallback) w.requestIdleCallback(warm, { timeout: 4000 });
    else window.setTimeout(warm, 2500);
  }, []);

  return (
    <>
      <a className="skip-link" href="#software-end">
        Skip to the end of the software chapter
      </a>
      <main id="main">
        <section ref={rootRef} className="journey" aria-label="The journey into the computer">
          <div ref={stageRef} className="stage">
            <BinaryBackground />
            <div className="stage__canvas">
              <ExperienceCanvas onFailure={onFailure} />
            </div>
            <BinarySwarm />
            <div className="stage__vignette" data-vignette aria-hidden="true" />
            <ConnectionLines />
            <HeroOverlay />
            <TimelineContent />
            <ComponentCallouts />
            <MotherboardPanel />
            <SoftwareLabels />
            <SoftwarePanels />
            <ProgressIndicator />
            <NavigationControls onSimpleView={onSimpleView} />
          </div>
        </section>
        <SoftwareEpilogue id="software-end" />
      </main>
      <ScrollController rootRef={rootRef} stageRef={stageRef} />
    </>
  );
}
