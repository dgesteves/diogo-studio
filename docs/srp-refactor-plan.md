# SRP Refactor Plan

> **Living document.** Goal: review the entire `src/` tree and refactor every
> file so it strictly follows the **Single Responsibility Principle** — one file,
> one concern, one primary named export — per `.devin/rules/` and
> `docs/architecture.md`. Work proceeds **one section at a time** across multiple
> sessions; update this file as the source of truth for progress.

- **Status:** In progress
- **Last updated:** 2026-06-09
- **Sections complete:** 11 / 14

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
| 2   | Server core — `server/`                                   | 14    | Done        |
| 3   | UI primitives & infra — `ui` `seo` `og` `r3f` `providers` | 18    | Done        |
| 4   | Shared composites — `layout/`, `common/`                  | 15    | Done        |
| 5   | MDX — `components/mdx/`                                   | 21    | Done        |
| 6   | Content data — `content/`                                 | 12    | Done        |
| 7   | Routing layer — `app/`                                    | 24    | Done        |
| 8   | Feature: `command-menu`                                   | 17    | Done        |
| 9   | Feature: `contact`                                        | 10    | Done        |
| 10  | Feature: `career-graph`                                   | 21    | Done        |
| 11  | Feature: `studio`                                         | 28    | Done        |
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

**Status:** Done
**Watch for:** `import "server-only"` on every module; DAL vs service vs
orchestration separation; the retrieval pipeline (`retrieve-*`) is already split
by concern — confirm each step is single-purpose and that `rate-limit.ts` isn't
duplicated logic that belongs shared.

- [x] `src/server/ai/agent-index.ts`
- [x] `src/server/ai/agent-response.ts`
- [x] `src/server/ai/agent-stream.ts`
- [x] `src/server/ai/embed-query.ts`
- [x] `src/server/ai/retrieve.ts`
- [x] `src/server/ai/retrieve-bm25.ts`
- [x] `src/server/ai/retrieve-cosine.ts`
- [x] `src/server/ai/retrieve-keyword.ts`
- [x] `src/server/ai/retrieve-tokenize.ts`
- [x] `src/server/ai/retrieve-tunables.ts`
- [x] `src/server/ai/retrieve-types.ts`
- [x] `src/server/ai/system-prompt.ts`
- [x] `src/server/ai/retrieve.test.ts` `T`
- [x] `src/server/rate-limit.ts`

---

## Section 3 — UI primitives & infra (`ui`, `seo`, `og`, `r3f`, `providers`)

**Status:** Done
**Watch for:** primitives in `ui/` must have no app/domain imports; providers
should be thin client wrappers; `og-template-styles.ts` flagged below.

**`components/ui/`**

