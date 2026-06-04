# Rules alignment plan

`.devin/rules/` was added **after** most of this codebase was written, so parts
of it predate the rules. This document drives a **complete, multi-pass audit** of
the entire codebase against those rules, and tracks the fixes that follow. The
audit is deliberately split into sessions — one scan cannot reliably review every
file against every rule in a single go.

It has two parts:

- **Part 1 — Codebase audit (by area).** Every file, grouped into review batches.
  Each batch is one focused session: read every file in it against the audit
  checklist below and log what's non-compliant. A file isn't "reviewed" until its
  checkbox is ticked.
- **Part 2 — Remediation backlog.** The grouped fix work. **Seeded** from an
  initial broad scan (a head start, not the full audit), then confirmed and
  expanded as each Part 1 batch completes.

> Source of truth for _where code lives_ is `docs/architecture.md`. This file
> tracks _what is non-compliant_ and the work to fix it.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` won't
do (with a one-line reason).

## How the audit works

- Go **one batch at a time** in Part 1 — don't try to review everything at once.
- For each file, walk the **audit checklist** and record every violation as an
  item in Part 2 (with file + line).
- Tick a file once it's been read against the full checklist; tick the batch when
  all its files are done.
- Fixes land in Part 2 as independently reviewable chunks, each gated by
  `pnpm validate`.

## Audit checklist (apply to every file)

**Structure & boundaries** (`project-structure.md`, `nextjs-app-router.md`)

- [ ] Right location for its role (`app/` routing-only; feature vs shared vs
      `server` vs `lib`). Cross-feature imports only via a feature `index.ts`.
- [ ] `"use client"` only where required and at the leaves; `import "server-only"`
      on server-only modules. No secrets/data-access in client components.
- [ ] File ≤ ~200 lines, one concept per file, named export(s).

**TypeScript** (`typescript.md`)

- [ ] No `any`, no `@ts-ignore`/`@ts-expect-error`, no `as`/double-cast.
- [ ] External data (env, params, JSON, API, form) validated with Zod, types via
      `z.infer`. Explicit return types on exported functions; typed `Props`.
- [ ] `import type` for type-only imports; `type` over `interface` unless merging.

**Comments & naming** (`00-core.md`)

- [ ] No narration / JSDoc-prose / decorative dividers / `TODO` / commented-out
      code. Only machine directives + the rare genuine-gotcha comment.
- [ ] `kebab-case` files, `PascalCase` components, `useX` hooks, `is/has/can`
      booleans. No unexplained magic values (named + scoped correctly).

**React, styling & a11y** (`react-components-styling.md`)

- [ ] Declarative JSX, stable list keys, Rules of Hooks, `useEffect` last; no
      components defined inside components.
- [ ] `cn()` for conditional classes (no string concat), `cva` variants, design
      tokens (no arbitrary hex), mobile-first, no inline styles, dark mode,
      animations gated on `prefers-reduced-motion`.
- [ ] Semantic HTML, keyboard-operable, visible `:focus-visible`, icon-only
      controls have `aria-label`, inputs linked to `<label>`, `aria-current` on
      active nav. `next/image`/`next/font`/`next/script`/`next/dynamic`; no raw
      `<img>` or raw internal `<a>` (use `<Link>`).

**Errors, security & tests** (`observability-and-errors.md`,
`security-and-env.md`, `testing.md`)

- [ ] No stray `console.*`; errors caught at boundaries and reported (Sentry);
      full async-state matrix (loading/empty/error/success).
- [ ] Env only via `src/env.ts`; handlers/actions validate input + authorize +
      rate-limit; no secrets to client; no unsanitized `dangerouslySetInnerHTML`.
- [ ] Tests query by role/label/text (not test-ids), use `user-event`, no fixed
      timeouts; unit tests colocated, e2e under `e2e/`.

---

# Part 1 — Codebase audit (by area)

Each batch is a session. Audit every file against the checklist above, log
findings into Part 2, then tick the boxes.

| Batch | Area                                           | Files | Status |
| ----- | ---------------------------------------------- | ----- | ------ |
| A     | Tooling, config & env                          | 15    | `[x]`  |
| B     | `app/` routing layer                           | 23    | `[x]`  |
| C     | `components/ui` + `components/layout`          | 10    | `[x]`  |
| D     | `components/mdx`                               | 16    | `[x]`  |
| E     | `components/{common,seo,og,r3f,providers}`     | 14    | `[x]`  |
| F     | `features/career-graph`                        | 12    | `[x]`  |
| G     | `features/studio`                              | 5     | `[x]`  |
| H     | `features/{command-menu,inspector,easter-egg}` | 8     | `[x]`  |
| I     | `features/{home,contact}`                      | 12    | `[x]`  |
| J     | `server/` + `lib/`                             | 9     | `[x]`  |
| K     | `content/` + `config/` + `types/` + `styles/`  | 12    | `[x]`  |
| L     | `e2e/` + `scripts/`                            | 8     | `[x]`  |

**Part 1 audit complete** — every batch (A–L) has been read against the full
checklist. Part 2 below is no longer "preliminary": every backlog item has been
confirmed or expanded against the audited files.

### Batch A — Tooling, config & env `[x]`

- [x] `next.config.ts`
- [x] `tsconfig.json`
- [x] `eslint.config.mjs`
- [x] `vitest.config.ts`
- [x] `vitest.setup.ts`
- [x] `velite.config.ts`
- [x] `playwright.config.ts`
- [x] `postcss.config.mjs`
- [x] `commitlint.config.mjs`
- [x] `knip.json`
- [x] `components.json`
- [x] `package.json`
- [x] `instrumentation.ts`
- [x] `instrumentation-client.ts`
- [x] `src/env.ts`

**Audited — findings (logged to Part 2):**

- **No Content-Security-Policy** in `next.config.ts` `securityHeaders` (the
  security rule requires a CSP). → Phase 2.
- **Stale path in `components.json`**: `tailwind.css` points to
  `src/app/globals.css`, but the file now lives at `src/styles/globals.css`.
  → Phase 5.
- **Stale comment in `velite.config.ts`** references `src/content/career-graph.ts`
  (moved to `src/content/data/career-graph.ts`). → Phase 4/5.
- **`instrumentation.ts` duplicates** the `Sentry.init({…})` block for the
  `nodejs` and `edge` runtimes (identical config); the `0.1` sample rate is a
  magic number duplicated in `instrumentation-client.ts`. → Phase 1.
- **Verify Web Vitals capture** in `instrumentation-client.ts` (rule: capture
  client errors _and_ Web Vitals there) — today it only initialises Sentry.
  → Phase 1.
- **Comments policy** also affects config files: `src/env.ts`, `velite.config.ts`,
  `instrumentation-client.ts`, `next.config.ts`, `playwright.config.ts`,
  `commitlint.config.mjs` carry JSDoc/dividers/narration. → Phase 4.
- **Compliant, no action**: `tsconfig.json`, `vitest.config.ts`,
  `vitest.setup.ts`, `postcss.config.mjs`, `knip.json`, `package.json`.
- **Accepted**: bootstrap `process.env` reads in `next.config.ts`,
  `instrumentation*.ts`, `playwright.config.ts` (run before/outside the validated
  env module).

### Batch B — `app/` routing layer `[x]`

- [x] `src/app/layout.tsx`
- [x] `src/app/error.tsx`
- [x] `src/app/not-found.tsx`
- [x] `src/app/loading.tsx`
- [x] `src/app/icon.tsx`
- [x] `src/app/apple-icon.tsx`
- [x] `src/app/opengraph-image.tsx`
- [x] `src/app/robots.ts`
- [x] `src/app/sitemap.ts`
- [x] `src/app/(marketing)/page.tsx`
- [x] `src/app/(marketing)/about/page.tsx`
- [x] `src/app/(marketing)/contact/page.tsx`
- [x] `src/app/(marketing)/uses/page.tsx`
- [x] `src/app/(marketing)/work/page.tsx`
- [x] `src/app/(marketing)/work/[slug]/page.tsx`
- [x] `src/app/(marketing)/work/[slug]/opengraph-image.tsx`
- [x] `src/app/(marketing)/writing/page.tsx`
- [x] `src/app/(marketing)/writing/[slug]/page.tsx`
- [x] `src/app/(marketing)/writing/[slug]/opengraph-image.tsx`
- [x] `src/app/(legal)/colophon/page.tsx`
- [x] `src/app/api/chat/route.ts`
- [x] `src/app/api/contact/route.ts`
- [x] `src/app/api/health/route.ts`
- [ ] Missing file: add `src/app/global-error.tsx` (see Part 2 · Phase 1).

**Audited — findings (logged to Part 2):**

- **Route data/UI embedded in `app/`** — `about/page.tsx`, `uses/page.tsx`, and
  `colophon/page.tsx` hold large content arrays inline; `about` and `contact`
  define local helper components (`SectionLabel`, `Prose`, `ContactCard`).
  Move data to `content/`/`config/` and UI to a feature/`components`. → Phase 3/5.
- **Duplicated pattern logic** — `VALID_PATTERNS` + `parsePatternsFromQuery` are
  copy-pasted in `work/page.tsx` and `writing/page.tsx` (and the pattern list
  mirrors `velite.config.ts` + `career-graph`). → Phase 5.
- **Duplicated rate limiter** — `api/chat/route.ts` and `api/contact/route.ts`
  repeat the Upstash + in-memory-bucket limiter and `allow`/`clientIp`; extract
  to `src/server/` (already called out in `docs/architecture.md`). → Phase 5.
- **`/api/chat` input not Zod-validated** — hand-rolled `typeof` checks vs. the
  shared schema `/api/contact` uses. → Phase 2.
- **Duplicated `http://localhost:3000` fallback** in `layout.tsx`, `robots.ts`,
  `sitemap.ts`. → Phase 5. Confirmed `process.env.VERCEL` in `layout.tsx`
  (already Phase 2).
