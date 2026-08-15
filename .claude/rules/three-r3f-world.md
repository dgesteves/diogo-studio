---
paths:
  - "src/world/**"
---

# The 3D world — R3F, three.js & canvas

Roughly 40% of `src/`, rendering inside one `<Canvas>`, and an enhancement layer rather than the
only way to reach content.

## Non-negotiables

This rule is the source of truth for them and the axe/E2E specs enforce them:

- **Content stays in the DOM.** Reveal-on-focus is a visual affordance, not a data change.
  Server-rendered destination content stays crawlable and reachable by assistive tech. Never
  gate content behind a 3D-only interaction.
- **Reduced motion is a real code path.** `world/world.tsx` does not mount the canvas when it is
  set, and the site must be fully navigable with no 3D at all. Anything added to the scene needs
  a no-3D equivalent.
- **3D objects are never the only navigation:** keyboard-reachable index, visible focus, labeled
  controls, no focus traps when panels reveal.
- **The route-driven spine stays.** `/` is explore, each route is a focused station; deep links
  and `metadata` keep working.
- **The world never crops.** Check ultrawide, laptop, tablet and portrait phone: the focused
  object stays visible and unoccluded. Responsiveness moves the **camera**, not the objects
  (`world/camera.tsx` pulls back on narrow viewports).

## Materials, geometry and theme

- **Never inline a hex, roughness or metalness value.** Use the shared tokens in
  `world/materials.ts` — `worldColors` plus the four material presets, ~40 importers. Add a
  token rather than a literal. The two hexes in `ui/brand.ts` are the exception and
  are not the world's: they exist for the `ImageResponse` icons and the portrait tint, which
  render pixels no stylesheet reaches.
- Read theme colors through `useWorldPalette()`, never by branching on the store inline;
  day/night is a palette swap, so check both.
- Dimensions come from `world/room.ts` — the room shell, the desk surface, the window and
  where the wall panels hang — not numbers typed at the call site.

## Frame loop and resources

- **Do not allocate inside `useFrame`.** No `new THREE.Vector3/Color/Matrix4` per frame — hoist
  scratch objects to module scope and mutate them. The loop runs 60×/second and drives INP.
- **`useMemo` for three.js object creation is the canonical stable-identity case.** A
  `Geometry`, `Material` or `CanvasTexture` must be referentially stable, and this is the one
  place it needs no justification.
- **Dispose what you create.** R3F auto-disposes what it reconciles; textures and geometries
  built imperatively (`createCanvasTexture`, the texture factories in `world/scene/`) must be disposed on
  unmount and never rebuilt per render. A canvas-backed **screen** does not hand-roll that:
  `useScreenTexture(width, height)` in `world/screens/texture.ts` owns the disposal, and its
  `paint(draw)` is the only place `needsUpdate` is set — the one `react-hooks/immutability`
  exemption in `src/` lives there, so never copy the banner to a new file.
- Prefer instancing for repeated geometry over N sibling meshes. Resolve device pixel ratio via
  `dprForFactor()` — never hardcode it, and never raise it to fix a visual bug.
- Publish scene stats to `world/perf` (world writes, inspector reads); don't add a second
  telemetry path.

## Quality tiers — the world downgrades itself

`detectSoftwareRenderer()` probes before the canvas chunk mounts and `WorldQualityGuard` watches
frame times after; together they walk `full → reduced → frozen`, one way only. CI runs on
SwiftShader, so it starts at `frozen` (`frameloop="demand"`, one painted frame). The current
tier is published on the world root as **`data-world-quality`** — read it first when the scene
behaves unexpectedly, and never work around a slow frame by capping quality at the call site or
forcing an interaction.

## Canvas-2D screens

- Keep the draw routine pure: take `ctx` plus a state object, return nothing, read no globals.
- **Deterministic, always.** Never `Math.random()` — take a seeded PRNG from
  `world/random.ts`, which is where the world's four callers of it agree, so never
  re-declare it locally. The suite snapshots these transcripts, so non-determinism makes them
  worthless.

## Client-island boundaries

- The canvas is a client island: `"use client"` at the stage boundary, loaded via
  `next/dynamic`, never imported into a Server Component tree.
- **Client islands import `@/content/pages`, never `@/content/prose`.** The latter carries
  every page's prose via `blocks`, so importing it from a `"use client"` module would ship all
  of it to the browser for nothing. The page list holds slug/href/label/sectors only, and
  `content/prose.test.ts` asserts the two agree. This one is enforced: the prose is
  `server-only`, so reaching for it from a client module fails the build.
- Scene code must not reach into a sibling domain. **A domain's store module is its public
  API; every other file in it is private** (`docs/architecture.md` §4 rule 2) — the world
  exposes its stores and nothing else, and reads a sibling only through that sibling's store.
  Inside the world, import relatively, never through its own `@/` alias.
