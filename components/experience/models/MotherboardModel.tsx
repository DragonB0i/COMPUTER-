"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBoard } from "@/lib/geometry/cache";
import { BOARD_COMPONENT_ORDER } from "@/lib/geometry/board";
import { boardWeights } from "@/lib/boardWeights";
import { applyBoardTransform } from "@/lib/boardTransform";
import { caseFocus, caseInterior, caseReveal } from "@/lib/caseFocus";
import { journey, type JourneyState } from "@/lib/journey";
import { getUi, setUi } from "@/lib/uiStore";
import { smoothstep, tri } from "@/lib/animation";
import type { BoardComponentId } from "@/types/hardware";
import { AnimGroup } from "./AnimGroup";
import { Anchor } from "./Anchor";
import { GlowPoints } from "./GlowPoints";
import { LineSet, setFade } from "./LineSet";

const CYAN = new THREE.Color("#8fe9ff");
const WHITE = new THREE.Color("#ffffff");
const MOTHERBOARD_CASE_IDX = 6;

/** Updates the smoothed emphasis of every component: scroll position, hover or pinned selection. */
function WeightsDriver() {
  useFrame((_s, dt) => {
    const j = journey;
    const ui = getUi();
    const override = ui.boardPinned ?? ui.boardHover;
    const k = 1 - Math.exp(-14 * dt);
    BOARD_COMPONENT_ORDER.forEach((id, i) => {
      let target = 0;
      if (j.boardUi > 0.5) {
        target = override ? (id === override ? 1 : 0) : tri(j.boardStep, i, 0.55);
      }
      boardWeights[id] += (target - boardWeights[id]) * k;
    });
  });
  return null;
}

/** Visibility of the board itself: appears with the case, stays while the case fades, and leaves with the interior. */
const boardFade = (j: JourneyState): number => {
  const inCase = caseFocus(j, MOTHERBOARD_CASE_IDX);
  const focus = inCase + (1 - inCase) * smoothstep(0, 0.7, j.boardFocus);
  return caseReveal(j) * focus * caseInterior(j);
};

const setCursor = (value: string) => {
  if (typeof document !== "undefined") document.body.style.cursor = value;
};

/**
 * Conceptual ATX motherboard. Every component has an outline, copper traces that glow when it is
 * active, invisible hit boxes for pointer / touch selection, and an anchor for the leader line.
 */
