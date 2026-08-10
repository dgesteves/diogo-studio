---
trigger: glob
globs: tests/e2e/**, playwright.config.ts, **/*.spec.ts
---

# E2E — Playwright & axe

**Playwright** + `@axe-core/playwright`. Specs live in `tests/e2e/*.spec.ts` with shared
fixtures and helpers in `tests/e2e/fixtures.ts` (not collected as a spec — `testMatch`
only takes `*.spec.ts`). For running and triaging the suite, use the `/e2e` skill; this
rule is about writing specs. Unit-test standards are in
[`testing.md`](./testing.md).

## What this layer owns

- **Assert** what only exists end-to-end: route status, `<h1>`, metadata, JSON-LD, real
  navigation, focus management, and every 3D non-negotiable from
  [`three-r3f-world.md`](./three-r3f-world.md). **Every route gets an E2E smoke
  assertion** — those are only observable here, so it is not duplicating a unit test.
  Beyond that, don't re-test unit coverage in a browser.
- **Reliable because** web-first assertions retry the _check_, `openWithShortcut` retries
  the _action_ until hydration lands, and both motion projects run the same specs.
- **Never** use `waitForTimeout`, and never soften an assertion to fit slow CI. If the
  scene is competing for the main thread, budget the wait explicitly and say why in a
  comment.
- **Keep timing out of E2E.** Anything whose outcome depends on a clock belongs in a
  fake-timer unit test. The boot gate is the worked example: three timers and a ready
  signal asserted in `world/components/boot.dom.test.tsx` in ~200ms, while E2E keeps only
  "a first visit is gated, dismissing it yields a usable page, a reload does not gate
  again".

## Both motion modes, always

`playwright.config.ts` defines two projects and **every spec runs in both**:

| Project          | `reducedMotion` | What it exercises                      |
| ---------------- | --------------- | -------------------------------------- |
| `reduced-motion` | `reduce`        | no canvas at all — the accessible path |
| `full-motion`    | `no-preference` | the 3D world, boot sequence, HUD       |

Until 2026-08-08 the whole suite forced `reducedMotion: "reduce"`, so the 3D path was
never tested at all. Don't let that recur by tagging a new spec `@reduced-motion` for
convenience.

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

## Waiting correctly

- **`⌘K` needs `openWithShortcut()`** and the inspector needs `openInspector()`, both
  from `fixtures.ts` — never a bare `keyboard.press`. The listeners are attached in a
  `useEffect`, so pressing right after `goto` races hydration and fails roughly 1 run in
  12; mounting the canvas widens the window further.
- **Use `settleWorld(page, canvasMounts)` before asserting on hydrated DOM.**
  `canvasMounts` is a per-project option; without the wait a `full-motion` assertion just
  re-measures the reduced-motion markup.
- **Any spec reading canvas dimensions must retry the read.** `toBeAttached` resolves
  before r3f's ResizeObserver sizes the element, so the canvas reports the HTML default
  of 300x150 for a moment.
- **Fix flakes at the root.** Retrying an _action_ until a precondition holds
  (`expect(async () => {…}).toPass()`) is a web-first wait and is correct. Leaning on
  `retries` so a spec eventually passes is masking; retries exist for infrastructure
  flake, and a test that needs them is a bug.

## Workers, and why they are capped

**2 locally, 1 in CI, for two unrelated reasons.** Locally, five concurrent SwiftShader
contexts starve each other badly enough to close browser sessions — `Protocol error …
session closed` is that. On CI the limit is the runner: 2 vCPU shared by Chromium _and_
the `pnpm start` server, so `--workers=2` starves the **server** and a route hangs in its
`Loading` fallback past the expect budget. Do not raise CI to match local, and do not
shard around it — `--shard=n/2` splits on the project boundary and buys nothing. See
[`docs/decisions.md`](../../docs/decisions.md).

## Accessibility

- **Axe scans `WCAG_TAGS` from the fixtures**, which includes `wcag22aa` to match the
  documented WCAG 2.2 AA bar. That tag is exactly one rule (`target-size`); the rest of
  2.2 AA is not automatable, so the bar is still partly a manual claim.
- Accessibility is a hard gate, not a report. Keyboard-reachable index, visible focus,
  labeled controls, no focus traps when panels reveal.

## Conventions

- **Query by accessible role and name.** Never class names, never DOM structure; test IDs
  only as a last resort.
- **Write fixtures with the documented Playwright signature** — `async ({ … }, use)`.
  `eslint.config.ts` turns the React-family rules off for `tests/**` and `scripts/**`, so
  `react-hooks/rules-of-hooks` no longer mistakes the `use` callback for React's `use()`.
  If you ever see that error here again, the config regressed; do not rename the
  parameter to dodge it.
- **Visual baselines are not present, by choice.** When added they are a review signal,
  never a gate: ~8–10 shots, Docker-pinned, paths-filtered. WebGL on a software renderer
  is variance-prone, and a suite people re-baseline on red has no signal left.