- **Array-index `key`** on outcomes in `work/[slug]/page.tsx:151`. → Phase 5.
- **Brand hex duplicated** across `icon.tsx`/`apple-icon.tsx`/`og-template`
  (accepted as inline hex inside `ImageResponse`, but dedupe to constants).
- **Comments**: JSDoc/dividers in `layout.tsx`, `sitemap.ts`, both route
  handlers, `work`/`writing` pages, and JSX section dividers in `about`/`uses`/
  `colophon`/`contact`. → Phase 4.
- **Confirmed (prior scan)**: `error.tsx` → Sentry (Phase 1); `console.*` in
  `api/chat` (Phase 1); `as unknown as` + unvalidated `agent-index.json`
  (Phase 2); `about`/`colophon`/`api/chat` over 200 lines (Phase 3).
- **Compliant, no action**: `not-found.tsx`, `loading.tsx`, `(marketing)/page.tsx`
  (thin), `opengraph-image.tsx` (+ `[slug]` variants), `icon.tsx`/`apple-icon.tsx`
  (satori requires inline styles), `work/page.tsx` + `writing/page.tsx` logic,
  the `[slug]` article pages, `api/contact/route.ts` (Zod, honeypot, rate-limit,
  Sentry, graceful 503), `api/health/route.ts`.

### Batch C — `components/ui` + `components/layout` `[x]`

- [x] `src/components/ui/badge.tsx`
- [x] `src/components/ui/brand-icons.tsx`
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/kbd.tsx`
- [x] `src/components/ui/status-dot.tsx`
- [x] `src/components/layout/command-trigger.tsx`
- [x] `src/components/layout/mobile-nav.tsx`
- [x] `src/components/layout/site-footer.tsx`
- [x] `src/components/layout/site-nav.tsx`
- [x] `src/components/layout/theme-toggle.tsx`

**Audited — findings (logged to Part 2):**

- **Arbitrary hex in `site-nav.tsx`** — the wordmark badge hardcodes
  `#262b33`/`#0d0f12`/`#22d3ee`/`#67e8f9`/`rgba(34,211,238,…)` in Tailwind
  classes (styling rule wants design tokens). Same brand hex is duplicated in
  `icon.tsx`/`apple-icon.tsx`/`og-template`. → Phase 5.
- **Props typing nits** — `BadgeProps` (`badge.tsx`) and `ButtonProps`
  (`button.tsx`) use `interface` with no declaration merging; rule prefers
  `type`. → Phase 5 / lint.
- **`button.tsx` `"use client"` likely unnecessary** — it only uses `Slot` +
  `forwardRef` (no hooks/state); verify it can be a Server Component to keep the
  client island smaller. → Phase 5.
- **Comments**: JSDoc narration in `brand-icons.tsx`, `kbd.tsx`, `status-dot.tsx`,
  `button.tsx`, `command-trigger.tsx`, `mobile-nav.tsx`, `site-footer.tsx`,
  `site-nav.tsx`, `theme-toggle.tsx`. → Phase 4.
- **Verify**: `status-dot.tsx` relies on a global `prefers-reduced-motion` safety
  net in `globals.css` — confirm it exists in Batch K.
- **Confirmed (prior)**: `command-trigger.tsx`/`mobile-nav.tsx` import command-menu
  state from `components/providers` (relocation already in Phase 5).
- **Compliant, no action**: strong a11y throughout (`aria-current`, `aria-label`,
  `sr-only` drawer title, `focus-visible` rings); all files well under 200 lines;
  `cn()` + `cva` used correctly; `"use client"` correct on the interactive
  layout files; `site-footer.tsx` stays a Server Component.

### Batch D — `components/mdx` `[x]`

- [x] `src/components/mdx/callout.tsx`
- [x] `src/components/mdx/components.tsx`
- [x] `src/components/mdx/decisions-log.tsx`
- [x] `src/components/mdx/mdx-content.tsx`
- [x] `src/components/mdx/metric-tile.tsx`
- [x] `src/components/mdx/outcome.tsx`
- [x] `src/components/mdx/sparkline.tsx`
- [x] `src/components/mdx/stack-list.tsx`
- [x] `src/components/mdx/system-diagram-canvas.tsx`
- [x] `src/components/mdx/system-diagram-fallback.tsx`
- [x] `src/components/mdx/system-diagram-mount.tsx`
- [x] `src/components/mdx/system-diagram-types.ts`
- [x] `src/components/mdx/system-diagram.tsx`
- [x] `src/components/mdx/timeline.tsx`
- [x] `src/components/mdx/toc.tsx`
- [x] `src/components/mdx/tradeoff.tsx`

**Audited — findings (logged to Part 2):**

- **Template-literal `className` concatenation instead of `cn()`** — conditional
  token classes are interpolated into strings in `callout.tsx`, `metric-tile.tsx`,
  `decisions-log.tsx`, and `system-diagram-canvas.tsx` (styling rule: never
  string-concat classes). → Phase 5.
- **Comments**: heavy JSDoc on nearly all 16 files. → Phase 4. A few are genuine
  gotchas worth keeping (the `<p><p>` invalid-HTML note in `outcome.tsx`, the
  `new Function` safety note in `mdx-content.tsx`, the `dynamic({ ssr: false })`
  rationale in `system-diagram-mount.tsx`).
- **Confirmed (prior)**: `system-diagram-fallback.tsx` is 220 lines (Phase 3 —
  split node/edge SVG renderers).
- **Accepted**: `mdx-content.tsx` evaluates compiled MDX via `new Function`
  (build-time, committed content — canonical Velite pattern) with a justified
  `eslint-disable react-hooks/static-components`; xyflow inline `style`/CSS
  tokens in the diagram canvas/fallback.
- **Compliant, no action**: Server-by-default with only `system-diagram-canvas`,
  `system-diagram-mount`, `toc` as client islands; `system-diagram` is an
  exemplary SSR-SVG-fallback + lazy `next/dynamic` + reduced-motion pattern;
  strong a11y (`role="img"` + `<title>`/`<desc>`, `figure`/`figcaption`,
  `aria-current` in `toc`, `role="group"` on metric tiles); design tokens used
  throughout; no `any`/casts.

### Batch E — `components/{common,seo,og,r3f,providers}` `[x]`

- [x] `src/components/common/article-header.tsx`
- [x] `src/components/common/case-study-card.tsx`
- [x] `src/components/common/pattern-filter.tsx`
- [x] `src/components/seo/json-ld.tsx`
- [x] `src/components/og/og-template.tsx`
- [x] `src/components/r3f/perf-reporter.tsx`
- [x] `src/components/r3f/webgl-context-guard.tsx`
- [x] `src/components/providers/index.tsx`
- [x] `src/components/providers/theme-provider.tsx`
- [x] `src/components/providers/motion-provider.tsx`
- [x] `src/components/providers/reduced-motion-provider.tsx`
- [x] `src/components/providers/lenis-provider.tsx`
- [x] `src/components/providers/command-menu-context.tsx`
- [x] `src/components/providers/inspector-overlay-context.tsx`

**Audited — findings (logged to Part 2):**

- **Pattern-chip JSX duplicated 3×** — the `<Badge tone="outline">` + colored
  dot built from `patternMeta[id].colorVar` (inline `color-mix`/`var(--…)`
  styles) is copy-pasted in `article-header.tsx`, `case-study-card.tsx`, and
  `pattern-filter.tsx`. Extract one `PatternBadge` (DRY). → Phase 5 (new).
- **Conditional classes via string ternary, not `cn()`** — `pattern-filter.tsx`
  swaps two full class strings on `allActive` (styling rule: compose with
  `cn()`, never concatenation). → Phase 5 (added to the `cn()` list).
- **Feature state in shared providers (confirmed)** —
  `command-menu-context.tsx` → `features/command-menu/stores/` and
  `inspector-overlay-context.tsx` → `features/inspector/stores/`; `index.tsx`
  imports both and rewires once they move. → Phase 5.
- **`reduced-motion-provider.tsx` 213 lines (confirmed Phase 3)** — split the
  three external stores (system / low-power / override) into helper modules; it
  also carries the most decorative `/* --- */` dividers in the batch. The
  `navigator as Navigator & { connection?… }` single cast for the Network
  Information API is accepted (not in the TS DOM lib).
- **Comments**: JSDoc narration on all 14 files (and dividers in
  `reduced-motion-provider.tsx`). → Phase 4. Keep only the trimmed
  `preventDefault` gotcha in `webgl-context-guard.tsx`. Drop the stale
  `@/lib/structured-data` path in `json-ld.tsx` (now `@/lib/seo/structured-data`)
  when de-commenting.
- **Explicit return types missing** on most exported components/providers here
  (`ArticleHeader`, `CaseStudyCard`, `PatternFilter`, `JsonLd`, `renderOgImage`,
  `PerfReporter`, `WebGLContextGuard`, `AppProviders`, the four providers). The
  hooks (`useCommandMenu`, `useInspectorOverlay`, `useReducedMotionPreference`)
  already declare them. → Phase 5 (best caught via the Phase 6 lint rule).
- **Confirmed (prior)**: `webgl-context-guard.tsx` dev `console.info` (Phase 1)
  - `NODE_ENV` read (Phase 2, accepted as standard); brand hex in
    `og-template.tsx` duplicated with `icon`/`apple-icon`/`site-nav` (Phase 5).
- **Memoization** — `useMemo`/`useCallback` in `pattern-filter.tsx`,
  `reduced-motion-provider.tsx`, `command-menu-context.tsx`,
  `inspector-overlay-context.tsx` fold into the Phase 0 React Compiler decision.
