# Contributing

Thanks for your interest in contributing! This document explains how to get
set up and the conventions we follow.

## Prerequisites

- **Node.js** 22+ (see [`.nvmrc`](./.nvmrc))
- **pnpm** 9+ (see `packageManager` in `package.json`)

## Getting started

```bash
git clone <repo-url>
cd diogo-studio
pnpm install
pnpm dev
```

## Workflow

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/short-description
   ```

2. Make your changes. The pre-commit hook will:
   - run ESLint on staged files
   - run Prettier on staged files
   - reject commit messages that don't follow [Conventional Commits](https://www.conventionalcommits.org/)

3. Before pushing, run the full validation suite locally:

   ```bash
   pnpm validate   # lint + typecheck + format:check + unit tests
   pnpm e2e        # optional, slower (runs Playwright)
   ```

4. Push and open a Pull Request. CI will run lint, typecheck, unit tests,
   build, and E2E.

## Commit message format

We use [Conventional Commits](https://www.conventionalcommits.org/) so that
[release-please](https://github.com/googleapis/release-please) can generate
the changelog and version bumps automatically.

Examples:

- `feat: add user profile page`
- `feat(api): support pagination on /posts`
- `fix(auth): handle expired tokens`
- `chore(deps): bump next to 16.3.0`
- `docs: update README scripts table`
- `refactor: extract WebVitals into its own component`
- `test: cover home page CTA links`
- `ci: cache Playwright browsers`

Breaking changes: include `BREAKING CHANGE:` in the footer **or** append a
`!` after the type — e.g. `feat!: drop Node 20 support`.

## Code style

- TypeScript strict mode. Prefer narrow types over `any`.
- Tailwind utilities should be sorted by `prettier-plugin-tailwindcss`
  (handled automatically).
- Co-locate tests next to the code as `*.test.ts(x)` (unit) or under
  `e2e/*.spec.ts` (Playwright).

## Reporting bugs / requesting features

Use the appropriate [issue template](./.github/ISSUE_TEMPLATE).

For security issues, see [`SECURITY.md`](./SECURITY.md) — please do not file
public issues for vulnerabilities.

## Code of Conduct

By participating in this project you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).
