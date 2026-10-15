export type CubeSide = "left" | "right" | "center";

export interface MilestoneFact {
  label: string;
  value: string;
}

export interface MilestoneCallout {
  side: "left" | "right";
  title: string;
  text: string;
}

export interface Milestone {
  id: string;
  index: number;
  /** Large date shown beside the title. */
  date: string;
  /** Qualifier under the date (e.g. development vs unveiling). */
  dateNote?: string;
  title: string;
  /** Person / team associated with the machine or idea. */
  credit: string;
  cubeSide: CubeSide;
  textSide: "left" | "right" | "both";
  lead: string;
  body: string[];
  facts: MilestoneFact[];
  /** Plain-language description of the schematic, for assistive technology. */
  diagram: string;
  callouts?: MilestoneCallout[];
}
