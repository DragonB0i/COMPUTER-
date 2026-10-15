export interface HardwareDescription {
  name: string;
  /** What it is. */
  summary: string;
  /** What it does. */
  role: string;
  /** How it connects to the rest of the machine. */
  relation: string;
}

export type CasePartId =
  | "chassis"
  | "case-fan"
  | "cpu-cooler"
  | "psu"
  | "storage"
  | "gpu"
  | "motherboard";

export interface CasePartInfo extends HardwareDescription {
  id: CasePartId;
  /** Which side of the screen the label sits on (desktop). */
  side: "left" | "right";
}

export type BoardComponentId = "cpu" | "ram" | "pcie" | "m2" | "sata" | "chipset" | "power" | "io" | "wifi";

export interface BoardComponentInfo extends HardwareDescription {
  id: BoardComponentId;
  /** Extra accuracy note shown under the description. */
  note?: string;
}
