/**
 * Procedural geometry for the software chapter: the miniature CPU concepts, the storage drawer, the
 * memory tabletop, files, the game tile, the graphics card and its memory.
 *
 * Every builder returns filled faces plus outline lines in object-local space: y is up, the object
 * sits on y = 0, and flat icons lie in the xz plane unless noted. No three.js imports.
 */

import { LineBuilder } from "../lineBuilder";
import {
  MeshBuilder,
  PAL,
  circlePts,
  dashed,
  hex,
  mixRgb,
  outlineXY,
  outlineXZ,
  roundRectPts,
  shade,
  type Pt2,
  type RGB,
  type SolidPart,
} from "./solids";
import { DRAWER_DIMS, TABLE_DIMS } from "../sceneConstants";
import { fanLines } from "./pc";

const C = {
  sky: hex(PAL.sky),
  mint: hex(PAL.mint),
  peach: hex(PAL.peach),
  butter: hex(PAL.butter),
  lilac: hex(PAL.lilac),
  rose: hex(PAL.rose),
  paper: hex(PAL.paper),
  sand: hex(PAL.sand),
  ink: hex(PAL.ink),
  graphite: hex(PAL.graphite),
  glow: hex(PAL.glow),
};

const part = (mb: MeshBuilder, lines: number[] | Float32Array, soft: number[] | Float32Array = []): SolidPart => ({
  fill: mb.build(),
  lines: lines instanceof Float32Array ? lines : new Float32Array(lines),
  soft: soft instanceof Float32Array ? soft : new Float32Array(soft),
});

const sector = (r0: number, r1: number, a0: number, a1: number, n = 5): Pt2[] => {
  const pts: Pt2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([Math.cos(a) * r1, Math.sin(a) * r1]);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([Math.cos(a) * r0, Math.sin(a) * r0]);
  }
  return pts;
};

/* ============================================================================================
   CPU concepts
   ============================================================================================ */

export interface CoreParts {
  base: SolidPart;
  /** Segmented ring that turns slowly. */
  ring: SolidPart;
  /** Glowing centre that pulses. */
  heart: SolidPart;
}

/** A small, arc-reactor-inspired core: a puck, a ring of segments and a glowing centre. */
export const coreParts = (): CoreParts => {
  const R = 0.3;
  const H = 0.1;
  const baseMesh = new MeshBuilder().cylinder(0, 0, 0, R, H, C.sky, 28);
  const bl = new LineBuilder();
  bl.circle("xz", 0, 0, R, 0, 28);
  bl.circle("xz", 0, 0, R, H, 28);
  bl.circle("xz", 0, 0, R * 0.88, H, 28);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    bl.seg(Math.cos(a) * R, 0, Math.sin(a) * R, Math.cos(a) * R, H, Math.sin(a) * R);
  }

  const ringMesh = new MeshBuilder();
  const rl: number[] = [];
  const segs = 8;
  const y = H + 0.012;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2 + 0.06;
    const a1 = a0 + (Math.PI * 2) / segs - 0.14;
    const pts = sector(0.155, 0.245, a0, a1, 4);
    ringMesh.prism(pts, H, y, i % 2 === 0 ? C.butter : C.paper);
    outlineXZ(rl, pts, y);
  }

  const heartMesh = new MeshBuilder().cylinder(0, H, 0, 0.105, 0.035, C.glow, 24);
  const hl = new LineBuilder();
  hl.circle("xz", 0, 0, 0.105, H + 0.035, 24);
  // A small inverted triangle in the middle of the glow.
  hl.poly(
    [
      [0, H + 0.037, 0.06],
      [-0.052, H + 0.037, -0.03],
      [0.052, H + 0.037, -0.03],
    ],
    true,
  );
  return { base: part(baseMesh, bl.build()), ring: part(ringMesh, rl), heart: part(heartMesh, hl.build()) };
};

/** A compact tray holding a short stack of labelled cards. */
export const registersPart = (): SolidPart => {
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const W = 0.66;
  const D = 0.38;
  const wall = 0.03;
  const trayH = 0.1;
  mb.box(-W / 2, 0, -D / 2, W / 2, 0.025, D / 2, C.sand);
  mb.box(-W / 2, 0, -D / 2, -W / 2 + wall, trayH, D / 2, C.sand);
  mb.box(W / 2 - wall, 0, -D / 2, W / 2, trayH, D / 2, C.sand);
  mb.box(-W / 2, 0, -D / 2, W / 2, trayH, -D / 2 + wall, C.sand);
  l.box(-W / 2, 0, -D / 2, W / 2, trayH, D / 2);

  const colors: RGB[] = [C.peach, C.butter, C.mint, C.sky];
  const tops = [0.4, 0.34, 0.28, 0.22];
  const soft: number[] = [];
  for (let i = 0; i < 4; i++) {
    const z = -0.1 + i * 0.07;
    const top = tops[i] as number;
    const x0 = -0.27;
    const x1 = 0.27;
    mb.box(x0, 0.03, z - 0.012, x1, top, z + 0.012, colors[i] as RGB);
    l.box(x0, 0.03, z - 0.012, x1, top, z + 0.012);
    // A tab on the left of each card and two short lines of "text" on its visible band.
    mb.box(x0, top, z - 0.012, x0 + 0.13, top + 0.035, z + 0.012, shade(colors[i] as RGB, 0.92));
    l.box(x0, top, z - 0.012, x0 + 0.13, top + 0.035, z + 0.012);
    soft.push(x0 + 0.06, top - 0.022, z + 0.0125, x1 - 0.12, top - 0.022, z + 0.0125);
    soft.push(x0 + 0.06, top - 0.045, z + 0.0125, x1 - 0.22, top - 0.045, z + 0.0125);
  }
  return part(mb, l.build(), soft);
};

