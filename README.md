# diogo-studio

[![CI](https://github.com/dgesteves/diogo-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/dgesteves/diogo-studio/actions/workflows/ci.yml)
[![CodeQL](https://github.com/dgesteves/diogo-studio/actions/workflows/codeql.yml/badge.svg)](https://github.com/dgesteves/diogo-studio/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/dgesteves/diogo-studio/badge)](https://securityscorecards.dev/viewer/?uri=github.com/dgesteves/diogo-studio)
[![Release Please](https://github.com/dgesteves/diogo-studio/actions/workflows/release-please.yml/badge.svg)](https://github.com/dgesteves/diogo-studio/actions/workflows/release-please.yml)
[![Dependabot auto-merge](https://github.com/dgesteves/diogo-studio/actions/workflows/dependabot-auto-merge.yml/badge.svg)](https://github.com/dgesteves/diogo-studio/actions/workflows/dependabot-auto-merge.yml)

The portfolio + digital studio of **Diogo Esteves** — Staff / Principal
Frontend & Platform Engineer.

This isn't a marketing site. It's a working specimen of the systems Diogo
ships: agentic, observable, design-system-driven, streaming-grade. Every
visual choice traces back to something concrete on the CV.

See [`temp-docs/diogo-studio-blueprint.md`](./temp-docs/diogo-studio-blueprint.md)
for the full RFC: mandate, audience, signature surfaces, anti-pattern reject
list, phased roadmap, and open decisions. See
[`docs/design-system.md`](./docs/design-system.md) for tokens, primitives,
providers, and a11y/perf contracts.

## Phases

| Phase                     | Status     | What lands                                                                                             |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| **1 — Foundation**        | ✅ Shipped | Tokens, providers, app shell, ⌘K skeleton, mobile drawer, typography hero. Full a11y + perf gates.     |
| **2 — Signature hero**    | ⏭ Next    | 3D Career Graph (Three + R3F + drei + postprocessing), heatmap shader, SVG fallback.                   |
| **3 — Content layer**     | ⏳         | Typed TS content blocks, telemetry-dashboard case studies, system diagrams via `@xyflow/react`.        |
| **4 — Agentic ⌘K**        | ⏳         | Vercel AI SDK, build-time embedding pipeline, cited streaming answers.                                 |
| **5 — Polish & receipts** | ⏳         | Inspector overlay (web-vitals + r3f-perf), contact form (Resend + react-email), JSON-LD, per-route OG. |

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict.
- **Styling**: Tailwind v4 (`@tailwindcss/postcss`), `tw-animate-css`, OKLCH design tokens.
- **UI primitives**: Radix UI (Dialog, Tooltip, Popover, Dropdown, Tabs, Accordion), `cmdk`, `vaul`, `sonner`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`. `components.json` is configured so `pnpm dlx shadcn@latest add <component>` integrates cleanly.
- **Motion**: `motion` (formerly framer-motion), `lenis` for inertia scroll, custom `useReducedMotionPreference` that unions OS `prefers-reduced-motion` + low-power signals (`navigator.connection.saveData`, slow-2g/2g) + persisted user override.
- **Theming**: `next-themes`, class strategy, no FOUC.
- **Forms (Phase 5)**: `react-hook-form` + `zod` (`@t3-oss/env-nextjs` already validates envs).
- **Linting/formatting**: ESLint 9 (flat config) + `eslint-config-next` + `eslint-config-prettier`, Prettier + `prettier-plugin-tailwindcss`.
- **Testing**: Vitest + React Testing Library + jsdom (unit); Playwright + `@axe-core/playwright` (e2e + WCAG 2.1 A/AA).
- **Git hooks**: Husky + lint-staged + commitlint (Conventional Commits).
- **CI**: GitHub Actions (lint, typecheck, test, build) + CodeQL.
- **Observability**: Sentry (`@sentry/nextjs`), Vercel Analytics + Speed Insights.
- **Package manager**: pnpm.

## Architecture overview

```
src/
  app/
    layout.tsx              Root layout — wraps everything in <AppProviders>
    page.tsx                Phase 1 home (typography hero + altitudes + trust strip)
    globals.css             OKLCH design tokens, console-grid utility, cmdk styling
    api/health/route.ts     Static health probe (used by e2e)
    {error,loading,not-found}.tsx
    {opengraph-image,icon,apple-icon}.tsx
    {robots,sitemap}.ts
  components/
    providers/              Theme, motion, lenis, reduced-motion, ⌘K, toaster
    ui/                     Button, Badge, Kbd, StatusDot, brand-icons (cva-based)
    site/                   Nav, footer, mobile-nav, command-menu, theme-toggle
  lib/
    utils.ts                `cn()` helper (clsx + tailwind-merge)
    site-config.ts          Single source of truth for identity, nav, patterns
    hooks/use-is-client.ts  Hydration-safe "I'm on the client" boolean
  env.ts                    `@t3-oss/env-nextjs` schema (Zod)
e2e/
  home.spec.ts              Hero + altitudes + /api/health
  command-menu.spec.ts      ⌘K keyboard shortcut + nav trigger + Escape dismiss
  mobile-nav.spec.ts        Drawer behavior + desktop nav hidden under md
  accessibility.spec.ts     Axe scan: home light + home dark + command-menu open
```

## Prerequisites

- Node.js **22+** (see [`.nvmrc`](./.nvmrc))
- [pnpm](https://pnpm.io/) **9+**

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in any secrets (Sentry, etc.)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables are validated at build/runtime by
[`src/env.ts`](./src/env.ts). See [`.env.example`](./.env.example) for the
full list (including optional developer toggles like `ANALYZE` and
`SKIP_ENV_VALIDATION`).

## Scripts

| Script               | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `pnpm dev`           | Start the dev server (Turbopack)                                   |
| `pnpm build`         | Production build                                                   |
| `pnpm start`         | Run the production build                                           |
| `pnpm lint`          | Run ESLint                                                         |
| `pnpm lint:fix`      | Run ESLint with `--fix`                                            |
| `pnpm typecheck`     | Run TypeScript without emitting                                    |
| `pnpm format`        | Format the repo with Prettier                                      |
| `pnpm format:check`  | Verify formatting in CI                                            |
| `pnpm test`          | Run unit tests once (Vitest)                                       |
| `pnpm test:watch`    | Run unit tests in watch mode                                       |
| `pnpm test:coverage` | Run tests with V8 coverage                                         |
| `pnpm e2e`           | Run Playwright e2e + axe a11y                                      |
| `pnpm e2e:ui`        | Run Playwright in UI mode                                          |
| `pnpm e2e:install`   | Install Playwright browsers and OS deps                            |
| `pnpm knip`          | Detect unused exports / dependencies                               |
| `pnpm size`          | Verify the bundle against `size-limit` budgets                     |
| `pnpm size:why`      | Explain bundle contents                                            |
| `pnpm validate`      | Lint + typecheck + format check + tests + knip (full quality gate) |
| `pnpm analyze`       | Production build with `@next/bundle-analyzer` enabled              |

## Code quality & conventions

- **Conventional Commits** enforced via commitlint on every commit message.
  Examples: `feat: add login page`, `fix(api): handle 404`, `chore(deps): bump react`.
- On every commit, `lint-staged` runs ESLint and Prettier on staged files.
- CI runs lint, typecheck, format check, tests, knip, and Playwright on every PR and push to `main`.
- **Anti-cliché reject list** (blueprint §2.3) is a hard PR-review criterion for any visual change. No floating particles, generic blobs, locomotive scroll-jacking, opacity-instead-of-contrast, etc.

## Accessibility contract

- WCAG 2.2 AA across all surfaces, AAA where cheap.
- All interactive surfaces keyboard reachable; `aria-current="page"` on the active nav link.
- `prefers-reduced-motion` + low-power signals are unioned by the provider and gated in every animated component, plus a global CSS safety net.
- axe runs in CI on home (light + dark) and on the command-menu-open state. Failures block the build.

## Performance contract (Phase 1)

- Home `/` is statically prerendered (Next 16 SSG).
- Lenis and `motion` are imported only inside `"use client"` modules so the Server-Component shell doesn't pull them.
- `size-limit` budget: **400 KB** static-chunks gzipped. Current Phase 1 build: ~350 KB.
- Per-route and per-phase budgets (3D chunk, agent payload) land in their respective phases.

## Testing

```bash
pnpm test            # unit + component (Vitest + RTL + jsdom)
pnpm test:watch      # watch mode
pnpm test:coverage   # V8 coverage in ./coverage
pnpm e2e             # Playwright e2e + axe a11y (auto-starts dev server)
pnpm e2e:ui          # interactive Playwright UI
```

## Security

- Baseline security headers in [`next.config.ts`](./next.config.ts).
- See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.
- Dependabot opens grouped PRs weekly for npm + GitHub Actions updates.
- CodeQL runs on every PR/push and weekly.

## Deploy

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for alternatives.

## License

Copyright (c) 2026 Diogo Esteves. **All Rights Reserved.**

This is **not** open source. The source is published for portfolio and
reference (read-only) viewing only. You may not use, copy, modify, distribute,
or create derivative works from any part of it without prior written
permission. See [`LICENSE`](./LICENSE) for the full terms.
