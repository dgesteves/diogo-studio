# Pipeline plan

The migration from the delivery pipeline as it is to a gated one.
[`architecture.md`](./architecture.md) §10 is the target; this file is the route.
**Delete this file when the last phase lands**, and record the outcome as one dated entry in
[`decisions.md`](./decisions.md) — the same way `refactor.md`, `testing-plan.md` and
`restructure-plan.md` were retired.

Status: **Phase 0 closed 2026-08-16. Nothing implemented.** No branch, no commit, no CI run and
no Vercel setting has been changed. §2 carries the answers, §9 the measurements that came with
them, and §12 the budget this cycle can actually afford.

The problem in one line: **CI is an observer, not a gate.** Production served `846c8f0`
at `14:54:52Z` while its own CI run finished at `15:16:33Z` — 21 m 41 s later. Nothing in
the repository can prevent that, because deployment is triggered by `git push` and has no
relationship to the checks.

---

## 1. The decision this plan encodes

**Vercel Deployment Checks gates the release. GitHub Actions does not deploy.**

Vercel reads GitHub check runs directly and holds each production deployment in a **Staged**
state — built, with production environment variables, reachable at its deployment URL, but not
aliased to the production domain — until the selected checks pass. It then aliases instantly,
with no rebuild.

|                               | Deployment Checks            | Deploying from Actions (rejected)   |
| ----------------------------- | ---------------------------- | ----------------------------------- |
| Credential in GitHub          | **none**                     | `VERCEL_TOKEN` + org + project id   |
| Added Actions minutes / merge | **0**                        | 2–3 billed                          |
| Who builds production         | **Vercel** — unchanged       | GitHub, losing Vercel's build cache |
| Production env vars           | **stay in Vercel**           | pulled into a runner                |
| Rollback                      | **Instant Rollback**, native | reimplemented                       |
| `vercel.json` change          | **none**                     | `deploymentEnabled.main: false`     |
| Escape hatch                  | **Force Promote**            | revert and redeploy                 |

The rejected column is not merely worse — it is self-defeating. Setting
`deploymentEnabled.main: false` stops Vercel building production at all, which is exactly the
staged artifact a gated release needs. See §7.

---

## 2. Phase 0 — external prerequisites

Everything in this plan that could be determined by reading the repository already has been.
These four cannot, and Phase 1 does not start until they are answered.

**All four answered 2026-08-16.** The original questions are kept below the answers, unchanged,
because two of them turned out to be worth more than the yes they were asking for.

| #   | Answer                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | **Available, nothing configured.** The panel reads "No checks configured". Also verified: **Auto-assign Custom Production Domains is ON** — that automatic step is precisely what the gate holds back, so the plan's approach applies |
| 0.2 | **Present and scoped to Production**, as are `SENTRY_ORG` and `SENTRY_PROJECT`. Phase 1 may delete CI's copies                                                                                                                        |
| 0.3 | **1,863 of 2,000 minutes used. 137 left. Resets 2026-09-01.** The finding that most changes this plan — see §9 and §12                                                                                                                |
| 0.4 | **Deferred.** Phase 3 is last and gated on §8.2 passing, so nothing before it depends on the answer                                                                                                                                   |

Two things surfaced while answering these that the questions did not ask for.

**`SENTRY_AUTH_TOKEN` was the only one of the five Sentry variables not marked Sensitive.** In
Vercel, Sensitive means write-only — the value can never be read back through the dashboard, the
API or `vercel env pull`. The four public-or-near-public values (`NEXT_PUBLIC_SENTRY_DSN` is
inlined into the client bundle by definition; the DSN is an ingest endpoint; `SENTRY_ORG` and
`SENTRY_PROJECT` are slugs) carried the badge, and the one real credential did not. Toggled in
place on 2026-08-16; converting does not disturb the environment scopes.

**Preview keeps the token, deliberately.** Without it, `next.config.ts` sets
`sourcemaps.disable` and the build still succeeds — previews would keep reporting errors and
only lose readable stack traces. Readable traces on the deployments you actually inspect before
merging are worth more than the releases and quota they cost. §13's "PR builds do not receive
the Sentry write credential" is a claim about GitHub Actions and stays true; it never covered
Vercel previews.

