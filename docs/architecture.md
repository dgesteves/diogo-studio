# Architecture

What the codebase **is** today. The code wins; where they disagree this file is
stale and should be corrected.

> For anything **structural** —where a folder should be, what should merge —
> [`restructure-plan.md`](./restructure-plan.md) supersedes this file, and
> [`.devin/rules/project-structure.md`](../.devin/rules/project-structure.md) is
> the rule new code follows. This file describes the current tree; that rule
> describes the target. They differ on purpose, and the plan closes the gap.
>
> Nothing speculative is recorded here. A folder appears below only if it exists.

## Core ideas

- **Layered + feature-first.** Thin routing on top, vertical feature slices in
  the middle, shared UI and platform code at the bottom.
- **`app/` routes only.** Pages compose; they don't implement.
- **Infrastructure lives in named top-level folders.** Server-only modules (`ai/`,
  `rate-limit.ts`) are poisoned with `import "server-only"`; the rest stays
  isomorphic (client + server safe).
- **Curated public surface per feature.** Other code imports a feature only
  through its `index.ts`, never its internals. This is lint-enforced as a warning
  (`no-restricted-imports`); the 11 remaining violations all reach into
  `features/studio` and are resolved by restructure Phase 4.
- **One direction of dependencies** (top imports down, never up):

```
app/  →  features/  →  components/ • hooks/ • providers/ • stores/
                    →  utils/ • ai/ • seo/ • schemas/ • telemetry/  →  config/ • constants/ • types/
```

`components/ui/` primitives and `utils/` helpers are leaves — they import nothing
above them. Nothing imports from `app/`.

## Stack

| Concern             | Choice                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Framework / runtime | Next.js 16 (App Router), React 19                                                               |
| Language            | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)                                             |
| Styling             | Tailwind v4, `cva` + `cn` (`clsx` + `tailwind-merge`)                                           |
| UI primitives       | Radix UI, `cmdk`, `sonner`, `lucide-react`                                                      |
| Content             | Typed static data + TSX bodies in each feature's `constants/`                                   |
| 3D / motion         | `three` + React Three Fiber + drei + postprocessing, `motion`, `lenis`                          |
| Validation          | `zod`                                                                                           |
| AI                  | Vercel AI SDK + `@ai-sdk/openai` (RAG over a prebuilt index)                                    |
| State (client)      | URL state first; hand-rolled external stores read via `useSyncExternalStore` (no store library) |
| Env                 | `@t3-oss/env-nextjs` (Zod-validated) → `src/config/env.ts`                                      |
| Observability       | Sentry, Vercel Analytics + Speed Insights, `web-vitals`                                         |
| Rate limiting       | Upstash Redis + Ratelimit                                                                       |
| Tooling             | pnpm, ESLint, Prettier, Vitest (+ RTTR for the 3D scene), Playwright + axe, knip, size-limit    |

`next.config.ts` enables **`reactCompiler`**, **`typedRoutes`** and
**`cacheComponents`**. The last one makes rendering dynamic-by-default, so static
rendering is protected by `pnpm prerender:check` (`postbuild`), which fails the build
if any of the 19 must-be-static routes de-optimizes.

## Path aliases

- `@/*` → `src/*` — always use this; never deep relative imports (`../../../`).

## Repository tree

