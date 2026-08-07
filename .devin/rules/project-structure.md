---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Architecture & project structure

Feature-first vertical slices, one dependency direction, and **ownership decided
by who imports it**. Never import upward.

> **Migration in progress.** `docs/restructure-plan.md` is moving the tree toward
> the layout below. Where this rule and the current folders disagree, follow this
> rule for **new** code and let the plan's phases move the old code. Do not
> "fix" new code to match the old shape.

## `app/` is the routing layer only

`src/app/` contains **only** route segments and Next.js special files: `page`,
`layout`, `template`, `default`, `loading`, `error`, `not-found`, `global-error`,
`route`, metadata files (`icon`, `apple-icon`, `sitemap`, `robots`, `manifest`),
route groups `(group)`, dynamic segments `[param]`, parallel slots `@slot`.

Route files stay thin: resolve params, set `metadata`, compose UI imported from
outside `app/`. No components, business logic, or data access. Nothing imports
from `app/` — it is a leaf.

## Ownership: the two-importer test

**Put code in the feature that uses it. Promote to a shared folder only when two
or more features actually import it.** Demote when that stops being true.

This is the rule that matters most — violating it is what produced shared folders
holding single-consumer code. When you are unsure where something belongs, count
the importing features. One → it belongs inside that feature.

## Where things live

```
src/
  app/                 routing only
  features/<feature>/  vertical slice — see below
  components/          UI imported by 2+ features (ui/ = primitives, sections/, seo/)
  config/              env.ts, site.ts, routes.ts, navigation.ts, seo/
  lib/                 pure isomorphic helpers (cn) + server-only modules (rate-limit)
  stores/              state written by one feature and read by another — nothing else
  providers/           client context providers, composed in providers/index.tsx
  styles/              globals.css + design tokens
```

A feature owns everything it alone uses:

```
features/<feature>/
  index.ts             ★ curated public API — the ONLY cross-feature import surface
  *.tsx *.ts           components, hooks, stores, utils — flat while the count is small
  <sub-area>/          one level of grouping, only for a real cluster (≥5 related files)
  data/                typed static data / authored content owned by this feature
  generated/           build-generated artifacts — never hand-edited
  types.ts
  *.test.ts(x)         colocated beside the file under test
```

Do **not** add a `components/` passthrough folder inside a feature, and do not
create `hooks/`, `utils/`, or `stores/` subfolders until there are enough files to
justify them. One level of grouping, not two.

## Naming

- `kebab-case` files and directories; `PascalCase` components; `useX` hooks;
  `is/has/can` booleans. One primary, **named** export per file.
- **The folder is the namespace — never repeat it in the filename.**
  `world/boot/splash.tsx`, not `world/components/boot-splash.tsx`. If several
  files share a prefix, that prefix wants to be a folder.
- Never encode a path twice (`lounge/lounge-tv-channels/`). Read the full import
  path aloud; if a word repeats, rename.
- Generated files live in `generated/` so it is obvious they are not authored.

## File and function size

- **Functions** carry the complexity budget: keep them short and single-purpose
  (~50 lines is a good ceiling; `max-lines-per-function` enforces it).
- **File length is not a design signal.** Do not split a cohesive module to hit a
  line count. Shaders, procedural geometry, canvas draw routines, and static data
  are legitimately long — leave them whole.
- Split a file when it mixes **concerns**, not when it crosses a threshold. Good
  seams: rendering vs. state, pure helpers vs. effects, data vs. behaviour.
- Prefer one 200-line module with a clear job over four 50-line fragments that
  only exist to import each other.

## Boundaries & imports

- Use the `@/…` alias for cross-area imports; use **relative** paths inside a
  feature. Never `../../../`, and never `@/features/X` from inside `features/X`.
- Cross-feature imports go through the target's `index.ts` — no deep imports
  (`@/features/world`, never `@/features/world/scene/screens/canvas-texture`).
- Shared folders (`components/`, `lib/`, `config/`, `providers/`) never import
  from `features/` or `app/`.
- Mark server-only modules `import "server-only"`; client files start with
  `"use client"`, pushed to the leaves. Never mix the two in one module.
- **No magic values.** Name them at the narrowest useful scope: file-local
  `const` → the feature's `data/` or a feature constants module → `config/` when
  genuinely global. `config/routes.ts` is the typed SSOT for every internal URL.

## State

Client state uses hand-rolled external stores read via `useSyncExternalStore` —
there is **no store library** in this repo, and adding one needs a decision entry.
Keep server state on the server; do not mirror it into a store.
