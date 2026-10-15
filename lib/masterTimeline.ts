import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MILESTONES } from "@/data/milestones";
import { BOARD_COMPONENT_ORDER } from "./geometry/board";
import { SOFTWARE_CONCEPTS, SOFTWARE_LABELS } from "@/data/softwareChapter";
import { CPU_TOY_COUNT, FILE_COUNT, THREAD_COUNT, journey } from "./journey";
import { setMasterTrigger } from "./scrollApi";
import {
  BOARD_PART_COUNT,
  CASE_PART_COUNT,
  MILESTONE_COUNT,
  SW_CONCEPT_BEATS,
  SW_PANEL_BEATS,
  TIMING,
  VH_PER_UNIT,
  chapterAt,
  swAt,
} from "./sceneConstants";
import { getUi, setUi } from "./uiStore";

/**
 * Builds the one master timeline that drives the whole journey.
 *
 * The timeline is measured in "units" (see TIMING in sceneConstants). A single ScrollTrigger pins
 * the stage and scrubs the timeline, so scrolling forward plays every chapter and scrolling back
 * reverses it. Tweens write into the shared `journey` object (read by Three.js each frame) and into
 * the HTML overlays; nothing here triggers React renders except a handful of discrete UI changes.
 *
 * Must be called inside a `gsap.context` so every tween and trigger is reverted on cleanup.
 */
