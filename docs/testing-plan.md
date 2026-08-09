# Testing plan

A phased plan to take `src/` to a real, trustworthy regression net — built
specifically so that [`restructure-plan.md`](./restructure-plan.md) can be
executed without fear.

Status: **Phases 0, 1 and 2 are complete except for the visual baselines; Phases 3–7 are
not started.** Phase 0 shipped the foundation — the `Math.random()` seeding fix in §5.1,
`mulberry32` promoted to `src/utils/mulberry32.ts`, **the existing E2E suite made green**
(it was 16/18 — the `/work` spec asserted content that no longer exists, and the ⌘K
Ask-mode spec was flaky ~1 in 12 because it raced hydration), **RTTR installed with its
spike passing** (§5.2), the `node`/`jsdom` split, a global store reset, and a run with
**zero warnings** of any kind. This plan calls E2E "the actual harness" for the restructure
(§3), so it had to be trustworthy before anything could be built on it.

**Phase 1 has now landed**: the server and contract layer is at 100% where it matters —
`rate-limit.ts` and `app/api/chat` went from a flat **0%** to **100% statements**, and
`src/ai` from 71% to **98.4%**. See Phase 1 below for the measured table and the two things
it found.

**Phase 2 has now landed too**, minus `visual.spec.ts`: the E2E suite went from **8 specs /
26 tests / 44 runs** to **14 specs / 105 tests / 210 runs**, and it found **two production
defects and one test that could not fail** — every route was shipping the home page's social
preview, dismissing ⌘K stranded keyboard focus on `<body>`, and a mobile spec asserted an
element that does not exist. Those are the return on the phase, not the coverage number.
**Phase 3 (client state, hooks, providers) is the next thing to work on** — and note that
the two fixes above _lowered_ unit branch coverage, because they added `src/` branches that
only E2E covers. That is the honest shape of an E2E phase; see §2.

Baseline: re-measured 2026-08-09 on the current tree, after Phase 2.
`pnpm validate` passes and `pnpm e2e:ci` is **210/210 in 7.4 min at `workers: 1`**. Every
number below is measured; where an earlier draft's figure has been superseded it is marked,
because this plan's whole argument is that unverified numbers should not govern work — and
this table has now gone stale three times, every time understating progress, so re-measure
rather than copying it forward.

---

## 1. Verdict

The premise "we never started creating tests" is not accurate, and the difference
matters. There are **30 vitest files (237 tests)** and **8 Playwright specs**, and
the whole toolchain is already wired: vitest + jsdom, Testing Library (`react`,
`dom`, `jest-dom`, `user-event`), `@vitest/coverage-v8`, Playwright,
`@axe-core/playwright`, and `@react-three/test-renderer`. Conventions exist and are
good.

So this is not a greenfield problem. It is a **coverage-breadth** problem: the tests
cluster on pure logic, data invariants and — since Phase 1 — the whole server surface,
while almost nothing covers client state, UI behavior, or the 3D scene.

The second correction is more important. **"Maximum coverage on everything" is
the wrong objective function.** 79 of 298 files render Three.js, and coverage on
them is only meaningful if you assert the scene graph; a line-coverage target
alone would push toward tests that mount components and assert nothing. The RTTR
spike has now demonstrated exactly that hazard from the good side: four tests took the
40-file `scene/` cluster to **84.65% statements but only 53.06% branches**, because
mounting a declarative scene executes almost every statement while touching almost no
conditional. Statements are nearly free here; branches are the work. The target should
be **behavioral fidelity per layer**, with coverage as the measurement, not the goal.
Section 5 sets a layered target that lands at **~90% statements** honestly, and says
which files should never be chased.

---

## 2. Baseline (measured, not guessed)

| Metric                          | Value                                                  |
| ------------------------------- | ------------------------------------------------------ |
| Non-test source files           | **301** (157 `.tsx`, 144 `.ts`)                        |
| Unit test files / tests         | **30 / 237**                                           |
| E2E specs / tests               | **14 / 105** → **210 runs** across two motion projects |
| Statements / branches           | **35.90% / 27.51%**                                    |
| Functions / lines               | **40.02% / 36.56%**                                    |
| Routes in `constants/routes.ts` | **17**, all with a `(world)` page                      |
| E2E route coverage              | **17 of 17** — status, `h1`, metadata, axe, content    |
| E2E motion modes                | **both** — `reduced-motion` + `full-motion` projects   |

This table has been re-measured three times. Before the RTTR spike it read 297 files, 16/76
and **10.71% / 9.23%**; on 2026-08-08, after the spike, **28.82% / 13.67%**; before Phase 1,
**33.43% / 22.78%**. The spike's jump was almost entirely statements from one spec — the
point of §5.2 — and the branch column barely moved, the point of §5.3. Every move since has
been the opposite shape, and that is the pattern to keep: **branches 13.67% → 22.78% →
27.71%, while statements moved 4 points and then 2.5**. Phase 0's store and boot specs and
Phase 1's route specs both buy conditions rather than mounted trees. Read the branch column
first; a phase that moves statements faster than branches is buying the cheap half.

**Phase 2 moved it backwards, from 27.71% to 27.51%, and that is not a regression.** Vitest
does not instrument the browser, so 79 new E2E tests are invisible here by construction —
while the two defects the phase found were fixed in `src/`, and their fixes added branches
(`command-menu/stores` went 45.5% → 48.5% statements but 15.4% → **10.5%** branches). The
lesson for Phase 7 is concrete: **do not ratchet a coverage threshold in the same commit as
an E2E phase**, and never read this number as a measure of how well the product is tested.
The 210-run suite is the evidence Phase 2 produced; 27.51% is just what vitest can see.