```
.
├── .github/                    workflows (ci, audit, release-please) + dependabot
├── .husky/                     git hooks (pre-commit, commit-msg)
├── .vscode/                    shared settings + recommended extensions
├── docs/                       architecture.md • decisions.md • restructure-plan.md
├── public/                     static assets served as-is (images, icons, audio)
├── scripts/                    build/maintenance scripts (tsx) — agent-index builder,
│                               check-prerender
├── tests/e2e/                  Playwright + axe specs (8 files / 26 tests, run in both
│                               motion modes = 44) + fixtures.ts
├── instrumentation.ts          server observability register() (Sentry)
├── instrumentation-client.ts   client error + Web Vitals capture
└── src/
    ├── app/                    ── ROUTING LAYER ONLY ──────────────────────────
    │   ├── (world)/            17 public pages, one folder each, + the 3D-shell layout
    │   ├── api/                chat/route.ts • health/route.ts (both Node, dynamic)
    │   ├── layout.tsx          root layout (fonts, providers, <html>)
    │   ├── error.tsx • global-error.tsx • not-found.tsx • loading.tsx
    │   ├── icon.tsx • apple-icon.tsx
    │   └── robots.ts • sitemap.ts
    │
    ├── features/               ── VERTICAL SLICES ─────────────────────────────
    │   └── about • audio • command-menu • home • inspector • studio • world
    │       ├── components/     feature UI (server + client)
    │       ├── hooks/ stores/ utils/ constants/   as needed
    │       ├── types.ts
    │       ├── *.test.tsx      colocated beside the file they test
    │       └── index.ts        ★ curated public API — the ONLY import surface
    │
    ├── components/             ── SHARED UI ───────────────────────────────────
    │   ├── ui/                 primitives: badge, brand-icons, button, kbd, status-dot
    │   ├── r3f/                React Three Fiber infra (perf reporter, ctx guard)
    │   └── seo/                json-ld / structured-data UI
    │
    │                           ── INFRASTRUCTURE (named top-level, no `lib/`) ──
    ├── ai/                     retrieval, prompts, embeddings      (server-only)
    ├── rate-limit.ts           shared IP rate-limiter (Upstash + fallback) (server-only)
    ├── seo/                    metadata + structured-data builders
    ├── schemas/                agent.ts — the zod contract for /api/chat
    ├── utils/                  pure isomorphic helpers (cn, mulberry32)
    ├── telemetry/              perf + web-vitals constants
    │
    ├── hooks/                  use-in-view • use-is-client • use-world-palette
    ├── providers/              theme, motion, lenis, reduced-motion + composed <Providers>
    ├── stores/                 external stores: boot, explore, perf, reduced-motion,
    │                           web-vitals, world, world-theme
    │
    ├── constants/              routes.ts (URL SSOT) • patterns.ts • career.ts
    │                           room.ts • agent-index.json (generated)
    ├── config/                 env.ts • site.ts • navigation.ts • brand.ts • world-theme.ts
    ├── styles/                 globals.css (design tokens live here)
    └── types/                  agent.ts (re-export of schemas/agent)
```

There is no `src/lib/`, `src/db/`, `src/auth/`, `src/email/`, `src/api/`,
`src/proxy.ts` (nor its deprecated predecessor `src/middleware.ts`), `messages/`, or
`components/layout/`. The site currently has
no header, nav, or footer chrome — navigation is the 3D world plus the ⌘K menu.

## Layer responsibilities

### `app/` — routing only

Route segments and Next.js special files **only**. A `page.tsx` resolves params,
sets `metadata`, and composes UI from `features/` + `components/`. Route groups
(`(world)`) share a layout without affecting the URL. No business logic, data
access, or shared components here. All 17 pages are synchronous Server Components.

### `features/<feature>/` — vertical slices

Everything for one capability, colocated. Crossing a feature boundary means
importing from its **`index.ts`** only. A feature may contain UI, hooks, stores,
utils, constants & static data, authored content, and tests.

Authored content follows the same rule: a feature owns its content as typed static
data under its own `constants/` — `features/world/constants/` holds the destination
data (typed objects whose JSX bodies compose shared `components/`). There is no
`content/` folder; the feature's `index.ts` exports the collection, which is how
the command menu, sitemap, and OG images consume it.

Two of the seven are honestly page sections rather than capabilities (`home` is
5 files behind a 10-line `sr-only` component; `about` is 7 behind one 13-line
component), and `studio` is 3D content rendered inside `world`'s `<Canvas>` rather
than an independent slice. Restructure Phases 4 and 7 address both.

### `components/` — shared UI

Presentational and reusable. `ui/` = primitives (no app/domain imports); `seo/` =
structured-data UI; `r3f/` = React Three Fiber infra. Note `r3f/` currently has a
single importer (`features/world/components/world-canvas.tsx`), so by the
two-importer rule it is world plumbing in a shared folder — Phase 4 moves it.

### `hooks/`, `providers/`, `stores/` — shared client layer

- `hooks/` — of the three, only `use-is-client` is genuinely cross-feature;
  `use-in-view` has one importer and `use-world-palette` five, all world/studio.
- `providers/` — client context providers composed into one `<Providers>` in
  `providers/index.tsx`, mounted by the root layout.
