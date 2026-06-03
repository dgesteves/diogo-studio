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
  `mdx/`, `seo/`, `og/`, `providers/`.
- `src/server/` — **server-only** core (`import "server-only"`): `data/` (DAL),
  `services/`, `ai/`, `email/`, optional `db/` and `auth/`.
- `src/lib/` — **isomorphic** utilities (client + server safe): `utils/`, `api/`,
  `validations/`, `seo/`, `analytics/`, `telemetry/`, `hooks/` (isomorphic hooks,
  distinct from app-wide `src/hooks/`), `errors.ts`.
- `src/config/` — site metadata, navigation, routes (single source of truth).
- `src/content/` — MDX + structured data. `src/styles/` — global CSS + tokens.
  `src/types/` — global types. `src/test/` — test utils/mocks/fixtures.
- `src/hooks/` • `src/stores/` — global hooks / client state (app-wide only).

## Conventions

- **Colocate by feature** outside `app/`; promote to shared only when reused 2+
  times. Resist premature abstraction.
- **Keep files small** (~200 lines max). When a component, route, or module grows
  past that, split it into smaller sub-components, hooks, or helper files.
- **Naming**: `kebab-case` files/dirs, `PascalCase` components, `useX` hooks,
  `is/has/can` booleans. One primary, **named** export per file.
- A feature's `index.ts` exposes a **small, curated public API** (its only import
  surface). Avoid wide barrels in `components/`/`lib/` that re-export everything —
  they hurt tree-shaking and invite circular imports.
- Centralize config/env/constants; never hardcode the same literal twice.
- Mark server-only modules with `import "server-only"`; client-only files start
  with `"use client"`. Keep the boundary explicit.
