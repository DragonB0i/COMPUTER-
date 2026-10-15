"use client";

import { Anchor } from "../models/Anchor";
import { CpuToys } from "../models/software/CpuToys";
import { Desk } from "../models/software/Desk";
import { PowerFace } from "../models/software/PowerFace";
import { Processors } from "../models/software/Processors";
import { Protagonist } from "../models/software/Protagonist";
import { Routes } from "../models/software/Routes";
import { TableItems } from "../models/software/TableItems";

/**
 * The software chapter: the reassembled computer powers on, the processor returns with five ideas
 * around it, becomes a drawer, and the scene builds a desk where a game is loaded, run as a process
 * with threads, and shared between a CPU and a GPU.
 */
export default function SoftwareScene() {
  return (
    <>
      <Anchor id="sw:origin" position={[0, 0, 0]} />
      <PowerFace />
      <Protagonist />
      <CpuToys />
      <Desk />
      <TableItems />
      <Processors />
      <Routes />
    </>
  );
}
