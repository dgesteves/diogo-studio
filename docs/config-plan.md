# Configuration plan

The migration from the environment/configuration architecture as it is to one with a single
enforced path in. [`architecture.md`](./architecture.md) §3 and §11 are the target; this file is
the route. **Delete this file when the last PR lands**, and record the outcome as dated entries in
[`decisions.md`](./decisions.md) — the same way `refactor.md`, `testing-plan.md` and
`restructure-plan.md` were retired.

Status: **Planning complete. Nothing implemented.** No source file, test, workflow, dependency,
generated file, secret or external service has been changed. Three read-only audits and one
adversarial implementation-readiness review produced this; §2 carries their evidence.

Sibling plan: [`pipeline-plan.md`](./pipeline-plan.md). The two intersect at exactly one point —
its Phase 1 removes the Sentry variables from CI, which is the prerequisite for Track B item 6
here. Neither blocks the other otherwise.

---

## 1. Executive summary

**The problem.** `src/env.ts` is a genuine source of truth for application configuration —
Zod-validated, frozen at import, client/server separated, and backed by a lint rule. But the rule
has provable bypasses, nothing at all covers the shell/YAML/config surface, one production-critical
variable was missing from Vercel for three months with nothing to signal it, and the repository's
own normative document asserts an invariant that is false.

**The final architecture.** Six categories, each with one owner and one enforcement mechanism:

| Category                          | Owner                                        | Enforced by                         |
| --------------------------------- | -------------------------------------------- | ----------------------------------- |
| Application runtime and secrets   | `src/env.ts` `server` block                  | Zod at import + ESLint              |
| Client-visible configuration      | `src/env.ts` `client` block, `NEXT_PUBLIC_`  | t3-env client/server split          |
| Tooling · CI · scripts · platform | `TOOLING_ENV` in `scripts/check-env.ts`      | `pnpm env:check`                    |
| Application invariants            | Typed constants at the narrowest scope       | Existing tuning rule — unchanged    |
| Facts and identity                | `src/content/**`                             | Existing content SSOT — unchanged   |
| Production floor                  | Standalone assertion, **not** the Zod schema | Runs at build and runtime on Vercel |

**What changed from the earlier proposal.** Five corrections, each forced by repository evidence
rather than preference:

1. The rate limiter's degraded path must be decided **before** any billable OpenAI call. The
   earlier "fail closed to the existing 503" was fail-open on cost.
2. The limiter contract widens from `boolean` to `allow | deny | unavailable`.
3. Partial Upstash configuration must not throw at module scope.
4. The model-coupling fix needs a real index invariant, enforced by the **non-strict** index check.
5. The production floor changes a live normative principle, so it must amend `AGENTS.md` and record
   a decision.

Two proposals were replaced by strictly better ones found under testing: a single ESLint selector
instead of five, and no change to `src/env.ts` for the env checker.

**Findings overturned along the way.** The claim that `x-forwarded-for` is spoofable on Vercel —
Vercel overwrites it at the edge specifically to prevent that, so the limiter's identity is already
trustworthy and the gate that finding created does not exist. The consequence matters: Upstash is
not merely necessary but **sufficient** to make the limiter real.

**Findings that remain.** The in-memory limiter is structurally ineffective on serverless;
`OPENAI_API_KEY` is absent from Vercel Production; the lint rule has bypasses; `docs/architecture.md`
is wrong in two places; three variables in `scripts/ci-local.sh` are undocumented.

**Why it is implementation-ready.** Every conclusion below is anchored to a file and line. The
enforcement mechanisms were tested rather than assumed — eleven ESLint probes through `--stdin`, and
`@/env` imported through `tsx` under both condition sets. The one ordering constraint that can break
production is isolated to a single PR with a single named precondition.

---

## 2. Current-state evidence

Every conclusion in this plan traces to one of these. Nothing here is inferred.

| #   | Evidence                                                                                               | Why it matters                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| E1  | `src/app/api/chat/route.ts:35` calls `embedQuery` **before** the 503 branch at `:55`                   | Any degraded path decided after line 35 has already spent an OpenAI call. Source of B1                |
| E2  | `src/agent/rate-limit.ts:12` — `RateLimiter = (req) => Promise<boolean>`                               | Cannot express "unavailable". An Upstash throw at `:57` is unhandled → 500. Source of B2              |
| E3  | `src/app/api/chat/route.ts:12` builds the limiter at **module scope**                                  | A throw there fails module init → 500 on every request. Source of B3                                  |
| E4  | `scripts/agent-index/check.ts` `runCheck` never inspects `embeddingModel`                              | The invariant PR 2 depends on is unenforced. The embeddings check is behind `--strict`. Source of B4  |
| E5  | `package.json` `prebuild` runs `agent:index:check` **without** `--strict`                              | Whatever the non-strict check asserts becomes a Vercel build gate                                     |
| E6  | `AGENTS.md:32` — "**every env var is optional** — features degrade instead of failing"                 | Live normative principle that PR 5 contradicts. `AGENTS.md` outranks `.claude/rules/**`. Source of B5 |
| E7  | Vercel docs: `x-forwarded-for` is overwritten at the edge "to prevent IP spoofing"                     | The limiter identity is trustworthy. Overturns the earlier critical finding                           |
| E8  | `src/agent/rate-limit.ts:41` seeds an unseen key at **full** capacity                                  | Every cold start grants a fresh budget. The in-memory limiter cannot bound spend on serverless        |
| E9  | `vitest.config.ts:132` pins `src/agent/rate-limit.ts` at **100 % branches**                            | PR 4's tests are mandatory — `validate` fails without them                                            |
| E10 | `tests/boundaries.test.ts` lints text against the real `eslint.config.ts` via `new ESLint()`           | The existing home for PR 3's tests. No new infrastructure needed                                      |
| E11 | `docs/architecture.md:194` and `:366` call `env.ts` "the **only** reader of `process.env`"             | False — seven files read it directly. A normative document asserting an untruth                       |
| E12 | `eslint.config.ts:145` scopes the rule to `files: ["src/**/*.{ts,tsx}"]`                               | Scripts and config are outside it by design, not by oversight                                         |
| E13 | Only `src/env.ts` reads `process.env.NODE_ENV` inside `src/`                                           | The property-level exemption can become a file-level one with no other file affected                  |
| E14 | `Object.keys(env)` returns 17; `@/env` imports cleanly under `tsx` and `--conditions=react-server`     | PR 6 needs no change to `src/env.ts`, and the `@/` alias resolves without `tsconfig-paths`            |
| E15 | `scripts/ci-local.sh:23` — `CPUS="${CI_CPUS:-2}"`                                                      | `CPUS` is a shell local; `CI_CPUS` is the environment read. The checker must distinguish them         |
| E16 | `src/agent/index.generated.json` is the only generated index; `embedQuery` the only runtime embed call | The coupling has exactly one runtime site to fix                                                      |
| E17 | `src/agent/corpus.ts` — `embeddingModel: z.string().nullable()`                                        | The null case is representable, so the fallback must be defined rather than assumed                   |
| E18 | `scripts/agent-index/paths.ts:9` `loadEnvFiles()` injects arbitrary keys into `process.env`            | The build-time surface is open-ended; it skips keys already set, so it cannot override CI or Vercel   |
| E19 | No workflow declares `id-token` or any permission beyond `contents` / `pull-requests`                  | No OIDC credential is in play. `GITHUB_TOKEN` is the only Actions credential besides the five secrets |
| E20 | `scripts/build-agent-index.ts:59–64` — `--check` returns before `:66` reads the API key                | Adding `OPENAI_API_KEY` to Vercel triggers no build-time embedding and no build-time spend            |

