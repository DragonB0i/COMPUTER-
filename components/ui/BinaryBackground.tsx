"use client";

import { useEffect, useRef } from "react";
import { trackedScreen } from "@/lib/anchors";
import { clamp, lerp, seededRandom, smoothstep } from "@/lib/animation";
import { GLYPH_COLOURS, buildGlyphAtlas, reveal, type GlyphAtlas } from "@/lib/glyphAtlas";
import { journey } from "@/lib/journey";

interface Digit {
  /** Resting position, 0..1 of the stage. */
  x: number;
  y: number;
  glyph: 0 | 1;
  /** 0 = far and faint, 1 = near and bright. */
  depth: number;
  /** Index into the glyph atlas (size). */
  size: number;
  phase: number;
  period: number;
  max: number;
  /** Slow upward drift, in stage heights per second. */
  drift: number;
  twinkler: boolean;
  cyan: boolean;
  /** Time (s) at which the next twinkle starts, and how long it lasts. */
  next: number;
  dur: number;
}

const TAU = Math.PI * 2;

/**
 * A field of zeros and ones drifting through a soft digital wave: three depth layers move at their own
 * pace, a slow bright front sweeps across the field, and a few digits twinkle now and then.
 *
 * One 2D canvas, pre-rendered glyph sprites and a few hundred drawImage calls per frame: no DOM nodes,
 * no React re-renders. The same loop paints the warm paper that replaces the black when the computer
 * powers on, and the digits inside that paper are drawn in charcoal.
 */
