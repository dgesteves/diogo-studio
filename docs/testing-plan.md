# Testing plan

A phased plan to take `src/` to a real, trustworthy regression net — built
specifically so that [`restructure-plan.md`](./restructure-plan.md) can be
executed without fear.

Status: **Phase 0 is partly landed; Phases 1–7 are not started.** Four things have
shipped: the `Math.random()` seeding fix in §5.1, `mulberry32` promoted to
`src/utils/mulberry32.ts`, **the existing E2E suite made green** (it was 16/18 — the
`/work` spec asserted content that no longer exists, and the ⌘K Ask-mode spec was
flaky ~1 in 12 because it raced hydration), and **RTTR installed with its spike
passing** (§5.2). This plan calls E2E "the actual harness" for the restructure (§3),
so it had to be trustworthy before anything could be built on it.

Still open in Phase 0: the `tests/` helpers, the `node`/`jsdom` project split, and the
`vitest.config.ts` ESM-loaded-as-CJS warning.

Baseline: re-measured 2026-08-08 on the current tree (version 1.12.0), **after** the
RTTR spike. `pnpm validate` passes. Every number below is measured; where an earlier
draft's figure has been superseded it is marked, because this plan's whole argument is
that unverified numbers should not govern work.

---

## 1. Verdict

The premise "we never started creating tests" is not accurate, and the difference
matters. There are **19 vitest files (96 tests)** and **6 Playwright specs**, and
the whole toolchain is already wired: vitest + jsdom, Testing Library (`react`,
`dom`, `jest-dom`, `user-event`), `@vitest/coverage-v8`, Playwright,
`@axe-core/playwright`, and `@react-three/test-renderer`. Conventions exist and are
good.

So this is not a greenfield problem. It is a **coverage-breadth** problem: the
existing tests cluster on pure retrieval math and world data invariants, and
almost nothing covers the server layer, client state, UI behaviour, or the 3D
scene.

The second correction is more important. **"Maximum coverage on everything" is
the wrong objective function.** 79 of 298 files render Three.js, and coverage on
them is only meaningful if you assert the scene graph; a line-coverage target
alone would push toward tests that mount components and assert nothing. The RTTR
spike has now demonstrated exactly that hazard from the good side: four tests took the
40-file `scene/` cluster to **84.65% statements but only 53.06% branches**, because
mounting a declarative scene executes almost every statement while touching almost no
conditional. Statements are nearly free here; branches are the work. The target should
be **behavioural fidelity per layer**, with coverage as the measurement, not the goal.
Section 5 sets a layered target that lands at **~90% statements** honestly, and says
which files should never be chased.

---

## 2. Baseline (measured, not guessed)

| Metric                          | Value                                                  |
| ------------------------------- | ------------------------------------------------------ |
| Non-test source files           | **298** (156 `.tsx`, 142 `.ts`)                        |
| Unit test files / tests         | **19 / 96**                                            |
| E2E specs / tests               | **8 / 26** → **44 runs** across two motion projects    |
| Statements / branches           | **28.82% / 13.67%**                                    |
| Functions / lines               | **28.36% / 29.67%**                                    |
| Routes in `constants/routes.ts` | **17**, all with a `(world)` page                      |
| E2E route coverage              | 3 of 17 asserted (`/`, plus content pages spot-checks) |
| E2E motion modes                | **both** — `reduced-motion` + `full-motion` projects   |

Before the RTTR spike this table read 297 files, 16/76, and **10.71% / 9.23%**. The
jump to 28.82% comes from a single spec, which is the whole point of §5.2 — and the
branch column barely moved, which is the whole point of §5.3.

### Coverage by layer today

