import { LineBuilder } from "../lineBuilder";
import { DESK, DRAWER_DIMS, TABLE_DIMS } from "../sceneConstants";
import { MeshBuilder, PAL, hex, unitBox, type SolidPart } from "./solids";
import {
  aluParts,
  bookPart,
  coreParts,
  cpuDetail,
  cpuPinLines,
  dashedRing,
  drawerParts,
  faceFrameLines,
  fileIcon,
  gameTile,
  gpuParts,
  legsPart,
  miniCpu,
  powerButtonLines,
  pulseRingLines,
  ramStickDetail,
  registersPart,
  slabPart,
  tableSurface,
  vramPart,
  workerParts,
} from "./software";

/** A unit cube (edges at ±0.5): scaled at runtime into the drawer body, the memory stick and the tabletop. */
const unitSolid = (): SolidPart => ({
  fill: unitBox([1, 1, 1]),
  lines: new LineBuilder().box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5).build(),
});

const rgb = (h: number) => hex(h);

export interface SoftwareGeometry {
  unit: SolidPart;
  core: ReturnType<typeof coreParts>;
  registers: SolidPart;
  alu: ReturnType<typeof aluParts>;
  worker: ReturnType<typeof workerParts>;
  book: SolidPart;
  bookRing: Float32Array;
  chipTop: SolidPart;
  chipPins: Float32Array;
  drawer: ReturnType<typeof drawerParts>;
  drawerSlot: SolidPart;
  stickDetail: SolidPart;
  tableMarks: Float32Array;
  legs: SolidPart;
  tile: SolidPart;
  miniTile: SolidPart;
  files: SolidPart[];
  process: SolidPart;
  threads: SolidPart[];
  halo: SolidPart;
  cpu: SolidPart;
  gpu: ReturnType<typeof gpuParts>;
  gpuPad: SolidPart;
  vram: SolidPart;
  face: Float32Array;
  button: Float32Array;
  ring: Float32Array;
}

let cache: SoftwareGeometry | null = null;

/** All the procedural geometry of the software chapter, built once and shared. */
export const getSoftware = (): SoftwareGeometry => {
  if (cache) return cache;

  // The dark opening of the drawer that shows when the tray is pulled out.
  const slab = new MeshBuilder();
  const fz = DRAWER_DIMS.z / 2;
  slab.box(-DRAWER_DIMS.x / 2 + 0.16, -DRAWER_DIMS.y / 2 + 0.13, fz - 0.002, DRAWER_DIMS.x / 2 - 0.16, DRAWER_DIMS.y / 2 - 0.13, fz + 0.002, rgb(PAL.graphite));
  const drawerSlot: SolidPart = { fill: slab.build(), lines: new Float32Array(0) };

  const { process, thread } = DESK;
  cache = {
    unit: unitSolid(),
    core: coreParts(),
    registers: registersPart(),
    alu: aluParts(),
    worker: workerParts(),
    book: bookPart(),
    bookRing: dashedRing(0.78),
    chipTop: cpuDetail(),
    chipPins: cpuPinLines(),
    drawer: drawerParts(),
    drawerSlot,
    stickDetail: ramStickDetail(),
    tableMarks: tableSurface(),
    legs: legsPart(),
    tile: gameTile(),
    miniTile: gameTile(),
    files: (["code", "textures", "audio", "data"] as const).map((k) => fileIcon(k)),
    process: slabPart(process.w, process.d, 0.05, 0.3, hex(0xf1e8d4)),
    threads: [rgb(PAL.mint), rgb(PAL.sky), rgb(PAL.peach)].map((c) => slabPart(thread.w, thread.d, 0.07, 0.15, c)),
    halo: slabPart(thread.w + 0.1, thread.d + 0.1, 0.01, 0.18, rgb(PAL.glow), false),
    cpu: miniCpu(),
    gpu: gpuParts(),
    gpuPad: slabPart(2.7, 3.3, 0.06, 0.3, rgb(PAL.lilac)),
    vram: vramPart(),
    face: faceFrameLines(),
    button: powerButtonLines(),
    ring: pulseRingLines(),
  };
  void TABLE_DIMS;
  return cache;
};