| #   | To confirm                                                          | Where                                                                  | If the answer is "no"                                                                                                                        |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | **Deployment Checks is available** for this project                 | Vercel → Project → Settings → Build and Deployment → Deployment Checks | Fall back to manual promotion: disable **Auto-assign Custom Production Domains**, add a `vercel promote` step. Needs a token; strictly worse |
| 0.2 | **`SENTRY_AUTH_TOKEN` exists in the Vercel project** environment    | Vercel → Project → Settings → Environment Variables                    | Add it to Vercel **first**. Do not remove CI's until this is true, or source-map upload stops entirely                                       |
| 0.3 | **Authoritative Actions usage**                                     | GitHub → Settings → Billing → Plans and usage                          | Nothing blocks; every change here reduces consumption regardless. See §9 for why the derived figure is used                                  |
| 0.4 | **Is production trailing `main` by a docs-only commit acceptable?** | Your call                                                              | Drop path filtering (§5, optional). It is worth ~14 % of runs, not a correctness argument                                                    |

**Deliberately not in Phase 0: the cold-build measurement.** It does not need a separate
exercise — removing the cache steps in the Phase 1 PR _is_ the measurement, and the number
appears in that PR's own run. See §8.1.

---

## 3. Phase 1 — the gate

Ordered. The ordering is the point: **the workflow is restructured and its job names proven
before Vercel is configured**, so Deployment Checks never references a name that is about to
disappear.

### 1.1 Restructure `ci.yml` — one PR

Six jobs become three. The three job `name:` values become a **public contract**: Vercel
matches Deployment Checks on them, and renaming one silently breaks promotion.

| Job      | Contents                                                                                        | Gate              |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| `verify` | `eslint --max-warnings 0` · `prettier --check` · `tsc --noEmit` · `knip` · PR-title commitlint  | —                 |
| `test`   | `vitest run --coverage`                                                                         | —                 |
| `e2e`    | `next build` (carrying `agent:index:check`, `prerender:check`, `size-limit`) · Playwright + axe | `needs: [verify]` |

Changes inside that PR, all of them:

1. **Delete the `build` job.** Pure duplication — `e2e` builds anyway, and the `prebuild` /
   `postbuild` guards run inside that build. Move the `size-limit` step (still
   `continue-on-error`) into `e2e` after its build.
2. **Merge `lint`, `typecheck`, `knip` into `verify`.** Worth ~1 billed minute; the real
   reason is three stable names instead of six.
3. **`e2e: needs: [verify]`** instead of `needs: build`. Drops the wait from 4 m 34 s to
   ~75 s while still refusing to spend 18 minutes on a tree that does not compile.
4. **PR-only cancellation** — `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`.
   A cancelled run on `main` means the check never reports, and that deployment never
   promotes. Drop the redundant `ci-` prefix from the group.
5. **`timeout-minutes` on every job** — `verify: 5`, `test: 10`, `e2e: 30` (already set).
   A hung job now holds a release gate open, not just the quota.
6. **Delete both `.next/cache` steps.** 6.37 GB across 36 entries, 59 % of a 10 GB ceiling
   the repo is already over. See §8.1 for the measurement that confirms or reverts this.
7. **`persist-credentials: false`** on every `actions/checkout`. Neither workflow pushes.
8. **Remove every Sentry variable from the build env** — not only the three write credentials.
   0.2 confirms Vercel has its own. **Corrected 2026-08-16; the original wording said to keep
   the two DSNs, and that is wrong once item 1 lands.**

**Why item 8 changed.** The original kept `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` "so the
build still exercises the Sentry-wrapped config". Harmless in a `build` job that never opens a
browser — but item 1 merges that build into `e2e`. `next.config.ts` applies `withSentryConfig`
**only when a DSN is present**, and the wrapper turns on `reactComponentAnnotation`, which puts
a `data-sentry-*` attribute on every component in the DOM, plus the `/monitoring` tunnel route.
Keeping the DSNs would therefore point 44 Playwright specs and every axe scan at a build they
were never written against, and — because `NEXT_PUBLIC_SENTRY_DSN` is inlined at build time —
boot the browser SDK during the suite, forwarding CI traces to the real Sentry project through
that tunnel. An unmeasured change of build shape does not belong in the PR that establishes the
gate.

So `e2e` builds with no Sentry variables, exactly as that job does today. **What is given up:**
CI no longer proves the Sentry-wrapped config builds. Vercel proves it on every production
build, and a failure there yields no deployment at all — production keeps serving, the same safe
outcome as a red check. If the proof is wanted back, `SENTRY_DSN` alone on the build **step**
restores it without reaching the suite: step-scoped `env:` never reaches the Playwright web
server, and the client SDK needs the `NEXT_PUBLIC_` copy it would not have. It still changes the
DOM under test, so it belongs in its own PR behind a green E2E run.

Not in this PR: path filtering (§5), which would create staged deployments with no checks
before the gate is proven.

### 1.2 Prove the names exist

Merge 1.1. Confirm three check runs named `verify`, `test`, `e2e` appear on the merge commit
before touching Vercel.

