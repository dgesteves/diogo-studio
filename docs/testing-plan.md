# Testing plan

A phased plan to take `src/` to a real, trustworthy regression net — built
specifically so that [`restructure-plan.md`](./restructure-plan.md) can be
executed without fear.

Status: **Phases 0–6 are complete except for the visual baselines; Phase 7 is not started.**
Phase 0 shipped the foundation — the `Math.random()` seeding fix in §5.1,
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
Note that the two fixes above _lowered_ unit branch coverage, because they added `src/`
branches that only E2E covers. That is the honest shape of an E2E phase; see §2.

**Phase 3 has now landed**: every client store, hook and provider is at 97–100%, the ⌘K and
inspector stores and the whole Ask pipeline went from E2E-only to 100%, and the suite is
**42 files / 326 tests**. It found no production defect — it found **five of its own tests
that could not fail**, plus one guard that could not run.

**Phase 4 has now landed**: every pure-DOM cluster the plan named is at 100% — ⌘K, the
inspector overlay, the command deck, the content blocks, the boot gate's preferences, the
shared atoms — and the suite is **50 files / 462 tests**. It found **one accessibility
defect, one security hardening and two pieces of code that could not run**, plus **four of
its own tests that could not fail**.

**Phase 5 has now landed**: every canvas draw routine, texture factory and layout generator the
plan named is covered, the suite is **59 files / 589 tests**, and repo-wide coverage is **74.34%
/ 67.94%**. It found **one production defect**, and a broad one — `src/` contained no `dispose()`
call at all, so every texture and geometry the scene builds by hand leaked whenever a visitor
turned motion off.

**Phase 6 has now landed, and the 3D layer is no longer the residue**: every scene area is
covered by RTTR, the suite is **80 files / 763 tests**, and repo-wide coverage is **94.90% /
90.95%** — past this plan's own ~90% projection. It found **two production defects** (nine more
canvas textures leaking the way Phase 5's did, and a component whose entire body three.js
already does), **one hole in the vitest config**, and **two of its own tests that could not
fail**. **Phase 7 (lock it in) is the next thing to work on**, and Phase 6 left it three
decisions — `features/audio`, the 17 route pages, and the exclusion list — named at the end of
that section.

Baseline: re-measured 2026-08-11 on the current tree, after Phase 6.
`pnpm validate` passes and `pnpm e2e:ci` is **210/210 at `workers: 1`**. Every number below
is measured; where an earlier draft's figure has been superseded it is marked, because this
plan's whole argument is that unverified numbers should not govern work — and this table has
now gone stale three times, every time understating progress, so re-measure rather than
copying it forward.

---

## 1. Verdict

The premise "we never started creating tests" was not accurate, and the difference
mattered. At the time of writing there were **16 vitest files (76 tests)** and **8 Playwright
specs**, and the whole toolchain was already wired: vitest + jsdom, Testing Library (`react`,
`dom`, `jest-dom`, `user-event`), `@vitest/coverage-v8`, Playwright,
`@axe-core/playwright`, and — since Phase 0 — `@react-three/test-renderer`. Conventions
existed and were good.

So this was not a greenfield problem but a **coverage-breadth** one: the tests clustered on
pure logic and data invariants. Phase 1 added the server surface, Phase 3 client state, Phase 4
the DOM, Phase 5 the canvas draw routines and Phase 6 the 3D scene. **What is left is not a
layer but a set of decisions**, listed at the end of Phase 6 and owned by Phase 7.

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
| Non-test source files           | **301** (156 `.tsx`, 145 `.ts`)                        |
| Unit test files / tests         | **80 / 763**                                           |
| E2E specs / tests               | **14 / 105** → **210 runs** across two motion projects |
| Statements / branches           | **94.90% / 90.95%**                                    |
| Functions / lines               | **92.99% / 95.63%**                                    |
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

**Phase 3 is the shape to want: branches 27.51% → 35.90%, ahead of statements at 35.90% →
41.82%.** It bought conditions — storage that throws, an OS preference that changes
mid-session, a stream that dies, an abort — not mounted trees. It also closed the gap Phase 2
opened: the `command-menu` rows it left at 10.5% and 1.2% branches are now 100%.

**Phase 4 is the same shape, larger: branches 35.90% → 58.70%, statements 41.82% → 51.03%.**
Branch coverage is now _ahead_ of statement coverage repo-wide, and both numbers say the same
thing about what is left: the residue is the 3D layer, where mounting is cheap and asserting
is not (§1). Every remaining low row is Phase 5 or 6.

**Phase 5 inverts the shape on purpose, and that is not a regression either: statements 51.03% →
74.34%, branches 58.70% → 67.94%.** Draw routines are long and nearly straight-line, so a
transcript assertion buys a great many statements per branch — the opposite of Phase 3's trade
and equally honest. Read it against what the phase asserted rather than against the column: 127
tests, 29 mutations, one real leak. The rows still short of their §5.3 target are named in Phase
5, and each is either a guard that cannot run or Phase 6's.

