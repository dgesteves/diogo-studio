@AGENTS.md

## Claude Code

- `/gates` picks and runs the verification gates for a change and reads a failure.
  `/e2e` runs and triages Playwright. `/commit` picks a Conventional Commit type.
- Rules live in `.claude/rules/`, scoped by `paths:` so each loads only when you
  touch the files it covers.
- A refactor toward `docs/architecture.md` is in flight; `docs/refactor.md` owns the
  phases. That architecture is the target, so **the current tree is not a pattern to
  copy** — check the target before following an existing shape. Use plan mode before
  starting a phase.