export interface AluParts {
  body: SolidPart;
  plus: SolidPart;
  minus: SolidPart;
  equals: SolidPart;
}

/** A miniature calculator with three floating symbols. */
export const aluParts = (): AluParts => {
  const W = 0.58;
  const D = 0.78;
  const H = 0.09;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  mb.box(-W / 2, 0, -D / 2, W / 2, H, D / 2, C.paper);
  l.box(-W / 2, 0, -D / 2, W / 2, H, D / 2);
  // Display.
  const sy = H + 0.004;
  mb.box(-0.23, H, -0.33, 0.23, sy, -0.15, C.mint);
  l.rect("xz", -0.23, -0.33, 0.23, -0.15, sy);
  soft.push(-0.17, sy, -0.24, 0.1, sy, -0.24);
  // Keypad: 3 columns, 4 rows.
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -0.15 + c * 0.15;
      const z = -0.07 + r * 0.14;
      const eq = r === 3 && c === 2;
      const col = eq ? C.peach : r === 0 ? C.sky : C.sand;
      const pts = roundRectPts(x, z, 0.1, 0.095, 0.025, 3);
      mb.prism(pts, H, H + 0.014, col);
      outlineXZ(soft, pts, H + 0.014);
    }
  }

  const glyph = (draw: (mb: MeshBuilder, l: number[]) => void, col: RGB): SolidPart => {
    const g = new MeshBuilder();
    const gl: number[] = [];
    draw(g, gl);
    void col;
    return part(g, gl);
  };
  const s = 0.11;
  const plusPts: Pt2[] = [
    [-s * 0.3, s],
    [s * 0.3, s],
    [s * 0.3, s * 0.3],
    [s, s * 0.3],
    [s, -s * 0.3],
    [s * 0.3, -s * 0.3],
    [s * 0.3, -s],
    [-s * 0.3, -s],
    [-s * 0.3, -s * 0.3],
    [-s, -s * 0.3],
    [-s, s * 0.3],
    [-s * 0.3, s * 0.3],
  ];
  const plus = glyph((g, gl) => {
    // Concave outline: fill as three rectangles so the cross has no gaps.
    g.fanXY(
      [
        [-s, -s * 0.3],
        [s, -s * 0.3],
        [s, s * 0.3],
        [-s, s * 0.3],
      ],
      0,
      C.butter,
    );
    g.fanXY(
      [
        [-s * 0.3, -s],
        [s * 0.3, -s],
        [s * 0.3, s],
        [-s * 0.3, s],
      ],
      0.002,
      C.butter,
    );
    outlineXY(gl, plusPts, 0.004);
  }, C.butter);
  const minus = glyph((g, gl) => {
    const pts: Pt2[] = [
      [-s, -s * 0.3],
      [s, -s * 0.3],
      [s, s * 0.3],
      [-s, s * 0.3],
    ];
    g.fanXY(pts, 0, C.sky);
    outlineXY(gl, pts, 0.004);
  }, C.sky);
  const equals = glyph((g, gl) => {
    for (const y of [-s * 0.55, s * 0.55]) {
      const pts: Pt2[] = [
        [-s, y - s * 0.22],
        [s, y - s * 0.22],
        [s, y + s * 0.22],
        [-s, y + s * 0.22],
      ];
      g.fanXY(pts, 0, C.rose);
      outlineXY(gl, pts, 0.004);
    }
  }, C.rose);
  return { body: part(mb, l.build(), soft), plus, minus, equals };
};

export interface WorkerParts {
  body: SolidPart;
  /** Pointing arm, modelled around its shoulder pivot at the origin and reaching along +x. */
  arm: SolidPart;
  /** Where the shoulder pivot sits in the body's frame. */
  shoulder: Pt2;
}