---

## 3. Environment-variable architecture

### 3.1 What counts as an environment variable here

Stated precisely so a future audit cannot produce a different number by using a different scope.
Earlier passes reported 23, 26, 27 and 30; the spread was scope drift plus one arithmetic error.

**A named value read from the process environment by code or configuration that this repository
authors and executes, at any lifecycle stage.** Counted when it appears as:

- a `process.env` access in any authored file — dotted, bracketed, dynamic, destructured, aliased
  or spread;
- a GitHub Actions `${{ env.* }}`, `${{ secrets.* }}` or `${{ vars.* }}` reference;
- a `$VAR` / `${VAR}` / `${VAR:-default}` **read** in an authored shell script;
- an inline `VAR=value` assignment in a `package.json` script;
- a declaration in `src/env.ts`, even when read elsewhere.

**Explicitly excluded**, and this is where every earlier discrepancy originated:

- variables read only by dependencies inside `node_modules`;
- POSIX shell built-ins that are not configuration — `HOME`, `PATH`, `PWD`, `BASH_SOURCE`, `USER`,
  `TMPDIR` and the rest;
- **shell locals**, which look identical to reads. `CPUS="${CI_CPUS:-2}"` in `scripts/ci-local.sh:23`
  contains one environment read (`CI_CPUS`) and one local assignment (`CPUS`). `CPUS` and `MEMORY`
  are locals and must never enter the manifest (E15);
- GitHub Actions context expressions that are not environment variables — `github.*`, `runner.*`,
  `steps.*`, `inputs.*`, `hashFiles()`;
- values appearing only in prose. `process.env.X` at `src/telemetry/vitals.test.ts:23` is inside a
  comment and is not a variable.

### 3.2 The inventory — 30 today, 31 after PR 5

| Variable                                | Read at                                                  | Category                         |
| --------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| `OPENAI_API_KEY`                        | `route.ts:34`, `build-agent-index.ts:66`                 | application (secret)             |
| `OPENAI_CHAT_MODEL`                     | `stream.ts:23`                                           | application                      |
| `OPENAI_EMBED_MODEL`                    | `retrieval.ts:248`, `build-agent-index.ts:67`            | application → tooling after PR 2 |
| `UPSTASH_REDIS_REST_URL`                | `rate-limit.ts:24`                                       | application                      |
| `UPSTASH_REDIS_REST_TOKEN`              | `rate-limit.ts:24`                                       | application (secret)             |
| `SENTRY_DSN`                            | `instrumentation.ts:5`, `next.config.ts:67`              | application                      |
| `NEXT_PUBLIC_SENTRY_DSN`                | `instrumentation-client.ts:5`                            | application (public)             |
| `SENTRY_TRACES_SAMPLE_RATE`             | `instrumentation.ts:14`                                  | application                      |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | `instrumentation-client.ts:11`                           | application (public)             |
| `NEXT_PUBLIC_APP_URL`                   | `metadata.ts:27`                                         | application (public)             |
| `SENTRY_AUTH_TOKEN`                     | `next.config.ts:82`, `ci.yml:82`                         | application (build secret)       |
| `SENTRY_ORG`                            | `next.config.ts:71`, `ci.yml:83`                         | application (build)              |
| `SENTRY_PROJECT`                        | `next.config.ts:72`, `ci.yml:84`                         | application (build)              |
| `NODE_ENV`                              | `env.ts:6`, config files                                 | platform                         |
| `VERCEL`                                | `next.config.ts:26`                                      | platform                         |
| `VERCEL_URL`                            | `env.ts:10`                                              | platform                         |
| `VERCEL_PROJECT_PRODUCTION_URL`         | `metadata.ts:27`                                         | platform                         |
| `NEXT_RUNTIME`                          | `instrumentation.ts:10`                                  | platform                         |
| `CI`                                    | `playwright.config.ts`, `next.config.ts`, `package.json` | platform / CI                    |
| `GITHUB_TOKEN`                          | `release-please.yml:21`                                  | platform / CI                    |
| `GITHUB_OUTPUT`                         | `ci.yml:110`                                             | platform / CI                    |
| `NODE_VERSION`                          | `ci.yml:17`, `audit.yml:15`                              | tooling / CI                     |
| `NODE_OPTIONS`                          | `package.json`, `playwright.config.ts:91`                | tooling                          |
| `SKIP_ENV_VALIDATION`                   | `env.ts:49`                                              | tooling (escape hatch)           |
| `ANALYZE`                               | `next.config.ts`                                         | tooling                          |
| `PORT`                                  | `playwright.config.ts:4`                                 | tooling / test                   |
| `PLAYWRIGHT_BASE_URL`                   | `playwright.config.ts:5`                                 | tooling / test                   |
| `CI_CPUS`                               | `ci-local.sh:23`                                         | tooling (developer)              |
| `CI_MEMORY`                             | `ci-local.sh:24`                                         | tooling (developer)              |
| `CI_IMAGE`                              | `ci-local.sh:35`                                         | tooling (developer)              |

