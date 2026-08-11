---
paths:
  - "src/**"
---

# Placement and boundaries

Feature-first vertical slices, one dependency direction, and ownership decided by who imports
it. Never import upward.

## Ownership: the two-importer test

**Put code in the feature that uses it. Promote to a shared folder only when two or more
features import it, and demote when that stops being true.** This is the rule that matters
most here — ignoring it is what produced shared folders holding single-consumer code. When
unsure, count the importing features.

```
src/
  app/                 routing only
  features/<feature>/  vertical slice, with index.ts as its only cross-feature surface
  components/          UI imported by 2+ features (ui/ = primitives, seo/, r3f/)
  config/ constants/   env, site, navigation, brand, world-theme; routes.ts is the URL SSOT
  utils/               pure isomorphic helpers
  ai/ rate-limit.ts    server-only integrations, named for what they are
  seo/ schemas/ telemetry/   isomorphic platform modules
  stores/              state written by one feature and read by another — nothing else
  hooks/ providers/    shared client hooks; providers composed in providers/index.tsx
  styles/              globals.css + design tokens
```

`app/` holds route segments and Next.js special files only. Route files resolve params, set
`metadata` and compose UI from outside `app/`; nothing imports from `app/`, and that is
lint-enforced.

**There is no `src/lib/`** — a project convention, not a universal principle: a `lib/` hides
the server/isomorphic split that `import "server-only"` exists to make visible. Infrastructure
goes in a folder named for what it does.

## Feature shape: target, current, transition

- **Target** (`docs/restructure-plan.md`): a flat feature root, with one level of grouping only
  for a real cluster. No `components/` passthrough folder.
- **Current:** every feature has a `components/` folder. This is pre-existing debt owned by the
  plan, not a pattern to reproduce in a new feature.
- **Transition:** don't create a _second_ shape inside one feature — two conventions in one
  folder is worse than either. Add alongside that feature's existing files and let its phase
  move them together. If that seems wrong for a specific change, say so rather than silently
  picking.

## Imports

- `@/…` across areas, relative paths inside a feature. Never `../../../`, and never
  `@/features/X` from inside `features/X`.
- **Cross-feature imports go through the target's `index.ts`.** This is a recorded decision and
  it is lint-enforced, but barrels are not free: a barrel that re-exports heavy or
  content-bearing modules pulls them into any client bundle that touches it. See the
  `station-index` trap in `three-r3f-world.md` for the live example.
- Shared folders (`components/`, `utils/`, `config/`, `providers/`) never import from
  `features/` or `app/`.
- The import guardrails are warnings under a `--max-warnings` cap set in `package.json`. The
  open ones are pre-existing reaches into `features/studio` that restructure Phase 4 removes:
  never add to the count, and never clear one with an inline `eslint-disable`. Add a new
  feature folder to `FEATURES` in `eslint.config.ts`.
- Mark server-only modules `import "server-only"`; `"use client"` goes at the leaves. Never mix
  the two in one module.
- **Name magic values at the narrowest useful scope** — file-local `const`, then the feature's
  `data/`, then `config/` only when genuinely global. `constants/routes.ts` is the typed SSOT
  for internal URLs.

## Naming and size

- **The folder is the namespace — don't repeat it in the filename, and never encode a path
  twice.** Read the import path aloud; if a word repeats, rename
  (`lounge/lounge-tv-channels/` is the counterexample already in the tree). Generated
  artifacts live in `generated/`, authored data in `data/`.
- One primary, named export per file, except where a framework requires a default (pages,
  layouts, `route.ts`, metadata images, configs).
- Size caps live in `eslint.config.ts`. The judgment they can't express: **don't split a
  cohesive module to satisfy a cap.** Shaders, procedural geometry, draw routines and static
  data are legitimately long and are exempt there. Split when a file mixes concerns —
  rendering vs. state, pure helpers vs. effects, data vs. behavior.

## State and tests

Client state uses hand-rolled external stores read via `useSyncExternalStore`; there is no
store library, and adding one needs a `docs/decisions.md` entry. Keep server state on the
server.

Colocate `*.test.ts(x)` with the source at the **cluster root** — one file per concept, not per
source file. Shared helpers, fixtures and render utils go in `tests/` at the repo root, which
keeps them out of the coverage denominator and the `src/**` lint block. E2E specs live in
`tests/e2e/`.
