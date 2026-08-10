---
name: e2e
description: Run and triage the Playwright + axe suite. Use when running E2E tests, reproducing a CI-only failure, or debugging a flaky, slow, or 3D/timing-sensitive spec.
argument-hint: "[-g <grep>]"
allowed-tools:
  - read
  - edit
  - grep
  - glob
  - exec
---

# Running and triaging the E2E suite

The suite is **210 runs across 14 spec files** (105 tests × two motion projects),
green under `pnpm e2e:ci` at **~7.5 min with `workers: 1`** on the host. Standards for
writing specs live in [`.devin/rules/e2e-playwright.md`](../../rules/e2e-playwright.md);
this skill is about running them and reading a failure.

## Pick the right runner

`pnpm e2e` is **not what CI runs**, and that difference has already produced two red
builds that were green locally. It uses `next dev`, 2 workers and no retries; CI uses a
production build, 1 worker and `retries: 2` on 2 vCPU.

```bash
pnpm e2e                           # fast local loop; needs `pnpm e2e:install` once
pnpm e2e:ci                        # production build + CI flags; no Docker
pnpm e2e:runner                    # + Ubuntu, pinned browsers, 2 vCPU / 7 GB, no .env.local
pnpm e2e:runner -g "Boot sequence" # arguments pass through; CI_CPUS=1 squeezes harder
```

Before claiming a timing- or 3D-sensitive change is done, reproduce with `e2e:ci` at
minimum. Expect the container to be **~5x slower than the host** — that is the point of
it, not a fault. `act` is deliberately not set up; `docs/architecture.md` explains what
it would and would not catch.

`pnpm validate` does **not** run `e2e`, so a green validate says nothing about this
suite. It was silently red on `main` for weeks because nobody ran it.

## Triage order for a failure

Work down this list before touching an assertion.

1. **Read the quality tier.** The world downgrades itself: `detectSoftwareRenderer()`
   probes before the canvas chunk mounts and `WorldQualityGuard` watches frame times
   after, walking `full → reduced → frozen` one way only. CI is SwiftShader, so it
   starts at `frozen` (`frameloop="demand"`, one painted frame). The current tier is on
   the world root as **`data-world-quality`** — read it first when a `full-motion` spec
   behaves oddly. Do not "fix" a slow E2E by capping or forcing a click; that cost three
   days once already.
2. **Check the spec waited for hydration.** `⌘K` and the inspector listeners are
   attached in a `useEffect`, and nothing in the DOM distinguishes server markup from
   hydrated markup. Use `openWithShortcut` / `openInspector` from `fixtures.ts`, never a
   bare `keyboard.press` after `goto`. A blind press into a page that cannot yet hear it
   is what made 2–3 `inspector-overlay` specs fail on the host in a different
   combination every run while passing under `e2e:ci` — the production build hydrates
   fast enough to hide it. `openInspector` guards on visibility first, because
   `` Ctrl+` `` toggles and a blind retry closes what it just opened.
3. **Check the spec waited for the canvas.** `toBeAttached` is satisfied before r3f's
   ResizeObserver sizes the element, so a canvas reports the HTML default of 300x150 for
   a moment — `next dev` was slow enough to hide it, `e2e:ci` is not. Any spec reading
   canvas dimensions must retry the read. More generally use
   **`settleWorld(page, canvasMounts)`** before asserting on hydrated DOM; `canvasMounts`
   is a per-project option in `playwright.config.ts`, and without the wait a
   `full-motion` assertion just re-measures the reduced-motion markup.
4. **Check which project failed.** `reduced-motion` never mounts a canvas; if only
   `full-motion` fails, the cause is the scene or its timing, not the assertion.

## Known-benign noise

**`MaxListenersExceededWarning` from `[WebServer]` is pre-existing and benign.** It is a
Node listener-count advisory from Next's own server under Playwright's request pattern,
~97 lines a run, and it is not reproducible with 180 plain concurrent requests. Measured
at **97 with `"type": "module"` and 98 without**, so it predates that change. Don't hunt
it as a regression — and don't let it hide a real failure underneath.

## Never do these

- **Never soften an assertion, add `waitForTimeout`, or lean on `retries`** to get green.
  Retries exist for infrastructure flake; a test that needs them is a bug. Retrying an
  _action_ until a precondition holds (`expect(async () => {…}).toPass()`) is a
  web-first wait and is correct.
- **Never raise the global Playwright timeout.** `full-motion` already carries its own
  `expect.timeout` (15s) and `timeout` (90s); reduced-motion specs must stay strict.
- **Never raise CI workers or shard to work around slowness.** `--shard=n/2` splits on
  the project boundary and buys nothing.

If CI minutes bite, the levers are the `@full-motion` / `@reduced-motion` tags and the
17-route axe sweep, in that order — not `workers`, and not the assertions.