/** A small worker in a hard hat and safety vest, drawn flat in the xy plane (feet at the origin). */
export const workerParts = (): WorkerParts => {
  const mb = new MeshBuilder();
  const ln: number[] = [];
  const soft: number[] = [];
  const skin: RGB = hex(0xf2d5bf);
  const pants: RGB = shade(C.sky, 0.66);
  const vest: RGB = hex(0xf3b184);
  const hat: RGB = hex(0xf6d869);

  const poly = (pts: readonly Pt2[], z: number, col: RGB, line = true) => {
    mb.fanXY(pts, z, col, 1);
    if (line) outlineXY(ln, pts, z + 0.0015);
  };
  const rect = (x0: number, y0: number, x1: number, y1: number): Pt2[] => [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  const disc = (cx: number, cy: number, r: number, n = 18): Pt2[] =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
    });

  // Legs and boots.
  poly(rect(-0.115, 0.04, -0.025, 0.25), 0, pants);
  poly(rect(0.025, 0.04, 0.115, 0.25), 0, pants);
  poly(rect(-0.14, 0, -0.02, 0.05), 0.003, C.graphite);
  poly(rect(0.02, 0, 0.14, 0.05), 0.003, C.graphite);
  // Hanging arm (the worker's right, on the viewer's left).
  poly(rect(-0.245, 0.27, -0.17, 0.54), 0.006, C.sky);
  poly(disc(-0.208, 0.255, 0.04), 0.009, skin);
  // Torso in a vest, with two reflective bands.
  poly(
    [
      [-0.175, 0.25],
      [0.175, 0.25],
      [0.155, 0.57],
      [-0.155, 0.57],
    ],
    0.012,
    vest,
  );
  poly(rect(-0.172, 0.325, 0.172, 0.352), 0.016, C.butter);
  poly(rect(-0.165, 0.43, 0.165, 0.457), 0.016, C.butter);
  soft.push(0, 0.25, 0.018, 0, 0.565, 0.018);
  // Neck, head, face.
  poly(rect(-0.035, 0.565, 0.035, 0.62), 0.008, skin);
  poly(disc(0, 0.7, 0.125, 22), 0.02, skin);
  const hatPts: Pt2[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    hatPts.push([Math.cos(a) * 0.145, 0.735 + Math.sin(a) * 0.115]);
  }
  poly(hatPts, 0.026, hat);
  poly(rect(-0.2, 0.722, 0.2, 0.752), 0.03, hat);
  soft.push(0, 0.752, 0.034, 0, 0.848, 0.034);
  for (const x of [-0.05, 0.05]) outlineXY(ln, disc(x, 0.685, 0.012, 8), 0.03);
  const smile: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a0 = Math.PI * 1.15 + (i / 8) * Math.PI * 0.7;
    const a1 = Math.PI * 1.15 + ((i + 1) / 8) * Math.PI * 0.7;
    smile.push(Math.cos(a0) * 0.045, 0.67 + Math.sin(a0) * 0.03, 0.03, Math.cos(a1) * 0.045, 0.67 + Math.sin(a1) * 0.03, 0.03);
  }
  ln.push(...smile);

  // Pointing arm around the shoulder pivot (0.16, 0.52 in the body frame).
  const am = new MeshBuilder();
  const al: number[] = [];
  const armPts: Pt2[] = [
    [0, -0.04],
    [0.27, -0.035],
    [0.27, 0.035],
    [0, 0.04],
  ];
  am.fanXY(armPts, 0, C.sky, 1);
  outlineXY(al, armPts, 0.0015);
  const handPts = disc(0.3, 0, 0.045);
  am.fanXY(handPts, 0.003, skin, 1);
  outlineXY(al, handPts, 0.0045);

  return { body: part(mb, ln, soft), arm: part(am, al), shoulder: [0.16, 0.52] };
};

/** A closed book lying flat, spine on the left: the instruction set as a rulebook. */
export const bookPart = (): SolidPart => {
  const W = 0.66;
  const H = 0.15;
  const D = 0.9;
  const t = 0.028;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  const cover = C.sky;
  mb.box(-W / 2, 0, -D / 2, W / 2, t, D / 2, cover);
  mb.box(-W / 2, H - t, -D / 2, W / 2, H, D / 2, cover);
  mb.box(-W / 2, 0, -D / 2, -W / 2 + 0.04, H, D / 2, shade(cover, 0.9));
  mb.box(-W / 2 + 0.04, t, -D / 2 + 0.022, W / 2 - 0.022, H - t, D / 2 - 0.022, C.paper);
  l.box(-W / 2, 0, -D / 2, W / 2, H, D / 2);
  // Page edges.
  for (let i = 1; i < 5; i++) {
    const y = t + (i * (H - 2 * t)) / 5;
    soft.push(W / 2 - 0.022, y, -D / 2 + 0.03, W / 2 - 0.022, y, D / 2 - 0.03);
    soft.push(-W / 2 + 0.05, y, D / 2 - 0.022, W / 2 - 0.03, y, D / 2 - 0.022);
  }
  // Cover emblem: a plate with lines of "instructions".
  const ey = H + 0.003;
  mb.box(-0.2, H, -0.28, 0.22, ey, 0.1, C.butter);
  l.rect("xz", -0.2, -0.28, 0.22, 0.1, ey);
  for (let i = 0; i < 4; i++) soft.push(-0.15, ey, -0.22 + i * 0.075, 0.1 + (i % 2) * 0.05, ey, -0.22 + i * 0.075);
  // Bookmark ribbon.
  mb.box(0.1, 0.03, D / 2 - 0.01, 0.145, 0.045, D / 2 + 0.13, C.rose);
  l.box(0.1, 0.03, D / 2 - 0.01, 0.145, 0.045, D / 2 + 0.13);
  return part(mb, l.build(), soft);
};

