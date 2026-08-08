# Agent notes

Coding standards live in [`.devin/rules/`](./.devin/rules); file placement in
[`.devin/rules/project-structure.md`](./.devin/rules/project-structure.md).
[`docs/restructure-plan.md`](./docs/restructure-plan.md) is authoritative for
anything structural, `docs/architecture.md` describes the tree as it is today, and
[`docs/decisions.md`](./docs/decisions.md) records why the non-obvious calls were
made. This file only records operational facts that aren't obvious from the code.

**Restructure status: Phase 0 has landed. Phases 1–7 are blocked on
[`docs/testing-plan.md`](./docs/testing-plan.md).** Coverage is ~11% (`pnpm test:coverage`), so "pure
move, no behaviour change" is currently unverifiable. Build the test suite first; do
not start a phase, and do not treat a green `pnpm validate` as evidence that a
refactor preserved behaviour.

Two things have shipped outside that block, and they set the bar for anything else
that wants to: Phase 0 (a lint-cap relaxation — moves no code at all), and the
`station-index` / `(world)` split, which moved code but came with a **measured**
justification and a new invariant test guarding it. Anything less than that —
tidying, renaming, "obvious" moves — waits for the suite, and each exception needs an
entry in [`docs/decisions.md`](./docs/decisions.md).

## Verification

```bash
pnpm validate   # lint + typecheck + format:check + test + knip — run before every commit
pnpm build      # `agent:index:check` before, `prerender:check` after
pnpm e2e        # Playwright + axe; needs `pnpm e2e:install` once
pnpm size       # size-limit budget, checked against .next/static/chunks
```

`pnpm validate` is the gate, but it does **not** run `e2e` — so a green `validate`
says nothing about the Playwright suite. Run `pnpm e2e` before you claim a UI or
content change is done; the suite was silently red on `main` for weeks because
nobody did. It is currently 18/18. `pnpm size` is a
**review signal, not a gate** — its CI step is `continue-on-error`, deliberately, so
that a bundle regression cannot also sink the `e2e` job via `needs: build`. Use the
1.3 MB budget to notice regressions; Core Web Vitals are the real bar.

`pnpm lint` currently reports **11 warnings and 0 errors**. All 11 are pre-existing
deep imports into `features/studio/components/screens/canvas-texture`, which
restructure Phase 4 removes. Warnings are not noise to be silenced: never add to that
count, and never use an inline `eslint-disable` to clear one.

## Gotchas

- **Every env var is optional.** Features degrade instead of failing: no
  `OPENAI_API_KEY` → `/api/chat` returns `503` with keyword-only matches; no
  `UPSTASH_*` → in-memory rate limiting; no Sentry DSN → Sentry is skipped
  entirely. So a missing `.env.local` does not break the build.
- **`src/constants/agent-index.json` is generated**, not authored. Its sources are
  `src/constants/{career,patterns,routes}.ts` + `config/site.ts` (read by
  `scripts/agent-index/virtual-chunks.ts`) and
  `features/world/constants/destinations.ts` (read by `destination-chunks.ts`). Edit
  a source, then run `pnpm agent:index`. `prebuild` runs `agent:index:check` and
  fails the build when the committed index is stale.
- **`src/constants/career.ts` looks dead but isn't.** It has zero runtime
  consumers — only `scripts/agent-index/virtual-chunks.ts` (build-time) and its
  own test import it. Don't delete it as unused; `knip` won't flag it either.
- **"Inspector" means two different things.** The ⌘K surface is
  `features/command-menu`, and its agent is branded "the Inspector agent" in the UI.
  `features/inspector` is unrelated — it's the performance / Web-Vitals overlay. This
  collision has already produced one wrong doc; don't let it produce another.
- **`src/config/brand.ts` is not brand colours.** It's three.js material tokens
  (`roughness`, `metalness`, `color`) and it has 39 importers. Add a token there
  rather than inlining a hex or a material value in the scene.
- **Read env through `@/config/env` only** — never `process.env` elsewhere.
- **Rendering is dynamic-by-default** (`cacheComponents`). A stray `new Date()`,
  `headers()` or env read drops a route out of static rendering _silently_ — Next does
  not warn. Wrap it in `"use cache"` + `cacheLife()`. `prerender:check` runs on
  `postbuild` and fails the build if one of the 19 must-be-static routes de-optimises;
  that guard is the only thing standing between you and a silently dynamic site.
- **Routes are typed** (`typedRoutes`). `Link href` / `router.push` take a real route.
  Never widen to `string`, never cast — narrow untrusted hrefs (LLM output, citations)
  with `asInternalHref()` from `@/constants/routes`.
- **After renaming or moving anything under `app/`, delete `.next/dev/types`.**
  `tsconfig.json` includes that generated folder, so a stale `validator.ts` from an
  earlier `pnpm dev` fails `pnpm typecheck` with `TS2307` on paths that no longer
  exist. The errors are artifacts, not real.
- **Client islands import `features/world/constants/station-index.ts`, never
  `destinations.ts`.** The latter carries every page's prose via `blocks`; importing it
  from a `"use client"` module ships all of it to the browser for nothing. The index
  holds slug/href/label/sectors only. `station-index.test.ts` asserts the two agree.
- **Draw routines must stay deterministic.** `src/` contains zero `Math.random()`
  calls; seed with `mulberry32` from `@/utils/mulberry32` (one copy, shared — don't
  re-declare it locally). The Phase 5 draw snapshots are worthless otherwise.
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
