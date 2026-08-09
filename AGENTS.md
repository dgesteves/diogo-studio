# Agent notes

Coding standards live in [`.devin/rules/`](./.devin/rules); file placement in
[`.devin/rules/project-structure.md`](./.devin/rules/project-structure.md).
[`docs/restructure-plan.md`](./docs/restructure-plan.md) is authoritative for
anything structural, `docs/architecture.md` describes the tree as it is today, and
[`docs/decisions.md`](./docs/decisions.md) records why the non-obvious calls were
made. This file only records operational facts that aren't obvious from the code.

**Restructure status: Phase 0 has landed. Phases 1–7 are blocked on
[`docs/testing-plan.md`](./docs/testing-plan.md)**, whose Phases 0, 1 **and 2** are now
complete (Phase 2 minus its visual baselines, deliberately), so **testing-plan Phase 3
(client state, hooks, providers) is the next thing to work on**. Unit coverage is
**35.9% statements / 27.5% branches** (`pnpm test:coverage`, 30 files / 237 tests,
measured 2026-08-09); E2E is **210 runs across 14 specs**, green under `pnpm e2e:ci`.

Phase 1 closed the server holes — `rate-limit.ts` and `app/api/chat` went from **0%** to
**100%** statements, `src/ai` to **98.4%**. Phase 2 covered every route, the whole SEO
surface, the studio map and the ⌘K agent from the outside, and **found two production
defects and one test that could not fail**. But the layers a refactor would break are
still thin at the unit level: `command-menu` at **4.2%** components / **1.2%** hooks with
**0%** branches, `world/components` at **22.3%**, `world/hooks` at **2.4%**. So "pure
move, no behavior change" remains unverifiable — E2E proves the product works, not that a
moved module kept its contract. Do not start a restructure phase yet.

**Phase 2 lowered the branch number, from 27.7% to 27.5%, and that is correct.** Vitest
does not instrument the browser, so 79 new E2E tests are invisible to it, while the two
fixes added `src/` branches only E2E covers. Never read this number as how well the
product is tested, and never ratchet a threshold in the same commit as an E2E phase.

Re-measure before you cite these. They have drifted four times, every time understating
real progress, and two figures in an old table were **never real**: `world/components` was
quoted as 11% when v8 had been printing 22.3% all along, and `command-menu`'s "8%" was a
hand-rolled aggregate v8 does not emit. Copy the rows `pnpm test:coverage` prints; the
per-layer table in [`docs/testing-plan.md`](./docs/testing-plan.md) §2 is the one to
update alongside this paragraph.

Two things have shipped outside that block, and they set the bar for anything else
that wants to: Phase 0 (a lint-cap relaxation — moves no code at all), and the
`station-index` / `(world)` split, which moved code but came with a **measured**
justification and a new invariant test guarding it. Anything less than that —
tidying, renaming, "obvious" moves — waits for the suite, and each exception needs an
entry in [`docs/decisions.md`](./docs/decisions.md).

## Verification

```bash
pnpm validate   # lint + typecheck + format:check + test + knip — run before every commit
pnpm build      # `agent:index:check` before, `prerender:check` after
pnpm e2e        # Playwright + axe; needs `pnpm e2e:install` once
pnpm size       # size-limit budget, checked against .next/static/chunks
```

**`pnpm e2e` is not what CI runs**, and the difference has now produced two red builds
that were green locally: it uses `next dev`, 2 workers and no retries, where CI uses a
production build, 1 worker and `retries: 2` on 2 vCPU. Before claiming a timing- or
3D-sensitive change is done, reproduce the runner:

```bash
pnpm e2e:ci                        # production build + CI flags; no Docker
pnpm e2e:runner                    # + Ubuntu, pinned browsers, 2 vCPU / 7 GB, no .env.local
pnpm e2e:runner -g "Boot sequence" # arguments pass through; CI_CPUS=1 squeezes harder
```

Expect the container to be ~5x slower than the host — that is the point, not a fault.
`act` is deliberately not set up; `docs/architecture.md` explains what it would and
would not catch.

`pnpm validate` is the gate, but it does **not** run `e2e` — so a green `validate`
says nothing about the Playwright suite. Run `pnpm e2e` before you claim a UI or
content change is done; the suite was silently red on `main` for weeks because
nobody did. It is **210/210 under `pnpm e2e:ci`** — 14 spec files, 105 tests, across two
projects (`reduced-motion` and `full-motion`), **7.5 min at `workers: 1`** on the host.
Testing-plan Phase 2 roughly doubled that wall time; if CI minutes bite, the levers are the
`@full-motion` / `@reduced-motion` tags and the 17-route axe sweep, in that order — not
`workers`, and not the assertions.

