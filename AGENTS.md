# Agent notes

Coding standards live in [`.devin/rules/`](./.devin/rules); architecture and file
placement in [`docs/architecture.md`](./docs/architecture.md). This file only
records operational facts that aren't obvious from the code.

## Verification

```bash
pnpm validate   # lint + typecheck + format:check + test + knip — run before every commit
pnpm build      # also runs `agent:index:check` via prebuild
pnpm e2e        # Playwright + axe; needs `pnpm e2e:install` once
pnpm size       # size-limit budget, checked against .next/static/chunks
```

`pnpm validate` is the gate. CI runs the same thing plus `build` and `e2e`, so a
green `validate` locally means CI failures should be rare.

## Gotchas

- **Every env var is optional.** Features degrade instead of failing: no
  `OPENAI_API_KEY` → `/api/chat` returns `503` with keyword-only matches; no
  `UPSTASH_*` → in-memory rate limiting; no Sentry DSN → Sentry is skipped
  entirely. So a missing `.env.local` does not break the build.
- **`src/constants/agent-index.json` is generated**, not authored. Change the
  source content, then run `pnpm agent:index`. `prebuild` runs
  `agent:index:check` and fails the build when the committed index is stale.
- **Read env through `@/config/env` only** — never `process.env` elsewhere.
- Commits must be Conventional Commits; the `commit-msg` hook enforces this and
  `release-please` derives the version and `CHANGELOG.md` from them.

## Repository constraints (private, GitHub Free)

Do not add workflows or re-add removed ones without checking these first — the
plan, not the config, is what makes them fail:

- No branch protection or rulesets, so `main` is unprotected and **no required
  status checks exist**. Anything depending on them (PR auto-merge, `CODEOWNERS`)
  does not work.
- No code scanning — CodeQL needs the paid Code Security add-on. OSSF Scorecard
  is public-repository-only.
- **2,000 Actions minutes/month** and a **500 MB artifact quota**. Upload
  artifacts only on failure, always with `retention-days`.

The full table with rationale is in the Quality gates section of
[`docs/architecture.md`](./docs/architecture.md).
