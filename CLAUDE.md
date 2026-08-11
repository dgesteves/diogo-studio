@AGENTS.md

## Claude Code

- `/gates` picks and runs the verification gates for a change and reads a failure.
  `/e2e` runs and triages Playwright. `/commit` picks a Conventional Commit type.
- Rules live in `.claude/rules/`, scoped by `paths:` so each loads only when you
  touch the files it covers. `.devin/` is a frozen Devin fallback — do not edit it.
- Restructure Phases 1–7 are blocked on the test suite — `docs/restructure-plan.md`
  owns the gate. Use plan mode before starting one.