- **Compliant, no action**: correct Server/Client split (`article-header`,
  `case-study-card`, `json-ld`, `og-template`, `providers/index` stay server;
  the interactive/3D/provider files are correct client leaves); strong a11y in
  `pattern-filter.tsx` (`role="group"`, `aria-label`, `aria-pressed`) and the
  cards; `useSyncExternalStore` is the right primitive in
  `reduced-motion-provider.tsx`; the per-pattern inline `style` (dynamic
  `var(--…)`/`color-mix`) is the accepted CSS-variable token pattern;
  `json-ld.tsx` `dangerouslySetInnerHTML` already accepted (Out of scope).

### Batch F — `features/career-graph` `[x]`

- [x] `src/features/career-graph/index.ts`
- [x] `src/features/career-graph/components/career-graph.tsx`
- [x] `src/features/career-graph/components/career-graph-canvas.tsx`
- [x] `src/features/career-graph/components/career-graph-svg.tsx`
- [x] `src/features/career-graph/components/scene/camera-dolly.tsx`
- [x] `src/features/career-graph/components/scene/css-color.ts`
- [x] `src/features/career-graph/components/scene/dev-hud.tsx`
- [x] `src/features/career-graph/components/scene/grid-floor.tsx`
- [x] `src/features/career-graph/components/scene/heatmap-field.tsx`
- [x] `src/features/career-graph/components/scene/particles.tsx`
- [x] `src/features/career-graph/components/scene/postprocessing.tsx`
- [x] `src/features/career-graph/components/scene/radar-sweep.tsx`

**Audited — findings (logged to Part 2):**

- **Server SVG dragged into the client bundle (new, medium)** — the feature
  barrel `index.ts` re-exports all three symbols from the **`"use client"`**
  `career-graph.tsx`, which itself re-exports `CareerGraphSvg`
  (`CareerGraphFigure`) + `CareerGraphAccessibleDescription` from
  `career-graph-svg.tsx`. Routing the server, LCP-owning SVG (and its
  `@/content/data/career-graph` import) through a client boundary makes it a
  client component — contradicting the file's own "Server-rendered. Owns LCP"
  intent and shipping needless JS. Confirmed consumer: `hero-section.tsx` imports
  all three from `@/features/career-graph`. Fix: export `CareerGraphSvg` +
  `CareerGraphAccessibleDescription` from the barrel **directly** from
  `career-graph-svg.tsx`; keep only `CareerGraphAtmosphere` coming from the
  client module. → Phase 5 (new).
- **Conditional classes via array `.join(" ")`** — `career-graph.tsx:90-94`
  concatenates classes instead of `cn()`. → Phase 5 (added to the `cn()` list).
- **File size (confirmed Phase 3)** — `career-graph-svg.tsx` 347 lines (extract
  `Axis`/`Node`/`<defs>`); `heatmap-field.tsx` 258 lines (move the GLSL
  vertex/fragment strings to a co-located shader module). Both already listed.
- **`process.env.NEXT_PUBLIC_PERF_HUD` (confirmed Phase 2)** — `dev-hud.tsx:23`
  reads it raw; migrate to the `env.ts` client schema. `NODE_ENV` reads
  (`dev-hud.tsx`, dead-code-eliminated) stay accepted.
- **Comments**: JSDoc narration on every file in the batch. → Phase 4. Keep the
  trimmed perf gotchas (DPR cap / `frameloop` in `career-graph-canvas.tsx`, the
  `getBoundingClientRect` rAF-coalescing note in `camera-dolly.tsx`/
  `heatmap-field.tsx`, and the OKLCH-rasterize rationale in `css-color.ts`).
- **TS nits → Phase 6 lint** — pervasive non-null assertions on R3F uniforms
  (`u.uTime!.value`) and `arr[idx]!` in `particles.tsx`, plus three.js `as`
  casts (`pts.geometry as …`, `getAttribute(...) as …`, `attr.array as …`) and
  the `Object.fromEntries(...) as Record<NodeId, …>` in `career-graph-svg.tsx`.
  Accepted as canonical three.js typing friction; flag, don't churn.
- **Memoization** — `useMemo` for R3F `uniforms`/colors across the scene files
  folds into the Phase 0 React Compiler decision (these are arguably justified
  for stable R3F references, not "just in case").
- **Explicit return types missing** on every exported component here. → Phase 5
  (caught by the Phase 6 lint rule). `css-color.ts` already declares them.
- **Compliant, no action**: correct client islands (all scene/canvas files +
  the atmosphere wrapper are `"use client"`; `career-graph-svg.tsx` is the
  server surface); excellent a11y (`role="group"`, `aria-labelledby`, native
  `<title>`, `aria-label` Links, `sr-only` long-form description, `aria-hidden`
  on the decorative canvas); reduced-motion + in-view gating before the Canvas
  mounts; `next/dynamic({ ssr: false })` for the WebGL bundle; design-token
  colors resolved via `css-color.ts`; named consts for scene bounds. GLSL
  comments inside shader strings and the justified
  `eslint-disable react-hooks/immutability` in `camera-dolly.tsx` are accepted.

### Batch G — `features/studio` `[x]`

- [x] `src/features/studio/index.ts`
- [x] `src/features/studio/components/studio.tsx`
- [x] `src/features/studio/components/studio-canvas.tsx`
- [x] `src/features/studio/components/studio-fallback.tsx`
- [x] `src/features/studio/components/screens.tsx`

**Audited — findings (logged to Part 2):**

- **File size (confirmed Phase 3)** — `studio-canvas.tsx` 526 lines and
  `screens.tsx` 447 lines, the two largest non-test files in the repo. Canvas:
  split each scene object (`Lighting`, `CameraIdle`, `GridFloor`, `Desk`,
  `Chair`, `DeskProps`+props, `Speakers`, `MonitorRig`/`Monitor`) into its own
  module. Screens: split the three independent screens (terminal / code /
  metrics) + the shared `createCanvasTexture` helper. → Phase 3.
- **Hardcoded scene colors not resolved via `css-color.ts` (new, low)** —
  `studio-canvas.tsx` (THREE material colors) and `screens.tsx` (canvas-2D
  paint) hardcode dozens of hex/rgba literals, whereas the career-graph scene
  resolves design tokens through `resolveCssVarColor`. The brand cyans
  (`#22d3ee`, `#7dd3fc`) duplicate tokens and should resolve via `css-color.ts`;
  the remaining material/paint shades have no token equivalent and are accepted
  as scene-specific. → Phase 5 (consistency).
- **Conditional classes via array `.join(" ")`** — `studio.tsx` (lines 89-92,
  106-109) and `studio-fallback.tsx:20` concatenate classes instead of `cn()`.
  → Phase 5 (added to the `cn()` list).
- **`interface LogLine` → `type`** — `screens.tsx:49` uses `interface` with no
  declaration merging. → Phase 5 (added to the props/type nits item).
- **Comments**: JSDoc + decorative `/* === / --- */` dividers across
  `studio.tsx`, `studio-fallback.tsx`, `studio-canvas.tsx`, `screens.tsx`.
  → Phase 4 (canvas/screens already listed; added the other two).
- **TS nits → Phase 6 lint** — non-null assertions in `screens.tsx`
  (`visible[i]!`, `LOG_POOL[...]!`, `row.data[i]!`) and the
  `requestIdleCallback` `as number` cast in `studio.tsx:63`. Accepted as
  canonical friction; flag, don't churn.
- **Memoization** — `useMemo` for the one-time `CanvasTexture` pairs in
  `screens.tsx` folds into the Phase 0 React Compiler decision (justified here,
  not "just in case").
- **Explicit return types missing** on `Studio`, `StudioFallback`/
  `MonitorOutline`, every `studio-canvas` sub-component, and the `screens.tsx`
  draw/helper functions. The three `useXScreenTexture` hooks already declare
  `: THREE.CanvasTexture`. → Phase 5 (Phase 6 lint catches these).
- **Compliant, no action**: `studio.tsx` is a correct client island that
  prefetches + IO-gates + reduced-motion-gates the `next/dynamic({ ssr: false })`
  canvas; `studio-fallback.tsx` is a Server Component owning the SSR/LCP frame
  plus a11y (`role="img"`, `aria-labelledby`, `<title>`) with the canvas
  `aria-hidden`; the screen timers only run once the canvas mounts (so
  reduced-motion users never pay for them); `index.ts` exporting the client
  `Studio` is fine (no server surface dragged through, unlike career-graph); the
  justified `eslint-disable react-hooks/immutability` (CanvasTexture) is
  accepted. Confirm the `console-grid` animation in `studio-fallback.tsx` honors
  the global `prefers-reduced-motion` net in Batch K.

### Batch H — `features/{command-menu,inspector,easter-egg}` `[x]`

- [x] `src/features/command-menu/index.ts`
- [x] `src/features/command-menu/components/command-menu.tsx`
- [x] `src/features/command-menu/components/command-menu-ask.tsx`
- [x] `src/features/inspector/index.ts`
- [x] `src/features/inspector/components/inspector-overlay.tsx`
- [x] `src/features/inspector/components/inspector-trigger.tsx`
- [x] `src/features/easter-egg/index.ts`
- [x] `src/features/easter-egg/components/easter-egg.tsx`

**Audited — findings (logged to Part 2):**

- **Unvalidated agent payload cast (new, medium)** — `command-menu-ask.tsx:116`
  does `JSON.parse(json) as AgentSourcesPayload` on the base64 `x-agent-sources`
  HTTP header (external data at the boundary). Validate with a Zod schema +
  `safeParse` and derive the type via `z.infer`, like the server-side items.
  → Phase 2 (new). The decode also uses the deprecated `escape()`
  (`:115`); swap for a `TextDecoder`-based UTF-8 decode.
- **Unsanitized agent-rendered link hrefs (new, medium)** — `renderFormatting`
  in `command-menu-ask.tsx:505` renders `[text](url)` from streamed model
  output via a raw `<a href={m[4]}>`. Arbitrary model hrefs (incl.
  `javascript:`) are an injection surface, and internal links should use
  `<Link>`. Restrict to `http(s)`/relative and route internal hrefs through
  `next/link`. → Phase 2 (security, new).