export function BinaryBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const paper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const pap = paper.current;
    const ctx = el?.getContext("2d");
    if (!el || !pap || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rnd = seededRandom(5);
    let digits: Digit[] = [];
    let dpr = 1;
    let w = 0;
    let h = 0;
    let raf = 0;
    let atlas: { white: GlyphAtlas; cyan: GlyphAtlas; ink: GlyphAtlas } | null = null;
    let revealCx = 0;
    let revealCy = 0;
    let lastPaper = "";

    const build = () => {
      const area = w * h;
      const count = Math.round(clamp(area / (w < 800 ? 1800 : 2100), 160, 680));
      const aspect = w / Math.max(h, 1);
      const cols = Math.max(4, Math.round(Math.sqrt(count * aspect)));
      const rows = Math.max(4, Math.ceil(count / cols));
      digits = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Stratified: one digit per cell, jittered, so the field is even but never looks like a grid.
          const depth = Math.pow(rnd(), 1.35);
          const twinkler = rnd() < 0.26;
          digits.push({
            x: (c + 0.12 + rnd() * 0.76) / cols,
            y: (r + 0.12 + rnd() * 0.76) / rows,
            glyph: rnd() < 0.5 ? 0 : 1,
            depth,
            size: depth < 0.42 ? 0 : depth < 0.8 ? 1 : depth < 0.96 ? 2 : 3,
            phase: rnd(),
            period: 5 + rnd() * 9,
            max: 0.13 + depth * 0.28 + rnd() * 0.08,
            drift: 0.0012 + depth * 0.0045 + rnd() * 0.002,
            twinkler,
            cyan: twinkler && rnd() < 0.22,
            next: rnd() * 22,
            dur: 0.8 + rnd() * 1.1,
          });
        }
      }
    };

    const buildAtlases = () => {
      atlas = {
        white: buildGlyphAtlas(GLYPH_COLOURS.white, dpr),
        cyan: buildGlyphAtlas(GLYPH_COLOURS.cyan, dpr),
        ink: buildGlyphAtlas(GLYPH_COLOURS.ink, dpr),
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      build();
      buildAtlases();
    };
    resize();
    window.addEventListener("resize", resize);
    void document.fonts?.load('500 14px "JetBrains Mono"').then(buildAtlases);

    /** Moves the paper reveal and the digit colours together so they always agree. */
    const updateReveal = (light: number) => {
      if (light <= 0.0005) {
        // Until the reveal starts, follow the power button so the ripple leaves from it.
        const p = trackedScreen["sw:power"];
        revealCx = p?.ok ? p.x : w / 2;
        revealCy = p?.ok ? p.y : h / 2;
      }
      const far = Math.max(
        Math.hypot(revealCx, revealCy),
        Math.hypot(w - revealCx, revealCy),
        Math.hypot(revealCx, h - revealCy),
        Math.hypot(w - revealCx, h - revealCy),
      );
      reveal.x = revealCx;
      reveal.y = revealCy;
      reveal.r = light * (far + reveal.feather) - reveal.feather;
      const css = `${revealCx.toFixed(0)}|${revealCy.toFixed(0)}|${reveal.r.toFixed(0)}|${light > 0.0005 ? 1 : 0}`;
      if (css === lastPaper) return;
      lastPaper = css;
      pap.style.setProperty("--rx", `${revealCx.toFixed(1)}px`);
      pap.style.setProperty("--ry", `${revealCy.toFixed(1)}px`);
      pap.style.setProperty("--rr", `${reveal.r.toFixed(1)}px`);
      pap.style.opacity = light > 0.0005 ? "1" : "0";
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!journey.active || document.hidden || !atlas) return;
      const t = reduced ? 0 : now / 1000;
      const light = journey.sw.light;
      updateReveal(light);

      ctx.clearRect(0, 0, el.width, el.height);
      const intensity = journey.binary;
      if (intensity < 0.008) return;

      const aspect = w / Math.max(h, 1);
      // A slow bright front sweeping diagonally across the field.
      const front = ((t * 0.05) % 1.9) - 0.4;
      const inkRadius = reveal.r + reveal.feather * 0.5;

      for (const d of digits) {
        const wx = Math.sin(d.y * 7 + t * 0.34 + d.phase * TAU) * 0.55 + Math.sin((d.x + d.y) * 4.2 - t * 0.21) * 0.45;
        const wy = Math.cos(d.x * 6 - t * 0.29 + d.phase * 3);
        const amp = 0.4 + d.depth * 0.9;
        const px = d.x + wx * 0.017 * amp;
        const py = (((d.y - t * d.drift + wy * 0.013 * amp) % 1) + 1) % 1;

        const u = px * 0.78 + py * 0.62;
        const band = Math.exp(-((u - front) * (u - front)) / (2 * 0.055 * 0.055));
        const pulse = 0.5 + 0.5 * Math.sin((t / d.period + d.phase) * TAU);
        let a = d.max * (0.5 + 0.5 * pulse * pulse) * (1 + 1.5 * band * (0.4 + 0.6 * d.depth));

        const X = px * w;
        const Y = py * h;
        const onPaper = light > 0.0005 && Math.hypot(X - reveal.x, Y - reveal.y) < inkRadius;
        const set = onPaper ? atlas.ink : d.cyan ? atlas.cyan : atlas.white;

        if (d.twinkler && !reduced) {
          const k = (t - d.next) / d.dur;
          if (k > 1) d.next = t + 7 + rnd() * 26;
          else if (k >= 0) {
            const s = Math.sin(k * Math.PI);
            a += s * s * (0.5 + 0.35 * d.depth);
          }
        }

        // Keep the space behind the title and the chip calm.
        const cd = Math.hypot((px - 0.5) * aspect, py - 0.5);
        a *= lerp(1, lerp(0.55, 1, smoothstep(0.1, 0.52, cd)), 1 - light);

        a *= intensity;
        if (a < 0.012) continue;
        const sprite = set[d.size]?.[d.glyph];
        if (!sprite) continue;
        ctx.globalAlpha = Math.min(a, 1);
        ctx.drawImage(sprite, X * dpr - sprite.width / 2, Y * dpr - sprite.height / 2);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div ref={paper} className="stage__paper" aria-hidden="true" />
      <canvas ref={canvas} className="stage__binary" aria-hidden="true" />
    </>
  );
}
