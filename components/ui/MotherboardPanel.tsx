"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { registerLeader, type LeaderBinding } from "@/lib/anchors";
import { BOARD_COMPONENTS } from "@/data/hardwareComponents";
import { getUi, setUi, useUi } from "@/lib/uiStore";
import type { BoardComponentId } from "@/types/hardware";

/** Short names for the selector chips. */
const CHIP_LABELS: Record<BoardComponentId, string> = {
  cpu: "CPU",
  ram: "RAM",
  pcie: "PCIe",
  m2: "M.2",
  sata: "SATA",
  chipset: "Chipset",
  power: "Power",
  io: "Rear I/O",
  wifi: "Wi-Fi",
};

/** Information panel for the motherboard chapter: hover, tap, scroll or keyboard can choose a part. */
export function MotherboardPanel() {
  const box = useRef<HTMLElement>(null);
  const group = useRef<SVGGElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const binding = useRef<LeaderBinding | null>(null);

  const pinned = useUi((s) => s.boardPinned);
  const hover = useUi((s) => s.boardHover);
  const scroll = useUi((s) => s.boardScroll);
  const activeId = pinned ?? hover ?? scroll;
  const active = BOARD_COMPONENTS.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (!box.current || !group.current || !line.current || !dot.current) return;
    const b: LeaderBinding = {
      worldId: null,
      box: box.current,
      line: line.current,
      dot: dot.current,
      group: group.current,
    };
    binding.current = b;
    const off = registerLeader("board", b);
    return () => {
      off();
      binding.current = null;
    };
  }, []);

  useEffect(() => {
    if (binding.current) binding.current.worldId = activeId ? `board:${activeId}` : null;
  }, [activeId]);

  // Escape dismisses a pinned explanation.
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUi({ boardPinned: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  return (
    <>
      <svg className="stage__leaders stage__leaders--board" aria-hidden="true" focusable="false">
        <g ref={group} data-board-leader>
          <line ref={line} />
          <circle ref={dot} r={3.5} />
        </g>
      </svg>
      <section ref={box} className="board-panel" data-board-panel aria-labelledby="board-panel-title">
        <div className="board-panel__chips" role="group" aria-label="Motherboard components">
          {BOARD_COMPONENTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={activeId === c.id}
              onClick={() => setUi({ boardPinned: getUi().boardPinned === c.id ? null : c.id })}
            >
              {CHIP_LABELS[c.id]}
            </button>
          ))}
        </div>
        <div className="board-panel__body" aria-live="polite">
          {active ? (
            <>
              <div className="board-panel__head">
                <h3 id="board-panel-title">{active.name}</h3>
                {pinned && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Close explanation"
                    onClick={() => setUi({ boardPinned: null })}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="board-panel__summary">{active.summary}</p>
              <dl>
                <dt>What it does</dt>
                <dd>{active.role}</dd>
                <dt>How it connects</dt>
                <dd>{active.relation}</dd>
              </dl>
              {active.note && <p className="board-panel__note">{active.note}</p>}
            </>
          ) : (
            <>
              <h3 id="board-panel-title">The motherboard</h3>
              <p className="board-panel__summary">
                Hover or tap a part of the board to see what it does, or keep scrolling to be guided through each one.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