### Coverage by layer today

These are v8's own per-directory rows, not aggregates — the previous version of this
table invented a few, and two of them were wrong (see below).

| Layer                     | Stmts     | Branch    | Note                                                                              |
| ------------------------- | --------- | --------- | --------------------------------------------------------------------------------- |
| **`rate-limit.ts`**       | **100%**  | **100%**  | was 0/0 — Phase 1. Abuse protection: the highest-risk file in the repo.           |
| **`app/api/chat`**        | **100%**  | **93.8%** | was 0/0 — Phase 1. The one unreached branch is a `??` that cannot fire.           |
| **`app/api/health`**      | **100%**  | **100%**  | was 0/100                                                                         |
| **`src/ai`**              | **98.4%** | **95.2%** | was 71.4/72.3 — Phase 1; the residue is explained below                           |
| **`src/config`**          | **100%**  | **100%**  | was 86.7/66.7 — `getSiteUrl` precedence and normalization                         |
| `src/schemas`             | 100%      | 100%      | was already 100% by import; now actually asserted, through HTTP                   |
| `src/constants`           | 100%      | 100%      | `routes` + `career` invariants                                                    |
| `src/utils`               | 100%      | 100%      | `cn.ts` + `mulberry32.ts`                                                         |
| `home/components`         | 87.5%     | 100%      | `home.dom.test.tsx` — small surface, fully exercised                              |
| **`studio/…/scene`**      | **84.7%** | **53.1%** | the RTTR spike — 40 files, 4 tests. Note the gap between the two columns.         |
| `src/components/ui`       | 82.4%     | 66.7%     | reached via `home` and the scene, not directly tested                             |
| `world/constants`         | 78.9%     | 84.6%     | the data-invariant tests + `station-index`                                        |
| `inspector/stores`        | 68.3%     | 44.4%     | —                                                                                 |
| `src/stores`              | 60.3%     | 44.4%     | `boot-store` + `explore-store` specs; 5 of 7 still barely touched                 |
| `src/seo`                 | 50%       | 100%      | `structured-data` only; `root-metadata.ts` is **0%** here, E2E-only by nature     |
| `world/utils`             | 49.7%     | 35.5%     | —                                                                                 |
| `command-menu/stores`     | 48.5%     | 10.5%     | the focus-restoration fix added the branch; only E2E covers it                    |
| `src/app`                 | 44.4%     | 66.7%     | `sitemap.ts` + `robots.ts` now **100%**; the rest is icons + `global-error`       |
| `src/providers`           | 30.6%     | 27.3%     | reached via the boot spec                                                         |
| `src/hooks`               | 29.2%     | 0%        | branch column still untouched                                                     |
| `world/…/hud`             | 27.7%     | 10.5%     | one toggle spec                                                                   |
| `studio/…/screens`        | 23.8%     | 8.3%      | incidental — the spike mounts them, nothing asserts them                          |
| `world/components`        | 22.3%     | 27.1%     | **not 10.9% — that figure was never real; see below**                             |
| `audio/components`        | 6.7%      | 0%        | —                                                                                 |
| `inspector/components`    | 4.8%      | 0%        | the Web-Vitals overlay                                                            |
| `command-menu/components` | **4.2%**  | **0%**    | now covered end to end; still the biggest **unit** hole — Phase 4                 |
| `world/hooks`             | 2.4%      | 0%        | the input reducers                                                                |
| `command-menu/hooks`      | **1.2%**  | **0%**    | `use-ask-agent` + `runAskRequest`; every branch now driven by `ask-agent.spec.ts` |
| `about/components`        | **0%**    | **0%**    | the pixelated-portrait cluster                                                    |
| `world/…/{lounge,props}`  | **0%**    | **0%**    | draw routines — Phase 5                                                           |
| `app/(world)` pages       | **0%**    | 100%      | all 17 route pages                                                                |
| `src/types`, `*-types.ts` | **0%**    | **0%**    | type-only modules; belong in the §5.3 exclusion list, applied in Phase 7          |

`layout`/`loading`/`error`/`not-found` are already excluded in `vitest.config.ts`.

**Phase 1 closed two of the three highest-risk gaps** — `rate-limit.ts` and
`app/api/chat/route.ts`, both now at 100% statements with mutation-verified assertions.
**Phase 2 closed the third from the outside.** `command-menu` still reads 4.2% / 1.2% /
0% branches here, and those numbers now mean something different: `ask-agent.spec.ts`
drives every branch of `use-ask-agent` and `runAskRequest` — streaming, citations, 429,
503, network failure and abort — in a real browser, where vitest cannot see it. The
remaining work is a unit-level one (Phases 3 and 4), and it is now about speed and
determinism rather than about whether the feature is verified at all.

Three cautions when reading this table:

- **Two rows in the previous version were fiction.** `world/components` was recorded as
  10.9%/20.5% and `AGENTS.md` repeated it as "11%"; v8 has been printing **22.3%/27.1%**
  all along, before Phase 1 touched anything. `command-menu` was recorded as a single
  8.2%/1.3% row that v8 never emits — it is four directories with very different numbers.
  Copy the rows the tool prints; do not aggregate them by hand.
- **`studio/…/screens` and `components/ui` are raised _incidentally_** by mounting the
  scene — a by-product, not evidence, and exactly the "tests that mount components and
  assert nothing" effect §1 warns about.
- **`world/components` has higher branch than statement coverage** (27.1% vs 22.3%),
  because `boot.dom.test.tsx` drives many conditions inside one small cluster while 70-odd
  untouched files supply the statement denominator. Neither number means it is covered.

---

## 3. The governing constraint: these tests must survive the restructure

