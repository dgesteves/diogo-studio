---
paths:
  - "src/**"
---

# Placement and boundaries

Eight directories at the root of `src/`, one dependency direction, and ownership decided by
who produces a thing rather than who displays it. The full contracts are in
[`docs/architecture.md`](../../docs/architecture.md) §3 — this file is the working summary.

`docs/architecture.md` is normative and wins where the code disagrees — a disagreement is a
defect in one of the two, not a phase waiting to run. The tree below is the tree, and the
dependency rules below it are lint errors.

## The domains

```
src/
  app/            routing only — resolve, set metadata, compose
  content/        ★ the authored record — the only place a fact may live
  site/           renders content to the DOM: page shell, blocks, metadata, SEO
  world/          renders content as a 3D room: scene, HUD, boot, audio, screens
  agent/          retrieval + generation, server-only, reachable only over HTTP
  command-menu/   the ⌘K surface
  telemetry/      Web Vitals, scene stats and the overlay that shows them
  ui/             generic primitives with zero domain knowledge
  env.ts  store.ts  reduced-motion.tsx  use-is-client.ts  chat-contract.ts  globals.css
```

No `features/` umbrella, no `utils/`, `helpers/`, `common/`, `shared/`, `sections/`,
`constants/`, `styles/`, `hooks/`, `providers/`, `config/`, `schemas/`, `seo/`, and no
`components/` passthrough level inside a domain. Every one of those existed before Phase 6
and none of them may come back — a new top-level directory needs a `docs/decisions.md` entry
naming the ownership or runtime boundary it marks.

## Dependency rules — checked, as errors

```
app/  →  site/ · world/ · command-menu/ · telemetry/  →  content/ · ui/
app/api/  →  agent/  →  content/
leaves:  content/ · ui/ · env · store · reduced-motion · use-is-client · chat-contract
```

1. **Nothing imports from `app/`.** Routing is a leaf.
2. **No domain imports a sibling's private files.** A domain's **store module is its public
   API** — `world/store.ts`, `world/perf.ts`, `command-menu/store.tsx`, `telemetry/store.tsx`,
   `telemetry/vitals.ts` — and everything else in it is private. `site/` exports no state, so
   it is private whole; `site/` and `world/` never see each other at all. **A consumer is
   granted a named subset of that list, never the whole of it:** `telemetry/` gets
   `world/perf` and not `world/store`. The grants are `ACCESS` in `eslint.config.ts`.
3. **`ui/` imports no domain.** If a primitive needs to know what a `Page` is, it is not a
   primitive.
4. **`content/` imports nothing outside itself** — its own modules may compose each other.
5. **`agent/` is reachable only from `app/api/` and build scripts** — never from a client
   module, not even for a type. `chat-contract.ts` is the wire format both ends share.

All five are `no-restricted-imports` **errors** as of Phase 7 — including the **same-domain
rule** (inside `world/`, `site/`, `command-menu/`, `telemetry/` and `agent/`, import
relatively, never through the domain's own `@/…` alias), which is what stops a flattened
domain growing a barrel back. `content/` and `ui/` are closed to the whole of `@/`. The
default is deny: a new file starts closed, so if lint objects to an import, the boundary is
the thing to think about, not the message.

**Never widen a rule inline.** No `eslint-disable` for this one — a cross-domain edge is
either right, in which case it is one line in `ACCESS` in `eslint.config.ts` plus a note in
`docs/decisions.md`, or it is the design telling you the code is in the wrong domain.
`tests/boundaries.test.ts` asserts both directions of every rule against the real config, so
a grant that is too wide fails a named test rather than passing quietly.

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

**Tuning has no home of its own, and `world/tuning.ts` is the file not to create** — "is a
number" is not an ownership boundary, so such a file is a technical-category folder wearing a
filename. Name a magic value at the narrowest scope that works — see [Imports](#imports), and
`docs/architecture.md` §8 for the table this one summarizes.

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
  was the measured cause of this codebase's 297-file, 49-line-average shape and was retired —
  see the 2026-08-14 entry in [`docs/decisions.md`](../../docs/decisions.md).
- **File length is not a design signal and there is no cap on it** — no `max-lines` rule
  exists; don't add one. `max-lines-per-function` is 100 as an error, because function length
  tracks complexity and file length tracks nothing. Never split a cohesive module to hit a
  number, and never merge unrelated ones to reduce a count.

## State

Client state uses hand-rolled external stores read via `useSyncExternalStore`, built from
**one shared factory** — `createStore<T>()` in `src/store.ts`, which is the only place a
listener set lives. There is no store library, and adding one needs a `docs/decisions.md`
entry.

`get` / `getServer` / `set` / `update` / `subscribe`, and **`set` does not emit when the value
has not changed** — return `prev` from `update` to say nothing moved. Storage is not the
factory's business: a store that persists reads it **when the module initializes**, never
inside a snapshot getter, because React calls those during render.

**A signal is owned by whoever produces it, not whoever displays it.** The world produces
frame statistics, so it owns them; `telemetry/` subscribes. That is why adding a second
consumer later requires no move.

## Tests

Colocate `*.test.ts(x)` with the source at the **cluster root** — one file per concept, not
per source file, so a folder move carries its tests. `*.dom.test.{ts,tsx}` runs under jsdom;
everything else runs under node, judged by what the test touches rather than what the module
is about. Shared helpers go in `tests/` and are imported through `@tests/*`, which keeps them
out of the coverage denominator and the `src/**` lint block. E2E specs live in `tests/e2e/`.
