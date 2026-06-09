# SRP Refactor Plan

> **Living document.** Goal: review the entire `src/` tree and refactor every
> file so it strictly follows the **Single Responsibility Principle** — one file,
> one concern, one primary named export — per `.devin/rules/` and
> `docs/architecture.md`. Work proceeds **one section at a time** across multiple
> sessions; update this file as the source of truth for progress.

- **Status:** In progress
- **Last updated:** 2026-06-09
- **Sections complete:** 1 / 14

## Purpose

The codebase already follows the feature-first + layered architecture. This plan
drives the next quality pass: make each file do exactly one job. It exists so
work can span many conversations without losing context — every session reads
this file, picks the next section, refactors it, and records the outcome here.

## How to use this document (per-session workflow)

1. **Pick the next section** that is `Not started` (respect the ordering —
   foundations and leaves first, features last).
2. Set that section's status to `In progress` and mark it in the dashboard.
3. For each file in the section's checklist, run the **SRP review checklist**
   below. Tick the box when the file passes (already compliant or refactored).
4. **Refactor** any file that fails: split along the seams in
   `project-structure.md`, keep one primary named export, stay under the
   100-line lint cap, preserve behavior.
5. **Record decisions** in the Decision Log (anything non-obvious: a split, a
   move, a new file, a deliberate "leave as-is").
6. **Run quality gates** (`pnpm validate`) before marking the section `Done`.
7. Update the **Last updated** date and the **dashboard** counts.

## What "SRP-compliant" means here

A file passes when **all** of the following hold:

- **One concern, one primary named export.** No mixing of rendering + data
  fetching + business logic in the same file.
- **Under the 100-line lint cap** (`max-lines`, blanks/comments excluded).
- **Correct layer.** Lives where `docs/architecture.md` says it should
  (`app/` routing-only, `lib/` isomorphic, `server/` server-only, etc.).
- **Right boundary marker.** `"use client"` only on interactive leaves;
  `import "server-only"` on server modules.
- **No magic values.** Named constants placed at the narrowest correct scope.
- **Types/schemas separated.** `types.ts` has no runtime code; Zod schemas are
  the single source of truth (`z.infer` for types).
- **Self-explanatory.** Clear names; no comments restating code.

### SRP review checklist (apply to every file)

- [ ] Single, nameable responsibility — could be summarized in one sentence
- [ ] One primary named export (framework-required defaults excepted)
- [ ] Within the 100-line cap (verify with lint, not raw `wc`)
- [ ] In the correct directory/layer; imports flow downward only
- [ ] Correct `"use client"` / `import "server-only"` boundary
- [ ] No data fetching or business logic inside a presentational component
- [ ] No magic literals; constants scoped correctly
- [ ] Types and Zod schemas live in the right place, not inlined with runtime code

## Status legend

- **Not started** — section not yet reviewed
- **In progress** — actively being reviewed/refactored
- **Done** — every file passes the checklist and `pnpm validate` is green
- Per file: `- [ ]` = pending, `- [x]` = passes (compliant or refactored)
- Flags: **(raw N l — verify)** = raw line count over ~100; confirm against the
  lint cap first. `T` = test file (exempt from `max-lines`, still must be SRP).

## Quality gates (Definition of Done per section)

Run before marking any section `Done`:

```bash
pnpm validate   # lint + typecheck + format:check + tests + knip
```

No behavior change unless explicitly noted; new files keep one named export and
stay under the cap.

## Progress dashboard

| #   | Section                                                   | Files | Status      |
| --- | --------------------------------------------------------- | ----- | ----------- |
| 1   | Foundations — `lib/`, `config/`, `types/`, `env.ts`       | 15    | Done        |
| 2   | Server core — `server/`                                   | 14    | Not started |
| 3   | UI primitives & infra — `ui` `seo` `og` `r3f` `providers` | 18    | Not started |
| 4   | Shared composites — `layout/`, `common/`                  | 15    | Not started |
| 5   | MDX — `components/mdx/`                                   | 21    | Not started |
| 6   | Content data — `content/`                                 | 12    | Not started |
| 7   | Routing layer — `app/`                                    | 24    | Not started |
| 8   | Feature: `command-menu`                                   | 17    | Not started |
| 9   | Feature: `contact`                                        | 10    | Not started |
| 10  | Feature: `career-graph`                                   | 19    | Not started |
| 11  | Feature: `studio`                                         | 28    | Not started |
| 12  | Feature: `about`                                          | 12    | Not started |
| 13  | Features: `home` `uses` `colophon` `easter-egg`           | 14    | Not started |
| 14  | Feature: `inspector`                                      | 9     | Not started |