### 1.3 Configure Deployment Checks

Vercel → Project → Settings → Build and Deployment → Deployment Checks → **Add Checks** →
provider **GitHub** → select `verify`, `test`, `e2e`.

**As of 2026-08-16 the panel reads "No checks configured", and that is the correct state.** The
only names Vercel could offer today are the current six — `Lint`, `Typecheck`, `Unit tests`,
`Knip (unused code)`, `Build`, `E2E (Playwright)` — and 1.1 deletes all of them. Configuring
anything here before 1.2 produces exactly the state §11 names as the one to avoid.

Prerequisite from Vercel's docs: automatic aliasing for production must stay **on**.
Deployment Checks gates the alias; it does not need manual promotion. Confirmed on 2026-08-16 —
**Auto-assign Custom Production Domains** is enabled.

### 1.4 Prove the gate holds

§8.2. Until this passes, the gate is a belief.

---

## 4. Phase 2 — correctness and developer workflow

None of this blocks Phase 1, and none of it touches the gate.

| Change                                                                                   | File / place                                       | Class                    |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| `eslint --fix --max-warnings 0` in lint-staged                                           | `.lintstagedrc.json`                               | **Required**             |
| `squash_merge_commit_title` → `COMMIT_OR_PR_TITLE`                                       | GitHub repo settings                               | **Required**             |
| PR-title commitlint step inside `verify`                                                 | `.github/workflows/ci.yml`                         | **Strongly recommended** |
| `.claude/settings.local.json` added to the repo's ignore list                            | `.gitignore`                                       | **Strongly recommended** |
| Correct the "git-ignored" claim now that it is true repo-wide                            | `.prettierignore`                                  | Cleanup                  |
| `* text=auto eol=lf`; mark the three generated files                                     | `.gitattributes` (**new**)                         | **Strongly recommended** |
| `src/config/env.ts` → `src/env.ts`; `src/features/command-menu` → `src/command-menu`     | `.env.example`                                     | **Required**             |
| `node-version-file: .nvmrc`; delete the input and both `NODE_VERSION` blocks             | `.github/actions/setup/action.yml`, both workflows | Cleanup                  |
| `concurrency: {group: release-please, cancel-in-progress: false}` + `timeout-minutes: 5` | `.github/workflows/release-please.yml`             | **Strongly recommended** |
| `timeout-minutes` + `persist-credentials: false` + non-failing moderate-level summary    | `.github/workflows/audit.yml`                      | **Strongly recommended** |
| Coverage / size-limit / prerender counts into `$GITHUB_STEP_SUMMARY`                     | `ci.yml`, `scripts/check-prerender.ts`             | Optional                 |
| `actionlint`                                                                             | —                                                  | Optional — see below     |

**On `squash_merge_commit_title`.** It is currently `PR_TITLE`, which is the actual cause of
the five non-conventional commits on `main` and the changelog gaps behind them.
`COMMIT_OR_PR_TITLE` makes GitHub use the commit's own title when a PR has one commit — a title
`commitlint` already validated. That fixes every Dependabot PR and every small PR at zero cost.
The `verify` step covers what is left.

**On `actionlint`.** Pass 2 put it in `verify`; that was inconsistent with this repository's
own supply-chain posture. Every third-party action here is SHA-pinned, and adding either a
`curl | bash` installer or another action to lint three rarely-changing files buys little.
[`decisions.md`](./decisions.md) already records the local invocation
(`docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint`). **Prefer that, run by hand when
a workflow changes.** Not a CI job.

---

## 5. Phase 3 — optional, after the gate is proven

**Path filtering.** `paths-ignore: ['docs/**', '.claude/**', '*.md']` on both triggers.

Safe for content: the authored prose corpus is `src/content/prose/*.ts`, and there is no
`*.md` anywhere under `src/` or `public/`. Measured value: 11 of the last 80 non-merge commits
(14 %) touch only those paths.

**The consequence, stated plainly.** A skipped workflow creates no check runs, so a docs-only
push to `main` produces a staged deployment that never promotes. It is not a hang — the next
real commit supersedes it — but **production can trail `main` by documentation commits**.
Since `docs/` is not part of the build, no visitor sees a difference; the deployed SHA simply
stops matching `main`, which muddies Sentry release correlation.

All 11 measured docs-only commits were direct pushes to `main`, not PRs, so restricting the
filter to `pull_request` would save close to nothing. It is both triggers or neither.

Gated on 0.4. If shipped, record the trailing-SHA consequence in `decisions.md` in the same
change, or a future reader will find a staged deployment and think the gate is broken.

---

## 6. Target pipeline

