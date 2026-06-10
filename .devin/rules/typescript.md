---
trigger: glob
globs: **/*.ts, **/*.tsx, **/*.mts, **/*.cts
---

# TypeScript

- Run in **strict** mode; recommended extras: `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `forceConsistentCasingInFileNames`. Code must pass `tsc --noEmit`.
- **No `any`** and no `// @ts-ignore`/`// @ts-expect-error` to silence real
  errors. Use precise types, generics, or `unknown` + narrowing.
- Avoid `as` casts; never double-cast (`as unknown as T`). Type values, don't
  assert them.
- **Validate external data with Zod** (env vars, route params/searchParams, form
  input, API/JSON, third-party responses) and derive types via `z.infer` — don't
  hand-redeclare shapes that already exist as schemas.
- Prefer `type` for unions/objects; use `interface` only when you genuinely need
  declaration merging. Use `import type { … }` for type-only imports.
- Use **named exports**, except where a framework requires a default export
  (pages, layouts, `route.ts`, metadata image files, config files).
- Make illegal states unrepresentable: discriminated unions over loose boolean
  flags, `readonly` / `as const` for immutable config, and narrow return types.
- Use `satisfies` to validate config objects without widening their inferred
  type. Make `switch` statements over unions **exhaustive** (a `never`-typed
  default) so adding a variant fails the build until handled.
- Declare **explicit return types** on exported functions and public APIs. Type
  every component's `Props`; never leave them implicit `any`.
