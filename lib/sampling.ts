import { seededRandom } from "./animation";

/** Picks `count` random points along a set of line-segment arrays, weighted by segment length. */
export const sampleSegments = (sources: readonly Float32Array[], count: number, seed = 11): Float32Array => {
  const rnd = seededRandom(seed);
  const segs: number[] = [];
  const cum: number[] = [];
  let total = 0;
  for (const arr of sources) {
    for (let i = 0; i + 5 < arr.length; i += 6) {
      const dx = (arr[i + 3] ?? 0) - (arr[i] ?? 0);
      const dy = (arr[i + 4] ?? 0) - (arr[i + 1] ?? 0);
      const dz = (arr[i + 5] ?? 0) - (arr[i + 2] ?? 0);
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-6) continue;
      segs.push(arr[i] ?? 0, arr[i + 1] ?? 0, arr[i + 2] ?? 0, arr[i + 3] ?? 0, arr[i + 4] ?? 0, arr[i + 5] ?? 0);
      total += len;
      cum.push(total);
    }
  }
  const out = new Float32Array(count * 3);
  if (cum.length === 0) return out;
  for (let n = 0; n < count; n++) {
    const target = rnd() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((cum[mid] ?? 0) < target) lo = mid + 1;
      else hi = mid;
    }
    const s = lo * 6;
    const u = rnd();
    out[n * 3] = (segs[s] ?? 0) + ((segs[s + 3] ?? 0) - (segs[s] ?? 0)) * u;
    out[n * 3 + 1] = (segs[s + 1] ?? 0) + ((segs[s + 4] ?? 0) - (segs[s + 1] ?? 0)) * u;
    out[n * 3 + 2] = (segs[s + 2] ?? 0) + ((segs[s + 5] ?? 0) - (segs[s + 2] ?? 0)) * u;
  }
  return out;
};
