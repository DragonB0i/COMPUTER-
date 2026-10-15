/**
 * Solid (filled) geometry for the light chapter. Like lineBuilder.ts this file has no three.js
 * imports, so every builder can be exercised in Node.
 *
 * Colours are written as sRGB hex numbers and converted to linear floats when the mesh is built,
 * because three.js treats vertex colours as linear values.
 */

import type { Vec3 } from "../lineBuilder";

export type RGB = readonly [number, number, number];

/** The palette of the light chapter: warm paper, charcoal ink and a handful of restrained pastels. */
export const PAL = {
  ivory: 0xf4efe4,
  paper: 0xfbf9f4,
  sand: 0xe9e0cc,
  ink: 0x1b1a18,
  graphite: 0x3b3935,
  peach: 0xf4c9a6,
  butter: 0xf5e29b,
  mint: 0xc7e5d3,
  sky: 0xc6dcef,
  lilac: 0xd9cdee,
  rose: 0xf1cad0,
  glow: 0xbdeee3,
} as const;

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

export const hex = (h: number): RGB => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

export const shade = (c: RGB, k: number): RGB => [Math.min(c[0] * k, 1), Math.min(c[1] * k, 1), Math.min(c[2] * k, 1)];

/** Blends two colours (sRGB space). */
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Gentle fixed lighting from above and slightly in front, so flat faces read as a solid. */
export const faceShade = (nx: number, ny: number, nz: number): number =>
  Math.min(1, Math.max(0.6, 0.8 + 0.2 * ny + 0.08 * nz - 0.04 * nx));

export type Pt2 = readonly [number, number];

/** Outline of a rounded rectangle centred on (cx, cz), counter-clockwise when seen from +y. */
export const roundRectPts = (cx: number, cz: number, w: number, d: number, r: number, seg = 6): Pt2[] => {
  const hw = w / 2;
  const hd = d / 2;
  const rr = Math.max(0, Math.min(r, hw, hd));
  const pts: Pt2[] = [];
  const corner = (ccx: number, ccz: number, a0: number) => {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([ccx + Math.cos(a) * rr, ccz + Math.sin(a) * rr]);
    }
  };
  // Seen from above with +z towards the viewer: start top-left going round.
  corner(cx + hw - rr, cz + hd - rr, 0);
  corner(cx - hw + rr, cz + hd - rr, Math.PI / 2);
  corner(cx - hw + rr, cz - hd + rr, Math.PI);
  corner(cx + hw - rr, cz - hd + rr, Math.PI * 1.5);
  return pts;
};

export const circlePts = (cx: number, cz: number, r: number, n = 24, a0 = 0): Pt2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r] as const;
  });

export interface MeshData {
  positions: Float32Array;
  colors: Float32Array;
}

/** Accumulates a triangle soup with per-vertex colours. */
export class MeshBuilder {
  private readonly p: number[] = [];
  private readonly c: number[] = [];

  get count(): number {
    return this.p.length / 3;
  }