- **File size (confirmed Phase 3)** — `command-menu-ask.tsx` 552, `command-menu.tsx`
  388, `inspector-overlay.tsx` 321. Decompose: ask → extract `Suggestions`/
  `AnswerSurface`/`CitationList`/`CitationChip`, the answer renderer
  (`renderAnswer`/`renderInline`/`renderFormatting`) into a module, and the
  fetch/stream logic into a `use-ask-agent` hook; command-menu → extract
  `NavigateView`, `Footer`/`ModeTab`, `Item`/`iconForPage`; inspector-overlay →
  extract `MotionPanel`, the presentational atoms (`Panel`/`Vital`/`Stat`/
  `Signal`), and the format helpers.
- **Feature state in shared providers (confirmed Phase 5)** — `command-menu.tsx`
  imports `useCommandMenu`; `inspector-overlay.tsx` + `inspector-trigger.tsx`
  import `useInspectorOverlay`. Relocations already queued; rewire these imports
  when the stores move.
- **Comments**: JSDoc + decorative `/* --- */` dividers in `command-menu.tsx`,
  `command-menu-ask.tsx`, `inspector-overlay.tsx`, `inspector-trigger.tsx`,
  `easter-egg.tsx`. → Phase 4 (ask already listed; added the rest).
- **TS nits → Phase 6 lint** — `as` casts on DOM/error shapes
  (`performance.getEntriesByType(...) as PerformanceResourceTiming[]` in
  `inspector-overlay.tsx:55`; `(err as { name?: string }).name` in
  `command-menu-ask.tsx`). Accepted as DOM/error-narrowing friction.
- **Minor SSOT** — `inspector-overlay.tsx:163-164` hardcodes the "1.25 MB"
  size-limit budget as a string; source it from config alongside `pnpm size`.
- **Explicit return types missing** on the components in all three features
  (the helpers/renderers already declare them). → Phase 5 (Phase 6 lint).
- **Memoization** — `useCallback` across command-menu/ask/inspector folds into
  the Phase 0 React Compiler decision.
- **Compliant, no action**: `cn()` used correctly throughout this batch (no
  string-concat classes — the styling rule is followed here); exemplary a11y
  (Radix `Dialog` + `VisuallyHidden` title, `role="tablist"/"tab"`,
  `aria-selected`, `aria-live="polite"` + `role="alert"` answer surface,
  `role="region"/"group"`, `aria-pressed`, focus-visible rings everywhere);
  `command-menu-ask.tsx` ships the full async-state matrix via the `AskStatus`
  discriminated union (idle/streaming/done/refused/rate-limited/error/
  unconfigured) with abort-on-unmount — a model observability pattern;
  `inspector-overlay.tsx` lazy-imports `web-vitals` and only mounts its subtree
  while open, uses `useSyncExternalStore`, and gates animations on
  `!reducedMotion`; `easter-egg.tsx` renders a static pill under reduced-motion
  and is correctly `aria-hidden`; all barrels are clean.

### Batch I — `features/{home,contact}` `[x]`

- [x] `src/features/home/index.ts`
- [x] `src/features/home/components/home.tsx`
- [x] `src/features/home/components/home.test.tsx`
- [x] `src/features/home/components/hero-section.tsx`
- [x] `src/features/home/components/hero-ask-cta.tsx`
- [x] `src/features/home/components/operating-section.tsx`
- [x] `src/features/home/components/studio-section.tsx`
- [x] `src/features/home/components/trust-section.tsx`
- [x] `src/features/contact/index.ts`
- [x] `src/features/contact/components/contact-form.tsx`
- [x] `src/features/contact/emails/contact-notification.tsx`
- [x] `src/features/contact/schemas/contact.ts`

**Audited — findings (logged to Part 2):**

- **Mixed client+server barrel imported by a server route (new, low-med)** —
  `api/contact/route.ts:23` imports `{ ContactNotification, contactSchema }`
  from `@/features/contact`, whose `index.ts` also re-exports the `"use client"`
  `ContactForm` (pulling `react-hook-form`/`sonner`). The `"use client"`
  boundary limits actual server-bundle impact, but mixed barrels defeat
  tree-shaking — import the isomorphic schema + server email directly
  (or split the barrel). Mirror of the career-graph barrel finding. → Phase 5.
- **Section content hardcoded in a component (new, low)** —
  `operating-section.tsx` embeds the three operating-mode cards (org names +
  copy) inline; per project-structure this belongs in `config/`/`content/`.
  Extends the Batch-B "route data living in `app/`" theme to feature sections.
  → Phase 5.
- **Test mirrors a constant instead of importing it (new, low)** —
  `home.test.tsx:86-90` re-hardcodes `PUBLISHED_CASE_STUDY_SLUGS` (the comment
  even says "Mirror …"); import it from `career-graph.ts` so the assertion can't
  drift. → Phase 5 (DRY).
- **File size (confirmed Phase 3)** — `contact-form.tsx` 271 lines; extract
  `Field`, the success/fallback states, and the honeypot.
- **Career-graph barrel consumer (confirmed Phase 5)** — `hero-section.tsx`
  imports `CareerGraphFigure`/`…AccessibleDescription` from the client barrel;
  rewires when that export is fixed.
- **Feature state in shared providers (confirmed Phase 5)** — `hero-ask-cta.tsx`
  (`useCommandMenu`) and `home.test.tsx` (`CommandMenuProvider`).
- **Brand hex (confirmed Phase 5)** — `contact-notification.tsx` redefines
  `#22d3ee` etc.; inline hex is accepted inside the email (no CSS vars there),
  but fold it into the brand-token dedup list.
- **Comments**: JSDoc/JSX narration in `home.tsx`, `hero-section.tsx`,
  `hero-ask-cta.tsx`, `studio-section.tsx`, `contact-form.tsx`,
  `contact-notification.tsx`, `schemas/contact.ts`, and `home.test.tsx`
  (keep the honeypot gotcha in the schema). → Phase 4.
- **Explicit return types missing** on every exported component here. → Phase 5
  (Phase 6 lint). Minor: `hero-section.tsx` inline `minHeight`/`aspectRatio`
  styles could be Tailwind arbitrary values; `contact-form.tsx` hand-types the
  `/api/contact` JSON response instead of validating it.
- **Compliant, no action**: `schemas/contact.ts` is a model isomorphic Zod SSOT
  shared by the client form and the API route (`z.infer`, `as const`);
  `contact-form.tsx` is exemplary — `react-hook-form` + `zodResolver`,
  `aria-invalid` + `role="alert"` + linked `<label>`s + honeypot + `role="status"`
  success/fallback + `noValidate`, a graceful 503 fallback, and a discriminated
  `FormState`; `home.test.tsx` queries by role/name/text, is colocated, and uses
  no test-ids/fixed-timeouts (no `user-event` needed — assertions only); all
  home sections are Server Components by default (only `hero-ask-cta` is client);
  strong a11y throughout (`role="region"`, `aria-labelledby`, `figure`/
  `figcaption`, `sr-only` captions); `studio-section.tsx`/`trust-section.tsx`
  source data via the feature barrel / config correctly; email inline styles
  accepted.

### Batch J — `server/` + `lib/` `[x]`

- [x] `src/server/ai/retrieve.ts`
- [x] `src/server/ai/retrieve.test.ts`
- [x] `src/server/ai/system-prompt.ts`
- [x] `src/lib/hooks/use-is-client.ts`
- [x] `src/lib/seo/structured-data.ts`
- [x] `src/lib/seo/structured-data.test.ts`
- [x] `src/lib/telemetry/perf-store.ts`
- [x] `src/lib/telemetry/web-vitals-store.ts`
- [x] `src/lib/utils/cn.ts`

**Audited — findings (logged to Part 2):**

- **`http://localhost:3000` fallback also in `structured-data.ts` (confirmed
  Phase 5)** — `baseUrl()` (`structured-data.ts:14-16`) repeats the same
  `env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"` default already
  duplicated in `layout.tsx`/`robots.ts`/`sitemap.ts`; fold into the one shared
  default. → Phase 5 (added to that item).
- **Person facts hardcoded in the SEO builder (new, low)** — `personJsonLd()`
  inlines biographical SSOT (`addressLocality: "Lisbon"`, `addressCountry: "PT"`,
  `alumniOf`, `knowsAbout`, `knowsLanguage`) that arguably belongs in
  `siteConfig`/content alongside the existing `name`/`role`/`email`. Same SSOT
  theme as the route-data move; not a hard rule violation. → Phase 5 (new, low).
- **File size (confirmed Phase 3)** — `retrieve.ts` is 290 lines (listed as
  289); split the cosine tier, the BM25/keyword tier, and the tunables/stopwords
  into co-located modules. Already listed.
- **Comments**: JSDoc narration on `retrieve.ts` (already counted, 62 lines)
  plus `system-prompt.ts`, `structured-data.ts`, `perf-store.ts`,
  `web-vitals-store.ts`, `cn.ts`, and `use-is-client.ts`. → Phase 4 (added).
  Keep the genuine gotchas: the `reactStrictMode` double-invoke race in
  `web-vitals-store.ts`, the `r3f-perf`-dropped + stable-SSR-snapshot notes in
  the telemetry stores, the `useSyncExternalStore`-vs-`mounted` rationale in
  `use-is-client.ts`, the cosine/BM25 relevance-floor design notes in
  `retrieve.ts`, and the `schema-dts`-cast note in `structured-data.test.ts`.