export function MotherboardModel() {
  const board = useMemo(() => getBoard(), []);
  const activeMarker = useRef<THREE.Points>(null);

  const markerPositions = useMemo(() => {
    const out = new Float32Array(BOARD_COMPONENT_ORDER.length * 3);
    BOARD_COMPONENT_ORDER.forEach((id, i) => {
      const a = board.parts[id].anchor;
      out[i * 3] = a[0];
      out[i * 3 + 1] = a[1];
      out[i * 3 + 2] = a[2] + 0.02;
    });
    return out;
  }, [board]);

  const activePos = useMemo(() => new Float32Array(3), []);

  useEffect(() => () => setCursor("auto"), []);

  const select = (id: BoardComponentId) => {
    if (journey.boardUi < 0.5) return;
    const ui = getUi();
    setUi({ boardPinned: ui.boardPinned === id ? null : id, boardHover: id });
  };

  return (
    <>
      <WeightsDriver />
      <AnimGroup onFrame={(g, j) => applyBoardTransform(g, j)}>
        <LineSet positions={board.pcb} color="#e6e6e6" onFrame={(o, m, j) => setFade(o, m, 0.8 * boardFade(j))} />
        <LineSet positions={board.decor} color="#bdbdbd" onFrame={(o, m, j) => setFade(o, m, 0.5 * boardFade(j))} />

        {BOARD_COMPONENT_ORDER.map((id) => {
          const part = board.parts[id];
          return (
            <group key={id}>
              <LineSet
                positions={part.lines}
                onFrame={(o, m, j) => {
                  const w = boardWeights[id];
                  m.color.copy(WHITE).lerp(CYAN, w);
                  setFade(o, m, boardFade(j) * (0.45 + 0.55 * w));
                }}
              />
              <LineSet
                positions={part.traces}
                additive
                color="#8fe9ff"
                onFrame={(o, m, j) => setFade(o, m, boardFade(j) * boardWeights[id] * 0.95)}
              />
              <Anchor id={`board:${id}`} position={part.anchor} />
              {part.hot.map((h, i) => {
                const size: [number, number, number] = [h.max[0] - h.min[0], h.max[1] - h.min[1], h.max[2] - h.min[2]];
                const pos: [number, number, number] = [
                  (h.max[0] + h.min[0]) / 2,
                  (h.max[1] + h.min[1]) / 2,
                  (h.max[2] + h.min[2]) / 2,
                ];
                return (
                  <mesh
                    key={i}
                    position={pos}
                    onPointerOver={(e) => {
                      if (journey.boardUi < 0.5) return;
                      e.stopPropagation();
                      setUi({ boardHover: id });
                      setCursor("pointer");
                    }}
                    onPointerOut={() => {
                      if (getUi().boardHover === id) setUi({ boardHover: null });
                      setCursor("auto");
                    }}
                    onClick={(e) => {
                      if (journey.boardUi < 0.5) return;
                      e.stopPropagation();
                      select(id);
                    }}
                  >
                    <boxGeometry args={size} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
                  </mesh>
                );
              })}
            </group>
          );
        })}

        {/* Graphics card hovering over the PCIe slot while that slot is explained. */}
        <LineSet
          positions={board.ghostGpu}
          color="#8fe9ff"
          onFrame={(o, m, j) => setFade(o, m, boardFade(j) * boardWeights.pcie * 0.5)}
        />

        {/* Hotspot markers: one per component, plus a larger ring on the active one. */}
        <GlowPoints
          positions={markerPositions}
          size={0.09}
          color="#ffffff"
          onFrame={(p, m, j, t) => {
            m.opacity = j.boardUi * boardFade(j) * (0.55 + 0.25 * Math.sin(t * 2.4));
            p.visible = m.opacity > 0.01;
          }}
        />
        <points ref={activeMarker} frustumCulled={false}>
          <ActiveMarker positions={activePos} markerRef={activeMarker} />
        </points>
      </AnimGroup>
    </>
  );
}

/** The component with the strongest emphasis above `floor`, if any. */
const strongestPart = (floor: number): { id: BoardComponentId; weight: number } | null => {
  let found: { id: BoardComponentId; weight: number } | null = null;
  for (const id of BOARD_COMPONENT_ORDER) {
    const w = boardWeights[id];
    if (w > (found?.weight ?? floor)) found = { id, weight: w };
  }
  return found;
};

/** Large cyan glow that follows whichever component is emphasised. */
function ActiveMarker({
  positions,
  markerRef,
}: {
  positions: Float32Array;
  markerRef: React.RefObject<THREE.Points | null>;
}) {
  const board = useMemo(() => getBoard(), []);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame((state) => {
    const pts = markerRef.current;
    const geo = geometryRef.current;
    if (!pts || !geo) return;
    const best = strongestPart(0.25);
    const mat = pts.material as THREE.PointsMaterial;
    if (!best || journey.boardUi < 0.5) {
      pts.visible = false;
      return;
    }
    const a = board.parts[best.id].anchor;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    attr.setXYZ(0, a[0], a[1], a[2] + 0.03);
    attr.needsUpdate = true;
    mat.opacity = best.weight * boardFade(journey) * (0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 3));
    pts.visible = mat.opacity > 0.01;
  });

  return (
    <>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <ActiveMaterial />
    </>
  );
}

function ActiveMaterial() {
  const tex = useMemo(() => {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <pointsMaterial
      map={tex}
      color="#8fe9ff"
      size={0.2}
      transparent
      depthWrite={false}
      depthTest={false}
      blending={THREE.AdditiveBlending}
      sizeAttenuation
      toneMapped={false}
    />
  );
}