```text
DEVELOPER
  git add
     │
     ├─ pre-commit   lint-staged: eslint --fix --max-warnings 0 · prettier --write   ~1-3 s
     │
  git commit
     │
     ├─ commit-msg   commitlint --edit                                              ~0.4 s
     │
  git push                     (no pre-push — see §7)


GITHUB ACTIONS — ci.yml
  on: push:[main] · pull_request:[main]
  concurrency: ci-${{ github.ref }}, cancel-in-progress ONLY on pull_request
  permissions: contents: read · every job timeout-minutes · checkout persist-credentials: false

     ┌─ verify   eslint --max-warnings 0 · prettier --check · tsc --noEmit · knip
     │           + commitlint on the PR title   (if: pull_request)      ~75 s → 2 billed
     ├─ test     vitest run --coverage (node + jsdom)                   ~2 m 51 s → 3 billed
     └─ e2e      needs: [verify]
                 next build  → agent:index:check · prerender:check · size-limit
                 playwright ×2 projects + axe                           ~18 m → 19 billed

  caches: pnpm store (setup-node) · ms-playwright        .next/cache DELETED
  artifacts: playwright-report, on failure only, retention-days: 7


MERGE / PUSH TO main
     │
     ├──▶ VERCEL builds a production deployment ────▶ state: STAGED
     │       production env vars · Vercel's own build cache
     │       reachable at its deployment URL · NOT on the production domain
     │
     └──▶ CI runs on the same SHA: verify · test · e2e
                     │
          Vercel reads those three check runs
                     │
          ┌──────────┴──────────┐
      all pass               any fail / cancelled / timed out
          │                       │
          ▼                       ▼
    aliased → CURRENT       stays STAGED indefinitely
    instant, no rebuild     previous deployment keeps serving
                            override: Force Promote
                            rollback: Instant Rollback (re-alias, no rebuild)

PULL REQUEST BRANCHES
     └──▶ VERCEL Preview deployment   (dependabot/** excluded — vercel.json, unchanged)

SCHEDULED                          RELEASE
  audit.yml  06:00 UTC daily         release-please.yml  on push:[main]
  pnpm audit --prod --audit-level    concurrency: release-please (serialize, never cancel)
  high  (+ moderate summary)         maintains the release PR → tag on merge
```

---

## 7. Rejected — do not reintroduce without new evidence

| Idea                                   | Rejected because                                                                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deploying to Vercel from Actions**   | Self-defeating: disabling `deploymentEnabled.main` removes the staged build a gate needs. Also +2–3 billed min/merge, a deploy token, and moves the production build off Vercel              |
| **gitleaks**                           | Unpinned external binary in a repo that pins its toolchain; likely false positives on `.env.example`; measured exposure near zero — `.env*` is gitignored and only `.env.example` is tracked |
| **A dedicated PR-title CI job**        | A repository setting does most of the work for free; the remainder is 2 s inside `verify`, not a rounded-up billed minute per run                                                            |
| **A pre-push hook, initially**         | Measured at 2.5 s for typecheck-only, so it is defensible — but under the gate a failed CI is now a _soft_ failure. Add it the first time a type error burns a run, not before               |
| **CodeQL**                             | **Unavailable.** Code scanning on private repos needs GitHub Team/Enterprise with Code Security                                                                                              |
| **SBOM**                               | Nothing is published or distributed. No consumer exists                                                                                                                                      |
| **Provenance / artifact attestations** | Attest to published artifacts. The artifact here is a website Vercel builds                                                                                                                  |
| **Merge queue**                        | Paid, and it serializes merges for one developer. Deployment Checks is the free equivalent of the guarantee wanted                                                                           |
| **Playwright sharding**                | Already measured and rejected in `decisions.md`; on a metered plan extra shards multiply fixed setup cost. Revisit above ~25 min pure test time                                              |
| **Artifact sharing between jobs**      | Moot once the duplicate build is deleted; 500 MB is shared with Packages and the round trip ≈ the rebuild                                                                                    |
| **More caching**                       | The repo is _over_ its 10 GB cache ceiling. The correct direction is less                                                                                                                    |
| **Reusable workflows**                 | Three workflows and one composite action. Abstraction with one caller is cost without benefit                                                                                                |
| **Additional Actions environments**    | **Unavailable** on Free/private, and Vercel's Staged / Promoted / Current states already provide the staging concept                                                                         |
| **GitHub Pro**                         | The production guarantee now comes from Vercel at no cost. Revisit when a second person commits to this repository, not on a date                                                            |

---

## 8. Validation

### 8.1 Phase 1 — the workflow

