# Architecture

The **gold-standard, production-grade** structure for a modern Next.js (App
Router) codebase, tailored to **diogo-studio**. It encodes `.windsurf/rules/` and
is the target the codebase migrates toward. When in doubt, this document wins.

This is the _target_ architecture, not a description of today's tree. Folders are
marked **[present]**, **[new]** (introduce as code needs it), or **[optional]**
(only when the relevant capability exists — auth, db, i18n, etc.). Empty target
folders are scaffolded with a `.gitkeep`; replace it with the first real file.
`[optional]` capability folders (auth, db, i18n) are added only when that
capability lands.

## Core ideas

- **Layered + feature-first.** Thin routing on top, vertical feature slices in the
  middle, shared UI and platform code at the bottom.
- **`app/` routes only.** Pages compose; they don't implement.
- **`lib/` is isomorphic, `server/` is server-only.** The split is explicit and
  enforced with `import "server-only"`.
- **Curated public surface per feature.** Other code imports a feature only
  through its `index.ts`, never its internals.
- **One direction of dependencies** (top imports down, never up):

```
app/  →  features/  →  components/ ─┐
                    →  server/  ────┼→  lib/  →  config/ , types/
                    →  content/ ────┘
```

`ui/` primitives and `lib/` utilities are leaves — they import nothing above them.

## Stack

| Concern             | Choice                                                             |
| ------------------- | ------------------------------------------------------------------ |
| Framework / runtime | Next.js 16 (App Router), React 19                                  |
| Language            | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)                |
| Styling             | Tailwind v4, `cva` + `cn` (`clsx` + `tailwind-merge`)              |
| UI primitives       | Radix UI, `cmdk`, `vaul`, `sonner`, `lucide-react`                 |
| Content             | MDX via **Velite** (`#content` → `.velite`)                        |
| 3D / motion         | `three` + React Three Fiber + drei, `motion`, `lenis`              |
| Forms / validation  | `react-hook-form` + `zod` (`@hookform/resolvers`)                  |
| AI                  | Vercel AI SDK + `@ai-sdk/openai` (RAG over a prebuilt index)       |
| Email               | Resend + React Email                                               |
| State (client)      | URL state first; `zustand` for cross-component UI state            |
| Env                 | `@t3-oss/env-nextjs` (Zod-validated) → `src/env.ts`                |
| Observability       | Sentry, Vercel Analytics + Speed Insights, `web-vitals`            |
| Rate limiting       | Upstash Redis + Ratelimit                                          |
| Tooling             | pnpm, ESLint, Prettier, Vitest, Playwright + axe, knip, size-limit |

## Path aliases