**Phase 6 closes it: statements 74.34% → 94.90%, branches 67.94% → 90.95%**, and the two columns
have converged, which is what "the residue is the 3D layer" was always predicting. Mounting a
declarative scene is still cheap in statements (§5.2), so the branch number is the one that says
this phase did the work: **+23 points, from asserting the conditions the scene actually has** —
day against night, full against reduced against frozen, explore against orbit, a hotspot
pointed at against focused, a driver that never answers. What is left below 90% is named at the
end of Phase 6, and none of it is a scene.

### Coverage by layer today

These are v8's own per-directory rows, not aggregates — the previous version of this
table invented a few, and two of them were wrong (see below).

| Layer                     | Stmts     | Branch    | Note                                                                          |
| ------------------------- | --------- | --------- | ----------------------------------------------------------------------------- |
| **`rate-limit.ts`**       | **100%**  | **100%**  | was 0/0 — Phase 1. Abuse protection: the highest-risk file in the repo.       |
| **`app/api/chat`**        | **100%**  | **93.8%** | was 0/0 — Phase 1. The one unreached branch is a `??` that cannot fire.       |
| **`app/api/health`**      | **100%**  | **100%**  | was 0/100                                                                     |
| **`src/ai`**              | **98.4%** | **95.2%** | was 71.4/72.3 — Phase 1; the residue is explained below                       |
| **`src/config`**          | **100%**  | **100%**  | was 86.7/66.7 — `getSiteUrl` precedence and normalization                     |
| `src/schemas`             | 100%      | 100%      | was already 100% by import; now actually asserted, through HTTP               |
| `src/constants`           | 100%      | 100%      | `routes` + `career` invariants                                                |
| `src/utils`               | 100%      | 100%      | `cn.ts` + `mulberry32.ts`                                                     |
| **`src/hooks`**           | **100%**  | **100%**  | was 29.2/0 — Phase 3; held at 100% through Phase 5's `use-disposable`         |
| **`command-menu/hooks`**  | **100%**  | **100%**  | was 1.2/0 — Phase 3; the whole Ask pipeline, driven through `useAskAgent`     |
| **`command-menu/stores`** | **100%**  | **100%**  | was 48.5/10.5 — Phase 3, after deleting one unreachable guard                 |
| **`inspector/stores`**    | **100%**  | **100%**  | was 68.3/44.4 — Phase 3                                                       |
| **`command-menu/comp…`**  | **100%**  | **99.0%** | was 4.2/0 — Phase 4. The one branch left is a regex-guaranteed pair.          |
| **`inspector/comp…`**     | **100%**  | **100%**  | was 4.8/0 — Phase 4, overlay and formatters                                   |
| **`world/…/hud`**         | **100%**  | **100%**  | was 27.7/10.5 — Phase 4, the whole command deck                               |
| **`components/ui`**       | **100%**  | **100%**  | was 82.4/66.7 — Phase 4; incidental coverage replaced by assertions           |
| **`components/seo`**      | **100%**  | **100%**  | was 0/100 — Phase 4, plus the escaping fix it prompted                        |
| **`home/components`**     | **100%**  | **100%**  | was 87.5/100 — Phase 4 closed the CTA's own action                            |
| **`src/stores`**          | **97.7%** | **90.7%** | was 60.3/44.4 — Phase 3; the residue is SSR guards, explained below           |
| **`src/providers`**       | **97.2%** | **90.9%** | was 30.6/27.3 — Phase 3                                                       |
| **`studio/…/scene`**      | **99.8%** | **87.8%** | was 84.7/53.1 — Phase 5 the textures, Phase 6 the status LEDs                 |
| **`world/constants`**     | **97.8%** | **84.6%** | was 78.9/84.6 — Phase 6; `render.ts` through `PerformanceMonitor`             |
| `src/seo`                 | 50%       | 100%      | `structured-data` only; `root-metadata.ts` is **0%** here, E2E-only by nature |
| **`world/utils`**         | **99.3%** | **95.2%** | was 49.7/35.5 — Phase 6 took the animation modules                            |
| `src/app`                 | 44.4%     | 66.7%     | `sitemap.ts` + `robots.ts` now **100%**; the rest is icons + `global-error`   |
| **`world/components`**    | **98.2%** | **95.1%** | was 29.5/38.7 — Phase 6, the whole 3D layer including the canvas host         |
| **`studio/…/screens`**    | **99.1%** | **83.3%** | was 88.7/52.8 — Phase 6 took the four texture clocks Phase 5 left             |
| **`about/components`**    | **95.0%** | **75.0%** | was 23.9/20.6 — Phase 5 took the portrait engine and its sampler              |
| `features/audio`          | 8.8%      | 0%        | Web Audio, no jsdom equivalent — **no phase ever owned it**; Phase 7 decides  |
| **`world/hooks`**         | **98.2%** | **93.4%** | was 4.9/0 — Phase 6, the orbit and explore input reducers                     |
| **`world/…/props`**       | **98.2%** | **76.0%** | was 78.6/56.0 — Phase 6 closed the wall screens' own component                |
| **`world/…/lounge`**      | **99.4%** | **87.5%** | was 55.4/87.5 — Phase 6 took the furniture around the television              |
| **`world/…/tv-channels`** | **100%**  | **91.7%** | was 0/0 — Phase 5                                                             |
| **`components/r3f`**      | **100%**  | **100%**  | was 13.1/37.5 — Phase 6, after deleting one component that could not run      |
| `app/(world)` pages       | **0%**    | 100%      | all 17 route pages                                                            |
| `src/types`, `*-types.ts` | **0%**    | **0%**    | type-only modules; belong in the §5.3 exclusion list, applied in Phase 7      |
| `src/telemetry`           | **0%**    | 100%      | one constant, imported only by the excluded `instrumentation*.ts` — same list |

