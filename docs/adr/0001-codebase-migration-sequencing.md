# 0001 — Codebase migration sequencing (bottom-up, leaf-first)

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** @dgesteves
- **Related:** [`docs/architecture.md`](../architecture.md)

## Context

`docs/architecture.md` defines the target structure (layered + feature-first) and
a migration map from today's tree. The target enforces a single, one-directional
dependency graph:

```
app/  →  features/  →  components/ ─┐
                    →  server/  ────┼→  lib/  →  config/ , types/
                    →  content/ ────┘
```

The current tree diverges from this: shared chrome and feature UI are mixed under
`components/site/`, server-only agent code lives in `lib/agent/`, config and SEO
helpers sit loose in `lib/`, and route pages under `app/` carry composition that
belongs in features. We need a migration order that minimises risk and rework.

## Decision

Migrate **bottom-up — the reverse of the dependency arrow (leaf-first)** — in
small, independently reviewable slices, running `pnpm validate` after each.

Ordering principle: a layer is only moved once everything it depends on already
lives in its final location. This guarantees each import path is rewritten **once**.

### Slice order

1. **Foundational leaves** — `config/`, `lib/seo/`, `lib/utils/`, `styles/`.
   Pure leaves, no downward deps, lowest blast radius; establishes the single
   source of truth and clean import surfaces for everything above.
2. **`server/` core** — `lib/agent/*` → `server/ai/` with `import "server-only"`.
3. **Feature slices** — extract vertical slices into `features/<feature>/` with a
   curated `index.ts` public surface (career-graph, studio, command-menu, contact,
   inspector), plus chrome → `components/layout/`.
4. **App routing layer** — introduce `app/(marketing)/` route group and thin the
   root pages so they only compose.

### Rules per slice

- One slice per PR; keep each PR independently reviewable.
- Run `pnpm validate` (lint + typecheck + format:check + test + knip) after each.
- Use the `@/…` alias; cross-feature imports go through `index.ts` only.
- Add `import "server-only"` to every module moved into `server/`.
- Optional layers (`server/db`, `server/auth`, `messages/`, global `stores/`) land
  only when that capability exists.

## Consequences

- **Positive:** minimal churn (paths rewritten once), small safe PRs, green
  `pnpm validate` throughout, and a clear "definition of done" per slice.
- **Negative:** the tree is temporarily mixed (old + new locations coexist) until
  later slices land.
- **Neutral:** follow-up ADRs will record the deeper structural choices the
  architecture doc flags — the `features/` slicing model, the `lib/` vs `server/`
  split, and content-as-Velite.

## Migration progress

Bottom-up. Check items off as each slice merges (green `pnpm validate`).

### 1 — Foundational leaves

- [x] `lib/site-config.ts` → `config/site.ts`
- [x] `lib/structured-data.ts` (+ test) → `lib/seo/`
- [x] `lib/utils.ts` → `lib/utils/` (`cn.ts`)
- [x] `app/globals.css`, `app/mdx.css` → `src/styles/` (imported by root layout)

### 2 — `server/` core

- [x] `lib/agent/{retrieve,system-prompt}.ts` (+ test) → `server/ai/` (+ `import "server-only"`)
- [x] `lib/agent/types.ts` → `src/types/agent.ts` (isomorphic contract — imported by the client, so kept out of `server/`)
- [x] Installed `server-only`; `vitest.config.ts` stubs `server-only`/`client-only` to a no-op so jsdom tests pass

### 3 — Feature slices

- [x] `components/career-graph/*` + `scene/` → `features/career-graph/` (curated `index.ts`)
- [x] `content/career-graph.ts` (+ test) → `content/data/career-graph.ts` (kept whole as the shared source of truth — its pattern taxonomy is consumed by `/work`, `/writing`, cards, headers, and the agent script, so it stays out of the feature)
- [x] `scene/perf-reporter.tsx` → `components/r3f/` (shared R3F util used by career-graph **and** studio canvases)
- [x] `components/studio/*` → `features/studio/` (curated `index.ts`; `Studio` is the only public export)
- [ ] `components/site/*` (command menu) → `features/command-menu/`
- [ ] `components/site/*` (contact) → `features/contact/` (+ `lib/contact-schema.ts` → `features/contact/schemas/`)
- [ ] `components/site/*` (inspector) → `features/inspector/`
- [ ] `components/site/*` (chrome: nav, footer, mobile-nav, theme-toggle) → `components/layout/`

### 4 — App routing layer

- [ ] Root route pages → `app/(marketing)/` route group, thinned to composition
- [ ] `app/page.test.tsx` → relocated beside extracted units (keep `app/` route-only)
