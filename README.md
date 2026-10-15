# COMPUTER

An immersive, scroll-driven journey into computing. A white wireframe cube is the protagonist: it starts as a CPU package, becomes a hollow cube that hosts six historical machines, grows into a desktop tower, comes apart into its components, leaves a motherboard you can inspect, is put back together and powered on, and then carries you into a warm, light software chapter: the processor's inner ideas, a storage drawer, a RAM tabletop, and one game going from files on a drive to a running process with threads, a CPU and a GPU. Scrolling is the only interaction.

Everything is procedural (lines and points generated in code). There are no 3D model files, no backend, no database and no environment variables.

## Commands

Requires Node.js 20.9 or newer.

```bash
npm install        # install dependencies
npm run dev        # development server on http://localhost:3000
npm run lint       # ESLint
npx tsc --noEmit   # strict type check (also available as `npm run typecheck`)
npm run build      # production build
npm start          # serve the production build
```

## Deploying to Vercel

The project is a standard Next.js App Router app that prerenders to static output, so no configuration is needed.

1. Push the project to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel choose **Add New → Project** and import the repository.
3. Leave the framework preset on **Next.js**. Build command `next build`, install command `npm install`. No environment variables.
4. Click **Deploy**.

Or from the command line: `npx vercel` for a preview, `npx vercel --prod` for production.

## The journey

| Chapter | What happens |
| --- | --- |
| The chip | A tilted CPU package idles in a field of drifting binary digits. Scrolling draws schematic lines out of the chip, lights the **COMPUTER** title, then the package grows into a hollow cube. |
| History | The cube alternates left, right, left, right, left and finally centre while a schematic is drawn inside it: Analytical Engine (1837), Turing machine (1936), Z3 (1941), ENIAC (1943–45, unveiled 1946), EDVAC (1944–49) and the von Neumann architecture (1945). |
| Anatomy | The cube becomes a desktop tower, then explodes into chassis and panels, case fan, CPU cooler, power supply, storage drives and graphics card. One label and leader line at a time. |
| Motherboard | The case fades, the camera moves in. Nine parts are explained, either guided by scroll or by hovering, clicking, tapping, or using the chip buttons. |
| Software | The board labels fade, the parts return and the computer turns to its front panel. The power button brightens and pulses, binary digits pour out of it and carry the black world into a warm ivory one. The tilted CPU returns with five small illustrations (core, registers, ALU, control unit, and the ISA as a floating book that is explicitly *not* a part). The package becomes a storage drawer, a memory stick widens into an empty RAM tabletop and the drawer slides under it. A game tile appears, its files are made available, one becomes a **game process** holding three threads, the CPU descends and executes one thread at a time, and a GPU with its own VRAM joins on the right. The final composition is held before the epilogue. |

The software chapter is told with one frosted-glass panel at a time sliding in from the right (docked at the bottom on phones), a thin connector line drawn to the object it explains, and short tags on the objects. Paging, page faults, synchronisation and deadlocks are deliberately left for later chapters.

### How the transitions are built

