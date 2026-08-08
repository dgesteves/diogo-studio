# Decisions

One dated entry per decision that has a rationale worth keeping. Newest first.
Add an entry when a choice would otherwise be re-litigated or silently reversed —
not for every change.

---

## 2026-08-08 — Real work shipped under `docs:` commits; the changelog is incomplete

Recording this because the history now lies and nothing else will say so.

`b72c1e5` and `ce66ecc` are both typed `docs:`. The first deletes the whole
`career-graph` feature (47 files). The second is **74 files / 1,384 insertions** and
contains `typedRoutes` + `cacheComponents`, `scripts/check-prerender.ts`, the
`(marketing)` → `(world)` rename, the station-index split, `mulberry32`, the
`Math.random()` seeding fix, the Phase 0 lint caps, two rewritten E2E specs, a CI
change, and three real bug fixes in `command-menu-ask.tsx` /
`ask-answer-formatting.tsx` — one of which is a **user-visible behaviour change**
(an internal-looking href that is not a real route now renders as plain text).

`release-please-config.json` maps `docs` to a Documentation section, so the next
release cuts a patch bump whose Features, Bug Fixes and Performance sections are all
empty. None of the above appears in `CHANGELOG.md`, and the behaviour change ships
unannounced. The `commit-msg` hook cannot catch this — `docs:` is a valid type, so
commitlint passes. Only the author choosing the right type catches it.

