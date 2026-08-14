# Refactor

The migration from the tree as it is to the architecture in
[`architecture.md`](./architecture.md). **That file is the target; this one is the route.**
Delete this file when the last phase lands.

Status: **Phase 1 landed 2026-08-11. Revised 2026-08-13 after a full measurement pass — see
§1.** The measurement is in §2, the structural review in §4, the evidence in §5.

---

## 1. What this revision changes, and why

The plan's charter was right and is unchanged:

> **Author content once, derive every representation, delete what does not earn its place.**

Three things were wrong and are corrected here.

**The plan optimized the wrong variable.** It treated 62 directories as the problem. The
directories are a consequence of 297 source files averaging 49 lines. Move those files into
better folders and you get 297 files in 32 folders — measurably shallower, and no easier to
work in. §2 replaces the diagnosis.

**The boundaries were asserted, not enforced.** `architecture.md` §4 and
`.claude/rules/project-structure.md` both state the dependency rules are "lint-enforced as
errors." They are `warn`, under a `--max-warnings 11` budget, and **eight live imports break
them today** with no phase assigned to converge. §4 fixes the rules and Phase 7 enforces them.

**Two phases were mis-sized and one was mis-labelled.** Phase 2 was one revertible unit
containing the content model, the metadata flip, the layout change and the home page. Phase 5
was labelled "the dangerous phase" when it moves 3D code guarded by an exact mesh-count spec,
while Phase 2 retypes seventeen pages of prose with no check that none was lost. §6 splits 2
and re-ranks the risk.

---

## 2. Root cause

Measured against `cc49656`, excluding tests:

|                          |                                   |
| ------------------------ | --------------------------------- |
| Source files             | **297**                           |
| Source lines             | **14,422**                        |
| **Average file**         | **49 lines**                      |
| Largest `.ts` file       | **110 lines** (cap: 250)          |
| Largest `.tsx` file      | **117 lines** (cap: 120)          |
| Directories below `src/` | 62, of which **27 hold ≤ 1 file** |

A 14,000-line application in 297 files needs 62 folders, because 297 files in one place is
unnavigable. **The folder sprawl is the symptom; the file granularity is the disease.** Three
mechanisms produced it, in order of how much damage they still do:

### 2.1 "One primary, named export per file" — the live cause

`architecture.md` §7 requires it. It is a **fragmentation rule stated as a style rule**: if a
file may export one thing, then a component tree with fifteen nodes is fifteen files, by
arithmetic. The boot overlay is exactly that:

```
boot-splash(22) → boot-backdrop(20)
boot-overlay(96) → boot-actions(96) → boot-{sound,theme,inspector}-toggle(26,26,29)
                                          → boot-segmented(59)
                 → boot-hud(27) boot-log(56) boot-progress(40) boot-wip-notice(20)
boot-sequence(70) boot-wordmark(20) boot-progress-reporter(15)
```

Fifteen files, 622 lines, average 41. **Every one has exactly one consumer: its parent.**
There is no reuse, no seam, no independent lifecycle — only a rule that says one export per
file. The same shape appears in `pixelated-portrait-*` (7 files, 431 lines), `audio` (5 / 239)
and `inspector-*` (8 / 446).

This rule is **in the target document**, so the refactor as written would carry the cause
across the move. It must be replaced — see §8, rule 4.

### 2.2 Barrels make a new file free — being removed already

`src/ai/retrieve.ts` is a 25-line barrel re-exporting four siblings and adding one function.
When the import site never changes, adding a seventh file costs nothing at the call site, so
files accumulate. `architecture.md` is right to ban barrels; that ban is also a granularity
control, which the document does not say.

### 2.3 `max-lines` — **not** the cause, but a veto on the repair

The earlier review claimed the 250/120 caps caused the fragmentation. **Measurement falsifies
that**: no `.ts` file comes within 140 lines of its cap, and only 3 of 154 `.tsx` files sit
above 100. A rule nothing approaches is shredding nothing. The fingerprint of the _historical_
100-line cap is still visible — the two largest source files in the repository are 110 and 117
lines — but that cap is already gone.

