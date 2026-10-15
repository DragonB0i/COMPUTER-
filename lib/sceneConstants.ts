/** Shared scene constants: camera, protagonist geometry and the master-timeline schedule. */

export const CAMERA_FOV = 35;
export const TAN_HALF_FOV = Math.tan((CAMERA_FOV * Math.PI) / 360);

/** Half-extent of the processor package in the hero. */
export const CPU_DIMS = { half: 1.3, width: 2.6, thickness: 0.18, ihsHeight: 0.06, ihsHalf: 1.0 } as const;

/** Edge length of the hollow cube. Historical machines are authored inside ±0.9 of it. */
export const CUBE_EDGE = 2;

/** Tower dimensions (matches TOWER in lib/geometry/pc.ts). */
export const TOWER_DIMS = { x: 1.5, y: 2.6, z: 2.4 } as const;

/** Scroll distance (in viewport heights) represented by one unit of master-timeline time. */
export const VH_PER_UNIT = 0.9;

/** Storage drawer (the processor package grows into this box). */
export const DRAWER_DIMS = { x: 2.3, y: 1.05, z: 1.9 } as const;

/** The tabletop: the memory stick stretches into this slab. Its top face is the plane y = 0. */
export const TABLE_DIMS = { x: 5.6, y: 0.16, z: 3.4 } as const;

/**
 * Where everything of the final tabletop scene sits, in the local space of the journey group.
 * Origin: the middle of the tabletop's upper face. +x right, +y up, +z towards the viewer.
 */
export const DESK = {
  /** Drawer centre once it has slid underneath the tabletop. */
  drawer: [-1.55, -0.685, 0.25] as const,
  /** Where the memory stick first appears, hovering above the drawer. */
  stickStart: [0, 1.15, 0.25] as const,
  tile: [-2.0, 0, -1.0] as const,
  /** Centres of the file icons on the table, in the order code, textures, audio, data. */
  files: [
    [-2.05, 0, 0.2],
    [-1.15, 0, 0.2],
    [-2.05, 0, 1.0],
    [-1.15, 0, 1.0],
  ] as const,
  process: { x: 1.1, z: -0.15, w: 2.9, d: 2.1 },
  /** z of each thread bar inside the process, and the bar size. */
  threadZ: [-0.55, 0.0, 0.55] as const,
  thread: { w: 2.45, d: 0.4 },
  cpu: [1.1, 2.2, -0.45] as const,
  cpuScale: 0.62,
  gpu: [4.4, 0.2, -0.2] as const,
  vram: [4.4, 0.01, 1.4] as const,
  /** The mat the graphics card and its memory sit on, apart from the tabletop. */
  gpuPad: [4.4, -0.06, 0.5] as const,
} as const;

/**
 * Where the graphics card, its mat and its memory sit on narrow (portrait) screens: in front of the
 * tabletop instead of beside it, so the whole picture stays tall and compact instead of wide and small.
 */
export const DESK_COMPACT = {
  gpu: [1.65, 0.2, 3.15] as const,
  vram: [1.65, 0.01, 4.75] as const,
  gpuPad: [1.65, -0.06, 3.85] as const,
} as const;


export type ChapterId = "awakening" | "history" | "anatomy" | "motherboard" | "software";

export const MILESTONE_COUNT = 6;
export const CASE_PART_COUNT = 7;
export const BOARD_PART_COUNT = 9;

/**
 * Master timeline schedule, in timeline units. Everything is derived from a cursor so the
 * chapters can never overlap by accident.
 */
const MS_START = 2.0;
const MS_LEN = 1.1;
const CASE_START = MS_START + MS_LEN * MILESTONE_COUNT; // 8.6
const CASE_LEN = 1.1;
const EXPLODE_START = CASE_START + CASE_LEN; // 9.7
const EXPLODE_LEN = 1.2;
const PART_STEP = 0.36;
const PARTS_START = EXPLODE_START + EXPLODE_LEN; // 10.9
const PARTS_END = PARTS_START + PART_STEP * CASE_PART_COUNT;
const BOARD_FOCUS_START = PARTS_END + 0.1;
const BOARD_FOCUS_LEN = 1.0;
const BOARD_STEP = 0.36;
const BOARD_STEPS_START = BOARD_FOCUS_START + BOARD_FOCUS_LEN;
const BOARD_STEPS_END = BOARD_STEPS_START + BOARD_STEP * BOARD_PART_COUNT;
/**
 * The software chapter is authored in "beats" (b) and scaled by SW_SCALE into timeline units, so its
 * pacing can be tuned in one place. Beat 0 is the moment the motherboard explanation has finished.
 */
