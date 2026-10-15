import { clamp, lerp, smootherstep, smoothstep } from "./animation";
import {
  CPU_DIMS,
  CUBE_EDGE,
  DESK,
  DESK_COMPACT,
  DRAWER_DIMS,
  MILESTONE_COUNT,
  TABLE_DIMS,
  TAN_HALF_FOV,
  TIMING,
  TOWER_DIMS,
} from "./sceneConstants";
import type { JourneyState } from "./journey";

/** Timeline window (units) in which the cube slides back to the centre for the last milestone. */
const VN_START = TIMING.msStart + TIMING.msLen * (MILESTONE_COUNT - 1);
const VN_ENTER: readonly [number, number] = [VN_START - 0.25, VN_START + 0.35];

/** Everything the camera and the protagonist group need for one frame. */
export interface RigPose {
  camDist: number;
  camY: number;
  /** Visible world size at the origin plane for the current camera distance. */
  visW: number;
  visH: number;
  posX: number;
  posY: number;
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** Outline box dimensions in local units (before `scale`). */
  dimX: number;
  dimY: number;
  dimZ: number;
  /** 1 on narrow screens, where the final scene is recomposed to be tall instead of wide. */
  compact: number;
  /** Positions of the graphics card, its mat and its memory for the current layout. */
  gpu: [number, number, number];
  gpuPad: [number, number, number];
  vram: [number, number, number];
}

export const createRigPose = (): RigPose => ({
  camDist: 8,
  camY: 0,
  visW: 10,
  visH: 6,
  posX: 0,
  posY: 0,
  scale: 1,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  dimX: 1,
  dimY: 1,
  dimZ: 1,
  compact: 0,
  gpu: [...DESK.gpu],
  gpuPad: [...DESK.gpuPad],
  vram: [...DESK.vram],
});

/** Camera distance that fits a box of half-extents (halfW, halfH) inside a fraction of the screen. */
const fitDist = (halfW: number, halfH: number, aspect: number, fillW: number, fillH: number): number => {
  const byH = halfH / (TAN_HALF_FOV * fillH);
  const byW = halfW / (TAN_HALF_FOV * aspect * fillW);
  return Math.max(byH, byW);
};

const mix3 = (a: number, b: number, t: number) => lerp(a, b, t);

/** Slab that the tower flattens into while its front panel is shown. */
const FACE_DIMS = { x: TOWER_DIMS.x, y: TOWER_DIMS.y, z: 0.24 } as const;
/** Package of the opening processor, reused when the CPU returns in the light chapter. */
const PKG_DIMS = { x: CPU_DIMS.width, y: CPU_DIMS.thickness, z: CPU_DIMS.width } as const;

/** What the camera looks at (in the group's local space) at each stage of the software chapter. */
const FOCUS = {
  face: [0, 0],
  cpu: [0, 0.2],
  drawer: [0, 0.05],
  desk: [0, 0.55],
  gpu: [1.35, 0.55],
  gpuPortrait: [0.35, 0.45],
  /** Phones: a closer look at the process and the processor above it. */
  procPortrait: [1.0, 0.75],
  hold: [1.55, 0.55],
  holdPortrait: [0.35, 0.45],
} as const;

/** The group is rotated (X after Y) and then moved; this returns the move that puts `f` mid-screen. */
const centreOn = (fx: number, fy: number, fz: number, rotX: number, rotY: number, out: [number, number]): void => {
  const x1 = fx * Math.cos(rotY) + fz * Math.sin(rotY);
  const z1 = -fx * Math.sin(rotY) + fz * Math.cos(rotY);
  out[0] = -x1;
  out[1] = -(fy * Math.cos(rotX) - z1 * Math.sin(rotX));
};

const tmp: [number, number] = [0, 0];

/**
 * Computes the camera distance, protagonist transform and outline dimensions for the current
 * journey state. Pure: also used for debugging in Node.
 */