The protagonist is **one outline box**. Its width, height and depth are animated from package proportions to cube proportions to tower proportions (`lib/rig.ts`), so the same lines carry through the first three chapters. Interior geometry (the die and pins, each machine, the tower's parts) is built and faded in and out on top of it. This is a coordinated transformation of one outline plus component movement and camera changes, not a vertex morph between unrelated meshes.

## Architecture

```
app/                      layout, page, global + stage + lesson styles
components/
  experience/
    ComputerExperience    chooses immersive or simple view (WebGL probe, reduced motion, failure)
    ImmersiveView         pinned stage, canvas, overlays
    ExperienceCanvas      React Three Fiber canvas, capped pixel ratio, pauses off screen
    ScrollController      builds the master timeline inside a gsap.context
    scenes/               Hero, HistoricalTimeline, ComputerCase, Motherboard, Software
    models/               ProcessorModel, WireframeCube, HistoricalMachineModel,
                          ComputerCaseModel, MotherboardModel, LineSet, GlowPoints, Solid, RouteLine,
                          software/ (PowerFace, Protagonist, CpuToys, Desk, TableItems, Processors, Routes)
    SimpleView            full content as a plain page (reduced motion / no WebGL)
  ui/                     BinaryBackground (wave field + warm paper reveal), BinarySwarm, ConnectionLines,
                          TimelineContent, ComponentCallouts, MotherboardPanel, SoftwarePanels,
                          SoftwareLabels, SoftwareEpilogue, SoftwareSimple, ProgressIndicator,
                          NavigationControls
data/                     milestones, hardware components, software chapter text (content, separate from rendering)
types/                    Milestone and hardware interfaces
lib/
  masterTimeline.ts       the one GSAP timeline (single pinned ScrollTrigger, scrubbed)
  sceneConstants.ts       timing schedule derived from one cursor, so chapters cannot overlap
  journey.ts              mutable animation state written by GSAP, read by Three.js each frame
  uiStore.ts              tiny store for discrete UI state (chapter, selected component)
  rig.ts                  camera and protagonist pose per frame
  geometry/               procedural geometry: cpu, machines, pc, board, software (filled solids + ink outlines)
  glyphAtlas.ts           pre-rendered 0/1 sprites shared by the background and the swarm
  anchors.ts              projects 3D anchor points to the screen so leader lines follow the camera
```

Design decisions worth knowing:

- **One scroll model.** A single pinned ScrollTrigger scrubs one master timeline. Nothing is nested and the mouse wheel is never intercepted; the browser scrolls normally. Reverse playback is free because every tween is scrubbed.
- **No per-frame React renders.** GSAP writes to the plain `journey` object; Three.js reads it in the render loop. React only re-renders on discrete changes (chapter, selected component).
- **Leader lines follow the scene.** Labels bind to 3D anchor points and are re-projected every frame, so they stay attached as the camera moves.
- **Cleanup.** The timeline is built inside `gsap.context` and reverted on unmount, which keeps React Strict Mode from creating duplicate triggers. Geometries and materials are disposed.
- **Progressive loading.** The 3D view is loaded with `next/dynamic` (`ssr: false`); later scenes mount when the visitor reaches their chapter.
- **Software chapter, one timeline.** The chapter is authored in "beats" inside the same master timeline (`swAt(beat)` in `sceneConstants.ts`); each concept has a start beat and a panel length, and the panel, connector, tags and 3D objects all hang off that schedule. There is no second animation system.
- **The theme change is a reveal, not a switch.** The warm paper is a CSS mask whose radius is driven by the timeline and which grows from the power button; the digits inside it are drawn in charcoal, outside it in white, so the swarm visibly carries the change.
- **Background.** The opening field is a single 2D canvas of a few hundred pre-rendered digits in three depth layers, with a slow wave, a drifting bright front and a few twinkling digits. It is `pointer-events: none`, pauses off screen and freezes under reduced motion.
- **Fallbacks.** Without WebGL, after a render failure, or with `prefers-reduced-motion`, the same story is shown as a plain, fully readable page, with a button back to the 3D version when it is possible.

## Dependencies

| Package | Purpose |
| --- | --- |
| `next`, `react`, `react-dom` | App Router framework and UI |
| `three`, `@react-three/fiber`, `@react-three/drei` | 3D rendering |
| `gsap` (with ScrollTrigger) | Scroll choreography |
| `lucide-react` | A few interface icons |
| `tailwindcss`, `@tailwindcss/postcss` | Utility styling (most of the look is custom CSS) |
| `@fontsource/michroma`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` | Self-hosted display, body and monospace fonts |
| `typescript`, `eslint`, `eslint-config-next`, `@types/*` | Type checking and linting |

## Assets and licences

No external 3D assets, images or audio. All geometry is generated in code.

The three typefaces are bundled locally through Fontsource and are licensed under the SIL Open Font License 1.1: Michroma (display), Inter (body), JetBrains Mono (labels). The site makes no third-party requests.

## Accuracy notes

The history text follows the brief: the Analytical Engine was never completed in Babbage's lifetime; the Turing machine is a mathematical model, not a physical computer; ENIAC was built in 1943–1945 and unveiled in 1946; EDVAC is not presented as the first stored-program machine (the text names the Manchester Baby of 1948 and EDSAC of 1949); and the von Neumann section says the architecture is a model, not that one person or machine created every feature of a modern CPU. For EDVAC the text says it was *delivered* in 1949 and entered regular use in the early 1950s, which is more precise than "operational in 1949".

The Wi-Fi explanation says that not every motherboard has Wi-Fi: it may be built in, added as a PCIe or M.2 card, or supplied by a USB adapter. The conceptual board shows Wi-Fi as an M.2 card with antenna leads.

## Verification performed

Run in this workspace: `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.

Exercised in headless Chromium against the production build (`npm start`), using software WebGL:

- The whole journey was captured at 22 scroll positions at 1440×900 and 18 at 390×844, plus finer steps through the von Neumann milestone and the cube-to-tower change.
- Scrolling backward restores the earlier state; resizing between 1440, 900 and 390 wide mid-journey leaves the page height unchanged; no horizontal overflow at desktop or mobile widths.
- Hovering the 3D board reaches all nine components; clicking pins one and it stays pinned when the pointer leaves; Escape and the close button dismiss it; keyboard Enter on a chip selects it; touch taps on the 3D board select components.
- `prefers-reduced-motion` renders the simple view with no canvas, and launching with WebGL disabled shows the simple view with an explanation. Neither produced console or page errors.

Software chapter, scripted in headless Chromium against the production build (25 checks, all passing at the time of writing):

- A forward sweep through the whole chapter in 0.7-beat steps never showed more than one panel, every panel stayed inside the viewport, and there was no horizontal overflow.
- Scrolling back from the GPU scene restores the dark theme with no panel, and scrolling back to the storage step shows exactly the storage panel.
- The final composition is held with no panel; the epilogue is reachable; resizing between desktop, 1024×768 and 390×844 mid-chapter keeps the panel visible and inside the viewport; tablet portrait (820×1180) at four beats has no overflow.
- Reduced motion shows the plain page including the software section, and the immersive view can still be opened from it. Without WebGL the simple view includes the software chapter. No console errors other than the `THREE.Clock` warning below.
- Screenshots were reviewed by eye at 1440×900, 820×1180 and 390×844 across the chapter.

## Known limitations

- **Not tested on a real GPU, Safari or Firefox.** Visual checks used Chromium with software rendering, so frame rate on real hardware is unmeasured. The pixel ratio is capped and the geometry is line-based and light, but treat performance as unverified until you try it on your own devices.
- **Not deployed.** The Vercel instructions are standard for Next.js, but no deployment was made from this workspace.
- **Dependency warning.** React Three Fiber 9 creates a `THREE.Clock`, which recent Three.js versions flag as deprecated. It is logged once as a console warning and does not affect behaviour; it will go away when R3F updates.
- **The software chapter is a visual story, not a simulation.** The objects (drawer, tabletop, process slab, thread slabs, route lines) are metaphors, and the panels say so. Not every file is shown being copied into RAM, because real systems map files and load on demand; paging, page faults, synchronisation and deadlocks are out of scope.
- **Mobile is recomposed, not just scaled.** The panel docks at the bottom with a vertical connector, small file tags are hidden, and the camera frames the process during the process and thread steps, which crops part of the table on a phone. The final composition fits, but the objects are small.
- **In portrait tablet widths the final scene is tight**: the GPU pad overlaps the table's front-right corner and the "Storage" tag sits near it.
- **Motion is scrubbed to scroll**, so on a very slow or heavily throttled device the 3D can lag behind the scrollbar slightly; the content overlays remain readable.