`layout`/`loading`/`error`/`not-found` are already excluded in `vitest.config.ts`.

**Phase 1 closed two of the three highest-risk gaps** — `rate-limit.ts` and
`app/api/chat/route.ts`, both now at 100% statements with mutation-verified assertions.
**Phase 2 closed the third from the outside, Phase 3 closed it from the inside, and Phase 4
closed the surface on top of it.** The whole ⌘K feature — store, hooks, request, answer
rendering and menu — is now at 100% in vitest, in about two seconds, and the E2E spec keeps
only what a browser adds.

Four cautions when reading this table:

- **Two rows in an earlier version were fiction.** `world/components` was recorded as
  10.9%/20.5% and `AGENTS.md` repeated it as "11%"; v8 had been printing 22.3%/27.1% all
  along, before Phase 1 touched anything. `command-menu` was recorded as a single 8.2%/1.3%
  row that v8 never emits — it is four directories with very different numbers. Copy the rows
  the tool prints; do not aggregate them by hand.
- **`studio/…/screens` used to be raised _incidentally_** by mounting the scene — a by-product,
  not evidence, and exactly the "tests that mount components and assert nothing" effect §1 warns
  about. Phase 5 replaced that with transcript assertions on the four draw routines and Phase 6
  with clocks around them. `components/ui` made the same move in Phase 4, which is why its
  branch column moved 33 points without its statement column moving at all. **A high row is
  only worth what its assertions are worth**, which is why every phase above reports its
  mutation count next to its coverage.
- **A directory average is still not a status.** `world/components` read 29.5% through Phase 5
  while boot, the content blocks and the destination frame inside it were already at 100% — the
  ~30 canvas and hotspot files supplied the rest of the denominator. It now reads 98.2% for the
  same reason in reverse: the number moved because a different set of files got specs, not
  because anything already covered got better.
- **The last 2–9% of the two client-state rows is SSR guards, and chasing it is not work.**
  What `src/stores` and `src/providers` have left is `typeof window === "undefined"` and
  `typeof navigator === "undefined"`: reaching them means deleting a global from under jsdom
  mid-file, which breaks the environment for every later test in it. The build proves those
  guards instead. A guard that _cannot_ run is different — see
  [`decisions.md`](./decisions.md).

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

All **301 files are now testable with what is installed** — the 79 that need RTTR were
the one gap, and it is closed (§5.2). No file is left without a tool, and after Phase 6 no file
is left without a spec either, except the ones §5.3 names.

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

The off-the-shelf version of that technique is **`vitest-canvas-mock`**, and it was
weighed before Phase 5 wrote a line: it needs jsdom and a setup file, where these
routines are pure functions of a context that run in the cheaper node project, and it
would take over the deliberate `getContext → null` baseline for every jsdom spec.
`tests/recording-ctx.ts` stays, with one thing the library cannot supply — a 0.6em
monospace advance for `measureText`, which is what turns "this line runs off the panel"
into an assertion. See [`decisions.md`](./decisions.md), and take the library rather than
growing the helper if argument validation is ever needed.

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

| Layer                                                               | Target   | Rationale                                            |
| ------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `src/ai`, `src/schemas`, `src/config`, `src/constants`, `src/utils` | **100%** | pure, no excuse                                      |
| `src/rate-limit.ts`, `src/app/api/**`                               | **100%** | security and contract surface                        |
| `src/stores`, `src/hooks`, `src/providers`                          | **95%**  | side effects are mockable                            |
| `world/utils`, `world/constants`, `*-draw.ts`, `*-layout.ts`        | **95%**  | pure logic                                           |
| Pure-DOM components                                                 | **90%**  | branches on state/props — **met at 100%**, Phase 4   |
| R3F components                                                      | **85%**  | **met at 98.2%**, Phase 6 (was 84.65% from mounting) |
| R3F components — **branches**                                       | **70%**  | **met at 95.1%**, Phase 6; was the row needing work  |
| `src/app/**` pages                                                  | **90%**  | at **0%**; see below — Phase 7 drops it or meets it  |

Projection: **~88–92% statements overall**, not 100%. **Measured after Phase 6: 94.90% /
90.95%**, so the projection was slightly conservative and the layered approach held — but the
reason to keep reading it as a sum rather than a single number is unchanged, and two rows in
the table above are still nowhere near their target. Set **branch** thresholds alongside the
statement ones; the spike showed statements can hit 85% while branches sit at 53%, so a
statement-only ratchet would report a suite that is far healthier than it is.

