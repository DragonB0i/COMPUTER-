import { LineBuilder } from "../lineBuilder";

/**
 * Procedural schematics for the six historical milestones.
 *
 * Everything lives inside the cube's interior, roughly [-0.9, 0.9]^3. Each machine is
 * split into `base` (always drawn, dimmer) and `accent` (the part the milestone is
 * about; brightened by the scroll "highlight" step).
 */
export interface MachineGeometry {
  base: Float32Array;
  accent: Float32Array;
  /** Optional text labels placed in cube space (rendered as HTML in the scene). */
  labels?: ReadonlyArray<{ text: string; position: readonly [number, number, number] }>;
}

/* ------------------------------------------------------------------ A: Analytical Engine */
export const analyticalEngine = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // Frame: two end plates joined by tie rods.
  for (const z of [-0.5, 0.5]) {
    base.rectChamfer("xy", -0.78, -0.9, 0.78, 0.8, 0.06, z);
  }
  for (const [x, y] of [
    [-0.78, -0.9],
    [0.78, -0.9],
    [-0.78, 0.8],
    [0.78, 0.8],
  ] as const) {
    base.seg(x, y, -0.5, x, y, 0.5);
  }

  // Number-wheel columns: 4 x 4 gear stacks on shafts that run front to back.
  const xs = [-0.45, -0.15, 0.15, 0.45];
  const ys = [-0.35, -0.05, 0.25, 0.55];
  xs.forEach((x, xi) => {
    ys.forEach((y, yi) => {
      const target = xi >= 2 ? accent : base; // right half = the "mill" (arithmetic unit)
      target.gear("xy", x, y, 0, 0.115, 12, 0.03, 4);
      const small = xi >= 2 ? accent : base;
      small.gear("xy", x, y, 0.28, 0.07, 8, 0.02, 3);
      base.seg(x, y, -0.5, x, y, 0.5); // shaft
      if ((xi + yi) % 2 === 0) base.circle("xy", x, y, 0.025, -0.3, 8);
    });
  });
  // Racks linking the store to the mill.
  base.seg(-0.6, 0.72, 0.1, 0.6, 0.72, 0.1);
  base.seg(-0.6, 0.76, 0.1, 0.6, 0.76, 0.1);
  for (let i = 0; i < 24; i++) {
    const x = -0.6 + (i * 1.2) / 23;
    base.seg(x, 0.72, 0.1, x, 0.76, 0.1);
  }

  // Punched-card chain along the front.
  for (let i = 0; i < 7; i++) {
    const x0 = -0.72 + i * 0.21;
    base.rect("xy", x0, -0.82, x0 + 0.18, -0.58, 0.55);
    for (let k = 0; k < 4; k++) {
      const hx = x0 + 0.04 + (k % 2) * 0.07;
      const hy = -0.78 + Math.floor(k / 2) * 0.1 + (i % 3) * 0.015;
      base.rect("xy", hx, hy, hx + 0.035, hy + 0.035, 0.55);
    }
    if (i < 6) base.seg(x0 + 0.18, -0.7, 0.55, x0 + 0.21, -0.7, 0.55);
  }

  return { base: base.build(), accent: accent.build() };
};

