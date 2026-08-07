# Agent notes

Coding standards live in [`.devin/rules/`](./.devin/rules); file placement in
[`.devin/rules/project-structure.md`](./.devin/rules/project-structure.md). A
restructure is planned but **not started** —
[`docs/restructure-plan.md`](./docs/restructure-plan.md) is authoritative for
anything structural, and `docs/architecture.md` is a descriptive reference that
lags it. This file only records operational facts that aren't obvious from the
code.

**The restructure is blocked on [`docs/testing-plan.md`](./docs/testing-plan.md).**
Coverage is 10.71%, so "pure move, no behaviour change" is currently unverifiable.
Build the test suite first; do not start moving files, and do not treat a green
`pnpm validate` as evidence that a refactor preserved behaviour.

## Verification

```bash
pnpm validate   # lint + typecheck + format:check + test + knip — run before every commit
pnpm build      # also runs `agent:index:check` via prebuild
pnpm e2e        # Playwright + axe; needs `pnpm e2e:install` once
pnpm size       # size-limit budget, checked against .next/static/chunks
```

`pnpm validate` is the gate. CI runs the same thing plus `build` and `e2e`, so a
green `validate` locally means CI failures should be rare. `pnpm size` is a
**review signal, not a hard gate** — use the 1.3 MB budget to notice regressions;
Core Web Vitals are the real bar.

## Gotchas

- **Every env var is optional.** Features degrade instead of failing: no
  `OPENAI_API_KEY` → `/api/chat` returns `503` with keyword-only matches; no
  `UPSTASH_*` → in-memory rate limiting; no Sentry DSN → Sentry is skipped
  entirely. So a missing `.env.local` does not break the build.
- **`src/constants/agent-index.json` is generated**, not authored. Its sources are
  `src/constants/career.ts`, `patterns.ts`, `routes.ts` and `config/site.ts` plus
  `features/world/constants/destinations-*.ts`. Edit a source, then run
  `pnpm agent:index`. `prebuild` runs `agent:index:check` and fails the build when
  the committed index is stale.
- **`src/constants/career.ts` looks dead but isn't.** It has zero runtime
  consumers — only `scripts/agent-index/virtual-chunks.ts` (build-time) and its
  own test import it. Don't delete it as unused; `knip` won't flag it either.
- **Read env through `@/config/env` only** — never `process.env` elsewhere.
- Commits must be Conventional Commits; the `commit-msg` hook enforces this and
  `release-please` derives the version and `CHANGELOG.md` from them.
- **Audio assets must be free for commercial use.** Only ship tracks/SFX with an
  explicit commercial-use license (Pixabay, Mixkit, Freesound per-clip) and record
  the license + attribution. Never commercial music.

## Non-negotiables for the 3D world

These gate every change to `features/world` and are enforced by the axe specs:

- **Content stays in the DOM.** Reveal-on-focus is a visual affordance, not a data
  change — server-rendered destination content stays crawlable and reachable by
  assistive tech. Never gate content behind a 3D-only interaction.
- **Reduced-motion is a real path.** `world-stage.tsx` does not mount the canvas
  when `reducedMotion` is true. The site must be fully navigable with no 3D.
- **Accessibility is a hard gate** (WCAG 2.2 AA). 3D objects can't be the only
  navigation: keyboard-reachable index, visible focus, labelled controls, no focus
  traps when panels reveal.
- **The route-driven spine stays.** `/` is explore, each route is a focused
  station; deep links and `metadata` keep working.
- **The world never crops.** Verify ultrawide, laptop, tablet and portrait phone:
  the focused object stays visible and unoccluded. Responsiveness moves the
  camera, not the objects — `utils/framing.ts` pulls back on narrow viewports.

## Repository constraints (private, GitHub Free)

Do not add workflows or re-add removed ones without checking these first — the
plan, not the config, is what makes them fail:

- No branch protection or rulesets, so `main` is unprotected and **no required
  status checks exist**. Anything depending on them (PR auto-merge, `CODEOWNERS`)
  does not work.
- No code scanning — CodeQL needs the paid Code Security add-on. OSSF Scorecard
  is public-repository-only.
- **2,000 Actions minutes/month** and a **500 MB artifact quota**. Upload
  artifacts only on failure, always with `retention-days`.

The full table with rationale is in the Quality gates section of
[`docs/architecture.md`](./docs/architecture.md).
