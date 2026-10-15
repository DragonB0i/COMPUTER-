/** Helpers for the routed lines of the software chapter (right-angle paths with a travelling pulse). */

export type P3 = [number, number, number];

export const polyLength = (pts: readonly P3[]): number => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as P3;
    const b = pts[i] as P3;
    len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return len;
};

/** Point at fraction `t` (0..1) of the way along the polyline. */
export const pointAlong = (pts: readonly P3[], t: number, out: P3): P3 => {
  const total = polyLength(pts);
  let want = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as P3;
    const b = pts[i] as P3;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (want <= seg || i === pts.length - 1) {
      const k = seg > 1e-9 ? Math.min(want / seg, 1) : 0;
      out[0] = a[0] + (b[0] - a[0]) * k;
      out[1] = a[1] + (b[1] - a[1]) * k;
      out[2] = a[2] + (b[2] - a[2]) * k;
      return out;
    }
    want -= seg;
  }
  const last = pts[pts.length - 1] as P3;
  out[0] = last[0];
  out[1] = last[1];
  out[2] = last[2];
  return out;
};

/**
 * Writes the first `fraction` of the polyline as line segments into `buffer` (two vertices per
 * segment). Returns the number of vertices written.
 */
export const writePartial = (pts: readonly P3[], fraction: number, buffer: Float32Array): number => {
  const total = polyLength(pts);
  let left = Math.min(Math.max(fraction, 0), 1) * total;
  let n = 0;
  for (let i = 1; i < pts.length && left > 1e-6; i++) {
    const a = pts[i - 1] as P3;
    const b = pts[i] as P3;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const k = seg > 1e-9 ? Math.min(left / seg, 1) : 1;
    buffer[n * 3] = a[0];
    buffer[n * 3 + 1] = a[1];
    buffer[n * 3 + 2] = a[2];
    buffer[n * 3 + 3] = a[0] + (b[0] - a[0]) * k;
    buffer[n * 3 + 4] = a[1] + (b[1] - a[1]) * k;
    buffer[n * 3 + 5] = a[2] + (b[2] - a[2]) * k;
    n += 2;
    left -= seg;
  }
  return n;
};
