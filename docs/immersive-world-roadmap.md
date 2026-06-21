# Immersive world — roadmap

> Living, multi-session tracking plan for turning the 3D studio from a
> background-behind-cards into a responsive, immersive, explore→focus
> experience. Update the **Status** and **Session log** as work lands.
> Pairs with `docs/architecture.md` (where code goes) and
> `docs/design-system.md` (tokens/primitives).

---

## How to use this doc

- Each **Phase** is a session-sized, independently shippable chunk.
- Work top-down; later phases assume earlier ones. Phase 0 unblocks the rest.
- Tick tasks as `- [x]` when merged. Update the phase **Status** and add a
  **Session log** row each session.
- Every phase must meet the shared **Definition of done** before it counts.

---

## North star

A portfolio that _feels_ like stepping into Diogo's digital studio — the 3D
world is the primary interface; UI appears on demand — while staying a fast,
accessible, crawlable Next.js site underneath. ChatGPT's "replace the site with
a game" instinct is right on immersion and wrong on fundamentals; we keep the
fundamentals and layer the immersion on top.

Long-term direction (not a near-term commitment): cluster the 17 routes into a
few legible spatial zones ("rooms"), then grow toward a multi-area "digital
home." Audio and free-explore are opt-in delight, phased last.

---

## Non-negotiables (carry into every phase)

These are the constraints the ChatGPT thread ignored. They gate every change.

- **Content stays in the DOM.** Reveal-on-focus is a _visual_ affordance, not a
  data change. Server-rendered destination content remains crawlable for SEO and
  reachable by assistive tech. Never gate content behind a 3D-only interaction.
- **Reduced-motion is a real path.** `world-stage.tsx` does not mount the canvas
  when `reducedMotion` is true. The site must be fully navigable and readable
  with no 3D — the dock/index and content carry the whole experience.
- **Accessibility is a hard gate** (WCAG 2.2 AA). 17 objects can't be the only
  navigation: keyboard-reachable index, visible focus, labelled controls, no
  focus traps when panels reveal. `pnpm e2e` axe specs stay green.
- **Performance stays honest.** `.size-limit.json` (1.3 MB gzipped total JS
  chunks) is a **review signal, not a hard blocker** — use it to notice
  regressions, not to fail the build. The real gate is Core Web Vitals
  (INP/LCP/CLS): lazy-load new client code (audio, controls) inside small
  `"use client"` islands and keep it off the critical path.
- **Route-driven spine stays.** `/` = explore; each route = a focused station.
  Deep links and `metadata` keep working.
- **Conventional commits, small files.** One logical change per commit; files
  ~100 lines, functions ~50; split aggressively.

---

## Architecture spine (what stays)

- Route group `app/(marketing)/` → `MarketingLayout` mounts `WorldStage` +
  page content + dock.
- `features/world/` owns the scene, stations, hotspots, destinations (content),
  camera, and the dock.
- Global UI state in `src/stores/world-store.ts` (hand-rolled
  `useSyncExternalStore` store) — extend it, keep the pattern.
- Content authored as typed data in `features/world/constants/destinations-*.ts`
  and rendered by `destination-view.tsx` / `content-blocks.tsx`.

---

## Definition of done (every phase)

- [ ] `pnpm validate` passes (lint + typecheck + format + tests + knip).
- [ ] `pnpm e2e` (Playwright + axe) green; new behavior has coverage.
- [ ] Reduced-motion path verified (no-3D experience still complete).
- [ ] `pnpm size` reviewed for regressions (1.3 MB gzip signal, not a gate);
      new client code lazy-loaded/islanded; Core Web Vitals watched.
- [ ] Works across ultrawide / laptop / tablet / portrait phone (no cropping,
      world visible, no occlusion of the focused object).
- [ ] Shipped as granular Conventional Commit(s).

---

## Phase 0 — Responsive camera framing + world visibility

**Goal:** Fix the root bug — the world never crops and is always visible, on any
aspect ratio. No interaction redesign yet.

**Status:** Done — code shipped + `pnpm validate` green; pending on-device visual
confirmation.

- [x] Add `features/world/utils/framing.ts` → `framingPullback(aspect)` (+
      colocated unit test). Approach: preserve horizontal coverage relative to a
      16:9 reference — pull the camera back on narrower viewports, capped at
      3.5×. Chosen over per-station radii because it keeps the hand-authored
      framing intact at/above the reference and needs zero per-station tuning.
- [x] Rewrite `world-camera.tsx` to derive each station's view direction +
      authored distance, then scale distance by `framingPullback` every frame.
      Intro + idle-orbit feel preserved (identical at ≥ 16:9).
