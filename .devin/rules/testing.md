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

## Pick the layer by what the code actually is

| Code                             | Tool                                        |
| -------------------------------- | ------------------------------------------- |
| Pure logic, data, math, config   | Vitest, node env                            |
| DOM component                    | Vitest + RTL, jsdom                         |
| Component rendering three.js JSX | RTTR — assert the scene graph               |
| Canvas-2D draw routine           | Recording context + snapshot (see below)    |
| Route handler / `sitemap` / SEO  | Vitest node, drive it with a real `Request` |
| Routes, journeys, a11y, layout   | Playwright                                  |

**Every route gets an E2E smoke assertion.** Route status, `<h1>`, metadata and
JSON-LD are only observable end-to-end, so this is not "e2e-ing what a unit test
covers". Beyond that, don't duplicate unit coverage in Playwright.

## Where tests live

Colocate `*.test.ts(x)` with the source, but at the **cluster root** — one file
per _concept_, not per source file. `hud.test.tsx` beside the `hud/` folder, not
one spec per `deck-*.tsx`. Cluster-level files survive the merges in
`docs/restructure-plan.md`; per-file specs do not.

E2E specs go in `tests/e2e/*.spec.ts`. Shared helpers, fixtures and render utils go
in **`tests/`** at the repo root — deliberately _not_ under `src/`, so they stay out
of the coverage denominator (`include: ["src/**"]`) and out of the `src/**` lint
block, whose test relaxations only match `*.test.ts(x)`. `vitest.config.ts` already
globs `tests/**`; add a `@tests/*` path to `tsconfig.json` when the first helper
lands.

## Non-negotiables

- **Query by accessible role and name.** Never class names, never DOM structure,
  test IDs only as a last resort. This is what makes a test survive a refactor,
  and it enforces a11y for free.
- **Assert behaviour and contracts, never module structure.** No assertions about
  which file exports what. Prefer the coarsest stable seam: HTTP → rendered DOM →
  feature barrel → module path.
- **Reset external stores in `afterEach`.** The stores are module singletons read
  via `useSyncExternalStore`; without a reset they leak across test files and
  cause order-dependent failures.
- **Determinism.** No wall-clock, no real network, no unseeded `Math.random()` in
  the code under test — use fake timers and seed PRNGs with `mulberry32` from
  `@/utils/mulberry32`. Prefer `findBy*` / `waitFor` and Playwright web-first
  assertions over fixed timeouts.
- **No `any`** — `@typescript-eslint/no-explicit-any` is an error. `max-lines`,
  `max-lines-per-function` and non-null assertions are already relaxed for
  `*.test.ts(x)`.
- **A regression test with every bug fix.** Never weaken or delete a test to make
  a change pass.
- **Fix flakes at the root.** Retrying an _action_ until a precondition holds is a
  web-first wait and is correct — `expect(async () => {…}).toPass()` around a
  keypress that needs React to have hydrated, for example. Leaning on
  `playwright.config.ts` `retries` so a spec eventually passes is masking. Retries
  exist for infrastructure flake; a test that needs them is a bug.
- **`⌘K` needs `openWithShortcut()`** — currently spec-local in
  `tests/e2e/command-menu.spec.ts`; promote it to `tests/` when a second spec needs
  it. The listener is attached in a `useEffect`, so a bare `keyboard.press` right
  after `goto` races hydration and fails roughly 1 run in 12.
- A test that would still pass if the feature were deleted is not a test.

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
- **jsdom cannot rasterise canvas** — `getContext("2d")` returns `null`. Never
  assert pixels in Vitest. Test draw routines by passing a `Proxy` that records
  every call and property set, and snapshot that transcript. Every draw routine in
  `src/` is deterministic today (zero `Math.random()` calls), so those snapshots are
  trustworthy — keep it that way.
- **Every env var is optional and features degrade** — so the degraded paths are
  real behaviour and must be tested: no `OPENAI_API_KEY` → `/api/chat` returns
  `503`; no `UPSTASH_*` → in-memory rate limiting.
- **Reduced motion is a real code path**, not a preference. `world-stage.tsx`
  never mounts the canvas when it is set, so both branches need coverage.
- The **non-negotiables in [`AGENTS.md`](../../AGENTS.md)** (content stays in the
  DOM, reduced-motion navigability, WCAG 2.2 AA, the world never crops) are the
  specification for the E2E suite — each one should map to an assertion.
- Coverage is a **measurement, not a goal**. Exclude code that cannot be
  meaningfully asserted headlessly rather than writing a test that only mounts it.
