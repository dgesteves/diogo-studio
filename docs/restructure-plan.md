# Restructure plan

A review of `src/` as it actually is today, why it feels over-engineered, and a
phased plan to fix it without changing behavior.

Status: **Phase 0 and the §8 documentation audit have landed. Phases 1–7 are not
started and are blocked.**

> **Phases 1–7 are blocked on the test suite. Do not start one until
> [`testing-plan.md`](./testing-plan.md) is complete.**
>
> **Phase 0 was deliberately unblocked and shipped early** (2026-08-08), because the
> argument below does not apply to it: relaxing a lint cap moves no code and changes
> no behavior, so there is nothing for a test suite to verify. Leaving it blocked
> had a real cost — two rule files had been rewritten to say "file length is not a
> design signal" while lint still enforced `max-lines: 100`, so the documented rule
> and the enforced rule openly contradicted each other. §6's guardrails 1–3 shipped
> with it for the same reason, and because their entire purpose is to stop _new_
> violations appearing while the rest of this plan waits.
>
> Everything from Phase 1 onward genuinely does need the suite. Every one of those
> phases claims to be a "pure move/merge with no behavior change."
> At **33.05% statement / 22.15% branch coverage** that claim still cannot be verified,
> and several phases do not merely move code — they merge it. Phase 3 collapses 15
> `boot-*` files into ~5 and 6 `pixelated-portrait-*` into 2; Phase 4 dissolves 40 scene
> files into `world` and repoints 40 importers of `config/brand.ts`. The failure
> mode of a merge is silent: a component dropped, a constant changed, a mesh or
> material lost. `pnpm validate && pnpm build` cannot catch any of that — it
> proves the imports still resolve, not that the product still behaves.
>
> The test suite is therefore a **prerequisite, not parallel work**. Its Phase 2
> (E2E) is deliberately structure-immune so it survives every move below and acts
> as the harness that makes "no behavior change" a checkable statement.
>
> **Coverage has moved twice — 10.71% → 28.82% (2026-08-08) → 33.05% (2026-08-09) — and
> neither move unblocks anything.** Read the shape of the gain, not the number. The first
> came from one RTTR spec mounting `StudioScene`: concentrated in exactly one of the eight
> phases (Phase 4), and almost purely **statements**. The second is better earned —
> branches went 13.67% → 22.15% off `boot.dom.test.tsx` and the store specs, which exercise
> conditions rather than mounting trees — but it lands on Phase 3's `boot-*` cluster and
> `src/stores`, not on the phases carrying the most risk. The three that matter are still
> flat: `rate-limit.ts` **0%**, `app/api/chat` **0%**, `command-menu` **8%**. E2E still
> asserts 3 of 17 routes, and that harness is what actually licenses a move. What the
> spike buys remains narrow and real: `scene.dom.test.tsx` asserts an exact mesh count, so
> Phase 4 has one guard against the specific failure it was feared for. One guard is not
> a net.