**Two targets in this table are now claims Phase 7 has to settle rather than inherit.** The
`src/app/**` pages row asks for 90% and sits at 0%: all 17 are asserted over HTTP by
`routes.spec.ts`, `seo.spec.ts` and `content-in-dom.spec.ts`, which is stronger evidence than a
render test would be, so the honest options are to exclude them with that reasoning written
down or to drop the row — not to leave a number nothing is working toward. And `features/audio`
has no row at all and 8.8% coverage, because no phase ever claimed it; Web Audio has no jsdom
equivalent, so it is the same decision.

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
and the **type-only modules** — `src/types/*.ts` and `ai/retrieve-types.ts`
compile to nothing, so v8 scores them 0/0 and they only depress the denominator.
`vitest.config.ts` **already** excludes `src/app/**/{layout,loading,
error,not-found}.tsx`; fold these into that existing list rather than starting a new one.
**Phase 4 did not make the `layout`/`loading` entries assertable, so they stay excluded**:
the `(world)` layout composes the canvas, the deck and the boot gate, each of which is now
covered where it lives, and rendering the layout again would only mount them a second time.
Add `src/telemetry/constants.ts` to the list at the same time — it is one constant, imported
only by the `instrumentation*.ts` files already on it.

**`world-postprocessing.tsx` has been taken _off_ this list, and the reason generalizes.** It
was here as "pure effect-pass config with no observable behavior headlessly"; the behavior turns
out to be observable, because mocking `@react-three/postprocessing` at the third-party boundary
leaves our own component running and its palette-driven bloom and vignette values assertable
(Phase 6). What genuinely cannot run headlessly is one library call — `EffectComposer` reading
`getContextAttributes().alpha` off a real WebGL context. **Before excluding a file, check whether
what cannot run is the file or a dependency of it**, and stub the dependency.

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
  done, and deliberately deferred**, with the reasoning now recorded in
  [`decisions.md`](./decisions.md) rather than left as a status note. §7's minutes argument
  holds — this phase already took CI from ~3.7 min to ~7.4 min locally — but the deciding
  one is that **CI cannot photograph the world a visitor sees**: on SwiftShader the tier is
  pinned to `frozen` before the canvas mounts, so a baseline records one demand-driven frame
  at `DPR_DEGRADED` with `antialias: false`. Revisit it **DOM-only**, after Phases 5 and 6.

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

### Phase 3 — client state, hooks, providers — ✅ complete

Landed 2026-08-10 as **10 new spec files and 89 new tests**, taking the suite from 30/237 to
**42 files / 326 tests**. `pnpm validate` green, `pnpm e2e:ci` 210/210.

| Target                | Before      | **After**           |
| --------------------- | ----------- | ------------------- |
| `src/stores`          | 60.3/44.4   | **97.7% / 90.7%**   |
| `src/hooks`           | 29.2/0      | **100% / 100%**     |
| `src/providers`       | 30.6/27.3   | **97.2% / 90.9%**   |
| `command-menu/stores` | 48.5/10.5   | **100% / 100%**     |
| `command-menu/hooks`  | 1.2/0       | **100% / 100%**     |
| `inspector/stores`    | 68.3/44.4   | **100% / 100%**     |
| Repo-wide             | 35.90/27.51 | **41.82% / 35.90%** |

- ✅ **All 7 external stores**, one spec per store so they travel with `git mv` in
  restructure Phase 5: no-op-on-unchanged (the world store is written on every pointer
  move), exact subscriber notification counts, the inert server snapshot, and storage the
  browser refuses — which is a thrown error during the boot gate, not a cosmetic
  degradation. `web-vitals-store` mocks the library and asserts the callbacks it registers,
  including `reportAllChanges` on INP and CLS and the once-only start.
- ✅ **`tests/media.ts`** owns the `matchMedia` and `navigator.connection` stubs — including
  the legacy `addListener` pair next-themes still calls — and `vitest.setup.ts` installs its
  no-preference default through the same helper, so the two cannot drift.
- ✅ **`providers.dom.test.tsx`** asserts the precedence `override ?? (system || lowPower)`
  and, for each consumer, what the provider actually hands it: Motion through
  `useReducedMotionConfig`, Lenis through a mocked constructor (never constructed under
  reduced motion, `anchors: true`, a bounded ease-out), next-themes through the `class`
  attribute Tailwind reads.
- ✅ **The 3 shared hooks**, including `useIsClient` asserted through `renderToStaticMarkup`,
  because "reports false on the server" is the entire contract.
- ✅ **`command-menu-store`** — both modifier flavors, `preventDefault` (Chrome and Firefox
  both want ⌘K), the mode reset on close, and the opener capture through every entry point.
- ✅ **`inspector-overlay-store`** — the exact modifier match, session persistence,
  rehydration after a reload, and no overlay in the server-rendered HTML.
- ✅ **`ask-agent.dom.test.tsx`** — every state the answer UI can render, driven through
  `useAskAgent` with `fetch` stubbed: streaming, done, refused, rate-limited (server message
  and fallback), unconfigured, a 200 with no stream, a stream that dies, an abort before the
  response and during it, stop with and without a partial answer, and a second question
  abandoning the first. A payload failing the schema yields no citations at all, since those
  chips become links.