This suite exists to make the restructure safe, so it must not itself become
restructure debt. The restructure moves or merges nearly every file: `src/ai` →
`features/agent` with 6 `retrieve-*` merged into one, 15 `boot-*` → ~5, 6
`pixelated-portrait-*` → 2, `studio` dissolved into `world`, `src/stores`
dissolved, `config/brand.ts` → `world/scene/materials.ts` (40 importers).

A test that deep-imports `@/features/studio/components/scene/mouse-shell` dies in
Phase 4. A test that drives `/` in a browser survives every phase. Four rules
follow, and they are what make this plan cheap rather than expensive:

1. **Test through the seam you intend to keep.** Prefer, in order: HTTP endpoint
   → rendered DOM → feature barrel (`@/features/world`) → module path. Only drop
   to a module path when the behavior has no coarser seam (pure math, data
   invariants).
2. **One test file per _concept_, not per source file.** The restructure merges
   files; tests organized per concept merge with them for free. `boot.dom.test.tsx`
   covering the whole boot sequence survives 15 → 5; fifteen `boot-*.test.tsx`
   files do not.
3. **Assert behavior and contracts, never module structure.** No assertions on
   which file exports what, no snapshotting import graphs.
4. **Colocate, but at the cluster root.** `.devin/rules/project-structure.md`
   mandates colocation; put the file at the directory the cluster will collapse
   into (`world/components/hud/hud.test.tsx`), so `git mv` of the folder carries
   it.

   Where the collapse target does not exist yet, write the test at the **current**
   cluster root and let the phase move it — do not create the future folder early.
   Concretely: `features/studio/components/scene/scene.dom.test.tsx`, not
   `features/world/scene/`, since Phase 4 `git mv`s that whole directory and will
   carry the spec with it. The same applies to `src/ai/` (Phase 6) and the
   `boot-*` cluster, which has no folder at all today — put `boot.dom.test.tsx` in
   `features/world/components/` beside the files it covers.

Sequencing consequence: **E2E and contract tests come first** (Phases 1–2). They
are 100% structure-immune and they are the actual harness that verifies "pure
move, no behavior change". Unit tests on internals come after, and the ones on
soon-to-merge modules come last.

---

## 4. Test surface, classified — and the right tool for each

Measured by import and JSX analysis, not by guessing:

| Class                  | Files   | Tool                         | Notes                                      |
| ---------------------- | ------- | ---------------------------- | ------------------------------------------ |
| Pure `.ts` (no three)  | **123** | vitest, node env             | math, data, tokenizers, formatters, config |
| Pure-DOM `.tsx`        | **95**  | vitest + RTL, jsdom          | HUD, boot, panels, content blocks, `ui/`   |
| Renders three JSX      | **49**  | `@react-three/test-renderer` | scene graph assertions                     |
| Three via hooks only   | **12**  | `@react-three/test-renderer` | `useFrame`, `useProgress`, `<Html>`        |
| `.ts` touching three   | **18**  | vitest + jsdom               | geometry builders, texture factories       |
| Canvas-2D draw modules | **31**  | vitest + recording ctx       | `*-draw.ts`, `*-textures.ts`, layouts      |

The first five rows account for every file exactly once (95 + 49 + 12 = 156
`.tsx`; 123 + 18 = 141 `.ts`). The last row is a **subset** of the two `.ts`
rows, called out separately because it needs its own technique — do not add it to
the total.

All **298 files are now testable with what is installed** — the 79 that need RTTR were
the one gap, and it is closed (§5.2). No file is left without a tool.

### Two hard technical findings

**jsdom cannot rasterise canvas.** Verified: `canvas.getContext("2d")` returns
`null` ("without installing the canvas npm package"). The 31 draw modules
therefore cannot be pixel-tested in vitest without the native `canvas` package.

The better answer is a **recording context**: a `Proxy` standing in for
`CanvasRenderingContext2D` that logs every call and property set, asserted with
Vitest snapshots. This is strictly better than pixels for this codebase — it is
deterministic, needs no native dependency, runs in milliseconds, and produces
exactly the "test the exact current behavior" characterization you asked for. A
draw routine's snapshot is a literal transcript of what it paints.

**`@react-three/test-renderer@9.1.1` works — but not out of the box.** Installed and
proven: `StudioScene` renders headlessly with 228 meshes, 194 groups and 16 lights, no
GPU. This is the only way to get real assertions on the 3D tree, and it is precisely
the right tool for restructure safety: Phase 3 collapses 15 boot files into 5 and
Phase 4 moves 40 scene files, and the failure mode of both is _a mesh silently
disappearing or a material changing_. Scene-graph assertions catch that
deterministically and for free; pixel diffing catches it flakily and expensively.

The cost was one non-obvious config fix, recorded here because the error message
blames the wrong library. Out of the box every render threw `Cannot assign to read
only property 'position' of object '#<Mesh>'` after `THREE.WARNING: Multiple instances
of Three.js being imported` — not two versions of three (there is one in the store)
but two **formats**: `@react-three/fiber` ships no `exports` field, so vitest resolved
its CJS `main`, which requires `three.cjs`, while `src/` imports `three.module.js`.
Two `Mesh` identities makes fiber's `applyProps` assign where it should `.copy()`, and
`Object3D.position` is a read-only accessor. Fixed in `vitest.config.ts` with
`resolve.mainFields` preferring `module` **plus** `server.deps.inline` for the
`@react-three/*` packages — `deps.inline` alone does not do it. See
[`decisions.md`](./decisions.md).

---

## 5. Decisions

### 5.1 The 3D world: scene-graph assertions, not pixel diffing (mostly)

Three layers, in descending order of value:

