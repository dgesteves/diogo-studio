# Testing plan

A phased plan to take `src/` from 10.71% to a real, trustworthy regression net —
built specifically so that [`restructure-plan.md`](./restructure-plan.md) can be
executed without fear.

Status: proposal. No phase has been applied — but three things it depended on landed
early: the `Math.random()` seeding fix in §5.1, `mulberry32` promoted to
`src/utils/mulberry32.ts`, and **the existing E2E suite made green**. It was 16/18:
the `/work` spec asserted content that no longer exists, and the ⌘K Ask-mode spec was
flaky ~1 in 12 because it raced hydration. Both are fixed. This plan calls E2E "the
actual harness" for the restructure (§3), so it had to be trustworthy before anything
could be built on it.

Baseline: measured on the current tree (version 1.12.0). `pnpm validate` passes.

---

## 1. Verdict

The premise "we never started creating tests" is not accurate, and the difference
matters. There are **16 vitest files (76 tests)** and **6 Playwright specs**, and
the whole toolchain is already wired: vitest + jsdom, Testing Library (`react`,
`dom`, `jest-dom`, `user-event`), `@vitest/coverage-v8`, Playwright, and
`@axe-core/playwright`. Conventions exist and are good.

So this is not a greenfield problem. It is a **coverage-breadth** problem: the
existing tests cluster on pure retrieval math and world data invariants, and
almost nothing covers the server layer, client state, UI behaviour, or the 3D
scene.

The second correction is more important. **"Maximum coverage on everything" is
the wrong objective function.** 79 of 297 files render Three.js, and coverage on
them is only meaningful if you assert the scene graph; a line-coverage target
alone would push toward tests that mount components and assert nothing. The
target should be **behavioural fidelity per layer**, with coverage as the
measurement, not the goal. Section 5 sets a layered target that lands at
**~90% statements** honestly, and says which files should never be chased.

---

## 2. Baseline (measured, not guessed)

| Metric                          | Value                                                  |
| ------------------------------- | ------------------------------------------------------ |
| Non-test source files           | **297** (156 `.tsx`, 141 `.ts`)                        |
| Unit test files / tests         | **16 / 76**                                            |
| E2E specs / lines               | **6 / 258** (18 tests, green since 2026-08-08)         |
| Statements / branches           | **10.71% / 9.23%**                                     |
| Functions / lines               | **10.24% / 11.02%**                                    |
| Files at 0% coverage            | **~230**                                               |
| Routes in `constants/routes.ts` | **17**, all with a `(world)` page                      |
| E2E route coverage              | 3 of 17 asserted (`/`, plus content pages spot-checks) |

### Coverage by layer today

| Layer              | Statements | Note                                                                                |
| ------------------ | ---------- | ----------------------------------------------------------------------------------- |
| `src/schemas`      | 100%       | one file                                                                            |
| `src/utils`        | 100%       | `cn.ts`                                                                             |
| `world/constants`  | 77%        | the existing data-invariant tests                                                   |
| `src/ai`           | 71%        | retrieval math only; stream/embed/prompt at **0%**                                  |
| `world/utils`      | 45%        | 3 of 8 files at 0%                                                                  |
| `src/stores`       | 29%        | 5 of 7 stores at **0%**                                                             |
| `src/providers`    | 14%        | —                                                                                   |
| `src/hooks`        | 4%         | —                                                                                   |
| `src/app`          | **0%**     | every route, `sitemap`, `robots`, icons                                             |
|                    |            | (`layout`/`loading`/`error`/`not-found` are already excluded in `vitest.config.ts`) |
| `rate-limit.ts`    | **0%**     | security-relevant                                                                   |
| `command-menu`     | **0%**     | the primary interactive feature                                                     |
| `inspector`        | **0%**     | —                                                                                   |
| `world` components | **~5%**    | 3D scene, boot, HUD                                                                 |
| `studio` (all)     | **0%**     | 40-file scene folder                                                                |

The three highest-risk zeros are `rate-limit.ts` (abuse protection),
`app/api/chat/route.ts` (7 distinct response branches, all unverified), and
`command-menu` (the feature users actually touch).

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

So **218 of 297 files (73%) are testable with what is already installed.** The
remaining 79 need exactly one new devDependency. No file is left without a tool.

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

**`@react-three/test-renderer@9.1.1` is compatible.** Peers are
`@react-three/fiber >=9.0.0`, `react ^19.0.0`, `three >=0.156`; the repo is on
fiber 9.7.0, React 19.2.8, three 0.185.1. It ships its own canvas/WebGL shim, so
it runs headless in node with no GPU. This is the only way to get real assertions
on the 3D tree, and it is precisely the right tool for restructure safety:
Phase 3 collapses 15 boot files into 5 and Phase 4 moves 40 scene files, and the
failure mode of both is _a mesh silently disappearing or a material changing_.
Scene-graph assertions catch that deterministically and for free; pixel diffing
catches it flakily and expensively.

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

### 5.2 R3F: add `@react-three/test-renderer`