- `stores/` — hand-rolled external stores read via `useSyncExternalStore`.
  **There is no store library** — `zustand` is not a dependency. Only `perf-store`
  is genuinely shared (world writes, inspector reads); the other six are owned by
  one feature and move in Phase 5.

### Infrastructure — named top-level folders

Platform code lives in named folders directly under `src/` (no `lib/` wrapper),
with an explicit server/client boundary:

- **Server-only modules** (`ai/`, `rate-limit.ts`) start with
  `import "server-only"` so the build fails if they leak into a client component.
  Secrets and server SDKs live only here.
- **Isomorphic helpers** (`utils/`, `seo/`, `schemas/`, `telemetry/`) are pure and
  dependency-light — safe on client and server. No secrets, no Node-only APIs.

### `config/`, `constants/`, `types/`, `styles/`

- `config/` — static configuration: validated env (`env.ts` — never raw
  `process.env` elsewhere), site metadata, navigation, `brand.ts` (misleadingly
  named: it is three.js material tokens, with 40 importers — 39 modules plus the scene
  spec) and `world-theme.ts`.
- `constants/` — `routes.ts` is the typed SSOT for all 17 internal URLs (a plain
  `as const` map; no path builders). Also the `patterns` taxonomy, `career.ts`,
  `room.ts`, and the generated `agent-index.json`.
- `types/` — one file, a pure re-export of `schemas/agent.ts` with 17 importers.
- `styles/` — global CSS and design tokens, imported by the root layout.
- Test helpers, fixtures and render utils belong in **`tests/`** at the repo root,
  next to `tests/e2e/` — not under `src/`, so they stay outside the coverage
  denominator and the `src/**` lint block. There is **no MSW**; mock with `vi.mock`.

## The `/api/chat` surface

A thin **Route Handler** at `app/api/chat/route.ts` (Node runtime — `runtime` is
incompatible with `cacheComponents`; streaming verified): parse →
validate with `@/schemas/agent` → rate-limit → retrieve → stream. Every step
delegates: retrieval and prompting live in `src/ai/` (server-only), the shared IP
rate-limiter in `src/rate-limit.ts` (server-only), the contracts in
`src/schemas/agent.ts`. The route holds no business logic.

It degrades in layers rather than failing: no `OPENAI_API_KEY` returns `503` with
the top index matches, no embeddings falls back to the keyword/BM25 tier, and no
`UPSTASH_*` falls back to an in-memory token bucket.

**Naming trap:** the ⌘K surface is `features/command-menu`, and its agent is
branded "the Inspector agent" in the UI. `features/inspector` is something else
entirely — the performance/Web-Vitals overlay. Don't conflate them.

## Where does X go?

| Adding…                             | Location                                          |
| ----------------------------------- | ------------------------------------------------- |
| A page or API route                 | `src/app/…` (thin)                                |
| A capability's UI + logic           | `src/features/<feature>/`                         |
| A generic primitive                 | `src/components/ui/`                              |
| Isomorphic helper (`cn`, `format`)  | `src/utils/`                                      |
| Server-only integration             | a named top-level folder + `import "server-only"` |
| Zod schema shared across boundaries | `src/schemas/`                                    |
| Site metadata, nav                  | `src/config/{site,navigation}.ts`                 |
| A URL / route literal               | `src/constants/routes.ts` (typed SSOT)            |
| A global constant / enum            | `src/constants/`                                  |
| three.js material / color token     | `src/config/brand.ts`                             |
| Env var                             | `src/config/env.ts` — never raw `process.env`     |
| Authored content (typed data + JSX) | the owning feature's `constants/`                 |
| Static data owned by one feature    | `src/features/<feature>/constants/`               |
| Static data shared by 2+ features   | `src/constants/`                                  |
| Domain logic over feature data      | the consuming feature's `utils/`                  |
| Test helper / mock / fixture        | `tests/`                                          |
| A decision with rationale           | `docs/decisions.md`                               |

Reuse rule: used by **one** feature → keep it there; used by **2+** → promote to
`components/`, `hooks/`, `stores/`, `utils/`, or a shared infra folder. Demote when
that stops being true.

## Conventions

- **Naming**: `kebab-case` files/dirs; `PascalCase` components; `useX` hooks;
  `is/has/can` booleans. One primary, **named** export per file.
- **Imports**: `@/…` alias across areas, relative inside a feature. Cross-feature
  imports go through `index.ts`.