| Prove                         | How                                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing was lost in the merge | `pnpm validate` locally — it covers exactly what `verify` + `test` now run in one job                                                                                                           |
| Workflow YAML is valid        | `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint` before pushing                                                                                                                      |
| Three jobs, three names       | The PR's own run. Confirm the check-run names are exactly `verify`, `test`, `e2e`                                                                                                               |
| `e2e` still gates on `verify` | Push a deliberate lint error on the PR branch; confirm `e2e` reports **skipped**, not started                                                                                                   |
| **Cold build is acceptable**  | Read the `next build` step duration in the PR's `e2e` job — no cache exists for it. Warm was **36 s**. Accept under ~90 s; above that, restore the two cache steps and keep the storage problem |
| PR-only cancellation          | Push twice in quick succession to the PR branch — the first run cancels. Then merge and push twice to `main` — neither cancels                                                                  |

### 8.2 Phase 1 — the gate. **The acceptance criterion.**

> _Prove that a failing CI run cannot promote a production deployment._

Designed to cost ~3 billed minutes rather than ~27, by failing the **cheapest** job:

1. Note the SHA currently serving the production domain.
2. Commit a deliberate lint error to `main` — an unused import is enough.
3. Observe: `verify` fails in ~75 s. `e2e` never starts (`needs: verify`). Total ≈ 3 billed minutes.
4. **Assert, in Vercel:** a new production deployment exists in state **Staged**, and the
   production domain still serves the SHA from step 1.
5. Revert the commit. Observe all three checks pass and the deployment alias to **Current**.
6. **Assert:** the production domain now serves the revert commit.

If step 4 shows the deployment already **Current**, the gate is not working — check that the
Deployment Check names match the job names exactly, and that the checks are attached to the
commit Vercel deployed.

### 8.3 Rollback validation

Perform once, while the mechanism is fresh: Vercel → Deployments → an earlier **Current**
deployment → **Instant Rollback**. Confirm the production domain re-aliases with no rebuild.
Then roll forward the same way. This is the incident procedure; it should not be first
attempted during an incident.

### 8.4 Phase 2

| Change                     | Proof                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| lint-staged strictness     | Stage a file with an unused variable; the commit must fail                                   |
| Squash title setting       | Merge the next single-commit PR; confirm the resulting subject is the commit's, not the PR's |
| PR-title commitlint        | Open a PR titled `broken title`; `verify` must fail on the title alone                       |
| `.gitattributes`           | `git add --renormalize . && git status` — must report nothing to commit                      |
| `.env.example`             | Both paths resolve: `ls src/env.ts src/command-menu`                                         |
| `node-version-file`        | The setup step logs Node 24 with no `NODE_VERSION` anywhere in the workflows                 |
| release-please concurrency | Two pushes to `main` inside a minute; the second run queues rather than racing               |

---

## 9. Resource impact

Recomputed from measured job durations, not carried over. **GitHub rounds each job up to the
next whole minute**, which is why six short jobs cost more than their wall time.

| Metric                       |           Now |           After | Basis                                                     |
| ---------------------------- | ------------: | --------------: | --------------------------------------------------------- |
| Billed minutes per run       |        **27** |         **~24** | measured durations + documented per-job round-up          |
| Wall clock to verdict        | **22 m 41 s** |  **~19 m 30 s** | measured; assumes cold build adds ~25 s to `e2e`          |
| Jobs per run                 |         **6** |           **3** | measured                                                  |
| Dependency installs per run  |         **6** |           **3** | measured — ~26 s each                                     |
| `next build` runs per change |         **3** |           **2** | measured — CI `build`, CI `e2e`, Vercel → `e2e`, Vercel   |
| Cache footprint              |  **10.72 GB** |     **~3.6 GB** | measured composition: nextjs 6.37 GB / 36 entries removed |
| Cache vs 10 GB ceiling       |  **7 % over** | **~64 % under** | measured                                                  |
| Artifact storage             |    **< 1 MB** |      **< 1 MB** | measured — 512 artifacts, 511 expired. Unchanged          |
| Monthly minutes              |    **~1,573** |      **~1,400** | derived from 57 executed CI runs / 30 days                |
| …with path filtering (§5)    |             — |      **~1,310** | derived — 14 % of runs skipped                            |
| Share of the 2,000 allowance |      **79 %** | **70 % → 65 %** | derived                                                   |

**Corrections to the second-pass estimates.** That review projected 23 billed minutes, a
18 m 36 s verdict and ~60 % of allowance. Recomputing honestly: `e2e` measures 18 m 03 s, which
rounds to **19** billed minutes, not 18 — so the total is **24**, not 23. And deleting the
Next cache is **roughly time-neutral**, not a 36 s saving per job: it removes a ~20 s restore
and a ~19 s post-job save but adds an unmeasured cold-build delta. Its justification is the
storage ceiling, which is decisive on its own.