| Layer                | Stmts     | Branch    | Note                                                                                |
| -------------------- | --------- | --------- | ----------------------------------------------------------------------------------- |
| `src/schemas`        | 100%      | 100%      | one file                                                                            |
| `src/utils`          | 100%      | 100%      | `cn.ts` + `mulberry32.ts`                                                           |
| `src/constants`      | 100%      | 100%      | `routes` + `career` invariants                                                      |
| `src/config`         | 87%       | 67%       | `world-theme` only                                                                  |
| **`studio/…/scene`** | **84.7%** | **53.1%** | the RTTR spike — 40 files, 4 tests. Note the gap between the two columns.           |
| `src/components/ui`  | 82%       | 67%       | reached via `home` and the scene, not directly tested                               |
| `world/constants`    | 80%       | 85%       | the existing data-invariant tests                                                   |
| `src/ai`             | 71%       | 72%       | retrieval math only; stream/embed/prompt at **0%**                                  |
| `world/utils`        | 45%       | 26%       | 3 of 8 files at 0%                                                                  |
| `src/stores`         | 34%       | 13%       | 5 of 7 stores at **0%**                                                             |
| `studio/…/screens`   | 24%       | 8%        | incidental — the spike mounts them, nothing asserts them                            |
| `world/…/hud`        | 28%       | 11%       | one toggle spec                                                                     |
| `src/hooks`          | 17%       | 0%        | —                                                                                   |
| `src/providers`      | 14%       | 9%        | —                                                                                   |
| `world` components   | 4%        | 0%        | boot, lounge, props all at **0%**                                                   |
| `command-menu`       | 4%        | 0%        | the primary interactive feature                                                     |
| `inspector`          | 5%        | 0%        | —                                                                                   |
| `src/app`            | **0%**    | **0%**    | every route, `sitemap`, `robots`, icons                                             |
|                      |           |           | (`layout`/`loading`/`error`/`not-found` are already excluded in `vitest.config.ts`) |
| `rate-limit.ts`      | **0%**    | **0%**    | security-relevant                                                                   |

The three highest-risk zeros are unchanged by the spike: `rate-limit.ts` (abuse
protection), `app/api/chat/route.ts` (7 distinct response branches, all unverified),
and `command-menu` (the feature users actually touch). Note also the two rows the
spike raised _incidentally_ — `studio/…/screens` and `components/ui`. Coverage there
is a by-product of mounting the scene, not evidence of anything, and it is exactly the
"tests that mount components and assert nothing" effect §1 warns about. Do not read
those percentages as progress.

---

## 3. The governing constraint: these tests must survive the restructure

This suite exists to make the restructure safe, so it must not itself become
restructure debt. The restructure moves or merges nearly every file: `src/ai` →
`features/agent` with 6 `retrieve-*` merged into one, 15 `boot-*` → ~5, 6
`pixelated-portrait-*` → 2, `studio` dissolved into `world`, `src/stores`
dissolved, `config/brand.ts` → `world/scene/materials.ts` (39 importers).

A test that deep-imports `@/features/studio/components/scene/mouse-shell` dies in
Phase 4. A test that drives `/` in a browser survives every phase. Four rules
follow, and they are what make this plan cheap rather than expensive:

1. **Test through the seam you intend to keep.** Prefer, in order: HTTP endpoint
   → rendered DOM → feature barrel (`@/features/world`) → module path. Only drop
   to a module path when the behaviour has no coarser seam (pure math, data
   invariants).
2. **One test file per _concept_, not per source file.** The restructure merges
   files; tests organised per concept merge with them for free. `boot.test.tsx`
   covering the whole boot sequence survives 15 → 5; fifteen `boot-*.test.tsx`
   files do not.
3. **Assert behaviour and contracts, never module structure.** No assertions on
   which file exports what, no snapshotting import graphs.
