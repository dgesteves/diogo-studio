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

## Milestone 1 — Immersive landing `/`

Make the first impression the world itself, not the classic scrolling home.

- [ ] Replace classic home composition with a world-first intro overlay
      (minimal title + tagline + "Explore the studio" affordance)
- [ ] Cinematic intro fly-in on first load (orbit → settle on overview station)
- [ ] Re-home the existing hero/career-graph/operating/trust content onto the
      right destination pages (so nothing is orphaned)
- [ ] "Enter" interaction hint + ambient idle motion
- [ ] First-visit-only intro (respect reduced-motion: skip straight to overview)

## Milestone 2 — Bespoke 3D objects per topic

Replace generic portal markers with real props you click to travel.

- [ ] `/work` & `/projects` & `/case-studies` → the three monitors (live screens)
- [ ] `/writing` → bookshelf with glowing spines
- [ ] `/speaking` → mic stand / speaker stack
- [ ] `/open-source` → server rack with blinking LEDs
- [ ] `/playground` → arcade / handheld console
- [ ] `/resume` → framed CV on the wall
- [ ] `/stack` → whiteboard / pegboard of tools
- [ ] `/now` → coffee mug + desk lamp
- [ ] `/contact` → door with exit sign
- [ ] `/principles` → neon poster
- [ ] `/lab` → plant / experiment bench
- [ ] `/timeline` → wall-mounted neon timeline strip
- [ ] `/uses` → the desk rig overview (retire the 2nd WebGL context)
- [ ] Hover label + focus glow standardized across all objects

## Milestone 3 — Neon zones & room build-out

- [ ] Expand the room (more walls / depth) to host distinct "zones"
- [ ] Neon wall signs with topic names + a one-line blurb per zone
- [ ] Light strips, emissive trims, animated signage
- [ ] Group destinations into themed clusters (Work / Craft / Profile / Lab)
- [ ] Floor decals / wayfinding lines toward each zone

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

- [ ] `/work` — richer per-role detail + outcomes
- [ ] `/projects` — detail per project (problem → approach → impact)
- [ ] `/case-studies` — full MDX write-ups
- [ ] `/writing` — MDX essays (owning feature `content/`)
- [ ] `/open-source` — live GitHub repos (cached server fetch)
- [ ] `/speaking` — talks list + links
- [ ] `/now` — editable "now" snapshot

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

- [ ] Landing: full takeover world vs. brief intro then overview?
- [ ] Keep the classic career-graph hero somewhere (e.g. `/timeline`)?
- [ ] Ambient sound: in scope or skip?
- [ ] How much bespoke 3D modeling vs. stylized primitives?

## Working notes

- Cannot delete files in this workflow — keep everything used (knip gate).
- ESLint `max-lines: 100` on `src/**` → keep files small; data split across
  `world/content/destinations-*.ts`.
- Run `pnpm validate` before declaring a milestone done.
