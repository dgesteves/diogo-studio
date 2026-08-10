---
name: verify
description: Choose and run the right verification gates for a change, and read a failure. Use when finishing a change, preparing a PR, or deciding whether something is actually done.
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

# Verifying a change

Run in this order and stop at the first real failure.

| Gate        | Command         | Run it when                                                                                   |
| ----------- | --------------- | --------------------------------------------------------------------------------------------- |
| commit gate | `pnpm validate` | always                                                                                        |
| build       | `pnpm build`    | before any PR — `agent:index:check` runs before it, `prerender:check` after                   |
| browser     | `pnpm e2e:ci`   | routing, metadata, JSON-LD, 3D, focus, a11y or timing — anything only observable in a page    |
| bundle      | `pnpm size`     | review signal only; its CI step is `continue-on-error` so a regression can't sink the E2E job |

`pnpm validate` covers neither `build` nor `e2e`. Use `/e2e` to run and triage Playwright.

## Three checks that pass quietly

An exit code of 0 is not proof here:

- **`pnpm lint` must end at 0 errors and within its `--max-warnings` cap.** ESLint prints
  nothing both when it is clean and when its config contributed no rules, so read the count.
- **A `postcss.config.ts` that stops loading emits unstyled CSS and still exits 0.** Check the
  built CSS still contains Tailwind's `@property` rules.
- **A `commitlint.config.ts` that stops loading falls back to `config-conventional` defaults.**
  Check that a >100-character header still passes; ours sets `header-max-length: [0]`.

## Reading a failure

| Failure                                | Cause and fix                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent:index:check`                    | a source changed without regenerating: run `pnpm agent:index` and commit the result                                                                                      |
| `prerender:check`                      | a route lost static rendering — find the uncached dynamic read and wrap it in `use cache` + `cacheLife()`. Removing a route from `MUST_BE_STATIC` needs a decision entry |
| `TS2307` on paths that no longer exist | stale `.next/dev/types` after renaming under `app/` — delete that folder; the errors are artifacts                                                                       |
| `knip` flags a file                    | confirm it has no build-time-only consumer before deleting — `knip` cannot see a module that only a script imports                                                       |
| a `full-motion` E2E timeout            | not a gate failure yet — triage with `/e2e` before touching the assertion                                                                                                |

## What no gate covers

US English, the Lisbon clock painted into a canvas texture, and visual regressions (no
baselines, by choice). Those hold by reading the diff.

If this run disproved a claim in `AGENTS.md`, `.devin/` or `docs/`, correct it in the same
change.
