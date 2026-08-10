---
trigger: glob
globs: **/*.test.ts, **/*.test.tsx, tests/*.ts, vitest.config.ts, vitest.setup.ts
---

# Testing — Vitest

Stack: **Vitest** (two projects — see "Which environment a test runs in" below),
**Testing Library** (`react`, `dom`, `jest-dom`, `user-event`), and
**`@react-three/test-renderer`** (RTTR) for the 3D scene. There is no Jest and
**no MSW** — mock with `vi.mock` at the module boundary. Do not add a testing
library without checking `package.json` first.

Playwright standards live in [`e2e-playwright.md`](./e2e-playwright.md); running and
triaging that suite is the `/e2e` skill.

[`docs/testing-plan.md`](../../docs/testing-plan.md) is the authoritative plan and
tracks per-layer coverage targets.

## The objective

Every test here answers one question: **would a real visitor notice if this broke?** A
test that passes because it mirrors the implementation is worse than none — it costs
maintenance, blocks refactors, and buys no confidence. Passing is the floor, not the goal.

Six things make a test good in this repo. They apply to every kind below.

1. **Assert what the user sees or does**, through the coarsest stable seam available:
   HTTP → rendered DOM → feature barrel → module path. Drop to a module path only when
   the behavior has no coarser seam (pure math, data invariants).
2. **Prove it can fail.** Before you trust a new test, break the code it covers and watch
   it go red — flip a guard, delete a branch, change a constant — then restore. `boot.dom.test.tsx`
   was validated exactly this way (dropping two guards failed 3 of 7; forcing one flag
   failed 1 of 7). This is the standard, not a nicety.
3. **Cover every branch the product actually has**, not the happy path: reduced motion vs
   3D, day vs night palette, loading/empty/error/success, and the degraded env paths —
   every env var is optional, so those are real behavior.
4. **Be deterministic by construction** — fake timers, seeded PRNGs, no network, no wall
   clock, no dependence on animation timing.
5. **Name the behavior in the title**, not the implementation. "holds the visitor for the
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
  timers and a ready signal, asserted in `world/components/boot.dom.test.tsx` in ~200ms, while
  E2E keeps only "a first visit is gated, dismissing it yields a usable page, a reload
  does not gate again".
- **Never** approximate a timer with `waitFor` plus a real delay.

### Canvas-2D draw routines — Vitest + recording context

- **Assert** the transcript of calls and property sets, snapshotted — that is the drawing
  expressed as behavior.
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

### Journeys and accessibility — Playwright

Route status, metadata, JSON-LD, real navigation, focus management and the axe scans.
Owned by [`e2e-playwright.md`](./e2e-playwright.md). The rule that matters from this
side: **don't re-test unit coverage in a browser**, and keep anything clock-dependent
in the fake-timer layer above.

## Coverage: what good looks like

- Per-layer targets live in [`docs/testing-plan.md`](../../docs/testing-plan.md) §5.3.
  Chase those, not a single global number — 90% on pure math and 90% on a lighting rig
  mean different things.
- **Branches are the honest metric.** Statements can be bought by mounting things;
  branches have to be earned by exercising the conditions the product really has.
- **Exclude** what cannot be meaningfully asserted headlessly rather than writing a
  mount-only test to color a line green.
- Coverage never decides whether a change is safe. The assertions do.

## Where tests live

Colocate `*.test.ts(x)` with the source, but at the **cluster root** — one file
per _concept_, not per source file. `hud.test.tsx` beside the `hud/` folder, not
one spec per `deck-*.tsx`. Cluster-level files survive the merges in
`docs/restructure-plan.md`; per-file specs do not.

E2E specs go in `tests/e2e/*.spec.ts`, with their shared fixtures and helpers in
`tests/e2e/fixtures.ts` (not collected as a spec — `testMatch` only takes `*.spec.ts`).
Vitest helpers and render utils go in **`tests/`** at the repo root, imported through the
`@tests/*` alias — deliberately _not_ under `src/`, so they stay out of the coverage
denominator (`include: ["src/**"]`) and out of the `src/**` lint block, whose test
relaxations only match `*.test.ts(x)`.

**Write a helper when its second caller appears, not before.** `tests/stores.ts` exists
because it had callers and fixed a live leak; `env.ts`, `recording-ctx.ts` and `r3f.ts`
are named in the testing plan but deliberately unwritten, because `knip` fails on unused
files and an ignore entry for speculative code is worse than no helper.

## Which environment a test runs in

**Node is the default. jsdom is opt-in, and the marker is the filename:**
`*.dom.test.{ts,tsx}` runs under jsdom with `vitest.setup.ts`; everything else runs under
node with no setup at all.

- **Name the file for what the test touches, not what the module is about.** `gpu.test.ts`
  covers WebGL renderer detection and runs in **node**, because every assertion calls a
  pure string predicate. Only reach for `.dom.` when the test needs a document: RTL, RTTR,
  storage, `matchMedia`.
- **A missing `.dom.` fails loudly** (`document is not defined`) — that is the reason node
  is the default, so never "fix" it by widening a glob. Add the suffix.
- **Never key the split on a directory.** The restructure moves them; the filename travels
  with `git mv`.
- **`resetStores()` from `@tests/stores` runs automatically** in the jsdom project's
  `afterEach`, right after RTL's `cleanup()`. Do not re-reset stores in a spec's own
  `afterEach` — that is what produced 26 `act()` warnings, because resetting a store
  notifies live subscribers. `sequence.hooks: "stack"` guarantees a spec's own `afterEach`
  (an RTTR unmount, `vi.useRealTimers()`) runs **first**; keep teardown that is not a store
  concern there.
- It resets through each store's **public** API only. `perf-store`, `web-vitals-store` and
  the `hydrated` latches have no public reset yet — add one alongside the first test that
  needs it, driven by a failing test.
- The jsdom setup stubs `getContext` to `null` (jsdom cannot rasterise a canvas and says so
  55 times a run) and imports `silence-clock-deprecation`, which the app applies at
  `world-canvas.tsx` but RTTR bypasses. **A run should have zero stderr output** — treat new
  noise as a defect, not as background.

## Non-negotiables

These hold across every layer above; the per-layer sections say what to assert, these say
how to write it.

- **Query by accessible role and name.** Never class names, never DOM structure,
  test IDs only as a last resort. This is what makes a test survive a refactor,
  and it enforces a11y for free.
- **Assert behavior and contracts, never module structure.** No assertions about
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
- **Fix flakes at the root.** A flaky unit test means a hidden clock, a leaked store, or
  a real race — find it rather than retrying around it.

## This codebase specifically

- **RTTR depends on there being exactly one copy of three in the module graph**, and
  two entries in `vitest.config.ts` are what guarantee it — shared by **both** projects,
  so keep them that way: `resolve.mainFields`
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
  real behavior and must be tested: no `OPENAI_API_KEY` → `/api/chat` returns
  `503`; no `UPSTASH_*` → in-memory rate limiting.
- **Reduced motion is a real code path**, not a preference. `world-stage.tsx` never
  mounts the canvas when it is set, so cover both branches explicitly in vitest. The
  browser side is covered by the two Playwright projects in
  [`e2e-playwright.md`](./e2e-playwright.md).
- **`vi.stubEnv` does nothing here.** `createEnv` validates and freezes its values at
  import, so a spec needing a different environment mocks the module against
  `tests/env.ts`:
  `vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }))`.
  `DEFAULTS` is typed from `typeof env`, so adding a required var fails typecheck there
  until it is accounted for.
- **A spec covering a `"use cache"` route must mock `next/cache`.** `cacheLife()` throws
  outside a Next build ("only available with the `cacheComponents` config"), so
  `sitemap.ts` is driven with `cacheLife` stubbed and the profile asserted on the mock.
  The real guard that a route stays static is `prerender:check`, not the spec.
- The **3D non-negotiables in [`three-r3f-world.md`](./three-r3f-world.md)** (content
  stays in the DOM, reduced-motion navigability, WCAG 2.2 AA, the world never crops) are
  the specification for the E2E suite — each one should map to an assertion.
