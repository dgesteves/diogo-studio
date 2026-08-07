# Architecture

The **gold-standard, production-grade** structure for a modern Next.js (App
Router) codebase, tailored to **diogo-studio**. It encodes `.devin/rules/` and
is the structure the codebase follows. When in doubt, this document wins.

The codebase has **migrated onto this structure** — the tree below is the
realized blueprint. **[present]** folders exist with real files today; **[new]** marks
a planned home that isn't created yet (add the folder when its first real file lands);
**[optional]** marks a capability folder (auth, db, i18n, etc.) added only when that
capability exists. We **don't commit empty `.gitkeep` placeholders** — this document is
the source of truth for where new code belongs.

## Core ideas

- **Layered + feature-first.** Thin routing on top, vertical feature slices in the
  middle, shared UI and platform code at the bottom.
- **`app/` routes only.** Pages compose; they don't implement.
- **Infrastructure lives in named top-level folders** (no `lib/` wrapper).
  Server-only modules (AI, email, db, rate limiting) are poisoned with
  `import "server-only"`; the rest stays isomorphic (client + server safe).
- **Curated public surface per feature.** Other code imports a feature only
  through its `index.ts`, never its internals.
- **One direction of dependencies** (top imports down, never up):

```
app/  →  features/  →  components/ • hooks/ • providers/ • stores/
                    →  utils/ • ai/ • seo/ • schemas/ • telemetry/  →  config/ • constants/ • types/
```

`ui/` primitives and `utils/` helpers are leaves — they import nothing above them.

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
| Tooling             | pnpm, ESLint, Prettier, Vitest, Playwright + axe, knip, size-limit                              |

## Path aliases

- `@/*` → `src/*` — always use this; never deep relative imports (`../../../`).

## Repository tree

