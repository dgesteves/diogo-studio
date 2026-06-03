# 0001 — Codebase migration sequencing (bottom-up, leaf-first)

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** @dgesteves
- **Related:** [`docs/architecture.md`](../architecture.md)

## Context

`docs/architecture.md` defines the target structure (layered + feature-first) and
a migration map from today's tree. The target enforces a single, one-directional
dependency graph:

```
app/  →  features/  →  components/ ─┐
                    →  server/  ────┼→  lib/  →  config/ , types/
                    →  content/ ────┘
```

The current tree diverges from this: shared chrome and feature UI are mixed under
`components/site/`, server-only agent code lives in `lib/agent/`, config and SEO
helpers sit loose in `lib/`, and route pages under `app/` carry composition that
belongs in features. We need a migration order that minimises risk and rework.

## Decision

Migrate **bottom-up — the reverse of the dependency arrow (leaf-first)** — in
small, independently reviewable slices, running `pnpm validate` after each.

Ordering principle: a layer is only moved once everything it depends on already
lives in its final location. This guarantees each import path is rewritten **once**.

### Slice order

1. **Foundational leaves** — `config/`, `lib/seo/`, `lib/utils/`, `styles/`.
   Pure leaves, no downward deps, lowest blast radius; establishes the single
   source of truth and clean import surfaces for everything above.
2. **`server/` core** — `lib/agent/*` → `server/ai/` with `import "server-only"`.
3. **Feature slices** — extract vertical slices into `features/<feature>/` with a
   curated `index.ts` public surface (career-graph, studio, command-menu, contact,
   inspector), plus chrome → `components/layout/`.
4. **App routing layer** — introduce `app/(marketing)/` route group and thin the
   root pages so they only compose.

### Rules per slice

- One slice per PR; keep each PR independently reviewable.
- Run `pnpm validate` (lint + typecheck + format:check + test + knip) after each.
- Use the `@/…` alias; cross-feature imports go through `index.ts` only.
- Add `import "server-only"` to every module moved into `server/`.
- Optional layers (`server/db`, `server/auth`, `messages/`, global `stores/`) land
  only when that capability exists.

## Consequences

- **Positive:** minimal churn (paths rewritten once), small safe PRs, green
  `pnpm validate` throughout, and a clear "definition of done" per slice.
- **Negative:** the tree is temporarily mixed (old + new locations coexist) until
  later slices land.
- **Neutral:** follow-up ADRs will record the deeper structural choices the
  architecture doc flags — the `features/` slicing model, the `lib/` vs `server/`
  split, and content-as-Velite.

## Migration progress

Bottom-up. Check items off as each slice merges (green `pnpm validate`).

### 1 — Foundational leaves

- [x] `lib/site-config.ts` → `config/site.ts`
- [x] `lib/structured-data.ts` (+ test) → `lib/seo/`
- [x] `lib/utils.ts` → `lib/utils/` (`cn.ts`)
- [x] `app/globals.css`, `app/mdx.css` → `src/styles/` (imported by root layout)

### 2 — `server/` core

- [x] `lib/agent/{retrieve,system-prompt}.ts` (+ test) → `server/ai/` (+ `import "server-only"`)
- [x] `lib/agent/types.ts` → `src/types/agent.ts` (isomorphic contract — imported by the client, so kept out of `server/`)
- [x] Installed `server-only`; `vitest.config.ts` stubs `server-only`/`client-only` to a no-op so jsdom tests pass

### 3 — Feature slices

- [x] `components/career-graph/*` + `scene/` → `features/career-graph/` (curated `index.ts`)
- [x] `content/career-graph.ts` (+ test) → `content/data/career-graph.ts` (kept whole as the shared source of truth — its pattern taxonomy is consumed by `/work`, `/writing`, cards, headers, and the agent script, so it stays out of the feature)
- [x] `scene/perf-reporter.tsx` → `components/r3f/` (shared R3F util used by career-graph **and** studio canvases)
- [x] `components/studio/*` → `features/studio/` (curated `index.ts`; `Studio` is the only public export)
- [x] `components/site/*` (command menu) → `features/command-menu/` (palette only: `command-menu` + `command-menu-ask`, public `CommandMenu`). `command-menu-context.tsx` → `components/providers/` (shared global UI-state + `useCommandMenu` hook) so chrome triggers the menu without a `components → features` edge. Triggers (`command-trigger`, `hero-ask-cta`) stay as shared chrome on the hook. Remaining edge: `providers/index.tsx` mounts `<CommandMenu />` — resolved in slice 4 when global feature-UI mounts move app-level. Same pattern to apply to `inspector`.
- [x] `components/site/*` (contact) → `features/contact/` (+ `lib/contact-schema.ts` → `schemas/contact.ts`; `components/emails/contact-notification.tsx` → `features/contact/emails/` to avoid a `components → features` import; route imports via `index.ts`)
- [x] `components/site/*` (inspector) → `features/inspector/` (curated `index.ts`, public `InspectorOverlay`). `inspector-overlay-context.tsx` → `components/providers/` (shared global UI-state + `useInspectorOverlay` hook) so chrome and server pages trigger the overlay without a `components → features` edge. `inspector-trigger.tsx` stays as shared chrome on the hook (consumed by `/colophon`). Same pattern as `command-menu`. Remaining edge: `providers/index.tsx` mounts `<InspectorOverlay />` — resolved in slice 4 when global feature-UI mounts move app-level.
- [x] `components/site/*` (chrome: nav, footer, mobile-nav, theme-toggle) → `components/layout/`. `command-trigger.tsx` moved too (nav-private sub-component, only consumed by `site-nav`); intra-shell imports stay relative. Only external edge rewritten: `app/layout.tsx` → `@/components/layout/{site-nav,site-footer}`. Page-level CTAs `hero-ask-cta.tsx` (homepage hero) and `inspector-trigger.tsx` (`/colophon`) are not app shell, so they stay in `components/site/` until their host pages/features are tackled.

### 4 — App routing layer

- [ ] Root route pages → `app/(marketing)/` route group, thinned to composition
  - [x] **4a — route groups:** `about`, `work`, `writing`, `uses`, `contact` → `app/(marketing)/`; `colophon` → `app/(legal)/`. Pure `git mv`, URLs unchanged (route groups don't affect routing), no logic touched. Home `page.tsx` left at root deliberately so it (and its test) move only once, in 4b. Note: a running Turbopack `next dev` must be restarted after the bulk dir renames — its watcher missed them, leaving a stale `.next/dev/types/validator.ts` + a `/uses` 404 until restart.
  - [ ] **4b — thin the home page:** extract `page.tsx` sections (`HeroSection`, `OperatingSection`, `StudioSection`, `TrustSection`) into `features/home/`, reduce the route to pure composition, then move the thinned page into `app/(marketing)/page.tsx`.
- [ ] `app/page.test.tsx` → relocated beside extracted units (keep `app/` route-only)
