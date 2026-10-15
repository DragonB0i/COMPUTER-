/** Pre-rendered zero and one sprites, so a background of hundreds of digits costs only drawImage calls. */

export const GLYPH_SIZES = [10, 13, 17, 23] as const;

export type GlyphAtlas = HTMLCanvasElement[][];

/** One canvas per (size, glyph) pair, drawn in a single colour. Index with `atlas[size][glyph]`. */
export const buildGlyphAtlas = (colour: string, dpr: number): GlyphAtlas =>
  GLYPH_SIZES.map((s) =>
    [0, 1].map((g) => {
      const c = document.createElement("canvas");
      const px = Math.ceil(s * 1.3 * dpr);
      c.width = px;
      c.height = px;
      const cx = c.getContext("2d");
      if (cx) {
        cx.fillStyle = colour;
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        cx.font = `500 ${s * dpr}px "JetBrains Mono", ui-monospace, monospace`;
        cx.fillText(String(g), px / 2, px / 2 + dpr * 0.5);
      }
      return c;
    }),
  );

/** Colours of the three atlases: white world, cool highlight and charcoal for the light world. */
export const GLYPH_COLOURS = { white: "#ffffff", cyan: "#8fe9ff", ink: "#1b1a18" } as const;

/**
 * Where the warm background is being revealed from and how far it has spread, in stage pixels.
 * Written by the background every frame, read by the swarm so both agree which digits are on paper.
 */
export const reveal = { x: 0, y: 0, r: -200, feather: 140 };
