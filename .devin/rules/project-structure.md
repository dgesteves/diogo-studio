---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Architecture & project structure

Feature-first vertical slices with one dependency direction:
`app/` → `features/` → `components/` / `hooks/` / `providers/` / `stores/` →
`utils/` / `ai/` / `seo/` / `schemas/` / `telemetry/` →
`config/` / `constants/` / `types/`. Never import upward.

## `app/` is the routing layer only

- `src/app/` contains **only** route segments and Next.js special files —
  nothing else:
  - `page.tsx`, `layout.tsx`, `template.tsx`, `default.tsx`
  - `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`
  - `route.ts` (API / Route Handlers)
  - metadata files: `opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`,
    `sitemap.ts`, `robots.ts`, `manifest.ts`
  - route groups `(group)`, dynamic segments `[param]`, parallel slots `@slot`.
- **Keep route files thin.** A `page.tsx`/`layout.tsx` resolves params + data and
  composes UI imported from outside `app/`. It is not where components, business
  logic, or data access live.
- Do not put shared components, hooks, utils, or domain logic under `app/`. If
  code is genuinely route-private, use a Next.js **private folder**
  (`_components/`, `_utils/`) so it stays non-routable — but prefer the shared tree.

## Where everything else lives

- `src/features/<feature>/` — vertical slices: `components/`, `actions/`
  (Server Actions), `queries/` (server-side reads), `hooks/`, `schemas/`,
  `stores/`, `emails/`, `utils/`, `types.ts`, `constants/` or
  `constants.ts` (feature-owned constants, static data **and** authored
  content — e.g. articles), plus a curated `index.ts` that is the **only**
  import surface for the feature.
- `src/components/` — shared presentational UI used by 2+ features: `ui/`
  (design-system primitives), `layout/` (app shell — nav, footer), `common/`
  (shared composites), plus domain-neutral groups promoted on reuse
  (`article/`, `seo/`, `og/`, `r3f/`).
- Core infrastructure & integrations live in **named top-level folders by
  type** — there is no catch-all `src/lib/`. Server-only modules (`src/ai/`,
  `src/rate-limit.ts`, and later `src/email/`, `src/db/`, `src/auth/`,
  `src/payments/`) start with `import "server-only"`; isomorphic, pure modules
  (`src/utils/`, `src/seo/`, `src/schemas/`, `src/telemetry/`) carry no
  secrets and run on client or server. Never mix the two in one module.
- `src/hooks/` — shared client hooks. `src/providers/` — client context
  providers composed into one `<Providers>` (`providers/index.tsx`).
  `src/stores/` — global client state (Zustand).
- `src/constants/` — global constants, enums **and** static data shared by 2+
  features (taxonomies, generated indexes like `agent-index.json`); `routes.ts`
  is the typed SSOT for every internal URL and path builder. There is no
  separate `src/data/` — constants and static data live together here.
  Single-feature static data and authored content live in that feature's
  `constants/` — there is no `content/` directory (top-level or per-feature);
  features keep all static data and content under `constants/`.
- `src/config/` — static configuration: `site.ts`, `navigation.ts`, `brand.ts`,
  and `env.ts` (Zod-validated env — never raw `process.env` elsewhere).
- `src/styles/` — global CSS + design tokens. `src/types/` — truly global
  types.
- `tests/` — `e2e/` (Playwright), `mocks/`, shared setup; unit tests colocate
  with source (`*.test.ts(x)`).

## Conventions

- **Colocate by feature** outside `app/`; promote to shared only when reused 2+
  times. Resist premature abstraction.
- **Keep files small** (~100 lines). When a component, route, or module grows
  past that, split it into smaller sub-components, hooks, or helper files (see
  "Single responsibility" below).
- **Naming**: `kebab-case` files/dirs, `PascalCase` components, `useX` hooks,
  `is/has/can` booleans. One primary, **named** export per file.
