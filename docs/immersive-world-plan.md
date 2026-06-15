# Immersive Studio World — Build Plan

The portfolio is an **interactive 3D studio world**: visitors explore a living
room (the rig the work ships from) and travel between topics by interacting with
objects, neon signage, and screens — instead of scrolling a normal site.

This is the single source of truth for the build. Update the checkboxes as work
lands. `[x]` done · `[~]` in progress · `[ ]` not started.

## North star

> Anyone who lands on the site thinks _"this is out of this world"_ within 3
> seconds — and can still use it perfectly on a phone, with a keyboard, or with
> a screen reader, and it ranks on Google.

## Locked decisions

- **Landing = full world takeover.** `/` is the world itself — no classic
  scrolling home sections. Cinematic fly-in, minimal neon title, "Explore the
  studio" affordance. Existing hero/operating/trust content is re-homed onto
  destination pages so nothing is orphaned.
- **No MDX / no markdown content.** All site content is authored as **typed
  TypeScript data modules** (the `ContentBlock` system in feature `content/`
  dirs). Extend the block union for new needs — never introduce MDX.
- **3D is enhancement, never the only path.** Full reduced-motion / no-WebGL
  parity via real DOM panels + dock + command menu (guardrails below).
- **Spatial model = hub + themed alcoves, built room-first.** A central hub with
  neon signage; cinematic doorway transitions into per-theme alcoves (each with
  its own neon color identity + hero object). We ship the current single room at
  cinematic quality first, then carve alcoves incrementally. Architected so it
  can grow toward fully separate sub-rooms later without a rewrite.
- **Quality bar = "most awesome."** Crazy-good-looking, fully immersive, fully
  interactive — held to the **Experience pillars** below. Smoothness (60fps on a
  mid-range phone) is treated as part of the wow, not optional.
- **Defaults locked:** career-graph hero re-homed to `/timeline`; baseline 3D is
  stylized primitives + emissive/neon materials (selective high-detail only for
  hero objects, lazy-loaded); ambient sound deferred to M10 (off by default,
  toggle, reduced-motion aware); cinematic intro plays once per session, quick
  settle on repeat, skipped under reduced-motion.

## Experience pillars (the "WOW" bar)

Every milestone is measured against these. If a change doesn't move at least one
forward (or protect them), reconsider it.

- **Cinematic first frame** — atmospheric lighting, depth, bloom/vignette/color
  grade; looks like a render, not a demo.
- **Travel is the magic** — eased, curved doorway transitions between hub and
  alcoves; the mood/color shifts as you move.
- **Everything reacts** — hover/focus glow, parallax, object micro-animations,
  live screens; the world feels alive and responsive to the cursor.
- **Distinct, memorable zones** — each theme has its own color, light, and hero
  object worth screenshotting.
- **Buttery + instant** — 60fps target on mid-range mobile; fast LCP; no jank,
  no layout shift.
- **Perfect parity** — keyboard, screen reader, reduced-motion, and no-WebGL
  users get an equally polished (non-3D) experience.

## Non-negotiable guardrails (apply to every milestone)

- **Accessibility (WCAG 2.2 AA)** — every destination reachable + readable
  without the 3D layer (dock, command menu, real DOM panels). 3D is `aria-hidden`
  enhancement.
- **SEO** — every route is a real server-rendered page with metadata, canonical,
  OG image, and structured data.
- **Performance** — protect LCP/CLS/INP, stay under the JS size budget, degrade
  on low-power/reduced-motion/no-WebGL.
- **No troika `<Text>`** — it crashes under Turbopack. Use drei `<Html>` + CSS
  neon, or SDF text only if the worker issue is fixed.

---

## Milestone 0 — Foundation _(shipped)_

- [x] All 17 routes as typed SSOT in `constants/routes.ts`
- [x] `world` feature: persistent `<Canvas>` shell (`WorldStage`) in
      `(marketing)/layout.tsx`, never unmounts
- [x] `WorldCamera` flies between per-route "stations"
- [x] `WorldPortals` / `PortalMarker` — clickable glowing markers per topic
- [x] `WorldNeon` brand sign + `WorldProps` (bookshelf, server rack, plant, door)
- [x] `DestinationView` / `DestinationPanel` / `ContentBlocks` HUD panels from résumé
- [x] `WorldDock` — accessible bottom navigator for all 17 destinations
- [x] `WorldFallback` static backdrop for reduced-motion / no-WebGL
- [x] Verified: typecheck, lint, knip, 39 unit tests, all routes 200

