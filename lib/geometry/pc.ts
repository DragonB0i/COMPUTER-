import { LineBuilder, type Plane } from "../lineBuilder";

/**
 * Conceptual ATX tower, expressed in the "case frame":
 *   +x  towards the motherboard tray (the open side of the case is -x)
 *   +y  up
 *   +z  towards the front of the case
 *
 * The motherboard is mounted on the tray, so its face points towards -x and its
 * rear I/O edge sits at the back (-z) of the case.
 */
export const TOWER = { x: 1.5, y: 2.6, z: 2.4 } as const;

export type V3 = readonly [number, number, number];

export interface PartPlacement {
  /** Centre of the part in the assembled case. */
  center: V3;
  /** Full dimensions (x, y, z) for box-like parts. */
  dims: V3;
  /** Direction (case frame) the part travels when the case is exploded. */
  explode: V3;
}

export const PART_LAYOUT = {
  psu: { center: [0, -1.0, -0.78], dims: [0.78, 0.46, 0.82], explode: [0.1, -1.1, -0.9] },
  fan: { center: [0, 0.45, 1.04], dims: [0.74, 0.74, 0.12], explode: [0, 0.5, 1.5] },
  cooler: { center: [0.425, 0.75, -0.25], dims: [0.34, 0.52, 0.36], explode: [-1.1, 0.35, 0] },
  gpu: { center: [0.21, -0.1, -0.3], dims: [0.82, 0.26, 1.2], explode: [-1.7, 0, 0.1] },
  hdd: { center: [-0.2, -0.5, 0.65], dims: [0.63, 0.16, 0.92], explode: [0, -0.3, 1.4] },
  ssd: { center: [0.38, -0.54, 0.75], dims: [0.43, 0.045, 0.62], explode: [0.25, -0.35, 0.9] },
} as const satisfies Record<string, PartPlacement>;

/** Motherboard pose: its local frame is face-on (x right, y up, +z out of the PCB). */
export const BOARD_POSE = {
  position: [0.665, 0.2, -0.1] as V3,
  /** Rotation about Y that turns the face-on board into the case frame. */
  rotationY: -Math.PI / 2,
  /** Explode travel (case frame), the board slides off its tray towards the open side. */
  explode: [-0.55, 0, 0] as V3,
} as const;

export const PANELS = {
  side: { x: -0.77, halfY: 1.26, halfZ: 1.16, explode: [-2.2, 0, 0.25] as V3 },
  front: { z: 1.22, halfX: 0.71, halfY: 1.26, explode: [0.25, 0, 1.9] as V3 },
  top: { y: 1.32, halfX: 0.71, halfZ: 1.16, explode: [0, 1.7, -0.2] as V3 },
} as const;

/* ------------------------------------------------------------------ helpers */

const place = (plane: Plane, u: number, v: number, w: number): V3 => LineBuilder.p(plane, u, v, w);

/** Fan: square frame, rotor ring, hub and swept blades lying in `plane` at offset `w`. */
export type FanPart = "all" | "frame" | "rotor";

export const fanLines = (plane: Plane, size: number, w = 0, blades = 7, part: FanPart = "all"): Float32Array => {
  const lb = new LineBuilder();
  const half = size / 2;
  const ring = size * 0.46;
  const hub = size * 0.14;
  if (part !== "rotor") {
    lb.rectChamfer(plane, -half, -half, half, half, size * 0.12, w);
    const screw = size * 0.065;
    for (const [u, v] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      lb.circle(plane, u * (half - size * 0.1), v * (half - size * 0.1), screw, w, 8);
    }
    lb.circle(plane, 0, 0, ring, w, 36);
  }
  if (part === "frame") return lb.build();
  lb.circle(plane, 0, 0, hub, w, 16);
  lb.circle(plane, 0, 0, hub * 0.45, w, 8);
  for (let i = 0; i < blades; i++) {
    const b = (i / blades) * Math.PI * 2;
    const a: V3[] = [];
    const c: V3[] = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const r = hub + (ring * 0.96 - hub) * t;
      const ang = b + 0.9 * t;
      a.push(place(plane, Math.cos(ang) * r, Math.sin(ang) * r, w));
      const ang2 = ang + 0.55 * Math.sin(Math.PI * t);
      c.push(place(plane, Math.cos(ang2) * r, Math.sin(ang2) * r, w));
    }
    lb.poly(a);
    lb.poly(c);
  }
  return lb.build();
};