- **Accepted (tests)** — `retrieve.test.ts` and `structured-data.test.ts`
  follow the testing rule: they assert behavior on pure functions (no test-ids,
  no fixed timeouts, no real network/clock). The serialization casts in
  `structured-data.test.ts` (`asJson` `JSON.parse(JSON.stringify(x))`,
  `as Json[]`, `items[0]!`) are accepted boundary friction for `schema-dts`'
  deep unions.
- **Compliant, no action**: strong TypeScript throughout — explicit return
  types on every exported function, `type` over `interface`, named exports, no
  `any`/double-casts, `noUncheckedIndexedAccess` handled defensively
  (`a[i] ?? 0`, `if (!chunk)` / `if (!tf || dl === undefined)` guards);
  `import "server-only"` correctly applied to both `server/ai` modules;
  `perf-store.ts`/`web-vitals-store.ts` are correct module-level external stores
  with stable SSR snapshots for `useSyncExternalStore`; `use-is-client.ts` is
  the correct hydration-gate primitive; `cn.ts` is the canonical
  class-composition helper (just de-comment); named tunables in `retrieve.ts`
  (`TOP_K`, `MIN_COSINE_SCORE`, `MIN_KEYWORD_SCORE`, `BM25_K1`, `BM25_B`) — no
  magic numbers; no `console.*` anywhere in the batch.

### Batch K — `content/` + `config/` + `types/` + `styles/` `[x]`

- [x] `src/content/agent-index.json`
- [x] `src/content/data/career-graph.ts`
- [x] `src/content/data/career-graph.test.ts`
- [x] `src/content/case-studies/diligent-design-system.mdx`
- [x] `src/content/case-studies/eino-ai-network-planning.mdx`
- [x] `src/content/case-studies/peacock-streaming.mdx`
- [x] `src/content/essays/agentic-ux-without-the-demo-tax.mdx`
- [x] `src/content/essays/design-systems-that-survive.mdx`
- [x] `src/config/site.ts`
- [x] `src/types/agent.ts`
- [x] `src/styles/globals.css`
- [x] `src/styles/mdx.css`

**Audited — findings (logged to Part 2):**

- **`config/site.ts` `patterns` + `operatingCompanies` mirror `career-graph.ts`
  (new, low — SSOT)** — `patterns` (`:57-63`, display strings) duplicates
  `patternList.map((p) => p.label)`; `operatingCompanies` (`:43-51`) duplicates
  the node names. Both are still consumed (`hero-section.tsx` imports
  `patterns`; `trust-section.tsx` imports `operatingCompanies`), so they're not
  dead — but they're a second representation of the same truth. Derive the home
  hero/trust copy from the richer `career-graph.ts` SSOT (or document the split).
  → Phase 5 (added to the patterns-SSOT item).
- **`career-graph.test.ts` also mirrors `PUBLISHED_CASE_STUDY_SLUGS` (confirmed
  Phase 5)** — `:70-76` re-hardcodes the published-slug set with a "keep this
  mirror in sync" comment, exactly like `home.test.tsx`. The real fix is to
  export the constant from `career-graph.ts` and import it in both tests.
  → Phase 5 (extended the `home.test.tsx` import item to cover both).
- **`types/agent.ts` describes external JSON with no Zod schema (confirmed
  Phase 2)** — `AgentChunk`/`AgentIndex` are hand-declared to mirror
  `agent-index.json`. When the Phase 2 `agent-index.json` validation lands,
  derive these via `z.infer` rather than re-declaring. → Phase 2 (noted).