- ✅ **`tests/interactions.ts`** — the act-wrapped `click`/`press` that `boot.dom.test.tsx`
  and two new specs had each grown their own copy of.

**Verified by mutation: 71 mutations across 12 source files, 66 killed.** The five that
survived first were all **tests that could not fail**, which is what this phase found instead
of production defects: `toHaveTextContent` matches substrings, so recording `document.body`
as the ⌘K opener satisfied a `"none"` assertion against the body's own text; the once-only
web-vitals start was asserted before its dynamic import could resolve; nothing observed the
`streaming` state, because every ask test awaited the whole request; and the answer and error
resets are invisible unless the _second_ question fails. The remaining survivors are
equivalent mutants — `TextDecoder.decode(undefined)` returns `""`, and an Escape keypress
while the inspector is already closed is a no-op either way.

**A `refactor:` came out of it.** `command-menu-store` had a `typeof window === "undefined"`
guard inside a `useEffect`, which cannot run on the server at all: it was the only branch of
that store no test could reach, so it was deleted rather than excluded or faked. Two
mechanical traps are now in [`.devin/rules/testing.md`](../.devin/rules/testing.md), both of
which let a test pass while asserting nothing: jsdom's `Storage` is a proxy, so an
instance-level `vi.spyOn` is stored as a _key_ instead of replacing the method, and Motion's
`useReducedMotion` ignores `MotionConfig` entirely.

Exit: **met.** These files move in restructure Phase 5 but do not merge, so the specs travel
intact with `git mv`.

### Phase 4 — pure-DOM components — ✅ complete

Landed 2026-08-10 as **7 new spec files and 136 new tests**, taking the suite from 42/326 to
**50 files / 462 tests**. `pnpm validate` green, `pnpm e2e:ci` 210/210. One spec per cluster,
not per source file (§3, rule 2), and `deck-explore-toggle.dom.test.tsx` folded into
`hud.dom.test.tsx` because its one assertion was a subset of it.

| Target                    | Before      | **After**           |
| ------------------------- | ----------- | ------------------- |
| `command-menu/components` | 4.2/0       | **100% / 99.0%**    |
| `inspector/components`    | 4.8/0       | **100% / 100%**     |
| `world/components/hud`    | 27.7/10.5   | **100% / 100%**     |
| `components/ui`           | 82.4/66.7   | **100% / 100%**     |
| `components/seo`          | 0/100       | **100% / 100%**     |
| `home/components`         | 87.5/100    | **100% / 100%**     |
| boot + content in `world` | partial     | **100% / 100%**     |
| Repo-wide                 | 41.82/35.90 | **51.03% / 58.70%** |

- ✅ **`command-menu.dom.test.tsx` + `ask-answer.dom.test.tsx`** — the shell and its two
  modes, then what the answer renders. The browser suite spot-checks one navigation action;
  these assert every one of them, the close-then-act ordering that keeps a route change from
  happening under a dialog still on screen, and the markup rules that bound model output: a
  citation marker becomes a control only when the server sent a source for it, and a link is
  an internal route, a fragment or an http(s)/mailto URL — or it is text.
- ✅ **`inspector.dom.test.tsx` + `inspector-format.test.ts`** — the overlay with its
  measurements supplied: `web-vitals` mocked at the library boundary, frame stats published
  through `perf-store`, route JS read from a stubbed Resource Timing buffer. Units and
  thresholds are the node spec, because the panel shows one value at a time.
- ✅ **`hud.dom.test.tsx`** — every deck control's label and pressed state in both
  directions, the pre-hydration render (guessing the theme there is a hydration mismatch),
  explore mode's absence under reduced motion, the radar's station derived from the path, and
  what the deck tells the world when a destination is pointed at or focused.
- ✅ **`content-blocks.dom.test.tsx`** — the seven block kinds as markup, every optional
  field both ways, and an unknown kind that throws rather than dropping a section. Fixture
  blocks, not real destinations, so rewriting a page cannot break a spec about structure.
- ✅ **`boot.dom.test.tsx` extended** — the gate is also a preferences screen: the theme
  handed to the provider, a muted entry that never touches the audio engine, the inspector
  preference applied on entry in both directions, Escape as a muted exit, an entry that cannot
  start twice, and the splash the sequence hides as it takes over.
- ✅ **`ui.dom.test.tsx`, `json-ld.test.tsx`, `pixelated-portrait.dom.test.tsx`,
  `home.dom.test.tsx` extended** — the leaves, asserted only where a change would be a defect:
  decoration stays out of the accessibility tree, `asChild` yields one element rather than a
  link inside a button, the canvas portrait is described by the frame around it, and the hero
  CTA opens Ask mode rather than merely opening.
- ✅ The pure formatters this phase owed: `inspector-format.ts`, `inspector-route-js.ts` and
  `ask-answer-formatting.tsx` (through the rendered answer, since the sanitizer's output _is_
  the markup). `ask-agent-sources.ts` was already at 100% from Phase 3.