Measured values come from CI run `31954042434` and the Actions cache, artifact and run-list
APIs. Derived values are marked as such and depend on the run mix staying similar.

### Remeasured 2026-08-16 — these supersede the derived rows above

**The derived rows were wrong, and the reason is worth keeping.** The table extrapolates from
"57 executed CI runs / 30 days". The real count from 2026-08-01 is **288 CI runs** — but that
month straddles two different pipelines. Four workflows this plan never accounted for were still
running until the 7th: **CodeQL (126 runs), PR Title (295), Dependabot auto-merge (107) and OSSF
Scorecard (19)**. Commit `46e43e9` — _"ci: remove workflows that cannot run on a private repo"_,
2026-08-07 — deleted all four. Any month-level average of August is therefore meaningless, and
the figures below measure only the nine days after that cleanup.

| Measured 2026-08-16              | Value                                                    | Source                                    |
| -------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| **Actions minutes this cycle**   | **1,863 of 2,000 — 137 left, resets 2026-09-01**         | Billing → Plans and usage — authoritative |
| Executed CI runs, 08-08 → 08-16  | 67 — 52 passed, 8 failed, 7 cancelled                    | run-list API, 9 days                      |
| Dependabot runs never executed   | 32 in `action_required` — consume nothing                | same                                      |
| Release Please runs, same 9 days | **45** — five a day, each a rounded-up billed minute     | same                                      |
| Audit runs, same 9 days          | 9                                                        | same                                      |
| **Cache footprint**              | **9.98 GB of the 10 GB ceiling — 99.8 % full**           | cache-usage API                           |
| Cache composition                | 53 entries: **36 `Linux-nextjs`**, 16 pnpm, 1 Playwright | cache-list API                            |
| Actions storage                  | 0.1 GB of 0.5 GB included                                | Billing                                   |

**What this changes.**

- **Deleting the Next cache is the most urgent item in the plan, not housekeeping.** At 99.8 %
  of the ceiling the next write starts evicting. The plan's count of 36 `Linux-nextjs` entries
  was exactly right; only its total was stale.
- **The minutes ceiling is real and close** — 137 left is about five full runs at today's 27.
  §12 carries the arithmetic.
- **Release Please is a measurable line item.** ~150 minutes a month to maintain one PR. Its
  Phase 2 `concurrency` block is worth pulling forward on cost alone.
- **Dependabot is the largest single driver of run volume, and this plan does not address it.**
  Reducing its schedule or grouping updates harder would save more than anything proposed here.
  Out of scope, but it is the bigger lever and should not stay unsaid.

**What this does not change.** Every §7 rejection resting on billed minutes still holds. The
account is metered and nearly exhausted; `$0 billable` means Actions **stops** rather than
charges. The `27 → ~24` per-run figure is confirmed against run `31954042434`, whose six jobs
measured 47 s, 45 s, 31 s, 2 m 51 s, 1 m 34 s and 18 m 03 s.

**Two API notes, so nobody repeats the confusion.**
`GET /users/:user/settings/billing/actions` now returns **410 Gone**; the replacement is
`…/settings/billing/usage`. That endpoint reports 4,142 minutes for this repository in August,
which does **not** agree with the 1,863 the dashboard counts against the included allowance —
the dashboard is authoritative and the discrepancy is unexplained. Separately,
`/actions/runs/:id/timing` reports `total_ms: 0` for every job; that is what "covered by the
included allowance" looks like, not "free".

---

## 10. Where each change lands

### Repository