/* ------------------------------------------------------------------ B: Turing Machine */
export const turingMachine = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // Tape: nine cells with symbols; ends fade out to suggest an unbounded tape.
  const cell = 0.19;
  const cells = 9;
  const x0 = -(cells * cell) / 2;
  const yb = 0.18;
  const yt = 0.38;
  const symbols = [1, 0, 1, 1, 0, 0, 1, 0, 1];
  const active = 4;
  for (let i = 0; i < cells; i++) {
    const a = x0 + i * cell;
    const b = a + cell;
    const target = i === active ? accent : base;
    target.box(a, yb, -0.07, b, yt, 0.07);
    const cx = (a + b) / 2;
    const cy = (yb + yt) / 2;
    if (symbols[i] === 1) target.seg(cx, cy - 0.045, 0.07, cx, cy + 0.045, 0.07);
    else target.circle("xy", cx, cy, 0.04, 0.07, 10);
  }
  // Tape continues past both ends.
  for (const side of [-1, 1]) {
    const edge = side * (cells * cell) / 2;
    base.seg(edge, yb, 0.07, edge + side * 0.1, yb, 0.07);
    base.seg(edge, yt, 0.07, edge + side * 0.1, yt, 0.07);
    base.seg(edge, yb, -0.07, edge + side * 0.1, yb, -0.07);
    base.seg(edge, yt, -0.07, edge + side * 0.1, yt, -0.07);
  }

  // Read/write head over the active cell.
  const hx = x0 + active * cell + cell / 2;
  accent.box(hx - 0.1, 0.52, -0.1, hx + 0.1, 0.78, 0.1);
  accent.poly(
    [
      [hx - 0.1, 0.52, 0.1],
      [hx, 0.4, 0.0],
      [hx + 0.1, 0.52, 0.1],
    ],
    false,
  );
  accent.poly(
    [
      [hx - 0.1, 0.52, -0.1],
      [hx, 0.4, 0.0],
      [hx + 0.1, 0.52, -0.1],
    ],
    false,
  );
  accent.seg(hx, 0.78, 0, hx, 0.88, 0);
  base.circle("xy", hx, 0.65, 0.05, 0.1, 10);

  // State diagram: q0 -> q1 -> q2 -> (halt), with a self loop on q1 and a return arc.
  const sy = -0.45;
  const r = 0.11;
  const sx = [-0.62, -0.2, 0.22, 0.64];
  sx.forEach((x, i) => {
    const target = i === 1 ? accent : base;
    target.circle("xy", x, sy, r, 0, 18);
    if (i === 3) base.circle("xy", x, sy, r * 0.72, 0, 16); // halting state: double ring
    // state ticks
    base.seg(x - 0.03, sy, 0, x + 0.03, sy, 0);
  });
  base.arrow("xy", -0.9, sy, sx[0]! - r, sy, 0.035);
  base.arrow("xy", sx[0]! + r, sy, sx[1]! - r, sy, 0.035);
  accent.arrow("xy", sx[1]! + r, sy, sx[2]! - r, sy, 0.035);
  base.arrow("xy", sx[2]! + r, sy, sx[3]! - r, sy, 0.035);
  // Self-loop on q1.
  accent.arc("xy", sx[1]!, sy + r + 0.07, 0.07, -Math.PI * 0.15, Math.PI * 1.15, 0, 14);
  accent.arrowHead("xy", sx[1]! + 0.045, sy + r + 0.005, -0.4, -1, 0.035);
  // Return arc q2 -> q0 under the diagram.
  base.bezier([sx[2]!, sy - r, 0], [0.0, sy - 0.62, 0], [sx[0]!, sy - r, 0], 18);
  base.arrowHead("xy", sx[0]!, sy - r, -0.35, 1, 0.035);

  // Dotted link from the head's state register to the diagram (current state = q1).
  for (let i = 0; i < 7; i++) {
    const y = 0.12 - i * 0.075;
    accent.seg(sx[1]!, y, 0, sx[1]!, y - 0.035, 0);
  }

  return { base: base.build(), accent: accent.build() };
};

/* ------------------------------------------------------------------ C: Zuse Z3 */
export const zuseZ3 = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // Relay cabinet.
  accent.box(-0.9, -0.3, -0.2, -0.04, 0.86, 0.2);
  const cols = 5;
  const rows = 4;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = -0.8 + c * 0.16;
      const cy = -0.2 + r * 0.25;
      accent.box(cx - 0.05, cy - 0.06, 0.2, cx + 0.05, cy + 0.07, 0.3); // relay body
      accent.circle("xy", cx, cy + 0.005, 0.03, 0.3, 8); // coil
      accent.seg(cx - 0.035, cy - 0.06, 0.2, cx + 0.04, cy + 0.03, 0.2); // armature
    }
  }

  // Punched film reader on the right.
  const rx = 0.5;
  for (const y of [0.58, 0.02]) {
    base.circle("xy", rx, y, 0.15, 0, 20);
    base.circle("xy", rx, y, 0.045, 0, 10);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      base.seg(rx + Math.cos(a) * 0.045, y + Math.sin(a) * 0.045, 0, rx + Math.cos(a) * 0.14, y + Math.sin(a) * 0.14, 0);
    }
  }
  base.seg(rx - 0.15, 0.58, 0, rx - 0.15, 0.02, 0);
  base.seg(rx + 0.15, 0.58, 0, rx + 0.15, 0.02, 0);
  for (let i = 0; i < 8; i++) {
    const y = 0.5 - i * 0.065;
    base.rect("xy", rx - 0.035, y, rx + 0.035, y + 0.03, 0.01);
    base.rect("xy", rx - 0.1, y + 0.01, rx - 0.08, y + 0.03, 0.01);
    base.rect("xy", rx + 0.08, y + 0.01, rx + 0.1, y + 0.03, 0.01);
  }

  // Operator console: key grid + lamp row.
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 3; j++) {
      const kx = -0.34 + i * 0.12;
      const ky = -0.8 + j * 0.12;
      base.rect("xy", kx, ky, kx + 0.085, ky + 0.085, 0.4);
    }
  }
  for (let i = 0; i < 6; i++) base.circle("xy", -0.28 + i * 0.12, -0.4, 0.03, 0.4, 8);
  base.box(-0.46, -0.86, 0.3, 0.46, -0.36, 0.46);

  // Wiring.
  base.poly(
    [
      [-0.47, -0.3, 0],
      [-0.47, -0.36, 0],
    ],
    false,
  );
  base.poly(
    [
      [-0.04, 0.45, 0],
      [0.18, 0.45, 0],
      [0.18, 0.3, 0],
      [0.34, 0.3, 0],
    ],
    false,
  );
  base.poly(
    [
      [-0.04, 0.1, 0],
      [0.24, 0.1, 0],
      [0.24, 0.02, 0],
      [0.34, 0.02, 0],
    ],
    false,
  );
  base.poly(
    [
      [0.46, -0.36, 0.3],
      [0.7, -0.36, 0.3],
      [0.7, -0.2, 0.0],
    ],
    false,
  );

  return { base: base.build(), accent: accent.build() };
};

