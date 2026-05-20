# diogo-studio

A production-grade [Next.js](https://nextjs.org) 16 app using the App Router,
React 19, TypeScript, and Tailwind CSS v4.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4
- **Language**: TypeScript (strict)
- **Linting**: ESLint 9 (flat config) + `eslint-config-next` + `eslint-config-prettier`
- **Formatting**: Prettier + `prettier-plugin-tailwindcss`
- **Testing**: Vitest + React Testing Library + jsdom
- **Git hooks**: Husky + lint-staged + commitlint (Conventional Commits)
- **CI**: GitHub Actions (lint, typecheck, test, build) + CodeQL
- **Dependencies**: Dependabot (npm + GitHub Actions)
- **Package manager**: pnpm

## Prerequisites

- Node.js **22+** (see [`.nvmrc`](./.nvmrc))
- [pnpm](https://pnpm.io/) **9+**

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
Edit `src/app/page.tsx` to start building.

## Scripts

| Script               | Description                             |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | Start the dev server (Turbopack)        |
| `pnpm build`         | Production build                        |
| `pnpm start`         | Run the production build                |
| `pnpm lint`          | Run ESLint                              |
| `pnpm lint:fix`      | Run ESLint with `--fix`                 |
| `pnpm typecheck`     | Run TypeScript without emitting         |
| `pnpm format`        | Format the repo with Prettier           |
| `pnpm format:check`  | Verify formatting in CI                 |
| `pnpm test`          | Run unit tests once                     |
| `pnpm test:watch`    | Run unit tests in watch mode            |
| `pnpm test:coverage` | Run tests with V8 coverage              |
| `pnpm validate`      | Lint + typecheck + format check + tests |

## Project structure

```
src/
  app/                Next.js App Router (routes, layouts, pages)
.github/
  workflows/          GitHub Actions: ci.yml, codeql.yml
  ISSUE_TEMPLATE/     Issue templates
  dependabot.yml      Automated dependency updates
  CODEOWNERS          Default reviewers
.husky/               Git hooks (pre-commit, commit-msg)
```

## Code quality & conventions

- **Conventional Commits** are enforced via commitlint on every commit message.
  Examples: `feat: add login page`, `fix(api): handle 404`, `chore(deps): bump react`.
- On every commit, `lint-staged` runs ESLint and Prettier on staged files.
- CI runs lint, typecheck, format check, and tests on every PR and push to `main`.

## Testing

Unit and component tests use [Vitest](https://vitest.dev/) and
[React Testing Library](https://testing-library.com/). Test files live next to
the code as `*.test.ts(x)` or under `tests/`. Run:

```bash
pnpm test            # one-off
pnpm test:watch      # watch mode
pnpm test:coverage   # generate coverage in ./coverage
```

## Security

- Baseline security headers are set in [`next.config.ts`](./next.config.ts).
- See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.
- Dependabot opens grouped PRs weekly for npm + GitHub Actions updates.
- CodeQL runs on every PR/push and weekly.

## Deploy

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for alternatives.
