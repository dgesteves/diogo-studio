---
trigger: glob
globs: tests/e2e/**, **/*.spec.ts, playwright.config.ts
---

# E2E — writing Playwright + axe specs

This rule is about **writing** specs. Running them and reading a failure is the `/e2e` skill;
unit standards are in `testing.md`.

## What this layer owns

Only what exists end-to-end: route status, `<h1>`, metadata, JSON-LD, real navigation, focus
management, the axe scans, and the non-negotiables in `three-r3f-world.md` — treat that list as
the specification each spec maps to. Every route gets a smoke assertion; beyond that, don't
re-test unit coverage in a browser, and keep anything clock-dependent in the fake-timer layer.

## Both motion modes, always

Two projects run every spec: `reduced-motion` (no canvas — the accessible path) and
`full-motion` (the 3D world, boot, HUD). Before the split the whole suite forced `reduce`, so
the path most visitors get had never been tested.

- **Import `test` from `./fixtures`, never `@playwright/test`.** The fixture seeds the boot
  session key so `BootSequence`'s click-gated dialog does not intercept the spec — without it
  `getByRole("dialog")` matches the boot overlay instead of the ⌘K menu. Opt out with
  `test.use({ skipBoot: false })` only to test boot itself.
- **Default to untagged so a spec runs in both.** Tag `@full-motion` / `@reduced-motion` only
  when the behavior is genuinely mode-specific — a bug that appears only with the canvas
  mounted is why the split exists.

## Waiting correctly

- **`⌘K` needs `openWithShortcut()` and the inspector needs `openInspector()`** from
  `fixtures.ts`, never a bare `keyboard.press`: the listeners attach in a `useEffect` and
  nothing in the DOM distinguishes server markup from hydrated markup.
- **Call `settleWorld(page, canvasMounts)` before asserting on hydrated DOM.** Without it a
  `full-motion` assertion just re-measures the reduced-motion markup.
- **Retry any read of canvas dimensions** — `toBeAttached` resolves before r3f's ResizeObserver
  sizes the element, so it reports the HTML default of 300×150 for a moment.

## Never

- **Never soften an assertion** to fit slow CI, and **never `waitForTimeout`**. Retrying an
  _action_ until a precondition holds (`expect(async () => {…}).toPass()`) is a web-first wait
  and is correct; leaning on `retries` is masking, because retries exist for infrastructure
  flake and a spec that needs them is a bug.
- **Never raise the global timeout.** `full-motion` already carries its own `expect.timeout` and
  `timeout` because a software-rendered scene competes with the assertion loop; reduced-motion
  specs stay on the strict default.
- **Never raise CI workers or shard around slowness.** Both caps exist for measured reasons
  recorded in `playwright.config.ts` and `docs/decisions.md`.

## Accessibility and queries

Axe scans `WCAG_TAGS` from the fixtures, including `wcag22aa`. Be honest about what that buys:
in axe-core 4.12 that tag is one rule (`target-size`) and there are no `wcag22a` rules at all,
so most of the 2.2 AA bar stays a manual claim — keyboard passes, visible focus, labeled
controls, no focus trap when a panel reveals.

Query by accessible role and name, never class names or DOM structure. Write fixtures with the
documented signature `async ({ … }, use)`; the React-family lint rules are off for `tests/**`,
so `rules-of-hooks` no longer misreads Playwright's `use` callback — if that error reappears the
config regressed, so don't rename the parameter to dodge it.

**Visual baselines are absent by choice.** When added they are a review signal, never a gate:
WebGL on a software renderer is variance-prone, and a suite people re-baseline on red has no
signal left.