  tri(a: Vec3, b: Vec3, c: Vec3, col: RGB, k = 1): this {
    const s = shade(col, k);
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) this.c.push(srgbToLinear(s[0]), srgbToLinear(s[1]), srgbToLinear(s[2]));
    return this;
  }

  /** Quad given in order around its edge; shaded by its own normal unless `k` is supplied. */
  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, col: RGB, k?: number): this {
    let s = k;
    if (s === undefined) {
      const ux = b[0] - a[0];
      const uy = b[1] - a[1];
      const uz = b[2] - a[2];
      const vx = d[0] - a[0];
      const vy = d[1] - a[1];
      const vz = d[2] - a[2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      s = faceShade(nx, ny, nz);
    }
    this.tri(a, b, c, col, s);
    this.tri(a, c, d, col, s);
    return this;
  }

  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, col: RGB): this {
    // Counter-clockwise seen from outside.
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, faceShade(0, 1, 0)); // top
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, faceShade(0, -1, 0)); // bottom
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, faceShade(0, 0, 1)); // front
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, faceShade(0, 0, -1)); // back
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, faceShade(1, 0, 0)); // right
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, faceShade(-1, 0, 0)); // left
    return this;
  }

  boxC(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, col: RGB): this {
    return this.box(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, col);
  }

  /** Convex polygon in the xz plane at height y, facing up. */
  fanXZ(pts: readonly Pt2[], y: number, col: RGB, k = faceShade(0, 1, 0)): this {
    let cx = 0;
    let cz = 0;
    for (const [x, z] of pts) {
      cx += x;
      cz += z;
    }
    cx /= pts.length;
    cz /= pts.length;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i] as Pt2;
      const b = pts[(i + 1) % pts.length] as Pt2;
      // Wind so the face normal points +y.
      this.tri([cx, y, cz], [b[0], y, b[1]], [a[0], y, a[1]], col, k);
    }
    return this;
  }

  /** Convex polygon in the xy plane at depth z, facing +z. */
  fanXY(pts: readonly Pt2[], z: number, col: RGB, k = 1): this {
    let cx = 0;
    let cy = 0;
    for (const [x, y] of pts) {
      cx += x;
      cy += y;
    }
    cx /= pts.length;
    cy /= pts.length;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i] as Pt2;
      const b = pts[(i + 1) % pts.length] as Pt2;
      this.tri([cx, cy, z], [a[0], a[1], z], [b[0], b[1], z], col, k);
    }
    return this;
  }

  /** Extruded convex outline (pts in xz, counter-clockwise from above) between y0 and y1. */
  prism(pts: readonly Pt2[], y0: number, y1: number, col: RGB): this {
    this.fanXZ(pts, y1, col);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i] as Pt2;
      const b = pts[(i + 1) % pts.length] as Pt2;
      // Outward normal of the edge a->b for a counter-clockwise outline seen from above.
      const ex = b[0] - a[0];
      const ez = b[1] - a[1];
      const len = Math.hypot(ex, ez) || 1;
      const nx = ez / len;
      const nz = -ex / len;
      this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, faceShade(nx, 0, nz));
    }
    return this;
  }

  cylinder(cx: number, cy: number, cz: number, r: number, h: number, col: RGB, n = 24): this {
    return this.prism(circlePts(cx, cz, r, n), cy, cy + h, col);
  }

  append(other: MeshBuilder, dx = 0, dy = 0, dz = 0): this {
    for (let i = 0; i < other.p.length; i += 3) {
      this.p.push((other.p[i] as number) + dx, (other.p[i + 1] as number) + dy, (other.p[i + 2] as number) + dz);
    }
    for (const v of other.c) this.c.push(v);
    return this;
  }

  build(): MeshData {
    return { positions: new Float32Array(this.p), colors: new Float32Array(this.c) };
  }
}

/** A finished object: filled faces, ink outlines and fainter helper lines. */
export interface SolidPart {
  fill: MeshData;
  lines: Float32Array;
  /** Dimmer detail lines (texture marks, hidden edges). */
  soft?: Float32Array;
}

/** Writes the outline of a closed 2D polygon (xz plane at height y) as line segments. */
export const outlineXZ = (out: number[], pts: readonly Pt2[], y: number): void => {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i] as Pt2;
    const b = pts[(i + 1) % pts.length] as Pt2;
    out.push(a[0], y, a[1], b[0], y, b[1]);
  }
};

/** Writes the outline of a closed 2D polygon (xy plane at depth z) as line segments. */
export const outlineXY = (out: number[], pts: readonly Pt2[], z: number): void => {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i] as Pt2;
    const b = pts[(i + 1) % pts.length] as Pt2;
    out.push(a[0], a[1], z, b[0], b[1], z);
  }
};

/** Dashed line between two points. */
export const dashed = (out: number[], a: Vec3, b: Vec3, dash = 0.08, gap = 0.06): void => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return;
  const step = dash + gap;
  for (let t = 0; t < len; t += step) {
    const t1 = Math.min(t + dash, len);
    out.push(a[0] + (dx * t) / len, a[1] + (dy * t) / len, a[2] + (dz * t) / len);
    out.push(a[0] + (dx * t1) / len, a[1] + (dy * t1) / len, a[2] + (dz * t1) / len);
  }
};

/** Unit box (edges at ±0.5) as a filled mesh, scaled non-uniformly at runtime. */
export const unitBox = (col: RGB): MeshData => new MeshBuilder().box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, col).build();
