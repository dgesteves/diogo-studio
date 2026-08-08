---
trigger: model_decision
description: Apply when creating files or folders, organizing modules, naming things, deciding where code should live, or structuring features and components.
---

# Architecture & project structure

Feature-first vertical slices, one dependency direction, and **ownership decided
by who imports it**. Never import upward.

> **Phase 0 has landed; Phases 1–7 are blocked on `docs/testing-plan.md`.**
> `docs/restructure-plan.md` will move the tree toward the layout below, but no
> further phase may begin until the test suite can prove a move changed no
> behaviour. Where this rule and the current folders disagree, follow this rule for
> **new** code and let the plan's phases move the old code. Do not "fix" new code to
> match the old shape, and do not start moving old code yourself.
>
> Everything in this rule is writable **today** — no instruction here depends on a
> folder that does not exist yet. If you find one that does, that is a bug in this
> file, not a task for you.

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
  components/          UI imported by 2+ features (ui/ = primitives, seo/, r3f/)
  config/              env.ts, site.ts, navigation.ts, brand.ts, world-theme.ts
  constants/           routes.ts (URL SSOT), and global static data
  utils/               pure isomorphic helpers (cn, mulberry32)
  ai/ • rate-limit.ts  server-only integrations, named for what they are
  seo/ • schemas/ • telemetry/   isomorphic platform modules
  stores/              state written by one feature and read by another — nothing else
  hooks/ • providers/  shared client hooks; providers composed in providers/index.tsx
  styles/              globals.css + design tokens
```

**There is no `src/lib/`, and don't add one.** Infrastructure goes in a folder
named after what it does. A `lib/` would mix isomorphic helpers with server-only
modules under a name that hides the distinction `import "server-only"` exists to
make visible — see [`docs/decisions.md`](../../docs/decisions.md).

A feature owns everything it alone uses:

```
features/<feature>/
  index.ts             ★ curated public API — the ONLY cross-feature import surface
  *.tsx *.ts           components, hooks, stores, utils — flat while the count is small
  <sub-area>/          one level of grouping, only for a real cluster (≥5 related files)
  data/                typed static data / authored content owned by this feature
  generated/           build-generated artifacts — never hand-edited
  types.ts
  *.test.ts(x)         colocated at the cluster root — one per concept
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
  (~50 lines is a good target). `max-lines-per-function` is lint-enforced at
  **100** — the target is prose, the cap is real.
- **File length is not a design signal.** Do not split a cohesive module to hit a
  line count. `max-lines` is a loose backstop at **250** (**120** for `.tsx`, where
  it does reflect component hygiene) and is **off** for
  `*-{draw,shaders,geometry,layout,textures,data}.ts` and anything under
  `data/`, `generated/` or `constants/` — shaders, procedural geometry, canvas draw
  routines and static data are legitimately long, so leave them whole.
- Split a file when it mixes **concerns**, not when it crosses a threshold. Good
  seams: rendering vs. state, pure helpers vs. effects, data vs. behaviour.
- Prefer one 200-line module with a clear job over four 50-line fragments that
  only exist to import each other.

## Boundaries & imports

- Use the `@/…` alias for cross-area imports; use **relative** paths inside a
  feature. Never `../../../`, and never `@/features/X` from inside `features/X`.
- Cross-feature imports go through the target's `index.ts` — no deep imports
  (`@/features/world`, never `@/features/world/scene/screens/canvas-texture`).
- Both of the above are **lint-enforced as warnings** (`no-restricted-imports`), as
  is "nothing imports from `app/`". The 11 open warnings are pre-existing reaches
  into `features/studio` that restructure Phase 4 removes — never add to them, and
  never silence one with an inline `eslint-disable`. When a new feature folder is
  added, add it to `FEATURES` in `eslint.config.mjs` so the same-feature rule
  covers it.
- Shared folders (`components/`, `utils/`, `config/`, `providers/`) never import
  from `features/` or `app/`.
- Mark server-only modules `import "server-only"`; client files start with
  `"use client"`, pushed to the leaves. Never mix the two in one module.
- **No magic values.** Name them at the narrowest useful scope: file-local
  `const` → the feature's `data/` or a feature constants module → `config/` when
  genuinely global. `constants/routes.ts` is the typed SSOT for every internal URL.

## Tests

Colocate `*.test.ts(x)` with the source at the **cluster root** — one file per
concept. Shared helpers, fixtures and render utils go in **`tests/`** at the repo
root (not under `src/`, so they stay out of the coverage denominator and the
`src/**` lint block); E2E specs in `tests/e2e/`. See
[`.devin/rules/testing.md`](./testing.md).

## State

Client state uses hand-rolled external stores read via `useSyncExternalStore` —
there is **no store library** in this repo, and adding one needs an entry in
[`docs/decisions.md`](../../docs/decisions.md). Keep server state on the server; do
not mirror it into a store.
