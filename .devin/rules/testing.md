---
trigger: glob
globs: **/*.test.ts, **/*.test.tsx, **/*.spec.ts, **/*.spec.tsx, tests/**
---

# Testing

Stack: **Vitest** (jsdom for every test today — the node/jsdom project split is
testing-plan Phase 0, not done yet), **Testing Library** (`react`, `dom`,
`jest-dom`, `user-event`), **Playwright** + `@axe-core/playwright`, and
**`@react-three/test-renderer`** (RTTR) for the 3D scene. There is no Jest and
**no MSW** — mock with `vi.mock` at the module boundary. Do not add a testing
library without checking `package.json` first.

[`docs/testing-plan.md`](../../docs/testing-plan.md) is the authoritative plan and
tracks per-layer coverage targets.

## The objective

Every test here answers one question: **would a real visitor notice if this broke?** A
test that passes because it mirrors the implementation is worse than none — it costs
maintenance, blocks refactors, and buys no confidence. Passing is the floor, not the goal.

Six things make a test good in this repo. They apply to every kind below.

1. **Assert what the user sees or does**, through the coarsest stable seam available:
   HTTP → rendered DOM → feature barrel → module path. Drop to a module path only when
   the behaviour has no coarser seam (pure math, data invariants).
2. **Prove it can fail.** Before you trust a new test, break the code it covers and watch
   it go red — flip a guard, delete a branch, change a constant — then restore. `boot.test.tsx`
   was validated exactly this way (dropping two guards failed 3 of 7; forcing one flag
   failed 1 of 7). This is the standard, not a nicety.
3. **Cover every branch the product actually has**, not the happy path: reduced motion vs
   3D, day vs night palette, loading/empty/error/success, and the degraded env paths —
   every env var is optional, so those are real behaviour.
4. **Be deterministic by construction** — fake timers, seeded PRNGs, no network, no wall
   clock, no dependence on animation timing.
5. **Name the behaviour in the title**, not the implementation. "holds the visitor for the
   minimum duration", not "sets minElapsed".
6. **Own one concept per file**, at the cluster root, so it survives the merges in
   `docs/restructure-plan.md`.

## What each kind of test owns

Different layers catch different failures. Pick by what the code _is_, and don't duplicate
what a cheaper layer already proves.

### Pure logic, data and math — Vitest, node

Retrieval scoring, layout and geometry generators, formatters, palette and config
resolution, static content data.

- **Assert** the contract at its edges: zero/negative inputs, empty collections,
  mismatched dimensions, score boundaries, ordering, idempotence. Exact values, not
  "is truthy".
- **Reliable because** there is no async, no DOM, no environment. A flaky pure test means
  the code is not pure — find the hidden clock or global.
- **Never** snapshot a whole object just to have an assertion; name the property you mean.

### Cross-module invariants — Vitest, node

`routes.ts` ↔ `app/`, `station-index.ts` ↔ `destinations.ts`, the generated agent index ↔
its sources.

- **Assert** that two sources of truth still agree, and fail with the mismatch named.
  These catch the one failure mode types cannot: data drift.
- **Never** relax one side to make the other pass — that _is_ the drift.

### DOM components — Vitest + RTL, jsdom

- **Assert** roles and accessible names, keyboard operation, and every state transition a
  user can trigger. `user-event` over `fireEvent`.
- **Reliable because** jsdom is synchronous and store singletons are reset in `afterEach`.
- **Never** assert class names, DOM nesting, `container.querySelector`, or a `data-*`
  implementation attribute standing in for something the user can see.

### Timer-driven state machines — Vitest + RTL + fake timers

The boot gate, debounces, streaming state — anything whose outcome depends on a clock.

- **Assert** both sides of every threshold: before and after the timer, plus the fallback
  that fires when the awaited signal never arrives.
- **This layer exists to keep timing out of E2E.** CI runs on two vCPUs with a software
  renderer, so a starved main thread makes wall-clock assertions unreliable there — and
  the answer is never to soften the assertion. The boot gate is the worked example: three
  timers and a ready signal, asserted in `world/components/boot.test.tsx` in ~200ms, while
  E2E keeps only "a first visit is gated, dismissing it yields a usable page, a reload
  does not gate again".
- **Never** approximate a timer with `waitFor` plus a real delay.

### Canvas-2D draw routines — Vitest + recording context

- **Assert** the transcript of calls and property sets, snapshotted — that is the drawing
  expressed as behaviour.
- **Reliable because** every draw routine is deterministic (zero `Math.random()` in
  `src/`; seed with `mulberry32`). Break that and the snapshots are worthless.
- **Never** assert pixels: jsdom's `getContext("2d")` returns `null`.

### R3F scene graph — Vitest + RTTR

- **Assert** what would vanish silently in a refactor: mesh and light counts, positions and
  sizes derived from the shared constants (`constants/room.ts`, `*-layout.ts`), materials
  from `config/brand.ts`, and the conditional branches — palette, focus, explore, reduced
  motion.
- **Reliable because** RTTR renders headlessly with no GPU, and `vitest.config.ts` pins a
  single copy of three (see below).
- **Never** trust statement coverage here. Mounting a declarative scene executes nearly
  every statement and almost no branch — measured **84.65% statements against 53.06%
  branches** from four tests. Branches are the work; statements are nearly free.

### Server surface — Vitest node, driven by a real `Request`

- **Assert** every response branch and the headers that go with it: invalid JSON → 400,
  schema failure → 400, rate limited → 429, refusal, no key → 503, success → 200, plus
  `x-agent-sources`, `cache-control: no-store` and the `x-forwarded-for` → `x-real-ip` →
  `anonymous` precedence.
- **Reliable because** a `Request` goes in and a `Response` comes out — no server, no port.
- **Never** reach past the boundary: mock with `vi.mock` at the module edge.

### Journeys and accessibility — Playwright, both motion modes

- **Assert** what only exists end-to-end: route status, `<h1>`, metadata, JSON-LD, real
  navigation, focus management, and every `AGENTS.md` non-negotiable. **Every route gets an
  E2E smoke assertion** — those are only observable here, so it is not duplicating a unit
  test. Beyond that, don't re-test unit coverage in a browser.
- **Reliable because** web-first assertions retry the _check_, `openWithShortcut` retries
  the _action_ until hydration lands, and both motion projects run the same specs.
- **Never** use `waitForTimeout`, and never soften an assertion to fit slow CI. If the
  scene is competing for the main thread, budget the wait explicitly and say why in a
  comment.

### Visual baselines — Playwright screenshots (not yet present)

- A **review signal, never a gate**: ~8–10 shots, Docker-pinned, paths-filtered. WebGL on
  a software renderer is variance-prone, and a suite people re-baseline on red has no
  signal left.

## Coverage: what good looks like

- Per-layer targets live in [`docs/testing-plan.md`](../../docs/testing-plan.md) §5.3.
  Chase those, not a single global number — 90% on pure math and 90% on a lighting rig
  mean different things.
- **Branches are the honest metric.** Statements can be bought by mounting things;
  branches have to be earned by exercising the conditions the product really has.
- **Exclude** what cannot be meaningfully asserted headlessly rather than writing a
  mount-only test to colour a line green.
- Coverage never decides whether a change is safe. The assertions do.

## Where tests live

Colocate `*.test.ts(x)` with the source, but at the **cluster root** — one file
per _concept_, not per source file. `hud.test.tsx` beside the `hud/` folder, not
one spec per `deck-*.tsx`. Cluster-level files survive the merges in
`docs/restructure-plan.md`; per-file specs do not.

E2E specs go in `tests/e2e/*.spec.ts`, with their shared fixtures and helpers in
`tests/e2e/fixtures.ts` (not collected as a spec — `testMatch` only takes `*.spec.ts`).
Vitest helpers and render utils go in **`tests/`** at the repo root — deliberately
_not_ under `src/`, so they stay out of the coverage denominator
(`include: ["src/**"]`) and out of the `src/**` lint block, whose test relaxations only
match `*.test.ts(x)`. `vitest.config.ts` already globs `tests/**`; add a `@tests/*`
path to `tsconfig.json` when the first vitest helper lands.

## E2E runs in both motion modes

`playwright.config.ts` defines two projects and **every spec runs in both**:

| Project          | `reducedMotion` | What it exercises                      |
| ---------------- | --------------- | -------------------------------------- |
| `reduced-motion` | `reduce`        | no canvas at all — the accessible path |
| `full-motion`    | `no-preference` | the 3D world, boot sequence, HUD       |

- **Import `test` from `./fixtures`, never from `@playwright/test`.** The fixture seeds
  the boot session key so `BootSequence`'s click-gated dialog does not intercept the
  spec — without it `getByRole("dialog")` matches the boot overlay, not the ⌘K menu.
  Opt out with `test.use({ skipBoot: false })` only to test boot itself.
- **Only tag a spec when it is genuinely mode-specific**, with
  `test.describe("…", { tag: "@full-motion" }, …)` or `@reduced-motion`; the projects
  `grepInvert` the other tag. Default to untagged so it runs in both — a bug that only
  appears with the canvas mounted is the reason this split exists.
- **`full-motion` carries its own `expect.timeout` (15s) and `timeout` (90s)** because a
  scene rendering on a software renderer competes with the assertion loop: the same
  assertion settles in 395ms without a canvas and 9.3s with one. Do not "fix" a slow
  full-motion assertion by adding a sleep, and do not raise the **global** timeout —
  reduced-motion specs must stay on the strict default.
- **Workers are capped at 2 locally (1 in CI), for two unrelated reasons.** Locally, five
  concurrent SwiftShader contexts starve each other badly enough to close browser
  sessions — if you see `Protocol error … session closed`, that is the cause. On CI the
  limit is the runner: 2 vCPU shared by Chromium _and_ the `pnpm start` server, so
  `--workers=2` starves the **server** and a route hangs in its `Loading` fallback past
  the expect budget. Do not raise CI to match local, and do not shard to work around it —
  `--shard=n/2` splits on the project boundary and buys nothing. See
  [`docs/decisions.md`](../../docs/decisions.md).
- **Axe scans `WCAG_TAGS` from the fixtures**, which includes `wcag22aa` to match the
  documented WCAG 2.2 AA bar. That tag is exactly one rule (`target-size`); the rest of
  2.2 AA is not automatable, so the bar is still partly a manual claim.
- **Write fixtures with the documented Playwright signature** — `async ({ … }, use)`.
  `eslint.config.mjs` turns the React-family rules off for `tests/**` and `scripts/**`,
  so `react-hooks/rules-of-hooks` no longer mistakes the `use` callback for React's
  `use()`. If you ever see that error here again, the config regressed; do not rename
  the parameter to dodge it.

## Non-negotiables

These hold across every layer above; the per-layer sections say what to assert, these say
how to write it.

- **Query by accessible role and name.** Never class names, never DOM structure,
  test IDs only as a last resort. This is what makes a test survive a refactor,
  and it enforces a11y for free.
- **Assert behaviour and contracts, never module structure.** No assertions about
  which file exports what.
- **Reset external stores in `afterEach`.** The stores are module singletons read
  via `useSyncExternalStore`; without a reset they leak across test files and
  cause order-dependent failures. `boot-store` exposes `resetBoot()`; reduced motion is
  reset with `persistOverride(null)`.
- **`vitest.setup.ts` stubs `matchMedia`** because jsdom has none and
  `reduced-motion-store` calls it directly — without it anything rendering
  `ReducedMotionProvider` throws. It reports _no_ preference, so to test the
  reduced-motion branch set the app's own override (`persistOverride(true)`), which takes
  precedence, rather than re-stubbing the media query.
- **Determinism.** No wall-clock, no real network, no unseeded `Math.random()` in
  the code under test — use fake timers and seed PRNGs with `mulberry32` from
  `@/utils/mulberry32`. Prefer `findBy*` / `waitFor` and Playwright web-first
  assertions over fixed timeouts.
- **No `any`** — `@typescript-eslint/no-explicit-any` is an error. `max-lines`,
  `max-lines-per-function` and non-null assertions are already relaxed for
  `*.test.ts(x)`.
- **A regression test with every bug fix**, written so it fails against the unfixed code.
  Never weaken or delete a test to make a change pass.
- **Fix flakes at the root.** Retrying an _action_ until a precondition holds is a
  web-first wait and is correct — `expect(async () => {…}).toPass()` around a
  keypress that needs React to have hydrated, for example. Leaning on
  `playwright.config.ts` `retries` so a spec eventually passes is masking. Retries
  exist for infrastructure flake; a test that needs them is a bug.
- **`⌘K` needs `openWithShortcut()`** from `tests/e2e/fixtures.ts` — never a bare
  `keyboard.press`. The listener is attached in a `useEffect`, so pressing right after
  `goto` races hydration and fails roughly 1 run in 12; mounting the canvas makes the
  window wider still.

## This codebase specifically

- **RTTR depends on there being exactly one copy of three in the module graph**, and
  two lines in `vitest.config.ts` are what guarantee it: `resolve.mainFields`
  (preferring `module`, because `@react-three/fiber` ships no `exports` field and
  vitest would otherwise resolve its CJS `main`) and `server.deps.inline` for the
  three `@react-three/*` packages. Remove either and **every** scene test fails with
  `Cannot assign to read only property 'position' of object '#<Mesh>'` — fiber sees a
  `Mesh` from the other three instance, so `applyProps` assigns where it should copy.
  The symptom names three.js, so it reads like a three bug; it is a resolution bug.
  See [`docs/decisions.md`](../../docs/decisions.md).
- **jsdom cannot rasterise canvas** — `getContext("2d")` returns `null`, which is why
  draw routines are tested through a recording `Proxy` rather than pixels. Every draw
  routine in `src/` is deterministic today (zero `Math.random()` calls), so those
  snapshots are trustworthy — keep it that way.
- **Every env var is optional and features degrade** — so the degraded paths are
  real behaviour and must be tested: no `OPENAI_API_KEY` → `/api/chat` returns
  `503`; no `UPSTASH_*` → in-memory rate limiting.
- **Reduced motion is a real code path**, not a preference. `world-stage.tsx` never
  mounts the canvas when it is set, so both branches need coverage — which is what the
  two Playwright projects above are for, plus `reduced-motion.spec.ts` (asserts the
  canvas is absent and the site still works) and `world-3d.spec.ts` (asserts it mounts
  and content stays in the DOM). In vitest, cover both branches explicitly.
- The **non-negotiables in [`AGENTS.md`](../../AGENTS.md)** (content stays in the
  DOM, reduced-motion navigability, WCAG 2.2 AA, the world never crops) are the
  specification for the E2E suite — each one should map to an assertion.