What remains true is narrower and still blocking: **the caps sit below what the repair
requires.** These merges are correct and illegal today:

| Target file               | Lines | Cap |
| ------------------------- | ----: | --: |
| `world/boot.tsx`          |  ~560 | 120 |
| `world/scene/lounge.tsx`  |  ~600 | 120 |
| `world/scene/mouse.tsx`   |  ~364 | 120 |
| `site/portrait-engine.ts` |  ~300 | 250 |
| `agent/retrieval.ts`      |  ~270 | 250 |
| `world/audio.ts`          |  ~230 | 250 |

So: remove the caps as a **precondition** in Phase 0 — not as the cure. Removing them
un-fragments nothing on its own; the consolidation work in Phases 4–6 is the cure, and rule 4
in §8 is what stops the regrowth.

### 2.4 What this means for the folder plan

Consolidating to roughly **120 files averaging ~140 lines** removes the _need_ for most of the
folders. `world/boot/` does not need to exist once boot is one file. `features/about/` does not
need to exist once the portrait is two. The folder count falls out of the file count; it is not
a target to chase.

> **Every file count in this document is an estimate, not a target.** "~120 files", "176 → ~40",
> "23 → 5" describe what cohesive boundaries are expected to produce, derived from reading the
> current clusters. They are there to convey scale and to make a phase reviewable — nothing
> more. **A phase is not more successful for landing under its number and not a failure for
> landing over it.** If the honest boundary in `world/scene/` turns out to be 22 files rather
> than 17, the estimate was wrong, not the code. Never merge two modules, and never split one,
> to move a count toward a figure written here.

**Corollary — do not merge to reduce a count.** `world/scene/mouse.tsx` and
`world/scene/keyboard.tsx` stay separate: two objects, two geometries, two lifecycles. Merging
them would trade one bad rule ("one export per file") for another ("fewer files is better").

---

## 3. Target tree

```
src/
  app/                       ROUTING ONLY — resolve, set metadata, compose
    (world)/
      layout.tsx             mounts <World/> BESIDE {children}, never around it
      page.tsx
      about/ work/ projects/ …                16 folders, ~3 lines each
    api/chat/route.ts  api/health/route.ts
    layout.tsx  providers.tsx  error.tsx  global-error.tsx  not-found.tsx
    loading.tsx  icon.tsx  apple-icon.tsx  robots.ts  sitemap.ts

  content/                   ★ THE AUTHORED RECORD — imports nothing
    schema.ts                Block · Page · Sector · Role · PageSlug · PagePath
    pages.ts                 the 17 entries + derived `routes` + asInternalHref()
    profile.ts               identity, role, links, availability
    career.ts                the ONE career record
    prose/                   server-only page bodies, ONE FILE PER SLUG
      home.ts  about.ts  work.ts  projects.ts  …  (17)

  site/                      THE DOM READING SURFACE
    page-view.tsx  blocks.tsx  metadata.ts  structured-data.tsx
    portrait.tsx  portrait-engine.ts

  world/                     THE 3D ROOM — client only
    world.tsx  canvas.tsx  camera.tsx  quality.tsx  postprocessing.tsx  fallback.tsx
    interact.tsx  hotspots.tsx  input.ts  explore.ts
    stations.ts  room.ts  materials.ts  gpu.ts
    boot.tsx  store.ts  perf.ts  audio.ts
    hud/       deck.tsx  radar.tsx  map.tsx  explore.tsx
    scene/     room · lighting · desk · workstation · monitor-rig · keyboard
               mouse · tablet · chair · shelving · lounge · city · moon
               server-rack · ai-core · neon · floor          (~17 files)
    screens/   texture.ts  kit.ts  monitors.ts  wall.ts  tv.ts

  agent/                     SERVER-ONLY, every file
    retrieval.ts  prompt.ts  stream.ts  response.ts  rate-limit.ts
    index.generated.json

  command-menu/              menu.tsx  navigate.tsx  ask.tsx  answer.tsx  store.tsx
  telemetry/                 vitals.ts  overlay.tsx  panels.tsx
  ui/                        button · badge · kbd · status-dot · segmented · brand-icons · cn

  env.ts                     the only process.env reader
  reduced-motion.tsx         provider + store, one concept
  chat-contract.ts           the /api/chat wire format — shared, owned by neither side
  globals.css
```

