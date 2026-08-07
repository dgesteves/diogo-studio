---
trigger: always_on
---

# Modern Next.js — core engineering rules

These rules target a production-grade **Next.js (App Router) + React 19 +
TypeScript** codebase. Optimize for correctness, performance, accessibility, and
security by default. Prefer the smallest, clearest solution that ships.

## Stack assumptions

- Next.js **App Router** (`app/`), React **19** (Server Components, Server Actions).
- **TypeScript strict**. Tailwind CSS for styling. ESLint + Prettier enforced.
- Validate runtime/external data with a schema library (e.g. **Zod**).
- Detect the repo's package manager from the lockfile (pnpm / npm / yarn / bun)
  and use it consistently — never mix package managers.
- Embrace modern defaults where available: **Turbopack**, **React Compiler**
  (automatic memoization), **typed routes**, and explicit caching via the
  **`use cache`** directive.

## Non-negotiables

1. **Server Components by default.** Add `"use client"` only when you need state,
   effects, refs, browser APIs, or event handlers — and push it to the leaves.
2. **Type safety end-to-end.** No `any`, no unchecked casts; model data with
   types and validate at every boundary.
3. **A11y is a requirement, not a polish step** (WCAG 2.2 AA): semantic HTML,
   keyboard support, visible focus, labelled controls.
4. **Performance is a feature.** Watch the client bundle and Core Web Vitals
   (LCP, CLS, INP); avoid request waterfalls and unnecessary client JS.
5. **Security by default.** Never leak secrets to the client, authorize every
   mutation, and validate every input.
6. **Single source of truth, no magic values.** Centralize config, env, and
   shared constants; name magic numbers and meaningful strings instead of
   inlining them; never hardcode duplicated literals (names, URLs, routes). The
   project-structure rule defines where each kind of constant lives.

## Code style & structure

- **Functional and declarative.** Prefer pure functions and composition; avoid
  classes. Iterate and modularize over copy-paste (DRY).
- **Single-purpose modules, short functions.** Keep **functions** short and
  focused (~50 lines is a good ceiling). A file should do one job — but **length
  is not the signal**: split when a file mixes concerns, never to hit a line
  count. Shaders, procedural geometry, draw routines, and static data are
  legitimately long; leave them whole rather than fragmenting them into modules
  that only exist to import each other. See the project-structure rule for the
  seams worth splitting along.
- **Caveat: lint currently contradicts the rule above.** `eslint.config.mjs`
  enforces `max-lines: 100` on all of `src/**` and does **not** enforce
  `max-lines-per-function`. That per-file cap is the documented cause of the
  file-shredding in [`docs/restructure-plan.md`](../../docs/restructure-plan.md),
  whose Phase 0 replaces it. Until that lands: respect the cap, and when a
  genuinely cohesive module cannot fit, raise it as the Phase 0 change — do not
  shred the file, and do not add an inline `eslint-disable`.
- **Naming**: `kebab-case` for directories and files
  (`components/auth-wizard/`); descriptive names with auxiliary verbs for
  booleans (`isLoading`, `hasError`, `canSubmit`).
- **Imports**: use the absolute `@/…` alias from `tsconfig.json`; never deep
  relative paths (`../../../`).
- **App Router only** — use `app/` as the routing layer; never reintroduce the
  legacy `pages/` router. Keep route files thin; non-routing code lives outside
  `app/` (see the project-structure rule).
- **No comments — code is self-explanatory.** Express intent through clear
  names and small, focused functions, not prose. Don't add `what`-restating,
  decorative, commented-out, or `TODO` comments. Rare exception: a short
  comment for genuinely complex or non-obvious logic (a tricky algorithm,
  workaround, or gotcha) that names alone can't convey. Always keep required
  machine directives (`"use client"`, `import "server-only"`) and license
  headers.

## Working agreement

- Keep changes focused and consistent with the existing patterns and folder
  structure. Don't reformat or rewrite unrelated code.
- Before declaring done: typecheck, lint, format, and run tests. Fix the root
  cause, not the symptom.
- Follow **Conventional Commits** with the **accurate type** so the changelog
  stays complete: features are `feat:` (never `chore:`); also `fix:`, `perf:`,
  `refactor:`, `docs:`, `test:`, `build:`, `ci:`, `chore:`. Keep commits granular
  — one logical change each, not one squashed mega-commit.
- Don't add a dependency for something the framework already solves. Justify new
  dependencies by need, maintenance, and bundle cost.