_The section file lists follow below._

---

## Section 1 — Foundations (`lib/`, `config/`, `types/`, `env.ts`)

**Status:** Done
**Why first:** leaves of the dependency graph; everything imports these. A clean
SRP base here makes downstream refactors predictable.
**Watch for:** isomorphic-only code in `lib/` (no secrets/Node APIs); one helper
concern per file in `lib/utils/`; types files with zero runtime code; `env.ts`
as the single validated env surface.

- [x] `src/lib/utils/cn.ts`
- [x] `src/lib/hooks/use-in-view.ts`
- [x] `src/lib/hooks/use-is-client.ts`
- [x] `src/lib/seo/article-metadata.ts`
- [x] `src/lib/seo/root-metadata.ts`
- [x] `src/lib/seo/structured-data.ts`
- [x] `src/lib/seo/structured-data.test.ts` `T`
- [x] `src/lib/telemetry/constants.ts`
- [x] `src/lib/telemetry/perf-store.ts`
- [x] `src/lib/telemetry/web-vitals-store.ts`
- [x] `src/lib/validations/agent.ts`
- [x] `src/config/brand.ts`
- [x] `src/config/site.ts` → split: nav moved to `src/config/navigation.ts`; `operatingCompanies` moved to `src/content/data/operating.ts`
- [x] `src/types/agent.ts`
- [x] `src/env.ts`
- [x] `src/config/navigation.ts` (new — extracted nav)

---

## Section 2 — Server core (`server/`)

**Status:** Not started
**Watch for:** `import "server-only"` on every module; DAL vs service vs
orchestration separation; the retrieval pipeline (`retrieve-*`) is already split
by concern — confirm each step is single-purpose and that `rate-limit.ts` isn't
duplicated logic that belongs shared.

- [ ] `src/server/ai/agent-index.ts`
- [ ] `src/server/ai/agent-response.ts`
- [ ] `src/server/ai/agent-stream.ts`
- [ ] `src/server/ai/embed-query.ts`
- [ ] `src/server/ai/retrieve.ts`
- [ ] `src/server/ai/retrieve-bm25.ts`
- [ ] `src/server/ai/retrieve-cosine.ts`
- [ ] `src/server/ai/retrieve-keyword.ts`
- [ ] `src/server/ai/retrieve-tokenize.ts`
- [ ] `src/server/ai/retrieve-tunables.ts`
- [ ] `src/server/ai/retrieve-types.ts`
- [ ] `src/server/ai/system-prompt.ts`
- [ ] `src/server/ai/retrieve.test.ts` `T`
- [ ] `src/server/rate-limit.ts`

---

## Section 3 — UI primitives & infra (`ui`, `seo`, `og`, `r3f`, `providers`)

**Status:** Not started
**Watch for:** primitives in `ui/` must have no app/domain imports; providers
should be thin client wrappers; `og-template-styles.ts` flagged below.

**`components/ui/`**

- [ ] `src/components/ui/badge.tsx`
- [ ] `src/components/ui/brand-icons.tsx`
- [ ] `src/components/ui/button.tsx`
- [ ] `src/components/ui/kbd.tsx`
- [ ] `src/components/ui/status-dot.tsx`

**`components/seo/`**

- [ ] `src/components/seo/article-json-ld.tsx`
- [ ] `src/components/seo/json-ld.tsx`

**`components/og/`**

- [ ] `src/components/og/og-template.tsx`
- [ ] `src/components/og/og-template-styles.ts` **(raw 101 l — verify)**

**`components/r3f/`**

- [ ] `src/components/r3f/perf-reporter.tsx`
- [ ] `src/components/r3f/silence-clock-deprecation.ts`
- [ ] `src/components/r3f/webgl-context-guard.tsx`

**`components/providers/`**

- [ ] `src/components/providers/index.tsx`
- [ ] `src/components/providers/lenis-provider.tsx`
- [ ] `src/components/providers/motion-provider.tsx`
- [ ] `src/components/providers/reduced-motion-provider.tsx`
- [ ] `src/components/providers/reduced-motion-store.ts`
- [ ] `src/components/providers/theme-provider.tsx`

---

## Section 4 — Shared composites (`layout/`, `common/`)

**Status:** Not started
**Watch for:** app-shell pieces stay presentational; any domain logic/state
belongs in a feature, not here. `mobile-nav` and `site-footer` flagged below.

