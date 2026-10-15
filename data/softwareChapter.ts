import type { SoftwareConcept, SoftwareGroupId, SoftwareLabelInfo } from "@/types/software";

/**
 * The software chapter, in the order the scroll journey reveals it. The panels in the immersive view
 * and the sections of the simple view are both generated from this list.
 */
export const SOFTWARE_CONCEPTS: readonly SoftwareConcept[] = [
  {
    id: "core",
    group: "cpu",
    kicker: "Inside the CPU",
    title: "CPU Core",
    text: "A CPU core is an individual processing unit capable of executing instructions. Multiple cores can perform work in parallel.",
    anchor: "sw:core",
    picture: "A small glowing round core with a ring of segments sits at the centre of the processor.",
  },
  {
    id: "registers",
    group: "cpu",
    kicker: "Inside the CPU",
    title: "Registers",
    text: "Registers are tiny, extremely fast storage locations within the processor that hold values and other information needed for current operations.",
    anchor: "sw:registers",
    picture: "A compact tray holding a short stack of labelled cards, next to the core.",
  },
  {
    id: "alu",
    group: "cpu",
    kicker: "Inside the CPU",
    title: "ALU — Arithmetic Logic Unit",
    text: "The ALU performs arithmetic operations and logical comparisons, such as addition and evaluating whether two values are equal.",
    anchor: "sw:alu",
    picture: "A miniature calculator with the symbols plus, minus and equals floating above it.",
  },
  {
    id: "control",
    group: "cpu",
    kicker: "Inside the CPU",
    title: "Control Unit",
    text: "The Control Unit coordinates instruction execution, helping direct the operations and movement of information through the processor.",
    note: "The worker is only a picture of the idea. Nobody lives inside the chip.",
    anchor: "sw:control",
    picture: "A tiny worker in a hard hat and safety vest points one arm, as if directing traffic.",
  },
  {
    id: "isa",
    group: "cpu",
    kicker: "A specification, not a part",
    title: "ISA — Instruction Set Architecture",
    text: "The ISA defines the machine instructions and architectural behavior that software targets. Examples include x86-64 and ARM64.",
    note: "The book floats beside the chip because it is a rulebook, not a component inside it.",
    anchor: "sw:isa",
    picture: "A closed book hovering beside the processor, separate from the chip itself.",
  },
  {
    id: "storage",
    group: "memory",
    kicker: "Persistent storage",
    title: "SSD / HDD — Persistent Storage",
    text: "Persistent storage retains files when the computer is powered off. The operating system, applications, game assets, and saved files can be stored here.",
    note: "The folders are a picture of files and directories. A filesystem is the logical organisation of data on storage, not a part inside the drive.",
    anchor: "sw:storage",
    picture: "A drawer with a small handle, pulled open to show folders and files.",
  },
  {
    id: "ram",
    group: "memory",
    kicker: "Main memory",
    title: "RAM — Working Memory",
    text: "RAM temporarily holds the program code and data that the computer needs while applications are running. RAM is volatile, so its contents are not retained in the same way as persistent storage when power is lost.",
    note: "The tabletop stands for working space. It is not the shape of a real memory module.",
    anchor: "sw:ram",
    picture: "A memory stick stretches into a flat, empty tabletop while the drawer slides underneath it.",
  },
  {
    id: "app",
    group: "running",
    kicker: "Software",
    title: "Application",
    text: "A game is an application stored on persistent storage. When launched, the operating system helps create the running process and load the code and data the game needs.",
    note: "The icon stands for the application being launched, not for a file sitting in RAM.",
    anchor: "sw:app",
    picture: "A game-controller tile appears on the empty tabletop.",
  },
  {
    id: "loading",
    group: "running",
    kicker: "From storage to memory",
    title: "Loading into Memory",
    text: "When a game starts, the operating system establishes its process and makes the required code and data available. Some data is loaded as needed rather than copying every game file into RAM at once.",
    note: "Real systems can map files into memory, load pages on demand and cache data. This animation is a simplification.",
    anchor: "sw:files",
    picture: "Small file symbols travel from the open drawer to the tabletop: game code, textures, audio and game data.",
  },
  {
    id: "process",
    group: "running",
    kicker: "A running program",
    title: "Process",
    text: "A process is a running instance of a program, with its own virtual address space and operating-system-managed resources.",
    note: "The rounded rectangle is a conceptual boundary, not a physical object.",
    anchor: "sw:process",
    picture: "One of the files grows into a rounded rectangle labelled Game Process.",
  },
  {
    id: "threads",
    group: "running",
    kicker: "Inside a process",
    title: "Threads",
    text: "Threads are execution paths within a process. Threads in the same process generally share its virtual address space and process resources, while each thread has its own execution state and stack.",
    note: "Game Thread, Render Submission and Audio Thread are examples of what a game engine might use. They are not a fixed list.",
    anchor: "sw:threads",
    picture: "Three smaller rounded rectangles sit inside the process: Game Thread, Render Submission and Audio Thread.",
  },
  {
    id: "cpu",
    group: "running",
    kicker: "The processor at work",
    title: "CPU — Executes Instructions",
    text: "The operating system schedules runnable threads, and the CPU executes their instructions. A single hardware execution context executes one thread at a time, although multiple cores and hardware threads allow multiple execution contexts to run concurrently.",
    note: "The moving line is a picture of scheduling, not a physical cable.",
    anchor: "sw:cpu",
    picture: "The processor hovers above the tabletop and a pulse travels from it to one thread, then another.",
  },
  {
    id: "gpu",
    group: "graphics",
    kicker: "A second processor",
    title: "GPU — Graphics Processing Unit",
    text: "The GPU is designed to perform highly parallel computations and is especially important for graphics rendering. Modern games use it for substantial graphics work, including shading and ray tracing on supported hardware.",
    note: "The CPU and GPU complement each other. Not every task in a game runs on the GPU.",
    anchor: "sw:gpu",
    picture: "A graphics card appears to the right of the tabletop and a pulse carries graphics work to it from the render thread.",
  },
  {
    id: "vram",
    group: "graphics",
    kicker: "Graphics memory",
    title: "VRAM — Graphics Memory",
    text: "Dedicated GPUs commonly have their own video memory, used for resources such as textures, geometry data, and render-related information.",
    note: "Some integrated GPUs share system memory instead, so not every GPU has separate VRAM.",
    anchor: "sw:vram",
    picture: "A small stack of memory chips beside the graphics card, joined to the card rather than to the tabletop.",
  },
];