- **Boundaries**: `"use client"` only on interactive leaves; `import "server-only"`
  on every server module.
- **Size**: `max-lines-per-function` is capped at 100 and is the real signal;
  `max-lines` is 250 (120 for `.tsx`, off for draw/layout/data modules). Split on
  mixed concerns, never to hit a number.
- **Tests** colocate with source (`*.test.ts(x)`) at the cluster root; E2E in
  `tests/e2e/`.

## Quality gates

`pnpm validate` = lint + typecheck + `format:check` + tests + `knip`. Plus
`pnpm e2e` (Playwright + axe), `pnpm size` (size-limit), `pnpm analyze`.
`pnpm build` runs `agent:index:check` before and `prerender:check` after.

CI (`.github/workflows/ci.yml`) runs the same gates plus `build` and `e2e`;
`audit.yml` audits production dependencies daily; `release-please.yml` maintains
the release PR. Nothing else runs, deliberately.

`pnpm size` is a **review signal, not a gate** — its CI step is
`continue-on-error`, because a breach would otherwise also sink the `e2e` job via
`needs: build`. Core Web Vitals are the real bar.

This repository is **private on a GitHub Free plan**, which removes capabilities
the workflows would otherwise rely on. Keep this in mind before adding CI:

| Capability                   | Status on private + Free                                |
| ---------------------------- | ------------------------------------------------------- |
| Branch protection / rulesets | Unavailable — `main` is unprotected, no required checks |
| Code scanning (CodeQL)       | Unavailable — needs the paid Code Security add-on       |
| OSSF Scorecard               | Public repositories only                                |
| PR auto-merge                | Needs a required check to wait on, so unusable          |
| `CODEOWNERS`                 | Inactive (needs Pro or higher)                          |
| Actions minutes              | 2,000/month (public repositories are unlimited)         |
| Artifact storage             | 500 MB shared quota                                     |

Because minutes and artifact storage are finite, CI uploads artifacts only on
failure and with short retention. `pnpm validate` locally is the cheap gate; treat
CI as confirmation, not as the first place a problem is found.

One known inefficiency is deliberate: the `e2e` job builds the app again rather
than consuming the `build` job's output. Sharing `.next` would mean either
artifact upload (a multi-hundred-MB write against a 500 MB quota) or cache-key
contention between the two jobs, both worse than one extra build.

## Reproducing CI locally

`pnpm e2e` is **not** what CI runs. Locally it starts `next dev` with 2 workers and
no retries; CI sets `CI=1`, which switches `playwright.config.ts` to `next start`
against a production build, 1 worker and `retries: 2`. Two commands close the gap,
in increasing fidelity and cost:

| Command                       | Mirrors                                                                                         | Cost                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------- |
| `pnpm e2e:ci`                 | The build and the Playwright flags: production `next start`, 1 worker, retries, `CI=1`          | ~4 min, no setup          |
| `pnpm e2e:runner`             | The runner as well: Ubuntu 24.04, pinned browsers, **2 vCPU / 7 GB**, frozen install, no `.env` | ~3 min warm, needs Docker |
| `docker run rhysd/actionlint` | Nothing at runtime — static analysis of the workflow YAML itself                                | seconds                   |

`scripts/ci-local.sh` (behind `pnpm e2e:runner`) takes `playwright test` arguments,
so `pnpm e2e:runner -g "Boot sequence"` works, and `CI_CPUS`, `CI_MEMORY` and
`CI_IMAGE` override the defaults — `CI_CPUS=1` is the quickest way to see whether a
spec depends on timing. It shadows `node_modules`, `.next` and `.env.local` with
container-owned mounts, so the host install is untouched and the degraded-env paths
(no `OPENAI_API_KEY` → `/api/chat` returns 503) are the ones under test, exactly as
on a runner.

**What no local setup reproduces: the CPU architecture.** GitHub runs x86-64; a Mac
runs arm64, so SwiftShader timings are indicative, not identical, and amd64 under
emulation is too slow to be a signal. Calibration point: the two `Boot sequence`
specs take ~12s each on the host and ~60s in the constrained container.

`act` is deliberately not wired in — see `docs/decisions.md`. Run it ad hoc
(`act -j lint`) if a workflow's _wiring_ is in question; it cannot reproduce
`actions/cache`, secrets, or the runner's CPU budget, which is where the failures
have actually been.