---

## Milestone 1 — Immersive landing `/` (full takeover) _(shipped)_

The first impression is the world itself — no classic scrolling home.

- [x] Remove classic home composition; `/` opens directly into the world
      (`Home` is now a full-height, pointer-events-through landing over the world)
- [x] World-first intro overlay (minimal neon title + tagline + "Explore the
      studio" affordance) — `HeroSection` repurposed; title/summary read from the
      `home` destination data (SSOT)
- [x] Cinematic intro fly-in on first load (elevated start → eased settle on the
      overview station) — `world/lib/intro.ts` + `WorldCamera`
- [x] Re-home the existing content (so nothing is orphaned): career-graph →
      `/timeline` (`CareerGraphShowcase`); operating altitudes + selected
      engagements → `/work` (reused `OperatingSection`/`TrustSection`)
- [x] "Enter" interaction hint (`world-hint-pulse`) + ambient idle motion (camera
      orbit)
- [x] First-visit-only intro; quick settle on repeat (sessionStorage
      `world-intro-played`, consumed in `WorldCamera`)
- [x] Reduced-motion / no-WebGL landing: static backdrop (`WorldFallback`) + real
      DOM intro panel + dock (full content + navigation parity)
- [x] Verified: lint, typecheck, format, 41 unit tests, knip; `/`, `/work`,
      `/timeline` serve 200

## Milestone 2 — Bespoke 3D objects per topic _(in progress)_

Replace generic portal markers with real props you click to travel.

**Approach (locked, corrected):** an earlier attempt rendered stylized emissive
neon "glyph" props hovering on a pad at each station. It read as amateur/emoji-like
and clashed with the professional studio scene, so it was reverted (the
`objects/*` glyph files were removed; `PortalMarker` is back to the clean
glow-pad + dot + hover light + neon label markers). The real M2 = **clean realism,
reuse the room**:

1. Make the EXISTING realistic furniture the click-to-travel targets with a
   subtle hover highlight (no new icons): monitors → work/projects/about,
   speakers → speaking, bookshelf → writing, server rack → open-source,
   plant → lab, framed art → resume, neon sign → brand/home.
2. For content-heavy topics, build **glowing wall-screens** using the SAME
   canvas-texture technique as the studio monitors
   (`features/studio/components/screens/*`): a `<canvas>` is drawn with real
   content and used as both `map` + `emissiveMap` so the panel glows. Shared
   helpers live in `world/components/props/screen-draw-kit.ts`; the reusable
   `WallScreen` + per-topic `*-screen-draw.ts` files render via `WallScreens`.
   The user approved this look (vs. flat PBR primitives / neon glyphs).
3. Keep `station.object` (`constants/object-kinds.ts`) as the typed metadata
   mapping each route → its prop/furniture.

- [x] Glowing wall-screen system shipped: `/resume`, `/timeline`, `/principles`,
      `/stack`, `/playground` render as a 5-panel emissive video wall on the back
      wall; cameras + markers reframed to each panel (`stations.ts`)
- [ ] Map existing furniture → routes + subtle hover highlight (reuse the room)
- [ ] `/now` coffee + lamp, `/contact` door realistic targets placed in room
- [ ] `/case-studies` realistic target
- [ ] `/uses` → desk rig overview (retire the 2nd WebGL context) — deferred:
      retiring `StudioSection`/`StudioCanvas` from `/uses` requires re-homing the
      `studio` feature to avoid orphaning it under the knip gate (separate refactor)
- [ ] Hover highlight + label standardized across all targets
- [x] Clean marker layer restored; glyph experiment reverted; gate green
      (lint, typecheck, format, 45 unit tests, knip)

## Milestone 3 — Hub + themed alcoves

Carve the single room into a central hub with per-theme alcoves (room-first →
expandable to full sub-rooms later, no rewrite).

- [ ] Define the 4 theme clusters + their alcoves:
      **Work** (work · projects · case-studies · resume),
      **Craft** (writing · speaking · open-source · stack),
      **Profile** (about · now · timeline · contact),
      **Lab** (playground · lab · uses · principles)
- [ ] Central hub with neon signage pointing to each alcove
- [ ] Per-alcove neon color identity + hero object + lighting mood
- [ ] Cinematic doorway/portal transition hub ↔ alcove
- [ ] Light strips, emissive trims, animated signage
- [ ] Floor decals / wayfinding toward each alcove
- [ ] Architecture note: alcoves declared as data so adding/splitting rooms is
      config-only (extend `stations`/zone config, lazy-mount alcove contents)

## Milestone 4 — Camera choreography & controls

- [ ] Eased, curved camera paths between stations (no linear lerp pops)
- [ ] Per-station framing tuned for each object + panel layout
- [ ] Gentle parallax/orbit on pointer + device tilt
- [ ] Keyboard camera nudge + "return to overview" control
- [ ] Touch orbit/pinch on mobile (constrained)
- [ ] `frameloop="demand"` when idle to save battery

## Milestone 5 — In-world live screens

- [ ] Route-specific content rendered on the monitors/surfaces
- [ ] Reuse existing code/terminal/metrics screen textures; add per-topic screens
- [ ] Subtle screen animation tied to the active station

## Milestone 6 — Content depth (real substance)

**Authoring model (locked): no MDX / no markdown content files.** Everything is
typed TypeScript data in each feature's `content/` dir (like
`world/content/destinations-*.ts`), rendered by the `ContentBlock` system.
Extend the `ContentBlock` union with new block types as needed (e.g. `quote`,
`figure`, `steps`, `codeSample`) and add their renderers.