```
.
├── .github/                    CI workflows, issue/PR templates, CODEOWNERS, dependabot   [present]
├── .husky/                     git hooks (pre-commit, commit-msg)                          [present]
├── .vscode/                    shared settings + recommended extensions                    [present]
├── docs/
│   ├── adr/                    Architecture Decision Records (0001-title.md)               [new]
│   ├── architecture.md         this file                                                   [present]
│   └── design-system.md                                                                    [present]
├── public/                     static assets served as-is (images, icons, fonts)           [present]
├── scripts/                    build/maintenance scripts (tsx)                             [present]
├── tests/
│   ├── e2e/                    Playwright + axe specs, fixtures, page objects              [present]
│   └── mocks/                  MSW handlers, shared fixtures, render utils                 [new]
├── messages/                   i18n catalogs (en.json, …)                                  [optional]
├── instrumentation.ts          server observability register() (Sentry/OTel)              [present]
├── instrumentation-client.ts   client error + Web Vitals capture                          [present]
├── next.config.ts • tsconfig.json • eslint.config.mjs • vitest.config.ts • …              [present]
└── src/
    ├── app/                    ── ROUTING LAYER ONLY ──────────────────────────────────
    │   ├── (marketing)/        public pages route group: /, about, work, writing, uses…    [present]
    │   │   ├── layout.tsx       group-level chrome
    │   │   └── <segment>/page.tsx
    │   ├── api/                Route Handlers — chat/route.ts, health/route.ts              [present]
    │   ├── layout.tsx           root layout (fonts, providers, <html>)                      [present]
    │   ├── error.tsx • global-error.tsx • not-found.tsx • loading.tsx                       [present]
    │   ├── icon.tsx • apple-icon.tsx                                                        [present]
    │   ├── robots.ts • sitemap.ts                                                           [present]
    │   ├── (legal)/            colophon (privacy, terms when needed)                        [new]
    │   └── manifest.ts          PWA manifest                                                [new]
    │
    ├── features/               ── VERTICAL SLICES (one folder per capability) ───────────  [present]
    │   └── <feature>/          today: about, audio, command-menu, home, inspector, studio, world
    │       ├── components/      feature UI (server + client)
    │       ├── actions/         Server Actions ("use server")                               [optional]
    │       ├── queries/         server-side reads composing server integrations             [optional]
    │       ├── hooks/           feature-scoped hooks
    │       ├── schemas/         zod schemas (input/output contracts)
    │       ├── stores/          feature-scoped client state (zustand) — only if needed
    │       ├── emails/          feature email templates (React Email)                       [optional]
    │       ├── utils/           feature-private pure helpers
    │       ├── constants/       feature-owned constants, static data & authored content (world destinations, nodes…)
    │       ├── types.ts         feature types (grow into types/ when needed)
    │       ├── *.test.tsx       unit/component tests colocated beside the file they test
    │       └── index.ts         ★ curated public API — the ONLY import surface
    │
    ├── components/              ── SHARED, REUSABLE UI (presentational, 2+ features) ─────
    │   ├── ui/                  design-system primitives (button, badge, kbd, status-dot)  [present]
    │   ├── r3f/                 shared React Three Fiber infra (perf reporter, ctx guard)  [present]
    │   ├── seo/                 json-ld / structured-data UI                               [present]
    │   ├── layout/              app shell: header, site-nav, mobile-nav, footer            [new]
    │   ├── common/              cross-feature composites (cards, empty/error states)        [new]
    │   ├── article/             article building blocks (prose, headings, toc, diagrams…)   [new]
    │   └── og/                  Open Graph image templates                                 [new]
    │
    │                            ── CORE INFRASTRUCTURE & INTEGRATIONS (named top-level, no `lib/`) ──
    │                            server-only modules start with `import "server-only"`; rest stays isomorphic
    ├── ai/                      agent retrieval, prompts, embeddings        (server-only)  [present]
    ├── rate-limit.ts            shared IP rate-limiter (Upstash + fallback) (server-only)  [present]
    ├── email/                   generic senders — feature senders live in emails/           [optional]
    ├── seo/                     metadata + structured-data builders                         [present]
    ├── schemas/                 cross-cutting zod schemas shared across boundaries          [present]
    ├── utils/                   pure isomorphic helpers (cn, …)                              [present]
    ├── telemetry/               perf + web-vitals reporting helpers                          [present]
    ├── api/                     typed fetch client / API helpers                            [new]
    ├── errors.ts                typed error classes + Result helpers                         [new]
    ├── db/ • auth/ • payments/ • safe-action.ts   when the capability lands                [optional]
    │
    ├── hooks/                   SHARED client hooks (use-in-view, use-is-client, …)        [present]
    ├── providers/               client providers + composed <Providers> (theme, motion…)   [present]
    ├── stores/                  GLOBAL client state — external stores (boot, world, perf…)  [present]
    │
    ├── constants/               ── GLOBAL constants, enums & static data ─────────────────
    │   ├── routes.ts            typed route map + path builders — SSOT for every URL         [present]
    │   ├── patterns.ts          patterns taxonomy — tags every article                       [present]
    │   ├── career.ts            engagement history — feeds the RAG index                     [present]
    │   ├── room.ts              shared studio room dimensions                                [present]
    │   ├── agent-index.json     prebuilt RAG index (generated by scripts/)                   [present]
    │   └── app.constants.ts     limits, defaults, feature flags                              [new]
    │
    ├── config/                  ── STATIC CONFIG (single source of truth) ────────────────  [present]
    │   ├── site.ts              name, url, social, defaults, getSiteUrl()                    [present]
    │   ├── navigation.ts        nav/menu definitions (hrefs come from constants/routes.ts)  [present]
    │   ├── brand.ts             brand colors for non-CSS contexts (OG, icons, R3F, email)    [present]
    │   └── env.ts               Zod-validated environment (t3-env)                           [present]
    │
    ├── styles/                  globals.css (design tokens live here)                       [present]
    ├── types/                   global/ambient types (*.d.ts, shared domain types)         [present]
    └── middleware.ts            edge middleware (headers, redirects, rate-limit gate)      [optional]
```

## Layer responsibilities

### `app/` — routing only

Route segments and Next.js special files **only**. A `page.tsx` resolves params,
calls a feature query / server integration for data, sets `metadata`, and composes UI
from `features/` + `components/`. Group routes with `(group)` folders (e.g.
`(marketing)`, `(legal)`) to share layouts without affecting the URL. No business
logic, data access, or shared components here.