**8 directories and 4 files at the root of `src/`. Maximum depth 3.**

| Metric                           |      Now |                           Target |
| -------------------------------- | -------: | -------------------------------: |
| Directories below `src/`         |       62 | 32 (21 forced by the App Router) |
| Elective directories             |       41 |                           **11** |
| Maximum depth                    |        6 |                            **3** |
| Directories with ≤ 1 file        |       27 |  18, all forced — **0 elective** |
| Technical-category directories   |       26 |                            **0** |
| Source files / average size †    | 297 / 49 |                      ~120 / ~140 |
| Filenames repeating their folder |     ~130 |                                0 |
| Duplicated data concepts         |        6 |                                0 |

† Estimate, not a target — see the callout in §2.4. The other rows are structural consequences
of the target tree and are expected to hold.

### Three changes from the previously published target

1. **`content/pages/` → `content/prose/`, one file per slug.** A file and a folder both named
   `pages` with opposite meanings is a daily papercut, and grouping seventeen pages into nine
   sector files means you must know `/uses` lives in `tooling` before you can find it.
2. **`content/routes.ts` is not created.** It and `pages.ts` would both encode every URL —
   duplicated data introduced by the phase whose purpose is single-authoring. `routes` is a
   mapped type derived from the `as const` page list, so `typedRoutes` keeps its literals.
3. **`inspector/` becomes `telemetry/`**, absorbing `src/telemetry.ts` and
   `stores/web-vitals-store.ts`. It produces the signals it displays, and `AGENTS.md` already
   warns that "Inspector is two things". The name is retired from the tree and kept only as the
   ⌘K agent's brand.

`world/tuning.ts` and `world/palette.ts` are **not** created: the first is a category folder in
file form whose only membership rule is "is a number", the second is material color.

---

## 4. Dependency rules — corrected so they can be enforced

The layered arrow diagram this section used to carry —
`app → site/world/command-menu/telemetry → content/ui` — was misleading: it reads as though
the four middle domains form a tier whose members may import each other. **They may not.**
Siblings are mutually closed except through the store exception in §4.2. What follows is the
adjacency list, which is what Phase 7 encodes.

### 4.1 Allowed imports, exactly

| Module           | May import                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `app/` (non-API) | `site/` · `world/` · `command-menu/` · `telemetry/` · `content/` · `ui/` · root leaves           |
| `app/api/`       | `agent/` · `chat-contract` · `env`                                                               |
| `site/`          | `content/` · `ui/` · `reduced-motion` · **store-only:** `command-menu/store`                     |
| `world/`         | `content/` · `ui/` · `reduced-motion` · **store-only:** `command-menu/store`, `telemetry/vitals` |
| `command-menu/`  | `content/` · `ui/` · `reduced-motion` · `chat-contract`                                          |
| `telemetry/`     | `ui/` · `reduced-motion` · **store-only:** `world/perf`                                          |
| `agent/`         | `content/` (including `content/prose/**`) · `env` · `chat-contract`                              |
| `content/`       | **nothing**                                                                                      |
| `ui/`            | **nothing** — no domain, no root leaf that carries product state                                 |

Root leaves — `env.ts`, `reduced-motion.tsx`, `chat-contract.ts` — may be imported by anyone
permitted above and import nothing from `src/` themselves.

### 4.2 The store exception, stated precisely

A client domain's **store module is its public API; every other file in it is private.** A
sibling may import the store and nothing else.

