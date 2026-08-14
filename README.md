# diogo-studio

The portfolio + digital studio of **Diogo Esteves** — Staff / Principal
Frontend & Platform Engineer.

Private repository. Copyright (c) 2026 Diogo Esteves. All rights reserved —
not licensed for use, copying, or distribution.

## Getting started

Requires **Node.js 24+** (see [`.nvmrc`](./.nvmrc)) and **pnpm 11+** (see
`packageManager` in [`package.json`](./package.json)).

```bash
pnpm install
cp .env.example .env.local   # every variable is optional; features degrade gracefully
pnpm dev
```

## Scripts

| Script                 | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Next.js dev server                                            |
| `pnpm build`           | Production build (runs `agent:index:check` first)             |
| `pnpm validate`        | lint + typecheck + `format:check` + unit tests + knip         |
| `pnpm test`            | Vitest unit tests (`test:watch`, `test:coverage`)             |
| `pnpm e2e`             | Playwright + axe, both motion modes (`e2e:ui`, `e2e:install`) |
| `pnpm e2e:ci`          | Production build + CI flags — what CI actually runs           |
| `pnpm e2e:runner`      | `e2e:ci` in a 2 vCPU Ubuntu container (needs Docker)          |
| `pnpm size`            | size-limit bundle budget (`size:why`)                         |
| `pnpm analyze`         | Build with the bundle analyzer                                |
| `pnpm agent:index`     | Rebuild the ⌘K agent retrieval index                          |
| `pnpm prerender:check` | Assert must-be-static routes are still prerendered            |

Run `pnpm validate` before pushing — CI runs the same gates plus `build` and
`e2e`. Note `validate` does **not** run Playwright, and plain `pnpm e2e` uses
`next dev` with 2 workers where CI uses a production build with 1 worker and
retries. For anything timing- or 3D-sensitive, reproduce the runner with
`pnpm e2e:ci` or `pnpm e2e:runner` before calling it done — see
[`AGENTS.md`](./AGENTS.md).

## Conventions

- Coding standards and file placement: [`.claude/rules/`](./.claude/rules).
  [`docs/architecture.md`](./docs/architecture.md) is authoritative for
  structural questions — it describes the architecture the code is being built
  toward, not the tree as it stands. A refactor is in flight;
  [`docs/refactor.md`](./docs/refactor.md) tracks the phases, and
  [`docs/decisions.md`](./docs/decisions.md) records the reasoning behind the
  non-obvious calls.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) —
  `release-please` derives the version and [`CHANGELOG.md`](./CHANGELOG.md) from
  them. The `commit-msg` hook enforces this locally via `commitlint`.
- Breaking changes: `feat!:` or a `BREAKING CHANGE:` footer.
- All human-readable text is **US English (en-US)** — prose, UI copy, error
  messages, accessible names, commit messages. See
  [`.claude/rules/language-and-copy.md`](./.claude/rules/language-and-copy.md).
- Tests colocate with source as `*.test.ts(x)`; E2E specs live in `tests/e2e/`.

## CI

`ci.yml` runs lint, typecheck, unit tests, knip, build + size-limit, and E2E.
`audit.yml` audits production dependencies on a daily schedule.
`release-please.yml` maintains the release PR.

`size-limit` is reported but does not fail the build — it's a review signal, and a
breach would otherwise take the E2E job down with it.

This repo is private on a GitHub Free plan, which means **no branch protection,
no code scanning, 2,000 Actions minutes/month, and a 500 MB artifact quota**.
Workflows are kept deliberately lean to stay inside those limits — see
[`docs/architecture.md`](./docs/architecture.md) before adding a new one.