/* ------------------------------------------------------------------ D: ENIAC */
export const eniac = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // U-shaped arrangement of function cabinets.
  const cab = (x0: number, x1: number, z0: number, z1: number) => {
    base.box(x0, -0.75, z0, x1, 0.82, z1);
  };
  cab(-0.88, -0.3, -0.84, -0.64); // back left
  cab(-0.28, 0.28, -0.84, -0.64); // back centre
  cab(0.3, 0.88, -0.84, -0.64); // back right
  cab(-0.9, -0.74, -0.56, 0.1); // left wing
  cab(0.74, 0.9, -0.56, 0.1); // right wing
  // Panel details on the back wall front face.
  for (const [x0, x1] of [
    [-0.88, -0.3],
    [-0.28, 0.28],
    [0.3, 0.88],
  ] as const) {
    for (let k = 1; k < 5; k++) {
      const y = -0.75 + (k * 1.57) / 5;
      base.seg(x0, y, -0.64, x1, y, -0.64);
    }
    const knobs = 4;
    for (let kx = 0; kx < knobs; kx++) {
      const cx = x0 + ((kx + 0.5) * (x1 - x0)) / knobs;
      for (const cy of [0.62, 0.18, -0.26]) base.circle("xy", cx, cy, 0.03, -0.64, 8);
    }
  }
  for (const x of [-0.74, 0.74]) {
    for (let k = 1; k < 5; k++) {
      const y = -0.75 + (k * 1.57) / 5;
      base.seg(x, y, -0.56, x, y, 0.1);
    }
  }

  // Two trays of vacuum tubes.
  for (const trayY of [0.1, -0.5]) {
    base.box(-0.6, trayY - 0.04, -0.34, 0.6, trayY, 0.34);
    for (const z of [-0.16, 0.16]) {
      for (let i = 0; i < 8; i++) {
        const x = -0.5 + i * (1.0 / 7);
        accent.capsule("xy", x, trayY, trayY + 0.28, 0.05, z);
        accent.seg(x - 0.025, trayY + 0.04, z, x - 0.025, trayY + 0.2, z); // filament legs
        accent.seg(x + 0.025, trayY + 0.04, z, x + 0.025, trayY + 0.2, z);
        accent.seg(x - 0.025, trayY + 0.2, z, x + 0.025, trayY + 0.2, z);
        base.seg(x - 0.03, trayY, z, x - 0.03, trayY - 0.05, z); // pins
        base.seg(x, trayY, z, x, trayY - 0.05, z);
        base.seg(x + 0.03, trayY, z, x + 0.03, trayY - 0.05, z);
      }
    }
  }

  // Interconnect: trunk cables from the trays to the back cabinets.
  for (const x of [-0.45, 0.0, 0.45]) {
    base.poly(
      [
        [x, 0.1, -0.34],
        [x, 0.1, -0.62],
      ],
      false,
    );
    base.poly(
      [
        [x, -0.5, -0.34],
        [x, -0.5, -0.62],
      ],
      false,
    );
  }

  return { base: base.build(), accent: accent.build() };
};