**Why `VERCEL_ENV` becomes #31.** It is referenced nowhere in the repository today. PR 5 introduces
it as the discriminator that separates a Vercel **production** deployment from a preview. It cannot
be inferred from an existing variable: `VERCEL === "1"` is equally true in Preview, so keying the
production floor on it would fail every preview build. Introducing a variable is the smaller cost.

### 3.3 Where each category is enforced, and why the boundaries sit there

**`process.env` restrictions stay scoped to `src/`** (E12). `next.config.ts`, both
`instrumentation*.ts` and `playwright.config.ts` run _before or outside_ the validated module — they
cannot import `@/env` because it does not exist yet at that point in the lifecycle. `scripts/**` runs
in plain node outside the Next graph. Widening the lint rule to those files would force
`eslint-disable` comments onto correct code, which teaches the rule is negotiable. The boundary is
the point.

**Everything outside `src/` is handled by `check-env.ts`** because ESLint cannot see YAML, shell or
`package.json` script strings at all. That is not a limitation to work around; it is a different
surface needing a different tool.

**Shell parsing is best-effort, deliberately.** A shell script can construct a variable name at
runtime, and `$1`, `${BASH_SOURCE[0]}` and `${VAR:-default}` are all syntactically similar to a read.
The checker therefore extracts `${VAR}` and `$VAR` forms, filters the POSIX built-in list, and
**excludes any name that appears on the left of an `=` assignment in the same file** — which is
exactly how `CPUS` and `MEMORY` are separated from `CI_CPUS` and `CI_MEMORY` (E15). The residual
risk is a false negative on dynamically-built names, which no static tool can close and which no
file in this repository currently does. That limit belongs in the script's own header comment.

---

## 4. Final architecture decisions

### D1 — Rate limiter identity

**Current behavior.** `clientIp()` takes the first `x-forwarded-for` entry, falling back to
`x-real-ip`, then the literal `"anonymous"`.

**Risk.** None in production. Vercel overwrites the header at the edge specifically to prevent
spoofing (E7), and this project has no proxy in front of Vercel and no Enterprise Trusted Proxy. The
identity is trustworthy today.

**Intended behavior.** Prefer `x-vercel-forwarded-for`, then `x-forwarded-for`, then `x-real-ip`.
This is defence in depth for the case where a proxy is ever placed in front of Vercel — the
`x-vercel-` form is the one Vercel controls in that scenario.

**Do not change first→last entry selection.** Vercel sends a single value, so the change is a no-op
in production and identical locally, and it would break the deliberate three-entry assertion at
`src/agent/rate-limit.test.ts:59-60`. That is churn against a test that documents intent.

**IPv6 normalization.** Bucket IPv6 by its `/64` prefix, IPv4 by the full address. A single
residential IPv6 allocation is typically a `/64`, so without normalizing, one attacker rotates
through effectively unlimited distinct keys. This is the one item in the plan with no repository
evidence behind it — it is a known limiter-bypass class, not an observed one. Implement it with
explicit `::`-compression handling or not at all; a half-correct IPv6 parser is worse than none.

**Local and Playwright.** There is no trusted proxy at all, so no identity is trustworthy there. The
limiter is advisory in those environments. Say so in a comment rather than implying a guarantee the
code cannot make.

**Must not regress.** The existing header-precedence and `"anonymous"` bucketing tests.

### D2 — Rate limiter contract and failure semantics

**Current behavior.** `RateLimiter` returns `Promise<boolean>` (E2). Falsy → 429. An Upstash throw at
`rate-limit.ts:57` is unhandled and propagates to a 500. The limiter is constructed at module scope
(E3).

**Risk.** Three defects. A transport failure is indistinguishable from a denial; an Upstash outage
becomes a 500; and any throw during construction fails module init on every request, violating the
`AGENTS.md` principle that features degrade rather than fail.

**Intended behavior — the conceptual contract:**

```
type LimiterVerdict = "allow" | "deny" | "unavailable";
```

| Verdict       | Meaning                            | Response                                       |
| ------------- | ---------------------------------- | ---------------------------------------------- |
| `allow`       | Under the limit                    | Proceed to the full path                       |
| `deny`        | Over the limit                     | 429, as today                                  |
| `unavailable` | The limiter could not be evaluated | **Degraded path** — no OpenAI call of any kind |

**The critical rule, and the reason this decision exists.** `unavailable` **must prevent
`embedQuery` from running**. `src/app/api/chat/route.ts:35` issues an OpenAI embedding request
_before_ the 503 branch at `:55` (E1) — so routing a limiter failure to that branch would still spend
money on every request during an outage. That is fail-open on cost, which is precisely what the
design exists to prevent.

The degraded decision must therefore be computed **before line 35**, as a single flag combining both
degradation causes:

```
degraded = (no API key) OR (verdict === "unavailable")

degraded  → skip embedQuery entirely
          → retrieve() with queryEmbedding = null  (BM25)
          → return the retrieval-only 503
```

This reuses the existing, already-tested no-key branch as the _response_, while moving the _decision_
earlier. Saying only "return the existing 503" is insufficient and was the defect in the previous
plan.

**Partial configuration.** Exactly one `UPSTASH_*` variable set is a configuration error. It must
**not** throw — at module scope it would produce a 500 (E3). At runtime it yields `unavailable`; the
build-time production assertion (D3) is what makes it loud.

**Upstash runtime failure.** Catch, report to Sentry, return `unavailable`. Never fail open.