/* ============================================================================================
   Storage drawer
   ============================================================================================ */

export interface DrawerParts {
  /** Front panel and handle: slides out with the tray. */
  front: SolidPart;
  /** The open tray and the files standing in it. */
  tray: SolidPart;
  /** Folders and files in the tray. */
  items: SolidPart;
}

/** Everything of the drawer except its body (the body is the protagonist box, scaled by the rig). */
export const drawerParts = (): DrawerParts => {
  const { x: DX, y: DY, z: DZ } = DRAWER_DIMS;
  const fz = DZ / 2;
  const fm = new MeshBuilder();
  const fl = new LineBuilder();
  const fs: number[] = [];
  // Front panel proud of the body's face, with a reveal line around it.
  const px = DX / 2 - 0.16;
  const py0 = -DY / 2 + 0.13;
  const py1 = DY / 2 - 0.13;
  fm.box(-px, py0, fz + 0.004, px, py1, fz + 0.07, C.paper);
  fl.box(-px, py0, fz + 0.004, px, py1, fz + 0.07);
  fs.push(-px + 0.08, py1 - 0.09, fz + 0.0715, px - 0.08, py1 - 0.09, fz + 0.0715);
  // Pull handle: two posts and a bar.
  for (const x of [-0.24, 0.24]) {
    fm.box(x - 0.02, -0.02, fz + 0.07, x + 0.02, 0.02, fz + 0.14, C.graphite);
    fl.box(x - 0.02, -0.02, fz + 0.07, x + 0.02, 0.02, fz + 0.14);
  }
  fm.box(-0.28, -0.025, fz + 0.14, 0.28, 0.025, fz + 0.18, C.graphite);
  fl.box(-0.28, -0.025, fz + 0.14, 0.28, 0.025, fz + 0.18);

  // The tray behind the panel: floor and three low walls, mostly hidden inside the body until it opens.
  const tm = new MeshBuilder();
  const tl = new LineBuilder();
  const L = 1.45;
  const tx = px - 0.08;
  const yb = py0 + 0.03;
  const yt = py1 - 0.12;
  const z0 = fz - L;
  const z1 = fz;
  const w = 0.035;
  tm.box(-tx, yb, z0, tx, yb + 0.03, z1, C.sand);
  tm.box(-tx, yb, z0, -tx + w, yt, z1, C.sand);
  tm.box(tx - w, yb, z0, tx, yt, z1, C.sand);
  tm.box(-tx, yb, z0, tx, yt, z0 + w, C.sand);
  tl.box(-tx, yb, z0, tx, yt, z1);

  // Folders and files standing in the tray (front part, which is what shows when it is open).
  const im = new MeshBuilder();
  const il = new LineBuilder();
  const isoft: number[] = [];
  const items: Array<{ x: number; z: number; col: RGB; folder: boolean; h: number }> = [
    { x: -0.58, z: fz - 0.3, col: C.butter, folder: true, h: 0.4 },
    { x: -0.05, z: fz - 0.3, col: C.lilac, folder: true, h: 0.4 },
    { x: 0.5, z: fz - 0.3, col: C.sky, folder: false, h: 0.42 },
    { x: -0.5, z: fz - 0.78, col: C.mint, folder: false, h: 0.42 },
    { x: 0.05, z: fz - 0.78, col: C.rose, folder: true, h: 0.4 },
    { x: 0.58, z: fz - 0.78, col: C.butter, folder: false, h: 0.42 },
  ];
  for (const it of items) {
    const x0 = it.x - 0.21;
    const x1 = it.x + 0.21;
    const yBase = yb + 0.03;
    im.box(x0, yBase, it.z - 0.018, x1, yBase + it.h, it.z + 0.018, it.col);
    il.box(x0, yBase, it.z - 0.018, x1, yBase + it.h, it.z + 0.018);
    if (it.folder) {
      // Folder tab.
      im.box(x0, yBase + it.h, it.z - 0.018, x0 + 0.14, yBase + it.h + 0.04, it.z + 0.018, shade(it.col, 0.94));
      il.box(x0, yBase + it.h, it.z - 0.018, x0 + 0.14, yBase + it.h + 0.04, it.z + 0.018);
    } else {
      // Folded corner on a file.
      isoft.push(x1 - 0.09, yBase + it.h, it.z + 0.0195, x1, yBase + it.h - 0.09, it.z + 0.0195);
      isoft.push(x0 + 0.06, yBase + it.h - 0.12, it.z + 0.0195, x1 - 0.12, yBase + it.h - 0.12, it.z + 0.0195);
    }
  }
  return {
    front: part(fm, fl.build(), fs),
    tray: part(tm, tl.build()),
    items: part(im, il.build(), isoft),
  };
};

/* ============================================================================================
   Memory stick and tabletop
   ============================================================================================ */