- `@/*` → `src/*` — always use this; never deep relative imports (`../../../`).
- `#content` → `.velite` — generated, type-safe content collections.

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
├── e2e/                        Playwright specs, fixtures, page objects                    [present]
├── public/                     static assets served as-is (images, icons, fonts)           [present]
├── scripts/                    build/maintenance scripts (tsx)                             [present]
├── messages/                   i18n catalogs (en.json, …)                                  [optional]
├── instrumentation.ts          server observability register() (Sentry/OTel)              [present]
├── instrumentation-client.ts   client error + Web Vitals capture                          [present]
├── velite.config.ts            content pipeline                                            [present]
├── next.config.ts • tsconfig.json • eslint.config.mjs • vitest.config.ts • …              [present]
└── src/
    ├── app/                    ── ROUTING LAYER ONLY ──────────────────────────────────
    │   ├── (marketing)/        public pages route group: /, about, work, writing, uses…    [new]
    │   │   ├── layout.tsx       group-level chrome
    │   │   └── <segment>/page.tsx
    │   ├── (legal)/            privacy, terms, colophon                                     [optional]
    │   ├── api/                Route Handlers — <name>/route.ts                             [present]
    │   ├── layout.tsx           root layout (fonts, providers, <html>)                      [present]
    │   ├── error.tsx • global-error.tsx • not-found.tsx • loading.tsx                       [present]
    │   ├── opengraph-image.tsx • icon.tsx • apple-icon.tsx • favicon.ico                    [present]
    │   └── manifest.ts • robots.ts • sitemap.ts                                             [present]
    │
    ├── features/               ── VERTICAL SLICES (one folder per capability) ───────────  [new]
    │   └── <feature>/          e.g. career-graph, studio, command-menu, contact, agent
    │       ├── components/      feature UI (server + client)
    │       ├── hooks/           feature-scoped hooks
    │       ├── actions/         Server Actions ("use server")
    │       ├── server/          server-only data/services for this feature
    │       ├── schemas/         zod schemas (input/output contracts)
    │       ├── stores/          client state (zustand) — only if needed
    │       ├── lib/             feature-private pure helpers
    │       ├── types.ts • constants.ts
    │       ├── __tests__/       unit/component tests (or *.test.tsx beside files)
    │       └── index.ts         ★ curated public API — the ONLY import surface
    │
    ├── components/              ── SHARED, REUSABLE UI (presentational) ──────────────────
    │   ├── ui/                  design-system primitives (button, badge, input, kbd…)      [present]
    │   ├── layout/              app shell: header, site-nav, mobile-nav, footer            [new]
    │   ├── common/              cross-feature composites (cards, empty/error states)        [new]
    │   ├── mdx/                 MDX component map + content blocks                          [present]
    │   ├── seo/                 json-ld / structured-data UI                               [present]
    │   ├── og/                  Open Graph image templates                                 [present]
    │   └── providers/           app-wide client providers (theme, motion, toaster)         [present]
    │
    ├── server/                  ── SERVER-ONLY CORE (no JSX/UI) — import "server-only" ────  [new]
    │   ├── data/                Data Access Layer (repositories, queries)
    │   ├── services/            domain/business logic orchestration
    │   ├── ai/                  agent retrieval, prompts, embeddings
    │   ├── email/               transactional senders (Resend)
    │   ├── db/                  db client + schema + migrations (Drizzle/Prisma)           [optional]
    │   └── auth/                session, RBAC, guards                                       [optional]
    │
    ├── lib/                     ── ISOMORPHIC UTILITIES (client + server safe) ───────────
    │   ├── api/                 typed fetch client / API helpers                           [new]
    │   ├── analytics/           analytics + Web Vitals reporting                           [new]
    │   ├── seo/                 metadata + structured-data builders                        [new]
    │   ├── validations/         cross-cutting zod schemas shared across boundaries         [new]
    │   ├── utils/               pure helpers (cn, format, slugify)                          [present]
    │   ├── telemetry/           perf + web-vitals stores                                   [present]
    │   ├── hooks/               generic isomorphic hooks (use-is-client)                   [present]
    │   └── errors.ts            typed error classes + Result helpers                        [new]
    │
    ├── config/                  ── STATIC CONFIG (single source of truth) ────────────────  [new]
    │   ├── site.ts              name, url, social, defaults
    │   ├── navigation.ts        nav/menu definitions
    │   ├── routes.ts            typed route map
    │   └── seo.ts               default metadata/OG config
    │
    ├── content/                 MDX sources + content data (Velite → #content)             [present]
    │   ├── case-studies/ • essays/
    │   └── data/                structured content data (career-graph data, …)             [new]
    │
    ├── hooks/                   GLOBAL shared client hooks (use-media-query, use-mounted)  [optional]
    ├── stores/                  GLOBAL client state (zustand) — app-wide only              [optional]
    ├── styles/                  globals.css, mdx.css, tokens.css                           [new]
    ├── types/                   global/ambient types (*.d.ts, shared domain types)         [new]
    ├── test/                    setup, render utils, mocks, fixtures, msw handlers         [new]
    ├── env.ts                   Zod-validated environment                                  [present]
    └── middleware.ts            edge middleware (headers, redirects, rate-limit gate)      [optional]
```

## Layer responsibilities

### `app/` — routing only

Route segments and Next.js special files **only**. A `page.tsx` resolves params,
calls a feature/`server` function for data, sets `metadata`, and composes UI from
`features/` + `components/`. Group routes with `(group)` folders (e.g.
`(marketing)`, `(legal)`) to share layouts without affecting the URL. No business
logic, data access, or shared components here.

### `features/<feature>/` — vertical slices

Everything for one capability, colocated. Crossing a feature boundary means
importing from its **`index.ts`** only — internals stay private. A feature may
contain UI, hooks, server actions, server-only data access, schemas, and tests.
Keep each file small (~200 lines); split aggressively.

### `components/` — shared UI

Presentational, reusable, mostly stateless. `ui/` = primitives (no app/domain
imports); `layout/` = app shell; `common/` = shared composites; `mdx/`, `seo/`,
`og/`, `providers/` as named. If a component grows domain logic/state, it belongs
in a feature, not here.

### `server/` vs `lib/` — the critical split

- **`server/`** is **server-only** (`import "server-only"` at the top): DAL,
  services, AI, email, db, auth, secrets. Never imported by a client component.
- **`lib/`** is **isomorphic** — pure, dependency-light helpers that are safe on
  client and server (formatters, `cn`, shared zod schemas, typed fetch, error
  helpers). No secrets, no Node-only APIs.

### `config/`, `content/`, `types/`, `styles/`, `test/`

- `config/` — the single source of truth for site metadata, navigation, routes.
  Never hardcode these literals elsewhere.
- `content/` — MDX (via Velite) + structured content data.
- `types/` — ambient declarations and shared domain types.
- `styles/` — global CSS and design tokens (imported by the root layout).
- `test/` — shared setup, render helpers, mocks/fixtures, MSW handlers.

## Anatomy of a feature (example: `contact`)

```
features/contact/
├── components/
│   ├── contact-form.tsx          "use client"  (RHF + zod resolver)
│   └── contact-fields.tsx
├── actions/
│   └── submit-contact.ts         "use server"  (validate → rate-limit → send)
├── server/
│   └── send-contact-email.ts     import "server-only"  (Resend)
├── schemas/
│   └── contact.ts                zod schema (shared by form + action)
├── hooks/use-contact-form.ts
├── types.ts
├── __tests__/contact-form.test.tsx
└── index.ts                      export { ContactForm }  // public surface
```

## Where does X go? (decision guide)

| Adding…                             | Location                                           |
| ----------------------------------- | -------------------------------------------------- |
| A page or API route                 | `src/app/...` (thin)                               |
| A capability's UI + logic           | `src/features/<feature>/`                          |
| A generic primitive                 | `src/components/ui/`                               |
| App shell (nav/footer)              | `src/components/layout/`                           |
| A composite shared by 2+ features   | `src/components/common/`                           |
| DB query / repository               | `src/server/data/`                                 |
| Domain/business logic               | `src/server/services/`                             |
| Email / AI / auth / db              | `src/server/{email,ai,auth,db}/`                   |
| Isomorphic helper (`cn`, format)    | `src/lib/utils/`                                   |
| Zod schema shared across boundaries | `src/lib/validations/` or feature `schemas/`       |
| Typed fetch / API client            | `src/lib/api/`                                     |
| Site metadata, nav, routes          | `src/config/`                                      |
| Env var                             | `src/env.ts` (validated) — never raw `process.env` |
| Global hook / store                 | `src/hooks/` • `src/stores/`                       |
| Long-form content                   | `src/content/`                                     |
| Test helper / mock                  | `src/test/`                                        |

Reuse rule: used by **one** feature → keep it there; used by **2+** → promote to
`components/`, `lib/`, or `server/`.

## Conventions

- **Naming**: `kebab-case` files/dirs; `PascalCase` components; `useX` hooks;
  `is/has/can` booleans. One primary, **named** export per file.
- **Imports**: `@/…` alias only. Cross-feature imports go through `index.ts`.
  Avoid wide barrel files inside `components/`/`lib/` (tree-shaking + cycles).
- **Boundaries**: `"use client"` only on interactive leaves; `import "server-only"`
  on every server module. Content via `#content` only.
- **Files small** (~200 lines). Split into sub-components/hooks/helpers first.
- **Tests** colocate with source (`*.test.ts(x)`); E2E in `e2e/`.

## Quality gates

`pnpm validate` = lint + typecheck + `format:check` + tests + `knip`. Plus
`pnpm test` / `e2e` (Vitest + Playwright/axe), `pnpm size` (size-limit),
`pnpm analyze` (bundle analyzer). Every structural PR must pass `pnpm validate`.

## Migration map (current → target)

| Today                                  | Target                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `app/page.tsx`, route pages (root)     | `app/(marketing)/…` route group, thinned                       |
| `app/page.test.tsx`                    | test beside extracted units (keep `app/` route-only)           |
| `app/globals.css`, `app/mdx.css`       | `src/styles/` (imported by root layout)                        |
| `components/site/*` (chrome)           | `components/layout/`                                           |
| `components/site/*` (features)         | `features/{command-menu,contact}/…`, `features/inspector/…`    |
| `components/career-graph/*` + `scene/` | `features/career-graph/`                                       |
| `components/studio/*`                  | `features/studio/`                                             |
| `lib/agent/*`                          | `server/ai/`                                                   |
| `lib/contact-schema.ts`                | `features/contact/schemas/` (or `lib/validations/`)            |
| `lib/structured-data.ts`               | `lib/seo/`                                                     |
| `lib/site-config.ts`                   | `config/site.ts`                                               |
| `content/career-graph.ts`              | `content/data/` (data) or `features/career-graph/lib/` (logic) |
| `lib/utils.ts`                         | `lib/utils/` (cn, formatters, …)                               |

Execute as small, independently reviewable PRs, one slice at a time, running
`pnpm validate` after each. Optional layers (`server/db`, `server/auth`,
`messages/`, `stores/`) are added only when that capability lands.

## Architecture Decision Records

Record significant choices in `docs/adr/NNNN-title.md` (context → decision →
consequences). First candidates: the `features/` slicing model, the `lib/` vs
`server/` split, and content-as-Velite.

```

```
