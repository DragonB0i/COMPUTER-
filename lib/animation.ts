/** Small numeric helpers shared by the scroll controller and the 3D scene. */

export const clamp = (v: number, min = 0, max = 1): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Hermite smoothstep between two edges. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Maps `v` from [a, b] to [0, 1], clamped. */
export const range = (a: number, b: number, v: number): number => clamp((v - a) / (b - a));

/**
 * Frame-rate independent exponential smoothing. `lambda` is the responsiveness
 * (higher = snappier). Returns the new value.
 */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Deterministic pseudo random generator (mulberry32) so procedural layouts are stable. */
export const seededRandom = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Smoother (quintic) step used for long camera moves. */
export const smootherstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Triangular weight: 1 at `center`, falling to 0 at ±width. */
export const tri = (x: number, center: number, width: number): number =>
  clamp(1 - Math.abs(x - center) / width);
