---
name: verify
description: Run the project's verification gates in order before a commit or PR. Use when finishing a change, preparing a PR, or deciding whether something is actually done.
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

# Verifying a change

Run these in order and stop at the first real failure. Fix the root cause, not the
symptom.

```bash
pnpm validate   # lint + typecheck + format:check + test + knip
pnpm build      # agent:index:check runs before, prerender:check after
pnpm e2e:ci     # Playwright + axe, production build and CI flags
pnpm size       # size-limit, checked against .next/static/chunks
```

## What each one is for, and whether it can block you

| Step       | Status        | Catches                                                    |
| ---------- | ------------- | ---------------------------------------------------------- |
| `validate` | **gate**      | lint, types, formatting, unit tests, unused code           |
| `build`    | **gate**      | stale agent index (pre), de-optimized static routes (post) |
| `e2e:ci`   | **gate**      | journeys, a11y, SEO, anything only observable in a browser |
| `size`     | review signal | bundle regressions against the 1.3 MB budget               |

`pnpm size` is deliberately **not** a gate — its CI step is `continue-on-error` so a
bundle regression cannot also sink the `e2e` job via `needs: build`. Use it to notice
regressions; Core Web Vitals are the real bar.

**`pnpm validate` does not run `e2e`.** A green validate says nothing about the
Playwright suite, which was silently red on `main` for weeks because nobody ran it. Use
the `/e2e` skill for running and triaging that suite.

## Assert on the expected output, not on silence

Three checks here fail quietly, so an exit code of 0 is not proof:

- **`pnpm lint` must report exactly 11 warnings and 0 errors.** All 11 are pre-existing
  deep imports into `features/studio/components/screens/canvas-texture`, removed by
  restructure Phase 4. ESLint prints nothing both when it lints cleanly and when its
  config contributes no rules — so assert the count, not the silence. Never add to it,
  and never clear one with an inline `eslint-disable`.
- **`postcss.config.ts` that stops loading emits unstyled CSS and still exits 0.** Check
  the built CSS for Tailwind's **87 `@property` rules**.
- **`commitlint.config.ts` that stops loading still lints under `config-conventional`'s
  defaults.** Check that a **>100-character header passes** — ours sets
  `header-max-length: [0]`.

## When a step fails

- **`agent:index:check`** — a source changed without regenerating. Run `pnpm agent:index`
  and commit the result. Sources are `src/constants/{career,patterns,routes}.ts` +
  `config/site.ts` and `features/world/constants/destinations.ts`.
- **`prerender:check`** — a route dropped out of static rendering, silently, because
  rendering is dynamic-by-default under `cacheComponents`. Find the stray `new Date()`,
  `headers()`, `cookies()` or env read and wrap it in `"use cache"` + `cacheLife()`.
  Never fix this by removing a route from the must-be-static list without a
  `docs/decisions.md` entry.
- **`typecheck` with `TS2307` on paths that no longer exist** — after renaming anything
  under `app/`, delete `.next/dev/types`. `tsconfig.json` includes that generated folder,
  so a stale `validator.ts` from an earlier `pnpm dev` fails the check. The errors are
  artifacts, not real.
- **`knip`** — before deleting anything it flags, check it is not build-time-only.
  `src/constants/career.ts` has zero runtime consumers and is still load-bearing.

## What nothing checks

- **US English.** No spell-check step exists and one was deliberately not added, so this
  holds by review only. See [`.devin/rules/language-and-copy.md`](../../rules/language-and-copy.md).
- **The terminal clock.** `useCenterScreenTexture` paints Lisbon time into a canvas
  texture, never the DOM, so no unit test or spec can see it. Check the rendered string
  by hand after a locale or format change.
- **Visual regressions.** No screenshot baselines exist yet, by choice.