| Domain          | Public store modules              | Everything else |
| --------------- | --------------------------------- | --------------- |
| `world/`        | `world/store.ts`, `world/perf.ts` | private         |
| `command-menu/` | `command-menu/store.tsx`          | private         |
| `telemetry/`    | `telemetry/vitals.ts`             | private         |
| `site/`         | none — it exports no state        | fully private   |

This is not a new affordance; it is the shape the code already has. It covers the three edges
`architecture.md` carried as hand-written exceptions (`inspector/ → world/perf` is simply an
instance of the general rule) and the five that were undocumented.

### 4.3 Denied, without exception

1. **Nothing imports from `app/`.** Routing is a leaf.
2. **`content/` imports nothing.** It is the root of the graph.
3. **`ui/` imports no domain.** If a primitive needs to know what a `Page` is, it is not a
   primitive.
4. **No client module imports `agent/`, including for a type.** The wire format is the
   boundary, which is why `chat-contract.ts` is a root leaf and not `agent/schema.ts`.
5. **`site/` never imports `world/`, and `world/` never imports `site/`.** This is the edge that
   makes "the 3D room is an enhancement" structurally true rather than an intention: the
   reading surface cannot break when the room is absent, because it cannot see it. Not covered
   by §4.2 — `site/` has no store, and `world/`'s stores are not for `site/`.
6. **No domain reaches into a sibling's private files** — only the modules named in §4.2.

### 4.4 How Phase 7 enforces it

One `no-restricted-imports` group per client domain, using minimatch negation to carve out the
store, applied to every file _outside_ that domain:

```ts
{ group: ["@/world/*", "@/world/**", "!@/world/store", "!@/world/perf"], message: … }
{ group: ["@/command-menu/*", "@/command-menu/**", "!@/command-menu/store"], message: … }
{ group: ["@/telemetry/*", "@/telemetry/**", "!@/telemetry/vitals"], message: … }
{ group: ["@/site/*", "@/site/**"], message: … }          // no carve-out
{ group: ["@/agent", "@/agent/**"], message: … }          // client files only
{ group: ["@/app", "@/app/**"], message: … }              // everywhere
```

plus the existing same-domain rule (inside `world/`, import relatively — never through
`@/world/…`), which is what stops a domain re-growing a barrel by aliasing itself.

### 4.5 The eight edges that break this today

`architecture.md`'s "no domain imports a sibling, with three named exceptions" is violated in
eight places:

| Rule as written                           | Broken by                                        |
| ----------------------------------------- | ------------------------------------------------ |
| `world/` never imports `command-menu/`    | `world-canvas.tsx:12`, `hud/deck-controls.tsx:8` |
| `world/` never imports `inspector/`       | `boot-actions.tsx:6`, `hud/deck-controls.tsx:9`  |
| `site/` imports only `content/` and `ui/` | `home/hero-ask-cta.tsx:7`                        |

The escape hatch the document proposes — _"opening the command menu through a callback it is
handed"_ — means threading a callback from `app/layout.tsx` through `WorldStage` →
`WorldCanvas` → across the R3F reconciler boundary into `hud/deck-controls`. `useCommandMenu`
is already a React context with a provider in `app/layout.tsx`; replacing a context read with
prop-drilling through a 3D scene graph is strictly worse, and it will be abandoned the first
time a second such action appears.

§4.2 describes what the code already does and what `reduced-motion.tsx` already models, so
resolving these eight edges is a small mechanical change rather than a redesign: the imports
that already point at a store stay, and the ones that reach past it (`useCommandMenu` from
`world-canvas.tsx`, `useInspectorOverlay` from `boot-actions.tsx` and `hud/deck-controls.tsx`)
are repointed at the store module. Three hand-written exceptions become zero, and the rule
becomes a glob instead of a paragraph.

---

## 5. Evidence

Measured 2026-08-11 against `f7335a8`, re-verified 2026-08-13. This is what the phases act on.

### Content is authored two to four times