- [x] Read viewport aspect from the R3F frame `size` (smooth on resize/rotate;
      no breakpoint table).
- [x] Confirmed world stacking: `body` has an opaque `--background`, but the
      `fixed inset-0 -z-10` stage paints in front of the canvas background and
      behind content, so the world is genuinely visible — the only occluder is
      the centered card (addressed in Phase 2). No z-index change needed.
- [ ] **Moved to Phase 2:** lateral focal-offset. Deferred because the offset
      strategy belongs with the panel composition, and a pre-added unused export
      would fail `knip`. Phase 2 wires it when the panel lands.

**Files:** `features/world/utils/framing.ts` (new) + `framing.test.ts`,
`world-camera.tsx`.

**Acceptance:** Same station stays fully framed at 21:9, 16:10, 4:3, and 9:19.6;
world visibly present behind content on mobile. `pnpm validate` green (54 tests,
incl. 4 new framing tests). On-device check pending.

---

## Phase 1 — Explore vs Focus state model

**Goal:** A clear `explore | focus` model so you can hop object→object and always
get back out. Resolves "hide text until click" vs "still reach other objects."

**Status:** Not started

- [ ] Extend `src/stores/world-store.ts` with a derived `mode` (`explore` on `/`,
      `focus` on a station route) + helpers.
- [ ] Return-to-overview affordances: `Esc` key, click empty space in the world,
      and a close control (wired in Phase 2 panel).
- [ ] Keep **all** hotspots interactive in focus mode; dim non-active ones at the
      edges so direct object→object navigation works
      (`world-portals.tsx`, `furniture-hotspot.tsx`).
- [ ] Idle affordance in explore mode so users know objects are clickable
      (subtle pulse/glow on key hotspots).

**Files:** `world-store.ts`, `world-portals.tsx`, `furniture-hotspot.tsx`,
`world-camera.tsx` (overview vs focused framing).

**Acceptance:** From any focused object you can (a) click another visible object,
(b) press `Esc` / click empty space to return to overview, (c) use the dock.

---

## Phase 2 — Reveal-on-focus responsive composition

**Goal:** Content reveals on focus, composed beside the object — never over it.

**Status:** In progress.

- [x] Convert `destination-view.tsx` / `home.tsx` / `destination-panel.tsx` /
      `hero-section.tsx` from a centered blocker to a **bottom sheet (mobile)** /
      **narrower side card (desktop)**. Done CSS-only and kept **in normal flow**
      so below-the-fold content (e.g. `/work` operating/trust sections) still
      scrolls, `home.test` needs no router context, and no inner-scroll region
      trips the `/about` axe check (`scrollable-region-focusable`).
- [ ] Wire the camera **lateral focal offset** so the object sits in the
      uncovered region opposite the card (gated on which side the card sits).
- [ ] (Decision) Home in explore: keep slim intro card vs hide hero until an
      object is clicked (hero stays in DOM for SEO/tests either way).
- [ ] Return-to-explore affordances: `Esc`, click-empty-space, explicit Back.
- [ ] Reveal/transition gated on `useReducedMotionPreference()`.
- [ ] Focus management on reveal (move focus to panel heading; no focus trap;
      restore focus to trigger). Content remains in DOM always.

**Files:** `destination-view.tsx`, `destination-panel.tsx`, `world-camera.tsx`,
new client island for the sheet (consider `vaul`, already in stack).

**Acceptance:** Focused object never occluded on any screen; panel reveals on
focus and is keyboard/SR operable; reduced-motion users still get full content.

---

## Phase 3 — Home overview + dock redesign

**Goal:** Home is the immersive overview; the dock becomes a quiet, collapsible,
accessible index (not removed).

**Status:** Not started

- [ ] Home `/` shows the world overview; hero stays in DOM but visually minimal
      (compact/dismissible), preserving SEO + the availability/CTA content.
- [ ] Redesign `world-dock.tsx` into a collapsible "studio map/index" that
      doubles as the accessible/keyboard/no-3D navigation spine.
- [ ] Reposition so it never fights the bottom sheet (Phase 2) on mobile.

**Files:** `features/home/components/home.tsx`, `hero-section.tsx`,
`world-dock.tsx`.

**Acceptance:** Landing shows the world (not a big card); dock is quiet but fully
keyboard reachable and is the sole nav under reduced motion.

---

## Phase 4 — Mobile single-object focus + swipe/cycle

**Goal:** Best-in-class mobile: one object at a time, swipe/cycle between
stations, world always visible above the sheet.

**Status:** Not started

- [ ] Mobile focuses a single object; swipe/cycle navigates stations
      (respects zone order from Phase 5 once it lands).