const SW_START = BOARD_STEPS_END + 0.3;
const SW_SCALE = 0.8;
const sw = (beat: number): number => SW_START + beat * SW_SCALE;

/** Beats at which each of the fourteen concepts takes the stage (see data/softwareChapter.ts). */
export const SW_CONCEPT_BEATS = {
  core: 6.2,
  registers: 7.2,
  alu: 8.2,
  control: 9.2,
  isa: 10.2,
  storage: 12.9,
  ram: 15.0,
  app: 16.4,
  loading: 18.0,
  process: 19.9,
  threads: 21.3,
  cpu: 23.5,
  gpu: 25.9,
  vram: 27.3,
} as const;

/** How long each concept panel stays up, in beats. */
export const SW_PANEL_BEATS: Readonly<Record<keyof typeof SW_CONCEPT_BEATS, number>> = {
  core: 1.0,
  registers: 1.0,
  alu: 1.0,
  control: 1.0,
  isa: 1.15,
  storage: 1.2,
  ram: 1.3,
  app: 1.3,
  loading: 1.7,
  process: 1.3,
  threads: 1.5,
  cpu: 2.1,
  gpu: 1.2,
  vram: 1.3,
};

const SW_END_BEAT = 31.3;
const END = sw(SW_END_BEAT) + 0.4;

/** Converts a software-chapter beat into master-timeline units. */
export const swAt = sw;

const SW_WAYPOINTS: ReadonlyArray<{ id: string; label: string; at: number }> = [
  { id: "sw-rebuilt", label: "The computer, rebuilt", at: sw(3.1) },
  { id: "sw-power", label: "Power on", at: sw(3.9) },
  { id: "sw-chip", label: "The CPU returns", at: sw(6.1) },
  ...(Object.keys(SW_CONCEPT_BEATS) as Array<keyof typeof SW_CONCEPT_BEATS>).map((id) => ({
    id: `sw-${id}`,
    label: id,
    at: sw(SW_CONCEPT_BEATS[id] + 0.7),
  })),
  { id: "sw-hold", label: "The computer at work", at: sw(30.2) },
];

export const TIMING = {
  heroLines: [0, 1.15],
  heroTitle: [0.5, 1.6],
  morph: [1.05, 1.95],
  msStart: MS_START,
  msLen: MS_LEN,
  caseStart: CASE_START,
  caseLen: CASE_LEN,
  explodeStart: EXPLODE_START,
  explodeLen: EXPLODE_LEN,
  partsStart: PARTS_START,
  partStep: PART_STEP,
  partsEnd: PARTS_END,
  boardFocusStart: BOARD_FOCUS_START,
  boardFocusLen: BOARD_FOCUS_LEN,
  boardStepsStart: BOARD_STEPS_START,
  boardStep: BOARD_STEP,
  boardStepsEnd: BOARD_STEPS_END,
  swStart: SW_START,
  swScale: SW_SCALE,
  end: END,
} as const;

export interface ChapterInfo {
  id: ChapterId;
  title: string;
  start: number;
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { id: "awakening", title: "The chip", start: 0 },
  { id: "history", title: "History", start: MS_START },
  { id: "anatomy", title: "Anatomy", start: CASE_START },
  { id: "motherboard", title: "Motherboard", start: BOARD_FOCUS_START },
  { id: "software", title: "Software", start: SW_START },
];

export const chapterAt = (units: number): ChapterId => {
  let current: ChapterId = "awakening";
  for (const c of CHAPTERS) if (units >= c.start - 0.001) current = c.id;
  return current;
};

/** Scroll stops used by the previous / next controls. */
export const WAYPOINTS: ReadonlyArray<{ id: string; label: string; at: number }> = [
  { id: "hero", label: "The chip", at: 0 },
  ...Array.from({ length: MILESTONE_COUNT }, (_, i) => ({
    id: `ms-${i}`,
    label: `Milestone ${i + 1}`,
    at: MS_START + MS_LEN * i + 0.7,
  })),
  { id: "case", label: "Desktop computer", at: CASE_START + CASE_LEN * 0.9 },
  ...Array.from({ length: CASE_PART_COUNT }, (_, i) => ({
    id: `part-${i}`,
    label: `Component ${i + 1}`,
    at: PARTS_START + PART_STEP * i + PART_STEP * 0.5,
  })),
  ...Array.from({ length: BOARD_PART_COUNT }, (_, i) => ({
    id: `board-${i}`,
    label: `Board part ${i + 1}`,
    at: BOARD_STEPS_START + BOARD_STEP * i + BOARD_STEP * 0.5,
  })),
  ...SW_WAYPOINTS,
];