1. **Scene-graph tests (vitest + RTTR).** Mesh counts, positions, material
   tokens, conditional branches (day/night palette, reduced motion, focus
   state). Deterministic, no CI minutes beyond the existing test job.
2. **Behavioral E2E (Playwright).** The `AGENTS.md` non-negotiables are already
   a written spec — content stays in the DOM, reduced-motion is a real path, no
   focus traps, the world never crops at ultrawide/laptop/tablet/portrait. Every
   one becomes an assertion.
3. **A small, targeted set of visual baselines.** ~8–10 `toHaveScreenshot()`
   shots (world at 4 viewports, boot, day/night, two canvas screens) — not
   dozens. WebGL on GitHub's software renderer is genuinely variance-prone, so
   these run in the Playwright Docker image for byte-stable rendering, on a
   paths-filtered job, and start as a **review signal, not a hard gate**.

Rejected: pixel-diffing the whole scene. It would be the flakiest part of CI and
would train everyone to re-baseline on red, which destroys the signal.

**Prerequisite defect — ✅ fixed 2026-08-08.** `lounge-tv-screen-draw.ts`
(`drawStatic`) called `Math.random()` directly, so it was not reproducible. It now
takes a seeded RNG — `mulberry32(state.tick)`, so the static still differs per tick
but is reproducible for a given one.

Two corrections to an earlier draft of this section. It also named
`lounge-tv-channels/grid-channel.ts`; that file does **not** call `Math.random()` —
there were only ever two calls in all of `src/`, both in `drawStatic`. And it located
`mulberry32` in `city-textures.ts`; there were in fact **two** independent copies
(the other private to `world/…/bookshelf-layout.ts`), verified bit-identical before
being merged into **`src/utils/mulberry32.ts`**. Import it from there. `src/` now
contains zero `Math.random()` calls.

### 5.2 R3F: `@react-three/test-renderer` — adopted ✅

Landed 2026-08-08. It converts 79 files (27% of the codebase) from "E2E-only,
uncoverable" to "unit-testable with meaningful assertions". One well-maintained pmndrs
devDependency, same org as the `@react-three/fiber` already in use, 54k weekly
downloads. The release-age policy is **24 hours**, enforced by
`minimumReleaseAge: 1440` in `pnpm-workspace.yaml` — installation simply fails if the
version is younger, so there is nothing to check by hand. (An earlier draft of this
section said ≥7 days and attributed it to `00-core.md`, which said no such thing; the
real policy is now recorded there.)

**The estimate has been replaced with a measurement, as this section demanded.** The
spike lives at `features/studio/components/scene/scene.dom.test.tsx` — the current cluster
root, so restructure Phase 4 carries it with `git mv` (§3 rule 4). Four tests assert
the mesh count, the light rig against `config/brand.ts` tokens, the day/night palette
branch, and the room shell against `constants/room.ts`. Measured:

| Target                        | Estimated | **Measured** |
| ----------------------------- | --------- | ------------ |
| `studio-scene.tsx` statements | —         | **100%**     |
| `scene/` cluster statements   | 75%       | **84.65%**   |
| `scene/` cluster branches     | —         | **53.06%**   |
| `scene/` cluster functions    | —         | **98.09%**   |
| Repo-wide statements          | 10.71%    | **28.82%**   |

These are the spike's own figures, measured 2026-08-08 — a record of what that one
change bought, deliberately left as-is. The `scene/` cluster is unmoved since
(84.7% / 53.1%); the repo-wide row has since gone to 33.05%, for reasons that have
nothing to do with the spike. §2 holds the live numbers.

So the 75% statement estimate was **conservative** and the R3F strategy is validated.
But the useful finding is the column that was never estimated: **branches at 53%**.
Mounting a declarative scene executes nearly every statement and almost no conditional,
so Phase 6's real work is the branching behavior — palette swaps, focus state, reduced
motion, conditional meshes — not statement count. Plan Phase 6 against the branch
number. Raising statements there is close to free and close to meaningless.

### 5.3 Coverage: ratcheted per-layer thresholds

A single global number is the wrong instrument, because 90% on pure math and 90%
on a lighting rig mean different things. Use **per-directory thresholds** in
`vitest.config.ts`, each ratcheted upward as phases land:

| Layer                                                               | Target   | Rationale                                             |
| ------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `src/ai`, `src/schemas`, `src/config`, `src/constants`, `src/utils` | **100%** | pure, no excuse                                       |
| `src/rate-limit.ts`, `src/app/api/**`                               | **100%** | security and contract surface                         |
| `src/stores`, `src/hooks`, `src/providers`                          | **95%**  | side effects are mockable                             |
| `world/utils`, `world/constants`, `*-draw.ts`, `*-layout.ts`        | **95%**  | pure logic                                            |
| Pure-DOM components                                                 | **90%**  | branches on state/props                               |
| R3F components                                                      | **85%**  | measured at 84.65% from smoke rendering alone (§5.2)  |
| R3F components — **branches**                                       | **70%**  | measured at 53%; this is the row that needs real work |
| `src/app/**` pages                                                  | **90%**  | static compositions, cheap to render                  |

Projection: **~88–92% statements overall**, not 100% — still a sum of per-layer
numbers rather than a derived figure, but the row that moved it most is no longer a
guess: R3F statements are measured at 84.65% (§5.2), which puts the projection on
firmer ground than when it was written. Set **branch** thresholds alongside the
statement ones from the start; the spike showed statements can hit 85% while branches
sit at 53%, so a statement-only ratchet would report a suite that is far healthier than
it is.

