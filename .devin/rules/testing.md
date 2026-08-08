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
- **Workers are capped at 2 locally (1 in CI).** Five concurrent SwiftShader contexts
  starve each other badly enough to close browser sessions. If you see
  `Protocol error … session closed`, that is the cause.
- **Axe scans `WCAG_TAGS` from the fixtures**, which includes `wcag22aa` to match the
  documented WCAG 2.2 AA bar. That tag is exactly one rule (`target-size`); the rest of
  2.2 AA is not automatable, so the bar is still partly a manual claim.
- **Write fixtures with the documented Playwright signature** — `async ({ … }, use)`.
  `eslint.config.mjs` turns the React-family rules off for `tests/**` and `scripts/**`,
  so `react-hooks/rules-of-hooks` no longer mistakes the `use` callback for React's
  `use()`. If you ever see that error here again, the config regressed; do not rename
  the parameter to dodge it.

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
- **`⌘K` needs `openWithShortcut()`** from `tests/e2e/fixtures.ts` — never a bare
  `keyboard.press`. The listener is attached in a `useEffect`, so pressing right after
  `goto` races hydration and fails roughly 1 run in 12; mounting the canvas makes the
  window wider still.
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
- **Reduced motion is a real code path**, not a preference. `world-stage.tsx` never
  mounts the canvas when it is set, so both branches need coverage — which is what the
  two Playwright projects above are for, plus `reduced-motion.spec.ts` (asserts the
  canvas is absent and the site still works) and `world-3d.spec.ts` (asserts it mounts
  and content stays in the DOM). In vitest, cover both branches explicitly.
- The **non-negotiables in [`AGENTS.md`](../../AGENTS.md)** (content stays in the
  DOM, reduced-motion navigability, WCAG 2.2 AA, the world never crops) are the
  specification for the E2E suite — each one should map to an assertion.
- Coverage is a **measurement, not a goal**. Exclude code that cannot be
  meaningfully asserted headlessly rather than writing a test that only mounts it.