**`components/layout/`**

- [ ] `src/components/layout/command-trigger.tsx`
- [ ] `src/components/layout/mobile-nav-link.tsx`
- [ ] `src/components/layout/mobile-nav.tsx`
- [ ] `src/components/layout/site-footer.tsx`
- [ ] `src/components/layout/site-nav.tsx`
- [ ] `src/components/layout/theme-toggle.tsx`

**`components/common/`**

- [ ] `src/components/common/article-body.tsx`
- [ ] `src/components/common/article-header.tsx`
- [ ] `src/components/common/article-header-links.tsx`
- [ ] `src/components/common/article-outcomes.tsx`
- [ ] `src/components/common/case-study-card.tsx`
- [ ] `src/components/common/essay-card.tsx`
- [ ] `src/components/common/next-article-link.tsx`
- [ ] `src/components/common/pattern-badge.tsx`
- [ ] `src/components/common/pattern-filter.tsx`

---

## Section 5 — MDX (`components/mdx/`)

**Status:** Not started
**Watch for:** the `system-diagram-*` cluster mixes canvas rendering, geometry,
fallback rendering, and types — confirm each file owns exactly one of those.
Keep heavy/interactive canvas code in client leaves; types and geometry stay
pure.

- [ ] `src/components/mdx/callout.tsx`
- [ ] `src/components/mdx/components.tsx`
- [ ] `src/components/mdx/decisions-log.tsx`
- [ ] `src/components/mdx/mdx-content.tsx`
- [ ] `src/components/mdx/metric-tile.tsx`
- [ ] `src/components/mdx/outcome.tsx`
- [ ] `src/components/mdx/sparkline.tsx`
- [ ] `src/components/mdx/stack-list.tsx`
- [ ] `src/components/mdx/timeline.tsx`
- [ ] `src/components/mdx/toc.tsx`
- [ ] `src/components/mdx/tradeoff.tsx`
- [ ] `src/components/mdx/system-diagram.tsx`
- [ ] `src/components/mdx/system-diagram-mount.tsx`
- [ ] `src/components/mdx/system-diagram-canvas.tsx`
- [ ] `src/components/mdx/system-diagram-canvas-map.ts`
- [ ] `src/components/mdx/system-diagram-canvas-overlay.tsx`
- [ ] `src/components/mdx/system-diagram-geometry.ts`
- [ ] `src/components/mdx/system-diagram-types.ts`
- [ ] `src/components/mdx/system-diagram-fallback.tsx`
- [ ] `src/components/mdx/system-diagram-fallback-edge.tsx`
- [ ] `src/components/mdx/system-diagram-fallback-node.tsx`

---

## Section 6 — Content data (`content/`)

**Status:** Not started
**Watch for:** keep **data** separate from **logic** — `career-graph.ts`,
`*-helpers.ts`, `*-projection.ts` should each own one transformation; `*-types.ts`
must be runtime-free. Data lives in `content/data/`, derivation logic may belong
in the feature's `lib/`.

- [ ] `src/content/data/about.ts`
- [ ] `src/content/data/career-graph.ts`
- [ ] `src/content/data/career-graph-edges.ts`
- [ ] `src/content/data/career-graph-node-helpers.ts`
- [ ] `src/content/data/career-graph-node-types.ts`
- [ ] `src/content/data/career-graph-nodes.ts`
- [ ] `src/content/data/career-graph-patterns.ts`
- [ ] `src/content/data/career-graph-projection.ts`
- [ ] `src/content/data/colophon.ts`
- [ ] `src/content/data/operating.ts`
- [ ] `src/content/data/uses.ts`
- [ ] `src/content/data/career-graph.test.ts` `T`

---

## Section 7 — Routing layer (`app/`)

**Status:** Not started
**Watch for:** `app/` is **routing only**. Pages/layouts must be thin — resolve
params + data, set metadata, compose UI from `features/`/`components/`. Push any
inline UI or logic out. Route handlers stay thin (validate → authorize →
delegate to `server/`). `work/[slug]/page.tsx` flagged below.

**Pages & layouts**

- [ ] `src/app/layout.tsx`
- [ ] `src/app/(marketing)/page.tsx`
- [ ] `src/app/(marketing)/about/page.tsx`
- [ ] `src/app/(marketing)/contact/page.tsx`
- [ ] `src/app/(marketing)/uses/page.tsx`
- [ ] `src/app/(marketing)/work/page.tsx`
- [ ] `src/app/(marketing)/work/[slug]/page.tsx` **(raw 110 l — verify)**
- [ ] `src/app/(marketing)/writing/page.tsx`
- [ ] `src/app/(marketing)/writing/[slug]/page.tsx`
- [ ] `src/app/(legal)/colophon/page.tsx`

