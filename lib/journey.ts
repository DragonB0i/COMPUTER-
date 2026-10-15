import { CASE_PART_COUNT, MILESTONE_COUNT } from "./sceneConstants";

/** Number of concept illustrations around the returning CPU (core, registers, ALU, control unit, ISA). */
export const CPU_TOY_COUNT = 5;
/** Files that appear on the tabletop (game code, textures, audio, game data). */
export const FILE_COUNT = 4;
/** Threads inside the game process. */
export const THREAD_COUNT = 3;

/**
 * Animation state of the software chapter. Every value is 0..1 unless noted and is written by the
 * master timeline; the 3D scene and the overlays only read it.
 */
export interface SoftwareState {
  /** The exploded parts return to one even brightness while the computer is put back together. */
  settle: number;
  /** The reassembled computer turns until its front faces the viewer. */
  turn: number;
  /** The tower flattens into a front panel; its power button appears. */
  face: number;
  /** Brightness of the power button. */
  power: number;
  /** Progress of the binary swarm that carries the story through the power-on. */
  swarm: number;
  /** A short, quiet burst of digits used as a bridge between two scenes. */
  bits: number;
  /** 0 = black wireframe world, 1 = warm light world. */
  light: number;
  /** 0 = tower / panel, 1 = the processor package is back. */
  cpu: number;
  /** Reveal of each concept illustration around the CPU. */
  toy: number[];
  /** Continuous index of the concept in focus (-1 = none). */
  focus: number;
  /** 0 = processor package, 1 = storage drawer. */
  drawer: number;
  /** How far the drawer tray is pulled out. */
  open: number;
  /** The drawer slides to its place under the tabletop. */
  under: number;
  /** The memory stick appears. */
  ram: number;
  /** The memory stick stretches into the tabletop. */
  table: number;
  /** The game tile appears. */
  game: number;
  /** Reveal of each file on the tabletop. */
  file: number[];
  /** Progress of the storage-to-memory transfer lines. */
  load: number;
  /** The game process container. */
  proc: number;
  /** Each thread inside the process. */
  thread: number[];
  /** The CPU descends above the tabletop. */
  cpu2: number;
  /** Draw progress of the execution line. */
  exec: number;
  /** Continuous index of the thread the CPU is executing. */
  execAt: number;
  /** The GPU appears. */
  gpu: number;
  /** Draw progress of the line carrying graphics work to the GPU. */
  gfx: number;
  /** The video memory appears. */
  vram: number;
  /** Final composition: the camera settles and the tags appear. */
  hold: number;
}

export const createSoftware = (): SoftwareState => ({
  settle: 0,
  turn: 0,
  face: 0,
  power: 0,
  swarm: 0,
  bits: 0,
  light: 0,
  cpu: 0,
  toy: Array.from({ length: CPU_TOY_COUNT }, () => 0),
  focus: -1,
  drawer: 0,
  open: 0,
  under: 0,
  ram: 0,
  table: 0,
  game: 0,
  file: Array.from({ length: FILE_COUNT }, () => 0),
  load: 0,
  proc: 0,
  thread: Array.from({ length: THREAD_COUNT }, () => 0),
  cpu2: 0,
  exec: 0,
  execAt: 0,
  gpu: 0,
  gfx: 0,
  vram: 0,
  hold: 0,
});

/**
 * Mutable, frame-rate-critical animation state.
 *
 * GSAP (driven by ScrollTrigger) writes these values; Three.js / React Three Fiber reads them
 * every frame. Nothing here goes through React state, so scrubbing never re-renders.
 */
export interface JourneyState {
  /** True while the pinned stage is on screen; renderers pause otherwise. */
  active: boolean;
  /** 0..1 time-based entrance animation of the opening chip. */
  intro: number;
  /** Master timeline position in timeline units. */
  units: number;
  /** 0 = CPU package, 1 = hollow cube. */
  morph: number;
  /** -1 = cube on the left, 1 = right, 0 = centre (history chapter). */
  cubeSide: number;
  /** Per-machine construction progress (0..1). */
  build: number[];
  /** Per-machine visibility (0..1). */
  vis: number[];
  /** Per-machine highlight of the accent geometry (0..1). */
  hl: number[];
  /** 0 = cube, 1 = desktop tower. */
  caseBuild: number;
  /** 0 = assembled, 1 = exploded view. */
  explode: number;
  /** Continuous index of the case part in focus (-1 = none). */
  partStep: number;
  /** 0..1: the case fades away and the camera moves in on the motherboard. */
  boardFocus: number;
  /** Continuous index of the motherboard component in focus. */
  boardStep: number;
  /** 0..1: motherboard is interactive. */
  boardUi: number;
  /** Intensity of the binary background (0..1). */
  binary: number;
  /** The software chapter. */
  sw: SoftwareState;
}

export const createJourney = (): JourneyState => ({
  active: false,
  intro: 0,
  units: 0,
  morph: 0,
  cubeSide: 0,
  build: Array.from({ length: MILESTONE_COUNT }, () => 0),
  vis: Array.from({ length: MILESTONE_COUNT }, () => 0),
  hl: Array.from({ length: MILESTONE_COUNT }, () => 0),
  caseBuild: 0,
  explode: 0,
  partStep: -1,
  boardFocus: 0,
  boardStep: -1,
  boardUi: 0,
  binary: 0.85,
  sw: createSoftware(),
});

/** Singleton shared by the scroll controller and the 3D scene. */
export const journey: JourneyState = createJourney();

export const resetJourney = (): void => {
  Object.assign(journey, createJourney());
};

export const PART_FOCUS_NONE = -1;
export { CASE_PART_COUNT };
