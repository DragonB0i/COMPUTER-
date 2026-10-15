import type { Milestone } from "@/types/timeline";

export const MILESTONES: readonly Milestone[] = [
  {
    id: "analytical-engine",
    index: 0,
    date: "1837",
    title: "The Analytical Engine",
    credit: "Charles Babbage",
    cubeSide: "left",
    textSide: "right",
    lead: "A general-purpose mechanical computer, designed a century before electronics could build one.",
    body: [
      "Charles Babbage described the Analytical Engine as a machine that could carry out any calculation it was given instructions for. It separated the “store”, where numbers were kept, from the “mill”, which performed arithmetic, and it read its instructions from punched cards in the style of the Jacquard loom.",
      "Ada Lovelace published the first detailed program for it in 1843. Babbage kept refining the design until his death in 1871, but the machine was never completed in his lifetime.",
    ],
    facts: [
      { label: "Memory", value: "Store, about 1,000 numbers of 40 digits" },
      { label: "Arithmetic", value: "The mill" },
      { label: "Programs", value: "Punched cards" },
    ],
    diagram:
      "A wireframe of brass number wheels on parallel shafts between two frame plates, with a chain of punched cards along the front. The right-hand wheel columns, the mill, are highlighted.",
  },
  {
    id: "turing-machine",
    index: 1,
    date: "1936",
    title: "The Turing machine",
    credit: "Alan Turing",
    cubeSide: "right",
    textSide: "left",
    lead: "Not a physical computer, but a mathematical model that defined what computing means.",
    body: [
      "In “On Computable Numbers” Alan Turing imagined a read/write head moving along an endless tape of cells. At each step the head reads a symbol, writes one, moves left or right, and switches to a new state according to a fixed table of rules.",
      "The model gave mathematicians a precise way to say which problems can be solved by following instructions and which cannot. Every modern computer can be understood as a fast, finite approximation of it.",
    ],
    facts: [
      { label: "Parts", value: "Tape, head, states, rules" },
      { label: "Kind", value: "Theoretical model" },
      { label: "Result", value: "Some problems are uncomputable" },
    ],
    diagram:
      "A row of tape cells holding ones and zeros with a read/write head above the active cell, and below it a state diagram of circles joined by arrows, with the current state highlighted.",
  },
  {
    id: "zuse-z3",
    index: 2,
    date: "1941",
    title: "The Z3",
    credit: "Konrad Zuse",
    cubeSide: "left",
    textSide: "right",
    lead: "An early programmable, automatic digital computer, built from telephone relays.",
    body: [
      "Konrad Zuse completed the Z3 in Berlin in 1941. It worked in binary floating-point arithmetic and ran programs punched onto film stock, switching about two thousand electromechanical relays to do the work.",
      "It was slow, with a clock rate of only a few hertz, and it had no conditional jump. The original was destroyed in a 1943 air raid, but the Z3 showed that a programmable binary machine could be built.",
    ],
    facts: [
      { label: "Switching", value: "About 2,000 relays" },
      { label: "Numbers", value: "22-bit binary floating-point" },
      { label: "Programs", value: "Punched film" },
    ],
    diagram:
      "A cabinet of relay switches, highlighted, beside a film reader with two spools and an operator keyboard with indicator lamps along the front.",
  },
  {
    id: "eniac",
    index: 3,
    date: "1943–1945",
    dateNote: "Publicly unveiled in 1946",
    title: "ENIAC",
    credit: "John Mauchly and J. Presper Eckert",
    cubeSide: "right",
    textSide: "left",
    lead: "One of the first electronic general-purpose computers, thousands of times faster than relay machines.",
    body: [
      "ENIAC was built at the University of Pennsylvania between 1943 and 1945 for the US Army, which needed artillery firing tables. The Army announced it to the public on 14 February 1946, so the machine was working before the world saw it.",
      "It used about 17,000 vacuum tubes and filled a large room. Programming meant rewiring plugboards and setting switches, which could take days, so the next idea was to keep programs in memory instead.",
    ],
    facts: [
      { label: "Switching", value: "About 17,000 vacuum tubes" },
      { label: "Arithmetic", value: "Decimal" },
      { label: "Programming", value: "Plugboards and switches" },
    ],
    diagram:
      "Rows of upright vacuum tubes on two trays, highlighted, in front of a U-shaped arrangement of tall function cabinets with dials and cables.",
  },
  {
    id: "edvac",
    index: 4,
    date: "1944–1949",
    dateNote: "Designed from 1944, delivered in 1949",
    title: "EDVAC",
    credit: "The Moore School team, with John von Neumann",
    cubeSide: "left",
    textSide: "right",
    lead: "A design built around the stored-program idea: instructions and data held in the same memory.",
    body: [
      "EDVAC was designed by the ENIAC team at the Moore School as its successor, using binary numbers and mercury delay-line memory that could hold both instructions and data. It was delivered to the Army’s Ballistic Research Laboratory in 1949 and settled into regular use in the early 1950s.",
      "It was not the first stored-program computer to run. The Manchester Baby did so in 1948 and EDSAC in 1949. EDVAC mattered because its design was written down so clearly that others followed it.",
    ],
    facts: [
      { label: "Memory", value: "Mercury delay lines" },
      { label: "Numbers", value: "Binary" },
      { label: "Idea", value: "Stored program" },
    ],
    diagram:
      "Two long horizontal mercury delay-line tanks with a wave inside, highlighted, above a block of logic gates and an input/output unit with perforated tape, joined by arrows showing data pathways.",
  },
  {
    id: "von-neumann",
    index: 5,
    date: "1945",
    title: "The von Neumann architecture",
    credit: "John von Neumann, “First Draft of a Report on the EDVAC”",
    cubeSide: "center",
    textSide: "both",
    lead: "The stored-program architecture associated with von Neumann’s work became a foundational model for many modern computers, keeping program instructions and data in memory for the processor to access.",
    body: [
      "The 1945 report set out a processor with a control unit and an arithmetic logic unit, one main memory, input and output, and buses between them. It grew out of discussions with Eckert, Mauchly and others, and it is a model rather than a blueprint.",
      "Today’s processors add caches, pipelines, many cores and specialised units, so no single person or machine created every feature of a modern CPU.",
    ],
    facts: [],
    diagram:
      "A simplified computer: a CPU box containing a control unit and an arithmetic logic unit, a main memory box divided into cells, and an input/output unit, linked by address, data and control buses.",
    callouts: [
      {
        side: "left",
        title: "Control unit",
        text: "Fetches each instruction from memory, decodes it and directs the other parts.",
      },
      {
        side: "left",
        title: "Arithmetic logic unit",
        text: "Adds, compares and combines values, with registers for the numbers in use.",
      },
      {
        side: "right",
        title: "Main memory",
        text: "Holds the program and its data in numbered cells, so both are read the same way.",
      },
      {
        side: "right",
        title: "Input/output and buses",
        text: "Move information in and out, and carry addresses, data and control signals.",
      },
    ],
  },
];
