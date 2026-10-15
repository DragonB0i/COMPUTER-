"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/lib/gsapSetup";
import { resetJourney } from "@/lib/journey";
import { buildMasterTimeline } from "@/lib/masterTimeline";
import { setMasterTrigger } from "@/lib/scrollApi";
import { resetUi } from "@/lib/uiStore";

interface Props {
  rootRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
}

/**
 * Owns the lifetime of the master timeline. The effect creates everything inside a gsap.context, so
 * React Strict Mode's mount / unmount / mount cycle and later remounts always start from a clean slate
 * and can never leave duplicate triggers behind.
 */
export function ScrollController({ rootRef, stageRef }: Props) {
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    setupGsap();

    const ctx = gsap.context(() => buildMasterTimeline(root, stage), root);

    // Web fonts change text metrics, so measure again once they have loaded.
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx.revert();
      setMasterTrigger(null);
      resetJourney();
      resetUi();
    };
  }, [rootRef, stageRef]);

  return null;
}