- **Component-level CSS in `globals.css` (new, low)** — the `.cg-*` career-graph
  node/edge-tracer rules (`:210-279`) and the `[cmdk-group-heading]` block are
  component-scoped styles living in the global sheet (styling rule discourages
  global CSS for component-level styling). Accepted for the server-rendered SVG
  (which can't take Tailwind classes on generated nodes) but flag for possible
  relocation. `globals.css` (296) and `mdx.css` (274) exceed ~200 lines but are
  single-concept stylesheets — accepted (the line rule targets code).
- **Comments**: `career-graph.ts` (already counted, 71) — trim decorative
  `/* --- */` dividers, keep the coordinate-system doc + edge-derivation gotcha;
  `config/site.ts` carries stale "Phase 2 graph / will become edges" narration;
  `types/agent.ts` JSDoc (keep the "types duplicated so the build script stays
  alias-free" gotcha). CSS comments in `globals.css`/`mdx.css` are largely
  explanatory (contrast targets, dashoffset magnitude, rehype hooks) and
  accepted. → Phase 4 (added `config/site.ts` + `types/agent.ts`).
- **TS nits → Phase 6 lint** — non-null assertions in the edge-derivation IIFE
  (`nodes[i]!`, `[...shared].sort(...)[0]!`) in `career-graph.ts` and
  `n.position[i]!` in `career-graph.test.ts` are bounds-guaranteed
  `noUncheckedIndexedAccess` friction. Flag, don't churn.
- **Confirms the cross-batch reduced-motion net** — `globals.css:286-295` is the
  global `prefers-reduced-motion` safety net the Batch C (`status-dot.tsx`) and
  Batch G (`studio-fallback.tsx` `console-grid`) audits asked to verify here. It
  exists and is correct (also a dedicated `.cg-edge-tracer` reduced-motion rule).
- **Compliant, no action**: the five MDX content files are clean — Velite-
  validated frontmatter, registered custom MDX components, no raw `<img>`/inline
  styles/raw internal `<a>` (external links via frontmatter `links`); no code
  rules apply to prose. `agent-index.json` is a generated embeddings artifact
  (consumption-side Zod already queued in Phase 2) — out of scope for size/
  comments. `career-graph.ts` TS is exemplary (`as const satisfies Record<…>`,
  `readonly`, discriminated `PatternId`/`NodeId`, explicit return types). Both
  test files assert behavior on pure functions (no test-ids/timeouts/network).
  `globals.css`/`mdx.css` are the design-token SSOT — OKLCH, dark mode,
  `:focus-visible`, token-only colors — with no arbitrary hex.

### Batch L — `e2e/` + `scripts/` `[x]`

- [x] `e2e/accessibility.spec.ts`
- [x] `e2e/command-menu.spec.ts`
- [x] `e2e/content-pages.spec.ts`
- [x] `e2e/easter-egg.spec.ts`
- [x] `e2e/home.spec.ts`
- [x] `e2e/inspector-overlay.spec.ts`
- [x] `e2e/mobile-nav.spec.ts`
- [x] `scripts/build-agent-index.ts`

**Audited — findings (logged to Part 2):**

- **File size — `build-agent-index.ts` is 638 lines (new, Phase 3)** — the
  largest file in the repo and not previously listed. It's a build-only CLI (not
  shipped to the client/runtime), so it ranks below runtime offenders, but it
  should still split into a frontmatter parser, the MDX-strip + chunker, the
  virtual-chunk builder, and the embed/diff/CLI `main`. → Phase 3 (new).
- **Stale type-mirror path comment** — `build-agent-index.ts:80` says the local
  `IndexEntry`/`AgentIndex` types "mirror `src/lib/agent/types.ts`", but that
  module now lives at `src/types/agent.ts`. Fix the path when de-commenting
  (same shape as the `json-ld.tsx` stale-path note). → Phase 4/5.
- **`no-console` must be scoped to `src/` (note for Phase 6)** — the build script
  legitimately uses `console.log`/`warn`/`error` as its CLI UX. When the Phase 6
  `no-console` rule lands, scope it to `src/` (or override `scripts/`) so the
  build tooling isn't flagged. → Phase 6 (noted).
- **Unvalidated `JSON.parse(...) as AgentIndex`** — `loadExistingIndex()`
  (`:469`) casts the committed index without validation. Build-time + wrapped in
  try/catch so the stakes are low, but once the Phase 2 Zod schema for
  `agent-index.json` exists, the script can reuse it. → Phase 2 (noted).
- **Comments**: heavy JSDoc + decorative dividers across `build-agent-index.ts`.
  → Phase 4 (new). Keep the genuine gotchas (the bespoke regex-frontmatter
  rationale, the `stripMdxJsx` best-effort note, the Matryoshka-512d rationale,
  and the `--check` CI-guard semantics). The e2e specs' JSDoc headers are
  largely justified test-context gotchas (the reduced-motion-default behavior,
  the WebKit-avoidance viewport override in `mobile-nav.spec.ts`, the Inspector
  degraded-state note) — keep those; trim only decorative narration.
- **TS nits → Phase 6 lint** — `main()` lacks an explicit return type;
  regex/parse non-null assertions (`match[1]!`, `h2[1]!`, `lines[i]!`) in the
  parser are accepted friction. The `response.json() as { status: string }`
  health-check cast in `home.spec.ts:32` is accepted test friction.
- **Accepted (build script)** — `console.*` (CLI UX), the bespoke `loadEnvFiles`
  - raw `process.env` reads (the script runs before/outside the validated
    `env.ts`, like the other accepted bootstrap exceptions), the `../src/…`
    relative imports (the script runs via `tsx` outside the path-alias runtime),
    and the intentionally-duplicated types (kept alias-free, same rationale as
    `types/agent.ts`).
- **Compliant, no action**: the seven e2e specs are a model of the testing rule
  — they query by **role/label/text/placeholder** (no test-ids), use web-first
  auto-waiting assertions (`await expect(locator).toBeVisible()`), gate
  accessibility with `@axe-core/playwright` on the home page (light **and** dark)
  and every Phase-5 content route (zero-violation assertions), and cover
  keyboard-only journeys (`⌘K`, `Ctrl+\``, `Escape`, the mobile drawer, the
Inspector segmented control). They live under `e2e/`, and the
`toBeHidden({ timeout: 4000 })`in`easter-egg.spec.ts`is a bounded web-first
assertion for the one-shot auto-dismiss — not a fixed`waitForTimeout` sleep.

# Part 2 — Remediation backlog

> **Preliminary — seeded from an initial broad scan, not the full Part 1 audit.**
> Treat these as a head start: confirm, correct, and **expand** each item as the
> relevant batch is audited. Severity and status will firm up as areas complete.

## Compliance scorecard

| Area                                       | Rule file                        | Status                     | Severity |
| ------------------------------------------ | -------------------------------- | -------------------------- | -------- |
| TypeScript strict config                   | `typescript.md`                  | Compliant                  | —        |
| `any` / `@ts-ignore` usage                 | `typescript.md`                  | Mostly OK                  | Low      |
| Double casts / unvalidated JSON            | `typescript.md`                  | Fixed in `src/` (P2)       | Medium   |
| Explicit return types (exports)            | `typescript.md`                  | Violations                 | Low      |
| Comments policy (self-documenting)         | `00-core.md`                     | Widespread                 | High     |
| File size (~200 lines)                     | `00-core.md` / project-structure | Violations                 | Medium   |
| `console.*` in committed code              | `observability-and-errors.md`    | Fixed in `src/` (P1)       | Medium   |
| `error.tsx` / `global-error.tsx` wiring    | observability/app-router         | Fixed (P1)                 | High     |
| Scattered `process.env`                    | `security-and-env.md`            | Fixed (P2)                 | Medium   |
| Feature state under `components/providers` | project-structure                | Violations                 | Low      |
| Manual memoization vs React Compiler       | react-components-styling         | Compiler on (P0); strip P5 | Low      |
| Lint enforcement of the rules              | tooling                          | Warnings added (P0)        | Medium   |
| Security headers / CSP                     | `security-and-env.md`            | Static CSP added (P2)      | Medium   |
| Stale tooling config paths                 | project-structure                | Violations                 | Low      |
| Route handler input validation (Zod)       | security / `typescript.md`       | Fixed (P2)                 | Medium   |
| Duplicated logic (rate limiter, filters)   | `00-core.md` (DRY)               | Violations                 | Medium   |
| Route data/UI living in `app/`             | project-structure                | Violations                 | Medium   |
| Arbitrary hex vs design tokens             | react-components-styling         | Violations                 | Medium   |
| Conditional classes via `cn()`             | react-components-styling         | Violations                 | Low      |

---

## Phase 0 — Decisions & guardrails (do first) `[x]`

These unblock the rest and prevent regressions.

- [x] **Decide on React Compiler — ENABLE.** Installed
      `babel-plugin-react-compiler@1.0.0` (dev) and set `reactCompiler: true` in
      `next.config.ts` (stable in Next 16). `pnpm build` verified green with the
      compiler on. The codebase was already authored against the compiler's
      ESLint rules (`react-hooks/immutability`, `react-hooks/static-components`).
      "Just-in-case" `useMemo`/`useCallback`/`memo` stripping is deferred to
      **Phase 5**; keep memo only where genuinely needed (stable R3F uniforms,
      the studio `CanvasTexture`s).
- [x] **Decide comment policy — STRICT (rule-default).** Per `00-core.md`:
      remove all JSDoc-as-prose, decorative `/* --- */` dividers, restating /
      `TODO` comments, and commented-out code. Keep only machine directives
      (`"use client"`, `import "server-only"`, `eslint-disable` with a reason)
      and the specific genuine gotchas the Part 1 audit flagged per file.
      Applied in **Phase 4**.
- [x] **Add lint guardrails (as warnings).** Added to `eslint.config.mjs`,
      scoped to `src/**` (tests and `src/env.ts` exempted where appropriate):
      `no-console`, `max-lines` (200, skip blank/comments),
      `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`,
      `consistent-type-imports`, `explicit-module-boundary-types`, and a
      `no-restricted-syntax` selector flagging raw `process.env`. Surfaces 151
      warnings today; CI stays green (`pnpm lint` runs without `--max-warnings`).
      Promoted to `error` in **Phase 6** once the backlog clears.

---

## Phase 1 — Error handling & observability (high) `[x]`

Rule: `observability-and-errors.md`, `nextjs-app-router.md`.

- [x] **Add `src/app/global-error.tsx`** — added. `"use client"` top-level
      boundary that renders its own `<html>`/`<body>` (imports `globals.css` for
      tokens), captures via `Sentry.captureException`, and offers an accessible
      recoverable fallback with `reset()`.
- [x] **Wire `src/app/error.tsx` to Sentry.** Replaced the `console.error` +
      `// TODO` with `Sentry.captureException(error)`; renamed the export to
      `RouteError` (it is the route boundary, not the global one) and added an
      explicit `ReactElement` return type.
- [x] **Remove stray `console.*`** from committed code:
  - [x] `src/app/api/chat/route.ts` — both the embed-fallback `console.warn` and
        the stream `console.error` now call `Sentry.captureException(err, { tags })`,
        preserving graceful keyword-fallback / stream-close degradation.
  - [x] `src/components/r3f/webgl-context-guard.tsx` — removed the dev-only
        `console.info` breadcrumbs and the now-redundant `onRestored` no-op
        listener; kept the critical `event.preventDefault()`. Also drops the raw
        `NODE_ENV` reads (clears the Phase 2 item for this file).
- [x] **Confirm async state matrix** — confirmed from the Batch H/I audit:
      `command-menu-ask.tsx` ships the full idle/streaming/done/refused/
      rate-limited/error/unconfigured union and `contact-form.tsx` ships
      loading/error/success + a 503 fallback. No happy-path-only UI found. No
      code change.
- [x] **De-duplicate `instrumentation.ts`** — collapsed the identical `nodejs` /
      `edge` `Sentry.init` blocks into one guarded branch. Extracted the default
      traces sample rate to `DEFAULT_TRACES_SAMPLE_RATE` in
      `src/lib/telemetry/constants.ts`, now shared by both `instrumentation.ts`
      and `instrumentation-client.ts`.
- [x] **Confirm Web Vitals** — confirmed already tracked in production via
      `@vercel/speed-insights` (mounted in `layout.tsx`, Vercel-only) and
      surfaced in-app through `lib/telemetry/web-vitals-store.ts` (lazy
      `web-vitals`). `instrumentation-client.ts` owns client **error** capture
      (Sentry). Deliberately **did not** add Sentry `browserTracingIntegration`
      to avoid loading the tracing bundle against the 1.25 MB `pnpm size` budget;
      Speed Insights is the right tool for CWV here. Revisit if Sentry becomes
      the single CWV sink.

---

## Phase 2 — Security & environment (medium) `[x]`

Rule: `security-and-env.md`, `typescript.md`.

- [x] **Centralize `process.env`** reads through `src/env.ts`:
  - [x] `dev-hud.tsx` (`NEXT_PUBLIC_PERF_HUD`) → added to the `env.ts` client
        schema (`z.enum(["0","1"])`) and read via `env`.
  - [x] `layout.tsx` (`VERCEL`) → added to the `env.ts` server schema and read
        via `env`; documented in `.env.example` as an auto-set framework var.
  - [x] `webgl-context-guard.tsx` (`NODE_ENV`) → the reads were removed entirely
        in Phase 1. The remaining `process.env.NODE_ENV` in `dev-hud.tsx` is the
        accepted Next special (dead-code-eliminated) and is exempted from the
        `no-restricted-syntax` lint guard.
  - Bootstrap reads in `next.config.ts`, `instrumentation*.ts`,
    `playwright.config.ts` remain accepted (run before/outside the validated
    module).
- [x] **Add a Content-Security-Policy** — added a **static** CSP to
      `securityHeaders` in `next.config.ts` (Phase 0 decision: keep SSG, so no
      per-request nonce). `default-src 'self'`; `script-src`/`style-src` allow
      `'unsafe-inline'` (Next hydration + inline styles; the MDX `new Function`
      eval is **server-only**, so no `'unsafe-eval'` in prod); tight
      `img/font/connect/worker-src`; `frame-ancestors 'none'`, `base-uri 'self'`,
      `form-action 'self'`, `object-src 'none'`. `'unsafe-eval'`+`ws:` are
      dev-only; `upgrade-insecure-requests` is gated on `VERCEL` so it can't
      break http://localhost prod testing. **Verified**: full 26-test Playwright
      suite (incl. axe a11y) passes against `pnpm start` with the CSP enforced.
- [x] **Validate `agent-index.json` with Zod** — `/api/chat` now parses the
      index via `agentIndexSchema.parse(indexJson)` (no more double cast).
      Schemas live in `src/lib/validations/agent.ts`; `src/types/agent.ts`
      re-exports the `z.infer` types. (The build-script reuse at
      `build-agent-index.ts:469` is deferred — see Phase 3/4 notes; it stays
      alias-free and is build-only/try-caught.)
- [x] **Validate the `/api/chat` body with Zod** — replaced the hand-rolled
      `typeof` checks with `chatRequestSchema.safeParse` (also removes the
      `as { query: … }` casts).
- [x] **Validate the agent sources payload (client)** — `command-menu-ask.tsx`
      now decodes the `x-agent-sources` header via a `TextDecoder` UTF-8 decode
      (no deprecated `escape()`) and validates with
      `agentSourcesPayloadSchema.safeParse`.
- [x] **Sanitize agent-rendered link hrefs** — `renderFormatting` routes
      internal links through `next/link`, allows only `http(s)`/`mailto`
      external hrefs (via a `sanitizeHref` helper), and renders anything else
      (e.g. `javascript:`) as plain text.
- [x] **Audit Route Handlers** — confirmed: `/api/chat` (Zod body + index,
      per-IP rate limit, graceful 503/refusal) and `/api/contact` (Zod, honeypot,
      rate limit, 503 fallback) validate + rate-limit at the boundary;
      `/api/health` is a read-only liveness probe (no input). All are public
      read/contact endpoints (no auth surface to authorize).

---

## Phase 3 — File size & decomposition (medium)

Rule: `00-core.md`, `project-structure.md` (~200 lines max). Split into
sub-components/hooks/helpers. Largest offenders first. **Each file is also
de-commented in the same pass (Phase 4).**

> **Authoritative counts come from the `max-lines` lint warning (code-only —
> skips blanks/comments), not raw `wc -l`.** After the Phase 0–2 touches + the
> lint-cleanup commit, the remaining flagged offenders are: `studio-canvas.tsx`
> (was 432), `screens.tsx` (was 347), `command-menu.tsx` (329),
> `career-graph-svg.tsx` (291), `about/page.tsx` (271), `inspector-overlay.tsx`
> (266), `contact-form.tsx` (238), `career-graph.ts` (218), `retrieve.ts` (206).
> Files previously listed that are **already under 200 code-lines** and no longer
> flagged — `heatmap-field.tsx`, `system-diagram-fallback.tsx`,
> `reduced-motion-provider.tsx`, `colophon/page.tsx`, `api/chat/route.ts` — meet
> the size rule; any "thin the route / move data" note on them carries to Phase 5.

- [x] `src/features/command-menu/components/command-menu-ask.tsx` (552 → ~116) —
      extracted `hooks/use-ask-agent.ts` (fetch/stream lifecycle + decode helper),
      `components/ask-suggestions.tsx`, `components/ask-answer-surface.tsx`,
      `components/ask-answer.tsx` (the `[N]`/bold/code/link renderer + `CitationChip` + `sanitizeHref`), `components/ask-citation-list.tsx`, and a shared
      `types.ts` (`AskStatus`/`RetrievalMode`). De-commented in the same pass.
      Verified: typecheck + 26-test e2e suite green; behavior unchanged
      (memoization left for Phase 5). **Re-confirmed:** 116 lines, no longer in
      the `max-lines` warning list after the lint-cleanup commit.
- [x] `src/features/studio/components/studio-canvas.tsx` (432 → 66) — split each
      scene object into `components/scene/*` (`lighting`, `camera-idle`,
      `grid-floor`, `desk`, `chair`, `desk-props`, `speakers`, `monitor-rig`)
      with a shared `scene/constants.ts` (`DESK_TOP_Y`). De-commented in the same
      pass (kept the canvas-texture/bloom + desk-top derivation as code, not
      prose). Verified: typecheck + lint + `pnpm build` green.
- [x] `src/features/studio/components/screens.tsx` (347 → removed) — split into
      `components/screens/` (`canvas-texture.ts` shared helper + `MONO`,
      `terminal-screen.ts`, `code-screen.ts`, `metrics-screen.ts`, `index.ts`
      barrel). `interface LogLine` → `type`; kept the one genuine "why not drei
      `<Html>`" gotcha. Verified: typecheck + lint + `pnpm build` green.
- [x] `src/features/command-menu/components/command-menu.tsx` (329 → 81) —
      extracted `command-menu-navigate.tsx` (`NavigateView`),
      `command-menu-footer.tsx` (`Footer`/`ModeTab`), and `command-menu-item.tsx`
      (`Item`/`iconForPage`). De-commented in the same pass (kept only the
      cmdk-governs-Navigate-not-Ask gotcha as code structure). Verified:
      typecheck + lint + the 4 `command-menu.spec.ts` e2e tests green.
- [x] `src/features/career-graph/components/career-graph-svg.tsx` (291 → 122) —
      extracted `career-graph-defs.tsx` (`CareerGraphDefs`), `career-graph-axis.tsx`
      (`Axis`), `career-graph-node.tsx` (`Node` + `labelPlacement`), and a shared
      `career-graph-svg-viewport.ts` (`VIEWPORT`). Stays a Server Component (no
      `"use client"`); both barrel exports preserved. De-commented in the same
      pass (kept the tracer-period + paint-order gotchas). Verified: typecheck +
      lint + full 26-test e2e suite green.
- [x] `src/features/inspector/components/inspector-overlay.tsx` (266 → 155) —
      extracted `inspector-format.ts` (`ratingTone`/`formatVital`/`fpsTone`/
      `formatCount`), `inspector-atoms.tsx` (`Panel`/`Vital`/`Stat`/`Signal`),
      and `inspector-motion-panel.tsx` (`MotionPanel`). De-commented in the same
      pass (kept the mount-on-open + deferred-measure gotchas). Verified:
      typecheck + lint + the 3 `inspector-overlay.spec.ts` e2e tests green.
- [ ] `src/content/data/career-graph.ts` (311)
- [ ] `src/server/ai/retrieve.ts` (289)
- [ ] `src/app/(marketing)/about/page.tsx` (288) — also thin the route; move UI
      into a `features`/`components` slice per app-router rule.
- [ ] `src/app/api/chat/route.ts` (273)
- [ ] `src/features/contact/components/contact-form.tsx` (271) — extract `Field`,
      the success/fallback states, and the honeypot.
- [ ] `src/features/career-graph/components/scene/heatmap-field.tsx` (258) —
      move the GLSL vertex/fragment shader strings to a co-located module.
- [ ] `src/components/mdx/system-diagram-fallback.tsx` (220)
- [ ] `src/components/providers/reduced-motion-provider.tsx` (212)
- [ ] `src/app/(legal)/colophon/page.tsx` (209) — also thin the route.
- [ ] `scripts/build-agent-index.ts` (638) — **build-only (not shipped);**
      **lower priority than the runtime files above.** Split into the
      frontmatter parser, the MDX-strip + chunker, the virtual-chunk builder,
      and the embed/diff/CLI `main`.

---

## Phase 4 — Comments cleanup (high volume)

Rule: `00-core.md` ("No comments — code is self-explanatory"). Remove narration,
JSDoc-as-prose, decorative dividers, and commented-out/`TODO` notes; keep only
machine directives (`"use client"`, `import "server-only"`) and the rare comment
for genuinely non-obvious logic. Heaviest files (comment-line count):

- [ ] `src/content/data/career-graph.ts` (71)
- [ ] `src/server/ai/retrieve.ts` (62)
- [ ] `src/features/career-graph/components/scene/heatmap-field.tsx` (60)
- [ ] `src/app/api/chat/route.ts` (53)
- [x] `src/features/studio/components/studio-canvas.tsx` (50) — de-commented in
      the Phase 3 split.
- [x] `src/features/studio/components/screens.tsx` (49) — de-commented in the
      Phase 3 split (now `screens/*`).
- [ ] Studio: JSDoc + JSX dividers in `studio.tsx` and `studio-fallback.tsx`.
- [ ] `src/components/providers/reduced-motion-provider.tsx` (48)
- [ ] `src/features/command-menu/components/command-menu-ask.tsx` (37)
- [ ] `src/features/career-graph/components/career-graph.tsx` (37)
- [ ] Config files: `src/env.ts`, `velite.config.ts`, `instrumentation-client.ts`,
      `next.config.ts`, `playwright.config.ts`, `commitlint.config.mjs`.
- [ ] App routes (JSDoc/dividers): `layout.tsx`, `sitemap.ts`,
      `api/chat/route.ts`, `api/contact/route.ts`, `(marketing)/work` +
      `writing` pages, and JSX section dividers in `about`/`uses`/`colophon`/
      `contact`.
- [ ] UI/layout components: JSDoc in `brand-icons.tsx`, `kbd.tsx`,
      `status-dot.tsx`, `button.tsx`, `command-trigger.tsx`, `mobile-nav.tsx`,
      `site-footer.tsx`, `site-nav.tsx`, `theme-toggle.tsx`.
- [ ] MDX components: JSDoc across all of `components/mdx/*` (keep only the
      genuine gotchas in `outcome.tsx`, `mdx-content.tsx`,
      `system-diagram-mount.tsx`).
- [ ] Common/SEO/OG/r3f/providers: JSDoc narration across all of
      `components/{common,seo,og,r3f,providers}/*` plus the decorative
      `/* --- */` dividers in `reduced-motion-provider.tsx`. Keep only the
      trimmed `preventDefault` gotcha in `webgl-context-guard.tsx`; drop the
      stale `@/lib/structured-data` path note in `json-ld.tsx`.
- [ ] Command-menu/inspector/easter-egg: JSDoc + `/* --- */` dividers in
      `command-menu.tsx`, `command-menu-ask.tsx`, `inspector-overlay.tsx`,
      `inspector-trigger.tsx`, `easter-egg.tsx`.
- [ ] Home/contact: JSDoc/JSX narration in `home.tsx`, `hero-section.tsx`,
      `hero-ask-cta.tsx`, `studio-section.tsx`, `contact-form.tsx`,
      `contact-notification.tsx`, `schemas/contact.ts`, `home.test.tsx` (keep
      the honeypot gotcha in the schema).
- [ ] Career-graph: JSDoc narration across all of `features/career-graph/*`
      (`career-graph.tsx`, `career-graph-canvas.tsx`, `career-graph-svg.tsx`,
      and every `scene/*` file). Keep the trimmed perf/format gotchas (DPR cap + `frameloop` in the canvas, `getBoundingClientRect` rAF-coalescing in
      `camera-dolly.tsx`/`heatmap-field.tsx`, OKLCH-rasterize in `css-color.ts`)
      and the justified `eslint-disable` in `camera-dolly.tsx`. GLSL comments
      inside shader strings are out of scope.
- [ ] Server/lib: JSDoc narration in `server/ai/retrieve.ts` (already counted,
      62), `server/ai/system-prompt.ts`, `lib/seo/structured-data.ts`,
      `lib/telemetry/perf-store.ts`, `lib/telemetry/web-vitals-store.ts`,
      `lib/utils/cn.ts`, and `lib/hooks/use-is-client.ts`. Keep the genuine
      gotchas (the `reactStrictMode` double-invoke race in `web-vitals-store.ts`,
      the `r3f-perf`-dropped + stable-SSR-snapshot notes in the telemetry stores,
      the `useSyncExternalStore`-vs-`mounted` rationale in `use-is-client.ts`,
      the cosine/BM25 relevance-floor design notes in `retrieve.ts`, and the
      `schema-dts`-cast note in `structured-data.test.ts`).
- [ ] Content/config/types: trim the decorative `/* --- */` dividers in
      `content/data/career-graph.ts` (already counted, 71 — keep the
      coordinate-system doc + edge-derivation gotcha), the stale "Phase 2 graph"
      narration in `config/site.ts`, and the JSDoc in `types/agent.ts` (keep the
      "types duplicated so the build script stays alias-free" gotcha). CSS
      comments in `styles/globals.css` + `styles/mdx.css` are explanatory and
      accepted.
- [ ] Scripts: heavy JSDoc + `/* --- */` dividers in `scripts/build-agent-index.ts`.
      Keep the genuine gotchas (the bespoke regex-frontmatter rationale, the
      `stripMdxJsx` best-effort note, the Matryoshka-512d rationale, the
      `--check` CI-guard semantics) and fix the stale type-mirror path comment
      (`:80` references `src/lib/agent/types.ts`; now `src/types/agent.ts`). The
      e2e specs' JSDoc headers are largely justified test-context gotchas — keep
      them; trim only decorative narration.
- [ ] Remaining files with >5 comment lines (sweep after the above).

> Best done **together with Phase 3** per file (decompose + de-comment in one
> pass) to avoid churn. Keep the diff to comment removal + extraction only.

---

## Phase 5 — Structure & TypeScript polish (low)

Rule: `project-structure.md`, `typescript.md`, `react-components-styling.md`.

- [ ] **Relocate feature state** out of shared providers:
  - [ ] `src/components/providers/command-menu-context.tsx` →
        `src/features/command-menu/stores/` (export via the feature `index.ts`).
  - [ ] `src/components/providers/inspector-overlay-context.tsx` →
        `src/features/inspector/stores/`.
  - Keep only app-wide providers (theme, motion, lenis, toaster) in
    `components/providers/`.
- [ ] **Add explicit return types** to exported functions / component props
      where missing (e.g. `AppProviders`, `JsonLd`, route components). Prefer
      lint enforcement (Phase 6) to find them all.
- [ ] **Resolve memoization** per the Phase 0 React Compiler decision.
- [ ] **Fix stale tooling paths**: `components.json` `tailwind.css`
      (`src/app/globals.css` → `src/styles/globals.css`); remove/repoint the
      `velite.config.ts` comment referencing `src/content/career-graph.ts`.
- [ ] **Single source of truth for content patterns** — `VALID_PATTERNS` is
      duplicated in `work/page.tsx` + `writing/page.tsx` and mirrors
      `velite.config.ts` `PATTERNS` + `career-graph`. The `config/site.ts`
      `patterns` (display-string labels, used by `hero-section.tsx`) and
      `operatingCompanies` (used by `trust-section.tsx`) are further mirrors of
      the `career-graph.ts` `patternList`/node names. Export one canonical list
      from `career-graph.ts` and reuse everywhere (or document the split).
- [ ] **Extract `parsePatternsFromQuery`** shared by `work/page.tsx` and
      `writing/page.tsx` into a shared module.
- [ ] **Extract the per-IP rate limiter** duplicated by `api/chat` and
      `api/contact` (Upstash + in-memory bucket + `allow`/`clientIp`) into
      `src/server/` (called out in `docs/architecture.md`).
- [ ] **Move route data/UI out of `app/`** — `about`, `uses`, `colophon` embed
      content arrays + local helper components; relocate data to
      `content/`/`config/` and components to a feature/`components`.
- [ ] **Centralize the `http://localhost:3000` fallback** duplicated in
      `layout.tsx`, `robots.ts`, `sitemap.ts`, and `lib/seo/structured-data.ts`
      (`baseUrl()`) — one `env`/`config` default.
- [ ] **Move Person JSON-LD facts to `siteConfig`/content** — `personJsonLd()`
      in `lib/seo/structured-data.ts` hardcodes biographical SSOT (locality/
      country, `alumniOf`, `knowsAbout`, `knowsLanguage`) that belongs alongside
      the existing `name`/`role`/`email` in config. Low priority.
- [ ] **Fix array-index `key`** on outcomes in `work/[slug]/page.tsx:151`.
- [ ] **Promote brand colors to design tokens** — arbitrary hex
      (`#0d0f12`/`#22d3ee`/`#67e8f9`/`#262b33`…) is hardcoded in `site-nav.tsx`
      Tailwind classes (styling-rule violation) and duplicated in `icon.tsx`/
      `apple-icon.tsx`/`og-template`/`contact-notification.tsx` (inline hex is
      acceptable inside `ImageResponse` and `@react-email`). Define tokens once;
      dedupe the OG/icon/email copies to shared consts.
- [ ] **Props typing nits** — use `type` over `interface` for `BadgeProps`
      (`badge.tsx`) and `ButtonProps` (`button.tsx`); verify `button.tsx`
      `"use client"` is actually needed (Slot + forwardRef have no hooks).
      (`LogLine` was already converted to `type` during the Phase 3 screens split.)
- [ ] **Resolve studio scene colors via `css-color.ts`** — the `scene/*` meshes
      (`desk`, `desk-props`, `speakers`, `monitor-rig`, `lighting`) and the
      `screens/*` draw modules hardcode brand cyans (`#22d3ee`, `#7dd3fc`) that
      duplicate design tokens; route them through `resolveCssVarColor` like the
      career-graph scene. Other scene-specific material/paint shades have no
      token equivalent and stay as literals.
- [ ] **Use `cn()` for conditional classes** — replace template-literal class
      concatenation in `callout.tsx`, `metric-tile.tsx`, `decisions-log.tsx`,
      `system-diagram-canvas.tsx`, the `allActive` two-string ternary in
      `pattern-filter.tsx`, and the array `.join(" ")` in `career-graph.tsx`,
      `studio.tsx`, and `studio-fallback.tsx` (and sweep other interpolated
      `className`s).
- [ ] **Extract a shared `PatternBadge`** — the `<Badge tone="outline">` +
      colored-dot chip built from `patterns[id].colorVar` is copy-pasted in
      `article-header.tsx`, `case-study-card.tsx`, and `pattern-filter.tsx`.
      One component (variant for the selectable filter state) removes the
      triplication and centralizes the inline `color-mix`/`var(--…)` styling.
- [ ] **Don't route the server career-graph SVG through a client barrel** — the
      `features/career-graph/index.ts` barrel re-exports `CareerGraphFigure`
      (`CareerGraphSvg`) + `CareerGraphAccessibleDescription` via the
      `"use client"` `career-graph.tsx`, pulling the server LCP surface and its
      `@/content/data/career-graph` import into the client bundle. Export those
      two from the barrel directly from `career-graph-svg.tsx`; keep only
      `CareerGraphAtmosphere` sourced from the client module.
- [ ] **Don't pull the client contact form into the server route** —
      `api/contact/route.ts` imports `{ ContactNotification, contactSchema }`
      from the `@/features/contact` barrel, which also re-exports the
      `"use client"` `ContactForm`. Import the isomorphic schema + server email
      directly (or split the barrel) so mixed client/server exports don't defeat
      tree-shaking. (Same shape as the career-graph barrel item.)
- [ ] **Move `operating-section.tsx` copy to config/content** — the three
      operating-mode cards (org names + descriptions) are hardcoded inline in the
      component; relocate alongside the `about`/`uses`/`colophon` content move.
- [ ] **Export + import `PUBLISHED_CASE_STUDY_SLUGS`** — both `home.test.tsx`
      (`:86-90`) and `content/data/career-graph.test.ts` (`:70-76`) re-hardcode
      the published-slug set instead of importing it. Export the constant from
      `career-graph.ts` and import it in both tests so the assertions can't drift.
- [ ] **Relocate component-level CSS out of `globals.css`** — the `.cg-*`
      career-graph node/edge-tracer rules (`:210-279`) and `[cmdk-group-heading]`
      are component-scoped styles in the global sheet. Low priority; accepted for
      the server-rendered SVG (generated nodes can't take Tailwind classes), but
      consider co-locating with the feature.

---

## Phase 6 — Lint enforcement (prevents regressions)

Rule: tooling support for all of the above. Add to `eslint.config.mjs` (start as
`warn`, promote to `error` once the backlog is clear):

- [ ] `no-console` (allow `warn`/`error` only where intentional, or none).
      **Scope to `src/`** (or override `scripts/`) so the `build-agent-index.ts`
      CLI logging isn't flagged.
- [ ] `max-lines` (~200) and/or `max-lines-per-function`.
- [ ] `@typescript-eslint/no-explicit-any`,
      `no-non-null-assertion`, `consistent-type-imports`.
- [ ] `@typescript-eslint/explicit-module-boundary-types` for exported APIs.
- [ ] Confirm `eslint-plugin-jsx-a11y` coverage (bundled with
      `eslint-config-next`) and fix violations rather than disabling.
- [ ] Consider a `no-restricted-syntax` rule to flag raw `process.env` outside
      `src/env.ts`.

---

## Out of scope / accepted

- **`dangerouslySetInnerHTML` in `src/components/seo/json-ld.tsx`** — controlled,
  build-time JSON-LD (not user input). Accepted per the security rule's
  "if unavoidable" carve-out; no sanitization needed for serialized JSON.
- **External `<a>` links** (`mailto:`, GitHub/LinkedIn in `about/page.tsx`,
  `contact-form.tsx`) — the rule bans raw `<a>` only for **internal** routes.
- **`next.config.ts` raw env reads** — run before the validated env module loads.

## Verification

Each phase merges only when green:

```
pnpm validate   # lint + typecheck + format:check + test + knip
pnpm e2e        # Playwright + axe on critical journeys
pnpm size       # bundle budgets
```