Not rewritten: `main` is unprotected but shared history, and a force-push to relabel
two commits is a worse trade than a note. The rule that was already written in
`00-core.md` ("the **accurate** type so the changelog stays complete… one logical
change each, not one squashed mega-commit") stands; these two commits are the
counter-example, not the precedent.

## 2026-08-08 — RTTR adopted, and the R3F coverage estimate replaced with a measurement

`@react-three/test-renderer@9.1.1` is installed and testing-plan Phase 0's spike
exists at `features/studio/components/scene/scene.test.tsx` — the current cluster
root, so restructure Phase 4 carries it with `git mv`.

**It did not work out of the box, and the failure is worth writing down** because the
error names the wrong library. Every render died on `Cannot assign to read only
property 'position' of object '#<Mesh>'`, preceded by `THREE.WARNING: Multiple
instances of Three.js being imported`. There is only one physical copy of three in the
store: the duplication is **format**, not version. `@react-three/fiber` ships no
`exports` field, so vitest resolved its CJS `main`, that copy required `three.cjs`,
and `src/` imported `three.module.js`. Two `Mesh` identities means fiber's
`applyProps` assigns instead of calling `.copy()`, and `Object3D.position` is a
read-only accessor. Fixed with `resolve.mainFields` preferring `module` plus
`server.deps.inline` for the three `@react-three/*` packages. `deps.inline` alone does
**not** fix it — the upstream issues (vitest#4207, r3f#2856, three#32142) are full of
people who tried only that.

**The measurement the plan demanded.** §5.2 flagged its own 75% R3F target as "an
estimate, not a measurement" governing 79 files, and required the spike to report what
it actually achieves. Rendering `StudioScene` headlessly gives **100% statements on
`studio-scene.tsx`** and **84.65% statements / 53.06% branches / 98.09% functions**
across the whole 40-file `scene/` cluster, from four tests. Repo-wide statements went
**11.39% → 28.82%**.

So the statement target was conservative and the strategy is validated. The honest
caveat is the branch number: declarative smoke rendering reaches statements almost for
free and conditional branches barely at all, so **branches are the real work in Phase
6**, not statements. Plan against 53%, not 84%.

## 2026-08-08 — Destination content split from its scalar index

`constants/station-index.ts` now owns the scalar projection of every destination —
`slug`, `href`, `label`, sector grouping, and `resolveStation()`. Client islands import
only that. `constants/destinations.ts` joins it with authored content and is imported
only by server components.

**The problem, measured.** `destination-view.tsx` is a Server Component and the only
consumer of `.blocks`. But six client modules imported the destination collection to
read three scalar fields each, and `sectors.ts` imported all ten content modules to
feed `deck-sector-list.tsx` (`"use client"`). Because these are whole objects, that
dragged every page's prose into a client chunk: **27 KB raw / 10 KB gzipped of text
that nothing in the browser reads**, shipped to every visitor. Tree-shaking cannot
help — the reads are on runtime objects, not module exports.

**Result:** the prose is gone from `.next/static/chunks` (verified by grepping for four
distinct sentences: 0 hits, was 1 chunk) and still present in the prerendered HTML, so
the crawlability non-negotiable holds. Bundle **837.93 → 830.29 kB gzipped**.

The important property is the slope, not the 7.6 KB: the old shape grew the client
bundle with every essay, case study and timeline entry added. It no longer does.

**No duplication.** `href` is always `routes[slug]`, so it is derived, not restated;
`label` moved into the index and the ten `destinations-*.ts` files now spread
`getStationEntry(slug)`. `station-index.test.ts` asserts the index and the content
collection still agree, which is the guard that keeps the split honest.

`sectors.ts` was deleted: after the repoint its only importer was its own test — the
same trap `constants/career.ts` is flagged for in `AGENTS.md`, and `knip` does not
catch it. Its invariants moved to `station-index.test.ts` (7 tests). An earlier
version of this entry said "81 tests, up from 76" as if that were the suite total; the
suite was **92** after this commit, so the number was wrong on both readings.

## 2026-08-08 — `app/(marketing)` renamed to `app/(world)`

The group's actual job is "every page that mounts the 3D world shell" — its layout
wraps `WorldStage`, `BootSplash`, `CommandDeck` and `WorldAudio`. Nothing about it is
marketing. Route groups do not affect URLs, so this is a pure rename.

Rejected at the same time: splitting `app/` into `(frontend)` and `(server)` groups.
In the App Router every `page.tsx` **is** server code — all 17 are Server Components
prerendered to static HTML — so a `(frontend)` group would contain no frontend-only
code. The client boundary is `"use client"` and it lives in `features/`, not `app/`.
`page.tsx` vs `route.ts` already separates pages from endpoints by file convention.
That FE/BE folder split is a Pages Router idiom and does not carry over.

Add a second group when a route needs **different chrome** — a legal or changelog page
that should not boot the 3D world. That is what route groups are for.

## 2026-08-08 — Adopted `typedRoutes`, `cacheComponents` and `use cache`

All three are on. Measured before committing, not assumed.

**`typedRoutes` — unambiguously worth it.** It produced exactly 4 type errors and did
**not** flag `constants/routes.ts` or `Destination.href`, confirming the typed SSOT
already satisfied it. Three of the four were real bugs it exposed, and all four were
fixed with **zero casts**:

- `config/navigation.ts` typed `NavItem.href` as `string`, widening the SSOT back to
  a string — `href: "/typo"` in `primaryNav` would have shipped. Now `RoutePath`.
- The `links` content block was `{ href: string; external?: boolean }` — a loose
  boolean flag where `external` decides whether the value must be a real route. Now a
  discriminated `ContentLink` union, per `typescript.md`.
- `command-menu-ask.tsx` called `router.push()` on a **citation href derived from
  model output**, unvalidated. Now narrowed through `asInternalHref()`.
- `ask-answer-formatting.tsx` rendered `<Link>` from sanitised LLM markdown. Same
  guard. **Behaviour change:** an internal-looking href that is not a real route now
  renders as plain text instead of a link to a 404.

`asInternalHref()` in `constants/routes.ts` uses a type predicate, not an assertion,
so there is no `as` anywhere in this change.

**`cacheComponents` + `use cache` — adopted early, deliberately.** There is nothing
to cache today: no data fetching, and all 17 pages were already static. The reason to
adopt now is that the migration surface is _2 route handlers and 1 sitemap_, and
project/company data is expected later; doing it now means new data-fetching features
are written in the target model instead of being retrofitted.

What it cost:

- `/api/health` lost `dynamic = "force-dynamic"` and `revalidate = 0` (incompatible;
  route handlers are dynamic by default under this model anyway).
- `/api/chat` lost `runtime = "edge"` (incompatible). Verified the Node runtime still
  streams: `Transfer-Encoding: chunked`, `x-agent-sources` and `cache-control:
no-store` intact, real streamed completion. Vercel now steers streaming AI routes
  toward Node/Fluid Compute anyway, and the OpenAI round-trip dominates latency, so
  this is roughly neutral rather than a regression.
- `/sitemap.xml` **silently de-optimised** from static to dynamic, because `new Date()`
  is an uncached dynamic API. Fixed with `"use cache"` + `cacheLife("max")` — the
  content only changes on deploy. Now `○ /sitemap.xml 30d 1y`.

That last point is the whole risk of this model and it is why the guard below exists.

## 2026-08-08 — `prerender:check` guards static rendering

`scripts/check-prerender.ts`, wired to `postbuild`. It asserts every route in
`constants/routes.ts` plus `/sitemap.xml` and `/robots.txt` appears in
`.next/prerender-manifest.json`, and fails the build otherwise.

Built **before** enabling `cacheComponents`, not after, and it earned that ordering
immediately: the first build with the flag on failed with `✗ /sitemap.xml`. Without it
the site would have shipped a dynamic sitemap and nothing would have said so — Next
does not warn when a route de-optimises, and static rendering is this site's main
performance asset.

It also closes a second gap for free: a route in `routes.ts` with no corresponding
page never appears in the manifest, so this is the `routes.ts` ↔ `app/` parity check
that was previously missing. Verified it fails as intended by deleting entries from a
copy of the manifest.

## 2026-08-08 — The E2E suite was red on `main`; both failures fixed

Discovered while verifying the doc review, and worth recording because several docs
asserted the opposite. `pnpm e2e` was **16 passed / 2 failed**:

- **`content-pages.spec.ts` `/work` — a hard, deterministic failure.** It asserted an
  `<h2>` matching `/equally comfortable/` and text like `fueled · current`. Neither
  string exists anywhere in `src/` — the page renders an `<h1>` ("Eleven years on the
  surfaces users touch.") and a timeline whose items expose `period`, `title` and
  `org` separately ("Fueled · Lisbon / Remote"). The spec was written against a data
  shape that no longer exists and has been failing since the career-data
  consolidation. Rewritten to assert what renders, ordered newest-first.
- **`command-menu.spec.ts` Ask-mode suggestions — flaky, ~1 in 12.** Root cause: the
  ⌘K listener is attached in a `useEffect`, so it does not exist until React
  hydrates, and the test pressed the shortcut immediately after `goto`. No DOM state
  distinguishes server markup from hydrated markup here, so the fix retries the
  _keypress_ via `expect(...).toPass()` until it registers, in one shared
  `openWithShortcut` helper.

This mattered beyond the two tests. `AGENTS.md` claimed a green local `validate`
meant "CI failures should be rare"; `restructure-plan.md` §7 listed the Playwright
specs under "what makes this safe"; and `testing-plan.md` §3 calls E2E "the actual
harness that verifies 'pure move, no behaviour change'". A harness with a
permanently-red test and an unacknowledged flake cannot play that role — and the
`retries: 2` in `playwright.config.ts` is what let the flake stay invisible.

## 2026-08-08 — `toPass()` for readiness is allowed; `retries` for nondeterminism is not

`testing.md` said "fix flakes at the root; never `retry` around nondeterminism",
which read as banning both. The distinction that matters: retrying an **action**
until a precondition holds (hydration, an animation settling) is a web-first wait and
is the correct Playwright idiom. Configuring `retries` so a whole spec gets re-run
until it happens to pass is masking. `retries: 2` stays in CI for genuine
infrastructure flake, but a test that needs it is a bug to fix, not a cost to accept.

## 2026-08-08 — Test helpers live in `tests/`, not `src/test/`

Two docs disagreed. Root `tests/` wins on three counts, all free: it sits outside
the coverage `include` (`src/**`), so helpers never dilute the per-layer targets
the testing plan is built on; it sits outside the `src/**` ESLint block, so a
recording-context `Proxy` isn't fighting `no-explicit-any` and `max-lines` (note
the existing relaxations only match `src/**/*.test.{ts,tsx}`, so `src/test/helpers.ts`
would have got the _strict_ rules); and it keeps all test infrastructure next to
`tests/e2e/`. Cost: no `@/` alias — add a `@tests/*` path to `tsconfig.json` when
testing-plan Phase 0 creates the first helper. `vitest.config.ts` already globs
`tests/**`.

## 2026-08-08 — `max-lines-per-function` replaces `max-lines` as the real cap

Restructure Phase 0, landed early and deliberately out of order. `max-lines: 100`
was the documented cause of the file-shredding in `restructure-plan.md` Cause 1,
and two rule files had been rewritten to say "file length is not a design signal"
while lint still enforced it — the rules and the tooling openly contradicted each
other, and every contributor hit it.

Now: `max-lines-per-function` at 100 as an **error** (measured: zero violations
today; 28 at a 50-line cap, so 50 stays prose guidance not a gate), `max-lines` at
250, 120 for `.tsx`, and off for draw/layout/geometry/texture/data modules. Verified
no file exceeded the new caps beforehand, so this is a pure relaxation that cannot
break a build.

Unblocking this ahead of the test suite is deliberate: relaxing a lint cap moves no
code and changes no behaviour, so the "we cannot verify a pure move" argument that
blocks Phases 1–7 does not apply to it.

## 2026-08-08 — Cross-boundary import guardrails ship as warnings, ahead of the tests

`restructure-plan.md` §6 scheduled these for Phase 7 — last, after every dangerous
merge, which is backwards: their whole job is to stop new violations appearing while
the restructure is in flight. They are pure lint config with no behaviour risk, so
they landed now.

`warn` not `error` because there are 11 pre-existing violations, all reaching into
`features/studio/components/screens/canvas-texture`, which Phase 4 resolves by
moving that module into `world`. Promote to `error` once that count hits zero.

## 2026-08-08 — No `src/lib/`; infrastructure stays in named top-level folders

`project-structure.md` mandated `lib/` while `architecture.md` forbade it, and
`src/lib/` did not exist — so the rule was literally un-followable (a new file
obeying it would import `@/lib/cn`, which fails `tsc`; 25 files import
`@/utils/cn`).

Resolved by dropping `lib/`. It would have held exactly two files — one isomorphic
(`cn`) and one server-only (`rate-limit`) — mixing the two sides of the boundary
that `import "server-only"` exists to keep visible, under a name that says nothing.
That is the restructure plan's own Cause 3, "ownership is wrong so names lie". The
real complaint behind Phase 1 was one-file folders, and that is still addressed:
`telemetry/constants.ts` folds into `config/`, while `utils/` is a legitimate
namespace (now `cn` + `mulberry32`).

## 2026-08-08 — `size-limit` is a review signal, not a gate

Three docs said "review signal"; CI ran `pnpm size` as a hard step in the `build`
job. Resolved in CI's favour of the docs: the step is now `continue-on-error`.

Two reasons. A breach in `build` also sinks `e2e` via `needs: build`, so a 30 KB
bundle regression would have taken the entire accessibility suite offline. And the
1.3 MB budget is a heuristic for a 3D site whose real constraint is Core Web
Vitals — it should make a regression visible in the log, not block a merge.

## 2026-08-08 — `mulberry32` promoted to `src/utils/`

There were two independent copies (`studio/…/city-textures.ts` and
`world/…/bookshelf-layout.ts`), verified bit-identical across all seeds before
merging. Two importing features means the two-importer rule promotes it rather
than leaving it in either one — and a cross-feature deep import would have
tripped the new guardrail.

## 2026-08-08 — Canvas draw routines take a seeded PRNG

`lounge-tv-screen-draw.ts` called `Math.random()` directly, which makes the
recording-context snapshots in testing-plan Phase 5 worthless. `drawStatic` now
takes `mulberry32(tick)`. Static still differs between ticks; it is now
reproducible for a given tick.

## 2026-08-07 — Every env var is optional; features degrade

No `OPENAI_API_KEY` → `/api/chat` returns `503` with keyword-only matches. No
`UPSTASH_*` → in-memory token bucket. No Sentry DSN → Sentry skipped entirely.
A missing `.env.local` must never break the build or a route, so that a clone runs
with zero setup and CI needs no secrets. Preserve this when adding a variable.

## 2026-08-07 — No store library

Client state is hand-rolled external stores read via `useSyncExternalStore`.
`zustand` is not a dependency and adding one needs an entry here. The stores are
small, the pattern is ~20 lines each, and it keeps the client bundle honest on a
site whose budget is dominated by three.js.

## 2026-08-07 — The `e2e` job rebuilds instead of sharing `.next`

Sharing the `build` job's output would mean either an artifact upload of several
hundred MB against a 500 MB quota, or cache-key contention between two concurrent
jobs. One extra build is cheaper than both.

## 2026-08-07 — No roadmap document

`immersive-world-roadmap.md` drifted seven weeks and marked shipped features "not
started". This project is built exploratively, so any phase tracker in the repo
will be fiction. Track intent in issues, or nowhere.
