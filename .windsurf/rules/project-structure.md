---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Project structure & organization

- **Colocate by feature/route.** Keep a route's components, hooks, and helpers
  near where they are used; promote to a shared location only when reused in 2+
  places. Resist premature abstraction.
- Suggested layout (adapt to the repo — don't fight an existing convention):
  - `app/` — route segments, layouts, route handlers, metadata files.
  - `components/` — shared UI; `components/ui/` for primitives.
  - `lib/` — framework-agnostic logic, clients, helpers (e.g. `lib/utils.ts` → `cn`).
  - `hooks/` — shared client hooks. `types/` — shared types. `config/` — constants.
  - `server/` or `lib/data/` — the server-only Data Access Layer.
- **Naming**: `kebab-case` for files/dirs, `PascalCase` for components, `useX`
  for hooks, `is/has/can` for booleans.
- One primary, **named** export per file. Avoid wide barrel `index.ts`
  re-exports — they hurt tree-shaking and invite circular imports.
- Centralize config/env/constants; never hardcode the same literal twice.
- Mark server-only modules with `import "server-only"`; client-only files start
  with `"use client"`. Keep the boundary explicit.