| File                                   | Change                                                                                                                      | Why                                               | Risk                                       | Validation            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ | --------------------- |
| `.github/workflows/ci.yml`             | Three jobs; timeouts; PR-only cancellation; cache steps deleted; Sentry token removed; `persist-credentials`; PR-title step | The whole of Phase 1                              | Medium — the gate depends on the job names | §8.1, §8.2            |
| `.github/workflows/release-please.yml` | `concurrency` + `timeout-minutes`                                                                                           | Two rapid pushes race a write-privileged job      | None                                       | §8.4                  |
| `.github/workflows/audit.yml`          | `timeout-minutes`; `persist-credentials`; moderate-level summary step                                                       | Quota and signal                                  | None                                       | Next scheduled run    |
| `.github/actions/setup/action.yml`     | `node-version-file: .nvmrc`; delete the required input                                                                      | One source of truth for Node                      | Low                                        | §8.4                  |
| `.lintstagedrc.json`                   | `--max-warnings 0`                                                                                                          | 26 rules resolve to warn severity                 | None — repo is at zero warnings            | §8.4                  |
| `.gitignore`                           | `.claude/settings.local.json`                                                                                               | Ignored today only by one machine's global config | None                                       | `git check-ignore -v` |
| `.gitattributes`                       | **New.** `* text=auto eol=lf`, binary marks, `linguist-generated`                                                           | LF is assumed in three places, enforced in none   | Low — renormalize once                     | §8.4                  |
| `.prettierignore`                      | Correct the "git-ignored" comment                                                                                           | It is only true once `.gitignore` carries it      | None                                       | read it               |
| `.env.example`                         | Two stale paths                                                                                                             | Neither `src/config/` nor `src/features/` exists  | None                                       | §8.4                  |
| `scripts/check-prerender.ts`           | Also write to `$GITHUB_STEP_SUMMARY` when set                                                                               | Numbers on the run's front page                   | None                                       | next run              |
| `docs/architecture.md`                 | **§10 only**, after Phase 1 lands                                                                                           | "Nothing stops a red push but you" becomes false  | None                                       | read it               |
| `docs/decisions.md`                    | One entry, when the plan completes                                                                                          | The reasoning behind the new §10                  | None                                       | —                     |
| `docs/pipeline-plan.md`                | This file — **deleted** when the last phase lands                                                                           | House convention for a bounded plan               | None                                       | —                     |
| `README.md`                            | CI section: three jobs, and the gate                                                                                        | It currently describes six jobs and no gate       | None                                       | read it               |

**Not changed: `vercel.json`.** Pass 1 proposed `deploymentEnabled.main: false`; that is
withdrawn and would break the gate. The existing `dependabot/**` exclusion stays exactly as it is.

### GitHub repository settings

| Setting                     | From       | To                   | Why                                                  |
| --------------------------- | ---------- | -------------------- | ---------------------------------------------------- |
| `squash_merge_commit_title` | `PR_TITLE` | `COMMIT_OR_PR_TITLE` | Root cause of the non-conventional commits on `main` |

### Vercel dashboard

| Setting                                     | Action                                             | Phase |
| ------------------------------------------- | -------------------------------------------------- | ----- |
| Environment Variables                       | Confirm `SENTRY_AUTH_TOKEN` present; add if not    | 0.2   |
| Build and Deployment → Deployment Checks    | Add GitHub checks `verify`, `test`, `e2e`          | 1.3   |
| Environments → Production → Branch Tracking | Leave **Auto-assign Custom Production Domains ON** | 1.3   |

### Account level

| Item                        | Action                                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| Settings → Billing          | Read actual Actions usage (0.3)                                         |
| Settings → Billing → limits | Optionally set a $0 spending limit so overage fails loudly, not quietly |

---

## 11. Rollback

Nothing here is one-way, and no step can leave production undeployable.

| Change                | Revert                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deployment Checks** | Remove the checks in Vercel settings — promotion returns to automatic immediately. A deployment already stuck in **Staged** is released with **Force Promote**. No code involved |
| **`ci.yml`**          | `git revert` the PR. The gate degrades safely: if the job names vanish, deployments stay Staged and Force Promote is the manual path until the names are restored                |
| **Sentry token**      | Re-add the three env entries to the build step. Only the interval's source maps are missing, and re-running the job restores them                                                |
| **Cache removal**     | Re-add the two `actions/cache` steps. The keys are unchanged, so the next run repopulates                                                                                        |
| **Path filtering**    | Delete the `paths-ignore` blocks. Any deployment stranded by a skipped run is released with Force Promote or superseded by the next commit                                       |
| **Squash setting**    | Flip it back. Affects only future merges                                                                                                                                         |

**The one state to avoid** is Deployment Checks referencing job names that no longer exist —
every production deployment would sit Staged. §3's ordering prevents it, and Force Promote is
the escape hatch if it happens.

---

## 12. Implementation order

1. **Phase 0.** Answer 0.1–0.4. Blocks everything.
2. **0.2 remediation, if needed.** Add `SENTRY_AUTH_TOKEN` to Vercel before Phase 1 touches it.
3. **Phase 1.1.** The `ci.yml` PR. Validate with §8.1 on the PR itself — including the cold-build
   number, which decides whether the cache deletion stands.
4. **Merge 1.1, then 1.2.** Confirm `verify`, `test`, `e2e` appear as check runs on `main`.
5. **Phase 1.3.** Configure Deployment Checks. Not before step 4.
6. **Phase 1.4 / §8.2.** The acceptance test. **The gate is not real until this passes.**
7. **§8.3.** Rollback drill, once, deliberately.
8. **Phase 2.** The `verify` PR-title step ships with 1.1 if convenient; everything else is
   independent and can land in one hygiene PR.