/* ------------------------------------------------------------------ panels */

/** Tempered-glass side panel (lies in the YZ plane, centred on origin). */
export const sidePanelLines = (): Float32Array => {
  const { halfY, halfZ } = PANELS.side;
  const lb = new LineBuilder();
  lb.rectChamfer("yz", -halfY, -halfZ, halfY, halfZ, 0.08, 0);
  lb.rectChamfer("yz", -halfY + 0.1, -halfZ + 0.1, halfY - 0.1, halfZ - 0.1, 0.06, 0);
  // glass glints
  lb.seg(0.9, -0.7, 0, 1.15, -0.2, 0);
  lb.seg(0.82, -0.9, 0, 1.15, -0.28, 0);
  lb.seg(0.6, -1.0, 0, 0.9, -0.45, 0);
  // corner screws
  for (const [y, z] of [
    [halfY - 0.05, halfZ - 0.05],
    [halfY - 0.05, -halfZ + 0.05],
    [-halfY + 0.05, halfZ - 0.05],
    [-halfY + 0.05, -halfZ + 0.05],
  ] as const) {
    lb.circle("yz", y, z, 0.022, 0, 8);
  }
  return lb.build();
};

/** Front panel with a mesh intake, power button and ports (XY plane at z = 0). */
export const frontPanelLines = (): Float32Array => {
  const { halfX, halfY } = PANELS.front;
  const lb = new LineBuilder();
  lb.rectChamfer("xy", -halfX, -halfY, halfX, halfY, 0.08, 0);
  lb.rect("xy", -0.55, -0.95, 0.55, 0.78, 0);
  for (let i = 1; i < 28; i++) {
    const y = -0.95 + (i * 1.73) / 28;
    lb.seg(-0.55, y, 0, 0.55, y, 0);
  }
  lb.circle("xy", 0, 1.05, 0.05, 0, 14);
  lb.circle("xy", 0, 1.05, 0.02, 0, 8);
  lb.rect("xy", -0.33, 1.02, -0.23, 1.08, 0);
  lb.rect("xy", 0.23, 1.02, 0.33, 1.08, 0);
  lb.rect("xy", -0.19, 1.02, -0.13, 1.08, 0);
  lb.rect("xy", 0.13, 1.02, 0.19, 1.08, 0);
  return lb.build();
};

/** Top panel with vent slots (XZ plane at y = 0). */
export const topPanelLines = (): Float32Array => {
  const { halfX, halfZ } = PANELS.top;
  const lb = new LineBuilder();
  lb.rectChamfer("xz", -halfX, -halfZ, halfX, halfZ, 0.08, 0);
  for (let i = 0; i < 12; i++) {
    const x = -0.5 + (i * 1.0) / 11;
    // The top panel lies in the xz plane, so its vent slots run along z.
    lb.seg(x, 0, -0.9, x, 0, 0.9);
    lb.seg(x + 0.025, 0, -0.9, x + 0.025, 0, 0.9);
  }
  return lb.build();
};

/* ------------------------------------------------------------------ static chassis */

