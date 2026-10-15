import { LineBuilder, type Vec3 } from "../lineBuilder";
import type { BoardComponentId } from "../../types/hardware";

/**
 * Conceptual ATX motherboard in its own face-on frame:
 *   x : rear I/O edge (left, -x)  ->  front of the case (right, +x)
 *   y : up
 *   z : out of the PCB surface (components stand up along +z)
 *
 * Proportions follow a 305 x 244 mm ATX board at roughly 0.0062 units / mm.
 * This is a *conceptual* model: real boards vary in which slots and chips they carry.
 */
export const BOARD_SIZE = { width: 1.52, height: 1.9 } as const;

export type { BoardComponentId };

export const BOARD_COMPONENT_ORDER: readonly BoardComponentId[] = [
  "cpu",
  "ram",
  "pcie",
  "m2",
  "sata",
  "chipset",
  "power",
  "io",
  "wifi",
];

export interface HotBox {
  min: Vec3;
  max: Vec3;
}

export interface BoardPartGeometry {
  /** Component outline. */
  lines: Float32Array;
  /** Copper traces that belong to this component (glow when it is active). */
  traces: Float32Array;
  /** Invisible click targets. */
  hot: readonly HotBox[];
  /** Where leader lines attach (board frame). */
  anchor: Vec3;
}

export interface BoardGeometry {
  pcb: Float32Array;
  decor: Float32Array;
  parts: Record<BoardComponentId, BoardPartGeometry>;
  /** Ghost graphics card shown hovering over the PCIe slot when it is selected. */
  ghostGpu: Float32Array;
}

const T = 0.002; // trace elevation above the PCB surface