**Production.** Once PR 5 lands, production cannot reach the in-memory limiter at all: the assertion
fails the build when both Upstash variables are absent. This is the requirement that the in-memory
fallback can never serve production traffic.

**Non-production.** Neither variable set → in-memory limiter with a one-time warning. Local
development and CI keep working with zero configuration, which the `AGENTS.md` principle requires.

**Must not regress.** 400 on invalid JSON and schema failure; 429 on genuine denial; 200 on refusal;
the streaming success path; `maxDuration = 30`; the 600-character input cap; `maxOutputTokens: 600`.

### D3 — Production floor

Specified in full in §7.

### D4 — Model/index coupling

Specified in full in §5.

### D5 — `check-env.ts`

**Approach.** Extraction plus manifest diff — regex, not a parser. Repository evidence supports this:
the surfaces that matter are structured (`${{ secrets.X }}` in YAML, `VAR=` in `package.json`
scripts) and the only genuinely ambiguous surface is shell, where §3.3 defines the assignment-aware
filter and documents the residual limit. Building an AST pipeline for four shell scripts is cost
without benefit; TypeScript is already covered more reliably by ESLint (D6).

**Precedent.** `scripts/check-prerender.ts` is the shape to copy — read an artifact, compare against
a declared list, exit 1 with a message naming the fix. Same structure, same ergonomics, no new
dependency.

**Wiring.** Into `validate`, not `prebuild`. `prebuild` runs on Vercel's critical path and this check
protects the repository, not the deployment.

### D6 — ESLint enforcement

Specified in full in §6.

---

## 5. Model/index coupling

**Current behavior.** `src/agent/retrieval.ts:248` embeds the query with
`env.OPENAI_EMBED_MODEL`, while `:251` requests dimensions from `INDEX.embeddingDim`. The corpus was
generated by `scripts/build-agent-index.ts:67` using the same environment variable. The literal
`text-embedding-3-small` exists in four places: `src/env.ts:20`, `scripts/build-agent-index.ts:20`,
`tests/env.ts:10` and `src/agent/index.generated.json:3`.

**Risk.** Dimensions come from the index and the model from the environment — an inconsistency that
is the actual defect. Set `OPENAI_EMBED_MODEL` to a different model and query vectors come from a
different embedding space than the corpus. Cosine scores silently become meaningless; nothing errors,
nothing logs, and retrieval quality degrades invisibly.

**Intended behavior.** The generated index is the runtime source of truth for the model, exactly as
it already is for dimensions.

| Stage      | Model source                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| Build      | `process.env.OPENAI_EMBED_MODEL ?? DEFAULT_EMBED_MODEL`, stamped into the index |
| Query time | `INDEX.embeddingModel`                                                          |

**Why this is stronger than a shared constant.** A shared constant keeps two values that must agree
and adds a check that they do — it _detects_ divergence. Deriving the query model from the index
means there is only one value and it travels with the data it describes, so divergence is not
possible to express. The environment variable becomes build-time-only, and
`OPENAI_EMBED_MODEL` moves from the application schema to the tooling manifest.

**Null-model fallback — defined, not assumed.** `embeddingModel` is `z.string().nullable()` (E17). If
it is null while chunks carry embeddings, the corpus is unusable for cosine retrieval. The defined
behavior: **fall back to keyword retrieval** — treat it exactly as a corpus without embeddings, by
returning `null` from `embedQuery` without calling OpenAI. Never guess a model name.

**The required index invariant.**

> If any chunk carries an embedding, `embeddingModel` and `embeddingDim` must both be non-null.

**Why `--strict` is insufficient.** `runCheck` never inspects `embeddingModel` at all (E4), and its
embeddings assertion is gated behind `--strict`. `prebuild` runs `agent:index:check` **without**
`--strict` (E5), so a `--strict`-only invariant would never execute on Vercel — which is the only
place it matters.

**Therefore the non-strict check must enforce it.** `scripts/agent-index/check.ts` gains the
assertion in its default path.

**This introduces a new build gate — state it plainly.** After PR 2, a committed index with
embeddings but no recorded model fails `prebuild`, and therefore fails the **Vercel production
build**. The current index satisfies the invariant (86 of 86 chunks embedded,
`embeddingModel: "text-embedding-3-small"`), so the gate is green on landing. It must be verified
locally with `pnpm agent:index:check` before the PR is opened.

**Must not regress.** BM25 fallback when no key is configured; the existing `--check` drift
detection; `--strict` behavior; the index file format and `chunkerVersion`.

---

## 6. ESLint enforcement

**Current behavior.** One selector at `eslint.config.ts:167`, scoped to `src/**/*.{ts,tsx}`,
exempting `NODE_ENV` at the property level.

**Risk.** Tested through `eslint --stdin`: it catches `process.env.FOO`, `process.env["FOO"]` and
`process.env[key]`, and **misses** destructuring, aliasing, spread, `globalThis.process.env` and
`Object.assign({}, process.env)`. It also false-positives on `process.env["NODE_ENV"]` while
permitting the dotted form. No file currently exploits any of this, so the gap is future-proofing.

**Intended behavior — a single catch-all selector, plus the `globalThis` variant:**

```
MemberExpression[object.name='process'][property.name='env']
MemberExpression[object.object.property.name='process'][object.property.name='env']
```

The first matches the bare `process.env` node in **every** syntactic position, including as the
object of a member expression. Duplicate reporting on `process.env.FOO` is harmless — it is an error
either way.

**Why `NODE_ENV` stops being a property-level exception.** A catch-all selector cannot exempt a
property of its parent expression, and it does not need to: only `src/env.ts` reads
`process.env.NODE_ENV` inside `src/` (E13). The exemption becomes a **file-level exclusion of
`src/env.ts`**, which is easier to reason about and removes the dotted/bracketed asymmetry.

**Verified against all eleven probes.** Caught: `process.env.FOO`, `process.env["FOO"]`,
`process.env[key]`, `const { FOO } = process.env`, `const e = process.env`, `{ ...process.env }`,
`Object.assign({}, process.env)`, `g(process.env)`, `return process.env`, `{ e: process.env }`,
`[process.env]`, `globalThis.process.env.FOO`. Zero residual bypasses; zero false positives once
`src/env.ts` is excluded by file.