/** Rear plate, expansion brackets and tray: stays with the chassis frame. */
export const chassisStaticLines = (): Float32Array => {
  const lb = new LineBuilder();
  const z = -1.19;
  // PSU opening with a mounting-screw square
  lb.rect("xy", -0.4, -1.26, 0.4, -0.78, z);
  for (const [x, y] of [
    [-0.34, -1.2],
    [0.34, -1.2],
    [-0.34, -0.84],
    [0.34, -0.84],
  ] as const) {
    lb.circle("xy", x, y, 0.018, z, 6);
  }
  // I/O shield cut-out for the motherboard ports
  lb.rect("xy", 0.34, 0.36, 0.7, 1.08, z);
  // Exhaust fan opening
  lb.circle("xy", -0.15, 0.78, 0.3, z, 28);
  lb.circle("xy", -0.15, 0.78, 0.2, z, 24);
  for (const [x, y] of [
    [-0.41, 1.04],
    [0.11, 1.04],
    [0.11, 0.52],
    [-0.41, 0.52],
  ] as const) {
    lb.circle("xy", x, y, 0.016, z, 6);
  }
  // Expansion slot brackets
  for (let i = 0; i < 7; i++) {
    const y0 = 0.07 - (i + 1) * 0.125;
    lb.rect("xy", 0.26, y0 + 0.012, 0.7, y0 + 0.113, z);
    lb.seg(0.26, y0 + 0.062, z, 0.34, y0 + 0.062, z);
  }
  // Motherboard tray with cable cut-outs (YZ plane at x = 0.72)
  const x = 0.72;
  lb.rectChamfer("yz", -1.22, -1.1, 1.22, 1.1, 0.06, x);
  lb.rect("yz", 0.9, 0.5, 1.12, 0.75, x);
  lb.rect("yz", -0.1, 0.75, 0.55, 0.95, x);
  lb.rect("yz", -0.9, 0.78, -0.55, 0.98, x);
  lb.rect("yz", 0.2, -1.0, 0.5, -0.95, x);
  // Feet
  for (const [fx, fz] of [
    [-0.6, -0.95],
    [0.6, -0.95],
    [-0.6, 0.95],
    [0.6, 0.95],
  ] as const) {
    lb.box(fx - 0.07, -1.38, fz - 0.07, fx + 0.07, -1.3, fz + 0.07);
  }
  return lb.build();
};

/* ------------------------------------------------------------------ component extras (local to each part) */

/** Power supply: fan grille on its underside, label, rear switch and cable stubs. */
export const psuExtras = (): Float32Array => {
  const [w, h, d] = PART_LAYOUT.psu.dims;
  const lb = new LineBuilder();
  const yb = -h / 2;
  for (const r of [0.3, 0.22, 0.14, 0.06]) lb.circle("xz", 0, 0, r, yb, 24);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    lb.seg(Math.cos(a) * 0.06, yb, Math.sin(a) * 0.06, Math.cos(a) * 0.3, yb, Math.sin(a) * 0.3);
  }
  // label on the -x face (visible from the open side)
  lb.rect("yz", -0.15, -0.28, 0.15, 0.28, -w / 2);
  lb.seg(-w / 2, -0.1, -0.18, -w / 2, -0.1, 0.18);
  lb.seg(-w / 2, 0, -0.18, -w / 2, 0, 0.18);
  // mains inlet + switch on the rear face
  lb.rect("xy", 0.1, -0.12, 0.3, 0.1, -d / 2);
  lb.rect("xy", -0.3, -0.06, -0.15, 0.06, -d / 2);
  // outgoing cables
  for (let i = 0; i < 6; i++) {
    const x = -0.28 + i * 0.11;
    lb.seg(x, h * 0.2, d / 2, x, h * 0.2, d / 2 + 0.12);
  }
  return lb.build();
};

/** GPU: vent grilles on top, edge connector and rear bracket. */
export const gpuExtras = (): Float32Array => {
  const [w, h, d] = PART_LAYOUT.gpu.dims;
  const lb = new LineBuilder();
  for (let i = 0; i < 3; i++) {
    const z = -d / 2 + 0.22 + i * 0.38;
    lb.circle("xz", 0.0, z, 0.15, h / 2, 22);
    lb.circle("xz", 0.0, z, 0.05, h / 2, 10);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      lb.seg(Math.cos(a) * 0.05, h / 2, z + Math.sin(a) * 0.05, Math.cos(a) * 0.15, h / 2, z + Math.sin(a) * 0.15);
    }
  }
  // gold-finger edge connector on the board-facing (+x) end
  for (let i = 0; i < 22; i++) {
    const z = -0.26 + i * 0.024;
    lb.seg(w / 2, -h / 2 + 0.02, z, w / 2 + 0.05, -h / 2 + 0.02, z);
  }
  // logo strip on the visible (-x) end
  lb.rect("yz", -0.05, -0.32, 0.05, 0.32, -w / 2);
  // rear bracket with display outputs
  lb.rect("xy", -w / 2, -h / 2, w / 2 - 0.08, h / 2, -d / 2);
  for (let i = 0; i < 4; i++) {
    lb.rect("xy", -0.35 + i * 0.16, -0.05, -0.23 + i * 0.16, 0.05, -d / 2);
  }
  return lb.build();
};

