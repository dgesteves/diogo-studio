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

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `pnpm dev`             | Next.js dev server                                    |
| `pnpm build`           | Production build (runs `agent:index:check` first)     |
| `pnpm validate`        | lint + typecheck + `format:check` + unit tests + knip |
| `pnpm test`            | Vitest unit tests (`test:watch`, `test:coverage`)     |
| `pnpm e2e`             | Playwright + axe (`e2e:ui`, `e2e:install`)            |
| `pnpm size`            | size-limit bundle budget (`size:why`)                 |
| `pnpm analyze`         | Build with the bundle analyzer                        |
| `pnpm agent:index`     | Rebuild the ⌘K agent retrieval index                  |
| `pnpm prerender:check` | Assert must-be-static routes are still prerendered    |

Run `pnpm validate` before pushing — CI runs the same gates plus `build` and
`e2e`.

## Conventions

- Coding standards and file placement: [`.devin/rules/`](./.devin/rules).
  A restructure is planned — Phase 0 has landed, the rest is blocked on the test
  suite. [`docs/restructure-plan.md`](./docs/restructure-plan.md) is authoritative
  for structural questions, [`docs/architecture.md`](./docs/architecture.md)
  describes the tree as it is today, and
  [`docs/decisions.md`](./docs/decisions.md) records the reasoning behind the
  non-obvious calls.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) —
  `release-please` derives the version and [`CHANGELOG.md`](./CHANGELOG.md) from
  them. The `commit-msg` hook enforces this locally via `commitlint`.
- Breaking changes: `feat!:` or a `BREAKING CHANGE:` footer.
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