**Verified by mutation: 97 mutations across 31 source files, 90 killed on the first pass.**
The seven survivors were all **tests that could not fail**, and each is now fixed: an
always-rendered optional field is an empty paragraph, which no text assertion can see; an
internal link turned external keeps its href; `toHaveTextContent` reads text a screen reader
would never reach, so a `hidden` announcement satisfied it; nothing asserted `aria-pressed`
after a mode change; and skipping the boot intro was never asserted to stay silent.

**What it found in the product**, which is the return on the phase:

- **An accessibility defect** (`fix`): the inspector overlay's four panel titles looked like
  headings and grouped everything under them, but were `<div>`s — WCAG 1.3.1, and nothing in
  the overlay had structure a screen reader could navigate.
- **A security hardening** (`fix`): `JsonLd` embedded `JSON.stringify` output directly, and
  that does not escape `<`, so a `</script>` in the graph would have ended the element.
  Nothing untrusted reaches it today; the guarantee is now local to the sink.
- **Two pieces of code that could not run** (`refactor`, the Phase 3 rule applied twice):
  ⌘K's `openTick` counted dialog opens Radix never reports, because the menu has no
  `Dialog.Trigger`; and `measureRouteJs` guarded against a missing `window` and `performance`
  from inside a client effect. Both deleted, both recorded in
  [`decisions.md`](./decisions.md).

**One thing is deliberately not asserted**, and the spec says so in place: the boot overlay's
`onInteractOutside` guard. Its content is `fixed inset-0`, so a pointer has nowhere outside to
land, and Radix's outside-interaction detection does not reproduce faithfully in jsdom — a
version of that test passed with the guard deleted.

`boot.dom.test.tsx` had landed early, out of phase order, because E2E could not assert it
reliably. **That rule held for the rest of the phase — anything whose outcome depends on a
timer is a component test, not an E2E test** (see [`decisions.md`](./decisions.md)): ⌘K's mode
switching, the 600 ms route-JS settle and the boot preferences are all deterministic here and
animation-gated in a browser.

Exit: **met.** Every cluster the phase named is at 100%, and no new stderr output: the two
jsdom traps this phase met — `vi.unstubAllGlobals()` dropping the setup file's `matchMedia`,
and a real `location` assignment logging "Not implemented" — are handled in the specs rather
than tolerated.

### Phase 5 — canvas draw routines and layout math — ✅ complete

Landed 2026-08-11 as **9 new spec files and 127 new tests**, taking the suite from 50/462 to
**59 files / 589 tests**. `pnpm validate` green. `tests/recording-ctx.ts` is the helper Phase 0
deferred, written here because this phase gave it its callers.

| Target                       | Before      | **After**           |
| ---------------------------- | ----------- | ------------------- |
| `studio/…/scene`             | 84.7/53.1   | **98.9% / 77.6%**   |
| `studio/…/screens`           | 23.8/8.3    | **88.7% / 52.8%**   |
| `about/components`           | 23.9/20.6   | **95.0% / 75.0%**   |
| `world/…/props`              | 0/0         | **78.6% / 56.0%**   |
| `world/…/lounge`             | 0/0         | **55.4% / 87.5%**   |
| `world/…/lounge-tv-channels` | 0/0         | **100% / 91.7%**    |
| `src/hooks`                  | 100/100     | **100% / 100%**     |
| Repo-wide                    | 51.03/58.70 | **74.34% / 67.94%** |

- ✅ **The pixelated portrait**, which Phase 4 left at the door — the engine's two properties
  worth asserting before any snapshot exists: it no-ops with no 2D context, and it binds no
  pointer listeners when `interactive` is false, which is how reduced motion reaches it.
- ✅ **The desk screens and the wall screens** — `screens/screen-draw.test.ts` and
  `props/screen-draw.test.ts`, one spec per cluster. What a given input paints, and that the
  inputs that move (a caret, a frame rate, a clock, a stroke, a progress) each change it.
- ✅ **`lounge-tv.test.ts`** — every frame is a pure function of one integer, so channel
  rotation, the seeded tune-in static and the progress bar are all assertable.
- ✅ **`props/bookshelf.test.ts`** — the generated shelf, asserted as invariants rather than a
  golden: nothing hangs off either end, no two spines overlap, heights clamp under the plank
  above, the instance keys are unique, and each row is its own arrangement.
- ✅ **`scene/textures.dom.test.ts`** — the four texture factories and the keyboard legends,
  through `stubCanvasContexts`. Windows inside the facade and in the lit palette, gradient
  stops in order, stars above the horizon, the glow reaching zero before its quad edge, and
  every legend centered on its keycap and shrunk to fit.
- ✅ **`use-disposable.dom.test.ts`** and **`lounge-tv-texture.dom.test.ts`** — the hook the
  phase's defect produced, and the television's 110 ms clock.

**Verified by mutation: 29 mutations across 7 source files, 27 killed on the first pass.** Both
survivors were fixed rather than accepted: a redundant `Array.isArray` branch that `Object.values`
already covered was **deleted** (the Phase 3/4 rule, a third time), and the `typeof … ===
"function"` guard on the disposable walk had nothing exercising it until a `{ dispose: 3 }` was
added to the mixed fixture.