/** Hard disk: platter, spindle, actuator arm, label and SATA connectors. */
export const hddExtras = (): Float32Array => {
  const [w, h, d] = PART_LAYOUT.hdd.dims;
  const lb = new LineBuilder();
  const y = h / 2;
  lb.circle("xz", 0, 0.05, 0.27, y, 28);
  lb.circle("xz", 0, 0.05, 0.08, y, 12);
  lb.circle("xz", 0, 0.05, 0.02, y, 6);
  lb.poly(
    [
      [0.2, y, -0.3],
      [0.05, y, 0.0],
    ],
    false,
  );
  lb.circle("xz", 0.2, -0.3, 0.025, y, 8);
  lb.rect("xz", -0.28, -0.42, 0.28, -0.3, y);
  lb.seg(-0.2, y, -0.36, 0.1, y, -0.36);
  // SATA data + power connectors on the rear edge
  lb.box(0.05, -0.04, -d / 2 - 0.05, 0.28, 0.04, -d / 2);
  lb.box(-0.2, -0.04, -d / 2 - 0.05, 0.0, 0.04, -d / 2);
  // keep the platter inside the casing if the drive is resized
  lb.rect("xz", -w / 2 + 0.02, -d / 2 + 0.02, w / 2 - 0.02, d / 2 - 0.02, y);
  return lb.build();
};

/** 2.5" SSD: label, flash packages and connector. */
export const ssdExtras = (): Float32Array => {
  const [w, h, d] = PART_LAYOUT.ssd.dims;
  const lb = new LineBuilder();
  const y = h / 2;
  lb.rect("xz", -w / 2 + 0.03, -d / 2 + 0.05, w / 2 - 0.03, -0.02, y);
  for (let i = 0; i < 3; i++) {
    lb.rect("xz", -w / 2 + 0.05 + i * 0.12, 0.05, -w / 2 + 0.15 + i * 0.12, 0.22, y);
  }
  lb.box(0.02, -h / 2, -d / 2 - 0.04, 0.2, h / 2, -d / 2);
  return lb.build();
};

/** CPU cooler: top-face fins, heat-pipe circles and the side fan. */
export const coolerExtras = (): { fins: Float32Array; fanFrame: Float32Array; fanRotor: Float32Array } => {
  const [w, h, d] = PART_LAYOUT.cooler.dims;
  const fins = new LineBuilder();
  for (let i = 0; i < 12; i++) {
    const z = -d / 2 + (i + 0.5) * (d / 12);
    fins.seg(-w / 2, h / 2, z, w / 2, h / 2, z);
    fins.seg(-w / 2, -h / 2, z, w / 2, -h / 2, z);
  }
  fins.circle("xz", -0.05, -0.08, 0.025, h / 2, 8);
  fins.circle("xz", -0.05, 0.0, 0.025, h / 2, 8);
  fins.circle("xz", -0.05, 0.08, 0.025, h / 2, 8);
  // fan frame sits on the -x face of the heatsink, so it is a YZ-plane fan
  const fx = -w / 2 - 0.035;
  return {
    fins: fins.build(),
    fanFrame: fanLines("yz", 0.5, fx, 7, "frame"),
    fanRotor: fanLines("yz", 0.5, fx, 7, "rotor"),
  };
};

export const FAN_THICKNESS = 0.07;