export function buildMasterTimeline(root: HTMLElement, stage: HTMLElement): void {
  const q = gsap.utils.selector(root);
  const first = (selector: string): HTMLElement | null => (q(selector)[0] as HTMLElement | undefined) ?? null;
  const END = TIMING.end;

  /* ---- elements ---------------------------------------------------------------------------- */
  const hero = first("[data-hero]");
  const heroTitle = first("[data-hero-title]");
  const heroSmall = q("[data-hero-tag], [data-hero-cue]");
  const lines = q("[data-line]");
  const nodes = q("[data-node]");
  const linesSvg = first("[data-connection-lines]");
  const articles = q("[data-ms]") as HTMLElement[];
  const vnLabels = first("[data-vn-labels]");
  const callouts = q("[data-callout]") as HTMLElement[];
  const leaders = q("[data-leader]") as unknown as SVGGElement[];
  const panel = first("[data-board-panel]");
  const boardLeader = first("[data-board-leader]");
  const swPanels = q("[data-sw-panel]") as HTMLElement[];
  const swLeaders = q("[data-sw-leader]") as unknown as SVGGElement[];
  const swTags = q("[data-sw-tag]") as HTMLElement[];
  const vignette = first("[data-vignette]");
  const progress = first("[data-progress]");

  /* ---- initial states ------------------------------------------------------------------------ */
  gsap.set(
    [...articles, ...callouts, ...leaders, vnLabels, panel, boardLeader, ...swPanels, ...swLeaders, ...swTags].filter(
      Boolean,
    ),
    { autoAlpha: 0 },
  );
  // The software chapter owns the software state; capture it once (resetJourney replaces the object).
  const S = journey.sw;

  journey.active = true;
  setUi({ stageActive: true });

  /* ---- time-based entrance (not scrubbed) ------------------------------------------------------- */
  gsap.to(journey, { intro: 1, duration: 2.8, ease: "power2.out", delay: 0.15 });
  if (hero) gsap.fromTo(hero, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, delay: 0.6, ease: "power1.out" });

  /* ---- master timeline ------------------------------------------------------------------------- */
  // Per-machine proxies: GSAP would treat an array target as a list of targets, so the three
  // per-milestone values are tweened on plain objects and copied into `journey` on every update.
  const machines = MILESTONES.map(() => ({ vis: 0, build: 0, hl: 0 }));

  // Same reason for the software chapter's per-item values.
  const toyP = Array.from({ length: CPU_TOY_COUNT }, () => ({ v: 0 }));
  const fileP = Array.from({ length: FILE_COUNT }, () => ({ v: 0 }));
  const threadP = Array.from({ length: THREAD_COUNT }, () => ({ v: 0 }));
  let theme = "";

  const sync = (u: number): void => {
    journey.units = u;
    toyP.forEach((p, i) => (S.toy[i] = p.v));
    fileP.forEach((p, i) => (S.file[i] = p.v));
    threadP.forEach((p, i) => (S.thread[i] = p.v));
    const nextTheme = S.light > 0.5 ? "light" : "dark";
    if (nextTheme !== theme) {
      theme = nextTheme;
      stage.dataset.theme = nextTheme;
    }
    machines.forEach((m, i) => {
      journey.vis[i] = m.vis;
      journey.build[i] = m.build;
      journey.hl[i] = m.hl;
    });
    if (progress) progress.style.transform = `scaleY(${(u / END).toFixed(4)})`;

    const ui = getUi();
    const milestone =
      u >= TIMING.msStart && u < TIMING.caseStart
        ? Math.min(MILESTONE_COUNT - 1, Math.floor((u - TIMING.msStart) / TIMING.msLen))
        : -1;
    const casePart =
      u >= TIMING.partsStart && u < TIMING.partsEnd
        ? Math.min(CASE_PART_COUNT - 1, Math.floor((u - TIMING.partsStart) / TIMING.partStep))
        : -1;
    const boardIdx =
      u >= TIMING.boardStepsStart && u < TIMING.boardStepsEnd
        ? Math.min(BOARD_PART_COUNT - 1, Math.floor((u - TIMING.boardStepsStart) / TIMING.boardStep))
        : -1;
    const phase = Math.max(ui.phase, u > 0.6 ? 1 : 0, u > TIMING.partsStart ? 2 : 0);
    let swStep = -1;
    SOFTWARE_CONCEPTS.forEach((c, i) => {
      const beat = SW_CONCEPT_BEATS[c.id];
      if (u >= swAt(beat) && u < swAt(beat + SW_PANEL_BEATS[c.id])) swStep = i;
    });
    setUi({
      swStep,
      chapter: chapterAt(u),
      milestone,
      casePart,
      boardScroll: boardIdx >= 0 ? (BOARD_COMPONENT_ORDER[boardIdx] ?? null) : null,
      phase,
    });
    // The board explanations are only interactive during their own chapter.
    if (u < TIMING.boardFocusStart + 0.5 || u > TIMING.boardStepsEnd + 0.15) {
      if (ui.boardPinned || ui.boardHover) setUi({ boardPinned: null, boardHover: null });
    }
  };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      // The stage height is stable (small viewport units), so mobile address-bar changes never move the end.
      end: () => `+=${Math.round(stage.offsetHeight * VH_PER_UNIT * END)}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
    onUpdate: () => sync(tl.time()),
  });

  /* ---- 1. The awakening: lines grow out of the chip, the title lights up and gives way --------- */
  tl.to(
    lines,
    { strokeDashoffset: 0, duration: 0.7, ease: "power1.inOut", stagger: { each: 0.025, from: "random" } },
    TIMING.heroLines[0],
  );
  tl.to(nodes, { opacity: 0.9, duration: 0.25, stagger: { each: 0.012 } }, 0.45);
  if (linesSvg) tl.to(linesSvg, { autoAlpha: 0, duration: 0.45 }, 1.5);
  tl.to(heroSmall, { autoAlpha: 0, duration: 0.3 }, 0.05);
  if (heroTitle) {
    tl.fromTo(
      heroTitle,
      { letterSpacing: "0.06em", scale: 1, yPercent: 0, "--lit": 1 },
      { letterSpacing: "0.14em", scale: 1.07, yPercent: -8, "--lit": 1.7, duration: 1.1 },
      TIMING.heroTitle[0],
    );
    tl.to(heroTitle, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, TIMING.heroTitle[0] + 0.5);
  }

  /* ---- 2. The package grows into the hollow cube --------------------------------------------------- */
  tl.to(journey, { morph: 1, duration: TIMING.morph[1] - TIMING.morph[0] }, TIMING.morph[0]);
  tl.to(journey, { binary: 0.85, duration: 1 }, 1.5);

  /* ---- 3. History: the cube alternates sides while each machine is built inside it ------------------ */
  MILESTONES.forEach((m, i) => {
    const s = TIMING.msStart + TIMING.msLen * i;
    const side = m.cubeSide === "left" ? -1 : m.cubeSide === "right" ? 1 : 0;
    const isLast = i === MILESTONE_COUNT - 1;
    const proxy = machines[i]!;

    tl.to(journey, { cubeSide: side, duration: 0.6, ease: "power2.inOut" }, i === 0 ? s - 0.3 : s - 0.25);

    // Construction: the schematic is drawn segment by segment, then its accent geometry lights up.
    tl.to(proxy, { vis: 1, duration: 0.25 }, s);
    tl.to(proxy, { build: 1, duration: 0.6, ease: "power1.inOut" }, s + 0.05);
    tl.to(proxy, { hl: 1, duration: 0.3 }, s + 0.5);
    if (!isLast) {
      // Deconstruct while the next machine is about to appear.
      tl.to(proxy, { build: 0, duration: 0.2, ease: "power1.in" }, s + 0.92);
      tl.to(proxy, { vis: 0, hl: 0, duration: 0.2 }, s + 0.92);
    } else {
      // The architecture diagram stays until the cube turns into the tower.
      tl.to(proxy, { vis: 0, hl: 0, duration: 0.7 }, TIMING.caseStart + 0.1);
    }

    // Text.
    const article = articles[i];
    if (article) {
      const parts = article.querySelectorAll("[data-part]");
      tl.to(article, { autoAlpha: 1, duration: 0.12 }, s + 0.28);
      tl.fromTo(
        parts,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.035, ease: "power2.out" },
        s + 0.28,
      );
      tl.to(article, { autoAlpha: 0, duration: 0.12 }, s + 0.96);
    }

    if (isLast && vnLabels) {
      tl.to(vnLabels, { autoAlpha: 1, duration: 0.2 }, s + 0.45);
      tl.to(vnLabels, { autoAlpha: 0, duration: 0.15 }, TIMING.caseStart);
    }
  });

  /* ---- 4. Enter the computer: the cube becomes a tower, then comes apart --------------------------------- */
  tl.to(journey, { caseBuild: 1, duration: TIMING.caseLen }, TIMING.caseStart);
  tl.to(journey, { explode: 1, duration: TIMING.explodeLen }, TIMING.explodeStart);
  tl.to(journey, { partStep: 0, duration: 0.25 }, TIMING.partsStart - 0.15);
  for (let i = 1; i < CASE_PART_COUNT; i++) {
    tl.to(journey, { partStep: i, duration: 0.14, ease: "power2.inOut" }, TIMING.partsStart + TIMING.partStep * i);
  }
  // One label at a time, only while its part is the one in focus.
  callouts.forEach((el, i) => {
    const t0 = TIMING.partsStart + TIMING.partStep * i;
    const leader = leaders[i];
    const group = leader ? [el, leader] : [el];
    tl.fromTo(el, { y: 16 }, { y: 0, duration: 0.1, ease: "power2.out" }, t0 + 0.03);
    tl.to(group, { autoAlpha: 1, duration: 0.09 }, t0 + 0.03);
    tl.to(group, { autoAlpha: 0, duration: 0.08 }, t0 + TIMING.partStep - 0.08);
  });

  /* ---- 5. The motherboard: the case fades, the camera moves in, parts are explained ------------------------ */
  tl.to(journey, { boardFocus: 1, duration: TIMING.boardFocusLen }, TIMING.boardFocusStart);
  const panelIn = TIMING.boardFocusStart + 0.6;
  const panelOut = TIMING.boardStepsEnd + 0.05;
  tl.to(journey, { boardUi: 1, duration: 0.3 }, panelIn);
  const boardUi = [panel, boardLeader].filter(Boolean);
  tl.to(boardUi, { autoAlpha: 1, duration: 0.3 }, panelIn);
  tl.to(journey, { boardStep: 0, duration: 0.18 }, TIMING.boardStepsStart - 0.1);
  for (let i = 1; i < BOARD_PART_COUNT; i++) {
    tl.to(journey, { boardStep: i, duration: 0.14, ease: "power2.inOut" }, TIMING.boardStepsStart + TIMING.boardStep * i);
  }
  tl.to(journey, { boardStep: BOARD_PART_COUNT + 0.3, duration: 0.2 }, TIMING.boardStepsEnd - 0.1);
  tl.to(journey, { boardUi: 0, duration: 0.2 }, panelOut);
  tl.to(boardUi, { autoAlpha: 0, duration: 0.25 }, panelOut);

  /* ---- 6. The software chapter ------------------------------------------------------------------------ */
  // Authored in beats (see SW_CONCEPT_BEATS); beat 0 is the moment the motherboard explanation ends.
  const at = swAt;
  const len = (beats: number): number => beats * TIMING.swScale;
  const to = (target: object, vars: gsap.TweenVars, beat: number, beats: number, ease = "power2.inOut"): void => {
    tl.to(target, { ...vars, duration: len(beats), ease }, at(beat));
  };

  // 6a. The computer is put back together, turns to face us and flattens into its front panel.
  to(journey, { boardFocus: 0 }, 0, 1.8);
  to(journey, { explode: 0 }, 0.4, 2.0);
  to(S, { settle: 1 }, 0, 2.0, "power1.inOut");
  to(S, { turn: 1 }, 2.0, 1.3);
  to(S, { face: 1 }, 2.6, 1.0);

  // 6b. The power button wakes, brightens and sends out a pulse; digits pour out of it.
  to(S, { power: 0.3 }, 3.3, 0.6, "power1.out");
  to(S, { power: 1 }, 4.0, 1.1, "power1.inOut");
  to(journey, { binary: 1.0 }, 3.7, 1.0, "power1.inOut");
  to(S, { swarm: 1 }, 4.3, 2.1, "none");

  // 6c. The digits carry the story from the black world into the warm one, and remain in the background.
  to(S, { light: 1 }, 5.0, 1.7, "power1.inOut");
  to(journey, { binary: 0.85 }, 5.8, 1.4, "power1.inOut");
  if (vignette) tl.to(vignette, { autoAlpha: 0, duration: len(1.6), ease: "power1.inOut" }, at(5.0));

  // 6d. The processor returns, tilted; its five ideas arrive one by one.
  to(S, { cpu: 1 }, 5.7, 1.0);
  const toyIds = ["core", "registers", "alu", "control", "isa"] as const;
  toyIds.forEach((id, i) => {
    const t0 = SW_CONCEPT_BEATS[id] - 0.2;
    tl.to(toyP[i]!, { v: 1, duration: len(0.6), ease: "power2.out" }, at(t0));
    tl.to(S, { focus: i, duration: len(0.35), ease: "power2.inOut" }, at(SW_CONCEPT_BEATS[id] - 0.1));
  });
  to(S, { focus: -1 }, 11.2, 0.5);

  // 6e. A burst of digits bridges to storage: the processor package turns into a drawer.
  toyP.forEach((p, i) => tl.to(p, { v: 0, duration: len(0.5), ease: "power2.in" }, at(11.35 + i * 0.07)));
  to(S, { bits: 1 }, 11.3, 0.7, "power1.out");
  to(S, { drawer: 1 }, 11.6, 1.3);
  to(S, { bits: 0 }, 12.5, 1.1, "power1.inOut");
  to(S, { open: 1 }, 12.5, 0.9);

  // 6f. A memory stick stretches into the tabletop while the drawer slides underneath it.
  to(S, { ram: 1 }, 14.2, 0.7, "power1.out");
  to(S, { table: 1 }, 15.0, 1.3, "power1.inOut");
  to(S, { under: 1 }, 15.3, 1.0);

  // 6g. A game is launched; its files are made available in memory; one becomes the process.
  to(S, { game: 1 }, 16.2, 0.7);
  fileP.forEach((p, i) => tl.to(p, { v: 1, duration: len(0.55), ease: "power2.out" }, at(17.8 + i * 0.18)));
  to(S, { load: 1 }, 18.2, 1.3, "none");
  to(S, { proc: 1 }, 19.9, 1.0);
  threadP.forEach((p, i) => tl.to(p, { v: 1, duration: len(0.6), ease: "power2.out" }, at(21.3 + i * 0.3)));

  // 6h. The processor comes down above the table and executes one thread, then another.
  to(S, { cpu2: 1 }, 23.0, 1.0);
  to(S, { exec: 1 }, 24.0, 0.8, "power1.inOut");
  to(S, { execAt: 1 }, 24.9, 0.4);
  to(S, { execAt: 2 }, 25.4, 0.4);
  to(S, { execAt: 1 }, 26.0, 0.5);

  // 6i. The graphics processor and its own memory; the final composition settles and is held.
  to(S, { gpu: 1 }, 25.6, 1.0);
  to(S, { gfx: 1 }, 26.5, 0.8, "power1.inOut");
  to(S, { vram: 1 }, 27.2, 0.8);
  to(S, { hold: 1 }, 28.8, 1.4);

  // 6j. Panels and connectors: one concept at a time, sliding in from the right.
  SOFTWARE_CONCEPTS.forEach((c, i) => {
    const panelEl = swPanels[i];
    const leader = swLeaders[i];
    if (!panelEl || !leader) return;
    const start = at(SW_CONCEPT_BEATS[c.id]);
    const end = at(SW_CONCEPT_BEATS[c.id] + SW_PANEL_BEATS[c.id] - 0.15);
    const parts = panelEl.querySelectorAll("[data-sw-part]");
    const line = leader.querySelector("[data-sw-line]");

    tl.fromTo(panelEl, { autoAlpha: 0, x: 44 }, { autoAlpha: 1, x: 0, duration: len(0.45), ease: "power3.out" }, start);
    tl.fromTo(
      parts,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: len(0.32), stagger: len(0.07), ease: "power2.out" },
      start + len(0.12),
    );
    tl.to(leader, { autoAlpha: 1, duration: len(0.1) }, start + len(0.08));
    if (line) tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: len(0.5), ease: "power1.inOut" }, start + len(0.18));
    tl.to([panelEl, leader], { autoAlpha: 0, duration: len(0.15), ease: "power1.in" }, end);
    tl.to(panelEl, { x: -14, duration: len(0.15), ease: "power1.in" }, end);
  });

  // 6k. Tags that name the objects of the final scene appear with them and stay.
  const TAG_AT: Record<string, number> = {
    isa: 10.7,
    storage: 13.5,
    ram: 16.2,
    app: 17.0,
    "file-code": 18.4,
    "file-textures": 18.6,
    "file-audio": 18.8,
    "file-data": 19.0,
    process: 20.9,
    "thread-game": 22.0,
    "thread-render": 22.3,
    "thread-audio": 22.6,
    cpu: 24.0,
    gpu: 26.6,
    vram: 28.0,
  };
  SOFTWARE_LABELS.forEach((l, i) => {
    const el = swTags[i];
    const beat = TAG_AT[l.id];
    if (!el || beat === undefined) return;
    tl.to(el, { autoAlpha: 1, duration: len(0.35), ease: "power1.out" }, at(beat));
    // The ISA tag leaves with the book; the code file's tag leaves when it grows into the process.
    if (l.id === "isa") tl.to(el, { autoAlpha: 0, duration: len(0.3) }, at(11.2));
    if (l.id === "file-code") tl.to(el, { autoAlpha: 0, duration: len(0.3) }, at(19.9));
  });

  // Pads the timeline to exactly END so scroll progress maps linearly onto timeline units.
  tl.to({}, { duration: 0.0001 }, END - 0.0001);

  setMasterTrigger(tl.scrollTrigger ?? null);

  /* ---- Pause rendering while the stage is off screen ---------------------------------------------------------- */
  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      journey.active = self.isActive;
      setUi({ stageActive: self.isActive });
    },
  });
}