**Where the tests belong.** `tests/boundaries.test.ts` (E10). It already constructs `new ESLint()` and
calls `lintText()` against the real `eslint.config.ts`, filtering by `ruleId`. PR 3 adds a parallel
block filtering `no-restricted-syntax`. No new test infrastructure.

**Must not regress.** Every existing `no-restricted-imports` boundary assertion; `pnpm lint` staying
at zero warnings; `src/env.ts` itself continuing to lint clean.

---

## 7. Production assertion

**Current behavior.** `OPENAI_API_KEY` is `z.string().min(1).optional()`. A production deployment
missing it validates cleanly, and `emptyStringAsUndefined: true` makes an empty value
indistinguishable from absence.

**Risk.** This is why a headline feature was dead in production for three months with no signal.

**Intended behavior.** A standalone assertion, executed from `src/env.ts` after `createEnv`.

### 7.1 The activation condition

```
VERCEL === "1" && VERCEL_ENV !== "preview"
```

| Environment                     | `VERCEL` | `VERCEL_ENV` | Asserts? |
| ------------------------------- | -------- | ------------ | -------- |
| Vercel Production               | `"1"`    | `production` | **Yes**  |
| Vercel Preview                  | `"1"`    | `preview`    | No       |
| Vercel, `VERCEL_ENV` missing    | `"1"`    | absent       | **Yes**  |
| Local `pnpm dev` / `pnpm build` | unset    | unset        | No       |
| CI (`next build` in `e2e`)      | unset    | unset        | No       |
| Vitest                          | unset    | unset        | No       |

**Why a missing `VERCEL_ENV` must not silently weaken the guarantee.** Keying on
`VERCEL_ENV === "production"` means that if Vercel ever stops populating it, the assertion vanishes
without a sound — reproducing exactly the silent-failure class this plan exists to close. Treating
"on Vercel, environment unknown" as production fails safe. The cost is that a preview build would
break if `VERCEL_ENV` were ever absent there, which is the acceptable direction for the error to run.

**When it fires.** `src/app/layout.tsx` imports `@/env`, so prerender executes it during
`next build`. The assertion therefore fails the **Vercel production build**, before any traffic
reaches a broken deployment. That is the earliest useful point.

### 7.2 Why it must stay outside the Zod schema

`createEnv` is configured with `skipValidation: process.env.SKIP_ENV_VALIDATION === "1"`
(`src/env.ts:49`), and that skips refinements along with everything else. A production guarantee that
an environment variable can switch off is not a guarantee. A standalone assertion runs regardless of
that flag, and produces a far better error message than a Zod issue list.

It also cannot be tree-shaken: `src/env.ts` is already side-effectful (`createEnv` executes at
import), and the assertion is a call in the same module scope.

### 7.3 Required in production