The career record exists in four places, in three formats, and has already drifted:

| Location                           | Format            | Consumer               |
| ---------------------------------- | ----------------- | ---------------------- |
| `constants/career.ts`              | typed engagements | RAG index only         |
| `world/constants/work-timeline.ts` | typed timeline    | `/work`                |
| `props/resume-screen-draw.ts`      | canvas literals   | a 3D wall screen       |
| `props/timeline-screen-draw.ts`    | canvas literals   | another 3D wall screen |

Drift already shipped: `timeline-screen-draw` has a sixth entry ("2015 · Studio era") that
exists nowhere else; `career.ts` lists an operating company with no matching engagement;
`stack-screen-draw` advertises GSAP and shadcn/ui, neither of which is a dependency. The
author's role line exists in three variants. All seventeen `page.tsx` files hand-copy their
destination's summary into `metadata`.

### Dead code the tooling cannot see

`knip` sees real imports, so none of this is flagged: `config/navigation.ts` (a second, partial
nav model covering 6 of 17 routes) and `scene/constants.ts` (aliases over `brand.ts`). The
three dead dependencies and six dead CSS classes went in Phase 1.

### Duplicated implementation

- **Seven external stores**, each re-implementing `Set<listener>` / `emit` / `subscribe` /
  `getSnapshot` / `getServerSnapshot` — 372 lines of one 25-line idea.
- **Seven copies** of `useDisposable(createCanvasTexture) → interval → draw → needsUpdate`,
  each carrying a verbatim four-line `eslint-disable` banner.
- **Three CRT draw kits**: `screen-draw-kit.ts` defines the primitives,
  `terminal-screen-draw` reimplements them inline, `lounge-tv-screen-draw` redefines `INK`.

### Retrieval is a data defect, not a layout one

25 chunks at whole-page granularity (largest 2,979 characters), **`anchor` undefined on all
25** — so `buildCitations`' deep-link machinery is unreachable — and **8 of 25 permalink to
`/`** because career chunks hardcode `routes.home`. The agent cites the home page for Peacock
work. `agentSourceKindSchema` ships `"case-study"` and `"essay"`, neither ever emitted.

### Statements the product makes that are not true

The résumé screen renders "↧ DOWNLOAD RÉSUMÉ" with no PDF behind it; the boot gate advertises
"Alpha · Work in progress"; five pages promise content that does not exist. `world-poster.png`
is 3.19 MB at 5116×2084, served raw as the Open Graph card.

---

## 6. Phases

Nine phases. Each has an objective, a concrete scope, a verification and a rollback boundary.
Within a phase, `git mv` and content edits are **separate commits**, so a move can be reverted
without losing an edit. `pnpm e2e:ci` runs at the end of every phase — it is the only gate that
observes behavior rather than module resolution.

### Phase 0 — unblock the consolidation ⏱ ~1 h

- **Objective.** Make the rest of the plan legal, remove the rule that caused the problem, and
  stop every agent instruction file from recommending the architecture these phases delete.
- **Scope.**
  1. **`eslint.config.ts`** — delete both `max-lines` entries. Keep
     `max-lines-per-function: 100`; function length tracks complexity, file length tracks
     nothing.
  2. **`docs/architecture.md`** — replace "one primary, named export per file" (§7) with §8
     rule 4 below; that convention is the live cause of the fragmentation, per §2.1. Correct
     §7's "there is no line cap on files", which was false until step 1. Correct §4's
     "lint-enforced as errors", which is false until Phase 7 — say so, with the phase named.
  3. **`.claude/rules/project-structure.md`** needs no change here — it already describes the
     six-domain target. Its one defect, the same false "lint-enforced as errors" claim, is
     corrected in Phase 7, which is the change that makes it true.
- **Result.** Cohesion decides file boundaries; nothing else does. No instruction file still
  points at the old architecture while the refactor is in flight.
