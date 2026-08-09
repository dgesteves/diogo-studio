# Decisions

One dated entry per decision that has a rationale worth keeping. Newest first.
Add an entry when a choice would otherwise be re-litigated or silently reversed —
not for every change.

---

## 2026-08-09 — The world stops paying for itself when the renderer cannot keep up

Three days of boot-gate failures were never a test problem. On CI the page was blocked
in ~5s chunks, so Playwright could not complete a click — and each "fix" (a 200ms cap,
then `force: true`, then a 1s cap) treated the symptom and made it worse. A cap on an
action that legitimately needs 6s **guarantees** the failure it is meant to prevent, and
`force: true` hides that the page is unusable for a real visitor too.

**Measured, in the container that reproduces CI:**

|                    | before                                                                                | after                     |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------- |
| Renderer           | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)` | same                      |
| Frame time         | 5055ms                                                                                | not rendered continuously |
| Boot dismiss click | timeout at 30s                                                                        | **626ms**                 |
| Container suite    | 1 failed, 8.7m on CI                                                                  | **44/44, 3.7m**           |

The perf overlay in the failure snapshot read `Calls 1 · Tris 1 · Frame 5055.4ms` — one
fullscreen triangle taking five seconds. That is the bloom chain (`BLOOM_LEVELS = 6`,
each level a down- and an up-pass) rasterised on the CPU, not the scene's geometry.

So the world now degrades itself, one way, `full → reduced → frozen`: `reduced` drops
postprocessing and antialiasing and pins DPR to 0.5; `frozen` switches the canvas to
`frameloop="demand"`, so the scene is painted once and then costs nothing. Degradation
never reverses — freeing the main thread makes frames look healthy, which would restore
the load that broke them and oscillate.

**Two detectors, because one is not enough.** `detectSoftwareRenderer()` probes a
throwaway context _before_ the canvas chunk mounts, since asking from inside R3F is too
late — the first frames are the most expensive of the session, and paying two of them to
learn what a device string says outright cost 8 seconds of blocked main thread (that
intermediate version measured a 6011ms click; probing first took it to 626ms).
`WorldQualityGuard` is the net for hardware that is merely slow, which no device string
predicts: three sustained frames over 250ms step down a tier, and a single frame over 2s
skips straight to `frozen`, because waiting for confirmation costs another 5s frame.

**A false positive is the real risk** — freezing the world for a visitor whose GPU is
fine — so `isSoftwareRenderer` is tested against both sides: SwiftShader, llvmpipe and
Microsoft Basic Render on one, Apple M3, RTX 4070, Radeon Pro, Iris Xe, Mali and Adreno
on the other. An unreadable renderer counts as hardware.

**This is the honest product answer, not a test accommodation.** Chrome falls back to a
CPU rasterizer whenever the GPU is blocklisted — old drivers, VMs, enterprise fleets — so
real visitors were getting a page that dropped their clicks. The world is decorative
(`data-world-root` is `aria-hidden`, every destination reachable without it); a still
image of it is what `WorldFallback` already shows under reduced motion. CI keeps
exercising the 3D path: the canvas mounts, the scene builds and paints, and the tier is
observable as `data-world-quality` on the world root.

`dismissBoot()` is consequently an ordinary `click()` again — no `force`, no cap — after
waiting for the "Enter the studio" control that `BOOT_MAX_MS` guarantees within 12s on
any machine. If a click cannot land in the 90s test budget now, that is a real
regression and should fail.

## 2026-08-09 — CI is reproduced locally with a constrained container, not with `act`

Two boot-gate failures in two days had the same shape: green locally, red on CI. The
gap was never the workflow YAML — it was that `pnpm e2e` runs `next dev` with 2 workers
and no retries, while CI runs a production build with 1 worker and `retries: 2`, on
2 vCPU with a software renderer. So the local mirror targets the runtime, not the
workflow graph:

- **`pnpm e2e:ci`** — the flags only (`pnpm build && CI=1 playwright test`). No setup,
  no Docker; catches everything that differs between `next dev` and `next start`.
- **`pnpm e2e:runner`** (`scripts/ci-local.sh`) — Ubuntu 24.04, browsers pinned to the
  Playwright version in the lockfile, a frozen install, and `--cpus 2 --memory 7g`,
  which is a GitHub-hosted runner for a private repo on Free. It shadows
  `node_modules`, `.next` and `.env.local` with container-owned mounts: the host
  install stays arm64-clean, and the degraded-env paths are the ones exercised, as on a
  runner. Measured on this repo: the two `Boot sequence` specs run ~12s each on the
  host and ~60s in the container — the starvation is reproduced, and the forced-click
  fix passes under it.

**`act` was considered and rejected.** It re-runs the steps, but not `actions/cache`,
not `secrets`, and not the CPU budget — so it would have been green for both failures
we actually had, while adding a second CI definition to keep in sync and a runner image
that drifts from GitHub's. `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint`
covers the real remaining risk (workflow syntax and expressions) in seconds. Run `act`
ad hoc if step wiring is ever the open question; do not wire it into the repo without
a failure it would have caught.

**Cost, deliberately accepted:** `e2e:runner` re-installs and rebuilds inside the
container. Named volumes for `node_modules`, `.next`, the pnpm store and the browser
cache keep a warm run near 3 minutes; sharing the host's would corrupt one platform's
binaries with the other's.

## 2026-08-09 — ~~The boot gate is dismissed with a forced click~~ (superseded same day)

**Superseded by "The world stops paying for itself…" above. The diagnosis below is
wrong** and is kept only so the mistake is not repeated: the stability wait failed
because the main thread was blocked for ~5s at a time, not because the splash animates.
The `force: true` and the 200ms cap treated that symptom and made it worse. What follows
is the original entry.

`world-3d.spec.ts` "does not gate again in the same session" was failing on `main`, all
three attempts with the same call log: `locator resolved to <button>… Skip intro`,
`element is not stable`, then `element was detached from the DOM, retrying`, then 30s
gone. The sibling test passed only by accident — it never passed a `timeout` to
`click()`, so it inherited the 90s test budget instead of the 30s one.

**Measured, not assumed.** Capping each attempt at 200ms and retrying plain clicks for
the full 30s landed **zero** clicks locally, on a fast machine. The boot splash animates
throughout by design — the panel rises, the log fills, the progress bar and its sheen
run continuously — so the dismiss control never satisfies the _stability_ half of
Playwright's actionability, and the wait simply expires. A starved runner adds the
second half: at `canEnter` `BootActions` swaps "Skip intro" for "Enter the studio", so
whatever the wait was holding detaches. Same 200ms cap with `force: true`: both tests
pass, and faster than before (9.7s / 14.4s against 17.5s).

So `dismissBoot()` asserts the facts a visitor depends on — the gate is up, the control
is visible and enabled — and then dispatches the click without the stability wait,
retrying the _action_ until the gate is gone. Clicking twice is safe because
`BootSequence.enter` ignores re-entry while the overlay is exiting. **`force: true` is
load-bearing here and is not a smell to clean up**: stability is a heuristic for
accidental animation, and this animation is the product. Verified with
`--repeat-each=3 --workers=1` (CI's worker count): 6/6.

This does not reopen the 2026-08-08 decision — matching either dismiss control stays,
and the timing itself stays in `boot.test.tsx`. Added there: the pre-ready "Skip intro"
path, which had no coverage at any layer; verified by mutation (stubbing its `onClick`
fails exactly that test).

## 2026-08-08 — Timing-sensitive behaviour moves to component tests; CPU starvation stays open

The dual-motion E2E split turned `main` red. Three failures, one cause: **GitHub-hosted
runners have 2 vCPUs**, and with SwiftShader software-rendering the scene continuously the
main thread is starved for tens of seconds. The suite took **13.9m** there against 2.7m
locally, which is the same fact measured a different way. Concretely:

- Radix unmounts a dialog on `animationend`, and `command-menu.tsx` only applies
  `animate-out` outside reduced motion, so a ~150ms exit animation exceeded a 15s wait.
- Boot's `forceReady` fires at `BOOT_MAX_MS` (12s) and then React must re-render, so
  "Enter the studio" needed longer than 20s to appear.
- Boot's `BOOT_EXIT_MS` unmount is a 700ms `setTimeout` behind the same queue.

**A first attempt asserted `data-state="closed"` instead of `toBeHidden()`. Rejected and
reverted.** It tests a Radix implementation detail rather than the thing a visitor
experiences, and `testing.md` already forbids exactly that. Softening an assertion to
match slow hardware is not a fix.

**What actually fixed it: layering.** The boot gate is a state machine over three timers
plus a ready signal — `boot.test.tsx` now owns it with fake timers and asserts what the
visitor sees (the step label, "Skip intro" before ready, "Enter the studio" after, the
minimum hold, the 12s fallback, session-once, the reduced-motion branch) in **232ms**
instead of a minute of starved E2E. Verified by mutation, not by going green: dropping the
session and reduced-motion guards fails exactly three of the seven, and setting
`minElapsed` true fails exactly the minimum-hold test. E2E keeps only what is genuinely
end-to-end — a real first visit is gated, dismissing it yields a usable page, a reload
does not gate again — so matching either dismiss control there is layering rather than
hedging.

One budgeted wait remains: the ⌘K exit animation, still asserted as `toBeHidden()`
because that is the user-visible fact, with an explicit 30s timeout and a comment naming
the real cause. Budgeting a wait that always completes is not the same as tolerating
nondeterminism.

**The frame-loop change was investigated and deliberately not made.** Pausing rendering
behind a blocking overlay is the obvious way to free the main thread, and it would be a
real INP win, but R3F's `setFrameloop` does `clock.stop(); clock.elapsedTime = 0` on every
toggle — and four scene components read `clock.elapsedTime`, including `world-camera`'s
idle drift, which is added straight into `spherical.theta` undamped. Toggling would snap
the camera every time the menu closed. Doing it properly means first moving time-driven
animation onto accumulated `delta`, which is a scene refactor and not something to rush
into a red-CI fix. The other half — pausing on `document.hidden` — is close to worthless,
because browsers already throttle `requestAnimationFrame` in hidden tabs.

**Open work item, in priority order, to be measured rather than assumed:** (1) skip
`WorldPostprocessing` while a blocking overlay covers the scene — 6 bloom levels is 12
full-res passes and it is invisible behind a 70% scrim plus blur, and it needs no clock
change; (2) move `clock.elapsedTime` consumers to accumulated `delta`; (3) only then
consider pausing the loop. Do not land any of it without a before/after measurement.
`inspector-panels.tsx` already tells users the canvas pauses when off-screen, which is
not true today — that copy is a promise this work item should either keep or remove.

Also added: a `matchMedia` stub in `vitest.setup.ts`. jsdom does not implement it and
`reduced-motion-store` calls it directly, so anything rendering `ReducedMotionProvider`
threw. It reports no preference; tests wanting reduced motion set the app's own override,
which takes precedence.

## 2026-08-08 — React lint rules are scoped to `src/`, where React actually is

`eslint-config-next`'s `next` entry globs `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` and brings
the `react`, `react-hooks` and `jsx-a11y` plugins with it, so **40 React rules were
enabled on `tests/e2e/fixtures.ts`** — a file containing no React. They cannot find a
real defect there; they can only misfire.

One did. Playwright's fixture signature is
`(args, use: (r: R) => Promise<void>, testInfo)`, so `await use(page)` is a call to a
positional callback — and `react-hooks/rules-of-hooks` read it as React's `use()` hook,
erroring with "React Hook `use` is called in function `page`".

The first fix was to rename the parameter to `provide`. That is behaviour-identical (the
name is a local binding) but it is a **patch on the wrong layer**: it leaves 39 other
irrelevant rules linting `tests/` and `scripts/`, guarantees the next person writing a
fixture hits the same error, and trades the documented API name for lint appeasement.
Reverted.

Now `eslint.config.mjs` carries a `no-react-outside-src` entry that turns the
React-family rules off for `tests/**` and `scripts/**`, with the rule list **derived from
the shared configs** so an upstream addition is covered without editing anything.
Verified: 44 rules off in `tests/`, 39 still enabled in `src/` with
`react-hooks/rules-of-hooks` still an error, and the warning count unchanged at 11.

Deliberately not done: narrowing `nextVitals` itself to `src/**`. Its rule-bearing entry
also carries `import/*` and `@next/next` rules that are worth keeping repo-wide; scoping
the whole config would have silently dropped them.

## 2026-08-08 — E2E runs both motion modes; the 3D path had never been tested

`playwright.config.ts` set `contextOptions: { reducedMotion: "reduce" }` **globally**, and
`world-stage.tsx` gates the canvas on `!reducedMotion`. So all 18 tests — including all
four axe scans — exercised only the no-3D path. The product most visitors get had zero
end-to-end coverage, and `AGENTS.md`'s claim that the reduced-motion non-negotiable was
"enforced by the axe specs" was true only by accident: no spec asserted the canvas was
absent, or that the site worked without it. Both facts were invisible because the
suite was green.

Now two projects, `reduced-motion` and `full-motion`, and **every spec runs in both**
unless tagged `@reduced-motion` / `@full-motion`. 8 spec files, 26 tests, 44 runs.

**Why it needed more than flipping the flag.** `BootSequence` renders a click-gated
Radix dialog on a first visit when motion is allowed — so `getByRole("dialog")` in the
⌘K and axe specs would have matched the boot overlay instead of the command menu. The
`skipBoot` fixture in `tests/e2e/fixtures.ts` seeds the boot session key via
`addInitScript`, which is the returning-visitor state and is what lets one spec assert
the same behaviour in both projects. `world-3d.spec.ts` sets `skipBoot: false` to test
boot itself.

**The measurements, because the first run looked like ten product bugs and was not.**
At the default five workers, 10 of 22 full-motion tests failed, one with
`Protocol error: session closed`. Serialised, 21 of 22 passed. The last one was the
budget, not the product: the `/about` portrait assertion settles in **395ms** with no
canvas and took **9.3s** with one, against a 5s default. Five concurrent SwiftShader
contexts starve each other, and a scene rendering at 60fps on a software renderer
competes with the assertion loop. So: `workers: 2` locally (1 in CI, unchanged), and
`expect.timeout: 15s` / `timeout: 90s` scoped to the `full-motion` project only —
reduced-motion tests still run on the strict default and average under a second.
Verified with three consecutive clean runs at `retries: 0`.

Rejected: adding sleeps, and raising the global timeout. Both would have hidden real
slowness in the cheap path. Rejected also: keeping one project and testing 3D only in a
handful of specs — a bug that appears only with the canvas mounted is precisely what
this suite exists to catch, so the default must be "both".

**Cost:** `pnpm e2e` goes from ~20s to **2.7m** at `workers: 1`. The `e2e` CI job grows
by roughly 2.5 minutes against a 2,000 minute monthly budget. Cheap for the first real
coverage of the 3D path.

Also folded in, since both were only reachable once the projects existed:
`openWithShortcut` moved from spec-local to `tests/e2e/fixtures.ts` (the second
consumer `testing.md` anticipated — `accessibility.spec.ts` was pressing ⌘K bare, the
exact hydration race the helper exists for, and mounting the canvas makes it worse),
and axe now scans `wcag22aa`.

## 2026-08-08 — Axe scans WCAG 2.2, matching the documented bar

Four docs call WCAG 2.2 AA a hard gate; all four axe call sites passed
`["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]`, so nothing from 2.2 was checked.
`axe-core@4.12.1` exposes `wcag22aa`, which is **one** automatable rule — `target-size`
(SC 2.5.8, 24×24 CSS px) — a plausible failure on a site with small HUD controls. It
passes, in both motion modes, so the tag is now in `WCAG_TAGS` and the spec titles say
2.2 instead of 2.1.

Be honest about what this buys: one rule. The rest of 2.2 AA (3.2.6 Consistent Help,
3.3.7 Redundant Entry, 3.3.8 Accessible Authentication) is not machine-checkable, so
"WCAG 2.2 AA" remains partly a manual claim. Adding the tag closes the gap between the
docs and the gate; it does not make the gate complete.

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