export const SOFTWARE_GROUPS: ReadonlyArray<{ id: SoftwareGroupId; title: string; lead: string }> = [
  {
    id: "cpu",
    title: "Inside the processor",
    lead: "Four working parts and one rulebook. Together they explain what it means for a CPU to run a program.",
  },
  {
    id: "memory",
    title: "Storage and memory",
    lead: "Where programs live, and where they work.",
  },
  {
    id: "running",
    title: "A game starts running",
    lead: "From an icon on a drive to a process whose threads receive processor time.",
  },
  {
    id: "graphics",
    title: "The graphics processor",
    lead: "A second kind of processor, with memory of its own.",
  },
];

/** Small tags that sit on the objects of the final tabletop scene. */
export const SOFTWARE_LABELS: readonly SoftwareLabelInfo[] = [
  { id: "ram", anchor: "tag:ram", text: "RAM · working memory", short: "RAM", tone: "primary" },
  { id: "storage", anchor: "tag:storage", text: "Storage · persistent", short: "Storage", tone: "primary" },
  { id: "app", anchor: "tag:app", text: "Game", tone: "quiet" },
  { id: "file-code", anchor: "tag:file-code", text: "game code", tone: "quiet" },
  { id: "file-textures", anchor: "tag:file-textures", text: "textures", tone: "quiet" },
  { id: "file-audio", anchor: "tag:file-audio", text: "audio", tone: "quiet" },
  { id: "file-data", anchor: "tag:file-data", text: "game data", tone: "quiet" },
  { id: "process", anchor: "tag:process", text: "GAME PROCESS", short: "Process", tone: "primary" },
  { id: "thread-game", anchor: "tag:thread-0", text: "Game Thread", short: "Game", tone: "quiet" },
  { id: "thread-render", anchor: "tag:thread-1", text: "Render Submission", short: "Render", tone: "quiet" },
  { id: "thread-audio", anchor: "tag:thread-2", text: "Audio Thread", short: "Audio", tone: "quiet" },
  { id: "cpu", anchor: "tag:cpu", text: "CPU", tone: "primary" },
  { id: "gpu", anchor: "tag:gpu", text: "GPU", tone: "primary" },
  { id: "vram", anchor: "tag:vram", text: "VRAM", tone: "primary" },
  { id: "isa", anchor: "tag:isa", text: "Specification · not a part", short: "Not a part", tone: "quiet" },
];

export const SOFTWARE_CLOSING =
  "You have followed one game from a file on a drive to a process, its threads, and the processors that carry out its work. The operating system sits between all of these, deciding what runs, where it lives and who gets to use what.";

export const SOFTWARE_NEXT: readonly string[] = [
  "How memory is divided into pages, and what a page fault is",
  "How threads cooperate, and what goes wrong when they collide",
  "How a CPU fetches, decodes and executes one instruction",
  "How the graphics pipeline turns triangles into pixels",
];