/** Dimensions of the memory stick before it stretches into the tabletop (lying flat). */
export const RAM_STICK = { x: 2.4, y: 0.07, z: 0.62 } as const;

/** Chips, contacts and notch on the memory stick, in the stick's own frame (top face at y = 0.5 * y). */
export const ramStickDetail = (): SolidPart => {
  const { x, y, z } = RAM_STICK;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const top = y / 2 + 0.002;
  const chip = hex(0x34322f);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const cx = -x / 2 + 0.3 + (i * (x - 0.6)) / (n - 1) + (i >= n / 2 ? 0.1 : -0.1) * 0;
    mb.box(cx - 0.12, y / 2, -0.14, cx + 0.12, y / 2 + 0.018, 0.1, chip);
    l.rect("xz", cx - 0.12, -0.14, cx + 0.12, 0.1, y / 2 + 0.018);
  }
  // Gold contacts along the long front edge.
  const contacts: number[] = [];
  for (let i = 0; i < 28; i++) {
    const cx = -x / 2 + 0.06 + (i * (x - 0.12)) / 27;
    if (Math.abs(cx - 0.35) < 0.05) continue;
    mb.box(cx - 0.018, y / 2, z / 2 - 0.1, cx + 0.018, y / 2 + 0.006, z / 2 - 0.01, C.butter);
    contacts.push(cx, top + 0.004, z / 2 - 0.1, cx, top + 0.004, z / 2 - 0.01);
  }
  // Notch between the contacts.
  l.rect("xz", 0.3, z / 2 - 0.1, 0.4, z / 2 - 0.01, top + 0.004);
  return part(mb, l.build(), contacts);
};

/** Faint border and corner marks on the tabletop's surface (the table itself is a scaled box). */
export const tableSurface = (): Float32Array => {
  const { x, y, z } = TABLE_DIMS;
  const l = new LineBuilder();
  const inset = 0.1;
  const top = y / 2 + 0.002;
  const pts = roundRectPts(0, 0, x - inset * 2, z - inset * 2, 0.08, 4);
  const out: number[] = [];
  outlineXZ(out, pts, top);
  void l;
  return new Float32Array(out);
};

/* ============================================================================================
   Things on the tabletop
   ============================================================================================ */

/** A game tile with a controller on it. Lies on the table (base at y = 0). */
export const gameTile = (): SolidPart => {
  const S = 0.86;
  const H = 0.09;
  const mb = new MeshBuilder();
  const l: number[] = [];
  const soft: number[] = [];
  const pts = roundRectPts(0, 0, S, S, 0.17, 5);
  mb.prism(pts, 0, H, C.lilac);
  outlineXZ(l, pts, 0);
  outlineXZ(l, pts, H);
  for (let i = 0; i < pts.length; i += 6) {
    const p = pts[i] as Pt2;
    l.push(p[0], 0, p[1], p[0], H, p[1]);
  }
  // Controller body: a rounded bar with two grips.
  const y = H + 0.004;
  const body = roundRectPts(0, -0.02, 0.56, 0.24, 0.1, 4);
  mb.fanXZ(body, y, C.paper);
  outlineXZ(l, body, y + 0.001);
  const gripL = roundRectPts(-0.2, 0.12, 0.15, 0.22, 0.06, 3);
  const gripR = roundRectPts(0.2, 0.12, 0.15, 0.22, 0.06, 3);
  mb.fanXZ(gripL, y, C.paper);
  mb.fanXZ(gripR, y, C.paper);
  outlineXZ(l, gripL, y + 0.001);
  outlineXZ(l, gripR, y + 0.001);
  // D-pad on the left, two buttons on the right.
  const dp = 0.032;
  const cross: Pt2[] = [
    [-dp, -dp * 3],
    [dp, -dp * 3],
    [dp, -dp],
    [dp * 3, -dp],
    [dp * 3, dp],
    [dp, dp],
    [dp, dp * 3],
    [-dp, dp * 3],
    [-dp, dp],
    [-dp * 3, dp],
    [-dp * 3, -dp],
    [-dp, -dp],
  ].map(([cx, cz]) => [(cx as number) - 0.17, (cz as number) - 0.02] as const);
  mb.fanXZ(cross.slice(0, 12), y + 0.001, C.graphite);
  outlineXZ(l, cross, y + 0.002);
  for (const [bx, bz, col] of [
    [0.13, -0.06, C.rose],
    [0.2, 0.0, C.mint],
  ] as const) {
    const c = circlePts(bx, bz, 0.034, 12);
    mb.fanXZ(c, y + 0.001, col);
    outlineXZ(l, c, y + 0.002);
  }
  soft.push(-0.05, y + 0.002, -0.06, 0.05, y + 0.002, -0.06);
  return part(mb, l, soft);
};

export type FileKind = "code" | "textures" | "audio" | "data";