- [ ] Coordinate gestures with the bottom sheet + dock (no conflicts).
- [ ] Keep the index as the non-gesture alternative (a11y).

**Files:** `world-camera.tsx`, sheet island, `world-dock.tsx`, a mobile
gesture hook in `features/world/hooks/`.

**Acceptance:** Phone users can move through every section via swipe _and_ the
index; world stays visible; no gesture traps.

---

## Phase 5 — Zone clustering (the realistic "rooms")

**Goal:** Group the 17 routes into ~4–6 spatial zones for legible navigation and
to set up the "digital home" direction.

**Status:** Not started

- [ ] Define zones over existing destination groupings
      (core / experience / projects / craft / explorations / reach / stance /
      tooling / timeline) in `features/world/constants/`.
- [ ] Zone-level navigation (pick a zone → pick an object), reflected in the
      dock/index and mobile cycle order.
- [ ] Camera understands zone overview vs object focus.

**Files:** new `features/world/constants/zones.ts`, `world-dock.tsx`,
`world-camera.tsx`, `stations.ts`.

**Acceptance:** Navigation reads as a small set of places, not 17 flat items;
mobile cycling is grouped by zone.

---

## Phase 6 — Free-explore mode (delight)

**Goal:** Optional orbit/roam mode that hides UI and lets people explore.

**Status:** Not started

- [ ] Toggle (e.g. key + on-screen control) into orbit/roam; hides panels/dock.
- [ ] Gated on pointer + reduced-motion; clear exit.

**Files:** new control island, `world-canvas.tsx`, `world-store.ts`.

**Acceptance:** Opt-in, reduced-motion safe, never the only way to do anything.

---

## Phase 7 — Ambient audio (opt-in)

**Goal:** Atmosphere via sound — strictly opt-in.

**Status:** In progress — file-based opt-in player shipped.

- [x] Muted by default; user-initiated start via the "Sound on/off" toggle;
      persistent preference in `localStorage`.
- [x] Never autoplay; skip the stored-pref auto-resume under reduced motion.
- [x] Royalty-free assets in `public/audio/`: looping `music/ambient.mp3` +
      `sfx/{hover,select,confirm,whoosh}.mp3`.
- [x] Lazy-loaded — the engine and `Audio` elements are created only on first
      enable, so visitors who never opt in download nothing.
- [x] SFX mapped: hover → `hover`, navigation → `whoosh`, enable → `confirm`.
- [ ] Wire `select.mp3` to the focus/select interaction (Phase 1).
- [ ] (Stretch) per-zone adaptive crossfade.

**Files:** `features/audio/` (`constants.ts`, `audio-engine.ts`,
`audio-provider.tsx`, `components/audio-toggle.tsx`, `components/world-audio.tsx`);
`public/audio/` assets; mounted in `app/(marketing)/layout.tsx`.

**Acceptance:** No autoplay; toggle works; zero impact for users who never enable
it (assets lazy-loaded on opt-in).

---

## Phase 8 — North-star area expansion (ongoing)

**Goal:** Grow new spatial areas as content warrants (project hangar, library,
lab, rooftop, …), mapped onto real routes — never empty rooms.

**Status:** Not started

- [ ] Add areas incrementally, each tied to existing/!planned content.
- [ ] Reassess scene model (e.g. circular/island layout) only if a real
      navigation need demands it.

---

## Phase 9 — Signature boot sequence + audio entry

**Goal:** First arrival feels like powering on the studio (vision §3) — a
game-style "creating the studio" screen that covers real asset/shader warm-up,
then hands off into the existing camera fly-in. Doubles as the audio opt-in
gesture.

**Status:** In progress — shipped first version (terminal/progress UI + audio
entry). Cinematic power-on choreography is the follow-up.

- [x] `BootSequence` client island in `MarketingLayout` + a small `boot-store`
      (`useSyncExternalStore`, same pattern as `world-store`).
- [x] Drive progress from drei `useProgress` via an in-canvas
      `BootProgressReporter` (keeps drei off the critical path), plus a faux
      ease, a min display floor, and a max-timeout fallback so it never hangs.
- [ ] Staged power-on choreography (grid → desk/monitors → neon → audio swell)
      gated on load milestones; type-on terminal copy. _(v1 ships a progress bar + stepped status text; full choreography is the next pass.)_
- [x] Two entry CTAs — **"Enter with sound"** / **"Enter muted"** — wired to
      `useAudio().enable` (now exposed from the provider). The "Enter" click is
      the browser-required user gesture for audio.