export const computeRig = (j: JourneyState, aspect: number, time: number, out: RigPose): RigPose => {
  const portrait = aspect < 0.95;
  const S = j.sw;

  /* ---- distances -------------------------------------------------------------- */
  const dHero = portrait ? fitDist(1.3, 1.3, aspect, 0.82, 0.3) : 8.4;
  const dHist = 8.6;
  const dCase = portrait ? fitDist(TOWER_DIMS.z / 2 + 0.3, 1.5, aspect, 0.8, 0.5) : 9.4;
  const dExplode = portrait
    ? fitDist(3.4, 3.2, aspect, 0.92, 0.5)
    : fitDist(3.5, 3.3, aspect, 0.46, 0.8);
  const dBoard = portrait ? fitDist(0.95, 1.05, aspect, 0.88, 0.42) : 4.7;

  // Software chapter.
  const dFace = portrait ? fitDist(0.9, 1.5, aspect, 0.74, 0.42) : fitDist(0.9, 1.5, aspect, 0.5, 0.66);
  const dCpu = portrait ? fitDist(2.7, 1.7, aspect, 0.96, 0.4) : fitDist(2.45, 1.5, aspect, 0.6, 0.7);
  const dDrawer = portrait ? fitDist(1.8, 1.3, aspect, 0.9, 0.34) : fitDist(1.9, 1.4, aspect, 0.4, 0.55);
  const dDesk = portrait ? fitDist(3.6, 2.8, aspect, 0.96, 0.44) : fitDist(3.7, 2.7, aspect, 0.56, 0.74);
  const dProc = fitDist(2.05, 2.1, aspect, 0.96, 0.42);
  const dGpu = portrait ? fitDist(3.45, 3.2, aspect, 0.96, 0.5) : fitDist(4.9, 2.6, aspect, 0.6, 0.74);
  const dHold = portrait ? fitDist(3.45, 3.2, aspect, 0.96, 0.5) : fitDist(5.05, 2.7, aspect, 0.86, 0.74);

  const m = smootherstep(0, 1, j.morph);
  const c = smootherstep(0, 1, j.caseBuild);
  const e = smootherstep(0, 1, j.explode);
  const b = smootherstep(0, 1, j.boardFocus);
  const tFace = smootherstep(0, 1, S.face);
  const tTurn = smootherstep(0, 1, S.turn);
  const tCpu = smootherstep(0, 1, S.cpu);
  const tDrawer = smootherstep(0, 1, S.drawer);
  const tDesk = smootherstep(0, 1, S.table);
  const tGpu = smootherstep(0, 1, S.gpu);
  const tHold = smootherstep(0, 1, S.hold);

  let dist = mix3(dHero, dHist, m);
  dist = mix3(dist, dCase, c);
  dist = mix3(dist, dExplode, e);
  dist = mix3(dist, dBoard, b);
  dist = mix3(dist, dFace, tFace);
  dist = mix3(dist, dCpu, tCpu);
  dist = mix3(dist, dDrawer, tDrawer);
  dist = mix3(dist, dDesk, tDesk);
  // Phones only: while the process and its threads are explained the camera moves in on them.
  const tProc = portrait ? smootherstep(0, 1, S.proc) : 0;
  dist = mix3(dist, dProc, tProc);
  dist = mix3(dist, dGpu, tGpu);
  dist = mix3(dist, dHold, tHold);

  const visH = 2 * dist * TAN_HALF_FOV;
  const visW = visH * aspect;

  /* ---- outline dimensions ------------------------------------------------------ */
  const pkgX = CPU_DIMS.width;
  const pkgY = CPU_DIMS.thickness;
  let dimX = lerp(pkgX, CUBE_EDGE, m);
  let dimY = lerp(pkgY, CUBE_EDGE, m);
  let dimZ = lerp(pkgX, CUBE_EDGE, m);
  dimX = lerp(dimX, TOWER_DIMS.x, c);
  dimY = lerp(dimY, TOWER_DIMS.y, c);
  dimZ = lerp(dimZ, TOWER_DIMS.z, c);
  // Software chapter: the tower flattens into its front panel, the processor package returns and
  // then grows into the storage drawer.
  dimX = lerp(dimX, FACE_DIMS.x, tFace);
  dimY = lerp(dimY, FACE_DIMS.y, tFace);
  dimZ = lerp(dimZ, FACE_DIMS.z, tFace);
  dimX = lerp(dimX, PKG_DIMS.x, tCpu);
  dimY = lerp(dimY, PKG_DIMS.y, tCpu);
  dimZ = lerp(dimZ, PKG_DIMS.z, tCpu);
  dimX = lerp(dimX, DRAWER_DIMS.x, tDrawer);
  dimY = lerp(dimY, DRAWER_DIMS.y, tDrawer);
  dimZ = lerp(dimZ, DRAWER_DIMS.z, tDrawer);

  /* ---- scale ------------------------------------------------------------------- */
  const sHero = portrait ? 0.62 : 1.0;
  const cubeFit = portrait
    ? Math.min(visH * 0.3, visW * 0.62) / CUBE_EDGE
    : Math.min(visH * 0.48, visW * 0.275) / CUBE_EDGE;
  let scale = lerp(sHero, cubeFit, m);
  // The von Neumann chapter keeps the cube centred between two columns and a closing statement
  // below it, so it gives up a little size there (desktop only) to leave the statement clear.
  if (!portrait) {
    const vn = smoothstep(VN_ENTER[0], VN_ENTER[1], j.units) * (1 - c);
    scale *= 1 - 0.14 * vn;
  }
  scale = lerp(scale, 1.0, c);
  scale = lerp(scale, 1.0, e);
  scale = lerp(scale, 1.0, b);

  /* ---- position ---------------------------------------------------------------- */
  const side = j.cubeSide;
  // History chapter: the cube slides to the side opposite the text.
  const histX = portrait ? side * 0.07 * visW : side * 0.245 * visW;
  const histY = portrait ? 0.2 * visH : 0;
  let posX = lerp(0, histX, m);
  let posY = lerp(-0.34, histY, m);
  // The cube returns to the exact centre for the von Neumann diagram and the case.
  posX = lerp(posX, 0, c);
  posY = lerp(posY, portrait ? 0.12 * visH : 0, c);
  posY = lerp(posY, portrait ? 0.14 * visH : 0, e);
  // Board: leave room for the information panel.
  const boardX = portrait ? 0 : -0.17 * visW;
  const boardY = portrait ? 0.17 * visH : 0.0;
  posX = lerp(posX, boardX, b);
  posY = lerp(posY, boardY, b);

  /* ---- rotation ---------------------------------------------------------------- */
  const heroRotY = 0.35 + Math.sin(time * 0.35) * 0.45;
  const histRotY = 0.5 + Math.sin(time * 0.25) * 0.12;
  let rotY = lerp(heroRotY, histRotY, m);
  rotY = lerp(rotY, 0.75, c);
  rotY = lerp(rotY, 0.82, e);
  rotY = lerp(rotY, 1.3 + Math.sin(time * 0.3) * 0.03, b);
  let rotX = lerp(0.75 + Math.sin(time * 0.5) * 0.03, 0.2, m);
  rotX = lerp(rotX, 0.18, c);
  rotX = lerp(rotX, 0.3, e);
  rotX = lerp(rotX, 0.05 + Math.sin(time * 0.4) * 0.015, b);

  /* ---- software chapter: turn to the front, then a gentle top-down view of the desk ----------- */
  // The front of the reassembled tower faces the viewer (rotation zero) before the power button.
  rotY = lerp(rotY, 0, tTurn);
  rotX = lerp(rotX, 0, tTurn);
  rotY = lerp(rotY, 0.5 + Math.sin(time * 0.3) * 0.08, tCpu);
  rotX = lerp(rotX, 0.62 + Math.sin(time * 0.5) * 0.02, tCpu);
  rotY = lerp(rotY, 0.4 + Math.sin(time * 0.3) * 0.05, tDrawer);
  rotX = lerp(rotX, 0.42, tDrawer);
  rotY = lerp(rotY, 0.1, tDesk);
  rotX = lerp(rotX, 0.52, tDesk);
  rotY = lerp(rotY, 0.06 + Math.sin(time * 0.25) * 0.01, tHold);
  rotX = lerp(rotX, 0.46, tHold);

  // What the camera looks at: the group is moved so that this point sits in the middle of the free area.
  let fx = FOCUS.face[0] as number;
  let fy = FOCUS.face[1] as number;
  const stage = (to: readonly [number, number], t: number) => {
    fx = lerp(fx, to[0], t);
    fy = lerp(fy, to[1], t);
  };
  stage(FOCUS.cpu, tCpu);
  stage(FOCUS.drawer, tDrawer);
  stage(FOCUS.desk, tDesk);
  stage(FOCUS.procPortrait, tProc);
  stage(portrait ? FOCUS.gpuPortrait : FOCUS.gpu, tGpu);
  stage(portrait ? FOCUS.holdPortrait : FOCUS.hold, tHold);
  // In the recomposed (portrait) layout the graphics card sits in front of the table, so the point
  // the camera looks at moves towards the viewer as it appears.
  const fz = portrait ? lerp(1.0 * tGpu, -0.9, tHold) : 0;
  centreOn(fx, fy, fz, rotX, rotY, tmp);
  const tSw = Math.max(tFace, tCpu);
  // The information panel takes the right side (desktop) or the lower part (phones) while it is up.
  const room = tCpu * (1 - tHold);
  posX = lerp(posX, tmp[0] + (portrait ? 0 : -0.16 * visW * room), tSw);
  posY = lerp(posY, tmp[1] + (portrait ? 0.17 * visH * room : 0), tSw);
  // On phones the final overview needs the whole width, so it is not offset.
  void TABLE_DIMS;

  const camY = lerp(0.0, 0.0, m);

  const compact = portrait ? 1 : 0;
  out.compact = compact;
  for (let k = 0; k < 3; k++) {
    out.gpu[k] = lerp(DESK.gpu[k]!, DESK_COMPACT.gpu[k]!, compact);
    out.gpuPad[k] = lerp(DESK.gpuPad[k]!, DESK_COMPACT.gpuPad[k]!, compact);
    out.vram[k] = lerp(DESK.vram[k]!, DESK_COMPACT.vram[k]!, compact);
  }

  out.camDist = dist;
  out.camY = camY;
  out.visW = visW;
  out.visH = visH;
  out.posX = posX;
  out.posY = posY + Math.sin(time * 0.9) * 0.04 * (1 - m);
  out.scale = scale;
  out.rotX = rotX;
  out.rotY = rotY;
  out.rotZ = 0;
  out.dimX = dimX;
  out.dimY = dimY;
  out.dimZ = dimZ;
  void clamp;
  return out;
};

/** Shared, mutated every frame by the rig driver and read by the models. */
export const rigPose: RigPose = createRigPose();