4. **Colocate, but at the cluster root.** `.devin/rules/project-structure.md`
   mandates colocation; put the file at the directory the cluster will collapse
   into (`world/components/hud/hud.test.tsx`), so `git mv` of the folder carries
   it.

   Where the collapse target does not exist yet, write the test at the **current**
   cluster root and let the phase move it — do not create the future folder early.
   Concretely: `features/studio/components/scene/scene.test.tsx`, not
   `features/world/scene/`, since Phase 4 `git mv`s that whole directory and will
   carry the spec with it. The same applies to `src/ai/` (Phase 6) and the
   `boot-*` cluster, which has no folder at all today — put `boot.test.tsx` in
   `features/world/components/` beside the files it covers.

Sequencing consequence: **E2E and contract tests come first** (Phases 1–2). They
are 100% structure-immune and they are the actual harness that verifies "pure
move, no behaviour change". Unit tests on internals come after, and the ones on
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
exactly the "test the exact current behaviour" characterisation you asked for. A
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
2. **Behavioural E2E (Playwright).** The `AGENTS.md` non-negotiables are already
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
spike lives at `features/studio/components/scene/scene.test.tsx` — the current cluster
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

So the 75% statement estimate was **conservative** and the R3F strategy is validated.
But the useful finding is the column that was never estimated: **branches at 53%**.
Mounting a declarative scene executes nearly every statement and almost no conditional,
so Phase 6's real work is the branching behaviour — palette swaps, focus state, reduced
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

Files that should be _excluded from the denominator_ rather than faked:
`instrumentation*.ts`, `global-error.tsx`, `icon.tsx`/`apple-icon.tsx` (satori
`ImageResponse`, asserted via E2E HTTP status instead), and
`world-postprocessing.tsx` (pure effect-pass config with no observable behaviour
headlessly). `vitest.config.ts` **already** excludes `src/app/**/{layout,loading,
error,not-found}.tsx`; fold these into that existing list rather than starting a new
one, and drop the `layout`/`loading` entries if the Phase 4 work makes them
assertable after all.

Never fail CI on coverage _downward drift alone_ while a phase is in flight —
ratchet on merge to `main`.

### 5.4 Where tests run

Split by environment using vitest `projects`: `node` for route handlers,
`sitemap`, `robots`, `rate-limit`, and pure logic; `jsdom` for RTL, stores, and
RTTR. This also fixes the current setup, where node-only code is being exercised
under jsdom.

---

## 6. Phased plan

Each phase is independently shippable and ends green on `pnpm validate`. One
commit per logical group, `test:` type per Conventional Commits.

### Phase 0 — fix the foundation (prerequisite, small) — partly landed

- ✅ **Add `@react-three/test-renderer`; prove it with one spike.** Done — see §5.2 for
  the result and the resolution fix it needed. The "if the spike fails, stop and
  re-plan" branch was not taken.
- ✅ Seed the two `Math.random()` draw paths (§5.1).
- Add helpers in **`tests/`** at the repo root (not `src/test/` — see
  [`decisions.md`](./decisions.md)): `recording-ctx.ts` (Proxy draw recorder),
  `r3f.ts` (RTTR render + scene-graph query helpers), `stores.ts` (reset all
  external stores between tests), `env.ts` (env-var override helper). Add a
  `@tests/*` path to `tsconfig.json` at the same time; `vitest.config.ts` already
  globs `tests/**` and resolves tsconfig paths. **`r3f.ts` has a first draft
  already** — the `renderScene` / `isMesh` / `lightsOfType` helpers in
  `scene.test.tsx` are what it should hold; promote them when a second spec needs
  them, not before.
- Split vitest into `node` / `jsdom` projects; fix the `vitest.config.ts`
  ESM-loaded-as-CJS warning. **Careful:** the `resolve.mainFields` and
  `server.deps.inline` entries added for RTTR must survive the split, or every scene
  test breaks (§5.2).
- Fix the existing `act(...)` warning in `deck-explore-toggle.test.tsx`.

Exit: spike passes, helpers exist, suite green with no warnings. Two of five done; the
suite is 19 files / 96 tests and green, but the warnings are still there.

### Phase 1 — the server and contract layer (~15 files → 100%)