**Phase 1 met the 100% row for `rate-limit.ts` and `app/api/**` on statements, and came
within a whisker on `src/ai` — 98.4%/95.2%.** The residue is worth understanding rather
than closing: three `noUncheckedIndexedAccess` guards and two `?? 0` fallbacks that the
surrounding `||` makes unreachable, plus a type-only module that compiles to nothing. The
honest lesson for the remaining phases is that **a 100% target is a target for statements
you can reach through a seam you intend to keep** — reaching the last 1.6% here means
importing a module the restructure deletes and passing it an out-of-range index, which
tests TypeScript rather than the product. See [`decisions.md`](./decisions.md).

Files that should be _excluded from the denominator_ rather than faked:
`instrumentation*.ts`, `global-error.tsx`, `icon.tsx`/`apple-icon.tsx` (satori
`ImageResponse`, asserted via E2E HTTP status instead),
`world-postprocessing.tsx` (pure effect-pass config with no observable behavior
headlessly), and the **type-only modules** — `src/types/*.ts` and `ai/retrieve-types.ts`
compile to nothing, so v8 scores them 0/0 and they only depress the denominator.
`vitest.config.ts` **already** excludes `src/app/**/{layout,loading,
error,not-found}.tsx`; fold these into that existing list rather than starting a new
one, and drop the `layout`/`loading` entries if the Phase 4 work makes them
assertable after all.

Never fail CI on coverage _downward drift alone_ while a phase is in flight —
ratchet on merge to `main`.

### 5.4 Where tests run — ✅ done

Two vitest `projects`, keyed on the **filename**: `*.dom.test.{ts,tsx}` runs under jsdom
with `vitest.setup.ts`; everything else runs under node with no setup. So node takes route
handlers, `sitemap`, `robots`, `rate-limit` and pure logic, while jsdom takes RTL, stores
and RTTR — as intended, but declared per file rather than per directory, since the
restructure moves the directories and a stale glob would silently run a server spec under
a DOM.

**Node is the default deliberately:** a DOM spec missing the suffix fails at once with
`document is not defined`, where the inverse default fails silently. Judge by what the
_test_ touches, not what the module is about — `gpu.test.ts` covers WebGL renderer
detection but only calls a pure string predicate, so it belongs in node.

`sequence.hooks: "stack"` is required alongside this, so a spec's own `afterEach` runs
before the global one. See [`decisions.md`](./decisions.md) for both, and for the 26
`act()` warnings that ordering fixed.

---

## 6. Phased plan

Each phase is independently shippable and ends green on `pnpm validate`. One
commit per logical group, `test:` type per Conventional Commits.

### Phase 0 — fix the foundation (prerequisite, small) — ✅ complete

- ✅ **Add `@react-three/test-renderer`; prove it with one spike.** See §5.2 for
  the result and the resolution fix it needed. The "if the spike fails, stop and
  re-plan" branch was not taken.
- ✅ Seed the two `Math.random()` draw paths (§5.1).
- ✅ **`tests/stores.ts` + the `@tests/*` tsconfig path.** `resetStores()` is wired into
  the jsdom setup's `afterEach`, so the reset is **global** rather than per-file — the 4
  files that reset ad hoc covered 2 of 7 stores between them. **The other three helpers
  were deliberately not written:** `env.ts` has no consumer until Phase 1,
  `recording-ctx.ts` until Phase 5, and `r3f.ts` should wait for a second scene spec (the
  `renderScene` / `isMesh` / `lightsOfType` helpers in `scene.dom.test.tsx` are what it
  will hold). `knip` fails on unused files, so writing them early buys an ignore entry and
  nothing else. See [`decisions.md`](./decisions.md).
- ✅ **Split vitest into `node` / `jsdom` projects.** Keyed on the **filename** —
  `*.dom.test.{ts,tsx}` is jsdom, everything else is node — because directory globs are
  restructure debt and a docblock cannot drive `projects`. Node is the default so that a
  missing marker fails loudly. `resolve.mainFields` and `server.deps.inline` are duplicated
  into both projects, as §5.2 requires. Measured: cumulative environment time **9.66s →
  2.77s**, wall **3.51s → 2.66s**, 16 node files to 6 jsdom.
- ✅ **The ESM-loaded-as-CJS warning was real** — it appeared on every run, contrary to an
  earlier draft of this line. Fixed at the root: `package.json` now declares
  `"type": "module"`, which is what the `.mjs`/`.mts` extensions were standing in for.
  `vitest.config.ts` keeps its conventional name and the ESLint, PostCSS and commitlint
  configs became plain `.js`. That is a `build:` change with production blast radius, so it
  ships as its own commit and was verified past `pnpm test` — see
  [`decisions.md`](./decisions.md) for the two silent failure modes it had to rule out.
- ✅ **All 26 `act(...)` warnings fixed at the root.** They were not a chore: 5 came from
  teardown store resets racing RTL's `cleanup()` under vitest's default parallel hooks, 3
  from `await user.click()` under fake timers, and the remaining 18 were Radix effects
  downstream of the same race. Fixed with `sequence.hooks: "stack"`, one ordered
  `afterEach`, and an `act` wrapper at two call sites.

Exit: **met.** Spike passes, the helpers with consumers exist, and the suite is
**22 files / 123 tests**, green, with **zero warnings and zero stderr output** — the
jsdom `getContext` noise (55 lines/run) and the upstream `THREE.Clock` deprecation are
both handled in the jsdom setup. Verified by mutation, not just by passing: stubbing
`resetStores()` to a no-op fails a boot spec, and forcing `canEnter` true fails 3 of
`boot.dom.test.tsx`'s 8.

### Phase 1 — the server and contract layer — ✅ complete

Highest risk-per-line in the repo, and completely structure-immune because it is
tested through HTTP. Landed 2026-08-09 as **8 new spec files and 114 new tests**, taking
the suite from 22/123 to **30/237**. `pnpm validate` green, `pnpm e2e:ci` 44/44.

