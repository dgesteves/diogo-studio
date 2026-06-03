---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Architecture & project structure

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

- `src/components/` — shared UI; `src/components/ui/` for primitives.
- `src/lib/` — framework-agnostic logic, clients, helpers (`lib/utils.ts` → `cn`).
- `src/lib/data/` or `src/server/` — the server-only Data Access Layer.
- `src/hooks/` — shared client hooks. `src/types/` — shared types.
- `src/config/` — constants/config. `src/features/<feature>/` — feature modules
  (components + hooks + logic colocated, imported by the matching route).

## Conventions

- **Colocate by feature** outside `app/`; promote to shared only when reused 2+
  times. Resist premature abstraction.
- **Keep files small** (~200 lines max). When a component, route, or module grows
  past that, split it into smaller sub-components, hooks, or helper files.
- **Naming**: `kebab-case` files/dirs, `PascalCase` components, `useX` hooks,
  `is/has/can` booleans. One primary, **named** export per file.
- Avoid wide barrel `index.ts` re-exports — they hurt tree-shaking and invite
  circular imports.
- Centralize config/env/constants; never hardcode the same literal twice.
- Mark server-only modules with `import "server-only"`; client-only files start
  with `"use client"`. Keep the boundary explicit.