**What it found in the product is one defect, and it is the phase's real return:** `src/`
contained **no `dispose()` call at all**, while `three-r3f-world.md` requires imperatively-built
textures and geometries to be released on unmount. Ten textures and seven geometries across six
components leaked every time the canvas unmounted — which a visitor causes by turning motion off
mid-session, since `world-stage.tsx` gates the whole scene on it. Fixed with
`src/hooks/use-disposable.ts`; see [`decisions.md`](./decisions.md) for why it holds the resource
in `useState` rather than `useMemo`.

**Two residues are deliberate, not unfinished.** The five wall-screen draws sit at 50% branches
and `keyboard-layout`, `radar-layout` and `mouse-trim-geometry` near it, because what is left in
each is a `noUncheckedIndexedAccess` guard or a `?? fallback` that indexing inside the array's own
length cannot reach — the §5.3 rule about `src/ai` applies unchanged, and reaching them tests
TypeScript rather than the product. And `world/…/lounge` reads 55% because the remaining files are
the R3F furniture, which is Phase 6.

**Phase 6 (the 3D scene graph) is the next thing to work on.**

### Phase 6 — the 3D scene graph — ✅ complete

Landed 2026-08-11 as **21 new spec files and 174 new tests**, taking the suite from 59/589 to
**80 files / 763 tests**. `pnpm validate` green. The 3D layer is no longer the residue: every
row the earlier phases deferred is now at 97–100%. This section's own heading asked for 75%
statements and §5.3 for 70% branches on R3F components; `world/components` reports **98.2% /
95.1%**, and `pnpm e2e:ci` is still 210/210.

| Target             | Before      | **After**           |
| ------------------ | ----------- | ------------------- |
| `world/components` | 29.5/38.7   | **98.2% / 95.1%**   |
| `world/hooks`      | 4.9/0       | **98.2% / 93.4%**   |
| `world/utils`      | 49.7/35.5   | **99.3% / 95.2%**   |
| `world/constants`  | 78.9/84.6   | **97.8% / 84.6%**   |
| `world/…/lounge`   | 55.4/87.5   | **99.4% / 87.5%**   |
| `world/…/props`    | 78.6/56.0   | **98.2% / 76.0%**   |
| `studio/…/scene`   | 98.9/77.6   | **99.8% / 87.8%**   |
| `studio/…/screens` | 88.7/52.8   | **99.1% / 83.3%**   |
| `components/r3f`   | 13.1/37.5   | **100% / 100%**     |
| Repo-wide          | 74.34/67.94 | **94.90% / 90.95%** |

- ✅ **The scene areas the section named**, one spec per area at its cluster root: the room and
  its light rig against `config/brand.ts` (extended from the §5.2 spike), the desk screens, the
  wall screens and the generated shelf, the AI core, the hotspots, the camera, the portals, the
  quality guard, the stage and the lounge. `tests/r3f.tsx` is the helper Phase 0 deferred until
  a second scene spec existed; it now has thirteen callers and owns three traps recorded in
  [`decisions.md`](./decisions.md).
- ✅ **`lounge.dom.test.tsx`** — the last scene area at 0%, asserted as an arrangement rather
  than a golden: the furniture stands on the floor, inside the room, hugging both walls, with
  the sofa on the rug facing a screen lit from the channel it is showing and a soundbar riding
  the console top. Positions are read as world boxes, never as local `position` props.
- ✅ **`canvas-support.dom.test.tsx`** — the two components the canvas wraps the scene in that
  draw nothing: the precompile that takes the boot screen down (resolve, reject, an
  eight-second timeout, and once only across all three) and the perf reporter the inspector
  reads (a quarter-second sampling window, the renderer's own counters, and readings that go
  stale when the canvas dies).
- ✅ **`screens/textures.dom.test.ts` + `screens/frames.dom.test.tsx`** — the four desk-screen
  clocks, split by what drives them rather than by file: a caret on a 600 ms interval and a
  Lisbon clock with an uptime counted from mount under fake timers; a frame-rate sampler and a
  tablet stroke under `advance()`. This is the row Phase 5 left at 52.8% branches.
- ✅ **`world-canvas.dom.test.tsx`** — the composition root, which had never been rendered at
  all. `Canvas` is replaced with a pass-through that records its props, so the whole world
  mounts inside RTTR's root: 331 meshes, 25 lights, the quality tier reaching `frameloop`,
  `dpr` and `antialias`, the palette reaching the fog and the bloom, `dprForFactor` through
  `PerformanceMonitor`, and explore mode standing the visitor up at eye height.
- ✅ **`world-neon`, `StatusLed`, `BootProgressReporter`** — the sign's decorative text kept out
  of the accessibility tree and dimmed by the palette, the LED's pulse and its halo, and the
  loader's progress arriving on the gate's progress bar, asserted in `boot.dom.test.tsx` where
  the number is read.
- ✅ **`silence-clock-deprecation.test.ts`** — the console filter the whole suite's zero-stderr
  rule leans on, asserted for the property nobody would notice breaking: every _other_ warning
  still gets through, including an `Error` that happens to quote the deprecation.