| Target                  | Before      | **After**           |
| ----------------------- | ----------- | ------------------- |
| `rate-limit.ts`         | 0% / 0%     | **100% / 100%**     |
| `app/api/chat/route.ts` | 0% / 0%     | **100% / 93.8%**    |
| `app/api/health`        | 0% / 100%   | **100% / 100%**     |
| `sitemap.ts`            | 0% / 0%     | **100% / 100%**     |
| `robots.ts`             | 0% / 100%   | **100% / 100%**     |
| `src/ai`                | 71.4/72.3   | **98.4% / 95.2%**   |
| `src/config`            | 86.7/66.7   | **100% / 100%**     |
| Repo-wide               | 33.43/22.78 | **35.92% / 27.71%** |

- ✅ **`app/api/chat/route.test.ts` — all 7 branches** plus the headers: invalid JSON →
  400, schema failure → 400, rate limited → 429, refusal → 200 + `REFUSAL_TEXT`, no API
  key → 503 fallback, streaming success → 200, dead stream → recovery text, and the
  base64 `x-agent-sources` / `cache-control: no-store` pair on every one of them.
  **The mock boundary is third-party code only** — `ai`, `@ai-sdk/openai`,
  `@sentry/nextjs`, `@/ai/agent-index` — so `agent-stream`, `embed-query`,
  `agent-response`, `system-prompt` and the real rate limiter all execute. That is why
  one spec took five modules to 100% statements, and why none of it moves in Phase 6.
  See [`decisions.md`](./decisions.md).
- ✅ **`rate-limit.test.ts`** — `x-forwarded-for` → `x-real-ip` → `anonymous`
  precedence, local token-bucket exhaustion and per-ms refill under fake timers, the
  refill ceiling, per-caller and per-limiter isolation, and the Upstash path (including
  the two half-configured cases that must fall back to in-memory).
- ✅ **`metadata-routes.test.ts`** — the sitemap lists all 17 routes exactly once with the
  home/station priority and cadence split and one shared timestamp; robots allows `/`,
  disallows `/api/`, and points at an absolute sitemap URL.
- ✅ **`agent-response.test.ts`**, **`system-prompt.test.ts`** — response construction,
  citation numbering and anchors, the unicode-safe base64 round-trip (with the assertion
  that plain `btoa` throws on the same payload), and prompt assembly including the
  `(no sources retrieved)` fallback.
- ✅ **`agent-index.test.ts`** — the corpus ↔ routes invariants, which is the drift types
  cannot catch: every permalink resolves through `asInternalHref`, every route is covered
  by at least one chunk, ids are unique, and `CORPUS_HAS_EMBEDDINGS` agrees with both the
  vectors and the declared model/dimension.
