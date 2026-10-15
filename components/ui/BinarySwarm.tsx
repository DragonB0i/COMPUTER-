"use client";

import { useEffect, useRef } from "react";
import { trackedScreen } from "@/lib/anchors";
import { clamp, lerp, seededRandom, smoothstep } from "@/lib/animation";
import { GLYPH_COLOURS, buildGlyphAtlas, reveal, type GlyphAtlas } from "@/lib/glyphAtlas";
import { journey } from "@/lib/journey";

interface Bit {
  angle: number;
  /** Fraction of the maximum reach this digit settles at. */
  reach: number;
  swirl: number;
  delay: number;
  depth: number;
  size: number;
  glyph: 0 | 1;
  phase: number;
  speed: number;
}

const TAU = Math.PI * 2;

/**
 * The binary swarm that carries the story through the power-on, and the quiet burst of digits that
 * bridges the processor and the storage drawer. It lives above the 3D canvas so the digits can pass in
 * front of the computer. Everything is a pure function of the journey state, so scrolling back plays it
 * in reverse.
 */
export function BinarySwarm() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const rnd = seededRandom(19);
    const small = window.innerWidth < 800;
    const swarm: Bit[] = Array.from({ length: small ? 120 : 280 }, () => {
      const depth = rnd();
      return {
        angle: rnd() * TAU,
        reach: 0.12 + Math.sqrt(rnd()) * 0.95,
        swirl: (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 1.3),
        delay: rnd() * 0.38,
        depth,
        size: depth < 0.35 ? 1 : depth < 0.75 ? 2 : 3,
        glyph: rnd() < 0.5 ? 0 : 1,
        phase: rnd() * TAU,
        speed: 0.5 + rnd(),
      };
    });
    const bridge: Bit[] = Array.from({ length: small ? 36 : 80 }, () => {
      const depth = rnd();
      return {
        angle: rnd() * TAU,
        reach: 0.25 + Math.sqrt(rnd()) * 0.75,
        swirl: (rnd() - 0.5) * 1.2,
        delay: rnd(),
        depth,
        size: depth < 0.5 ? 0 : 1,
        glyph: rnd() < 0.5 ? 0 : 1,
        phase: rnd() * TAU,
        speed: 0.4 + rnd() * 0.8,
      };
    });

    let dpr = 1;
    let w = 0;
    let h = 0;
    let raf = 0;
    let atlas: { white: GlyphAtlas; ink: GlyphAtlas } | null = null;
    let wasDrawing = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildAtlases = () => {
      atlas = { white: buildGlyphAtlas(GLYPH_COLOURS.white, dpr), ink: buildGlyphAtlas(GLYPH_COLOURS.ink, dpr) };
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      buildAtlases();
    };
    resize();
    window.addEventListener("resize", resize);
    void document.fonts?.load('500 14px "JetBrains Mono"').then(buildAtlases);

    const sprite = (onPaper: boolean, size: number, glyph: 0 | 1): HTMLCanvasElement | undefined =>
      (onPaper ? atlas?.ink : atlas?.white)?.[size]?.[glyph];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!journey.active || document.hidden || !atlas) return;
      const s = journey.sw.swarm;
      const b = journey.sw.bits;
      const swarming = s > 0.002 && s < 0.998;
      const bridging = b > 0.01;
      if (!swarming && !bridging) {
        if (wasDrawing) ctx.clearRect(0, 0, el.width, el.height);
        wasDrawing = false;
        return;
      }
      wasDrawing = true;
      ctx.clearRect(0, 0, el.width, el.height);
      const t = reduced ? 0 : now / 1000;
      const inkR = reveal.r + reveal.feather * 0.5;
      const onPaperAt = (x: number, y: number) => journey.sw.light > 0.0005 && Math.hypot(x - reveal.x, y - reveal.y) < inkR;

      if (swarming) {
        const p = trackedScreen["sw:power"];
        const cx = p?.ok ? p.x : w / 2;
        const cy = p?.ok ? p.y : h / 2;
        const reach = Math.hypot(w, h) * 0.62;
        const out = 1 - smoothstep(0.72, 1, s);
        for (const d of swarm) {
          const si = clamp((s - d.delay) / (1 - d.delay));
          if (si <= 0) continue;
          const e = si * si * (3 - 2 * si);
          const r = e * d.reach * reach;
          // Digits leave the button in a spiral that unwinds as they spread.
          const ang = d.angle + (1 - e) * d.swirl + Math.sin(t * 0.4 * d.speed + d.phase) * 0.05;
          const wob = Math.sin(t * 0.9 * d.speed + d.phase) * 6 * d.depth;
          const x = cx + Math.cos(ang) * r + wob;
          const y = cy + Math.sin(ang) * r * 0.86 - Math.cos(t * 0.7 + d.phase) * 5 * d.depth;
          const a = smoothstep(0, 0.22, si) * out * (0.32 + 0.6 * d.depth);
          if (a < 0.015) continue;
          const sp = sprite(onPaperAt(x, y), d.size, d.glyph);
          if (!sp) continue;
          // Nearer digits grow as the swarm opens up, so the camera seems to pass through them.
          const k = lerp(0.7, 0.7 + 1.1 * d.depth, e);
          const sw = sp.width * k;
          const sh = sp.height * k;
          ctx.globalAlpha = a;
          ctx.drawImage(sp, x * dpr - sw / 2, y * dpr - sh / 2, sw, sh);
        }
      }

      if (bridging) {
        const o = trackedScreen["sw:origin"];
        const cx = o?.ok ? o.x : w / 2;
        const cy = o?.ok ? o.y : h / 2;
        const radius = Math.min(w, h) * (w < 800 ? 0.3 : 0.34);
        for (const d of bridge) {
          const life = (t * 0.22 * d.speed + d.delay) % 1;
          const env = Math.sin(life * Math.PI);
          const r = (0.35 + d.reach * 0.75) * radius * (0.85 + 0.3 * life);
          const ang = d.angle + life * d.swirl;
          const x = cx + Math.cos(ang) * r * 1.35;
          const y = cy + Math.sin(ang) * r * 0.8 - life * 26;
          const a = b * env * env * (0.3 + 0.45 * d.depth);
          if (a < 0.015) continue;
          const sp = sprite(onPaperAt(x, y), d.size, d.glyph);
          if (!sp) continue;
          ctx.globalAlpha = a;
          ctx.drawImage(sp, x * dpr - sp.width / 2, y * dpr - sp.height / 2);
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="stage__swarm" aria-hidden="true" />;
}
