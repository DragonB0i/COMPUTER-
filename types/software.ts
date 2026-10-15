export type SoftwareConceptId =
  | "core"
  | "registers"
  | "alu"
  | "control"
  | "isa"
  | "storage"
  | "ram"
  | "app"
  | "loading"
  | "process"
  | "threads"
  | "cpu"
  | "gpu"
  | "vram";

/** Which part of the story a concept belongs to; used to group the simple view. */
export type SoftwareGroupId = "cpu" | "memory" | "running" | "graphics";

export interface SoftwareConcept {
  id: SoftwareConceptId;
  group: SoftwareGroupId;
  /** Small category line above the title. */
  kicker: string;
  title: string;
  /** One or two sentences a beginner can follow. */
  text: string;
  /** Optional accuracy note that keeps a metaphor honest. */
  note?: string;
  /** Id of the 3D anchor the connector line points at. */
  anchor: string;
  /** Plain-language description of the picture, for people who cannot see it. */
  picture: string;
}

export interface SoftwareLabelInfo {
  id: string;
  anchor: string;
  text: string;
  /** Shorter wording used on narrow screens. */
  short?: string;
  /** Visual weight of the tag. */
  tone?: "primary" | "quiet";
}