- [ ] `/work` — richer per-role detail + outcomes (typed data)
- [ ] `/projects` — detail per project (problem → approach → impact, typed data)
- [ ] `/case-studies` — long-form write-ups via extended `ContentBlock` types
- [ ] `/writing` — essays as typed content modules (no MDX)
- [ ] `/open-source` — live GitHub repos (cached server fetch)
- [ ] `/speaking` — talks list + links (typed data)
- [ ] `/now` — "now" snapshot (typed data)
- [ ] Extend `ContentBlock` union + renderers for any new block types

## Milestone 7 — Accessibility & SEO hardening

- [ ] Focus moves to panel heading on route change; visible focus everywhere
- [ ] Live-region announcement of the active destination
- [ ] Full reduced-motion parity (no camera motion, instant station switch)
- [ ] Per-route `opengraph-image` + JSON-LD (`ProfilePage` / `CreativeWork`)
- [ ] axe automated checks pass on every route

## Milestone 8 — Performance & resilience

- [ ] Geometry instancing + draw-call budget; measure with the perf reporter
- [ ] Texture/asset lazy-loading + Suspense boundaries
- [ ] Low-power tier (fewer effects, lower DPR) auto-detected
- [ ] Keep within `size-limit` JS budget; analyze bundle
- [ ] WebGL context-loss recovery + error boundary around the canvas

## Milestone 9 — Mobile & responsive

- [ ] Panel + dock layouts tuned for small screens
- [ ] Touch-first navigation; portals large enough to tap
- [ ] Perf tier validated on mid-range mobile

## Milestone 10 — Delight & polish

- [ ] Post-processing pass (bloom/vignette/grade) tuned per zone
- [ ] Dust, subtle god rays, ambient particles
- [ ] Branded loading sequence
- [ ] Command-menu "fly to <destination>" actions
- [ ] Optional ambient sound (off by default, user-toggle, reduced-motion aware)
- [ ] Easter eggs

## Milestone 11 — QA, testing & launch

- [ ] Playwright e2e per route (nav, panel content, dock, keyboard)
- [ ] axe-core a11y gate on key screens
- [ ] Unit tests for world config (stations/destinations/resolvers)
- [ ] Lighthouse pass (perf/a11y/SEO/best-practices)
- [ ] Analytics events for destination visits + interactions
- [ ] Deploy + smoke test

---

## Open questions / decisions to confirm

_All resolved → see **Locked decisions**._

- [x] Landing = full world takeover
- [x] Content = typed TypeScript data (no MDX)
- [x] Spatial model = hub + themed alcoves, built room-first (expandable to sub-rooms)
- [x] Career-graph hero → re-home to `/timeline`
- [x] 3D fidelity → stylized primitives + emissive; selective lazy-loaded hero models
- [x] Ambient sound → M10, off by default, toggle, reduced-motion aware
- [x] Intro → once per session, quick settle on repeat, skipped under reduced-motion

Nothing blocking remains — the plan is locked and ready to execute.

## Working notes

- Cannot delete files in this workflow — keep everything used (knip gate).
- ESLint `max-lines: 100` on `src/**` → keep files small; data split across
  `world/content/destinations-*.ts`.
- Run `pnpm validate` before declaring a milestone done.