export const buildBoard = (): BoardGeometry => {
  /* ---- PCB ---- */
  const pcb = new LineBuilder();
  pcb.box(-0.76, -0.95, -0.03, 0.76, 0.95, 0);
  for (const [x, y] of [
    [-0.69, 0.89],
    [0.69, 0.89],
    [-0.69, 0.2],
    [0.0, 0.2],
    [0.69, 0.2],
    [0.0, 0.89],
    [-0.69, -0.88],
    [0.0, -0.88],
    [0.69, -0.88],
  ] as const) {
    pcb.circle("xy", x, y, 0.022, 0, 10);
    pcb.circle("xy", x, y, 0.01, 0, 6);
  }

  /* ---- decoration (not selectable) ---- */
  const decor = new LineBuilder();
  // VRM heatsinks around the CPU
  decor.box(-0.52, 0.34, 0, -0.4, 0.8, 0.07);
  for (let i = 1; i < 9; i++) decor.seg(-0.52, 0.34 + (i * 0.46) / 9, 0.07, -0.4, 0.34 + (i * 0.46) / 9, 0.07);
  decor.box(-0.34, 0.77, 0, 0.04, 0.83, 0.07);
  for (let i = 1; i < 12; i++) decor.seg(-0.34 + (i * 0.38) / 12, 0.77, 0.07, -0.34 + (i * 0.38) / 12, 0.83, 0.07);
  // CMOS battery
  decor.circle("xy", -0.12, -0.82, 0.07, 0.03, 20);
  decor.circle("xy", -0.12, -0.82, 0.045, 0.03, 16);
  // Firmware flash chip
  decor.box(0.0, -0.9, 0, 0.1, -0.84, 0.012);
  // Audio capacitors
  for (let i = 0; i < 4; i++) decor.circle("xy", -0.66 + i * 0.045, -0.88, 0.016, 0.03, 8);
  // Front-panel header
  decor.rect("xy", 0.2, -0.93, 0.46, -0.88, 0.04);
  for (let i = 0; i < 8; i++) decor.rect("xy", 0.215 + i * 0.03, -0.915, 0.23 + i * 0.03, -0.9, 0.04);
  // Small SMD scatter near the socket
  for (let i = 0; i < 10; i++) {
    decor.rect("xy", -0.38, 0.38 + i * 0.035, -0.365, 0.395 + i * 0.035, 0.012);
  }

  /* ---- CPU ---- */
  const cpu = new LineBuilder();
  cpu.box(-0.34, 0.36, 0, 0.04, 0.74, 0.035);
  cpu.rect("xy", -0.32, 0.38, 0.02, 0.72, 0.035);
  cpu.box(-0.3, 0.4, 0.035, 0.0, 0.7, 0.065);
  cpu.rect("xy", -0.27, 0.43, -0.03, 0.67, 0.065);
  cpu.rect("xy", -0.21, 0.49, -0.09, 0.61, 0.065);
  cpu.poly(
    [
      [-0.3, 0.4, 0.065],
      [-0.3, 0.45, 0.065],
      [-0.25, 0.4, 0.065],
    ],
    true,
  );
  // retention lever
  cpu.poly(
    [
      [0.04, 0.4, 0.04],
      [0.075, 0.4, 0.04],
      [0.075, 0.72, 0.04],
      [0.04, 0.72, 0.04],
    ],
    false,
  );
  const cpuTraces = new LineBuilder();
  cpuTraces.poly([[-0.4, 0.45, T], [-0.34, 0.45, T]]);
  cpuTraces.poly([[-0.4, 0.65, T], [-0.34, 0.65, T]]);
  cpuTraces.poly([[-0.2, 0.77, T], [-0.2, 0.74, T]]);

  /* ---- RAM ---- */
  const ram = new LineBuilder();
  const ramX = [0.25, 0.34, 0.43, 0.52];
  ramX.forEach((c, i) => {
    ram.box(c - 0.022, 0.14, 0, c + 0.022, 0.92, 0.03);
    ram.rect("xy", c - 0.03, 0.92, c + 0.03, 0.945, 0.03); // latch
    ram.rect("xy", c - 0.03, 0.115, c + 0.03, 0.14, 0.03);
    ram.seg(c - 0.022, 0.55, 0.03, c + 0.022, 0.55, 0.03); // key notch
    if (i === 1 || i === 3) {
      // populated slots (A2 / B2, the recommended dual-channel pair)
      ram.box(c - 0.012, 0.16, 0.03, c + 0.012, 0.9, 0.2);
      for (let k = 0; k < 8; k++) {
        const y0 = 0.2 + k * 0.085;
        ram.rect("yz", y0, 0.07, y0 + 0.06, 0.17, c - 0.012);
      }
      ram.seg(c - 0.012, 0.55, 0.03, c - 0.012, 0.55, 0.12);
    }
  });
  const ramTraces = new LineBuilder();
  for (let i = 0; i < 6; i++) {
    const y = 0.42 + i * 0.04;
    ramTraces.poly([[0.045, y, T], [0.2, y, T], [0.225, 0.14 + i * 0.12, T]]);
  }

  /* ---- PCIe ---- */
  const pcie = new LineBuilder();
  const slot = (x0: number, x1: number, y: number, lanes: number) => {
    pcie.box(x0, y - 0.03, 0, x1, y + 0.03, 0.045);
    pcie.seg(x0 + 0.01, y, 0.045, x1 - 0.01, y, 0.045);
    pcie.seg(x0 + (x1 - x0) * 0.35, y - 0.03, 0.045, x0 + (x1 - x0) * 0.35, y + 0.03, 0.045);
    for (let i = 0; i < lanes; i++) {
      const x = x0 + 0.015 + (i * (x1 - x0 - 0.03)) / Math.max(1, lanes - 1);
      pcie.seg(x, y - 0.018, 0.045, x, y - 0.006, 0.045);
    }
    pcie.rect("xy", x1, y - 0.03, x1 + 0.03, y + 0.03, 0.03); // latch
  };
  slot(-0.56, 0.0, -0.3, 22);
  pcie.rect("xy", -0.58, -0.35, 0.035, -0.25, 0.0); // metal reinforcement
  slot(-0.56, -0.27, -0.52, 8);
  slot(-0.56, 0.0, -0.72, 18);
  const pcieTraces = new LineBuilder();
  pcieTraces.poly([[0.045, 0.41, T], [0.13, 0.41, T], [0.13, -0.3, T], [0.0, -0.3, T]]);
  pcieTraces.poly([[0.045, 0.39, T], [0.15, 0.39, T], [0.15, -0.3, T]]);

  /* ---- M.2 (NVMe) ---- */
  const m2 = new LineBuilder();
  m2.box(0.0, 0.0, 0, 0.06, 0.075, 0.03);
  m2.circle("xy", -0.52, 0.0375, 0.02, 0.03, 10);
  m2.circle("xy", -0.52, 0.0375, 0.008, 0.03, 6);
  m2.box(-0.48, 0.012, 0.03, 0.03, 0.063, 0.042);
  m2.rect("xy", -0.42, 0.02, -0.33, 0.055, 0.042);
  m2.rect("xy", -0.29, 0.02, -0.2, 0.055, 0.042);
  m2.rect("xy", -0.16, 0.02, -0.07, 0.055, 0.042);
  m2.rect("xy", -0.05, 0.025, 0.01, 0.05, 0.042);
  const m2Traces = new LineBuilder();
  m2Traces.poly([[-0.2, 0.36, T], [-0.2, 0.075, T]]);
  m2Traces.poly([[-0.17, 0.36, T], [-0.17, 0.075, T]]);

  /* ---- SATA ---- */
  const sata = new LineBuilder();
  const sataY = [-0.84, -0.76, -0.68, -0.6];
  sataY.forEach((c) => {
    sata.box(0.54, c - 0.027, 0, 0.74, c + 0.027, 0.07);
    sata.rect("xy", 0.56, c - 0.015, 0.72, c + 0.015, 0.07);
    sata.seg(0.6, c - 0.027, 0.07, 0.6, c - 0.015, 0.07);
  });
  const sataTraces = new LineBuilder();
  sataTraces.poly([[0.42, -0.5, T], [0.48, -0.5, T], [0.48, -0.84, T]]);
  sataY.forEach((c) => sataTraces.poly([[0.48, c, T], [0.54, c, T]]));

  /* ---- Chipset ---- */
  const chipset = new LineBuilder();
  chipset.box(0.18, -0.57, 0, 0.42, -0.33, 0.06);
  for (let i = 1; i < 8; i++) chipset.seg(0.18 + (i * 0.24) / 8, -0.57, 0.06, 0.18 + (i * 0.24) / 8, -0.33, 0.06);
  chipset.rect("xy", 0.24, -0.51, 0.36, -0.39, 0.06);
  chipset.box(0.26, -0.49, 0.0, 0.34, -0.41, 0.025);
  const chipsetTraces = new LineBuilder();
  chipsetTraces.poly([[0.045, 0.38, T], [0.09, 0.38, T], [0.09, 0.1, T], [0.3, 0.1, T], [0.3, -0.33, T]]);
  chipsetTraces.poly([[0.045, 0.375, T], [0.1, 0.375, T], [0.1, 0.115, T], [0.28, 0.115, T], [0.28, -0.33, T]]);

  /* ---- Power ---- */
  const power = new LineBuilder();
  power.box(0.62, -0.22, 0, 0.72, 0.52, 0.12);
  for (let r = 0; r < 12; r++) {
    const y = -0.2 + r * 0.06;
    power.rect("xy", 0.633, y, 0.655, y + 0.04, 0.12);
    power.rect("xy", 0.677, y, 0.699, y + 0.04, 0.12);
  }
  power.seg(0.62, 0.2, 0.12, 0.72, 0.2, 0.12);
  power.box(-0.3, 0.85, 0, -0.06, 0.93, 0.1);
  for (let c = 0; c < 4; c++) {
    power.rect("xy", -0.285 + c * 0.057, 0.865, -0.255 + c * 0.057, 0.88, 0.1);
    power.rect("xy", -0.285 + c * 0.057, 0.9, -0.255 + c * 0.057, 0.915, 0.1);
  }
  const powerTraces = new LineBuilder();
  powerTraces.poly([[0.62, -0.1, T], [0.46, -0.1, T], [0.46, -0.33, T]]);
  powerTraces.poly([[0.62, 0.45, T], [0.58, 0.45, T], [0.58, -0.1, T]]);
  powerTraces.poly([[-0.3, 0.89, T], [-0.46, 0.89, T], [-0.46, 0.8, T]]);
  powerTraces.poly([[-0.06, 0.89, T], [0.0, 0.89, T], [0.0, 0.84, T]]);

  /* ---- Rear I/O ---- */
  const io = new LineBuilder();
  io.box(-0.82, 0.15, 0, -0.5, 0.88, 0.16);
  io.rect("xy", -0.8, 0.17, -0.52, 0.86, 0.16);
  io.poly(
    [
      [-0.8, 0.8, 0.16],
      [-0.58, 0.8, 0.16],
      [-0.6, 0.85, 0.16],
      [-0.78, 0.85, 0.16],
    ],
    true,
  );
  io.rect("xy", -0.8, 0.62, -0.66, 0.74, 0.16);
  io.rect("xy", -0.64, 0.62, -0.52, 0.74, 0.16);
  io.rect("xy", -0.8, 0.4, -0.64, 0.56, 0.16);
  for (let i = 1; i < 8; i++) io.seg(-0.8 + (i * 0.16) / 8, 0.4, 0.16, -0.8 + (i * 0.16) / 8, 0.44, 0.16);
  io.rect("xy", -0.62, 0.4, -0.52, 0.56, 0.16);
  for (let i = 0; i < 3; i++) io.circle("xy", -0.74 + i * 0.09, 0.27, 0.025, 0.16, 8);
  const ioTraces = new LineBuilder();
  ioTraces.poly([[-0.5, 0.22, T], [0.2, 0.22, T], [0.2, -0.33, T]]);
  ioTraces.poly([[-0.5, 0.26, T], [0.18, 0.26, T], [0.18, -0.33, T]]);

  /* ---- Wi-Fi (M.2 E-key card) ---- */
  const wifi = new LineBuilder();
  wifi.box(-0.62, 0.0, 0.02, -0.43, 0.136, 0.032);
  wifi.box(-0.43, 0.03, 0, -0.37, 0.106, 0.03);
  wifi.rect("xy", -0.58, 0.02, -0.5, 0.08, 0.032);
  wifi.rect("xy", -0.56, 0.09, -0.48, 0.125, 0.032);
  wifi.circle("xy", -0.62, 0.06, 0.012, 0.032, 8);
  wifi.circle("xy", -0.62, 0.1, 0.012, 0.032, 8);
  wifi.poly([[-0.62, 0.06, 0.032], [-0.7, 0.06, 0.032], [-0.7, 0.15, 0.032]]);
  wifi.poly([[-0.62, 0.1, 0.032], [-0.73, 0.1, 0.032], [-0.73, 0.15, 0.032]]);
  const wifiTraces = new LineBuilder();
  wifiTraces.poly([[-0.4, 0.07, T], [-0.34, 0.07, T], [-0.34, 0.22, T]]);

  /* ---- ghost GPU ---- */
  const ghost = new LineBuilder();
  ghost.box(-0.8, -0.43, 0.2, 0.3, -0.17, 0.82);
  for (let i = 0; i < 3; i++) {
    const x = -0.62 + i * 0.4;
    ghost.circle("xy", x, -0.3, 0.1, 0.82, 18);
    ghost.circle("xy", x, -0.3, 0.035, 0.82, 8);
  }
  for (let i = 0; i < 10; i++) {
    const x = -0.5 + i * 0.05;
    ghost.seg(x, -0.3, 0.045, x, -0.3, 0.2);
  }

  const part = (
    lines: LineBuilder,
    traces: LineBuilder,
    hot: readonly HotBox[],
    anchor: Vec3,
  ): BoardPartGeometry => ({ lines: lines.build(), traces: traces.build(), hot, anchor });

  return {
    pcb: pcb.build(),
    decor: decor.build(),
    ghostGpu: ghost.build(),
    parts: {
      cpu: part(cpu, cpuTraces, [{ min: [-0.38, 0.34, -0.02], max: [0.09, 0.76, 0.1] }], [-0.15, 0.55, 0.065]),
      ram: part(ram, ramTraces, [{ min: [0.2, 0.1, -0.02], max: [0.57, 0.96, 0.24] }], [0.385, 0.55, 0.2]),
      pcie: part(pcie, pcieTraces, [{ min: [-0.6, -0.78, -0.02], max: [0.04, -0.24, 0.08] }], [-0.28, -0.3, 0.045]),
      m2: part(m2, m2Traces, [{ min: [-0.56, -0.02, -0.02], max: [0.08, 0.1, 0.07] }], [-0.25, 0.0375, 0.042]),
      sata: part(sata, sataTraces, [{ min: [0.5, -0.89, -0.02], max: [0.78, -0.55, 0.1] }], [0.64, -0.72, 0.07]),
      chipset: part(chipset, chipsetTraces, [{ min: [0.14, -0.61, -0.02], max: [0.46, -0.29, 0.1] }], [0.3, -0.45, 0.06]),
      power: part(
        power,
        powerTraces,
        [
          { min: [0.58, -0.26, -0.02], max: [0.76, 0.56, 0.14] },
          { min: [-0.34, 0.81, -0.02], max: [-0.02, 0.97, 0.12] },
        ],
        [0.67, 0.15, 0.12],
      ),
      io: part(io, ioTraces, [{ min: [-0.86, 0.15, -0.02], max: [-0.46, 0.92, 0.2] }], [-0.66, 0.5, 0.16]),
      wifi: part(wifi, wifiTraces, [{ min: [-0.76, -0.02, -0.02], max: [-0.34, 0.145, 0.07] }], [-0.52, 0.07, 0.032]),
    },
  };
};