Baseline: commit `b72c1e5` ("remove career-graph feature and consolidate career
data"). `pnpm validate` passed (76 tests, knip clean) and every number in §2 was
re-measured against that commit — they are a **dated snapshot**, not live figures, and
§2 flags the ones that have since moved. Note `pnpm e2e` was **not** green at that
commit — two specs were broken; both are fixed, and as of 2026-08-09 the suite stands at
**22 vitest files / 123 tests** and **44/44 Playwright** (8 spec files × two motion
projects).

---

## 1. Verdict

The architecture is not wrong — the **granularity** is. Feature boundaries are
clean (cross-feature coupling is tiny), the `@/` alias is used consistently, and
routing is thin. The problem is that every cohesive unit of code has been
shredded into 3–6 tiny files, and then those files were stacked into folders
named after technical kinds at two different levels. The result reads like a
codebase with 300 modules and no modules.

You are not misreading it. The numbers below say the structure is the problem.

Deleting `career-graph` removed 32 files and ~2,200 lines. It did **not** change
the shape of the problem — average file size moved from 47 to 45 lines, and the
proportion of files under 30 lines actually went _up_. The remaining mess is
concentrated in `world` + `studio`, which is now 60% of the codebase.

---

## 2. Evidence (measured, not guessed)

Measured at `b72c1e5`, with **2026-08-09** values in the last column where they have
moved. The drift is small and none of it changes the verdict — but stale numbers are what
this plan exists to argue against, so they are marked rather than quietly left.

| Metric                      | At `b72c1e5`                                                                               | Now                  |
| --------------------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| TS/TSX files in `src/`      | **313**                                                                                    | 323 (301 non-test)   |
| Lines of TS/TSX in `src/`   | 14,209                                                                                     | 13,716 non-test      |
| **Average file size**       | **~45 lines**                                                                              | ~46                  |
| Files under 30 lines        | **108** (35% of the codebase)                                                              | 105 (35%)            |
| Smallest "modules"          | `telemetry/constants.ts` — **1 line**; `world/constants/focus.ts` — **5 lines**            | unchanged            |
| Top-level entries in `src/` | **15 folders** + a loose `rate-limit.ts`                                                   | unchanged            |
| Deepest path                | **7 segments** (`src/features/world/components/lounge/lounge-tv-channels/wave-channel.ts`) | unchanged            |
| Largest flat folder         | `features/studio/components/scene/` — **40 files**                                         | 40 (+ its spec = 41) |
| Second largest              | `features/world/components/` — **38 files**                                                | **39** (+ its spec)  |
| Barrel files                | 10                                                                                         | unchanged            |
| Empty folders               | 0 — an earlier draft of this table claimed `src/components/layout`; it never existed       | unchanged            |

Counts of a folder are its **direct children**, not a recursive walk — `world/components/`
holds 39 non-test files at its own level plus the `hud/`, `lounge/` and `props/`
subtrees. Saying which is meant matters here, because the recursive figure is 78 and a
reader who mixes the two will conclude the table is badly wrong when it is not.

### Prefix-namespaced clusters — folders pretending to be filenames

These are the "too many levels / not grouped" feeling, concretely. Each row is
one concept spread over N files that all share a prefix because the prefix is
doing the job a folder should do:

| Cluster                | Files | Lines | Location                                                           |
| ---------------------- | ----- | ----- | ------------------------------------------------------------------ |
| `boot-*`               | 15    | 622   | `features/world/components/` (flat, mixed with 23 unrelated files) |
| `deck-*` + hud         | 12    | 574   | `features/world/components/hud/`                                   |
| `lounge-*`             | 14    | 545   | `features/world/components/lounge/` (+ `lounge-tv-channels/`)      |
| `destinations-*`       | 10    | 748   | `features/world/constants/`                                        |
| `pixelated-portrait-*` | 6     | 417   | `features/about/components/`                                       |
| `mouse-*`              | 5     | 369   | `features/studio/components/scene/`                                |
| `retrieve-*`           | 6     | 226   | `src/ai/`                                                          |

`features/world/components/lounge/lounge-tv-channels/wave-channel.ts` says
"lounge" twice and "channel" twice in one path. `boot-wordmark.tsx`,
`boot-backdrop.tsx`, `boot-wip-notice.tsx` and `boot-progress-reporter.tsx` are
20, 20, 20 and 15 lines respectively — four files, 75 lines, one concept.

---

## 3. Root causes

There are exactly three, and they are causal. Reorganizing folders without
fixing #1 will not stick — the structure will re-shred itself.

### Cause 1 — the 100-line cap is manufacturing files ✅ fixed in Phase 0

`eslint.config.ts` enforced
`max-lines: ["error", { max: 100, skipBlankLines: true, skipComments: true }]` on all
of `src/**`. This was the single largest driver of the mess. (The skip options make
the effective cap looser than "100 lines of file" — worth stating precisely, since
this is the exhibit the whole section rests on.)

The consequence is visible everywhere: a 417-line canvas portrait is six files
(`-canvas`, `-engine`, `-engine-config`, `-frame`, `-sampler`, plus the
component); a procedural mouse shell is five. These splits are not conceptual
boundaries — `pixelated-portrait-frame.ts` imports nine constants from
`pixelated-portrait-engine-config.ts` and a type from
`pixelated-portrait-sampler.ts` purely to stay under the cap. Cohesive code was
cut along an arbitrary line, and the seams became an import graph you now have
to navigate.

A 100-line cap is reasonable for React components. It is actively harmful for
shaders, procedural geometry, canvas draw routines, and content data — which is
most of what is left in this repo.

**Fixed.** `max-lines` is now `250` for `src/**`, `120` for `.tsx` where it reflects
real component hygiene, and **off** for
`*-{draw,shaders,geometry,layout,textures,data}.ts` plus anything under `data/`,
`generated/` or `constants/`. In its place `max-lines-per-function` is enforced at
**100** as an error — the complexity signal that file length was standing in for.
Measured before landing: **0** violations at 100, 3 at 80, 16 at 60, 28 at 50, so 50
stays a prose target rather than a gate. No file exceeded the new caps either, which
makes this a pure relaxation that cannot break a build. "Small files" survives as a
value; it is no longer a mechanical gate.

### Cause 2 — layering by technical kind, twice

`src/` has 15 top-level folders, then most features repeat the same buckets
inside themselves (`components/`, `constants/`, `hooks/`, `stores/`, `utils/`).
So finding the boot overlay means traversing kind → feature → kind → cluster.

Several top-level folders do not earn their existence:

- `src/types/` — one file, and it is a **pure re-export** of `src/schemas/agent.ts`. 17 files import the indirection.
- `src/telemetry/` — one file, **one line**, one constant.
- `src/utils/` — was one file (`cn.ts`, 6 lines); now `cn` + `mulberry32`, so it is a real namespace and §4 rule 6 keeps it.
- `src/schemas/` — one file.
- `src/hooks/` — three files, and two of them are **not shared**: `use-in-view` has exactly one importer (`about`), `use-world-palette` has five and all are `world`/`studio`. Only `use-is-client` is genuinely cross-feature.
- `src/rate-limit.ts` — sits loose at the root of `src/`, in no folder at all.

And the `components/` level inside a feature is pure noise:
`features/studio/components/scene/` has exactly one child, and
`features/about/components/` is a feature whose entire content _is_ a component.

### Cause 3 — ownership is wrong, so names lie

- **`src/config/brand.ts` is not brand.** It is Three.js material tokens (`roughness`, `metalness`, `color`). With **40 importers** (39 modules plus `scene.dom.test.tsx`) it is the second-most-imported module in the repo, under a name that tells you nothing.
- **`src/stores/` holds feature state.** Ownership analysis says it can be dissolved almost entirely: `boot`, `explore`, `world-theme` are world-only; `world-store` is world + one audio file; `web-vitals` is inspector-only (4 importers); `reduced-motion` has one importer (its own provider). Only **`perf-store` is genuinely cross-feature** — world writes it, inspector reads it. Meanwhile `command-menu` and `inspector` correctly keep their own stores local. Two conventions, no rule.
- **`src/components/r3f/` is no longer shared.** `career-graph` was its second consumer; now **all four of its modules are imported by exactly one file**, `features/world/components/world-canvas.tsx`. It is world plumbing living in the shared folder.
- **`src/constants/career.ts` (90 lines) has zero runtime consumers.** Its only importers are `scripts/agent-index/virtual-chunks.ts` (build-time) and its own test. It is RAG source content, not app constants — and `constants/` gives no hint that editing it requires re-running `pnpm agent:index`.
- **`src/constants/patterns.ts` is now mostly content taxonomy too** — down to 3 importers, of which one is UI (`hero-section`) and the rest feed the agent index.
- **`src/constants/room.ts` is world geometry**, used by studio scene meshes and world camera framing, but lives in global constants.
- **`src/constants/agent-index.json` is generated** (3,367 lines) and sits in a hand-authored folder.
- **`features/studio` is not a feature.** It is the 3D desk/room content rendered inside `world`'s `<Canvas>`. `world` imports it 12 times, and **11 of those bypass the barrel** to reach `studio/components/screens/canvas-texture`. Two more files inside `studio` import `studio` _through the `@/` alias_ rather than relatively. The boundary is already fictional.
- **`features/home` and `features/about` are thin wrappers.** `home` is 5 files / 146 lines whose public API is a single 10-line `sr-only` component; `about` is 7 files / 431 lines exporting one 13-line component. They are page sections, not capabilities.

Your commit fixed one item that was on this list: `/work` no longer imports
`OperatingSection`/`TrustSection` from `@/features/home`, so `features/home` is
at least honestly named now.

---

## 4. Target structure

```
src/
  app/                      # routing only — essentially unchanged
    (world)/
    api/

  features/
    world/                  # absorbs studio/ — one 3D scene, one owner
      index.ts              # public API
      world-stage.tsx  world-camera.tsx  world-interact.tsx  ...
      canvas/               # was src/components/r3f (no longer shared)
      boot/                 # was 15 boot-* files → ~5
      hud/                  # was deck-* → drop prefix
      lounge/               # channels/ nested one level, not two
      props/
      scene/                # was features/studio/components/scene
        screens/
      stores/               # was src/stores/{boot,explore,world,world-theme}
      hooks/  utils/
      data/                 # destinations, stations, sectors, work-timeline
      types.ts
    agent/                  # was src/ai + src/schemas/agent
      index.ts
      retrieval.ts          # was 6 retrieve-* files
      stream.ts  response.ts  system-prompt.ts  schema.ts
      content/              # career.ts, patterns.ts — RAG source data
      generated/agent-index.json
    command-menu/
    inspector/              # owns web-vitals store
    audio/

  components/               # genuinely cross-feature (13 importers, 4 features)
    ui/                     # unchanged — components.json points here
    sections/               # was features/home + features/about
    seo/

  config/                   # env, site, routes, navigation, seo metadata
  utils/                    # cn.ts, mulberry32.ts — isomorphic leaves
  rate-limit.ts             # server-only; named for what it is, not wrapped in lib/
  stores/                   # perf-store.ts only — world writes, inspector reads
  providers/
  styles/
```

Rules that make it self-maintaining:

1. **One level of grouping inside a feature, and only when a real cluster exists** (≥5 related files). No `components/` passthrough level.
2. **The folder name is the namespace — never repeat it in filenames.** `world/boot/splash.tsx`, not `world/components/boot-splash.tsx`.
3. **A feature owns its state, data, hooks, and utils.** Something is only promoted to a shared folder when **two or more features actually import it** — a rule that would have caught `components/r3f` and two of the three `src/hooks/`.
4. **Cross-feature imports go through `index.ts`; same-feature imports are relative.** Enforced by lint, not habit.
5. **Generated and build-time-only content lives in `generated/` or `content/`**, never in `constants/`.
6. **No `lib/`.** An earlier draft of this plan routed `cn` and `rate-limit` into one. Dropped: it would hold exactly two files, one isomorphic and one server-only, mixing the two sides of the boundary `import "server-only"` exists to make visible — this plan's own Cause 3. Infrastructure keeps a name that says what it does. See [`decisions.md`](./decisions.md).

Estimated outcome: **~313 files → ~240**, top-level folders 15 → 9, max depth
7 → 5, and both 40-file folders gone.

---

## 5. Phased plan

Every phase is a pure move/merge with no behavior change, independently
shippable, and verified by `pnpm validate && pnpm build && pnpm e2e`. Use
`git mv` so history follows.

Do this on a branch, one commit per phase, on a clean tree.

**Run `pnpm e2e` at the end of every phase, not just 3, 4 and 7.** The original
rule was written when the E2E suite was 6 specs covering 3 of 17 routes, so it
was cheap to skip and worth little. Once `testing-plan.md` Phase 2 lands it
covers all 17 routes plus the `AGENTS.md` non-negotiables, and it is the only
gate that observes behavior rather than resolution.

Which testing phase covers which restructure phase — the true minimum, should
this ever need to be interleaved rather than done in full first:

| Restructure phase                        | Requires testing phase                                |
| ---------------------------------------- | ----------------------------------------------------- |
| 0 (lint caps + guardrails)               | **none — landed**; moves no code, changes no behavior |
| 1 (one-file folders)                     | 1–2 (contract + E2E)                                  |
| 2 (renames, content moves)               | 1–2, plus 5 for the `patterns`/`career` RAG sources   |
| 3 (flatten features, **merge** clusters) | 2, 4 (DOM components), 5 (canvas/portrait)            |
| 4 (**merge** `studio` → `world`)         | 5 (draw/layout) **and** 6 (scene graph)               |
| 5 (dissolve `src/stores`)                | 3 (stores, hooks, providers)                          |
| 6 (consolidate the agent)                | 1 (server + AI contract)                              |
| 7 (sections, guardrails)                 | 2, 4                                                  |

Phases 3 and 4 are the dangerous ones and they depend on the _last_ testing
phases to land. That dependency is why the default is simply: finish the tests
first.

### Phase 0 — unblock (prerequisite) ✅ landed 2026-08-08

- `max-lines` → 250 for `src/**`; 120 for `src/**/*.tsx`; off for `src/**/*-{draw,shaders,geometry,layout,textures,data}.ts` and `src/**/{data,generated,constants}/**`.
- `max-lines-per-function` → **100, error** (0 violations measured beforehand). This is the replacement signal, not just a relaxation.
- §6 guardrails 1–3 added as **warnings** (see §6).
- ~~Delete the empty `src/components/layout/`~~ — it does not exist and never did.

Nothing moved. This phase only removed the pressure that caused the mess.

### Phase 1 — kill the one-file folders

- Delete `src/types/agent.ts`; repoint its 17 importers at the schema module.
- `src/telemetry/constants.ts` → fold into `src/config/`.
- `src/constants/routes.ts` → `src/config/routes.ts` (48 importers; it is config).
- `src/seo/*` → `src/config/seo/*`.
- `src/hooks/use-in-view.ts` → `features/about/`; `use-world-palette.ts` → `features/world/hooks/`. Keep `use-is-client.ts` shared.
- **Leave `src/utils/` and `src/rate-limit.ts` where they are** (see §4 rule 6). `utils/` is no longer a one-file folder — it holds `cn` and `mulberry32` — and `rate-limit.ts` keeps a name that states its job. `components.json` `aliases.utils` therefore stays `@/utils`, which also means `shadcn add` keeps working untouched.

Removes 4 top-level folders. Mechanical, wide, zero risk.

### Phase 2 — rename the lies, move content to the agent

- `src/config/brand.ts` → `features/world/scene/materials.ts` (40 importers, all world/studio after the career-graph deletion, plus the two app icon routes).
- `src/constants/career.ts` + `career.test.ts` → `features/agent/content/`.
- `src/constants/patterns.ts` → `features/agent/content/patterns.ts`; `hero-section` imports it via the agent barrel.
- `src/constants/agent-index.json` → `features/agent/generated/`; update `scripts/agent-index/paths.ts`.
- Add a header comment to the generated index and a note that `content/` edits require `pnpm agent:index`.

### Phase 3 — flatten features, drop the `components/` level

For each feature: `features/X/components/*` → `features/X/*`, then group the
prefix clusters into folders and strip the prefix.

- `world/components/boot-*` (15 files) → `world/boot/` and **merge to ~5**: the four 15–20-line files (`wordmark`, `backdrop`, `wip-notice`, `progress-reporter`) collapse into their consumers.
- `world/components/hud/deck-*` → `world/hud/{button,comms,controls,radar,radar-plot,map-overlay,sector-list,station-map}.tsx`.
- `world/components/lounge/lounge-*` → `world/lounge/{sofa,tv,lamp,rug,coffee-table,soundbar,table-items}.tsx`; `lounge-tv-channels/` → `world/lounge/channels/` (kills the 7-segment path).
- `world/constants/destinations-*` (10 files, 748 lines) → `world/data/destinations/`; merge the smallest.
- `world/constants/*` (26 files, several under 10 lines) → merge `focus.ts`, `orbit.ts`, `render.ts`, `explore.ts` into a smaller set of tunables modules.
- `about/components/pixelated-portrait-*` (6 files, 417 lines) → **2 files**, now that phase 0 allows it.

Tests stay co-located and move with their subjects.

### Phase 4 — merge `studio` into `world`

- `features/studio/components/scene/*` → `features/world/scene/*`; group `mouse-*` (5 files, 369 lines) → `world/scene/mouse.ts` + `mouse-controls.tsx`.
- `features/studio/components/screens/*` → `features/world/scene/screens/*`.
- `canvas-texture.ts` → `features/world/scene/screens/canvas-texture.ts`, resolving all **11 barrel-bypassing imports** and the 2 alias self-imports. **Note:** an earlier draft of this plan proposed promoting it to `src/components/r3f/`. That is now wrong — see the next bullet.
- `src/components/r3f/*` → `features/world/canvas/*`. It has a single importer and is no longer shared.
- `src/constants/room.ts` → `features/world/scene/room-dimensions.ts`.
- Delete `features/studio/`.

Highest-value phase: eliminates a fake boundary and all 12 cross-feature imports.
Run `pnpm e2e` — this touches the 3D scene.

### Phase 5 — dissolve `src/stores/`

- `src/stores/{boot,explore,world,world-theme}-store.ts` → `features/world/stores/`.
- `src/stores/web-vitals-store.ts` → `features/inspector/stores/` (all 4 importers are inspector).
- `src/stores/reduced-motion-store.ts` → `src/providers/` (its only importer).
- `src/config/world-theme.ts` → `features/world/theme.ts`.
- **Keep `src/stores/perf-store.ts`** — world writes it, inspector reads it. This is the one genuinely shared store, and being alone in the folder makes that obvious.
- `features/audio/components/world-audio.tsx` reads `world-store`: either move that file into `world`, or export the selector from `features/world/index.ts`.

### Phase 6 — consolidate the agent

- `src/ai/` → `src/features/agent/`.
- Merge the 6 `retrieve-*` files (226 lines total) into `retrieval.ts` + `retrieval/types.ts`.
- `src/schemas/agent.ts` → `features/agent/schema.ts`.
- Drop `agent-` prefixes: `stream.ts`, `response.ts`, `index-loader.ts`.
- Add `features/agent/index.ts` as the only entry point for `app/api/chat/route.ts` and `command-menu`.

### Phase 7 — sections, and lock it in

- `features/home` + `features/about` → `src/components/sections/` (`hero`, `hero-ask-cta`, `portrait`). Deletes two features that are 12 files and 577 lines wrapping two small components.
- Add the guardrails in §6.
- Full `pnpm validate && pnpm build && pnpm e2e && pnpm size`.

### Phase 8 — the docs ✅ landed (alongside Phase 0, as intended)

See §8 for the full audit. The two rewrites in that section were **prerequisites**,
not cleanup: `.devin/rules/project-structure.md` and `.devin/rules/00-core.md` both
mandated the ~100-line cap and the folder layering this plan removes, so left
untouched they would have instructed every future contributor and agent to undo
phases 0–7. Both are rewritten, `architecture.md` is rewritten to describe only what
exists, and `decisions.md` exists.

---

## 6. Guardrails (so it does not rot again) ✅ landed 2026-08-08

All four are in `eslint.config.ts`. They were originally scheduled for Phase 7,
which was backwards — their job is to stop _new_ violations while the rest of this
plan waits, so they went in with Phase 0 instead. 1–3 are **warnings**, not errors,
because of the pre-existing violations noted below.

1. **No deep imports across features.** `no-restricted-imports` with pattern `@/features/*/**` — forces the barrel. Note the pattern needs `/**`, not `/*`: these globs are gitignore-style, so `*` does not cross a `/` and `@/features/*/*` silently misses `@/features/studio/components/screens/canvas-texture`.
2. **No `@/features/X` imports from inside `features/X`** — use relative paths. Implemented per-feature from a `FEATURES` array, since ESLint cannot express "relative to the file's own folder"; add a folder there when a new slice lands.
3. **`app/` may not be imported from** — routing is a leaf. 0 violations.
4. **`max-lines-per-function` (100, error) replaces `max-lines` as the primary signal.** Function length tracks complexity; file length tracks nothing.

**Open warnings: 11**, all of them reaching into
`features/studio/components/screens/canvas-texture`. Phase 4 moves that module into
`world` and takes the count to zero — **promote 1–3 to `error` at that point**. The
two `studio` alias self-imports guardrail 2 was written for are already fixed.

Also worth adding as a periodic check, not a lint rule: **anything in a shared
folder with fewer than two importing features should move down.** That single
question is what surfaced `components/r3f`, `use-in-view`, `use-world-palette`,
and five of the seven stores.

---

## 7. Scope and risk

**Not in scope:** no dependency changes, no rendering or data-flow changes, no
route changes, no public-URL changes. Every step is a move, a merge, or a
rename.

**What makes this safe:**

- Baseline `b72c1e5` is verified green, so any breakage is attributable to a phase.
- Every import already goes through the `@/` alias, so moves are mechanical.
- `pnpm validate` runs lint + typecheck + format + test + knip; TypeScript catches every broken path immediately.
- `knip` will flag any barrel export orphaned by a merge.
- 123 unit tests across 22 files, plus 8 Playwright spec files covering boot, command menu, inspector, content pages, mobile nav and a11y — **44/44 green as of 2026-08-09** (26 tests across two motion projects). Earlier they were not: the `/work` spec had been failing deterministically since the career-data consolidation and the ⌘K Ask-mode spec was flaky ~1 in 12, both masked by `retries: 2`. Treat "the baseline is green" as a claim to re-verify with `pnpm e2e`, not to inherit — `pnpm validate` does not run it. See [`decisions.md`](./decisions.md).
- `features/studio/components/scene/scene.dom.test.tsx` asserts an exact mesh count (228) for the whole studio scene. This is the only guard in the repo against Phase 4's specific failure mode — a mesh vanishing in a 40-file move — so run it, and do not relax the count to make a phase pass.
- Phases are independent — any one can be shipped or reverted alone.

**Real risks:**

1. **Merging files can change module init order.** Matters for the R3F scene modules that build geometry and canvas textures at module scope. Mitigation: phases 3–4 merge only files already imported together, and `pnpm e2e` runs after each.
2. **`git mv` at this volume will make `git blame` noisier.** Mitigation: one commit per phase, moves separated from edits, and add a `.git-blame-ignore-revs` entry.
3. **Moving `career.ts`/`patterns.ts` touches the agent index build.** `prebuild` runs `agent:index:check`, which fails the build if the committed index goes stale. Re-run `pnpm agent:index` in phase 2 and commit the result — expect the JSON to be byte-identical, since only import paths change.
4. **`components.json` aliases affect `shadcn add`.** No longer a risk: dropping the `lib/` move means `aliases.utils` stays `@/utils`, and keeping `components/ui` in place is deliberate for the same reason.
5. **Bundle size could shift** when merging modules changes tree-shaking boundaries. Run `pnpm size` after phases 3, 4, and 6 — but read it, don't rely on CI to stop you: its CI step is `continue-on-error` by design (see [`decisions.md`](./decisions.md)), so a regression shows up in the log, not as a red build.

**Suggested order if you want value fastest:** Phase 0 → 3 → 4. Those three
remove both 40-file folders, the 7-segment paths, the worst prefix clusters, and
the fake `studio` boundary — the bulk of the "I can't find anything" problem.
Phases 1, 2, 5, 6, 7 are cleanup that can land incrementally.

Given that `world` + `studio` is now ~60% of `src/`, phases 3 and 4 are where
almost all of the remaining benefit lives.

---

## 8. Documentation audit

2,609 lines of prose across 18 files. Verified claim-by-claim against the code.
**No doc is consumed by the build or the RAG index** — the index is built from
`src/constants/{career,patterns,routes}.ts` and `config/site.ts` (via
`scripts/agent-index/virtual-chunks.ts`) plus
`features/world/constants/destinations.ts` (via `destination-chunks.ts`), so every
file below was safe to delete without touching `pnpm build`.

> **Landed 2026-08-07, completed 2026-08-08.** Everything in this section is done,
> including the full `architecture.md` rewrite and `decisions.md`.
>
> Deferring `architecture.md` to after Phase 7 was the original call and it was
> wrong. The reasoning ("its job is to describe the settled tree, so writing it
> early means writing it twice") holds for the _tree section_ only — but the file's
> decision table pointed at four directories that do not exist, and that table is the
> part an agent actually acts on. Since Phases 1–7 are blocked behind the whole
> testing plan, deferring meant shipping known-wrong guidance for the duration of
> the longest project in the repo. It is now rewritten to describe only what exists
> (374 → 278 lines) and will be revised again after Phase 7, which is cheap.
>
> Excluding this file (which is temporary), prose went from **2,285 → ~1,150 lines**
> and `docs/` from 7 files to 4.

| File                                | Lines | Verdict       | Why                                                                    |
| ----------------------------------- | ----- | ------------- | ---------------------------------------------------------------------- |
| `.devin/rules/project-structure.md` | 141   | **Rewritten** | Mandated the ~100-line cap and the layering this plan removes          |
| `docs/architecture.md`              | 374   | **Rewritten** | Prescriptive, self-contradictory, "when in doubt this document wins"   |
| `.devin/rules/00-core.md`           | 84    | **Amended**   | Same ~100-line rule; also claimed typed routes / `use cache` were on   |
| `docs/design-system.md`             | 182   | **Deleted**   | Documented a folder and 7 components that do not exist                 |
| `docs/audio-assets.md`              | 93    | **Deleted**   | Task brief for work that shipped; said "no audio code ships right now" |
| `docs/immersive-world-roadmap.md`   | 378   | **Deleted**   | A roadmap nobody works from; drifted 7 weeks                           |
| `docs/diogo-esteves-resume.md`      | 379   | **Deleted**   | Unsynced duplicate of shipped `/resume` content                        |
| `docs/immersive-world-vision.md`    | 271   | **Deleted**   | Self-declared "not a plan"; harmless but read as spec                  |
| `docs/decisions.md`                 | —     | **Added**     | Dated decision log; three other docs already referenced it             |
| `AGENTS.md`                         | 46    | **Kept**      | Accurate and operational; small additions                              |
| `README.md`                         | 55    | **Kept**      | Accurate; pointers fixed                                               |
| 8 other `.devin/rules/*.md`         | ~460  | **Amended**   | Mostly accurate; `lib/`, `src/test/`, `mulberry32` and cap refs fixed  |

`.devin/rules/` holds **10** files, not the 9 an earlier draft of this table
claimed — `testing.md` and `three-r3f-world.md` were added by the same work that
wrote it.

### Delete — actively misleading

**`docs/design-system.md`** is the worst offender. Its §5 documents
`src/components/site/*` with seven components — `SiteNav`, `SiteFooter`,
`CommandTrigger`, `ThemeToggle`, … — and **none of them exist**; `grep` finds
zero references to the first three anywhere in `src/`. It also points at
`temp-docs/diogo-studio-blueprint.md` (does not exist), locates tokens in
`src/app/globals.css` (they are in `src/styles/globals.css`), and documents the
deleted career graph. An agent reading it will try to import `SiteNav`.
**Salvage:** §1 (visual language) and §2.4 (`signal-*` semantics) are the only
durable content — fold ~15 lines into the rewritten `architecture.md`. The token
tables are already SSOT in `globals.css`.

**`docs/audio-assets.md`** opens with "No audio code ships right now; once you
drop files into `public/audio/`, tell me and I'll wire up an opt-in player" and
closes with a to-do list. All of it shipped: `features/audio/` has four modules
and all five assets exist. **Salvage:** the licensing rule (commercial-use-free
only, record attribution per file) → `AGENTS.md`. That is the one durable
constraint and it is invisible from the code.

### Deleted — duplicated or non-normative

**`docs/immersive-world-roadmap.md`** (378 lines) was first rewritten to a
67-line honest version, then deleted outright — the better call. Its session log
stopped on **2026-06-20** while work continued for seven more weeks, leaving
shipped features (explore mode, free-explore, the command deck, the mobile map,
boot, day/night, the lounge) marked "Not started". That drift was not an accident
of neglect: **this project is built exploratively, not from a roadmap**, so any
phase tracker here will always be fiction. The two salvageable halves went where
they belong — the non-negotiables and the no-cropping requirement to `AGENTS.md`,
and the "what shipped" inventory nowhere, because `src/features/world/` already
tells you that and inventories rot.

Do not reintroduce a roadmap doc. Track intent in issues, or nowhere.

**`docs/diogo-esteves-resume.md`** (379 lines) was a second copy of content the
site already ships in `features/world/constants/destinations-reach.ts`, not wired
into the RAG index, so the two could drift silently. Removed; the `/resume` route
is the single source of truth. If the ⌘K agent should answer from a fuller résumé
later, the right move is to extend `src/constants/career.ts` — which already feeds
`agent:index` — not to reintroduce a parallel markdown copy.

**`docs/immersive-world-vision.md`** (271 lines) was honest about itself: "idea
board + creative brief… intentionally **not** a committed plan", "raw
inspiration, not requirements". Removed — it sat next to normative files and got
read as spec.

### Rewrite — the prerequisites (done)

**`.devin/rules/project-structure.md`** was where the mess was specified:

- "**Keep files small** (~100 lines). When a component, route, or module grows past that, **split it**" — this was the instruction, and `max-lines: 100` was its enforcement. Cause 1 of this plan was written down as a rule.
- "`src/stores/` — global client state (**Zustand**)." Zustand is **not a dependency** — the repo uses hand-rolled `useSyncExternalStore`.
- It forbade two of this plan's fixes: "there is no `content/` directory (top-level **or per-feature**)" and `src/stores/` as global state. It also forbade `src/lib/` — and on that one **the old rule was right and this plan was wrong**; see §4 rule 6.

The rewrite introduced its own failure for a while: it was written entirely in the
target tense, so it mandated `lib/` (which does not exist) as the home for `cn`.
A new file obeying it would have imported `@/lib/cn` and failed `tsc`, while 25
files import `@/utils/cn`. **A rule that cannot be followed stops being a rule**,
so the file now carries an explicit guarantee that every instruction in it is
writable today, and `lib/` is gone from both it and §4.

**`docs/architecture.md`** claims authority it has not earned — "it **is** the
structure the codebase follows. **When in doubt, this document wins.**" Verified
problems:

- **Contradicts itself in one file.** The Stack table says state is "hand-rolled external stores read via `useSyncExternalStore` (**no store library**)"; the layer section says "`stores/` — global **zustand** stores".
- **Wrong worked example.** "Anatomy of a feature (example: `inspector`)" describes `inspector-overlay.tsx` as "the ⌘K surface; POSTs to the route". It is a perf/vitals overlay; ⌘K is `command-menu`.
- **~14 speculative folders** marked `[new]`/`[optional]` that a portfolio will never need: `components/{common,article,og}/`, `src/{api,db,auth,payments,email}/`, `src/errors.ts`, `messages/`, `middleware.ts`, `app/(legal)/`, `manifest.ts`, `tests/mocks/`, `docs/adr/`.
- **False `[present]` markers.** `CODEOWNERS` is listed as present in `.github/`; it does not exist (and `AGENTS.md` correctly notes it cannot work on this plan). The tree says `docs/` holds three entries; it holds seven.
- **Dead references.** The 44-row "Migration map (complete — historical record)" documents a finished migration and cites `features/contact/emails/…` — there is no `contact` feature. Git history already holds this.

It now describes what _is_ — the dependency direction, the feature list, where each
kind of thing lives, and the quality gates — with no `[new]` speculation and no
migration archaeology, and it records two traps the code hides: `config/brand.ts` is
three.js material tokens, and "Inspector" names two different things (the ⌘K agent in
`command-menu`, and the perf overlay in `features/inspector`). The "this document
wins" framing is gone; the code wins and the doc tracks it.

### Amend — small, high value (done)

- **`.devin/rules/00-core.md`** — function-level target only (§6 rule 4). Also fixed a stack claim: it told readers to adopt "typed routes" and `use cache`, neither of which is enabled in `next.config.ts`. And it now states the real dependency-age policy (24h, `minimumReleaseAge: 1440`) that `testing-plan.md` had been citing it for at ≥7 days.
- **`.devin/rules/performance.md`** — already said "review signal, not a hard gate", which was correct as documentation and false as a description of CI: `pnpm size` ran as a plain step in the `build` job. **Resolved in the docs' favor** — the step is now `continue-on-error`, so a breach no longer sinks `e2e` via `needs: build`. This section previously asserted "CI matches the roadmap"; it did not.
- **`AGENTS.md`** — the audio licensing rule salvaged above; that `src/constants/career.ts` has **no runtime consumers** and is read only by `scripts/agent-index/` (a genuine trap — it looks dead); the `agent-index.json` path once Phase 2 moves it.
- **`README.md`** — pointer kept, supremacy claim dropped, restructure status corrected.
- **`.devin/rules/{nextjs-app-router,testing,three-r3f-world}.md`** — `src/lib` reference removed, `src/test/` → `tests/`, `mulberry32` repointed at `@/utils/mulberry32`.

### Add — one file, not a folder (done)

`docs/decisions.md` exists: one short dated entry per decision, newest first. It
captures the ones that were buried in prose (no store library; `size-limit` as signal
not gate; the `e2e` job rebuilding rather than sharing `.next`; every env var
optional) plus the ones made while closing this audit.

Do **not** add: a docs index, a CONTRIBUTING.md, or per-feature READMEs. The repo's
problem is too much prose, not too little.

### End state

```
AGENTS.md               operational facts + the world's non-negotiables
README.md               getting started
docs/
  architecture.md       what is, not what might be
  decisions.md          dated decision log
  restructure-plan.md   this file — delete when phases 1–7 land
  testing-plan.md       delete when its phases land
.devin/rules/           10 files
```

Five documents plus the rule set — two of them (this file and `testing-plan.md`) are
temporary by construction. No roadmap, no vision board, no design-system doc, no
migration archaeology — every one of those rotted because nothing forced it to stay
true. What survives is either enforced by a tool (`.devin/rules/`, the lint
guardrails, verification commands) or is a fact that cannot drift (repo constraints,
the `career.ts` trap, the "Inspector" collision, licensing).

From ~2,285 lines of durable prose to roughly 1,450 (measured: 720 across the four
non-temporary docs, 720 across the rule set), with nothing left that
contradicts the code.