- [x] Once per session (`studio-booted` sessionStorage key); skippable
      (`Esc` via Radix dialog / Skip / Enter); reduced-motion = instant
      (returns null). _Follow-up: pre-select "sound" when_
      `studio-audio-enabled=1` _is stored._

**Files:** new `features/world/components/boot-sequence.tsx` (+ subparts),
`src/stores/boot-store.ts`, `features/audio/audio-provider.tsx`
(`enable`/`enabled`), `app/(marketing)/layout.tsx`.

**Acceptance:** First visit shows the boot screen tied to real load; skippable
and keyboard-operable; audio only ever starts from the explicit gesture; nothing
downloaded for "Enter muted"; reduced-motion users land instantly with full
content.

---

## Phase 10 — Day/night flagship world (theme-reactive)

**Goal:** Light mode = day, dark mode = night — the whole world changes.
Flagship scope: not just a recolor but a second art pass (daylight rig, sky,
eventually sun + skyline + time-of-day).

**Status:** In progress — palette foundation shipped (night-first).

- [x] Extract a single source of truth: `config/world-theme.ts`
      (`worldPalettes` for `day|night` + `resolveWorldMode`) +
      `src/stores/world-theme-store.ts` + `useWorldPalette` hook +
      `WorldThemeBridge` (maps `next-themes` → world mode). Night palette = exact
      current look; wired canvas bg/fog/bloom/vignette, lighting, neon. World
      defaults to night even under system.
- [ ] Tune the day palette on-device (daylight lighting, sky/haze background,
      bloom down, neon legibility, contact-shadow color/opacity).
- [ ] Smooth day↔night transition (lerp colors/intensities in `useFrame`);
      reduced-motion = instant swap.
- [ ] Flagship extras: sun/sky dome, daytime city skyline, time-of-day polish.

**Files:** `config/world-theme.ts` (+ test), `src/stores/world-theme-store.ts`,
`src/hooks/use-world-palette.ts`, `world-theme-bridge.tsx`, `world-canvas.tsx`,
`lighting.tsx`, `world-neon.tsx`, `world-stage.tsx`.

**Acceptance:** Toggling theme switches the whole world day↔night; night is
byte-for-byte the prior look; day is convincing (not a washed-out recolor);
reduced-motion + no-3D paths unaffected.

---

## Open decisions

- Home hero treatment: fully minimal vs slim dismissible card (lean: slim,
  in-DOM, fades after first interaction).
- Side-panel side (left vs right) and desktop split ratio.
- Free-explore + audio: confirm before building Phases 6–7.

---

## Session log

| Date       | Phase | Change                                                                                                                                                                                                                                                                                         | Status                         |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 2026-06-20 | —     | Roadmap created; scope agreed as phased multi-session plan toward the north star.                                                                                                                                                                                                              | Done                           |
| 2026-06-20 | 0     | Aspect-aware camera framing: added `framingPullback` util + test; `world-camera.tsx` pulls back on narrow viewports. `pnpm validate` green.                                                                                                                                                    | Done (pending on-device check) |
| 2026-06-20 | 2     | Non-blocking composition (CSS, in-flow): content cards now bottom-sheet on mobile / narrower side card on desktop so the world is visible everywhere. `pnpm validate` green (54 tests).                                                                                                        | In progress                    |
| 2026-06-20 | 7     | Reverted the procedural-synth audio prototype (moving to downloaded royalty-free assets — see `docs/audio-assets.md`); removed the legacy "type diogo" easter egg.                                                                                                                             | Reverted                       |
| 2026-06-20 | 7     | File-based opt-in audio player: looping `ambient.mp3` + hover/whoosh/confirm SFX, lazy-loaded on first enable, reduced-motion aware. `pnpm validate` green (54 tests).                                                                                                                         | In progress                    |
| 2026-06-20 | 9/10  | Scoped 3 new features from design chat: signature boot sequence (Phase 9), audio-opt-in on boot, day/night flagship world (Phase 10). Decision: boot = once/session; day/night = full flagship.                                                                                                | Planned                        |
| 2026-06-20 | 10    | World palette foundation: `config/world-theme.ts` (`day\|night`) + `world-theme-store` + `useWorldPalette` + `WorldThemeBridge`; wired canvas/lighting/neon; night = exact current look; day = first-draft. lint+typecheck+test+knip green.                                                    | In progress                    |
| 2026-06-20 | 9     | Boot sequence v1: `boot-store` + `BootSequence`/`BootOverlay`/`BootActions` (Radix dialog) + in-canvas `BootProgressReporter` (drei `useProgress`); once/session, skippable, reduced-motion-instant; "Enter with sound/muted" wired to exposed `useAudio().enable`. validate green (61 tests). | In progress                    |