- A feature's `index.ts` exposes a **small, curated public API** (its only import
  surface). Avoid wide barrels in `components/` or the shared infra folders that
  re-export everything — they hurt tree-shaking and invite circular imports.
- **No magic values — name them, then place them by scope.** Don't inline
  unexplained numbers or meaningful/repeated strings; give them a named `const` /
  `as const` (or a union). Place at the narrowest scope that removes the magic: a
  top-of-file `const` for single-file use → a feature `constants.ts` when shared
  across that feature → `src/constants/` when shared by 2+ features (split by
  domain: `routes.ts`, `app.constants.ts` — never one dump file). Static config
  objects (site name, nav, brand, env) belong in `src/config/`, not `constants/`.
  Trivial one-off literals (a unique label) may stay inline.
- Mark server-only modules with `import "server-only"`; client-only files start
  with `"use client"`. Keep the boundary explicit.

## Single responsibility — one file, one concern

Each file does **one** job and exports **one** primary, named thing. When a file
mixes concerns or nears the 100-line cap, split along these seams. Default to
**colocation inside the feature** (`src/features/<feature>/…`); promote to a
shared location only on 2+ reuse.

- **Components** (`components/`, `*.tsx`) — rendering only (markup, layout,
  presentational props). No data fetching, no business rules. A `"use client"`
  component holds UI state/handlers; push `"use client"` to the leaves and keep
  parents as Server Components. Split a large component into sub-components, and
  lift any non-render logic into a hook or helper.
- **Hooks** (`hooks/`, `use-*.ts`) — reusable **client** stateful logic
  (effects, refs, subscriptions, derived state). One hook per file. Feature
  hooks stay in the feature; shared hooks live in `src/hooks/`.
- **Server integrations** (`src/{ai,email,db,auth,payments}/`,
  `import "server-only"`) — the only place that touches data sources, secrets,
  and server-side third-party SDKs. Returns typed, validated data; never
  imported by a client component.
- **Queries** (`queries/`) — feature server-side reads that compose the server
  integrations (`src/ai/`, `src/email/`, …) and return DTOs to pages.
- **Server Actions** (`actions/`, `"use server"`) — thin mutation entry points:
  authenticate, validate input with a schema, call a server integration or
  feature helper, revalidate. No business logic inline.
- **Types** (`types.ts`, `src/types/`) — `type`/`interface` declarations only,
  no runtime code. Co-locate feature types in the feature's `types.ts`; truly
  global/shared types go in `src/types/`. Export domain types from Zod schemas
  with `z.infer` rather than re-declaring them.
- **Schemas** (feature `schemas/`, global `src/schemas/`) — Zod schemas as the
  single source of truth for shape + runtime validation at every boundary
  (forms, actions, route handlers, external APIs).
- **Constants & static data / config** — named values and static data, not
  magic literals. Narrowest scope wins: file-local `const` → feature
  `constants/` → `src/constants/` (`routes.ts` is the typed SSOT for URLs;
  shared taxonomies and generated indexes live here too). Site/nav/brand/env
  config lives in `src/config/`.
- **Utils** (`src/utils/`, feature `utils/`) — pure, isomorphic, side-effect-free
  helpers. One cohesive concern per file; no React, no env, no I/O.
- **Providers** (`src/providers/`, `*-provider.tsx`) — client context
  providers; compose them once in `providers/index.tsx` and mount in the root
  layout.
- **Stores** (`src/stores/`) — app-wide client state only. Keep server state on
  the server, not mirrored into a store.

## Import rules & boundaries

- `features/*` never import from `app/`.
- Cross-feature imports go through the target feature's `index.ts` only —
  better: lift shared code to `components/` or a shared infra folder
  (`utils/`, `ai/`, `seo/`, …).
- `components/`, `utils/`, `ai/`, `seo/`, `schemas/`, `telemetry/`, `hooks/`,
  `providers/`, `stores/` never import from `features/` or `app/`.
- No deep imports into a feature: `@/features/contact`, never
  `@/features/contact/schemas/…`.