**`pnpm e2e` is not enough for anything that measures the canvas.** `toBeAttached` is
satisfied before r3f's ResizeObserver sizes the element, so a canvas reports the HTML
default of 300x150 for a moment — which `next dev` was always slow enough to hide and
`e2e:ci` was not. Any spec reading canvas dimensions must retry the read. More generally,
use **`settleWorld(page, canvasMounts)`** from `fixtures.ts` before asserting on a
hydrated DOM: `canvasMounts` is a per-project option in `playwright.config.ts`, and
without the wait a `full-motion` assertion just re-measures the reduced-motion markup.

**Open the ⌘K menu and the inspector through the `fixtures.ts` helpers**
(`openWithShortcut`, `openInspector`), never a bare `keyboard.press` after `goto`. Both
listeners are attached in a `useEffect`, so they do not exist until React hydrates, and
nothing in the DOM distinguishes server markup from hydrated. Pressing once into a page
that cannot yet hear it is what made 2–3 `inspector-overlay` specs fail on the host, in a
different combination every run, while passing under `e2e:ci` and `e2e:runner` — the
production build hydrates fast enough to hide it. `openInspector` guards on visibility
before pressing, because ``Ctrl+` `` toggles and a blind retry closes what it opened.

`pnpm size` is a **review signal, not a gate** — its CI step is `continue-on-error`,
deliberately, so that a bundle regression cannot also sink the `e2e` job via
`needs: build`. Use the 1.3 MB budget to notice regressions; Core Web Vitals are the
real bar.

`pnpm lint` currently reports **11 warnings and 0 errors**. All 11 are pre-existing
deep imports into `features/studio/components/screens/canvas-texture`, which
restructure Phase 4 removes. Warnings are not noise to be silenced: never add to that
count, and never use an inline `eslint-disable` to clear one.

## Gotchas

- **The package is declared ESM** (`"type": "module"`) and **every authored file is
  TypeScript** — `eslint.config.ts`, `postcss.config.ts`, `commitlint.config.ts`,
  `vitest.config.ts`. There are **zero `.js`/`.cjs`/`.mjs`/`.mts` files** and no `require`,
  `module.exports`, `__dirname` or `__filename` anywhere. Don't reintroduce a `.mjs` to
  disambiguate what is no longer ambiguous, and note that `pnpm typecheck` now covers the
  build config — a `.js` config is invisible to it, since `tsconfig.json` includes only
  `.ts`/`.tsx`/`.mts`.
- **`jiti` is a real dependency, not decoration.** ESLint needs it to read a TypeScript
  config and declares it only as an _optional peer_, so before it was declared here, linting
  worked purely because `vite` happened to supply it (`eslint@9.39.5_jiti@2.7.0` in the
  store). Remove it and `pnpm lint` stops being able to load its own config.
- **Two configs fail silently — verify them by behavior, never by exit code.** A
  `postcss.config.ts` that stops loading emits unstyled CSS and still exits 0, so check the
  built CSS for Tailwind's **87 `@property` rules**; a `commitlint.config.ts` that stops
  loading still lints under `config-conventional`'s defaults, so check that a
  **>100-character header passes** (ours sets `header-max-length: [0]`). More generally:
  ESLint prints nothing both when it lints cleanly and when its config contributes no rules,
  so assert the **11 known warnings**, not silence.
- **`MaxListenersExceededWarning` from `[WebServer]` during `pnpm e2e` is pre-existing and
  benign.** It is a Node listener-count advisory from Next's own server under Playwright's
  request pattern, ~97 lines a run, and it is not reproducible with 180 plain concurrent
  requests. Measured at **97 with `"type": "module"` and 98 without**, so it predates that
  change — don't go hunting it as a regression, and don't let it mask a real failure.
- **Every env var is optional.** Features degrade instead of failing: no
  `OPENAI_API_KEY` → `/api/chat` returns `503` with keyword-only matches; no
  `UPSTASH_*` → in-memory rate limiting; no Sentry DSN → Sentry is skipped
  entirely. So a missing `.env.local` does not break the build.
- **`src/constants/agent-index.json` is generated**, not authored. Its sources are
  `src/constants/{career,patterns,routes}.ts` + `config/site.ts` (read by
  `scripts/agent-index/virtual-chunks.ts`) and
  `features/world/constants/destinations.ts` (read by `destination-chunks.ts`). Edit
  a source, then run `pnpm agent:index`. `prebuild` runs `agent:index:check` and
  fails the build when the committed index is stale.
- **`src/constants/career.ts` looks dead but isn't.** It has zero runtime
  consumers — only `scripts/agent-index/virtual-chunks.ts` (build-time) and its
  own test import it. Don't delete it as unused; `knip` won't flag it either.
- **Never set `openGraph.title`, `description` or `url` in `rootMetadata`.** An explicit
  value there is inherited _verbatim_ by every child route instead of being overridden by
  that route's own title and description — which is how all 17 pages came to ship the home
  page's social preview with `og:url` pointing at `/`. Left absent, Next derives them per
  page. `og:url` is deliberately emitted by nothing; see
  [`docs/decisions.md`](./docs/decisions.md). Asserted in `tests/e2e/seo.spec.ts`, because
  metadata inheritance does not exist until a route is rendered — no unit test can see it.
- **The ⌘K menu restores keyboard focus itself.** It has no `Dialog.Trigger` (it opens from
  the deck, the hero CTA and ⌘K), and Radix's modal content _suppresses_ FocusScope's own
  restore in favour of focusing a trigger that is therefore always null — so closing it used
  to strand focus on `<body>`. `command-menu-store.tsx` remembers the opener and
  `command-menu.tsx` restores it in `onCloseAutoFocus`. When testing it: on macOS a click
  does not focus a button, so a mouse-driven test passes against the broken code, and Radix
  restores inside a `setTimeout(0)`, so a single `activeElement` read is too early.
- **"Inspector" means two different things.** The ⌘K surface is
  `features/command-menu`, and its agent is branded "the Inspector agent" in the UI.
  `features/inspector` is unrelated — it's the performance / Web-Vitals overlay. This
  collision has already produced one wrong doc; don't let it produce another.
- **`src/config/brand.ts` is not brand colors.** It's three.js material tokens
  (`roughness`, `metalness`, `color`) and it has 40 importers. Add a token there
  rather than inlining a hex or a material value in the scene.
- **Read env through `@/config/env` only** — never `process.env` elsewhere. In a test that
  also means **`vi.stubEnv` does nothing**: `createEnv` validates and freezes its values at
  import, so a spec that needs a different environment mocks the module against
  `tests/env.ts` (`vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }))`).
  Its `DEFAULTS` are typed from `typeof env`, so adding a required var fails typecheck
  there until it is accounted for.
- **A spec covering a `"use cache"` route must mock `next/cache`.** `cacheLife()` throws
  outside a Next build — "only available with the `cacheComponents` config" — so
  `sitemap.ts` is driven with `cacheLife` stubbed and the profile asserted on the mock.
  The real guard that the route stays static is `prerender:check`, not the spec.
- **Rendering is dynamic-by-default** (`cacheComponents`). A stray `new Date()`,
  `headers()` or env read drops a route out of static rendering _silently_ — Next does
  not warn. Wrap it in `"use cache"` + `cacheLife()`. `prerender:check` runs on
  `postbuild` and fails the build if one of the 19 must-be-static routes de-optimizes;
  that guard is the only thing standing between you and a silently dynamic site.
- **Routes are typed** (`typedRoutes`). `Link href` / `router.push` take a real route.
  Never widen to `string`, never cast — narrow untrusted hrefs (LLM output, citations)
  with `asInternalHref()` from `@/constants/routes`.
- **After renaming or moving anything under `app/`, delete `.next/dev/types`.**
  `tsconfig.json` includes that generated folder, so a stale `validator.ts` from an
  earlier `pnpm dev` fails `pnpm typecheck` with `TS2307` on paths that no longer
  exist. The errors are artifacts, not real.
- **Client islands import `features/world/constants/station-index.ts`, never
  `destinations.ts`.** The latter carries every page's prose via `blocks`; importing it
  from a `"use client"` module ships all of it to the browser for nothing. The index
  holds slug/href/label/sectors only. `station-index.test.ts` asserts the two agree.
- **`vitest.config.ts` has two entries that look like cruft and are load-bearing.**
  `resolve.mainFields` (preferring `module`) and `server.deps.inline` for the
  `@react-three/*` packages exist to keep **one** copy of three in the module graph.
  `@react-three/fiber` ships no `exports` field, so without them vitest resolves its
  CJS `main`, that copy requires `three.cjs`, `src/` imports `three.module.js`, and
  every RTTR test dies on `Cannot assign to read only property 'position' of object
'#<Mesh>'`. The message blames three; the cause is module resolution. Don't delete
  them, and keep them in **both** projects.
- **Vitest runs node by default; jsdom is opt-in via a `*.dom.test.{ts,tsx}` filename.**
  Name a spec for what it touches, not what the module is about — `gpu.test.ts` covers
  WebGL detection and runs in node, because it only calls a pure string predicate. A
  missing `.dom.` fails loudly with `document is not defined`, which is why node is the
  default; add the suffix rather than widening a glob. `resetStores()` from
  `@tests/stores` runs automatically in the jsdom `afterEach` after RTL's `cleanup()`, so
  never reset a store in a spec's own `afterEach` — doing that is what produced 26
  `act()` warnings. **A run has zero stderr output; treat new noise as a defect.**
- **The world downgrades itself, and CI always runs it downgraded.**
  `detectSoftwareRenderer()` probes the renderer before the canvas chunk mounts, and
  `WorldQualityGuard` watches frame times after; together they walk `full → reduced →
frozen` one way. CI is SwiftShader, so it starts at `frozen` (`frameloop="demand"`, one
  painted frame). The current tier is on the world root as `data-world-quality`, which is
  the first thing to read when a `full-motion` spec behaves oddly. Do not "fix" a slow
  E2E by capping or forcing a click — that is what cost three days; check the tier.
- **Draw routines must stay deterministic.** `src/` contains zero `Math.random()`
  calls; seed with `mulberry32` from `@/utils/mulberry32` (one copy, shared — don't
  re-declare it locally). The Phase 5 draw snapshots are worthless otherwise.
- Commits must be Conventional Commits; the `commit-msg` hook enforces this and
  `release-please` derives the version and `CHANGELOG.md` from them. **The hook only
  checks that the type is valid, not that it is right** — `b72c1e5` and `ce66ecc` both
  shipped features, fixes and a behavior change under `docs:`, so none of it reaches
  the changelog. Pick the type from what the diff does, and split the commit when the
  answer is "several things". See [`docs/decisions.md`](./docs/decisions.md).
- **Audio assets must be free for commercial use.** Only ship tracks/SFX with an
  explicit commercial-use license (Pixabay, Mixkit, Freesound per-clip) and record
  the license + attribution. Never commercial music.
- **US English, and nothing checks it.** The standard is
  [`.devin/rules/language-and-copy.md`](./.devin/rules/language-and-copy.md); the repo
  was converted wholesale on 2026-08-09 (68 occurrences, it had been uniformly British).
  `pnpm validate` has no spell-check step and one was deliberately not added, so a green
  validate says nothing here — this holds by review only. Three traps when fixing prose
  in bulk: a naive `s/optimis/optimiz/` corrupts **`optimistic`** (guard the suffix,
  `optimis[eai]`); `CHANGELOG.md` and `src/constants/agent-index.json` are **generated**,
  so fix the source and regenerate; and identifiers, `@img/colour` and other package
  names, and quoted upstream text are all out of scope — spelling is a copy concern, and
  renaming an export is a refactor with real blast radius.
- **Nothing asserts on the terminal clock.** `useCenterScreenTexture` in
  `features/studio/components/screens/terminal-screen.ts` formats Lisbon time with
  `Intl.DateTimeFormat("en-US", …)` and paints it into a **canvas texture**, never the
  DOM — so no unit test or spec can see it, and a locale or format change ships
  unverified. Check the rendered string by hand. `hourCycle: "h23"` is explicit on
  purpose: `hour12: false` leaves the h23/h24 midnight rollover to the locale default.

## Non-negotiables for the 3D world

These gate every change to `features/world`. They are enforced by the E2E suite —
`reduced-motion.spec.ts`, `world-3d.spec.ts` and the axe scans, which run in **both**
motion modes. Until 2026-08-08 the whole suite forced `reducedMotion: "reduce"`, so the
first two below were only accidentally true and the 3D path was never tested at all;
don't let that recur by tagging a new spec `@reduced-motion` for convenience.

- **Content stays in the DOM.** Reveal-on-focus is a visual affordance, not a data
  change — server-rendered destination content stays crawlable and reachable by
  assistive tech. Never gate content behind a 3D-only interaction.
- **Reduced-motion is a real path.** `world-stage.tsx` does not mount the canvas
  when `reducedMotion` is true. The site must be fully navigable with no 3D.
- **E2E specs import `test` from `./fixtures`, not `@playwright/test`.** In
  `full-motion` a first visit renders `BootSequence`'s click-gated Radix dialog, so
  `getByRole("dialog")` would match the boot overlay instead of the ⌘K menu; the fixture
  seeds the boot session key to put the page in the returning-visitor state.
- **Accessibility is a hard gate** (WCAG 2.2 AA). 3D objects can't be the only
  navigation: keyboard-reachable index, visible focus, labeled controls, no focus
  traps when panels reveal.
- **The route-driven spine stays.** `/` is explore, each route is a focused
  station; deep links and `metadata` keep working.
- **The world never crops.** Verify ultrawide, laptop, tablet and portrait phone:
  the focused object stays visible and unoccluded. Responsiveness moves the
  camera, not the objects — `utils/framing.ts` pulls back on narrow viewports.

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
