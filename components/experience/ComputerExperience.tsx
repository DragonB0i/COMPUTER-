"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { canRenderWebGL } from "@/lib/webgl";
import { SimpleView } from "./SimpleView";

const ImmersiveView = dynamic(() => import("./ImmersiveView"), { ssr: false });

/** WebGL support is probed once; creating contexts is not free. `null` until the browser is known. */
let webglSupport: boolean | null = null;
const readWebgl = (): boolean | null => {
  if (webglSupport === null) webglSupport = canRenderWebGL();
  return webglSupport;
};
const subscribeNever = (): (() => void) => () => {};

type Choice = "immersive" | "simple" | null;

/**
 * Chooses between the cinematic WebGL journey and the plain, accessible view. The immersive view
 * is the default; the simple view is used for reduced motion, missing WebGL, a render failure, or
 * whenever the visitor asks for it.
 */
export default function ComputerExperience() {
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore(subscribeNever, readWebgl, () => null);
  const [choice, setChoice] = useState<Choice>(null);
  const [failed, setFailed] = useState(false);

  const switchTo = useCallback((next: Exclude<Choice, null>) => {
    window.scrollTo(0, 0);
    setChoice(next);
  }, []);
  const onFailure = useCallback(() => setFailed(true), []);

  // Server render and first client render: a black screen, never a flash of the wrong view.
  if (webgl === null) {
    return (
      <main className="boot">
        <h1>COMPUTER</h1>
      </main>
    );
  }

  const canImmersive = webgl && !failed;
  const immersive = canImmersive && (choice === "immersive" || (choice === null && !reduced));

  if (immersive) {
    return <ImmersiveView onFailure={onFailure} onSimpleView={() => switchTo("simple")} />;
  }

  let notice: string | undefined;
  if (!webgl) notice = "3D graphics are not available in this browser, so you are seeing the simple view of the same story.";
  else if (failed) notice = "The 3D scene could not start on this device, so you are seeing the simple view of the same story.";
  else if (reduced && choice === null)
    notice =
      "Your device asks for reduced motion, so the animated 3D journey is off. Everything is here as a plain page; the immersive view is one button away.";

  return <SimpleView notice={notice} onImmersive={canImmersive ? () => switchTo("immersive") : undefined} />;
}
