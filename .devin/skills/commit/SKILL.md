---
name: commit
description: Write Conventional Commits with the accurate type and split mixed changes. Use when committing, staging work, or preparing a PR description.
allowed-tools:
  - read
  - grep
  - glob
  - exec
---

# Committing

`release-please` derives the version and `CHANGELOG.md` from commit messages, so the
**type is a release decision, not a label**. The `commit-msg` hook enforces Conventional
Commits, but it only checks that the type is _valid_ — never that it is _right_.

## The failure this exists to prevent

`b72c1e5` and `ce66ecc` both shipped features, fixes and a behavior change under
`docs:`. Every one of those changes is missing from the changelog, permanently. That is
what a wrong type costs, and the hook was green for both.

## Procedure

1. **Read the diff before choosing a type** — `git status`, `git diff`, and
   `git diff --staged`. Choose from what the diff _does_, not from what the task was
   called.
2. **Match `git log` style** for the subject line.
3. **Pick the type by effect on a user of the package:**

   | Type       | Use when the diff…                                   |
   | ---------- | ---------------------------------------------------- |
   | `feat`     | adds capability a user can reach — **never** `chore` |
   | `fix`      | corrects wrong behavior                              |
   | `perf`     | changes performance characteristics only             |
   | `refactor` | restructures with no behavior change                 |
   | `docs`     | changes only prose, comments, or Markdown            |
   | `test`     | changes only tests or fixtures                       |
   | `build`    | changes build config, dependencies, or tooling       |
   | `ci`       | changes workflows                                    |
   | `chore`    | none of the above and no user-visible effect         |

4. **If the honest answer is "several of these", split the commit.** One logical change
   each, never one squashed mega-commit. A diff that touches a feature, a fix and the
   docs is three commits.
5. **Check for secrets** before staging.
6. Commit with the repo's trailer format:

```bash
git commit -m "$(cat <<'EOF'
<type>: <subject>

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

If a pre-commit hook modifies files and the commit fails, stage the modified files and
retry.

## Rules

- **Never `--no-verify`**, and never weaken `commitlint.config.ts` to get a message
  through. If the header genuinely needs to be long, it already can be —
  `header-max-length` is `[0]` here.
- **Do not push unless asked**, and never force-push or rewrite history without explicit
  confirmation for that specific action.
- Subject line in **US English**, imperative mood.
- A behavior change buried in a `docs:` commit is the specific mistake this file exists
  to stop. When in doubt between `docs` and anything else, it is not `docs`.

See [`docs/decisions.md`](../../../docs/decisions.md) for the full write-up.
