---
name: commit
description: Choose the right Conventional Commit type and split mixed changes. Use when committing, staging work, or preparing a PR description.
allowed-tools: Read Grep Glob Bash
---

# Committing

`release-please` derives the version and `CHANGELOG.md` from commit messages, so **the type is a
release decision, not a label**. The `commit-msg` hook only checks that the type is _valid_,
never that it is _right_: two commits once shipped features, fixes and a behavior change under
`docs:`, and those changes are missing from the changelog permanently.

## Choose the type from the diff, not the task name

Read `git status`, `git diff` and `git diff --staged` first, then pick by effect on a user of
the package.

| Type       | The diff…                                            |
| ---------- | ---------------------------------------------------- |
| `feat`     | adds capability a user can reach — **never** `chore` |
| `fix`      | corrects wrong behavior                              |
| `perf`     | changes performance characteristics only             |
| `refactor` | restructures with no behavior change                 |
| `docs`     | changes only prose, comments or Markdown             |
| `test`     | changes only tests or fixtures                       |
| `build`    | changes build config, dependencies or tooling        |
| `ci`       | changes workflows                                    |
| `chore`    | none of the above, no user-visible effect            |

**If the honest answer is "several of these", split the commit** — one logical change each. A
diff touching a feature, a fix and the docs is three commits. When torn between `docs` and
anything else, it is not `docs`. Breaking changes are `feat!:` or a `BREAKING CHANGE:` footer.

## Rules

- Match the subject style and trailer format already in `git log`; imperative mood, US English.
- **Never `--no-verify`**, and never weaken `commitlint.config.ts` to get a message through — a
  long header already passes (`header-max-length: [0]`).
- If a pre-commit hook modifies files and the commit fails, stage them and retry.