/* ------------------------------------------------------------------ E: EDVAC */
const andGate = (lb: LineBuilder, x: number, y: number, w = 0.2, h = 0.14, z = 0) => {
  const hh = h / 2;
  const bodyW = w * 0.55;
  lb.poly(
    [
      [x, y + hh, z],
      [x + bodyW, y + hh, z],
    ],
    false,
  );
  lb.arc("xy", x + bodyW, y, hh, Math.PI / 2, -Math.PI / 2, z, 10);
  lb.poly(
    [
      [x + bodyW, y - hh, z],
      [x, y - hh, z],
      [x, y + hh, z],
    ],
    false,
  );
  lb.seg(x - 0.06, y + hh * 0.5, z, x, y + hh * 0.5, z);
  lb.seg(x - 0.06, y - hh * 0.5, z, x, y - hh * 0.5, z);
  lb.seg(x + bodyW + hh, y, z, x + w + 0.06, y, z);
};

const orGate = (lb: LineBuilder, x: number, y: number, w = 0.2, h = 0.14, z = 0) => {
  const hh = h / 2;
  lb.bezier([x, y + hh, z], [x + w * 0.2, y, z], [x, y - hh, z], 8);
  lb.bezier([x, y + hh, z], [x + w * 0.6, y + hh, z], [x + w, y, z], 10);
  lb.bezier([x, y - hh, z], [x + w * 0.6, y - hh, z], [x + w, y, z], 10);
  lb.seg(x - 0.06, y + hh * 0.5, z, x + w * 0.1, y + hh * 0.5, z);
  lb.seg(x - 0.06, y - hh * 0.5, z, x + w * 0.1, y - hh * 0.5, z);
  lb.seg(x + w, y, z, x + w + 0.06, y, z);
};

export const edvac = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // Memory: two mercury delay-line tanks (cylinders along x) with pulses inside.
  for (const y of [0.64, 0.34]) {
    const r = 0.09;
    const x0 = -0.78;
    const x1 = 0.78;
    accent.seg(x0, y + r, 0, x1, y + r, 0);
    accent.seg(x0, y - r, 0, x1, y - r, 0);
    accent.seg(x0, y, r, x1, y, r);
    accent.seg(x0, y, -r, x1, y, -r);
    accent.circle("yz", y, 0, r, x0, 16);
    accent.circle("yz", y, 0, r, x1, 16);
    accent.wave("xy", x0 + 0.04, x1 - 0.04, y, 0.04, 9, 0, 60);
    // transducers at both ends
    accent.box(x0 - 0.09, y - 0.05, -0.05, x0, y + 0.05, 0.05);
    accent.box(x1, y - 0.05, -0.05, x1 + 0.09, y + 0.05, 0.05);
  }

  // Processor logic block with a gate array.
  base.box(-0.86, -0.82, -0.12, 0.02, 0.02, 0.12);
  const gx = [-0.76, -0.5, -0.24];
  const gy = [-0.18, -0.42, -0.66];
  gy.forEach((y, r) => {
    gx.forEach((x, c) => {
      if ((r + c) % 2 === 0) andGate(base, x, y, 0.18, 0.12, 0.12);
      else orGate(base, x, y, 0.18, 0.12, 0.12);
      if (c < gx.length - 1) base.seg(x + 0.24, y, 0.12, gx[c + 1]! - 0.06, y, 0.12);
    });
  });

  // I/O unit with a perforated tape.
  base.box(0.22, -0.82, -0.12, 0.88, -0.2, 0.12);
  base.rect("xy", 0.3, -0.62, 0.8, -0.5, 0.12);
  for (let i = 0; i < 12; i++) {
    const x = 0.33 + i * 0.04;
    base.circle("xy", x, -0.56, 0.008, 0.12, 5);
    if (i % 3 !== 0) base.circle("xy", x, -0.52, 0.008, 0.12, 5);
    if (i % 2 === 0) base.circle("xy", x, -0.6, 0.008, 0.12, 5);
  }
  base.rect("xy", 0.3, -0.42, 0.55, -0.28, 0.12);

  // Data pathways: parallel bus lines with arrowheads.
  for (const dx of [-0.05, 0, 0.05]) {
    const x = -0.45 + dx;
    accent.arrow("xy", x, 0.22, x, 0.04, 0.03);
    accent.arrowHead("xy", x, 0.22, 0, 1, 0.03);
  }
  for (const dx of [-0.04, 0.04]) {
    const x = 0.55 + dx;
    accent.arrow("xy", x, 0.22, x, -0.2, 0.03);
    accent.arrowHead("xy", x, 0.22, 0, 1, 0.03);
  }
  accent.arrow("xy", 0.02, -0.45, 0.22, -0.45, 0.03);
  accent.arrowHead("xy", 0.02, -0.45, -1, 0, 0.03);

  return { base: base.build(), accent: accent.build() };
};

