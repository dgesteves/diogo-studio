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
- **`next.config.ts` enables `reactCompiler`, `typedRoutes` and `cacheComponents`.**
  - Automatic memoization is in effect: don't add `useMemo`/`useCallback`/`React.memo`
    (three.js object creation is the sanctioned exception).
  - Routes are **typed**: `Link href` and `router.push` take a real route, not a
    `string`. Never widen back to `string` and never cast — narrow an untrusted href
    with `asInternalHref()` from `@/constants/routes`.
  - Rendering is **dynamic-by-default**: any uncached dynamic API (`new Date()`,
    `headers()`, `cookies()`, an env read) silently drops a route out of static
    rendering. Wrap the work in `"use cache"` + `cacheLife()`. `pnpm prerender:check`
    runs on `postbuild` and fails if a route that must be static no longer is —
    it is the guard that makes this model safe, so never "fix" it by deleting a
    route from its list without a [`docs/decisions.md`](../../docs/decisions.md) entry.

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
  focused (~50 lines is a good target; `max-lines-per-function` is lint-enforced at
  100). A file should do one job — but **length is not the signal**: split when a
  file mixes concerns, never to hit a line count. Shaders, procedural geometry,
  draw routines, and static data are legitimately long; leave them whole rather
  than fragmenting them into modules that only exist to import each other.
  `max-lines` is a loose backstop only (250, 120 for `.tsx`, off for
  draw/layout/geometry/texture/data modules). See the project-structure rule for
  the seams worth splitting along.
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
- **New releases must age before they can be installed.** The policy is **24
  hours**, enforced by `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` (which
  also turns on `minimumReleaseAgeStrict`, so resolution fails rather than silently
  falling back) and mirrored by the Dependabot `cooldown`. Never raise, bypass, or
  exclude a package from that policy to get a build green — escalate instead.