Yes. It converts 79 files (27% of the codebase) from "E2E-only, uncoverable" to
"unit-testable with meaningful assertions", which is the difference between ~65%
and ~90% achievable coverage. One well-maintained pmndrs devDependency, same
org as the `@react-three/fiber` already in use, 54k weekly downloads. The release-age
policy is **24 hours**, enforced by `minimumReleaseAge: 1440` in
`pnpm-workspace.yaml` — installation simply fails if the version is younger, so there
is nothing to check by hand. (An earlier draft of this section said ≥7 days and
attributed it to `00-core.md`, which said no such thing; the real policy is now
recorded there.)

**The 75% target below is an estimate, not a measurement — and it governs the largest
block of work in this plan (79 files).** Phase 0's spike must report the statement
coverage it actually achieves on `studio-scene.tsx`, and this number must be replaced
with that figure before Phase 6 is planned in detail. "Declarative, so smoke tests
reach most lines" is a plausible argument, not evidence.

### 5.3 Coverage: ratcheted per-layer thresholds

A single global number is the wrong instrument, because 90% on pure math and 90%
on a lighting rig mean different things. Use **per-directory thresholds** in
`vitest.config.ts`, each ratcheted upward as phases land:

| Layer                                                               | Target   | Rationale                                              |
| ------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `src/ai`, `src/schemas`, `src/config`, `src/constants`, `src/utils` | **100%** | pure, no excuse                                        |
| `src/rate-limit.ts`, `src/app/api/**`                               | **100%** | security and contract surface                          |
| `src/stores`, `src/hooks`, `src/providers`                          | **95%**  | side effects are mockable                              |
| `world/utils`, `world/constants`, `*-draw.ts`, `*-layout.ts`        | **95%**  | pure logic                                             |
| Pure-DOM components                                                 | **90%**  | branches on state/props                                |
| R3F components                                                      | **75%**  | declarative; smoke + graph assertions reach most lines |
| `src/app/**` pages                                                  | **90%**  | static compositions, cheap to render                   |

Projection: **~88–92% statements overall**, not 100% — but be clear that this is a
sum of seven estimated per-layer numbers, not a derived figure. The R3F row is the
one that moves it materially, so treat the whole projection as provisional until
Phase 0's spike replaces that row with a measurement.

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

### Phase 0 — fix the foundation (prerequisite, small)

- Add `@react-three/test-renderer`; prove it with one spike test rendering
  `studio-scene.tsx` headlessly. **If the spike fails, stop and re-plan** — the
  R3F strategy depends on it.
- Add helpers in **`tests/`** at the repo root (not `src/test/` — see
  [`decisions.md`](./decisions.md)): `recording-ctx.ts` (Proxy draw recorder),
  `r3f.ts` (RTTR render + scene-graph query helpers), `stores.ts` (reset all
  external stores between tests), `env.ts` (env-var override helper). Add a
  `@tests/*` path to `tsconfig.json` at the same time; `vitest.config.ts` already
  globs `tests/**` and resolves tsconfig paths.
- Split vitest into `node` / `jsdom` projects; fix the `vitest.config.ts`
  ESM-loaded-as-CJS warning.
- Fix the existing `act(...)` warning in `deck-explore-toggle.test.tsx`.
- Seed the two `Math.random()` draw paths (§5.1).

Exit: spike passes, helpers exist, suite green with no warnings.

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

### Phase 2 — the E2E net (structure-immune; the actual harness)

This is the phase that licences the restructure. Grow `tests/e2e/` from 6 specs
to ~16, organised by user journey:

- **`routes.spec.ts`** — all 17 routes: 200, `<h1>`, title/description, canonical,
  no console errors. Currently 3 of 17 are asserted.
- **`seo.spec.ts`** — JSON-LD parses and matches `personJsonLd`/`websiteJsonLd`,
  OG/Twitter tags, `sitemap.xml` lists all 17 routes, `robots.txt` disallows
  `/api/`.
- **`boot.spec.ts`** — the boot sequence: progress, log, splash hiding,
  theme/sound/inspector toggles, session-once behaviour.
- **`world.spec.ts`** — explore toggle, station focus, deep links, radar, map
  overlay, sector list.
- **`world-responsive.spec.ts`** — the "never crops" non-negotiable at ultrawide,
  laptop, tablet, portrait phone.
- **`reduced-motion.spec.ts`** — with `prefers-reduced-motion: reduce` the canvas
  is not mounted and the entire site is still navigable.
- **`ask-agent.spec.ts`** — the `/api/chat` journey with the route mocked:
  streaming answer, citations, retrieval badge, 429, 503, refusal, stop.
- **`command-menu.spec.ts`** (extend) — ⌘K, ⌘1/⌘2 mode switch, navigate, theme,
  empty state.
- **`a11y.spec.ts`** (extend) — axe on all 17 routes, plus focus-visible,
  focus-trap-free panels, and keyboard-only traversal.
- **`content-in-dom.spec.ts`** — destination content is server-rendered and
  present without any 3D interaction (the crawlability non-negotiable).
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
**500 MB artifact quota**, with no required status checks available. This plan
roughly doubles E2E wall time, so:

- Keep Playwright on **chromium only**; do not add browsers for coverage's sake.
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