- ✅ **`config/site.test.ts`** — `getSiteUrl` precedence (`NEXT_PUBLIC_APP_URL` →
  `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → localhost) and normalization.
- ✅ **`ai/retrieve.test.ts` extended** 17 → 31 tests: cosine and keyword floors, empty
  corpora, `TOP_K` capping on both paths, and BM25's three ranking characteristics — idf,
  length normalization and term-frequency saturation — which are product behavior, not
  math trivia, because BM25 _is_ retrieval whenever `OPENAI_API_KEY` is unset.
- ✅ **`tests/env.ts`** written, now that Phase 1 gave it three callers. It mocks the
  `@/config/env` module rather than stubbing `process.env`, because `createEnv` validates
  once at import.
- ✅ **`tests/agent.ts`** — `makeChunk`, extracted from `retrieve.test.ts` when the route
  spec became its second caller.

**Verified by mutation, not by passing.** 33 mutations across 12 source files, each applied,
run and reverted: IP precedence swapped, the token-bucket floor and refill ceiling relaxed,
the 429/503/refusal gates bypassed, `no-store` and the Sentry calls deleted, citation
markers shifted, anchors dropped, unicode-safe base64 reverted to plain `btoa`, sitemap
priority and cadence flattened, `/api/` un-disallowed, URL precedence reversed, and BM25's
idf, length normalization and saturation each removed. **Three survived, and two of them
were my own tests being too weak** — the rare-term and short-document tests passed on tied
scores, so both now assert strict inequality, and two tokenizer tests were added. The third
class is genuine equivalent mutants (a `df === 0` guard the following `f === 0` guard
already covers; the stopword fast path, whose removal still refuses). Do this before
believing any of the numbers above.

**It also found a real defect**, which is the point: the "Missing query string." message was
attached to `.min(1)`, so it never fired for the far likelier `{}` — an absent key is an
`invalid_type` issue, and the route returned zod's internal wording to the caller. Fixed at
the schema and shipped as its own `fix:` commit; see [`decisions.md`](./decisions.md).

Not done here, deliberately: `config/env.ts` degradation is asserted **through behavior**
(no key → 503, no Upstash → in-memory) rather than by re-importing the module under stubbed
env, and `schemas/agent.ts` is asserted through the HTTP 400s rather than by a schema spec —
both are §3 rule 1, the coarsest seam that shows the behavior.

### Phase 2 — the E2E net (structure-immune; the actual harness) — ✅ complete except the visual baselines

Landed early, because it was not a coverage gap but a correctness one: the suite forced
`reducedMotion: "reduce"` globally, so the 3D path had never been tested and two of the
`AGENTS.md` non-negotiables were only accidentally satisfied (see
[`decisions.md`](./decisions.md)).

- ✅ **Both motion modes.** Two projects, every spec in both unless tagged. `workers`
  capped and `full-motion` given its own timeout budget — measured, not guessed.
- ✅ **`reduced-motion.spec.ts`** — canvas absent, site navigable, content
  server-rendered, axe clean. This is the `reduced-motion.spec.ts` bullet below, done.
- ✅ **`boot.spec.ts`** — landed as the `Boot sequence` describe inside
  `world-3d.spec.ts`, which also asserts the canvas mounts and content stays in the DOM.
- ✅ Axe extended to `wcag22aa`, and it now runs in both modes.

Then the rest landed, taking `tests/e2e/` from **8 specs / 26 tests / 44 runs** to
**14 specs / 105 tests / 210 runs**, green at **210/210 in 7.4 min** under `pnpm e2e:ci`
(production build, `workers: 1`). Phase 1 had already changed what two of these owed: the
sitemap's route list, the robots rules and every `/api/chat` response branch are asserted
in node in milliseconds, so `seo.spec.ts` and `ask-agent.spec.ts` assert only what a
browser adds and re-check no payloads.

- ✅ **`routes.spec.ts`** — all 17 routes: 200, exactly one `<h1>`, canonical by path, and
  no console or page errors. Titles and descriptions are asserted **unique** over HTTP,
  which is what catches a page losing its `metadata` export: Next then falls back to the
  root copy, and the home page legitimately holds it, so the fallback collides.
- ✅ **`seo.spec.ts`** — per-page Open Graph and Twitter tags, the card image fetched and
  200, the JSON-LD graph parsed with its `@id` cross-reference intact, `sitemap.xml` and
  `robots.txt` served as the right content types, and the satori icons resolved from the
  page's own hashed hrefs (the HTTP check §5.3 buys instead of coverage).
- ✅ **`content-in-dom.spec.ts`** — **325 authored strings across all 17 routes**, over raw
  HTTP with no browser and therefore no JavaScript, driven off `worldDestinations` and a
  `switch` over `ContentBlock` so a new block kind fails to typecheck until it says what a
  crawler should see. The crawlability non-negotiable, stated as literally as it can be.
- ✅ **`accessibility.spec.ts`** (extended) — axe on **all 17 routes in both modes**, plus
  focus-visible and focus restoration. `canvasMounts` is now a declared project option and
  `settleWorld` uses it, because a scan taken before the canvas mounts is just a second
  copy of the reduced-motion scan.
- ✅ **`world.spec.ts`** — the studio map lists all 17 under their 9 sectors, `aria-current`
  marks exactly one, navigating closes it, a deep link puts the deck on the right station,
  and explore mode announces its controls and exits with Escape. **Mostly untagged, not
  `@full-motion` as sketched above** — the map is plain DOM, and a reduced-motion visitor
  has nothing else. Only explore mode is genuinely canvas-only.
- ✅ **`world-responsive.spec.ts`** — the four viewports, with the scope written down: the
  focused-object claim is a pixel claim only the baselines can make, `framing.test.ts` owns
  the camera math, and what is left is the renderer's size and a fixed overlay's fit.
- ✅ **`ask-agent.spec.ts`** — the `/api/chat` journey with the route mocked: streaming
  answer, citation chips that navigate through `asInternalHref` with the anchor intact, the
  retrieval badge, 429, 503, transport failure and stop. Refusal and the 400s are
  deliberately absent, and the file says why.
- ✅ **`command-menu.spec.ts`** (extended) — ⌘1 back from Ask, the empty state, and a theme
  action; ✅ **`world-3d.spec.ts`** (extended) — the gate's theme, sound and inspector
  preferences, inverted from their defaults, and the inspector's default direction asserted
  in the existing boot test so that "off" cannot pass on a dead control.
- ⏭️ **`visual.spec.ts`** — the ~8–10 baselines, paths-filtered job, Docker-pinned. **Not
  done, and deliberately deferred**: §7 says visual regression is the first thing to cut if
  minutes get tight, and this phase already took CI from ~3.7 min to ~7.4 min locally. It
  needs its own decision, not a reflex.

**The boot progress bar and step log were dropped from this phase on purpose.** The bullet
above asked for them; they are driven by three timers, `boot.dom.test.tsx` already covers
them under fake ones, and chasing them end to end is what made that the flakiest spec in
the suite. Phase 4's rule — anything timer-dependent is a component test — wins over this
phase's wishlist.

**What the phase actually bought was three defects, none of which coverage would have
found.** Every route shipped the home page's `og:title`, `og:description` and `og:url`,
so every shared link previewed as the homepage; dismissing ⌘K dropped keyboard focus on
`<body>`, because Radix suppresses FocusScope's restore in favour of a `Dialog.Trigger`
this menu does not have; and `mobile-nav.spec.ts` asserted that a navigation named
"Studio destinations" was hidden, when no such element exists anywhere in `src` — a test
that would have passed with the entire deck deleted. Both fixes ship with regression
tests; the third spec is gone.

**Every spec in this phase was verified by mutation, and three mutations failed to fail
first.** Sizing the deck to 3000px changed nothing because `max-w-full` absorbed it;
`documentElement.scrollWidth` cannot see fixed overlays at all; the keyword-badge
assertion passed because the mock answer contained the word "Keyword". Each was fixed. One
more only appeared under `e2e:ci`: the canvas aspect read measured **300px** — the HTML
default — because `toBeAttached` is satisfied before r3f's ResizeObserver sizes the
element. It is now a retried read, not a `retries: 2` casualty.

Exit: **met.** The restructure has a net that fails loudly on any behavior change, and it
has been shown to fail — every spec by mutation, and three of them by finding real bugs.

### Phase 3 — client state, hooks, providers (~25 files → 95%)

All 7 external stores (`boot`, `explore`, `perf`, `reduced-motion`,
`web-vitals`, `world`, `world-theme`) including no-op-on-unchanged semantics,
subscriber notification counts, `sessionStorage`/`localStorage` error
resilience, and server snapshots. Then `command-menu-store` (⌘K, mode reset on
close), `inspector-overlay-store` (Ctrl+`, Escape, persistence), the 3 shared
hooks, `use-ask-agent`+`runAskRequest` (streaming, abort, 429/503 branches),
and the 5 providers.

