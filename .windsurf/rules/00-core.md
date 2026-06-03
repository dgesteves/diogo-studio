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
6. **Single source of truth.** Centralize config, env, and shared constants;
   never hardcode duplicated values (names, URLs, routes).

## Code style & structure

- **Functional and declarative.** Prefer pure functions and composition; avoid
  classes. Iterate and modularize over copy-paste (DRY).
- **Naming**: `kebab-case` for directories and files
  (`components/auth-wizard/`); descriptive names with auxiliary verbs for
  booleans (`isLoading`, `hasError`, `canSubmit`).
- **Imports**: use the absolute `@/…` alias from `tsconfig.json`; never deep
  relative paths (`../../../`).
- **App Router only** — keep everything under `app/`; do not reintroduce the
  legacy `pages/` router.
- **No comments.** Write self-documenting code — express intent through clear
  names and small, focused functions, not prose. Don't add explanatory,
  decorative, or `TODO` comments. Keep only required machine directives
  (`"use client"`, `import "server-only"`) and license headers.

## Working agreement

- Keep changes focused and consistent with the existing patterns and folder
  structure. Don't reformat or rewrite unrelated code.
- Before declaring done: typecheck, lint, format, and run tests. Fix the root
  cause, not the symptom.
- Follow **Conventional Commits** (`feat:`, `fix(scope):`, `chore:`).
- Don't add a dependency for something the framework already solves. Justify new
  dependencies by need, maintenance, and bundle cost.
