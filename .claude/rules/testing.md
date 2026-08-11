---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/*.ts"
  - "vitest.config.ts"
  - "vitest.setup.ts"
---

# Testing — Vitest

**Vitest** (two projects), **Testing Library** and **`@react-three/test-renderer`** (RTTR) for
the scene. No Jest, no MSW — mock with `vi.mock` at the module boundary, and check
`package.json` before reaching for a library. Playwright standards are in
`e2e-playwright.md`; per-layer coverage targets and the phase plan are in
`docs/testing-plan.md`.

## What makes a test worth keeping

Every test answers one question: **would a real visitor notice if this broke?** A test that
passes because it mirrors the implementation is worse than none — it costs maintenance, blocks
refactors and buys no confidence.

- **Assert what the user sees or does**, through the coarsest stable seam available: HTTP →
  rendered DOM → feature barrel → module path. Drop to a module path only when the behavior has
  no coarser seam, such as pure math or a data invariant.
- **Prove it can fail.** Break the code it covers — flip a guard, delete a branch, change a
  constant — watch it go red, then restore.
- **Query by accessible role and name.** Never class names, DOM structure or
  `container.querySelector`; test IDs as a last resort. This is what makes a test survive a
  refactor, and it enforces a11y for free.
- **A regression test with every bug fix**, written so it fails against the unfixed code. Never
  weaken or delete a test to make a change pass.
- **Deterministic by construction** — fake timers, seeded PRNGs, no network, no wall clock, no
  dependence on animation timing. A flaky unit test means a hidden clock, a leaked store or a
  real race.
- **Cover the branches the product has**, not the happy path: reduced motion vs. 3D, day vs.
  night palette, loading/empty/error/success, and the degraded env paths.

**Branches are the honest metric.** Statements can be bought by mounting things — measured on
this codebase, four RTTR tests produced 84.65% statements against 53.06% branches. Exclude what
cannot be meaningfully asserted headlessly rather than writing a mount-only test to color a line
green. Coverage never decides whether a change is safe; the assertions do.

## Choosing the layer

Pick by what the code _is_, and don't duplicate what a cheaper layer already proves. Pure logic
and cross-module invariants run in node. DOM behavior and timer-driven state machines run in
jsdom with RTL and fake timers — **timing belongs here, not in E2E**; the boot gate is three
timers and a ready signal asserted in `world/components/boot.dom.test.tsx` in ~200 ms. The
scene graph runs under RTTR. The server surface is driven with a real `Request` and asserted per
response branch, including its headers.

## Environment: node is the default, jsdom is opt-in by filename

`*.dom.test.{ts,tsx}` runs under jsdom with `vitest.setup.ts`; everything else runs under node
with no setup.

- **Name the file for what the test touches**, not what the module is about — `gpu.test.ts` runs
  in node because every assertion calls a pure string predicate. Reach for `.dom.` only when you
  need a document: RTL, RTTR, storage, `matchMedia`.
- A missing `.dom.` fails loudly with `document is not defined`. That is the point — add the
  suffix, never widen a glob, and never key the split on a directory.
- **`resetStores()` runs automatically** in the jsdom project's `afterEach`, right after RTL's
  `cleanup()`. Do not re-reset stores in a spec: resetting notifies live subscribers, which is
  what produced 26 `act()` warnings. A spec's own `afterEach` runs first, so keep non-store
  teardown there.
- A run should have **zero stderr output**; treat new noise as a defect.

## Traps specific to this repo

- **Every scene test failing with `Cannot assign to read only property 'position'` is module
  duplication of three, not a three.js bug.** The pins that prevent it are commented in
  `vitest.config.ts`; don't remove them.
- **jsdom cannot rasterize canvas** (`getContext("2d")` is `null`), so draw routines are tested
  through a recording `Proxy`. Those snapshots are only trustworthy while `src/` stays free of
  `Math.random()`.
- **`vi.stubEnv` does nothing here** — `createEnv` validates and freezes at import. A spec
  needing a different environment mocks the module:
  `vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }))`.
  `tests/env.ts` types its defaults from `typeof env`, so a new required variable fails
  typecheck there until it is accounted for.
- **A spec covering a `use cache` route must mock `next/cache`** — `cacheLife()` throws outside a
  Next build. The real guard that a route stays static is `prerender:check`.
- **Reduced motion and the degraded env paths are real branches.** Set the app's own override
  (`persistOverride(true)`) rather than re-stubbing `matchMedia`. The two specs that own those
  platform seams — `stores/reduced-motion-store.dom.test.ts` and
  `providers/providers.dom.test.tsx` — go through `@tests/media`, which `vitest.setup.ts` also
  uses for its no-preference default so the stubs cannot drift. It includes the legacy
  `addListener` pair, without which next-themes throws on mount.
- **jsdom's `Storage` is a proxy, so `vi.spyOn(window.localStorage, "getItem")` silently does
  nothing** — the property definition is stored as a _key_. Spy on `Storage.prototype`, or a
  storage-failure test passes against code with no error handling at all.
- **Interactions that write to an external store go through `@tests/interactions`.** user-event
  does not wrap a state update made synchronously inside the interaction — a `window` keydown
  listener, a store write in a click handler, anything under fake timers — and the result is an
  `act(...)` warning, which counts as a failure by the rule above.
- **`user-event`, never Testing Library's `fireEvent`** — one synthetic event is not the
  sequence a real interaction produces, so a `fireEvent.click` passes against a control nobody
  can operate. `no-restricted-imports` warns on the import, and `--max-warnings` is at the
  current count, so it fails the build; an event a user cannot perform (`error` on an image, a
  media or animation event) is the real exception, taken with a one-line reason.
  **`renderer.fireEvent` from RTTR is a different API and is not covered by that rule:** R3F
  raycasts its events from the `<canvas>` and no mesh has a DOM node, so user-event cannot
  reach the scene. It proves the handler and the state; whether a pointer at given coordinates
  hits an object is a Playwright question.
- **A hook whose value depends on a library's context must be asserted through that library's
  own consumer.** `MotionProvider` is checked with `useReducedMotionConfig`, because Motion's
  `useReducedMotion` reads the media query directly and ignores `MotionConfig` entirely.

**Write a helper when its second caller appears, not before** — `knip` fails on unused files.
Helpers live in `tests/`, imported through `@tests/*`.