| Variable                               | Why                                                       |
| -------------------------------------- | --------------------------------------------------------- |
| `OPENAI_API_KEY`                       | Without it the agent is a 503                             |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN`    | **Both or neither.** Exactly one is a configuration error |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Errors otherwise go unreported                            |

**Why production must never fall back to the in-memory limiter.** It cannot bound spend on
serverless: state is per-instance and every unseen key starts at full capacity (E8), so the effective
ceiling scales with concurrency and cold starts. With a public endpoint that spends money on two
OpenAI calls per allowed request, "advisory" is not a limiter. Requiring the Upstash pair in
production is what converts the fallback from a silent downgrade into a build failure.

### 7.4 Resolving the tension with "every env var is optional"

`AGENTS.md:32` states, as a live principle (E6):

> **Secrets stay server-side, and every env var is optional** — features degrade instead of failing
> (no `OPENAI_API_KEY` → `503`, no `UPSTASH_*` → in-memory limiter, no Sentry DSN → skipped).
> Preserve that when adding one; read env only through `@/env`.

The purpose behind it, recorded in `decisions.md` (2026-08-07), is that _a clone runs with zero setup
and CI needs no secrets_. The production assertion preserves both — it is inert everywhere except a
Vercel production build. So the principle needs **refinement, not reversal**:

> Every env var is optional for local development, tests and CI — a clone runs with zero setup and CI
> needs no secrets. A Vercel **production** build additionally requires the set named in
> `docs/config-plan.md` §7.3, asserted at build time. Features still degrade rather than fail at
> runtime; the assertion moves the failure earlier, to where it is cheap.

**PR 5 must therefore amend `AGENTS.md` and append a `docs/decisions.md` entry in the same change.**
`AGENTS.md` outranks `.claude/rules/**` on the authority ladder, so leaving it unamended would put a
contradictory normative statement above the rule that implements the change — and `AGENTS.md`'s own
instruction is that a wrong claim is fixed in the same change that discovers it.

---

## 8. Final PR sequence

```
PR 1  documentation  →  PR 3  ESLint  →  PR 6  env checker  →  PR 2  model coupling
                                                                      ↓
                        PR 5  production assertion  ←  Track B  ←  PR 4  rate limiter
```

**Verified dependencies, not assumed:**

| PR      | Hard dependency  | Why the position is right                                                                                           |
| ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| PR 1    | None             | Zero risk, and every later PR references a contract that must be stated correctly first                             |
| PR 3    | None             | Config-only, zero current violations, proven exhaustive. Landing it early means later PRs are written under it      |
| PR 6    | None             | Placed **before** PR 2 so the checker guards the PR that reclassifies a variable, rather than being validated by it |
| PR 2    | None in code     | Introduces a build gate; must be verified with `pnpm agent:index:check` before opening                              |
| PR 4    | None in code     | Must land **before** Track B adds the OpenAI key — that is the security-critical edge                               |
| Track B | PR 4 merged      | Adding the key earlier creates "billable endpoint + ineffective limiter"                                            |
| PR 5    | Track B complete | The only PR that can block a deployment. Last, unambiguously                                                        |

**The one trade-off in this ordering.** PR 6 lands while `OPENAI_EMBED_MODEL` is still an application
variable, so PR 2 must move it to the tooling manifest. That is one small edit, and the alternative —
PR 2 first — gives up the checker's guard over exactly the change most likely to misclassify a
variable. The guard is worth more than avoiding one manifest line.

**Why not PR 4 earlier.** It is the largest change and carries a 100 % branch-coverage floor (E9).
Landing the cheap guardrails first means it is written under the final lint rule and checked by the
final env checker.

---

## 9. Per-PR implementation specifications

### PR 1 — Correct the normative documentation

- **Objective.** Stop a false invariant outranking the true one.
- **Allowed.** `docs/architecture.md`, `.claude/rules/security-and-env.md`, `AGENTS.md`.
- **Forbidden.** Everything else. No code, no tests, no config.
- **Behavioral change.** None.
- **Must not change.** Any executable behavior.
- **Requirements.** Correct `architecture.md:194` and `:366` to "the only reader of `process.env` in
  `src/`", naming the four documented exceptions. Extend the rules file with the bypass patterns PR 3
  will reject and the procedure for introducing a variable. Add one pointer line to `AGENTS.md`. Do
  **not** pre-empt the principle-5 amendment — that belongs to PR 5 with its decision entry.
- **Tests.** None.
- **Commands.** `pnpm validate`.
- **Failure modes.** Prettier formatting only.
- **Rollback.** `git revert`.
- **Manual verification.** Read the two corrected lines.
- **Production risk.** None. Cannot block deployment.

### PR 3 — Close the ESLint bypasses

- **Objective.** Make the `@/env`-only rule unbypassable in `src/`.
- **Allowed.** `eslint.config.ts`, `tests/boundaries.test.ts`.
- **Forbidden.** Any file under `src/`, `scripts/`, `.github/`.
- **Behavioral change.** Lint only.
- **Must not change.** Existing `no-restricted-imports` boundaries; zero-warning status.
- **Requirements.** Replace the single selector with the two from §6; exclude `src/env.ts` by file
  rather than exempting `NODE_ENV` by property.
- **Tests.** All eleven probes from §6, asserted through the existing `lintText()` harness, plus a
  case proving `src/env.ts` is exempt.
- **Commands.** `pnpm lint`, `pnpm test`, `pnpm validate`.
- **Failure modes.** If any `src/` file outside `src/env.ts` reads `process.env`, lint fails — none
  does today.
- **Rollback.** `git revert`.
- **Production risk.** None. Cannot block deployment.

### PR 6 — `pnpm env:check`

- **Objective.** Cover the surface ESLint cannot see.
- **Allowed.** `scripts/check-env.ts` (new), `package.json`, `knip.json` if the new script needs an
  entry.
- **Forbidden.** **`src/env.ts` must not change** — `Object.keys(env)` already yields all 17 keys and
  the `@/` alias resolves under `tsx` (E14). Also forbidden: `eslint.config.ts`, any file under
  `src/`.
- **Behavioral change.** `pnpm validate` gains a failing condition.
- **Must not change.** `prebuild`; Vercel's critical path; existing `validate` steps.
- **Requirements.** Derive the application list by importing `@/env` and reading `Object.keys(env)`;
  set `SKIP_ENV_VALIDATION=1` inside the script before importing so the check cannot fail for an
  unrelated validation reason. Hand-maintain `TOOLING_ENV` only, each entry carrying name, category,
  stage and reason. Apply the assignment-aware shell filter from §3.3 so `CPUS` and `MEMORY` are
  excluded. Document the shell best-effort limit in the file header.
- **Tests.** A colocated spec with fixture inputs for each detected form, including a fixture proving
  a shell local is not reported.
- **Commands.** `pnpm env:check`, `pnpm validate`.
- **Failure modes.** False positives on shell; mitigated by the filter and the exclusion list.
- **Rollback.** Remove from the `validate` chain.
- **Production risk.** None. Cannot block deployment.

### PR 2 — Make model divergence impossible

- **Objective.** Derive the query embedding model from the index (§5).
- **Allowed.** `src/agent/retrieval.ts`, `src/agent/corpus.ts`, `src/env.ts`,
  `scripts/build-agent-index.ts`, `scripts/agent-index/check.ts`, `tests/env.ts`,
  `src/agent/retrieval.test.ts`, `scripts/check-env.ts` (manifest entry only).
- **Forbidden.** `src/agent/index.generated.json` — generated; regenerate with `pnpm agent:index` if
  ever needed, never hand-edit. Also `src/app/api/chat/route.ts`, `eslint.config.ts`.
- **Behavioral change.** `OPENAI_EMBED_MODEL` stops affecting queries. A committed index with
  embeddings but no model now fails `agent:index:check` — **a new build gate**.
- **Must not change.** BM25 fallback; `--check` drift detection; `--strict`; index format;
  `chunkerVersion`.
- **Requirements.** `embedQuery` reads `INDEX.embeddingModel`; when null, return `null` without
  calling OpenAI so retrieval falls to BM25. Remove `OPENAI_EMBED_MODEL` from the runtime schema and
  add it to `TOOLING_ENV`. Add the non-strict invariant to `runCheck`.
- **Tests.** Index model wins over a differing env value; null model → no OpenAI call and BM25 used;
  `runCheck` fails on embeddings-without-model and passes on the current index.
- **Commands.** `pnpm validate`, `pnpm agent:index:check`, `pnpm e2e:ci`.
- **Failure modes.** If the committed index were ever missing its model, `prebuild` fails — including
  on Vercel. Verify locally before opening.
- **Rollback.** `git revert`; the index format is untouched.
- **Production risk.** Low, but **it can block deployment** via `prebuild`. Verified green on the
  current index.

### PR 4 — Rate limiter contract and degraded path

- **Objective.** Implement D1 and D2, including the pre-embedding degraded decision.
- **Allowed.** `src/agent/rate-limit.ts`, `src/app/api/chat/route.ts`,
  `src/agent/rate-limit.test.ts`, `src/app/api/chat/route.test.ts`.
- **Forbidden.** `src/env.ts`, `src/agent/retrieval.ts`, `src/agent/stream.ts`,
  `src/agent/prompt.ts`, `src/chat-contract.ts`, `vitest.config.ts`.
- **Behavioral change.** Exactly one Upstash variable → `unavailable` rather than a partial limiter.
  An Upstash error → degraded 503 rather than 500. `unavailable` → no OpenAI call at all.
- **Must not change.** 400 on invalid JSON and on schema failure; 429 on genuine denial; 200 on
  refusal; the streaming success path; `maxDuration = 30`; the 600-character cap;
  `maxOutputTokens: 600`; `x-agent-sources` contents; the header-precedence and `"anonymous"` tests;
  **first**-entry `x-forwarded-for` selection.
- **Requirements.** Widen `RateLimiter` to the verdict union. No throw at module scope under any
  configuration. Compute `degraded` **before** `embedQuery` and gate the call on it.
- **Tests.** Header precedence including `x-vercel-forwarded-for`; IPv6 `/64` normalization; partial
  config → `unavailable`; Upstash throw → `unavailable` and reported to Sentry; **`embedQuery` is not
  called when degraded** (assert on the mock, not on the response); 429 still returned on `deny`.
- **Commands.** `pnpm validate`, `pnpm e2e:ci`.
- **Failure modes.** The 100 % branch floor on `rate-limit.ts` (E9) fails `validate` if any new branch
  is untested. That is the intended safety net.
- **Rollback.** `git revert`.
- **Production risk.** Medium in principle, low in practice — it ships while the endpoint is still
  503-only, so no OpenAI spend is possible. Cannot block deployment.

### PR 5 — Production assertion

- **Objective.** Make a missing production-critical variable a build failure (§7).
- **Allowed.** `src/env.ts`, a new assertion module beside it, `tests/env.ts`, `AGENTS.md`,
  `docs/decisions.md`, `.env.example`, and its own test file.
- **Forbidden.** `src/agent/**`, `src/app/**`, `eslint.config.ts`, `.github/workflows/**`,
  `vitest.config.ts`.
- **Behavioral change.** Vercel production builds fail when a required variable is missing. Preview,
  CI, local and tests are unaffected.
- **Must not change.** A clone with no `.env.local` runs `pnpm dev` and `pnpm build`; CI needs no
  secrets; runtime degradation behavior.
- **Requirements.** Add `VERCEL_ENV` to the schema (variable #31). Assert when
  `VERCEL === "1" && VERCEL_ENV !== "preview"`. Keep it outside the Zod schema so
  `SKIP_ENV_VALIDATION` cannot disable it. Amend `AGENTS.md` principle 5 per §7.4 and append a
  `decisions.md` entry recording the refinement and its reasoning.
- **Tests.** Production asserts; preview does not; absent `VERCEL_ENV` on Vercel asserts; off-Vercel
  never asserts; `SKIP_ENV_VALIDATION=1` does not disable it.
- **Commands.** `pnpm validate`; `pnpm build` locally **with no Vercel variables set** must still
  succeed.
- **Failure modes.** If the Vercel variables are absent, production deployments stop. Recoverable by
  revert plus redeploy; the previous deployment keeps serving throughout.
- **Rollback.** `git revert`, then redeploy.
- **Production risk.** **Highest in the plan. It can block deployment by design.**
- **Prerequisite.** §14's single condition.

---

## 10. Infrastructure — Track B

None of this is code, and none of it has been performed. It requires dashboard access this
repository does not have.

| #   | Action                          | Why                                                           | When                        | Depends on            | What can break                                                                       | Before PR 5? |
| --- | ------------------------------- | ------------------------------------------------------------- | --------------------------- | --------------------- | ------------------------------------------------------------------------------------ | ------------ |
| 1   | **OpenAI spend cap**            | The only control that bounds worst case independently of code | **Immediately — do first**  | Nothing               | Nothing. The endpoint is already 503                                                 | **Yes**      |
| 2   | **OpenAI key rotation**         | The key was displayed in a chat session                       | Immediately                 | Nothing               | Nothing — the key is unused in production today                                      | Yes          |
| 3   | **Sentry token rotation**       | Same exposure                                                 | Immediately                 | Nothing               | Source-map upload, if Vercel and GitHub are updated at different times               | Yes          |
| 4   | **Upstash database creation**   | Production cannot use the in-memory limiter                   | Any time                    | Nothing               | Nothing                                                                              | **Yes**      |
| 5   | **Vercel Production variables** | `OPENAI_API_KEY` + both `UPSTASH_*`, marked Sensitive         | **After PR 4 merges**       | PR 4, items 1 and 4   | Adding the key before PR 4 creates a billable endpoint behind an ineffective limiter | **Yes**      |
| 6   | **GitHub secret removal**       | CI does not need Sentry credentials                           | After pipeline-plan Phase 1 | `pipeline-plan.md` §3 | CI build fails while `ci.yml:80-84` still references them                            | No           |

**Item 7 was withdrawn on 2026-08-17.** It read "restore the `.claude/settings.json` deny rule".
The `Read(./.env)` and `Read(./.env.local)` entries were removed deliberately, not for a one-off
need: agents are to read env files going forward. The consequence is that a real credential can
reach a session transcript whenever one does, so **items 2 and 3 stop being one-time cleanup and
become the standing practice** — rotate anything an agent has read. Nothing in this plan depends on
the deny rule, and no other guardrail changed: `.env*` stays gitignored, `Edit()` denials on the
lockfile, changelog and generated index are untouched, and every check in §12 is unaffected.

**On item 5 and Preview.** The assertion in §7.1 deliberately excludes Preview, so preview
deployments do not need these variables. Add them to Preview only if you want the agent working on
preview URLs — that is a product choice, not a correctness requirement.

---

## 11. Security and cost ordering

This is the sequencing that matters most, stated separately so it cannot be lost inside the PR list.

**The state to avoid:**

> a working `OPENAI_API_KEY` in Vercel Production **and** no effective rate limiter

That state is reachable today by a single dashboard action, and it is unbounded in cost because the
in-memory limiter cannot bound anything on serverless (E8) and each allowed request makes two OpenAI
calls.

**The ordering that prevents it:**

1. **OpenAI spend cap first.** Before anything else, including any code. It is the only control that
   holds regardless of every code path below, and it takes minutes.
2. **Upstash exists before the key does.** Provision it, then add all three variables together. Never
   add `OPENAI_API_KEY` alone.
3. **PR 4 before the key.** The verdict contract and the pre-embedding degraded decision must exist
   before a limiter failure can cost money.
4. **Upstash before PR 5.** The assertion requires both Upstash variables in production. Landing PR 5
   first would fail every production build until the database exists — a self-inflicted outage of the
   deployment pipeline, not of the site.

---

## 12. Test strategy

Objective criteria, each checkable by a command rather than by reading.

| Area                      | Criterion                                                                              | Proven by                                               |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Env architecture          | Every application variable declared; every tooling variable has a reasoned entry       | `pnpm env:check` exits 0                                |
| Env architecture          | A new undocumented variable fails validation                                           | Add a probe variable locally; `pnpm validate` must fail |
| Lint enforcement          | All eleven bypass probes rejected; `src/env.ts` exempt                                 | `tests/boundaries.test.ts`                              |
| Model/index coupling      | Index model wins over a differing env value                                            | `src/agent/retrieval.test.ts`                           |
| Model/index coupling      | Null model → no OpenAI call, BM25 used                                                 | Same                                                    |
| Generated index integrity | Embeddings without a recorded model fail the **non-strict** check                      | `scripts/agent-index/check.ts` spec                     |
| Rate limiting             | Partial Upstash config → `unavailable`, no throw                                       | `src/agent/rate-limit.test.ts`                          |
| Rate limiting             | Upstash runtime failure → `unavailable`, reported, never fail-open                     | Same                                                    |
| Rate limiting             | IPv6 `/64` normalization; header precedence                                            | Same                                                    |
| Degraded behavior         | **`embedQuery` is not called when degraded** — asserted on the mock                    | `src/app/api/chat/route.test.ts`                        |
| Degraded behavior         | 429 still returned on a genuine `deny`                                                 | Same                                                    |
| Production assertion      | production asserts · preview does not · absent `VERCEL_ENV` asserts · off-Vercel never | assertion spec                                          |
| Production assertion      | `SKIP_ENV_VALIDATION=1` does not disable it                                            | Same                                                    |
| No secret leakage         | No key shape in built output                                                           | grep `.next/static` after `pnpm build`                  |
| CI                        | No workflow references a Sentry secret                                                 | after pipeline-plan Phase 1                             |
| E2E                       | Full suite green on PR 2 and PR 4                                                      | `pnpm e2e:ci`                                           |
| Local bootstrap           | Fresh clone, no `.env.local`, `pnpm dev` and `pnpm build` both succeed                 | manual, once, before PR 5 merges                        |

The coverage floors do real work here: `src/agent/rate-limit.ts` is pinned at 100 % branches and
`src/app/api/**` at 100 % statements, functions and lines (E9). Every new branch in PR 4 must arrive
with a test or `validate` fails on its own.

---

## 13. Unresolved items

Four remain. None blocks the plan.

| Item                              | Why it does not block                                                                           | What would change the plan                                                              | How to verify later                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Live endpoint behavior**        | The code path is unambiguous and traced end to end. Nothing in the plan depends on observing it | The endpoint returning something other than the 503 would mean an untraced code path    | One request to the live `/api/chat` after Track B item 5      |
| **Vercel variable inventory**     | User-reported and internally consistent with the GitHub API results                             | An undisclosed variable in Vercel could make PR 5's assertion pass or fail unexpectedly | Read Settings → Environment Variables immediately before PR 5 |
| **Upstash free-tier suitability** | Only matters after the endpoint is billable, which is after PR 4 and Track B                    | Insufficient quota would need a paid tier or a different backend                        | Observe the Upstash dashboard for a week after item 5         |
| **IPv6 `/64` assumption**         | It is a known bypass class, not an observed one; the limiter functions without it               | Evidence that Vercel normalizes IPv6 upstream would make it redundant                   | Log the distinct-key distribution after the endpoint is live  |

---

## 14. Implementation contract

**Files allowed per PR** — as specified in §9. Anything not listed there is forbidden for that PR.

**Forbidden in every PR:** `src/agent/index.generated.json` (generated — regenerate via
`pnpm agent:index`, never hand-edit); `pnpm-lock.yaml`; `pnpm-workspace.yaml`; `vercel.json`;
`.github/workflows/**` (owned by `pipeline-plan.md`); the thresholds block in `vitest.config.ts`;
every `.env*` file except `.env.example` in PR 5.

**Commands that must pass:** `pnpm validate` on every PR; `pnpm e2e:ci` on PR 2 and PR 4;
`pnpm agent:index:check` on PR 2; `pnpm build` with no Vercel variables on PR 5.

**Invariants that must hold after every PR:**

- A clone with no `.env.local` runs `pnpm dev` and `pnpm build`.
- CI needs no secrets.
- Retrieval falls back to BM25 whenever query embedding is unavailable.
- User text never enters `SYSTEM_PROMPT`; it stays in the user prompt.
- Citations resolve only against the server-built list.
- Model output renders as text, never HTML, and never becomes a URL or route.
- The 600-character input cap, `maxOutputTokens: 600` and `maxDuration = 30` remain.
- The refusal path stays tested.
- Status codes: 400 invalid, 429 denied, 200 refusal, 503 degraded.
- No secret reaches client output.

**Ordering constraints:** PR 1 → PR 3 → PR 6 → PR 2 → PR 4 → Track B → PR 5. Track B items 1 and 4
may start immediately and in parallel with any PR.

**Infrastructure prerequisites for PR 5:** Track B items 1, 2, 4 and 5 complete.

**The single condition that must be true before PR 5 may land:**

> `OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are all present in
> **Vercel Production**, and a preview deployment of the PR 5 branch has built successfully.

Until both halves are true, PR 5 stays open.