/* ------------------------------------------------------------------ F: von Neumann architecture */
export const vonNeumann = (): MachineGeometry => {
  const base = new LineBuilder();
  const accent = new LineBuilder();

  // CPU enclosure with control unit and ALU.
  accent.box(-0.88, 0.02, -0.07, -0.06, 0.88, 0.07);
  accent.rect("xy", -0.8, 0.1, -0.5, 0.8, 0.07); // control unit
  accent.poly(
    [
      [-0.42, 0.78, 0.07],
      [-0.12, 0.78, 0.07],
      [-0.2, 0.12, 0.07],
      [-0.34, 0.12, 0.07],
    ],
    true,
  ); // ALU
  accent.arrow("xy", -0.5, 0.46, -0.38, 0.46, 0.03, 0.07);
  accent.arrowHead("xy", -0.5, 0.46, -1, 0, 0.03, 0.07);
  // Registers under the ALU outline
  for (let i = 0; i < 3; i++) accent.rect("xy", -0.34 + i * 0.07, 0.2, -0.29 + i * 0.07, 0.32, 0.07);

  // Main memory with addressable cells.
  base.box(0.3, 0.02, -0.07, 0.88, 0.88, 0.07);
  for (let k = 1; k < 8; k++) {
    const y = 0.02 + (k * 0.86) / 8;
    base.seg(0.3, y, 0.07, 0.88, y, 0.07);
  }
  for (let k = 0; k < 8; k++) {
    const y = 0.02 + (k + 0.5) * (0.86 / 8);
    base.seg(0.34, y, 0.07, 0.4, y, 0.07);
  }

  // Input / output unit.
  base.box(-0.3, -0.88, -0.07, 0.3, -0.42, 0.07);
  base.seg(0, -0.88, 0.07, 0, -0.42, 0.07);
  base.arrow("xy", -0.22, -0.8, -0.22, -0.5, 0.03, 0.07);
  base.arrow("xy", 0.22, -0.5, 0.22, -0.8, 0.03, 0.07);

  // Buses between CPU and memory (address, data, control).
  for (const y of [0.66, 0.46, 0.26]) {
    accent.seg(-0.06, y, 0, 0.3, y, 0);
    accent.arrowHead("xy", 0.3, y, 1, 0, 0.035);
    accent.arrowHead("xy", -0.06, y, -1, 0, 0.035);
  }
  // CPU <-> I/O and memory <-> I/O.
  for (const x of [-0.18, -0.1]) {
    base.seg(x, 0.02, 0, x, -0.42, 0);
    base.arrowHead("xy", x, -0.42, 0, -1, 0.035);
    base.arrowHead("xy", x, 0.02, 0, 1, 0.035);
  }
  base.poly(
    [
      [0.5, 0.02, 0],
      [0.5, -0.65, 0],
      [0.3, -0.65, 0],
    ],
    false,
  );
  base.arrowHead("xy", 0.3, -0.65, -1, 0, 0.035);
  base.arrowHead("xy", 0.5, 0.02, 0, 1, 0.035);

  return {
    base: base.build(),
    accent: accent.build(),
    labels: [
      { text: "CPU", position: [-0.47, 0.88, 0.07] },
      { text: "CU", position: [-0.65, 0.45, 0.07] },
      { text: "ALU", position: [-0.27, 0.55, 0.07] },
      { text: "MEMORY", position: [0.59, 0.45, 0.07] },
      { text: "I/O", position: [0, -0.65, 0.07] },
      { text: "BUS", position: [0.12, 0.74, 0] },
    ],
  };
};

export const MACHINE_BUILDERS: ReadonlyArray<() => MachineGeometry> = [
  analyticalEngine,
  turingMachine,
  zuseZ3,
  eniac,
  edvac,
  vonNeumann,
];
