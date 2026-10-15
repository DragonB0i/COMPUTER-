"use client";

import { useMemo } from "react";
import {
  chassisStaticLines,
  coolerExtras,
  fanLines,
  frontPanelLines,
  gpuExtras,
  hddExtras,
  PANELS,
  PART_LAYOUT,
  psuExtras,
  sidePanelLines,
  ssdExtras,
  topPanelLines,
} from "@/lib/geometry/pc";
import { LineBuilder } from "@/lib/lineBuilder";
import { casePartFade, caseInterior, explodeAmount } from "@/lib/caseFocus";
import type { JourneyState } from "@/lib/journey";
import { AnimGroup } from "./AnimGroup";
import { Anchor } from "./Anchor";
import { LineSet, setFade } from "./LineSet";

type Vec = readonly [number, number, number];

const boxOf = (dims: Vec): Float32Array => new LineBuilder().boxC(0, 0, 0, dims[0], dims[1], dims[2]).build();

/** Case-part indices in `CASE_PARTS` (data/hardwareComponents.ts). */
const IDX = { chassis: 0, fan: 1, cooler: 2, psu: 3, storage: 4, gpu: 5 } as const;

interface PartProps {
  center: Vec;
  explode: Vec;
  /** Case-part index that controls the brightness of this part. */
  idx: number;
  children: React.ReactNode;
}

/** Moves a part from its assembled position along its explode vector. */
function Part({ center, explode, idx, children }: PartProps) {
  void idx;
  return (
    <AnimGroup
      position={[center[0], center[1], center[2]]}
      onFrame={(g, j) => {
        const e = explodeAmount(j);
        g.position.set(center[0] + explode[0] * e, center[1] + explode[1] * e, center[2] + explode[2] * e);
      }}
    >
      {children}
    </AnimGroup>
  );
}

/** Fades a part with the exploded-view focus, and away again when the front face is shown. */
const frame =
  (idx: number, base: number) =>
  (obj: Parameters<typeof setFade>[0], mat: Parameters<typeof setFade>[1], j: JourneyState) =>
    setFade(obj, mat, base * casePartFade(j, idx) * caseInterior(j));

/** The desktop tower: chassis details, removable panels and the major internal components. */
export function ComputerCaseModel() {
  const geo = useMemo(() => {
    const cooler = coolerExtras();
    return {
      chassis: chassisStaticLines(),
      side: sidePanelLines(),
      front: frontPanelLines(),
      top: topPanelLines(),
      psuBox: boxOf(PART_LAYOUT.psu.dims),
      psu: psuExtras(),
      gpuBox: boxOf(PART_LAYOUT.gpu.dims),
      gpu: gpuExtras(),
      hddBox: boxOf(PART_LAYOUT.hdd.dims),
      hdd: hddExtras(),
      ssdBox: boxOf(PART_LAYOUT.ssd.dims),
      ssd: ssdExtras(),
      coolerBox: boxOf(PART_LAYOUT.cooler.dims),
      coolerFins: cooler.fins,
      coolerFrame: cooler.fanFrame,
      coolerRotor: cooler.fanRotor,
      fanBox: boxOf(PART_LAYOUT.fan.dims),
      fanFrame: fanLines("xy", 0.74, 0, 7, "frame"),
      fanRotor: fanLines("xy", 0.74, 0, 7, "rotor"),
    };
  }, []);

  const L = PART_LAYOUT;
  const coolerFanX = -L.cooler.dims[0] / 2 - 0.035;

  return (
    <>
      <LineSet positions={geo.chassis} color="#d8d8d8" onFrame={frame(IDX.chassis, 0.6)} />

      {/* Removable panels */}
      {(
        [
          ["side", geo.side, [PANELS.side.x, 0, 0], PANELS.side.explode],
          ["front", geo.front, [0, 0, PANELS.front.z], PANELS.front.explode],
          ["top", geo.top, [0, PANELS.top.y, 0], PANELS.top.explode],
        ] as const
      ).map(([key, lines, pos, ex]) => (
        <Part key={key} center={pos} explode={ex} idx={IDX.chassis}>
          <LineSet positions={lines} onFrame={frame(IDX.chassis, 0.85)} />
          {key === "side" && <Anchor id="case:chassis" position={[0, 0.85, 0.75]} />}
        </Part>
      ))}

      {/* Front intake fan */}
      <Part center={L.fan.center} explode={L.fan.explode} idx={IDX.fan}>
        <LineSet positions={geo.fanBox} color="#cfcfcf" onFrame={frame(IDX.fan, 0.45)} />
        <LineSet positions={geo.fanFrame} onFrame={frame(IDX.fan, 0.9)} />
        <AnimGroup
          onFrame={(g, _j, t) => {
            g.rotation.z = t * 2.2;
          }}
        >
          <LineSet positions={geo.fanRotor} onFrame={frame(IDX.fan, 0.9)} />
        </AnimGroup>
        <Anchor id="case:case-fan" position={[0.0, 0.0, 0.06]} />
      </Part>

      {/* CPU cooler */}
      <Part center={L.cooler.center} explode={L.cooler.explode} idx={IDX.cooler}>
        <LineSet positions={geo.coolerBox} color="#cfcfcf" onFrame={frame(IDX.cooler, 0.7)} />
        <LineSet positions={geo.coolerFins} onFrame={frame(IDX.cooler, 0.7)} />
        <LineSet positions={geo.coolerFrame} onFrame={frame(IDX.cooler, 0.9)} />
        <AnimGroup
          onFrame={(g, _j, t) => {
            g.rotation.x = t * 2.6;
          }}
        >
          <LineSet positions={geo.coolerRotor} onFrame={frame(IDX.cooler, 0.9)} />
        </AnimGroup>
        <Anchor id="case:cpu-cooler" position={[coolerFanX, 0, 0]} />
      </Part>

      {/* Power supply */}
      <Part center={L.psu.center} explode={L.psu.explode} idx={IDX.psu}>
        <LineSet positions={geo.psuBox} color="#e2e2e2" onFrame={frame(IDX.psu, 0.9)} />
        <LineSet positions={geo.psu} onFrame={frame(IDX.psu, 0.6)} />
        <Anchor id="case:psu" position={[-L.psu.dims[0] / 2, 0, 0]} />
      </Part>

      {/* Graphics card */}
      <Part center={L.gpu.center} explode={L.gpu.explode} idx={IDX.gpu}>
        <LineSet positions={geo.gpuBox} color="#e2e2e2" onFrame={frame(IDX.gpu, 0.9)} />
        <LineSet positions={geo.gpu} onFrame={frame(IDX.gpu, 0.65)} />
        <Anchor id="case:gpu" position={[-L.gpu.dims[0] / 2, 0, 0]} />
      </Part>

      {/* Storage: hard disk and SSD */}
      <Part center={L.hdd.center} explode={L.hdd.explode} idx={IDX.storage}>
        <LineSet positions={geo.hddBox} color="#e2e2e2" onFrame={frame(IDX.storage, 0.9)} />
        <LineSet positions={geo.hdd} onFrame={frame(IDX.storage, 0.65)} />
        <Anchor id="case:storage" position={[0, L.hdd.dims[1] / 2, 0]} />
      </Part>
      <Part center={L.ssd.center} explode={L.ssd.explode} idx={IDX.storage}>
        <LineSet positions={geo.ssdBox} color="#e2e2e2" onFrame={frame(IDX.storage, 0.9)} />
        <LineSet positions={geo.ssd} onFrame={frame(IDX.storage, 0.65)} />
      </Part>
    </>
  );
}
