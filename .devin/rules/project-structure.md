---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Architecture & project structure

Canonical, repo-specific layout lives in `docs/architecture.md` — consult it for
folder placement. The principles below are the enforced defaults.

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
  (`_components/`, `_lib/`) so it stays non-routable — but prefer the shared tree.

## Where everything else lives

- `src/features/<feature>/` — vertical slices: `components/`, `hooks/`,
  `actions/`, `server/`, `schemas/`, `types.ts`, plus a curated `index.ts` that
  is the **only** import surface for the feature.
- `src/components/` — shared presentational UI: `ui/` (primitives), `layout/`
  (app shell), `common/` (composites), `r3f/` (shared React Three Fiber infra),
  `article/` (article block renderer + content components), `seo/`, `og/`,
  `providers/`.
- `src/server/` — **server-only** core (`import "server-only"`): `ai/`, `email/`,
  shared `rate-limit.ts`; optional `data/` (DAL), `services/`, `db/`, `auth/`
  added only when those capabilities land (this is a no-DB content site).
- `src/lib/` — **isomorphic** utilities (client + server safe): `utils/`,
  `content/` (content query/transform helpers), `validations/`, `seo/`,
  `telemetry/`, `hooks/` (isomorphic hooks, distinct from app-wide `src/hooks/`).
- `src/config/` — site metadata (`site.ts`), navigation (`navigation.ts`), the
  typed route map (`routes.ts` — the SSOT for every URL), and brand colors for
  non-CSS contexts like OG/icons/R3F/email (`brand.ts`).
- `src/content/` — **pure** structured data only: typed article inputs
  (`case-studies/`, `essays/` — meta + body blocks per article folder), the
  block/collection types in `schema/`, and `data/` (e.g. the `patterns`
  taxonomy, career-graph `nodes`/`edges`). Derivation (permalinks, toc, reading
  stats) lives in `src/lib/content/`; domain logic over content data lives in
  the consuming feature's `lib/`. `src/styles/` — global CSS + tokens.
  `src/types/` — global types. `src/test/` — test utils/mocks/fixtures.
- `src/hooks/` • `src/stores/` — global hooks / client state (app-wide only).

## Conventions

- **Colocate by feature** outside `app/`; promote to shared only when reused 2+
  times. Resist premature abstraction.
- **Keep files small** (100 lines max, lint-enforced). When a component, route,
  or module grows past that, split it into smaller sub-components, hooks, or
  helper files (see "Single responsibility" below).
- **Naming**: `kebab-case` files/dirs, `PascalCase` components, `useX` hooks,
  `is/has/can` booleans. One primary, **named** export per file.
- A feature's `index.ts` exposes a **small, curated public API** (its only import
  surface). Avoid wide barrels in `components/`/`lib/` that re-export everything —
  they hurt tree-shaking and invite circular imports.
- **No magic values — name them, then place them by scope.** Don't inline
  unexplained numbers or meaningful/repeated strings; give them a named `const` /
  `as const` (or a union). Place at the narrowest scope that removes the magic: a
  top-of-file `const` for single-file use → a feature `constants.ts` when shared
  across that feature → `src/config/` for site/config data (names, URLs, routes,
  nav) → `src/content/` for copy. Promote outward only on reuse; never build a
  global `constants.ts` dump. Trivial one-off literals (a unique label) may stay
  inline.
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
  (effects, refs, subscriptions, derived state). One hook per file. Isomorphic,
  generic hooks live in `src/lib/hooks/`; app-wide ones in `src/hooks/`.
- **Server data access** (`server/data/`, DAL) — the only place that reads/writes
  the data source. `import "server-only"`. Returns typed, validated data.
- **Services** (`server/services/`) — server-side business logic / orchestration
  and third-party integrations (AI, email, payments). Composes the DAL; never
  called directly from client components.
- **Server Actions** (`actions/`, `"use server"`) — thin mutation entry points:
  authenticate, validate input with a schema, call a service, revalidate. No
  business logic inline — delegate to a service.
- **Types** (`types.ts`, `src/types/`) — `type`/`interface` declarations only,
  no runtime code. Co-locate feature types in the feature's `types.ts`; truly
  global/shared types go in `src/types/`. Export domain types from Zod schemas
  with `z.infer` rather than re-declaring them.
- **Schemas** (`schemas/`, `src/lib/validations/`) — Zod schemas as the single
  source of truth for shape + runtime validation at every boundary (forms,
  actions, route handlers, external APIs).
- **Constants / config** — named values, not magic literals. Narrowest scope
  wins: file-local `const` → feature `constants.ts` → `src/config/` for
  site/nav/routes → `src/content/` for copy. Never a global `constants.ts` dump.
- **Utils** (`lib/utils/`) — pure, isomorphic, side-effect-free helpers. One
  cohesive concern per file; no React, no env, no I/O.
- **Stores** (`src/stores/`) — app-wide client state only. Keep server state in
  the server/data layer, not mirrored into a store.