Highest risk-per-line in the repo, and completely structure-immune because it is
tested through HTTP.

- `app/api/chat/route.ts` — all 7 branches: invalid JSON → 400, schema failure →
  400, rate limited → 429, refusal/no hits → 200 + `REFUSAL_TEXT`, no API key +
  hits → 503 fallback, streaming success → 200, and the `x-agent-sources` /
  `cache-control: no-store` headers.
- `rate-limit.ts` — `x-forwarded-for` → `x-real-ip` → `anonymous` precedence,
  local sliding-window exhaustion and refill (fake timers), Upstash path mocked.
- `app/api/health/route.ts`, `sitemap.ts`, `robots.ts` — shape and per-route
  priority/changefreq.
- `ai/agent-stream.ts`, `embed-query.ts`, `agent-response.ts`,
  `system-prompt.ts`, `agent-index.ts` — mock `ai`/`@ai-sdk/openai`; cover the
  Sentry error paths and base64 `sourcesHeaderValue` round-trip.
- `schemas/agent.ts`, `config/site.ts` (`getSiteUrl` precedence and
  normalisation), `config/env.ts` degradation.
- Finish `ai/retrieve-*` to 100% (bm25/cosine/keyword edges: zero vectors,
  mismatched dims, stopword-only queries, `minScore` boundaries).

### Phase 2 — the E2E net (structure-immune; the actual harness) — started

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

Remaining, to grow `tests/e2e/` from 8 specs to ~16, organised by user journey:

- **`routes.spec.ts`** — all 17 routes: 200, `<h1>`, title/description, canonical,
  no console errors. Currently 3 of 17 are asserted.
- **`seo.spec.ts`** — JSON-LD parses and matches `personJsonLd`/`websiteJsonLd`,
  OG/Twitter tags, `sitemap.xml` lists all 17 routes, `robots.txt` disallows
  `/api/`.
- **`world-3d.spec.ts`** (extend) — the boot sequence beyond gate-and-enter: progress,
  log, and the theme/sound/inspector toggles.
- **`world.spec.ts`** — explore toggle, station focus, deep links, radar, map
  overlay, sector list. Tag `@full-motion`: these only exist with the canvas up.
- **`world-responsive.spec.ts`** — the "never crops" non-negotiable at ultrawide,
  laptop, tablet, portrait phone. `@full-motion`, since cropping is a camera concern.
- **`ask-agent.spec.ts`** — the `/api/chat` journey with the route mocked:
  streaming answer, citations, retrieval badge, 429, 503, refusal, stop.
- **`command-menu.spec.ts`** (extend) — ⌘K, ⌘1/⌘2 mode switch, navigate, theme,
  empty state.
- **`a11y.spec.ts`** (extend) — axe on all 17 routes, plus focus-visible,
  focus-trap-free panels, and keyboard-only traversal. Untagged, so every route is
  scanned in both motion modes — that is 34 scans, so watch the wall time.
- **`content-in-dom.spec.ts`** — destination content is server-rendered and
  present without any 3D interaction (the crawlability non-negotiable). Untagged: the
  point is that it holds identically with and without the canvas.
- **`visual.spec.ts`** — the ~8–10 baselines, paths-filtered job, Docker-pinned.

Exit: the restructure now has a net that fails loudly on any behaviour change.

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
`boot.test.tsx`, `inspector.test.tsx`, `command-menu.test.tsx`,
`content-blocks.test.tsx`, `ui.test.tsx`, `sections.test.tsx`. Assert what the
user sees and does — roles, labels, keyboard interaction, state transitions —
using the established `home.test.tsx` style.

Also the pure formatters here: `inspector-format.ts`, `inspector-route-js.ts`,
`ask-answer-formatting.tsx` (including the href-sanitisation branches, which are
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
  behaviour that must hold in both modes, and waste for anything else — the `@full-motion`
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