### `features/<feature>/` — vertical slices

Everything for one capability, colocated. Crossing a feature boundary means
importing from its **`index.ts`** only — internals stay private. A feature may
contain UI, hooks, server actions, server-only data access, schemas,
constants & static data, authored content, and tests. Keep each file small (~100 lines, lint-enforced);
split aggressively.

Authored content follows the same rule: a feature owns its content as typed
static data under its own `constants/` — e.g. `features/world/constants/` holds
the destination data (typed objects whose JSX bodies are composed from shared
`components/` building blocks). There is no `content/` folder; the feature's
`index.ts` exports the collection, which is how the command menu, sitemap, and
OG images consume it.

### `components/` — shared UI

Presentational, reusable, mostly stateless. `ui/` = primitives (no app/domain
imports); `layout/` = app shell; `common/` = shared composites; `r3f/` = shared
React Three Fiber infra (perf reporter, WebGL context guard) used by the 3D
features; `article/`, `seo/`, `og/` as named. If a component grows domain
logic/state, it belongs in a feature, not here.

### `hooks/`, `providers/`, `stores/` — shared client layer

- `hooks/` — shared client hooks (`use-in-view`, `use-is-client`); feature
  hooks stay inside the feature.
- `providers/` — client context providers (theme, motion, lenis, reduced
  motion) composed into one `<Providers>` in `providers/index.tsx`, mounted by
  the root layout.
- `stores/` — global zustand stores (perf, web-vitals, reduced motion);
  feature-scoped stores live in `features/<feature>/stores/`.

### Infrastructure & integrations — named top-level folders

Platform code lives in named folders directly under `src/` (no `lib/` wrapper),
with an explicit server/client boundary:

- **Server-only modules** (`ai/`, `email/`, `rate-limit.ts`, and later `db/`,
  `auth/`, `payments/`) start with `import "server-only"` so the build fails if
  they leak into a client component. Secrets and server SDKs live only here.
- **Isomorphic helpers** (`utils/`, `seo/`, `schemas/`, `telemetry/`) are
  pure and dependency-light — safe on client and server. No secrets, no
  Node-only APIs.

### `config/`, `constants/`, `types/`, `styles/`

- `config/` — static configuration: site metadata (`site.ts`), navigation
  (`navigation.ts`), brand colors (`brand.ts`), and the validated environment
  (`env.ts` — never raw `process.env` elsewhere).
- `constants/` — global constants, enums **and** static data shared by 2+
  features; `routes.ts` is the typed SSOT for every internal URL and path
  builder, plus the `patterns` taxonomy that tags every article and the
  generated `agent-index.json` RAG index. Never hardcode these literals
  elsewhere. Static data and authored content owned by a single feature
  (world destinations, hotspots, boot sequence) live in that feature's
  `constants/` instead. There is no `data/` or `content/` directory (top-level
  or per-feature) — everything follows the feature-first rule, with `constants/`
  as the home for feature data and content.
- `types/` — ambient declarations and shared domain types (article meta,
  system-diagram contracts).
- `styles/` — global CSS and design tokens (imported by the root layout).
- shared test setup, render helpers, mocks/fixtures, and MSW handlers live in
  `tests/` at the repo root, next to `tests/e2e/`.

## Anatomy of a feature (example: `inspector`)

```
features/inspector/
├── components/
│   ├── inspector-overlay.tsx     "use client"  (the ⌘K surface; POSTs to the route)
│   ├── inspector-panels.tsx      panel composition
│   └── inspector-format.ts       feature-private pure helpers
├── stores/
│   └── inspector-overlay-store.tsx  feature-scoped client state
└── index.ts                      export { InspectorOverlay, InspectorOverlayProvider, useInspectorOverlay }
```

Its query is handled by a thin **Route Handler** at `app/api/chat/route.ts`
(edge runtime): parse → validate with `@/schemas/agent` → rate-limit → retrieve →
stream. Every step delegates: retrieval and prompting live in `src/ai/`
(server-only), the shared IP rate-limiter in `src/rate-limit.ts` (server-only),
and the request/response contracts in `src/schemas/agent.ts`. The route itself
holds no business logic.