Note: these files move in Phase 5 of the restructure but do not merge, so tests
travel intact with `git mv`.

### Phase 4 — pure-DOM components (~95 files → 90%)

Per-cluster files, not per-source-file (§3, rule 2): `hud.test.tsx`,
✅ `boot.dom.test.tsx`, `inspector.test.tsx`, `command-menu.test.tsx`,
`content-blocks.test.tsx`, `ui.test.tsx`, `sections.test.tsx`. Assert what the
user sees and does — roles, labels, keyboard interaction, state transitions —
using the established `home.dom.test.tsx` style.

`boot.dom.test.tsx` landed early, out of phase order, because E2E could not assert it
reliably: its three timers plus the ready signal made it the slowest and flakiest thing in
the suite on a 2-vCPU runner. **That is the general rule this phase should follow —
anything whose outcome depends on a timer is a component test, not an E2E test** (see
[`decisions.md`](./decisions.md)). `command-menu.test.tsx` is the next candidate for the
same reason: its open/close is animation-gated end-to-end and deterministic in jsdom.

Also the pure formatters here: `inspector-format.ts`, `inspector-route-js.ts`,
`ask-answer-formatting.tsx` (including the href-sanitization branches, which are
security-relevant), `ask-agent-sources.ts`.

### Phase 5 — canvas draw routines and layout math (~31 files → 95%)

Recording-context snapshots for all 16 draw modules and the texture factories;
value assertions for the layout/geometry generators (`bookshelf-layout`,
`city-layout`, `keyboard-layout`, `desk-hardware-layout`, `wall-screen-layout`,
`mouse-shell`/`mouse-geometry`, `radar-layout`, `framing`, `orbit`, `explore`).
Deterministic given Phase 0's seeding fix.

### Phase 6 — the 3D scene graph (~79 files → 75%)

RTTR tests per scene area: room, desk, monitors and screens, lounge, props and
wall screens, AI core, hotspots, camera, portals, lighting. Assert mesh/light
counts, positions against the layout constants, material tokens from
`config/brand.ts`, and the palette branch. Plus the `world/hooks` input reducers
(`explore-input-state`, `orbit-input-state`, key bindings, damping, clamping) and
`ai-core-animation` / `intro` / `radial-glow`.

This is the phase that directly de-risks restructure Phases 3–4.

### Phase 7 — lock it in

Per-layer coverage thresholds enabled and ratcheted; `pnpm validate` switched to
the coverage run; coverage-exclusion list from §5.3 applied; `AGENTS.md` updated
with the testing conventions and helper locations.

**Only then start `restructure-plan.md` Phase 1.** (Its Phase 0 — the lint caps and
the import guardrails — was deliberately unblocked and has already landed: relaxing a
cap moves no code, so there is nothing for this suite to verify.)

---

## 7. CI budget

`AGENTS.md` records the real constraints: **2,000 Actions minutes/month** and a
**500 MB artifact quota**, with no required status checks available. The dual-motion
split already cost ~2.5 min (≈20s → 2.7m at `workers: 1`), and this plan roughly
doubles what remains, so:

- Keep Playwright on **chromium only**; do not add browsers for coverage's sake.
- **Tag deliberately.** Untagged specs run twice. That is right for anything asserting
  behavior that must hold in both modes, and waste for anything else — the `@full-motion`
  / `@reduced-motion` tags are the wall-time lever, so reach for them before reaching
  for `workers`.
- **Do not raise `workers` above 1 in CI** to claw time back. Five concurrent
  SwiftShader contexts closed browser sessions locally; a shared CI runner is worse.
- Run the **visual job paths-filtered** to `src/features/world/**`,
  `src/features/studio/**` and `src/config/brand.ts`, so it is skipped on most PRs.
- Upload traces/screenshots **only on failure**, always with `retention-days` set —
  match the existing `e2e` job's `7` rather than introducing a second convention.
- Snapshot baselines live in git, not artifacts.
- Unit tests stay fast: the whole vitest run should remain well under a minute,
  so keep RTTR tests free of real timers.

If minutes get tight, the first thing to cut is visual regression, not E2E.

---

## 8. Conventions for writing these tests

The durable version of this section is
[`.devin/rules/testing.md`](../.devin/rules/testing.md) — it defines what each kind of
test owns, what it must assert, and what makes it reliable. This plan is temporary and
gets deleted when its phases land; that rule does not. Keep normative guidance there and
sequencing here.

- Colocate `*.test.ts(x)` at the cluster root; E2E in `tests/e2e/*.spec.ts`.
- Follow the existing style: `makeChunk`-style fixture builders, `describe` per
  unit, `toBeCloseTo` for floats, RTL role/label queries over test IDs.
- **Query by accessible role and name**, never by class or DOM structure — this
  is what makes a test survive a refactor and also enforces a11y.
- Reset external stores in `afterEach` via the Phase 0 helper; stores are module
  singletons and will otherwise leak across files.
- Mock at the module boundary with `vi.mock`, never by reaching into internals.
- No `any` in tests (`@typescript-eslint/no-explicit-any` is an error);
  `max-lines` and non-null assertions are already relaxed for `*.test.ts(x)`.
- A test that would pass if the feature were deleted is not a test. Every spec
  should have been able to fail.
