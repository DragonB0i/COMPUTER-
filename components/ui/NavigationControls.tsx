"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CHAPTERS, WAYPOINTS } from "@/lib/sceneConstants";
import { scrollToUnits } from "@/lib/scrollApi";
import { useUi } from "@/lib/uiStore";
import { journey } from "@/lib/journey";

interface Props {
  onSimpleView: () => void;
}

/** Chapter links, previous / next waypoint buttons and the switch to the simple view. */
export function NavigationControls({ onSimpleView }: Props) {
  const chapter = useUi((s) => s.chapter);
  const reduced = useReducedMotion();

  const step = (dir: 1 | -1) => {
    const now = journey.units;
    const target =
      dir === 1
        ? WAYPOINTS.find((w) => w.at > now + 0.12)
        : [...WAYPOINTS].reverse().find((w) => w.at < now - 0.12);
    if (target) scrollToUnits(target.at, reduced);
    else if (dir === 1) document.getElementById("software-end")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <>
      <nav className="hud-nav" aria-label="Chapters">
        <ul>
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-current={c.id === chapter ? "step" : undefined}
                onClick={() => scrollToUnits(c.start + (c.id === "awakening" ? 0 : 0.05), reduced)}
              >
                {c.title}
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="hud-nav__simple" onClick={onSimpleView}>
              Simple view
            </button>
          </li>
        </ul>
      </nav>
      <div className="hud-step" role="group" aria-label="Move through the journey">
        <button type="button" className="icon-btn icon-btn--round" aria-label="Previous step" onClick={() => step(-1)}>
          <ChevronUp size={18} aria-hidden="true" />
        </button>
        <button type="button" className="icon-btn icon-btn--round" aria-label="Next step" onClick={() => step(1)}>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
