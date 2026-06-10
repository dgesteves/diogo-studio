---
trigger: glob
globs: **/*.test.ts, **/*.test.tsx, **/*.spec.ts, **/*.spec.tsx, e2e/**, tests/**, __tests__/**
---

# Testing

- **Test the right layer.** Pure logic (utils, schemas, services) gets fast
  unit tests; components get behavior-focused component tests; only critical
  user journeys get e2e. Don't e2e what a unit test covers.
- **Unit / component**: Vitest or Jest + React Testing Library. Test behavior,
  not implementation — query by **role / label / text**, not test-ids or class
  selectors. Use `@testing-library/user-event` for interactions; prefer
  `findBy*` / `waitFor` over fixed timeouts. Keep tests deterministic (no real
  network or wall-clock — mock at the network boundary, e.g. MSW, and use fake
  timers).
- **E2E**: Playwright for critical user journeys. Rely on auto-waiting,
  web-first assertions (`await expect(locator).toBeVisible()`) and select by
  accessible role/name rather than brittle selectors.
- **Accessibility**: run automated checks (e.g. `@axe-core/playwright`) on key
  screens and treat violations as failures. Cover keyboard-only paths.
- Add a **regression test with every bug fix**. Never weaken or delete a test
  just to make a change pass. Co-locate unit tests with source; keep e2e specs
  under `e2e/`.
- Tests are a **CI gate**: typecheck, lint, unit, and e2e must pass before
  merge. Quarantine flaky tests immediately and fix the flake at its root —
  never `retry` your way around nondeterminism.