- **Verify.** `pnpm validate` · grep `.claude/` for `features/`, `constants/`, `providers/` and
  `stores/` as _recommendations_ rather than as history.
- **Rollback.** Documentation and one config entry; revert the commit.

### Phase 1 — dead weight ✅ landed 2026-08-11

818 tests green, coverage up, 19/19 routes static, 209 E2E passed.

**Added to this phase:** the 3.19 MB OG card and the 1.4 MB portrait. Pure asset swaps, zero
structural risk, and a live defect on the most-shared surface — they do not belong in the
optional final phase.

### Phase 2a — `content/` exists; nothing derives from it yet

- **Objective.** One home for the authored record, with **no behavior change**.
- **Scope.** `git mv` the ten `destinations-*.ts` into `content/prose/<slug>.ts`, one per page.
  `constants/routes.ts` + `world/constants/station-index.ts` → `content/pages.ts`.
  `config/site.ts` → `content/profile.ts`. Consumers keep working through unchanged export
  names.
- **Result.** Byte-identical rendered output; `content/` populated.
- **Verify.** `pnpm validate` · `pnpm e2e:ci` · **a throwaway script asserting every block in
  the old `destinations` collection appears in `content/prose`.** This check does not exist
  today and is the only guard against silently dropping prose.
- **Rollback.** Revert the move commit.

> `station-index.ts` already implements the client/server split `architecture.md` §3 describes
> as new, and documents why in the file. This phase is a rename and a `git mv`, not an
> invention — which is why it is 2a and not the risky half.

### Phase 2b — everything derives

- **Objective.** Delete the second copies.
- **Scope.** All 17 `page.tsx` derive `metadata` from `content`; `sitemap.ts` derives; ⌘K
  derives all 17 routes and `config/navigation.ts` is deleted; `(world)/layout.tsx` mounts the
  world beside `{children}`; home becomes a real `PageView`, the `sr-only` wrapper goes and
  `home.spec.ts` is corrected to assert genuinely visible content.
- **Result.** Changing a fact changes one file.
- **Verify.** `pnpm build` — **`prerender:check` is the real gate: 19 routes must stay
  static** · `pnpm e2e:ci` · `seo.spec.ts` · rebuild and commit `agent-index.json`.
- **Rollback.** Revert; 2a stands alone.

> **This is the highest-risk phase in the plan**, not Phase 5. It is the only one whose failure
> mode is silent: a de-optimized route, a dropped paragraph, a metadata regression. Budget for
> the coverage cost too — global thresholds sit at ~98.98% statements and may never be
> lowered, so the new block renderer must ship at ~99% covered.

### Phase 3 — one career record, one index

- **Objective.** Kill the four-copy defect and fix retrieval.
- **Scope.** Collapse four career copies into `content/career.ts`. Every draw function takes
  its data as a parameter, so no fact remains in `world/screens/`. Rebuild the index with
  per-block chunks, `id` as the anchor and correct permalinks. Delete the `essay` /
  `case-study` chunk kinds. Rename `scripts/agent-index/` and its `destination-chunks.ts`,
  named after the model 2b deleted. Rewrite the five placeholder pages to describe what exists.
- **Verify.** `ask-agent.spec.ts` · `pnpm agent:index:check` · assert no citation resolves
  to `/` for a career answer.
- **Rollback.** Independent of 2b.

### Phase 4 — the two real abstractions

- **Objective.** Delete 570 lines of duplication.
- **Scope.** One `createStore<T>()`; `src/stores/` dissolves into the producing domains. One
  `world/screens/texture.ts` and one `world/screens/kit.ts`; the seven duplicated
  `eslint-disable` banners go.
- **Verify.** `pnpm validate` · `pnpm e2e:ci` · `pnpm size`.
- **Depends on** Phase 0.

### Phase 5 — the 3D room

- **Objective.** Merge the 3D layer by object, so a reader looking for the lounge finds one
  file. _(Scale estimate, not a target: 176 files → roughly 40.)_
