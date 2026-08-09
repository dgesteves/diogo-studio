---
trigger: glob
globs: src/features/world/**, src/features/studio/**, src/components/r3f/**, src/config/brand.ts, src/constants/room.ts, src/hooks/use-world-palette.ts
---

# The 3D world — React Three Fiber, three.js & canvas

The world is roughly 40% of `src/`. It renders inside one `<Canvas>` and it is
**an enhancement layer, never the only way to reach content**.

## Non-negotiables (these gate every change)

These are the same ones recorded in [`AGENTS.md`](../../AGENTS.md) and enforced by
the axe/E2E specs. They are hard requirements, not preferences:

- **Content stays in the DOM.** Reveal-on-focus is a visual affordance, not a data
  change. Server-rendered destination content stays crawlable and reachable by
  assistive tech. **Never gate content behind a 3D-only interaction.**
- **Reduced motion is a real code path.** `world-stage.tsx` does not mount the
  canvas when `reducedMotion` is true, and the site must be fully navigable with
  no 3D at all. Anything you add to the scene needs a no-3D equivalent.
- **Accessibility is a hard gate** (WCAG 2.2 AA). 3D objects must not be the only
  navigation: keyboard-reachable index, visible focus, labeled controls, no focus
  traps when panels reveal.
- **The route-driven spine stays.** `/` is explore, each route is a focused
  station. Deep links and `metadata` keep working.
- **The world never crops.** Verify ultrawide, laptop, tablet and portrait phone —
  the focused object stays visible and unoccluded. Responsiveness moves the
  **camera**, not the objects (`utils/framing.ts` pulls back on narrow viewports).

## Materials, color and theme

- **Never inline a hex, roughness or metalness value.** Use the shared material
  tokens and colors in `src/config/brand.ts` (misleadingly named — it is
  three.js material tokens, and the restructure renames it to
  `world/scene/materials.ts`). It has ~39 importers; add a token rather than a
  literal.
- Read theme colors through **`useWorldPalette()`**, never by branching on the
  store inline. Day/night is a palette swap, so both modes must be checked.
- Room and object dimensions come from the shared geometry constants
  (`constants/room.ts`, `*-layout.ts`), not from numbers typed at the call site.

## Frame-loop and resource discipline

- **Do not allocate inside `useFrame`.** No `new THREE.Vector3/Color/Matrix4` per
  frame — hoist scratch objects to module scope and mutate them. The frame loop
  runs 60×/second and drives INP.
- Keep `useFrame` bodies short and branch-free where possible; prefer deriving a
  value once over recomputing it per frame per object.
- **`useMemo` for three.js object creation is correct and expected**, and is the
  sanctioned exception to the React Compiler "no manual memoisation" rule — a
  `Geometry`, `Material`, or `CanvasTexture` must be referentially stable. This is
  the one place manual memoisation needs no justification comment.
- **Dispose what you create.** R3F auto-disposes objects it reconciles, but
  textures and geometries built imperatively (`createCanvasTexture`, the
  `*-textures.ts` factories) must be disposed on unmount and must not be rebuilt
  per render.
- Prefer **instancing** for repeated geometry (see `bookshelf-instances.ts`,
  `city-layout.ts`) over N sibling meshes.
- Respect the DPR ladder — resolve device pixel ratio via `dprForFactor()`, never
  hardcode, and never raise it to fix a visual bug.
- Publish scene stats to `perf-store` (world writes, inspector reads); don't add a
  second telemetry path.

## Canvas-2D screens

- Screen content is drawn with `CanvasRenderingContext2D` into a texture. Keep
  the **draw routine pure** — take `ctx` plus a state object, return nothing, and
  read no globals.
- **Draw routines must be deterministic.** Never call `Math.random()` — take a
  seeded PRNG from `@/utils/mulberry32` so output is reproducible; the test suite
  snapshots these transcripts and non-determinism makes them useless. There are
  currently **zero** `Math.random()` calls in `src/`; don't be the one to add one.
  `mulberry32` lives in `utils/` because two features use it — never re-declare it
  locally.
- Draw and layout modules are legitimately long, and `max-lines` is **off** for
  `*-{draw,layout,geometry,textures,shaders,data}.ts`. Never split one to satisfy a
  line cap.

## Boundaries

- The canvas is a client island: `"use client"` at the stage boundary, loaded via
  `next/dynamic`, and never imported into a Server Component tree.
- Scene code must not reach into unrelated features. Cross-feature imports go
  through `@/features/world`; inside the feature use relative paths.
- Test R3F components with `@react-three/test-renderer` by asserting the scene
  graph (see the testing rule) — jsdom has no WebGL and no 2D canvas.