9. **Phase 3 / §5.** Path filtering, only if 0.4 is yes, and only after the gate is proven.
10. **Retire.** Update `architecture.md` §10 and `README.md`, append one `decisions.md` entry
    covering the gate and the rejections in §7, and **delete this file**.

Ordering rationale: nothing configures Vercel against unstable names (step 5 after 4); no
Sentry gap opens (step 2 before 3); no stranded deployments before the gate is understood
(step 9 last); and the most expensive validation is designed to cost ~3 billed minutes rather
than ~27 (§8.2).

### Budget for this cycle — 137 minutes

Recorded 2026-08-16. The instruction is to run the whole plan now rather than split it across
the 2026-09-01 reset. The arithmetic, at ~24 billed minutes per run once 1.1 lands:

| Step                                        | Cost | Running total |
| ------------------------------------------- | ---: | ------------: |
| 1.1 — the PR's own run                      |  ~24 |            24 |
| Merge 1.1 → the run on `main`               |  ~24 |            48 |
| §8.2 — deliberate lint error, `verify` only |   ~3 |            51 |
| §8.2 — the revert's full run                |  ~24 |            75 |
| Phase 2 — hygiene PR and its merge          |  ~48 |           123 |

**123 of 137, with nothing left for a retry.** One flaky E2E run, one Dependabot PR approved, or
one unrelated push takes the cycle over. Going over means Actions stops — and once 1.3 is
configured, Actions stopping means **nothing promotes** (§13). Phase 1 fits with ~62 minutes to
spare; Phase 2 is the part that does not, and landing it after the reset costs nothing.
Phase 3 does not fit at all this cycle.

Two ways to buy room if it is wanted: pause Dependabot for the rest of the cycle, or land
Phase 2's `release-please` `concurrency` block early — 45 runs in 9 days is ~150 minutes a
month.

---

## 13. Guarantees

### Held after this plan

- **Unverified code cannot reach the production domain.** Lint, type, unit-test, E2E and
  accessibility failures all leave the deployment Staged.
- **A failed CI run leaves the previous production deployment serving.** Failure is degradation
  to "no update", never to a broken site.
- **A cancelled or timed-out run on `main` cannot silently promote** — an incomplete check is
  not a passing check.
- **Production runs Vercel's own build**, with production environment variables and Vercel's
  build cache. The gate does not change what ships.
- **No Vercel deploy credential exists in GitHub.** Vercel reads GitHub; GitHub never writes to
  Vercel.
- **PR builds do not receive the Sentry write credential.**
- **Dependencies install reproducibly** — `--frozen-lockfile`, `packageManagerStrict`, and a
  24-hour `minimumReleaseAge` floor. Unchanged, and already strong.
- **CI stays inside GitHub Free limits** — ~24 billed minutes per run, cache back under its
  ceiling, artifacts on failure only.
- **Rollback is one click and no rebuild.**

### Not held — stated, not hidden

- **A bad commit can still land on `main`.** Branch protection and required checks need a paid
  plan. The commit cannot _ship_, which is the half that matters, but `main` is writable.
- **CI's build and Vercel's production build are separate builds.** CI proves the source is
  good; it does not prove that particular artifact is the one promoted.
- **Vercel-only runtime and environment failures are not covered** — a missing environment
  variable in the Vercel project passes the gate. The fix is a smoke check against the staged
  deployment URL via `repository_dispatch` on `vercel.deployment.ready`, reported back as its own
  Deployment Check. Deliberately deferred: it is real machinery, and it closes a failure mode
  that has not occurred, while the gate closes one that has.
- **If path filtering ships, production may trail `main`** by documentation-only commits.
- **A committed secret is caught by nothing.** Secret scanning and push protection are
  unavailable on Free/private, and gitleaks was rejected (§7). Exposure is low — `.env*` is
  gitignored and every variable is optional — but it is not zero.
- **`--no-verify` bypasses both hooks.** By design; CI and the gate are the enforcement.
- **Exhausting the Actions allowance freezes production.** The sharpest edge the gate
  introduces, and the least obvious. No minutes → no check runs → no results for Vercel to read
  → every production deployment sits **Staged** indefinitely. The site keeps serving the last
  promoted build and nothing ships until the allowance resets. Recoverable with **Force
  Promote**, one click per deployment, but it has to be known before it happens rather than
  diagnosed during it. As of 2026-08-16 that is 137 minutes away — roughly five runs. This risk
  did not exist before the gate: today an exhausted allowance means "no checks ran", and the
  deployment goes live anyway.