- **Scope.** `features/studio` dissolved into `world/scene/`; the 76 scene, prop and lounge
  files merge by object into ~17; `screens/` 23 → ~5; `boot/` 15 → **one `world/boot.tsx`**,
  with `BootSegmented` promoted to `ui/segmented.tsx` (it is a generic segmented control that
  has been living as a boot component). `components/r3f` → `world/`; `config/brand.ts` (43
  importers) + `config/world-theme.ts` + `scene/constants.ts` → `world/materials.ts`;
  `constants/room.ts` → `world/room.ts` (12 importers — it earns its own file);
  `features/audio` → `world/audio.ts`.
- **Verify.** The RTTR scene spec's exact mesh count — a deliberate, recorded update if it
  changes, never a quiet one · `pnpm e2e:ci` · `pnpm size`.
- **Cheaper than it looks:** the 87 test files are already colocated at cluster roots
  (`boot.dom.test.tsx`, `lounge.dom.test.tsx`, `scene.dom.test.tsx`), so merging the sources
  under them moves almost no test code.

### Phase 6 — the remaining domains

- **Objective.** Empty every technical-category folder. _(Counts below are estimates.)_
- **Scope.** `ai/` → `agent/`, the eight `retrieve-*`/`embed-query` files → one
  `agent/retrieval.ts`, `rate-limit.ts` in beside its only caller, `index.json` →
  `index.generated.json`. `schemas/agent.ts` → `chat-contract.ts`. `command-menu` 17 → ~5.
  `inspector/` + `telemetry.ts` + `web-vitals-store` → `telemetry/` (~3 files). Portrait 7 → 2
  in `site/`. `hooks/`, `utils/`, `providers/`, `seo/`, `components/seo/`, `schemas/` dissolved
  into owners — `use-disposable`, `use-world-palette` and `mulberry32` are 100% world-consumed;
  `use-in-view` has one importer; only `use-is-client` is genuinely shared.
  `styles/globals.css` → `src/globals.css`, updating `components.json`.
- **Verify.** `pnpm validate` · `pnpm e2e:ci` · expect new `knip` findings as barrels
  disappear, and treat them as findings rather than something to silence.

### Phase 7 — enforce the boundaries

- **Objective.** Make the architecture checked rather than described.
- **Scope.** Rewrite the `FEATURES` generator in `eslint.config.ts` against domain paths;
  implement §4.1–4.3 as the globs in §4.4, one group per domain with the store carved out;
  **promote `no-restricted-imports` from
  `warn` to `error`**; drop `--max-warnings 11`; resolve the eight violating edges; correct
  `architecture.md` §4 and `.claude/rules/project-structure.md`, which carry the same false
  claim.
- **Verify.** `pnpm lint` with no warning budget.

> Without this phase the refactor is a one-time tidy that decays. With it, the tree is held in
> place by a check rather than by a document nobody re-reads.

### Phase 8 — product and documentation

Droppable, schedulable independently. Remove the alpha notice properly rather than hiding it;
remove the fake résumé download or wire a real PDF; update `architecture.md` where reality
taught us something; append the reasoning to `decisions.md`; trim the now-redundant old-path
globs from the `paths:` frontmatter in `.claude/rules/` (they are dual-scoped to old and new
paths, which is correct _during_ the migration and noise after it); delete this file.

Nothing structural is deferred to here. An agent instruction file recommending the architecture
we are deleting is a live hazard for every phase in between, not a documentation chore, so
Phase 0 owns that. What remains for Phase 8 is only the historical record: the `decisions.md`
entry and the final tidy.

---

## 7. Risks

1. **Losing prose in 2a.** Highest-consequence, lowest-visibility risk in the plan. Mitigated
   by the block-equivalence script, which is a required deliverable of that phase, not a nice
   to have.
2. **De-optimizing a static route in 2b.** `cacheComponents` makes rendering dynamic by
   default, so an uncached read silently costs a prerender. `pnpm prerender:check` is the
   guard; never satisfy it by removing a route from the list.