**Verified by mutation: 54 mutations across 21 source files, 52 killed on the first pass.** Both
survivors were tests of mine that could not fail, and both are fixed. The lounge's placement was
asserted against the same constant that places it — a tautology that a moved origin walked
straight through — so it now asserts the corner the lounge occupies in the _room_, which also
constrains the rotation. And the console filter's `typeof args[0] === "string"` guard was an
equivalent mutant until a warning carrying an `Error` was added, since `String()` on it would
have matched.

**What it found in the product is two defects, one of them the same one Phase 5 found.**
`useMemo` with no cleanup held a `createCanvasTexture` in **five more call sites** — the four
desk-screen hooks and `wall-screen.tsx`, which is one instance per wall station, so nine
textures leak on every motion toggle. Phase 5's audit looked for texture _factories_ and these
are hooks that wrap one. And **`WebGLContextGuard` was deleted**: its whole body was
`event.preventDefault()` on `webglcontextlost`, which three's own `WebGLRenderer` already does
from a listener it registers in its constructor — so a test of it passed with the body removed.
That is the Phase 3/4/5 rule applied a fourth time. Both are in
[`decisions.md`](./decisions.md).

**It also found a hole in the test config**, which is why nothing here resolved at first:
`@react-three/postprocessing` was missing from `server.deps.inline`, so it loaded fiber's CJS
build and its `useThree` failed with "Hooks can only be used within the Canvas component!" from
inside a component that plainly is. Same root cause as §5.2, one package further out.

**Four residues are deliberate.** `world-canvas.tsx` sits at 90% statements: the two lines left
are the `onSelect` and `onAskAi` callbacks, and driving them here would mean raycasting a
pointer through the full scene, which `world-interact.dom.test.tsx` already does on its own
props and `station-index.test.ts` already proves for slug → href. `world-postprocessing.tsx` is
no longer an exclusion candidate — §5.3 is updated — because mocking
`@react-three/postprocessing` at the third-party boundary leaves our own component running; what
_cannot_ run headlessly is `EffectComposer`, which reads `getContextAttributes().alpha` off a
real WebGL context. And the last percent of `orbit-input-state.ts` and `destinations.ts` is a
`instanceof Element` narrowing and a `RouteKey` that cannot miss its own map: the §5.3 rule
about `src/ai` applies unchanged.

**Three things Phase 7 has to decide, none of them Phase 6's to take.** `features/audio` is at
**8.8%** and no phase ever owned it — Web Audio has no jsdom equivalent, so it is either an
exclusion with a reason or an E2E-only surface stated as such. The 17 `app/(world)` pages are at
**0%** against §5.3's 90% target, while `routes.spec.ts` and `content-in-dom.spec.ts` assert all
17 over HTTP; that target should either be dropped or met, not left as a number nothing is
working toward. And `src/telemetry/constants.ts` is imported only by `instrumentation*.ts`, which
§5.3 already excludes, so it belongs in the same list.

Exit: **met.** Restructure Phases 3–4 move 40 scene files and collapse the boot cluster, and the
failure mode of both — a mesh, a light or a whole layer silently disappearing — now fails a test
in under nine seconds.

#### The RTTR API this phase needed, beyond the spike

The spike used only `create()` and the scene graph. **`advanceFrames(frames, delta)`** runs the
`useFrame` subscribers — `create()` sets `frameloop: "never"`, so motion only advances when a
test says so — but it does **not** move `state.clock` and it calls the subscribers outside
React, so `tests/r3f.tsx` wraps it in `advance()`, which does both. **`toGraph()`/`toTree()`**
turned out to be no help for a component that renders `null`: both serialize three instances,
not React elements, so a `PerformanceMonitor` is reached through the props a stub recorded
rather than through the tree.

**`renderer.fireEvent` is RTTR's, not Testing Library's, and the DOM rule is unchanged: use
`user-event`.** A mesh has no DOM node — R3F raycasts its events from one pointer event on
the `<canvas>` — so user-event has nothing to aim at and cannot reach the scene at all. The
real split is which question is being asked: RTTR answers _is the handler wired and does the
state change_, in milliseconds and with no camera involved; only Playwright can answer _does
a pointer at these coordinates hit that object_, which `world.spec.ts` already does for
explore mode. Phase 6 needed both, and neither is a substitute for user-event in a DOM spec.

### Phase 7 — lock it in

Per-layer coverage thresholds enabled and ratcheted; `pnpm validate` switched to
the coverage run; coverage-exclusion list from §5.3 applied; `AGENTS.md` updated
with the testing conventions and helper locations.

Three decisions Phase 6 deliberately left rather than taking, each argued where it belongs
(§5.3 and the end of Phase 6): what to do about **`features/audio`** at 8.8%, which no phase
ever owned; whether the **`src/app/**` pages** row keeps its 90% target or is dropped in favor
of the HTTP assertions that already cover all 17; and folding **`src/telemetry/constants.ts`**
into the existing exclusion list. Two of the three are one line of config each — the work is
writing down which way it went.

One sequencing note this plan has earned twice: the thresholds should be set from a
**re-measured** run in the same commit that enables them, and never in the same commit as an
E2E phase (§2). At the time of writing the numbers to ratchet against are 94.90% statements and
90.95% branches repo-wide, but re-measure — this table has gone stale four times.

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