- [x] `src/components/ui/badge.tsx`
- [x] `src/components/ui/brand-icons.tsx`
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/kbd.tsx`
- [x] `src/components/ui/status-dot.tsx`

**`components/seo/`**

- [x] `src/components/seo/article-json-ld.tsx`
- [x] `src/components/seo/json-ld.tsx`

**`components/og/`**

- [x] `src/components/og/og-template.tsx`
- [x] `src/components/og/og-template-styles.ts` (verified: ~90 code lines, under cap)

**`components/r3f/`**

- [x] `src/components/r3f/perf-reporter.tsx`
- [x] `src/components/r3f/silence-clock-deprecation.ts`
- [x] `src/components/r3f/webgl-context-guard.tsx`

**`components/providers/`**

- [x] `src/components/providers/index.tsx`
- [x] `src/components/providers/lenis-provider.tsx`
- [x] `src/components/providers/motion-provider.tsx`
- [x] `src/components/providers/reduced-motion-provider.tsx`
- [x] `src/components/providers/reduced-motion-store.ts`
- [x] `src/components/providers/theme-provider.tsx`

---

## Section 4 — Shared composites (`layout/`, `common/`)

**Status:** Done
**Watch for:** app-shell pieces stay presentational; any domain logic/state
belongs in a feature, not here. `mobile-nav` and `site-footer` flagged below.

**`components/layout/`**

- [x] `src/components/layout/command-trigger.tsx`
- [x] `src/components/layout/mobile-nav-link.tsx`
- [x] `src/components/layout/mobile-nav.tsx` (verified: ~85 code lines, under cap)
- [x] `src/components/layout/site-footer.tsx` (verified: ~65 code lines, under cap)
- [x] `src/components/layout/site-nav.tsx`
- [x] `src/components/layout/theme-toggle.tsx`

**`components/common/`**

- [x] `src/components/common/article-body.tsx`
- [x] `src/components/common/article-header.tsx`
- [x] `src/components/common/article-header-links.tsx`
- [x] `src/components/common/article-outcomes.tsx`
- [x] `src/components/common/case-study-card.tsx`
- [x] `src/components/common/essay-card.tsx`
- [x] `src/components/common/next-article-link.tsx`
- [x] `src/components/common/pattern-badge.tsx`
- [x] `src/components/common/pattern-filter.tsx`

---

## Section 5 — MDX (`components/mdx/`)

**Status:** Done
**Watch for:** the `system-diagram-*` cluster mixes canvas rendering, geometry,
fallback rendering, and types — confirm each file owns exactly one of those.
Keep heavy/interactive canvas code in client leaves; types and geometry stay
pure.

- [x] `src/components/mdx/callout.tsx`
- [x] `src/components/mdx/components.tsx`
- [x] `src/components/mdx/decisions-log.tsx`
- [x] `src/components/mdx/mdx-content.tsx`
- [x] `src/components/mdx/metric-tile.tsx`
- [x] `src/components/mdx/outcome.tsx`
- [x] `src/components/mdx/sparkline.tsx`
- [x] `src/components/mdx/stack-list.tsx`
- [x] `src/components/mdx/timeline.tsx`
- [x] `src/components/mdx/toc.tsx`
- [x] `src/components/mdx/tradeoff.tsx`
- [x] `src/components/mdx/system-diagram.tsx`
- [x] `src/components/mdx/system-diagram-mount.tsx`
- [x] `src/components/mdx/system-diagram-canvas.tsx`
- [x] `src/components/mdx/system-diagram-canvas-map.ts`
- [x] `src/components/mdx/system-diagram-canvas-overlay.tsx`
- [x] `src/components/mdx/system-diagram-geometry.ts`
- [x] `src/components/mdx/system-diagram-types.ts`
- [x] `src/components/mdx/system-diagram-fallback.tsx`
- [x] `src/components/mdx/system-diagram-fallback-edge.tsx`
- [x] `src/components/mdx/system-diagram-fallback-node.tsx`

---

## Section 6 — Content data (`content/`)

**Status:** Done
**Watch for:** keep **data** separate from **logic** — `career-graph.ts`,
`*-helpers.ts`, `*-projection.ts` should each own one transformation; `*-types.ts`
must be runtime-free. Data lives in `content/data/`, derivation logic may belong
in the feature's `lib/`.

- [x] `src/content/data/about.ts`
- [x] `src/content/data/career-graph.ts`
- [x] `src/content/data/career-graph-edges.ts`
- [x] `src/content/data/career-graph-node-helpers.ts`
- [x] `src/content/data/career-graph-node-types.ts`
- [x] `src/content/data/career-graph-nodes.ts`
- [x] `src/content/data/career-graph-patterns.ts`
- [x] `src/content/data/career-graph-projection.ts`
- [x] `src/content/data/colophon.ts`
- [x] `src/content/data/operating.ts`
- [x] `src/content/data/uses.ts`
- [x] `src/content/data/career-graph.test.ts` `T`

---

## Section 7 — Routing layer (`app/`)

**Status:** Done
**Watch for:** `app/` is **routing only**. Pages/layouts must be thin — resolve
params + data, set metadata, compose UI from `features/`/`components/`. Push any
inline UI or logic out. Route handlers stay thin (validate → authorize →
delegate to `server/`). `work/[slug]/page.tsx` flagged below.

**Pages & layouts**

- [x] `src/app/layout.tsx` (thin root-shell composition; fonts via `next/font` are module-scope by requirement)
- [x] `src/app/(marketing)/page.tsx`
- [x] `src/app/(marketing)/about/page.tsx`
- [x] `src/app/(marketing)/contact/page.tsx` → extracted inline hero/composition to `features/contact` `Contact` view; page is now thin
- [x] `src/app/(marketing)/uses/page.tsx`
- [x] `src/app/(marketing)/work/page.tsx` → moved derivation to `lib/content/*`; header/empty-state to `components/common/*`
- [x] `src/app/(marketing)/work/[slug]/page.tsx` → replaced inline sort/next logic with `sortPublished` + `nextPublished` (now under cap)
- [x] `src/app/(marketing)/writing/page.tsx` → same extraction as `work/page.tsx`
- [x] `src/app/(marketing)/writing/[slug]/page.tsx` → same extraction as `work/[slug]/page.tsx`
- [x] `src/app/(legal)/colophon/page.tsx`

**Route states & special files**

- [x] `src/app/error.tsx`
- [x] `src/app/global-error.tsx`
- [x] `src/app/not-found.tsx`
- [x] `src/app/loading.tsx`

**Metadata / images**

- [x] `src/app/opengraph-image.tsx`
- [x] `src/app/icon.tsx`
- [x] `src/app/apple-icon.tsx`
- [x] `src/app/robots.ts`
- [x] `src/app/sitemap.ts`
- [x] `src/app/(marketing)/work/[slug]/opengraph-image.tsx`
- [x] `src/app/(marketing)/writing/[slug]/opengraph-image.tsx`

**Route handlers (`api/`)**

- [x] `src/app/api/chat/route.ts` (already exemplary: validate → rate-limit → delegate to `server/ai`)
- [x] `src/app/api/contact/route.ts` → moved Resend send to `server/email/send-contact-notification.ts`; route now validate → honeypot → rate-limit → delegate → map result
- [x] `src/app/api/health/route.ts`

**New files (created this section)**

- [x] `src/features/contact/components/contact.tsx` (new — `Contact` page view)
- [x] `src/server/email/send-contact-notification.ts` (new — server-only transactional sender)
- [x] `src/lib/content/sort-published.ts` (new — filter drafts + order)
- [x] `src/lib/content/filter-by-pattern.ts` (new — `filterByPattern` + `collectPatterns`)
- [x] `src/lib/content/next-published.ts` (new — adjacency for "next article")
- [x] `src/components/common/content-index-header.tsx` (new — shared listing header)
- [x] `src/components/common/content-empty-state.tsx` (new — shared empty-filter state)

---

## Section 8 — Feature: `command-menu`

**Status:** Done
**Watch for:** keep the `ask-*` UI presentational; agent request/sources logic
lives in hooks; store holds UI state only. `command-menu-ask.tsx` and
`command-menu-navigate.tsx` flagged below. Confirm `index.ts` exposes a curated
public API only.

**components/**

- [x] `src/features/command-menu/components/command-menu.tsx`
- [x] `src/features/command-menu/components/command-menu-actions.tsx`
- [x] `src/features/command-menu/components/command-menu-ask.tsx` (verified: ~95 code lines, under cap)
- [x] `src/features/command-menu/components/command-menu-footer.tsx`
- [x] `src/features/command-menu/components/command-menu-item.tsx`
- [x] `src/features/command-menu/components/command-menu-navigate.tsx` → replaced inline draft-filter + sort with shared `sortPublished` (now under cap by a wider margin)
- [x] `src/features/command-menu/components/ask-answer.tsx`
- [x] `src/features/command-menu/components/ask-answer-formatting.tsx`
- [x] `src/features/command-menu/components/ask-answer-surface.tsx`
- [x] `src/features/command-menu/components/ask-citation-list.tsx`
- [x] `src/features/command-menu/components/ask-suggestions.tsx`

**hooks/ • stores/ • surface**

- [x] `src/features/command-menu/hooks/use-ask-agent.ts`
- [x] `src/features/command-menu/hooks/ask-agent-request.ts`
- [x] `src/features/command-menu/hooks/ask-agent-sources.ts`
- [x] `src/features/command-menu/stores/command-menu-store.tsx`
- [x] `src/features/command-menu/types.ts`
- [x] `src/features/command-menu/index.ts`

---

## Section 9 — Feature: `contact`

**Status:** Done
**Watch for:** form is `"use client"` (RHF + zod resolver); schema is the single
source of truth shared with the route handler; email template/styles separated;
states component owns the loading/error/success matrix. `contact-form.tsx`
flagged below.

- [x] `src/features/contact/components/contact-form.tsx` (verified: ~84 code lines, under cap)
- [x] `src/features/contact/components/contact-form-fields.tsx`
- [x] `src/features/contact/components/contact-field.tsx`
- [x] `src/features/contact/components/contact-channels.tsx`
- [x] `src/features/contact/components/contact-honeypot.tsx`
- [x] `src/features/contact/components/contact-states.tsx`
- [x] `src/features/contact/emails/contact-notification.tsx`
- [x] `src/features/contact/emails/contact-notification-styles.ts`
- [x] `src/features/contact/schemas/contact.ts`
- [x] `src/features/contact/index.ts`

---

## Section 10 — Feature: `career-graph`

**Status:** Done
**Watch for:** R3F scene parts each own one mesh/effect; shaders/GLSL and viewport
math separated from components; accessible description stays presentational.
`grid-floor`, `camera-dolly`, `radar-sweep` flagged below.

**components/**

- [x] `src/features/career-graph/components/career-graph.tsx`
- [x] `src/features/career-graph/components/career-graph-canvas.tsx`
- [x] `src/features/career-graph/components/career-graph-svg.tsx`
- [x] `src/features/career-graph/components/career-graph-svg-viewport.ts`
- [x] `src/features/career-graph/components/career-graph-node.tsx`
- [x] `src/features/career-graph/components/career-graph-axis.tsx`
- [x] `src/features/career-graph/components/career-graph-defs.tsx`
- [x] `src/features/career-graph/components/career-graph-accessible-description.tsx`

**components/scene/**

- [x] `src/features/career-graph/components/scene/grid-floor.tsx` → extracted inline GLSL to `grid-floor-shaders.ts` (now 48 raw l)
- [x] `src/features/career-graph/components/scene/camera-dolly.tsx` (verified: under cap; 107 raw incl. 6-line eslint-disable block + blanks)
- [x] `src/features/career-graph/components/scene/radar-sweep.tsx` → extracted inline GLSL to `radar-sweep-shaders.ts` (now 46 raw l)
- [x] `src/features/career-graph/components/scene/heatmap-field.tsx`
- [x] `src/features/career-graph/components/scene/heatmap-field-shaders.ts`
- [x] `src/features/career-graph/components/scene/heatmap-noise-glsl.ts`
- [x] `src/features/career-graph/components/scene/particles.tsx`
- [x] `src/features/career-graph/components/scene/postprocessing.tsx`
- [x] `src/features/career-graph/components/scene/dev-hud.tsx`
- [x] `src/features/career-graph/components/scene/css-color.ts`
- [x] `src/features/career-graph/index.ts`

**New files (created this section)**

- [x] `src/features/career-graph/components/scene/grid-floor-shaders.ts` (new — extracted GLSL)
- [x] `src/features/career-graph/components/scene/radar-sweep-shaders.ts` (new — extracted GLSL)

---

## Section 11 — Feature: `studio`

**Status:** Done
**Watch for:** largest feature. Each scene prop/fixture owns one object; the
`screens/` canvas-texture drawing logic is pure (no React); fallback split from
live canvas. `terminal-screen.ts` flagged below. Keep R3F in client leaves and
the server shell lean.

**components/ (root)**

- [x] `src/features/studio/components/studio.tsx`
- [x] `src/features/studio/components/studio-canvas.tsx`
- [x] `src/features/studio/components/studio-fallback.tsx`
- [x] `src/features/studio/components/studio-fallback-monitor-outline.tsx`

**components/scene/**

- [x] `src/features/studio/components/scene/room.tsx`
- [x] `src/features/studio/components/scene/desk.tsx`
- [x] `src/features/studio/components/scene/desk-props.tsx`
- [x] `src/features/studio/components/scene/desk-decor.tsx`
- [x] `src/features/studio/components/scene/desk-extras.tsx`
- [x] `src/features/studio/components/scene/desk-fixtures.tsx`
- [x] `src/features/studio/components/scene/desk-input-devices.tsx`
- [x] `src/features/studio/components/scene/monitor-rig.tsx` (verified: ~85 code lines, under cap)
- [x] `src/features/studio/components/scene/chair.tsx`
- [x] `src/features/studio/components/scene/speakers.tsx`
- [x] `src/features/studio/components/scene/webcam.tsx`
- [x] `src/features/studio/components/scene/lighting.tsx`
- [x] `src/features/studio/components/scene/grid-floor.tsx`
- [x] `src/features/studio/components/scene/dust-motes.tsx`
- [x] `src/features/studio/components/scene/camera-idle.tsx`
- [x] `src/features/studio/components/scene/constants.ts`

**components/screens/**

- [x] `src/features/studio/components/screens/index.ts`
- [x] `src/features/studio/components/screens/canvas-texture.ts`
- [x] `src/features/studio/components/screens/code-screen.ts` → extracted pure `drawCode` to new `code-screen-draw.ts` (hook file is now React-only)
- [x] `src/features/studio/components/screens/code-screen-data.ts`
- [x] `src/features/studio/components/screens/metrics-screen.ts`
- [x] `src/features/studio/components/screens/metrics-screen-draw.ts`
- [x] `src/features/studio/components/screens/terminal-screen.ts` → split into hook (here) + new `terminal-screen-draw.ts` (pure draw) + `terminal-screen-data.ts` (LOG_POOL + types)

**surface**

- [x] `src/features/studio/index.ts`

**New files (created this section)**

- [x] `src/features/studio/components/screens/code-screen-draw.ts` (new — pure `drawCode`)
- [x] `src/features/studio/components/screens/terminal-screen-draw.ts` (new — pure `drawTerminal`)
- [x] `src/features/studio/components/screens/terminal-screen-data.ts` (new — `LOG_POOL` + `LogLine`/`LogTone` types)

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

| Date       | Section | File(s)                                                                            | Decision & rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-09 | 11      | `studio/screens/terminal-screen.ts`, `code-screen.ts` → new `*-draw.ts`/`-data.ts` | Aligned all three `screens/` to one structure so the canvas-drawing logic is pure (no React), per the section watch-for and the existing `metrics-screen-draw.ts` precedent: `*-screen.ts` is now only the `"use client"` texture hook (state + intervals + `texture.needsUpdate`), `*-screen-draw.ts` is the pure `draw*` function (React-free, no directive), and `*-screen-data.ts` holds static data. Split `terminal-screen.ts` (flagged "raw 105 l", ~84 code lines so already under the lint cap) into hook + new `terminal-screen-draw.ts` (`drawTerminal` + private `toneRGBA`) + `terminal-screen-data.ts` (`LOG_POOL` + `LogLine`/`LogTone` types, mirroring `code-screen-data.ts`); extracted `code-screen.ts`'s `drawCode` into new `code-screen-draw.ts` (data already lived in `code-screen-data.ts`). `metrics-screen.ts` was already compliant (`driftSeries` is a stochastic state-transition helper for the hook, not drawing — stays). Behavior-preserving (identical canvas output); `screens/index.ts` surface unchanged (draw/data files are screen-internal). `pnpm validate` green.                     |
| 2026-06-09 | 11      | `studio/` (rest, all root + `scene/`)                                              | Otherwise no changes — already well-factored and lint-clean. Server shell (`studio.tsx`) is the thin `"use client"` orchestrator (idle-prefetch + IntersectionObserver mount gate, `next/dynamic` ssr:false canvas, reduced-motion respected); `studio-canvas.tsx` composes R3F scene leaves; `studio-fallback.tsx` is the SSR SVG with its repeated monitor split into `studio-fallback-monitor-outline.tsx`. Each `scene/` file owns one object or a cohesive prop cluster (`desk-decor` = mug/plant/notebook, `desk-fixtures` = headphones/server-node, `desk-input-devices` = keyboard/mouse, `desk-extras` = lamp + fixtures), with shared geometry constants in `constants.ts`; `monitor-rig.tsx` (flagged "99 raw", ~85 code lines) keeps its private `Monitor` part with the rig — under cap and cohesive. R3F stays in client leaves; `camera-idle`/`dust-motes` own their per-frame loops.                                                                                                                                                                                                                             |
| 2026-06-09 | 10      | `career-graph/scene/grid-floor.tsx`, `radar-sweep.tsx` → new `*-shaders.ts`        | Extracted the inline GLSL `vertexShader`/`fragmentShader` strings out of both R3F mesh components into sibling `grid-floor-shaders.ts` / `radar-sweep-shaders.ts`, mirroring the existing `heatmap-field.tsx` → `heatmap-field-shaders.ts` precedent in the same folder. Each component now owns one concern (uniforms + frame loop + mesh) and imports its shader source; this also drops both flagged files well under the cap (grid-floor 114→48 raw, radar-sweep 102→46 raw). Behavior-preserving (identical shader text). `index.ts` surface unchanged (shaders are scene-internal).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-06-09 | 10      | `career-graph/` (rest, incl. `camera-dolly.tsx`)                                   | Otherwise no changes — the feature is already well-factored and lint-clean. `camera-dolly.tsx` (flagged "raw 107 l") is **under the lint cap** once its 6-line `eslint-disable` justification block + blanks are excluded; it stays one cohesive concern (drive the camera from scroll + pointer), since its DOM-subscription `useEffect` and per-frame `useFrame` share four refs and splitting them would force awkward cross-file ref passing. SVG figure (`career-graph-svg`/`-axis`/`-defs`/`-node`) is presentational and server-rendered; viewport math already lives in `career-graph-svg-viewport.ts`; the canvas (`career-graph-canvas`) composes scene leaves; `css-color.ts` is the shared `--var → THREE.Color` resolver. Noted (left as-is, per Section-5 precedent): the `sortedNodes` derivation is duplicated between `career-graph-svg` and `career-graph-accessible-description`, but each is a tiny one-line sort feeding a different render surface (SVG vs sr-only text) — not worth a shared file. `pnpm validate` green.                                                                                 |
| 2026-06-09 | 9       | `contact/` (all 10)                                                                | No changes: the feature already matches the documented `contact` anatomy in `docs/architecture.md`. `schemas/contact.ts` is the single source of truth (Zod schema + `ROLE_ALTITUDES` + `contactDefaults` + `z.infer` type) shared by both the form and `api/contact/route.ts`. The `"use client"` `contact-form.tsx` (flagged "raw 100 l") is **~84 code lines, under the cap** and owns exactly the RHF + zod-resolver island that POSTs to the route — sanctioned explicitly by the architecture anatomy, so its submit/state-machine is the form's documented responsibility, not stray business logic. Email template (`contact-notification.tsx`) is split from its styles (`contact-notification-styles.ts`, named color constants). `contact-states.tsx` owns the success/fallback terminal matrix; the loading state lives inline on the submit button. Left as-is (cohesive pairs, per the Section 3/5/8 precedent): `contact-field.tsx` (`Field` wrapper + shared `fieldBase` input class) and `contact-states.tsx` (`ContactSuccess` + `ContactFallback`). `index.ts` exposes only `Contact`. `pnpm validate` green. |
| 2026-06-09 | 8       | `command-menu/components/command-menu-navigate.tsx`                                | Replaced the inline `caseStudies/essays.filter((x) => !x.draft).sort((a, b) => a.order - b.order)` (computed twice per group) with two `sortPublished(...)` calls at the top of `NavigateView`. Reuses the Section-7 `lib/content/sort-published.ts` helper so draft-filtering + ordering lives in one place; removes content-derivation logic from a presentational component (DRY + SRP). Behavior-preserving: same `order`-ascending sequence, with `sortPublished`'s `publishedAt` desc tiebreaker (inert when `order` is unique).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-09 | 8       | `command-menu/` (all 17)                                                           | Otherwise no changes — feature is already well-factored and passes lint (so both flagged files, `command-menu-ask.tsx` ~95 code lines and `command-menu-navigate.tsx`, are under the 100-line cap). Boundaries are correct: `ask-*` components are presentational, the streaming fetch lives in `hooks/ask-agent-request.ts`, response decoding in `hooks/ask-agent-sources.ts`, UI state in the `use-ask-agent` hook + `command-menu-store` provider; `types.ts` is runtime-free; `index.ts` exposes a curated surface. Left as-is (cohesive multi-export pairs, per the Section 3/5 precedent): `command-menu-actions` (`ThemeGroup`/`ProfileGroup` navigate action groups), `command-menu-item` (`Item` + its `iconForPage` route→icon map), and `ask-agent-sources` (`safeText` + `decodeAgentSources` response helpers) — splitting each ~7–30-line pair into separate files would be over-engineering.                                                                                                                                                                                                                     |
| 2026-06-09 | 7       | `app/api/contact/route.ts` → `server/email/send-contact-notification.ts`           | Moved Resend client + email build + send + Sentry capture out of the route into a new server-only sender returning a `{ status: "sent" \| "unconfigured" \| "failed" }` result. Route is now thin (validate → honeypot → rate-limit → delegate → map result→HTTP). Matches `docs/architecture.md`'s named `server/email/` layer + the contact "thin route handler" pattern. The sender importing the feature email template (`features/contact/emails/...`) preserves the route's pre-existing deep import; sanctioned by the architecture's contact anatomy (template in feature, sender in `server/`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-09 | 7       | `app/(marketing)/contact/page.tsx` → `features/contact/components/contact.tsx`     | Extracted the entire inline hero + form + channels + back-link composition into a new `Contact` feature view; the route now just sets metadata and renders `<Contact />` — consistent with `about`/`uses`/`colophon`/`home`. `index.ts` now exports only `Contact`; `ContactForm`/`ContactChannels` became feature-internal (relative imports), so they were dropped from the public surface (knip-clean).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-09 | 7       | `work`/`writing` index + `[slug]` pages (4) + new `lib/content/*` & `common/*`     | Pushed business logic + duplicated UI out of the routing layer per "app/ = routing only". New isomorphic helpers `sortPublished`, `filterByPattern`/`collectPatterns`, `nextPublished` dedupe sort/filter/adjacency across 4 pages (removed redundant `as PatternId` casts — Velite's enum type already equals `PatternId`). New presentational `ContentIndexHeader` + `ContentEmptyState` (in `components/common`, which the rule names for shared composites/empty states) dedupe the index header + empty-filter markup across `work`/`writing`. `work/[slug]` is now under the lint cap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-09 | 7       | `app/` special files, metadata/images, `api/chat`, `api/health`                    | No changes: each is a single-concern Next.js special file already. Route states (`error`/`global-error`/`not-found`/`loading`) are presentational under the cap (error pair correctly `"use client"` + Sentry). Metadata/image files (`opengraph-image`, `icon`, `apple-icon`, `robots`, `sitemap`, the two slug OG images) each own one image/route descriptor. `api/chat` is the exemplary thin handler (validate → rate-limit → delegate to `server/ai`); `api/health` is trivial. `layout.tsx` is thin shell composition.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-09 | 6       | `content/data` (all 12)                                                            | No changes: the `career-graph` cluster already separates concerns — `*-node-types` (runtime-free types), `*-nodes`/`*-patterns` (data), `*-edges`/`*-projection` (derivation), `*-node-helpers` (accessors), `career-graph.ts` (pure barrel facade). Standalone `about`/`colophon`/`operating`/`uses` are each one typed dataset for one page; tests co-located in `career-graph.test.ts`. Noted (left as-is): `*-edges` and `*-patterns` co-locate small derivation/accessor logic with their data — it's intrinsic to producing/querying that data (single source of truth), so it stays in `content/data/` rather than moving to a feature `lib/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-09 | 5       | `components/mdx` (all 21)                                                          | No changes: every MDX block is one cohesive component (or a compound list/item pair like `Timeline`/`Phase`). The `system-diagram-*` cluster is already exemplary SRP — canvas render (`canvas`, `canvas-map`, `canvas-overlay`, `mount`), pure geometry/types (`geometry`, `types`), and SSR fallback (`fallback`, `fallback-edge`, `fallback-node`) each own exactly one concern; client/server boundaries correct. Noted (left as-is): a 5-entry kind→label map is duplicated between `canvas-overlay` and `fallback-node`, but each targets a different render surface (HTML vs SVG) — not worth a shared file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-09 | 4       | `components/{layout,common}` (all 15)                                              | No changes: every file is one presentational/interactive composite. App-shell pieces (`site-nav`, `mobile-nav`, `site-footer`, `theme-toggle`, `command-trigger`) stay presentational and pull only config + UI primitives — no domain logic. Flagged `mobile-nav` (~85 code lines) and `site-footer` (~65) verified under the lint cap. `common/` cards/headers compose smaller leaves; `pattern-filter` is a `"use client"` leaf owning its own URL-toggle handlers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-09 | 3       | `components/{ui,seo,og,r3f,providers}` (all 18)                                    | No changes: every file is single-concern. `ui/` primitives import only `cn`; `badge`/`button` use the standard cva `Component` + `variants` pattern; `brand-icons` is a cohesive 2-icon set sharing a private `Svg`. `og-template` (render) is split from `og-template-styles` (~90 code lines, under the cap). Providers are thin client wrappers; `reduced-motion-provider` (context+hook) is split from `reduced-motion-store` (external store).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-09 | 2       | `server/` (all 14 files)                                                           | No changes: every module is single-purpose with `import "server-only"`. The retrieval pipeline is already split by concern; `rate-limit.ts` is the single shared limiter consumed by both `api/chat` and `api/contact` (no duplication).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-09 | 2       | `server/ai/agent-response.ts`                                                      | Left as-is: cohesive "agent HTTP response" toolkit (`jsonResponse`/`textResponse`/`sourcesHeaderValue`/`buildCitations`/`REFUSAL_TEXT`) — 43 lines that serve the chat route's response path as one pipeline. Splitting `buildCitations` out would add churn without clarity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-09 | 2       | `server/ai/` flat structure                                                        | Left as-is: did not reorganize into `server/data/` + `server/services/` subdirs. `docs/architecture.md` lists `server/ai/` as the agent home; per-file SRP is satisfied and a directory reshuffle is out of scope for this pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-06-09 | 1       | `config/site.ts` → `config/navigation.ts`                                          | Split nav (`NavItem`, `primaryNav`) into the canonical `config/navigation.ts` (per `docs/architecture.md` layout). `site.ts` now owns only site identity + `getSiteUrl` ("name, url, social, defaults"). Updated 3 importers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-09 | 1       | `config/site.ts` → `content/data/operating.ts`                                     | Moved `operatingCompanies` out of `config/` (a content/copy list, not site config) into the content layer, co-located with `operatingAltitudes` as operating-history data. Updated `trust-section.tsx` and the agent-index script.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-06-09 | 1       | `lib/seo/root-metadata.ts`, `lib/seo/structured-data.ts`                           | Left as-is: each holds multiple exports but a single cohesive concern (root document head config; schema.org JSON-LD builders sharing one domain + constants). Splitting further would be over-engineering for tightly-coupled config.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-09 | 1       | telemetry stores, `validations/agent.ts`, `types/agent.ts`                         | Left as-is: store + its own snapshot type is the idiomatic `useSyncExternalStore` pattern; Zod schemas + `z.infer` types are the single source of truth; `types/agent.ts` is the actively-used global type re-export surface.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-06-09 | —       | `docs/srp-refactor-plan.md`                                                        | Created the living SRP plan; 14 sections, leaves-first ordering.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Notes & open questions

- Raw line counts here come from `wc -l` (includes blanks/comments); the lint cap
  excludes those, so a **(raw N l)** flag means "investigate," not "guaranteed
  violation." Confirm with `pnpm lint` per file.
- Test coverage is thin (4 test files for 224 sources). SRP splits are a good
  moment to add focused regression tests, but **test expansion is out of scope**
  for this plan unless explicitly requested.
- If a refactor changes a feature's public surface, update its `index.ts` and any
  importers in the same PR.