3. **Merging modules can change init order.** Real for scene modules that build geometry and
   canvas textures at module scope. Merge only files already imported together; `e2e:ci` after
   each phase.
4. **The mesh-count spec.** Its exactness is the only guard against a mesh vanishing in a large
   move, and the only thing that makes Phase 5 safe. Update it deliberately and record why.
5. **Coverage.** Thresholds are global and set from measured runs. Phases that delete code
   raise the ratio; 2b adds new code and must bring its own tests. Never lower a threshold.
6. **Path-coupled configuration.** `scripts/check-prerender.ts:2` imports
   `../src/constants/routes` (breaks in 2a); `vitest.config.ts:128-129` pins coverage to
   `src/app/api/**` and `src/rate-limit.ts` (moves in Phase 6); `components.json:8` points at
   `src/styles/globals.css` (moves in Phase 6).
7. **`git blame` gets noisier.** One commit per phase, moves separated from edits, and a
   `.git-blame-ignore-revs` entry.
8. **Bundle size shifts** when merging changes tree-shaking boundaries. Read `pnpm size` after
   Phases 4, 5 and 6; its CI step is `continue-on-error` by design, so a regression appears in
   the log, not as a red build.

---

## 8. The rules that keep it simple

Six rules. Each is checkable, and the ones a linter can express are `error` by the end of
Phase 7.

1. **A new top-level directory in `src/` requires a written justification in `decisions.md`:**
   which ownership or runtime boundary it marks, and why no existing domain can own the code.
   Growth is not a justification — a domain that got large earns better internal boundaries,
   not a sibling. Neither is symmetry with an existing folder. If the answer to "who owns
   this?" is already a domain, it goes in that domain.
2. **No directory named after a technical kind** — `components`, `hooks`, `stores`, `utils`,
   `helpers`, `common`, `shared`, `types`, `constants`, `lib`, `services`, `config`,
   `providers`, `features`, `styles`. Reaching for one means the code belongs with its
   consumer.
3. **A subdirectory exists to mark a boundary a reader needs, not to group files.** A qualifying
   boundary is a different runtime (`content/prose/` is `server-only`; its parent is
   client-safe), a different mode of work (`world/scene/` is R3F geometry, `world/screens/` is
   2D canvas drawing, `world/hud/` is DOM overlay chrome — three different things to sit down
   and change), or a closed set with one owner. Grouping files because they are conceptually
   adjacent is not a boundary; those files stay flat in the domain. **File count is evidence,
   never the criterion:** a two-file folder on a real runtime boundary earns its place, and a
   nine-file folder that only categorizes does not. The test is whether a reader who does not
   know the codebase would predict the split.
4. **A file exports what its concept needs, and file length is not a design signal.** Split
   when responsibilities differ — different consumers, different lifecycle, different runtime.
   Never split to satisfy a number, and never merge to reduce one. _(This replaces "one primary
   export per file", which is what fragmented this codebase.)_
5. **The folder is the namespace — never repeat it in a filename.** Read the import path aloud;
   if a word repeats, rename.
6. **Shared is measured, never assumed.** Code lives with its owner and moves to a shared module
   only when a **second domain** imports it — and moves back when that stops being true.
   Counting importers is the test.

And the one that makes the rest hold: **a fact lives in `content/` or it does not exist.**

---

## 9. Open questions

Not blocking; settled as the phases reach them.

- **Résumé PDF.** A real document is wanted eventually. Until it exists, Phase 8 removes the
  download affordance rather than shipping an action that pretends a file exists.
- **Essays and case studies.** No content is ready, so no pipeline is being built. When there
  is real content, the content type gets designed then.
- **`telemetry/` absorbing the inspector** is the one call in §3 worth re-litigating: it costs
  a rename across two rule files, and its benefit is retiring a documented ambiguity rather
  than removing code. If it is not worth that, keep `inspector/` and leave `telemetry.ts` a
  root file — nothing else in the plan depends on it.