/** A flat file or folder icon lying on the table (base at y = 0). */
export const fileIcon = (kind: FileKind): SolidPart => {
  const W = 0.56;
  const D = 0.7;
  const H = 0.045;
  const mb = new MeshBuilder();
  const l: number[] = [];
  const soft: number[] = [];
  const folder = kind === "textures" || kind === "data";
  const col = kind === "code" ? C.sky : kind === "textures" ? C.butter : kind === "audio" ? C.rose : C.lilac;

  if (folder) {
    const body = roundRectPts(0, 0.04, W, D - 0.08, 0.05, 3);
    mb.prism(body, 0, H, col);
    outlineXZ(l, body, H);
    outlineXZ(l, body, 0);
    // Tab.
    const tab = roundRectPts(-W / 2 + 0.14, -D / 2 + 0.03, 0.26, 0.1, 0.03, 3);
    mb.prism(tab, 0, H, shade(col, 0.94));
    outlineXZ(l, tab, H);
  } else {
    const c = 0.14;
    const pts: Pt2[] = [
      [-W / 2, -D / 2],
      [W / 2 - c, -D / 2],
      [W / 2, -D / 2 + c],
      [W / 2, D / 2],
      [-W / 2, D / 2],
    ];
    mb.prism(pts, 0, H, col);
    outlineXZ(l, pts, H);
    outlineXZ(l, pts, 0);
    soft.push(W / 2 - c, H, -D / 2, W / 2 - c, H, -D / 2 + c, W / 2 - c, H, -D / 2 + c, W / 2, H, -D / 2 + c);
  }
  const y = H + 0.002;
  if (kind === "code") {
    // < / >
    l.push(-0.14, y, 0.0, -0.07, y, -0.07, -0.14, y, 0.0, -0.07, y, 0.07);
    l.push(0.14, y, 0.0, 0.07, y, -0.07, 0.14, y, 0.0, 0.07, y, 0.07);
    l.push(0.03, y, -0.09, -0.03, y, 0.09);
    for (let i = 0; i < 2; i++) soft.push(-0.2, y, 0.2 + i * 0.07, 0.15 - i * 0.12, y, 0.2 + i * 0.07);
  } else if (kind === "audio") {
    const pts: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = -0.2 + t * 0.4;
      const amp = Math.sin(t * Math.PI) * 0.1;
      pts.push(x, y, Math.sin(t * Math.PI * 5) * amp);
    }
    for (let i = 0; i < 16; i++) l.push(pts[i * 3] as number, y, pts[i * 3 + 2] as number, pts[i * 3 + 3] as number, y, pts[i * 3 + 5] as number);
    for (let i = 0; i < 2; i++) soft.push(-0.2, y, 0.2 + i * 0.07, 0.15 - i * 0.12, y, 0.2 + i * 0.07);
  } else if (kind === "textures") {
    // A checkerboard swatch.
    for (let r = 0; r < 3; r++) {
      for (let c2 = 0; c2 < 3; c2++) {
        if ((r + c2) % 2 === 0) continue;
        const x = -0.13 + c2 * 0.09;
        const z = -0.1 + r * 0.09;
        mb.box(x, H, z, x + 0.09, H + 0.004, z + 0.09, shade(col, 0.82));
      }
    }
    l.push(-0.13, y + 0.003, -0.1, 0.14, y + 0.003, -0.1, 0.14, y + 0.003, 0.17, -0.13, y + 0.003, 0.17);
    l.push(0.14, y + 0.003, -0.1, 0.14, y + 0.003, 0.17, -0.13, y + 0.003, 0.17, -0.13, y + 0.003, -0.1);
  } else {
    // A small table of data.
    l.push(-0.17, y, -0.08, 0.17, y, -0.08);
    for (let r = 0; r < 3; r++) soft.push(-0.17, y, -0.02 + r * 0.07, 0.17, y, -0.02 + r * 0.07);
    soft.push(0, y, -0.08, 0, y, 0.19);
  }
  return part(mb, l, soft);
};

/* ============================================================================================
   Processors
   ============================================================================================ */

/** Edge length and thickness of the processor package (the same package as the opening chip). */
export const CPU_PKG = { w: 2.6, t: 0.18 } as const;

/** Heat spreader, die, core floorplan and corner notch; `base` is the height of the substrate's top face. */
const addCpuTop = (mb: MeshBuilder, l: LineBuilder, soft: number[], base: number): void => {
  const W = CPU_PKG.w;
  mb.box(-1.0, base, -1.0, 1.0, base + 0.06, 1.0, C.paper);
  l.box(-1.0, base, -1.0, 1.0, base + 0.06, 1.0);
  mb.box(-0.62, base + 0.06, -0.62, 0.62, base + 0.075, 0.62, C.peach);
  l.rect("xz", -0.62, -0.62, 0.62, 0.62, base + 0.075);
  const y = base + 0.076;
  for (let i = 0; i < 4; i++) {
    const x0 = -0.58 + i * 0.295;
    soft.push(x0, y, -0.58, x0 + 0.27, y, -0.58, x0 + 0.27, y, -0.58, x0 + 0.27, y, -0.2);
    soft.push(x0 + 0.27, y, -0.2, x0, y, -0.2, x0, y, -0.2, x0, y, -0.58);
  }
  soft.push(-0.58, y, -0.1, 0.58, y, -0.1, -0.58, y, 0.58, 0.58, y, 0.58);
  // Corner notch.
  l.poly(
    [
      [-W / 2 + 0.04, base + 0.002, W / 2 - 0.04],
      [-W / 2 + 0.26, base + 0.002, W / 2 - 0.04],
      [-W / 2 + 0.04, base + 0.002, W / 2 - 0.26],
    ],
    true,
  );
};

