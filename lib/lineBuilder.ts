/**
 * LineBuilder — accumulates line segments (pairs of vertices) for THREE.LineSegments.
 *
 * This file is intentionally free of three.js imports so the same geometry
 * builders can run in Node (for offline previews) and in the browser.
 */

export type Vec3 = readonly [number, number, number];
export type Plane = "xy" | "xz" | "yz";

export class LineBuilder {
  private readonly v: number[] = [];

  /** Number of vertices (two per segment). */
  get count(): number {
    return this.v.length / 3;
  }

  seg(ax: number, ay: number, az: number, bx: number, by: number, bz: number): this {
    this.v.push(ax, ay, az, bx, by, bz);
    return this;
  }

  segV(a: Vec3, b: Vec3): this {
    return this.seg(a[0], a[1], a[2], b[0], b[1], b[2]);
  }

  /** Open or closed polyline through the given points. */
  poly(points: readonly Vec3[], closed = false): this {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i] as Vec3;
      const b = points[i + 1] as Vec3;
      this.segV(a, b);
    }
    if (closed && points.length > 2) {
      this.segV(points[points.length - 1] as Vec3, points[0] as Vec3);
    }
    return this;
  }

  /** Maps 2D plane coordinates (u, v) plus a constant `w` to a 3D point. */
  static p(plane: Plane, u: number, v: number, w: number): Vec3 {
    if (plane === "xy") return [u, v, w];
    if (plane === "xz") return [u, w, v];
    return [w, u, v];
  }

  rect(plane: Plane, u0: number, v0: number, u1: number, v1: number, w = 0): this {
    const p = LineBuilder.p;
    return this.poly([p(plane, u0, v0, w), p(plane, u1, v0, w), p(plane, u1, v1, w), p(plane, u0, v1, w)], true);
  }

  /** Rectangle with chamfered corners. */
  rectChamfer(plane: Plane, u0: number, v0: number, u1: number, v1: number, c: number, w = 0): this {
    const p = LineBuilder.p;
    return this.poly(
      [
        p(plane, u0 + c, v0, w),
        p(plane, u1 - c, v0, w),
        p(plane, u1, v0 + c, w),
        p(plane, u1, v1 - c, w),
        p(plane, u1 - c, v1, w),
        p(plane, u0 + c, v1, w),
        p(plane, u0, v1 - c, w),
        p(plane, u0, v0 + c, w),
      ],
      true,
    );
  }

  /** Axis-aligned box (12 edges). */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): this {
    this.poly(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
      true,
    );
    this.poly(
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      true,
    );
    this.seg(x0, y0, z0, x0, y1, z0);
    this.seg(x1, y0, z0, x1, y1, z0);
    this.seg(x1, y0, z1, x1, y1, z1);
    this.seg(x0, y0, z1, x0, y1, z1);
    return this;
  }

  /** Box from a centre and full dimensions. */
  boxC(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): this {
    return this.box(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2);
  }

  circle(plane: Plane, cu: number, cv: number, r: number, w = 0, n = 24): this {
    const pts: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(LineBuilder.p(plane, cu + Math.cos(a) * r, cv + Math.sin(a) * r, w));
    }
    return this.poly(pts, true);
  }

  /** Partial circle from angle a0 to a1 (radians). */
  arc(plane: Plane, cu: number, cv: number, r: number, a0: number, a1: number, w = 0, n = 16): this {
    const pts: Vec3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(LineBuilder.p(plane, cu + Math.cos(a) * r, cv + Math.sin(a) * r, w));
    }
    return this.poly(pts);
  }

  /** Quadratic bezier polyline. */
  bezier(a: Vec3, c: Vec3, b: Vec3, n = 14): this {
    const pts: Vec3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      pts.push([
        u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
        u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
        u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
      ]);
    }
    return this.poly(pts);
  }

  /** Arrowhead at `tip`, pointing along the (du, dv) direction in `plane`. */
  arrowHead(plane: Plane, tipU: number, tipV: number, dirU: number, dirV: number, size = 0.04, w = 0): this {
    const len = Math.hypot(dirU, dirV) || 1;
    const du = dirU / len;
    const dv = dirV / len;
    const bu = tipU - du * size;
    const bv = tipV - dv * size;
    const nu = -dv * size * 0.55;
    const nv = du * size * 0.55;
    const p = LineBuilder.p;
    return this.poly([p(plane, bu + nu, bv + nv, w), p(plane, tipU, tipV, w), p(plane, bu - nu, bv - nv, w)]);
  }

  /** Straight arrow in a plane. */
  arrow(plane: Plane, u0: number, v0: number, u1: number, v1: number, size = 0.04, w = 0): this {
    const p = LineBuilder.p;
    this.segV(p(plane, u0, v0, w), p(plane, u1, v1, w));
    return this.arrowHead(plane, u1, v1, u1 - u0, v1 - v0, size, w);
  }

  /**
   * Toothed gear outline with a hub and spokes.
   * `plane` is the plane the gear lies in, `w` its offset along the normal.
   */
  gear(plane: Plane, cu: number, cv: number, w: number, r: number, teeth: number, toothH = r * 0.22, spokes = 4): this {
    const pts: Vec3[] = [];
    const p = LineBuilder.p;
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const step = (Math.PI * 2) / teeth;
      const pushPoint = (angle: number, rad: number) =>
        pts.push(p(plane, cu + Math.cos(angle) * rad, cv + Math.sin(angle) * rad, w));
      pushPoint(a0, r);
      pushPoint(a0 + step * 0.18, r + toothH);
      pushPoint(a0 + step * 0.42, r + toothH);
      pushPoint(a0 + step * 0.6, r);
    }
    this.poly(pts, true);
    const hub = r * 0.3;
    this.circle(plane, cu, cv, hub, w, 12);
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2 + Math.PI / 4;
      this.segV(
        p(plane, cu + Math.cos(a) * hub, cv + Math.sin(a) * hub, w),
        p(plane, cu + Math.cos(a) * r * 0.92, cv + Math.sin(a) * r * 0.92, w),
      );
    }
    return this;
  }

  /** Capsule outline (vertical in the plane's v axis), used for vacuum tubes. */
  capsule(plane: Plane, cu: number, vBottom: number, vTop: number, r: number, w = 0): this {
    const p = LineBuilder.p;
    this.segV(p(plane, cu - r, vBottom, w), p(plane, cu - r, vTop - r, w));
    this.segV(p(plane, cu + r, vBottom, w), p(plane, cu + r, vTop - r, w));
    this.arc(plane, cu, vTop - r, r, 0, Math.PI, w, 10);
    this.segV(p(plane, cu - r, vBottom, w), p(plane, cu + r, vBottom, w));
    return this;
  }

  /** Zig-zag (resistor style) between two points in a plane. */
  zigzag(plane: Plane, u0: number, v0: number, u1: number, v1: number, amp = 0.025, n = 6, w = 0): this {
    const dx = u1 - u0;
    const dy = v1 - v0;
    const len = Math.hypot(dx, dy) || 1;
    const nu = -dy / len;
    const nv = dx / len;
    const pts: Vec3[] = [LineBuilder.p(plane, u0, v0, w)];
    for (let i = 1; i < n * 2; i++) {
      const t = i / (n * 2);
      const s = i % 2 === 0 ? -1 : 1;
      pts.push(LineBuilder.p(plane, u0 + dx * t + nu * amp * s, v0 + dy * t + nv * amp * s, w));
    }
    pts.push(LineBuilder.p(plane, u1, v1, w));
    return this.poly(pts);
  }

  /** Sine wave along u. */
  wave(plane: Plane, u0: number, u1: number, v: number, amp: number, cycles: number, w = 0, n = 40): this {
    const pts: Vec3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(LineBuilder.p(plane, u0 + (u1 - u0) * t, v + Math.sin(t * cycles * Math.PI * 2) * amp, w));
    }
    return this.poly(pts);
  }

  /** Append another builder's data, optionally translated. */
  append(other: LineBuilder, dx = 0, dy = 0, dz = 0): this {
    const o = other.v;
    for (let i = 0; i < o.length; i += 3) {
      this.v.push((o[i] as number) + dx, (o[i + 1] as number) + dy, (o[i + 2] as number) + dz);
    }
    return this;
  }

  build(): Float32Array {
    return new Float32Array(this.v);
  }
}

/** Convenience for building a Float32Array in one expression. */
export const buildLines = (fn: (lb: LineBuilder) => void): Float32Array => {
  const lb = new LineBuilder();
  fn(lb);
  return lb.build();
};
