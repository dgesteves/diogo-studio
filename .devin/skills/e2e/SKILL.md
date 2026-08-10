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

Standards for _writing_ specs are in `.devin/rules/e2e-playwright.md`.

## Pick the right runner

`pnpm e2e` is **not what CI runs**, and that gap has produced red builds that were green
locally: it uses `next dev`, 2 workers and no retries, while CI uses a production build, 1
worker and retries on 2 vCPU.

```bash
pnpm e2e                           # fast local loop; `pnpm e2e:install` once
pnpm e2e:ci                        # production build + CI flags, no Docker
pnpm e2e:runner                    # + Ubuntu, pinned browsers, 2 vCPU / 7 GB, no .env.local
pnpm e2e:runner -g "Boot sequence" # arguments pass through; CI_CPUS=1 squeezes harder
```

Reproduce with `e2e:ci` at minimum before calling a timing- or 3D-sensitive change done. Expect
the container to be several times slower than the host — that is the point of it.

## Triage order

Work down this list before touching an assertion.

1. **Read the quality tier.** The world downgrades itself `full → reduced → frozen`, one way
   only, and CI on SwiftShader starts at `frozen` (one painted frame). The tier is on the world
   root as `data-world-quality`. Don't "fix" a slow spec by capping quality or forcing a click.
2. **Did the spec wait for hydration?** `⌘K` and inspector listeners attach in a `useEffect`.
   Use `openWithShortcut` / `openInspector` from `fixtures.ts`, never a bare `keyboard.press`
   after `goto`. `openInspector` checks visibility first, because `` Ctrl+` `` toggles and a
   blind retry closes what it just opened.
3. **Did it wait for the canvas?** `toBeAttached` resolves before r3f sizes the element, so it
   reports 300×150 for a moment. Retry dimension reads, and use `settleWorld(page, canvasMounts)`
   before asserting on hydrated DOM.
4. **Which project failed?** `reduced-motion` never mounts a canvas, so a `full-motion`-only
   failure points at the scene or its timing rather than the assertion.

## Known-benign noise

`MaxListenersExceededWarning` from `[WebServer]` is pre-existing: a Node listener advisory from
Next's own server under Playwright's request pattern, measured before and after the ESM change.
Don't hunt it, and don't let it hide a real failure underneath.
