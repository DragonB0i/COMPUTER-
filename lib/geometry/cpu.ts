import { buildLines } from "../lineBuilder";

/** Half-extent of the processor package in the hero (matches CPU_DIMS in sceneConstants). */
const HALF = 1.3;

/**
 * Details drawn on the top face of the processor package (y = 0 is the top plane).
 * Shows the heat spreader, the silicon die with a core/cache floorplan, corner
 * notch, silkscreen marks and a ring of tiny surface-mount capacitors.
 */
export const cpuTopDetail = (): Float32Array =>
  buildLines((lb) => {
    // Integrated heat spreader (IHS) and its lip.
    lb.rectChamfer("xz", -1.0, -1.0, 1.0, 1.0, 0.1, 0);
    lb.rectChamfer("xz", -0.93, -0.93, 0.93, 0.93, 0.08, 0);

    // Silicon die visible through the "window": the inner processor surface.
    lb.rect("xz", -0.62, -0.62, 0.62, 0.62, 0);
    // Core floorplan: 4 x 2 cores along the top, shared cache bar, memory controller + graphics below.
    const coreW = 0.27;
    const gap = 0.025;
    for (let i = 0; i < 4; i++) {
      const x0 = -0.58 + i * (coreW + gap);
      lb.rect("xz", x0, -0.58, x0 + coreW, -0.2, 0);
      // little execution-unit hatching inside each core
      lb.seg(x0 + 0.04, -0.52, 0, x0 + coreW - 0.04, -0.52, 0);
      lb.seg(x0 + 0.04, -0.44, 0, x0 + coreW - 0.04, -0.44, 0);
      lb.seg(x0 + 0.04, -0.36, 0, x0 + coreW - 0.04, -0.36, 0);
      lb.seg(x0 + 0.04, -0.28, 0, x0 + coreW - 0.04, -0.28, 0);
    }
    lb.rect("xz", -0.58, -0.16, 0.58, -0.02, 0); // shared cache
    for (let i = 1; i < 9; i++) {
      const x = -0.58 + (i * 1.16) / 9;
      lb.seg(x, -0.16, 0, x, -0.02, 0);
    }
    lb.rect("xz", -0.58, 0.02, -0.02, 0.58, 0); // integrated graphics
    for (let i = 1; i < 4; i++) {
      const z = 0.02 + (i * 0.56) / 4;
      lb.seg(-0.58, z, 0, -0.02, z, 0);
    }
    lb.rect("xz", 0.02, 0.02, 0.58, 0.58, 0); // memory controller / I/O
    lb.rect("xz", 0.1, 0.1, 0.5, 0.5, 0);
    lb.seg(0.1, 0.1, 0, 0.5, 0.5, 0);
    lb.seg(0.5, 0.1, 0, 0.1, 0.5, 0);

    // Orientation notch (triangle) on one corner of the package.
    lb.poly(
      [
        [-HALF + 0.04, 0, HALF - 0.04],
        [-HALF + 0.26, 0, HALF - 0.04],
        [-HALF + 0.04, 0, HALF - 0.26],
      ],
      true,
    );

    // Silkscreen marks outside the IHS.
    for (let i = 0; i < 4; i++) {
      lb.seg(0.55 + i * 0.13, 0, 1.17, 0.6 + i * 0.13, 0, 1.17);
    }

    // Surface-mount capacitors in the margin between IHS and package edge.
    const capSize = 0.07;
    for (let i = 0; i < 9; i++) {
      const t = -0.9 + i * 0.225;
      lb.rect("xz", t - capSize / 2, 1.08, t + capSize / 2, 1.08 + capSize * 0.6, 0);
      lb.rect("xz", t - capSize / 2, -1.08 - capSize * 0.6, t + capSize / 2, -1.08, 0);
      lb.rect("xz", 1.08, t - capSize / 2, 1.08 + capSize * 0.6, t + capSize / 2, 0);
      lb.rect("xz", -1.08 - capSize * 0.6, t - capSize / 2, -1.08, t + capSize / 2, 0);
    }
  });

/**
 * Pin grid under the package. Origin is the underside of the substrate; pins hang
 * down towards -y. Centre block is left clear, like a real pin-grid array.
 */
export const cpuPins = (): Float32Array =>
  buildLines((lb) => {
    const n = 21;
    const pitch = 0.1;
    const start = -((n - 1) / 2) * pitch;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const clearCentre = i >= 7 && i <= 13 && j >= 7 && j <= 13;
        if (clearCentre) continue;
        const x = start + i * pitch;
        const z = start + j * pitch;
        lb.seg(x, 0, z, x, -0.1, z);
      }
    }
  });

/** Corner nodes of the protagonist cube (unit cube, scaled by dims at runtime). */
export const cubeCorners = (): Float32Array => {
  const out: number[] = [];
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) out.push(x, y, z);
  return new Float32Array(out);
};