It degrades in layers rather than failing: no `OPENAI_API_KEY` returns `503` with
the top index matches, no embeddings falls back to the keyword/BM25 tier, and no
`UPSTASH_*` falls back to an in-memory token bucket. Cross-route concerns belong
in the shared infra folders, never in the route file.

## Where does X go? (decision guide)

| Adding…                             | Location                                        |
| ----------------------------------- | ----------------------------------------------- |
| A page or API route                 | `src/app/...` (thin)                            |
| A capability's UI + logic           | `src/features/<feature>/`                       |
| A generic primitive                 | `src/components/ui/`                            |
| App shell (nav/footer)              | `src/components/layout/`                        |
| A composite shared by 2+ features   | `src/components/common/`                        |
| DB query / repository               | `src/db/` (server-only, when a db lands)        |
| Server-side reads for a feature     | `src/features/<feature>/queries/`               |
| Email / AI / auth / db              | `src/{email,ai,auth,db}/` (server-only)         |
| Isomorphic helper (`cn`, format)    | `src/utils/`                                    |
| Zod schema shared across boundaries | global `src/schemas/` or feature `schemas/`     |
| Typed fetch / API client            | `src/api/`                                      |
| Site metadata, nav                  | `src/config/{site,navigation}.ts`               |
| A URL / route literal               | `src/constants/routes.ts` (typed SSOT)          |
| A global constant / enum            | `src/constants/`                                |
| Brand colors for canvas/OG/email    | `src/config/brand.ts`                           |
| Env var                             | `src/config/env.ts` — never raw `process.env`   |
| Global hook / store / provider      | `src/hooks/` • `src/stores/` • `src/providers/` |
| Authored content (typed data + JSX) | the owning feature's `constants/`               |
| Static data shared by 2+ features   | `src/constants/`                                |
| Static data owned by one feature    | `src/features/<feature>/constants/`             |
| Domain logic over feature data      | the consuming feature's `utils/`                |
| Test helper / mock                  | `tests/`                                        |

Reuse rule: used by **one** feature → keep it there; used by **2+** → promote to
`components/`, `hooks/`, `stores/`, `utils/`, or a shared infra folder.

## Conventions

- **Naming**: `kebab-case` files/dirs; `PascalCase` components; `useX` hooks;
  `is/has/can` booleans. One primary, **named** export per file.
- **Imports**: `@/…` alias only. Cross-feature imports go through `index.ts`.
  Avoid wide barrel files inside `components/` or the shared infra folders (tree-shaking + cycles).
- **Boundaries**: `"use client"` only on interactive leaves; `import "server-only"`
  on every server module. Feature data/content collections only via the owning
  feature's public API (`@/features/<feature>`).
- **Files small** (~100 lines, lint-enforced). Split into sub-components/hooks/helpers first.
- **Tests** colocate with source (`*.test.ts(x)`); E2E in `tests/e2e/`.

## Quality gates

`pnpm validate` = lint + typecheck + `format:check` + tests + `knip`. Plus
`pnpm test` / `e2e` (Vitest + Playwright/axe), `pnpm size` (size-limit),
`pnpm analyze` (bundle analyzer). Every structural change must pass `pnpm validate`.

CI (`.github/workflows/ci.yml`) runs the same gates plus `build` and `e2e`;
`audit.yml` audits production dependencies daily; `release-please.yml` maintains
the release PR. Nothing else runs, deliberately.

This repository is **private on a GitHub Free plan**, which removes capabilities
the workflows used to rely on. Keep this in mind before adding CI:

| Capability                   | Status on private + Free                                |
| ---------------------------- | ------------------------------------------------------- |
| Branch protection / rulesets | Unavailable — `main` is unprotected, no required checks |
| Code scanning (CodeQL)       | Unavailable — needs the paid Code Security add-on       |
| OSSF Scorecard               | Public repositories only                                |
| PR auto-merge                | Needs a required check to wait on, so unusable          |
| `CODEOWNERS`                 | Inactive (needs Pro or higher)                          |
| Actions minutes              | 2,000/month (public repositories are unlimited)         |
| Artifact storage             | 500 MB shared quota                                     |

