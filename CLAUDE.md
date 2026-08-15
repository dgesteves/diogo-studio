@AGENTS.md

## Claude Code

- `/gates` picks and runs the verification gates for a change and reads a failure.
  `/e2e` runs and triages Playwright. `/commit` picks a Conventional Commit type.
- Rules live in `.claude/rules/`, scoped by `paths:` so each loads only when you
  touch the files it covers.
- `docs/architecture.md` is normative and wins where the code disagrees — check it
  before following an existing shape. Use plan mode before substantial structural
  work.