/** The details that sit on top of the substrate: y = 0 is the substrate's upper face. */
export const cpuDetail = (): SolidPart => {
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  addCpuTop(mb, l, soft, 0);
  return part(mb, l.build(), soft);
};

/** The processor as drawn above the tabletop: package, spreader and die (centred, thickness CPU_PKG.t). */
export const miniCpu = (): SolidPart => {
  const W = CPU_PKG.w;
  const T = CPU_PKG.t;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  mb.box(-W / 2, -T / 2, -W / 2, W / 2, T / 2, W / 2, C.sand);
  l.box(-W / 2, -T / 2, -W / 2, W / 2, T / 2, W / 2);
  addCpuTop(mb, l, soft, T / 2);
  return part(mb, l.build(), soft);
};

/** Pin grid hanging below the substrate; y = 0 is the substrate's underside. */
export const cpuPinLines = (): Float32Array => {
  const pins = new LineBuilder();
  const n = 15;
  const pitch = 0.15;
  const start = -((n - 1) / 2) * pitch;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i >= 5 && i <= 9 && j >= 5 && j <= 9) continue;
      pins.seg(start + i * pitch, 0, start + j * pitch, start + i * pitch, -0.1, start + j * pitch);
    }
  }
  return pins.build();
};

export interface GpuParts {
  body: SolidPart;
  /** Fan blades, to be rotated about their own centres (two entries, positioned in the body frame). */
  fanFrames: Float32Array;
  fanRotor: Float32Array;
  fanCenters: ReadonlyArray<readonly [number, number, number]>;
}

export const GPU_DIMS = { x: 1.9, y: 0.3, z: 0.98 } as const;

/** A graphics card lying flat: shroud, two fans, edge connector and display bracket. */
export const gpuParts = (): GpuParts => {
  const { x, y, z } = GPU_DIMS;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  mb.box(-x / 2, -y / 2, -z / 2, x / 2, y / 2, z / 2, C.lilac);
  l.box(-x / 2, -y / 2, -z / 2, x / 2, y / 2, z / 2);
  // Darker shroud plate on top.
  mb.box(-x / 2 + 0.08, y / 2, -z / 2 + 0.07, x / 2 - 0.08, y / 2 + 0.03, z / 2 - 0.07, C.paper);
  l.rect("xz", -x / 2 + 0.08, -z / 2 + 0.07, x / 2 - 0.08, z / 2 - 0.07, y / 2 + 0.03);
  // Fan wells.
  const fanCenters: Array<readonly [number, number, number]> = [
    [-0.45, y / 2 + 0.034, 0],
    [0.45, y / 2 + 0.034, 0],
  ];
  const wells: number[] = [];
  for (const c of fanCenters) {
    const pts = circlePts(c[0], c[2], 0.37, 28);
    mb.fanXZ(pts, c[1] - 0.002, hex(0xe6e0d0));
    outlineXZ(wells, pts, c[1]);
  }
  // Display bracket on the rear (-x side) and gold edge connector on the front (+z side).
  mb.box(-x / 2 - 0.04, -y / 2, -z / 2 + 0.05, -x / 2, y / 2 + 0.2, z / 2 - 0.05, C.graphite);
  l.box(-x / 2 - 0.04, -y / 2, -z / 2 + 0.05, -x / 2, y / 2 + 0.2, z / 2 - 0.05);
  for (let i = 0; i < 20; i++) {
    const px = -0.7 + i * 0.07;
    soft.push(px, -y / 2, z / 2, px, -y / 2 - 0.0, z / 2 + 0.07);
    mb.box(px - 0.012, -y / 2, z / 2, px + 0.012, -y / 2 + 0.002, z / 2 + 0.07, C.butter);
  }
  const outline = l.build();
  const lines = new Float32Array(outline.length + wells.length);
  lines.set(outline, 0);
  lines.set(wells, outline.length);
  return {
    body: part(mb, lines, soft),
    fanFrames: fanLines("xz", 0.78, 0, 7, "frame"),
    fanRotor: fanLines("xz", 0.78, 0, 7, "rotor"),
    fanCenters,
  };
};

export const VRAM_DIMS = { x: 1.0, y: 0.06, z: 0.56 } as const;