**Route states & special files**

- [ ] `src/app/error.tsx`
- [ ] `src/app/global-error.tsx`
- [ ] `src/app/not-found.tsx`
- [ ] `src/app/loading.tsx`

**Metadata / images**

- [ ] `src/app/opengraph-image.tsx`
- [ ] `src/app/icon.tsx`
- [ ] `src/app/apple-icon.tsx`
- [ ] `src/app/robots.ts`
- [ ] `src/app/sitemap.ts`
- [ ] `src/app/(marketing)/work/[slug]/opengraph-image.tsx`
- [ ] `src/app/(marketing)/writing/[slug]/opengraph-image.tsx`

**Route handlers (`api/`)**

- [ ] `src/app/api/chat/route.ts`
- [ ] `src/app/api/contact/route.ts`
- [ ] `src/app/api/health/route.ts`

---

## Section 8 — Feature: `command-menu`

**Status:** Not started
**Watch for:** keep the `ask-*` UI presentational; agent request/sources logic
lives in hooks; store holds UI state only. `command-menu-ask.tsx` and
`command-menu-navigate.tsx` flagged below. Confirm `index.ts` exposes a curated
public API only.

**components/**

- [ ] `src/features/command-menu/components/command-menu.tsx`
- [ ] `src/features/command-menu/components/command-menu-actions.tsx`
- [ ] `src/features/command-menu/components/command-menu-ask.tsx` **(raw 106 l — verify)**
- [ ] `src/features/command-menu/components/command-menu-footer.tsx`
- [ ] `src/features/command-menu/components/command-menu-item.tsx`
- [ ] `src/features/command-menu/components/command-menu-navigate.tsx` **(raw 102 l — verify)**
- [ ] `src/features/command-menu/components/ask-answer.tsx`
- [ ] `src/features/command-menu/components/ask-answer-formatting.tsx`
- [ ] `src/features/command-menu/components/ask-answer-surface.tsx`
- [ ] `src/features/command-menu/components/ask-citation-list.tsx`
- [ ] `src/features/command-menu/components/ask-suggestions.tsx`

**hooks/ • stores/ • surface**

- [ ] `src/features/command-menu/hooks/use-ask-agent.ts`
- [ ] `src/features/command-menu/hooks/ask-agent-request.ts`
- [ ] `src/features/command-menu/hooks/ask-agent-sources.ts`
- [ ] `src/features/command-menu/stores/command-menu-store.tsx`
- [ ] `src/features/command-menu/types.ts`
- [ ] `src/features/command-menu/index.ts`

---

## Section 9 — Feature: `contact`

**Status:** Not started
**Watch for:** form is `"use client"` (RHF + zod resolver); schema is the single
source of truth shared with the route handler; email template/styles separated;
states component owns the loading/error/success matrix. `contact-form.tsx`
flagged below.

- [ ] `src/features/contact/components/contact-form.tsx` **(raw 100 l — verify)**
- [ ] `src/features/contact/components/contact-form-fields.tsx`
- [ ] `src/features/contact/components/contact-field.tsx`
- [ ] `src/features/contact/components/contact-channels.tsx`
- [ ] `src/features/contact/components/contact-honeypot.tsx`
- [ ] `src/features/contact/components/contact-states.tsx`
- [ ] `src/features/contact/emails/contact-notification.tsx`
- [ ] `src/features/contact/emails/contact-notification-styles.ts`
- [ ] `src/features/contact/schemas/contact.ts`
- [ ] `src/features/contact/index.ts`

---

## Section 10 — Feature: `career-graph`

**Status:** Not started
**Watch for:** R3F scene parts each own one mesh/effect; shaders/GLSL and viewport
math separated from components; accessible description stays presentational.
`grid-floor`, `camera-dolly`, `radar-sweep` flagged below.

**components/**

- [ ] `src/features/career-graph/components/career-graph.tsx`
- [ ] `src/features/career-graph/components/career-graph-canvas.tsx`
- [ ] `src/features/career-graph/components/career-graph-svg.tsx`
- [ ] `src/features/career-graph/components/career-graph-svg-viewport.ts`
- [ ] `src/features/career-graph/components/career-graph-node.tsx`
- [ ] `src/features/career-graph/components/career-graph-axis.tsx`
- [ ] `src/features/career-graph/components/career-graph-defs.tsx`
- [ ] `src/features/career-graph/components/career-graph-accessible-description.tsx`

**components/scene/**

- [ ] `src/features/career-graph/components/scene/grid-floor.tsx` **(raw 114 l — verify)**
- [ ] `src/features/career-graph/components/scene/camera-dolly.tsx` **(raw 107 l — verify)**
- [ ] `src/features/career-graph/components/scene/radar-sweep.tsx` **(raw 102 l — verify)**
- [ ] `src/features/career-graph/components/scene/heatmap-field.tsx`
- [ ] `src/features/career-graph/components/scene/heatmap-field-shaders.ts`
- [ ] `src/features/career-graph/components/scene/heatmap-noise-glsl.ts`
- [ ] `src/features/career-graph/components/scene/particles.tsx`
- [ ] `src/features/career-graph/components/scene/postprocessing.tsx`
- [ ] `src/features/career-graph/components/scene/dev-hud.tsx`
- [ ] `src/features/career-graph/components/scene/css-color.ts`
- [ ] `src/features/career-graph/index.ts`

---

## Section 11 — Feature: `studio`

**Status:** Not started
**Watch for:** largest feature. Each scene prop/fixture owns one object; the
`screens/` canvas-texture drawing logic is pure (no React); fallback split from
live canvas. `terminal-screen.ts` flagged below. Keep R3F in client leaves and
the server shell lean.

**components/ (root)**

- [ ] `src/features/studio/components/studio.tsx`
- [ ] `src/features/studio/components/studio-canvas.tsx`
- [ ] `src/features/studio/components/studio-fallback.tsx`
- [ ] `src/features/studio/components/studio-fallback-monitor-outline.tsx`

**components/scene/**

- [ ] `src/features/studio/components/scene/room.tsx`
- [ ] `src/features/studio/components/scene/desk.tsx`
- [ ] `src/features/studio/components/scene/desk-props.tsx`
- [ ] `src/features/studio/components/scene/desk-decor.tsx`
- [ ] `src/features/studio/components/scene/desk-extras.tsx`
- [ ] `src/features/studio/components/scene/desk-fixtures.tsx`
- [ ] `src/features/studio/components/scene/desk-input-devices.tsx`
- [ ] `src/features/studio/components/scene/monitor-rig.tsx`
- [ ] `src/features/studio/components/scene/chair.tsx`
- [ ] `src/features/studio/components/scene/speakers.tsx`
- [ ] `src/features/studio/components/scene/webcam.tsx`
- [ ] `src/features/studio/components/scene/lighting.tsx`
- [ ] `src/features/studio/components/scene/grid-floor.tsx`
- [ ] `src/features/studio/components/scene/dust-motes.tsx`
- [ ] `src/features/studio/components/scene/camera-idle.tsx`
- [ ] `src/features/studio/components/scene/constants.ts`

**components/screens/**

- [ ] `src/features/studio/components/screens/index.ts`
- [ ] `src/features/studio/components/screens/canvas-texture.ts`
- [ ] `src/features/studio/components/screens/code-screen.ts`
- [ ] `src/features/studio/components/screens/code-screen-data.ts`
- [ ] `src/features/studio/components/screens/metrics-screen.ts`
- [ ] `src/features/studio/components/screens/metrics-screen-draw.ts`
- [ ] `src/features/studio/components/screens/terminal-screen.ts` **(raw 105 l — verify)**

**surface**

- [ ] `src/features/studio/index.ts`

---

## Section 12 — Feature: `about`

**Status:** Not started
**Watch for:** the `pixelated-portrait-*` cluster splits engine, config, frame,
sampler, canvas — confirm each owns one stage of the pipeline and the engine is
pure (no React). `pixelated-portrait-engine.ts` flagged below.

- [ ] `src/features/about/components/about.tsx`
- [ ] `src/features/about/components/about-section.tsx`
- [ ] `src/features/about/components/about-experience.tsx`
- [ ] `src/features/about/components/about-card-grids.tsx`
- [ ] `src/features/about/components/about-cta.tsx`
- [ ] `src/features/about/components/pixelated-portrait.tsx`
- [ ] `src/features/about/components/pixelated-portrait-canvas.tsx`
- [ ] `src/features/about/components/pixelated-portrait-engine.ts` **(raw 107 l — verify)**
- [ ] `src/features/about/components/pixelated-portrait-engine-config.ts`
- [ ] `src/features/about/components/pixelated-portrait-frame.ts`
- [ ] `src/features/about/components/pixelated-portrait-sampler.ts`
- [ ] `src/features/about/index.ts`

---

## Section 13 — Features: `home`, `uses`, `colophon`, `easter-egg`

**Status:** Not started
**Watch for:** home sections each own one band of the page; `easter-egg.tsx` and
`colophon.tsx` flagged below — split interaction/state from presentation if over
the cap.

**home/**

- [ ] `src/features/home/components/home.tsx`
- [ ] `src/features/home/components/hero-section.tsx` **(raw 106 l — verify)**
- [ ] `src/features/home/components/hero-ask-cta.tsx`
- [ ] `src/features/home/components/operating-section.tsx`
- [ ] `src/features/home/components/studio-section.tsx`
- [ ] `src/features/home/components/trust-section.tsx`
- [ ] `src/features/home/components/home.test.tsx` `T`
- [ ] `src/features/home/index.ts`

**uses/**

- [ ] `src/features/uses/components/uses.tsx`
- [ ] `src/features/uses/index.ts`

**colophon/**

- [ ] `src/features/colophon/components/colophon.tsx` **(raw 100 l — verify)**
- [ ] `src/features/colophon/index.ts`

**easter-egg/**

- [ ] `src/features/easter-egg/components/easter-egg.tsx` **(raw 105 l — verify)**
- [ ] `src/features/easter-egg/index.ts`

---

## Section 14 — Feature: `inspector`

**Status:** Not started
**Watch for:** overlay/panels presentational; store holds UI state; `*-format.ts`
and `*-route-js.ts` are pure helpers separated from components.

- [ ] `src/features/inspector/components/inspector-overlay.tsx`
- [ ] `src/features/inspector/components/inspector-panels.tsx`
- [ ] `src/features/inspector/components/inspector-motion-panel.tsx`
- [ ] `src/features/inspector/components/inspector-atoms.tsx`
- [ ] `src/features/inspector/components/inspector-trigger.tsx`
- [ ] `src/features/inspector/components/inspector-format.ts`
- [ ] `src/features/inspector/components/inspector-route-js.ts`
- [ ] `src/features/inspector/stores/inspector-overlay-store.tsx`
- [ ] `src/features/inspector/index.ts`

---

## Decision log

Record every non-obvious refactor decision (a split, a move, a new file, or a
deliberate "leave as-is"). Newest first.

| Date       | Section | File(s)                                                    | Decision & rationale                                                                                                                                                                                                                   |
| ---------- | ------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-09 | 1       | `config/site.ts` → `config/navigation.ts`                  | Split nav (`NavItem`, `primaryNav`) into the canonical `config/navigation.ts` (per `docs/architecture.md` layout). `site.ts` now owns only site identity + `getSiteUrl` ("name, url, social, defaults"). Updated 3 importers.          |
| 2026-06-09 | 1       | `config/site.ts` → `content/data/operating.ts`             | Moved `operatingCompanies` out of `config/` (a content/copy list, not site config) into the content layer, co-located with `operatingAltitudes` as operating-history data. Updated `trust-section.tsx` and the agent-index script.     |
| 2026-06-09 | 1       | `lib/seo/root-metadata.ts`, `lib/seo/structured-data.ts`   | Left as-is: each holds multiple exports but a single cohesive concern (root document head config; schema.org JSON-LD builders sharing one domain + constants). Splitting further would be over-engineering for tightly-coupled config. |
| 2026-06-09 | 1       | telemetry stores, `validations/agent.ts`, `types/agent.ts` | Left as-is: store + its own snapshot type is the idiomatic `useSyncExternalStore` pattern; Zod schemas + `z.infer` types are the single source of truth; `types/agent.ts` is the actively-used global type re-export surface.          |
| 2026-06-09 | —       | `docs/srp-refactor-plan.md`                                | Created the living SRP plan; 14 sections, leaves-first ordering.                                                                                                                                                                       |

## Notes & open questions

- Raw line counts here come from `wc -l` (includes blanks/comments); the lint cap
  excludes those, so a **(raw N l)** flag means "investigate," not "guaranteed
  violation." Confirm with `pnpm lint` per file.
- Test coverage is thin (4 test files for 224 sources). SRP splits are a good
  moment to add focused regression tests, but **test expansion is out of scope**
  for this plan unless explicitly requested.
- If a refactor changes a feature's public surface, update its `index.ts` and any
  importers in the same PR.
