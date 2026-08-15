---
paths:
  - "src/**"
---

# Placement and boundaries

Six domains at the root of `src/`, one dependency direction, and ownership decided by who
produces a thing rather than who displays it. The full contracts are in
[`docs/architecture.md`](../../docs/architecture.md) §3 — this file is the working summary.

**A refactor is in flight.** `docs/architecture.md` is the target and wins; the current tree
is being moved toward it and is **not a pattern to copy**. `docs/refactor.md` says which
phase owns which move.

## The domains

```
src/
  app/            routing only — resolve, set metadata, compose
  content/        ★ the authored record — the only place a fact may live
  site/           renders content to the DOM: page shell, blocks, metadata, SEO
  world/          renders content as a 3D room: scene, HUD, boot, audio, screens
  agent/          retrieval + generation, server-only, reachable only over HTTP
  command-menu/   the ⌘K surface
  inspector/      the performance overlay
  ui/             generic primitives with zero domain knowledge
  styles/         globals.css + design tokens
  env.ts  telemetry.ts  reduced-motion.tsx
```

No `features/` umbrella, no `utils/`, `helpers/`, `common/`, `shared/`, `sections/`,
`constants/`, and no `components/` passthrough level inside a domain.

## Dependency rules — the contract, not yet the check

```
app/  →  site/ · world/ · command-menu/ · inspector/  →  content/ · ui/
app/api/  →  agent/  →  content/
leaves:  content/ · ui/ · env · telemetry · reduced-motion
```

1. **Nothing imports from `app/`.** Routing is a leaf.
2. **No domain imports a sibling**, except three by design: `inspector/` → `world/perf`,
   and `site/` / `world/` → `content/`.
3. **`ui/` imports no domain.** If a primitive needs to know what a `Page` is, it is not a
   primitive.
4. **`content/` imports nothing outside itself** — its own modules may compose each other.
5. **`agent/` is reachable only from `app/api/` and build scripts** — never from a client
   module, not even for a type.

`no-restricted-imports` ships as `warn`, but `--max-warnings` is `0`, so a warning fails the
build like an error. What it does **not** catch is an import through a domain's `index.ts`
barrel: the glob is `@/features/*/**`, and `@/features/command-menu` is one segment short of
matching. That is how the eight edges in `docs/refactor.md` §4.5 break rule 2 in silence.
**Phase 7 rewrites the globs against domain paths and promotes the rule to `error`.** Until
then the barrel is on you: hold the rules yourself, and never add a ninth edge.

## Where a fact lives

**`content/` is the only place a fact may live.** A company, role, date, technology, project
description or page summary belongs there and nowhere else. Everything else derives:
page metadata, the sitemap, JSON-LD, the retrieval index, the HUD labels, the ⌘K route list,
and the 3D canvas screens.

The rule for the 3D layer specifically: **a draw function decides layout, typography, color,
spacing, animation, truncation and decoration — it may not contain a fact.** Enforce it by
construction: every draw function takes its data as a parameter. Truncation is the draw's call,
not the record's: a panel that cannot fit the list drops what does not fit, and the page carries
the whole of it.

That parameter has to come from somewhere a client module may import, so `content/` is split.
`prose/**` is `server-only`; the records beside it — `pages.ts`, `profile.ts`, `career.ts`,
`principles.ts`, `stack.ts`, `playground.ts` — are client-safe, and **a record earns a file
there only when a client module reads it.** Everything else is prose and belongs in `prose/`.

Three things that are not content and must not share a folder with it:

| Kind          | Example                                  | Home                     |
| ------------- | ---------------------------------------- | ------------------------ |
| Content       | a role, a date, a page summary           | `content/`               |
| Tuning        | camera damping, DPR ladder, fog distance | the domain that reads it |
| Configuration | an env var, a deployment URL             | `env.ts`                 |

Tuning has no home of its own: `docs/refactor.md` §3 declines to create `world/tuning.ts`,
because "is a number" is not an ownership boundary. Name a magic value at the narrowest scope
that works — see [Imports](#imports).

## Imports

- `@/…` across domains, relative paths inside one. Never `../../../`.
- **No barrel files.** Import the module at its real path. Barrels buy nothing once domains
  are shallow, and cost a client bundle pulling in content-bearing modules it never reads.
- `import "server-only"` on every server module — all of `agent/`, plus `content/prose.ts`
  and all of `content/prose/**`. `"use client"` at interactive leaves only. Never both in one
  file. A node script or Playwright spec that reads the prose runs under
  `--conditions=react-server`, which is already on the `agent:index*` and `e2e*` scripts.
- **Name magic values at the narrowest useful scope**: file-local `const` first, then the
  domain's tuning module, then a root module only when genuinely global.

## Naming and size

- **The folder is the namespace — never repeat it in the filename.** `world/boot/overlay.tsx`,
  not `world/boot/boot-overlay.tsx`. Read the import path aloud; if a word repeats, rename.
- `kebab-case` files and folders; `PascalCase` components; `useX` hooks; `is/has/can`
  booleans. Exports are named, except where a framework demands a default.
- **A file exports what its concept needs.** Split when responsibilities differ — different
  consumers, different lifecycle, different runtime; a file mixing rendering with state, pure
  helpers with effects, or data with behavior. _Not_ one primary export per file: that rule
  is the measured cause of this codebase's 297-file, 49-line-average shape
  (`docs/refactor.md` §2.1) and was retired in Phase 0.
- **File length is not a design signal and there is no cap on it** — no `max-lines` rule
  exists; don't add one. `max-lines-per-function` is 100 as an error, because function length
  tracks complexity and file length tracks nothing. Never split a cohesive module to hit a
  number, and never merge unrelated ones to reduce a count.

## State

Client state uses hand-rolled external stores read via `useSyncExternalStore`, built from
**one shared factory** — there is no store library, and adding one needs a
`docs/decisions.md` entry.

**A signal is owned by whoever produces it, not whoever displays it.** The world produces
frame statistics, so it owns them; the inspector subscribes. That is why adding a second
consumer later requires no move.

## Tests

Colocate `*.test.ts(x)` with the source at the **cluster root** — one file per concept, not
per source file, so a folder move carries its tests. `*.dom.test.{ts,tsx}` runs under jsdom;
everything else runs under node, judged by what the test touches rather than what the module
is about. Shared helpers go in `tests/` and are imported through `@tests/*`, which keeps them
out of the coverage denominator and the `src/**` lint block. E2E specs live in `tests/e2e/`.