/** A small module of video memory: a board with a 2 x 3 grid of chips, distinct from the RAM stick. */
export const vramPart = (): SolidPart => {
  const { x, y, z } = VRAM_DIMS;
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const soft: number[] = [];
  mb.box(-x / 2, 0, -z / 2, x / 2, y, z / 2, C.peach);
  l.box(-x / 2, 0, -z / 2, x / 2, y, z / 2);
  const chip = hex(0x34322f);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const cx = -0.3 + c * 0.3;
      const cz = -0.12 + r * 0.24;
      mb.box(cx - 0.11, y, cz - 0.09, cx + 0.11, y + 0.03, cz + 0.09, chip);
      l.rect("xz", cx - 0.11, cz - 0.09, cx + 0.11, cz + 0.09, y + 0.03);
    }
  }
  for (let i = 0; i < 12; i++) {
    const px = -0.46 + i * 0.084;
    soft.push(px, y + 0.001, z / 2 - 0.03, px, y + 0.001, z / 2);
  }
  return part(mb, l.build(), soft);
};

/** Dashed rectangle used to hint at an object that is conceptual rather than physical. */
export const dashedRing = (r: number, y = 0): Float32Array => {
  const out: number[] = [];
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.55) / n) * Math.PI * 2;
    dashed(out, [Math.cos(a0) * r, y, Math.sin(a0) * r], [Math.cos(a1) * r, y, Math.sin(a1) * r], 1, 0);
  }
  return new Float32Array(out);
};

export { mixRgb };


/* ============================================================================================
   The computer's front face (dark world) and its power button
   ============================================================================================ */

export const FACE = { halfX: 0.71, halfY: 1.26, button: [0, 0.98] as Pt2, buttonR: 0.17 } as const;

/** Front panel details in the xy plane at z = 0: frame, intake slits, ports and an indicator light. */
export const faceFrameLines = (): Float32Array => {
  const { halfX, halfY } = FACE;
  const lb = new LineBuilder();
  lb.rectChamfer("xy", -halfX, -halfY, halfX, halfY, 0.08, 0);
  lb.rectChamfer("xy", -halfX + 0.07, -halfY + 0.07, halfX - 0.07, halfY - 0.07, 0.06, 0);
  // Intake slits.
  for (let i = 0; i < 16; i++) {
    const y = -0.98 + i * 0.087;
    lb.seg(-0.5, y, 0, 0.5, y, 0);
  }
  lb.rect("xy", -0.5, -0.98, 0.5, 0.31, 0);
  // Drive bay and ports.
  lb.rect("xy", -0.5, 0.4, 0.5, 0.52, 0);
  lb.seg(-0.5, 0.46, 0, -0.1, 0.46, 0);
  lb.rect("xy", -0.34, -1.14, -0.22, -1.08, 0);
  lb.rect("xy", -0.18, -1.14, -0.06, -1.08, 0);
  lb.circle("xy", 0.36, -1.11, 0.03, 0, 10);
  return lb.build();
};

/** The round power button: outer ring, inner ring and the power symbol (xy plane at z = 0, centred). */
export const powerButtonLines = (): Float32Array => {
  const lb = new LineBuilder();
  const r = FACE.buttonR;
  lb.circle("xy", 0, 0, r, 0, 40);
  lb.circle("xy", 0, 0, r * 0.74, 0, 36);
  lb.arc("xy", 0, 0, r * 0.4, Math.PI * 0.62, Math.PI * 2.38, 0, 22);
  lb.seg(0, r * 0.06, 0, 0, r * 0.48, 0);
  return lb.build();
};

/** A unit circle in the xy plane, used for the pulse that leaves the power button. */
export const pulseRingLines = (): Float32Array => new LineBuilder().circle("xy", 0, 0, 1, 0, 64).build();

/* ============================================================================================
   Containers and furniture
   ============================================================================================ */

/** A thin rounded slab lying on the table (base at y = 0), used for the process and its threads. */
export const slabPart = (w: number, d: number, h: number, r: number, col: RGB, edge = true): SolidPart => {
  const mb = new MeshBuilder();
  const l: number[] = [];
  const pts = roundRectPts(0, 0, w, d, r, 6);
  mb.prism(pts, 0, h, col);
  if (edge) {
    outlineXZ(l, pts, h);
    outlineXZ(l, pts, 0);
    for (let i = 0; i < pts.length; i += 7) {
      const p = pts[i] as Pt2;
      l.push(p[0], 0, p[1], p[0], h, p[1]);
    }
  }
  return part(mb, l);
};

/** The desk's legs, in the table's local space (the table's upper face is y = 0). */
export const legsPart = (): SolidPart => {
  const mb = new MeshBuilder();
  const l = new LineBuilder();
  const top = -TABLE_DIMS.y;
  const bottom = DESK_FLOOR;
  const w = 0.13;
  for (const [x, z] of [
    [2.55, 1.45],
    [2.55, -1.45],
    [-2.55, -1.45],
  ] as const) {
    mb.box(x - w / 2, bottom, z - w / 2, x + w / 2, top, z + w / 2, C.sand);
    l.box(x - w / 2, bottom, z - w / 2, x + w / 2, top, z + w / 2);
  }
  return part(mb, l.build());
};

/** Height of the floor under the desk, in the table's local space. */
export const DESK_FLOOR = -(TABLE_DIMS.y + DRAWER_DIMS.y);