Because minutes and artifact storage are now finite, CI uploads artifacts only on
failure and with short retention. `pnpm validate` locally is the cheap gate;
treat CI as confirmation, not as the first place a problem is found.

One known inefficiency is deliberate: the `e2e` job builds the app again rather
than consuming the `build` job's output. Sharing `.next` would mean either
artifact upload (a multi-hundred-MB write against a 500 MB quota) or cache-key
contention between the two jobs, both worse than one extra build.

## Migration map (complete — historical record)

Every row below has shipped as a small `pnpm validate`-gated commit; the tree
above is the realized result. Kept as a record of the legacy → current move.
One deviation: the contact sender ended in
`features/contact/emails/send-contact-notification.ts` (not `src/email/`) so
that the shared infra folders never import from `features/`.

| Today                                                             | Target                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/components/providers/*`                                      | `src/providers/`                                                                                       |
| `src/components/providers/reduced-motion-store.ts`                | `src/stores/reduced-motion-store.ts`                                                                   |
| `src/lib/hooks/*` (legacy)                                        | `src/hooks/`                                                                                           |
| `src/lib/telemetry/{perf,web-vitals}-store.ts` (legacy)           | `src/stores/`                                                                                          |
| `src/lib/{ai,seo,validations,telemetry,utils}/` + `rate-limit.ts` | `src/{ai,seo,schemas,telemetry,utils}/` + `rate-limit.ts` (no `lib/` wrapper; `validations`→`schemas`) |
| feature `lib/` (career-graph, world)                              | feature `utils/`                                                                                       |
| `src/config/routes.ts`                                            | `src/constants/routes.ts`                                                                              |
| `src/env.ts`                                                      | `src/config/env.ts`                                                                                    |
| `src/server/ai/*`                                                 | `src/ai/` (`import "server-only"`)                                                                     |
| `src/server/email/*`                                              | `src/email/` (`import "server-only"`)                                                                  |
| `src/server/rate-limit.ts`                                        | `src/rate-limit.ts` (`import "server-only"`)                                                           |
| `e2e/*`                                                           | `tests/e2e/` (+ `playwright.config.ts` update)                                                         |
| deep imports of `@/features/contact/…`                            | the `@/features/contact` public API                                                                    |
| `content/case-studies/*` + `lib/content/case-studies.ts`          | `features/work/{constants,utils}/` + `index.ts` API                                                    |
| `content/essays/*` + `lib/content/essays.ts`                      | `features/writing/{constants,utils}/` + `index.ts`                                                     |
| `components/common/case-study-card.tsx`                           | `features/work/components/`                                                                            |
| `components/common/essay-card.tsx`                                | `features/writing/components/`                                                                         |
| `content/schema/{article,system-diagram}.ts`                      | `src/types/`                                                                                           |
| `content/data/patterns.ts`                                        | `src/constants/patterns.ts`                                                                            |
| `content/agent-index.json`                                        | `src/constants/agent-index.json` (+ scripts)                                                           |
| `content/data/career-graph-{nodes,edges,node-types}.ts`           | `src/constants/career.ts`                                                                              |
| `content/data/operating.ts`                                       | `src/constants/career.ts`                                                                              |
| `content/data/about.ts`                                           | `features/about/constants/`                                                                            |
| `content/data/uses.ts`                                            | `features/uses/constants/`                                                                             |
| `content/data/colophon.ts`                                        | `features/colophon/constants/`                                                                         |
| `src/content/` (emptied by the rows above)                        | deleted                                                                                                |

Optional layers (`src/db`, `src/auth`, `messages/`, `src/middleware.ts`) are
added only when that capability lands.

## Architecture Decision Records

Record significant choices in `docs/adr/NNNN-title.md` (context → decision →
consequences). First candidates: the `features/` slicing model, the server-only
vs isomorphic split across the named infra folders, and feature-owned content-as-typed-data.
