---
trigger: glob
globs: **/*.test.ts, **/*.test.tsx, **/*.spec.ts, **/*.spec.tsx, e2e/**, tests/**, __tests__/**
---

# Testing

- **Unit / component**: Vitest or Jest + React Testing Library. Test behavior,
  not implementation — query by **role / label / text**, not test-ids or class
  selectors. Use `@testing-library/user-event` for interactions; prefer
  `findBy*` / `waitFor` over fixed timeouts. Keep tests deterministic (no real
  network or wall-clock — fake timers/fetch).
- **E2E**: Playwright for critical user journeys. Rely on auto-waiting,
  web-first assertions (`await expect(locator).toBeVisible()`) and select by
  accessible role/name rather than brittle selectors.
- **Accessibility**: run automated checks (e.g. `@axe-core/playwright`) on key
  screens and treat violations as failures. Cover keyboard-only paths.
- Add a **regression test with every bug fix**. Never weaken or delete a test
  just to make a change pass. Co-locate unit tests with source; keep e2e specs
  under `e2e/`.
