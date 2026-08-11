# Decisions

One dated entry per decision that has a rationale worth keeping. Newest first.
Add an entry when a choice would otherwise be re-litigated or silently reversed —
not for every change.

---

## 2026-08-11 — `.claude/` is authored; `.devin/` is a frozen fallback

Moving from the Devin desktop IDE to WebStorm + Claude Code. Claude Code reads `CLAUDE.md` and
`.claude/`, never `AGENTS.md` on its own and never `.devin/**` at any tier — so until now the
entire 787-line rule set loaded into a Claude Code session as **zero** instruction. The fix is
wiring, not content: a 14-line `CLAUDE.md` that `@`-imports `AGENTS.md`, plus `.claude/rules/`
and `.claude/skills/` copied from `.devin/` with only the frontmatter rewritten.

**`.claude/` is authored, not generated.** A generator plus a drift check wired into
`pnpm validate` was designed and rejected: it assumed both tools running side by side
indefinitely, when this is a migration where you use one tool at a time. It also had the
direction backwards — you would edit the tool you are leaving and regenerate into the one you
actually use. The accepted tradeoff is that `.devin/` goes stale if a rule changes here; that
is visible and reversible, and cheaper than a script, two package scripts and a gate step that
get deleted within a month.

**`.devin/` is frozen, enforced rather than remembered.** Zero edits, so Devin keeps working
exactly as it does today, and `permissions.deny` on `Edit(./.devin/**)` in
`.claude/settings.json` makes the freeze mechanical. The decision point is explicit: **if the
WebStorm + Claude Code trial succeeds, delete `.devin/`;** if it fails, nothing needs undoing.

**The freeze bites immediately, and that is the cost being accepted, not an oversight.** The
`fireEvent` lint rule landing alongside this is documented in `.claude/rules/testing.md` and
_not_ in its `.devin/` twin, so the two rule sets are already one paragraph apart. ESLint
enforces the rule either way, which is the reason this is tolerable: the enforcement is in the
config, and the rule files only explain it.

Two transforms were not cosmetic. `allowed-tools: [read, edit, grep, glob, exec]` are Devin
tool names, not Claude Code ones — copied verbatim they grant nothing, with no error, just
unexplained permission prompts; they become `Read Edit Grep Glob Bash`. And the `verify` skill
is renamed to `gates`, because in Claude Code the bare name `/verify` resolves to a _different_
bundled skill: an agent obeying the old `AGENTS.md` line would run the wrong workflow and
believe it had verified. The rename costs one line and keeps the bundled `/verify` and `/run`
available — worth having on a 3D portfolio, where a change can pass every gate and still look
wrong.

The three `trigger: model_decision` rules became `paths:` globs, which is a strict improvement:
the rule now fires deterministically when a matching file is read instead of depending on the
model electing to load it. Known limitation, accepted: path-scoped rules are not re-injected
after `/compact`, though the always-on `CLAUDE.md`/`AGENTS.md` layer does survive it.

**cspell was considered and rejected.** WebStorm has a built-in spellchecker, so a `cspell.json`
plus a dependency plus a `validate` step would duplicate it for the human path. This keeps
`language-and-copy.md`'s claim that nothing checks copy accurate. The residual gap is real: the
WebStorm spellchecker only fires when a human has the file open, so a typo in a file Claude
writes and nobody opens ships unseen — which is precisely why that rule stays load-bearing for
the agent. (WebStorm's custom dictionary lives in `.idea/`, which is git-ignored, so vocabulary
added there is machine-local.)

No new dependency, script or gate step; `pnpm validate` is unchanged.

## 2026-08-10 — `tests/recording-ctx.ts` over `vitest-canvas-mock`, and RTTR stays the 3D answer

Testing-plan §4 chose a recording `Proxy` for the canvas-2D routines before checking what is
on the shelf. The off-the-shelf option is **`vitest-canvas-mock`** (a fork of
`jest-canvas-mock`), which mocks the whole 2D API, validates arguments the way a browser does,
and exposes `__getEvents()`, `__getDrawCalls()` and `__getPath()` for snapshots — the same
technique. It was still declined, for reasons specific to this repo rather than to the package:

- **It installs from a setup file onto `HTMLCanvasElement.prototype`, so it needs jsdom.** These
  routines are pure functions of a context, and they run in the **node** project, which is the
  default here and measurably cheaper (Phase 0: 9.66s → 2.77s of environment time). Adopting it
  would move ~16 specs into jsdom to gain nothing they use.
- **It would replace the deliberate `getContext → null` baseline** in `vitest.setup.ts` for
  every jsdom spec. Null is the production-shaped answer — every routine guards it, and the
  portrait engine's no-op path depends on it — so recording must stay opt-in per spec.
- **Text metrics are the one measurement these specs need.** Every font in `src/` is the same
  monospace stack, so the helper computes a 0.6em advance, which is what makes "this line runs
  off the panel" a real assertion rather than a transcript diff. A generic mock cannot know that.
- One 200-line helper against a new devDependency, its aging window and its transitive deps.

So the plan's decision stands, now with the alternative on the record. **If the helper ever
needs argument validation or path tracking, take the library instead of growing it.**

Nothing changes for the 3D layer: `@react-three/test-renderer` is what pmndrs documents for
R3F and it is already installed and proven (§5.2). Three parts of its API that Phase 6 owes and
the plan did not name: `advanceFrames(frames, delta)` drives `useFrame` deterministically —
which is most of the world's motion — `renderer.fireEvent(instance, "pointerOver")` drives the
hotspots, and `toGraph()`/`toTree()` serialize the scene for a snapshot. `create()` sets
`frameloop: "never"`, so nothing advances unless a test says so.

**`renderer.fireEvent` is not Testing Library's `fireEvent`, and does not weaken the
user-event rule.** R3F has no DOM nodes for meshes — it raycasts every event from one pointer
event on the `<canvas>` — so user-event cannot reach the scene at any price. RTTR calls the
handler on a test instance, which proves wiring and state but skips the raycast; whether a
pointer at given coordinates actually hits an object is a Playwright question, and stays one.
In the DOM, `user-event` remains the only interaction API, through `@tests/interactions` where
the handler writes to an external store.

## 2026-08-10 — Phase 4's dead guards: ⌘K's `openTick` and route-JS's environment checks

Phase 4's menu spec left exactly one uncovered line in `command-menu.tsx`, and the reason it
was uncovered is that it could not run. `handleOpenChange` incremented an `openTick` whenever
Radix reported the dialog **opening**, and `CommandMenuAsk` keyed its focus effect on it. But
this menu deliberately has no `Dialog.Trigger` — the deck button, the hero CTA and ⌘K all open
it through the store — so `Dialog.Root`'s `onOpenChange` only ever fires with `false`, from
Escape or an outside click. `openTick` was `0` for the life of the page.

Nothing was broken, because Radix unmounts the dialog's content on close: the effect runs on
mount, and mounting is every arrival in Ask mode. The state, the prop and the handler are gone,
and a unit test now asserts the input takes focus, so a future regression cannot hide behind a
tick that never ticked. Same rule as the entry below — unreachable code is dead code, not an
untested branch — and the same lesson: the uncovered line was the finding, not the target.

The same rule applied a second time in the same phase. `measureRouteJs` opened with
`typeof performance === "undefined"` and a `typeof window !== "undefined"` fallback for the
origin, and it is called from exactly one place: the inspector overlay's effect, where both
are present by definition. It also treated a Resource Timing name starting with `/` as
same-origin, which the spec does not allow — entry names are absolute URLs. All three are
gone, leaving two real branches that the overlay's spec drives. **Do not reintroduce
environment guards in a module that only a client effect calls;** if one ever needs to run
during a prerender, that is a change to its call site, which the build will point at.

Unrelated but from the same sweep, in case it looks like decoration: `components/seo/json-ld.tsx`
now escapes `<` as `\u003c`. `JSON.stringify` does not, so a `</script>` anywhere in the graph
would end the element. Nothing untrusted reaches it — the graph is built from `config/site.ts`
— but the guarantee now lives at the sink instead of resting on every future caller.

## 2026-08-10 — A client store's SSR guard is not chased; a provably dead one is deleted

Testing-plan Phase 3 took the client-state layer to 97–100% statements, and what is left in
`src/stores` and `src/providers` is almost entirely `typeof window === "undefined"` and
`typeof navigator === "undefined"` guards. Reaching them means deleting a global from under
jsdom mid-file, which breaks the environment for every later test, or importing the module in
the node project purely to prove TypeScript right. Neither tests the product, so the residue
stays and this entry is why. The guards themselves are load-bearing: `getSystemSnapshot` and
friends are called from module scope reachable during a prerender, and the build is what
proves it.

The exception is a guard that **cannot** run: `useEffect` never executes on the server, so
`typeof window === "undefined"` inside one is unreachable by construction. `command-menu-store`
had one and it was the only branch of that store no test could reach. Deleting it is better
than either faking a test or excluding the file, and it is the rule to apply to the next such
find — an unreachable guard is dead code, not an untested branch.

Two mechanical traps from the same phase are recorded in `.devin/rules/testing.md` because
both let a test pass while asserting nothing: jsdom's `Storage` is a proxy, so an instance-level
`vi.spyOn` is stored as a key rather than replacing the method; and Motion's `useReducedMotion`
ignores `MotionConfig`, so asserting reduced motion through it says nothing about
`MotionProvider`.

An audit against the shipped Devin CLI documentation found that **`.devin/rules/` appears in
none of it.** `rules.mdx` and the configuration-import reference document `AGENTS.md` (plus
`AGENTS.local.md`, `AGENT.md`, `.windsurfrules`), `.cursor/rules/`, `.windsurf/rules/` and
`.claude/`; `.devin/skills/` is documented, `.devin/rules/` is not. It demonstrably works —
`trigger: always_on` is injected, `model_decision` rules are offered to the agent, `glob` rules
activate on a matching file — but the mechanism the whole scoped layer depends on is an
undocumented one.

The response is not to abandon it. The CLI's own operating guidance puts new configuration in
`.devin/`, and `.windsurf/rules/` would trade a documented loader for a tool-specific directory
this project does not otherwise use. Instead the **critical contract moved into `AGENTS.md`**,
the one documented always-on path, and `.devin/rules/` now carries only detail that is
recoverable from the code if it ever stops loading. `00-core.md` and `language-and-copy.md`'s
`always_on` trigger were the second and third always-on sources; both are gone, so **there is
exactly one always-on file.** Do not add another.

That cut 17,917 bytes of always-on context to 8,490. Four rules were deleted rather than
rewritten: `00-core.md` (its durable content is now in `AGENTS.md`, its file-type content in the
glob rules), `typescript.md` (every compiler option it listed is already on and every
prohibition is already an ESLint error), and `performance.md` plus
`observability-and-errors.md` (framework-obvious or generic; their one project-specific fact,
the `station-index`-over-`destinations` client-bundle trap, moved to `three-r3f-world.md`).
Historical entries in this log and in the plans still cite `00-core.md` by name; they describe
what was true then, and this entry is where its content went.

Two corrections the same audit produced, recorded because both had shipped as instructions:
the always-on injection cap is **32 KiB per file with a truncation hint naming the source
path**, not the 16,384 bytes silently dropped that the entry below states; and Cache Components
removed the `dynamic`, `dynamicParams`, `revalidate` and `fetchCache` route segment configs
while leaving **`maxDuration`, `runtime`, `instant` and `prefetch` valid** — the previous rule
said `runtime` fails the build, and `/api/chat` exports `maxDuration`.

## 2026-08-10 — `'unsafe-inline'` stays; a nonce CSP would cost static rendering

Moving `script-src` off `'unsafe-inline'` looks like an obvious hardening step and is being
deliberately declined.

Next.js documents nonce-based CSP as requiring **dynamic rendering for every page**: static
optimization and ISR are disabled, and it is **incompatible with Partial Prerendering**, which
`cacheComponents` makes the default. Static rendering is this site's main performance asset and
`prerender:check` exists to defend nineteen routes of it, so a nonce would trade the
architecture for the mitigation.

Hashes are the other route off `'unsafe-inline'` and do not close it either. There are two
inline blocks: `boot-splash.tsx` emits a build-time constant, which hashes to one stable value,
but `json-ld.tsx` emits `JSON.stringify(data)`, whose content **differs per route** — a static
header list in `next.config.ts` cannot enumerate those hashes maintainably. Whether a
`type="application/ld+json"` block is even subject to `script-src` was not established from a
primary source, so the size of the remaining problem is not yet known.

What makes the current policy acceptable is a property, not a directive: **no user- or
model-derived content reaches an inline script or any HTML sink.** Both `dangerouslySetInnerHTML`
uses take authored data through `JSON.stringify`, and model output is rendered as React text
nodes with hrefs narrowed by `asInternalHref()`. That invariant is the thing to protect; the
inline-block count is a budget, and it is two.

Two header defects were fixed while here. `X-XSS-Protection: 1; mode=block` was **removed** —
OWASP says not to set it and MDN documents it as non-standard, deprecated and able to introduce
XSS into otherwise safe pages. `X-Frame-Options` moved from `SAMEORIGIN` to **`DENY`** so it
agrees with the `frame-ancestors 'none'` already in the CSP instead of stating a second,
different framing policy in the same response.

Any future attempt must prove three things before it lands: the inline blocks still execute,
every must-be-static route is still static, and `prerender:check` passes.

## 2026-08-10 — `AGENTS.md` holds only what has no other home; procedures became skills

`AGENTS.md` had grown to **19,991 bytes against a 16,384-byte always-on injection cap**, so
its last 55 lines were silently truncated out of every session. The lost tail included the
GitHub Free constraints — the text that says _"do not add workflows without checking these
first"_ was itself the part that never loaded.

Measuring the file rather than trimming it found the actual cause: **roughly three quarters
of it restated facts a rule already carried.** `brand.ts`, `mulberry32` determinism,
`typedRoutes`, the vitest three-copy pins, the `.dom.test` split and the 3D non-negotiables
were all duplicated verbatim from `.devin/rules/`, which is also why it kept drifting. Three
apparent duplicates were not: the `rootMetadata` `openGraph` trap, the
`station-index`-over-`destinations` bundle rule, and the `agent:index` prebuild gate matched
on keyword only and would have been lost by a naive dedupe.

The layers now split by **when the content is needed**, not by topic:

- **`AGENTS.md`** — always-on: orientation, restructure status, the verification entry
  points, repository constraints, and the ten or so facts with no other home. 8.1 KB, with a
  stated cap so the next addition has to justify itself.
- **`.devin/rules/`** — standards, routed by trigger. `testing.md` was **17,850 bytes and
  over the same cap**, silently truncating whenever a test file was opened; it split into
  `testing.md` (Vitest, 14.6 KB) and `e2e-playwright.md` (Playwright, 6.1 KB) along the line
  the two suites already had — 14 `*.spec.ts` under `tests/e2e/`, 29 `*.test.ts(x)` in
  `src/`.
- **`.devin/skills/`** — procedures, loaded on demand: `/e2e` (runner choice and failure
  triage), `/verify` (the gate order and what fails silently), `/commit` (picking an accurate
  Conventional Commit type).

The rule of thumb, for the next person tempted to add to `AGENTS.md`: **a standard is a rule,
a procedure is a skill, and `AGENTS.md` is only for what neither can route.** Duplicating a
fact across two of them is not redundancy for safety — it is the drift mechanism.

Verified by auditing 42 distinctive strings from the two original files against the new
corpus before deleting anything, and by `pnpm validate` (0 errors, the expected 11 warnings,
237 tests).

## 2026-08-09 — Visual baselines are deferred, and the renderer is the reason

`testing-plan.md` §5.1 planned ~8–10 `toHaveScreenshot()` baselines as the third layer over
the 3D world, and Phase 2 shipped without them. §7's stated reason — visual regression is
the first thing to cut when minutes get tight, and the phase already took the suite from
~3.7 to ~7.4 min — is true, and it is the weaker half.

The stronger half is that **CI cannot photograph the world a visitor sees.**
`detectSoftwareRenderer()` resolves before the canvas mounts, and on SwiftShader — every CI
run — it pins `WorldStage` to `frozen`, which `world-canvas.tsx` renders at
`frameloop="demand"`, `DPR_DEGRADED` and `antialias: false`. A baseline captured there is a
byte-record of the degraded tier: one painted frame, no antialiasing, fewer pixels. It would
be perfectly stable and it would be evidence about a rendering path almost nobody gets.
Pinning the Playwright Docker image fixes the stability, which was never the problem.

What remains after that is "a mesh vanished or a material changed", and §5.1 already assigns
it to RTTR — deterministically, in milliseconds, as a named assertion instead of a diff. So
the layer's residual value is the **2D chrome**: HUD, deck, ⌘K, boot overlay, content pages,
where the renderer is irrelevant and nothing today catches a design-token or CSS regression.

Revisit it as a **DOM-only** baseline job, on the §7 paths filter, and only after
testing-plan Phases 5 and 6 — draw-routine snapshots and scene-graph assertions are the
instruments this app's 3D actually needs, and they sit at 0% and 22.3% respectively. Do not
add whole-scene screenshots to compensate for that gap: §5.1 rejected it, and a baseline
that gets re-approved on every red destroys its own signal.

## 2026-08-09 — `openGraph` title, description and url are not set at the root

`rootMetadata` pinned all three, and Twitter's mirrored them. An explicit value in a
parent's `openGraph` is inherited **verbatim** by every child route rather than being
overridden by that route's own `title` and `description` — so all 17 pages shipped the same
social preview and pointed `og:url` at `/`. Every link ever shared for /work, /resume or
/contact previewed as the home page.

Omitting the three lets Next derive `og:title` and `og:description` per page from the
resolved metadata, and Twitter's in turn from Open Graph. `siteName`, `locale`, `type` and
the card image stay at the root, where inheritance is the point. **Do not add them back to
be explicit** — that is the bug.

`og:url` is deliberately left absent rather than made per-page: Next derives no fallback
for it, and consumers resolve a missing `og:url` to the fetched URL, which `rel=canonical`
already confirms. Restoring it correctly means repeating the route path a second time in all
16 page files or introducing a metadata helper — a refactor that waits for
`docs/testing-plan.md`, and a real option if social attribution ever matters more.

This is invisible to a unit test: metadata inheritance does not exist until a route is
rendered. `tests/e2e/seo.spec.ts` asserts it over HTTP, per route, by comparing `og:title`
to `<title>`.

## 2026-08-09 — The ⌘K menu restores focus itself, because it has no `Dialog.Trigger`

Radix's modal `Dialog.Content` **prevents** FocusScope's own focus restore and focuses
`context.triggerRef.current` instead. This menu opens from the deck, the hero CTA,
`openWithMode` and ⌘K, so it has no `Dialog.Trigger` and that ref is always null — the
restore that would have worked by default was suppressed in favour of one that could not
run. Dismissing the menu dropped focus on `<body>` (WCAG 2.4.3), and axe cannot see it.

The opener is now remembered in `command-menu-store.tsx`, not in the dialog, for two
reasons: the store is the only place that sees every entry point, and it is the only point
early enough — by `onOpenAutoFocus` the menu has already focused its own input, which is
where a first attempt at fixing this failed. `command-menu.tsx` consumes it in
`onCloseAutoFocus` and calls `event.preventDefault()`, which skips Radix's null-trigger
handler because `composeEventHandlers` stops on a prevented default.

Two traps when re-testing it: **on macOS a click does not focus a button**, so a
mouse-driven test has nothing to restore and passes against the broken code; and Radix
restores inside a `setTimeout(0)` after unmount, so a single `document.activeElement` read
is too early and reports `BODY` either way. Drive it by keyboard and assert with a retrying
matcher.

## 2026-08-09 — `canvasMounts` is a declared project option, not an inferred one

An untagged E2E spec runs in both motion projects, and anything it asserts about the DOM
before the canvas mounts is a second copy of what the `reduced-motion` run already measured
— the same trap the project split was added to close. `playwright.config.ts` therefore
declares `canvasMounts` per project and `settleWorld(page, canvasMounts)` waits only where
there is something to wait for. Inferring it from `testInfo.project.name` would work and
would also mean every spec hardcodes a project name.

Attachment is not sizing: r3f hands the canvas to a ResizeObserver, so between
`toBeAttached` and the first resize it reports the HTML default of 300x150. A spec that
measures the canvas must retry the read; `world-responsive.spec.ts` does, and that only
surfaced under `pnpm e2e:ci`, never under `pnpm dev`.

## 2026-08-09 — Station navigation is asserted through the map, not by clicking the scene

Picking a mesh by screen coordinate on a software renderer is a coin flip, and three days
were already lost to forcing clicks at a blocked main thread. The same navigation is fully
reachable through the studio map and ⌘K, which are plain DOM — so `world.spec.ts` owns "a
visitor can get anywhere" and testing-plan Phase 6 owns "the hotspot is where it should be"
through the scene graph. `world.spec.ts` is therefore mostly **untagged** rather than
`@full-motion` as the plan sketched: the map matters more to a reduced-motion visitor, who
has nothing else.

The boot progress bar and step log stayed out of E2E for the same family of reasons — three
timers, already covered under fake ones in `boot.dom.test.tsx`.

## 2026-08-09 — The `/api/chat` contract is driven over HTTP, mocking only third-party modules

Testing-plan Phase 1 listed nine files to cover. The tempting reading is nine specs, each
mocking its neighbors — and it is wrong twice over. Phase 6 of the restructure merges
`agent-stream.ts`, `embed-query.ts` and `agent-response.ts` into `features/agent/`, so
specs pinned to those module paths are debt the day they land; and a route spec that mocks
`streamAgentResponse` asserts nothing about the two headers that actually matter.

So one spec at `src/app/api/chat/route.test.ts` posts a real `Request` and asserts the
`Response`, with the mock boundary drawn at **third-party code only**: `ai`,
`@ai-sdk/openai`, `@sentry/nextjs`, plus `@/ai/agent-index` (getters over a mutable fixture,
so a spec can present a corpus with or without vectors). Everything the repo owns —
routing, validation, rate limiting, retrieval, prompt assembly, the stream wrapper, the
base64 sources header — runs for real. 29 tests took **five** modules from 0% to 100%
statements, and they survive Phase 6 untouched because none of them names a file that moves.

Two consequences worth knowing before editing it:

- **The rate limiter is real, not mocked.** It is built at module import (10/min per
  address), so every case posts from its own `x-forwarded-for` and only the rate-limit case
  reuses one to spend the budget. That is what makes "the 11th request is refused" an
  assertion about the deployed limit rather than about a `vi.fn`.
- **`@/config/env` is mocked against `tests/env.ts`, not stubbed via `process.env`.**
  `createEnv` validates once at import, so `vi.stubEnv` after that changes nothing. The
  helper exports one stable object the mock returns, `setTestEnv()` resets before applying
  overrides so each case declares the whole environment, and its `DEFAULTS` are typed from
  `typeof env` — adding a required var to `@/config/env` fails typecheck here until it is
  accounted for.

## 2026-08-09 — The "Missing query string." message never fired for a missing query

Found by the first Phase 1 spec, which is the point of writing them. `chatRequestSchema`
attached that message to `.min(1)`, so it covered `""` and `"   "` but not the far likelier
`{}` — an absent key is an `invalid_type` issue, and the route returned zod's
`"Invalid input: expected string, received undefined"` to the caller.

Fixed at the schema (`z.string({ error: … })`, sharing one constant with `.min(1)`) rather
than characterized in the test, for two reasons. The intended copy plainly exists for this
case, so the test would have been enshrining a bug; and asserting zod's internal wording
couples the suite to a dependency's phrasing across upgrades.

Blast radius is small and worth stating honestly: the ⌘K client guards `if (!trimmed)
return` and always sends the key, and `runAskRequest` shows `The agent returned 400` for
any non-ok status without reading the body. So this message is only ever seen by direct
API callers. It ships as `fix:` regardless — the diff changes behavior, and
`00-core.md` asks for the type the diff earns.

## 2026-08-09 — `src/ai` stops at 98.4% statements, and the residue should stay uncovered

Phase 1 targeted 100% for `src/ai` (testing-plan §5.3). It lands at **98.41% / 95.18%**,
and the gap is five things that should not be closed:

- `retrieve-bm25.ts` `if (!tf || dl === undefined) return 0`, `retrieve-keyword.ts`
  `if (!chunk) continue` — guards that exist only because `noUncheckedIndexedAccess`
  types an indexed read as possibly-undefined. Through `retrieveByKeyword` the indices
  always align, so reaching them means importing a module Phase 6 deletes and passing an
  out-of-range index: a test of the type system, not the product.
- `(top[0]?.score ?? 0)` in both retrievers — unreachable, because the `||` on the same
  line short-circuits whenever `top` is empty.
- `retrieve-types.ts` — type declarations only, so it compiles to nothing and v8 scores it
  0/0. It belongs in the §5.3 exclusion list, which Phase 7 applies; adding it early would
  be doing Phase 7's work while claiming Phase 1's number.

Do not delete a guard to color a line green — `cosine()`'s `a[i] ?? 0` is the counterexample
that shows why. It **is** covered, by a test asserting a gappy vector scores rather than
returning `NaN`, and a mutation removing it turns that test red. A guard with an
articulable contract gets a test; a guard the type system forced and the code makes
unreachable gets left alone.

## 2026-08-09 — Vitest runs node by default; jsdom is opt-in via a `.dom.test.` filename

Testing-plan Phase 0 asked for a `node`/`jsdom` project split. The question it did not
answer is **how a file declares its environment**, and the obvious answers are both bad.
Directory globs (`src/ai/**` → node) are restructure debt by construction: the restructure
moves `src/ai` → `features/agent`, dissolves `src/stores`, and merges `studio` into
`world`, so four of seven phases would have to edit `vitest.config.ts` — and forgetting
to means a route-handler spec silently starts running against a DOM it will never have in
production. A `// @vitest-environment node` docblock travels with the file but **cannot
drive `projects`**, so both environments are stuck sharing one `setupFiles` list. That is
not academic: it is exactly what broke when the global store reset landed, because
`structured-data.test.ts` used the docblock and `resetStores()` needs `window`.

So the marker is the **filename**: `*.dom.test.{ts,tsx}` runs under jsdom with
`vitest.setup.ts`, everything else runs under node with no setup at all. A suffix survives
`git mv`, states the environment where you cannot miss it, and lets each project own its
setup.

**Node is the default, and the direction is the whole point.** Forget the suffix on a DOM
spec and it fails immediately with `document is not defined` — loud, local, self-fixing.
The inverse default fails _silently_, in the direction that costs real fidelity. Choose
the default whose failure mode is loud.

Measured, on 22 files: cumulative environment time **9.66s → 2.77s**, wall **3.51s →
2.66s**. 16 files run in node, 6 in jsdom. That gap is why this was worth doing before
Phase 1 adds ~15 server-surface specs rather than after: environment setup was already the
largest single bucket in the run.

`gpu.test.ts` is the worked example of the judgment involved. It sounds like a DOM test —
it covers WebGL renderer detection — but every assertion calls `isSoftwareRenderer(string)`,
a pure predicate. It stays in node. Ask what the _test_ touches, not what the module is about.

Two config notes that are load-bearing. `resolve.mainFields` and `server.deps.inline` for
the `@react-three/*` packages are duplicated into both projects; the RTTR entry in this
file explains why removing them breaks every scene test. And `sequence.hooks: "stack"` is
required, not cosmetic — see the next entry.

---

## 2026-08-09 — Store resets are global and run after `cleanup()`, which is what silenced 26 `act()` warnings

The suite carried **26 `act(...)` warnings**, which Phase 0 listed as a chore. They were
not cosmetic; they were pointing at a real bug in the teardown, and tracing them (rather
than wrapping things in `act` until they went away) is what produced the design above.

Five came from the test files' own `afterEach` hooks — `resetBoot()`,
`persistOverride(null)`, `setExplore(false)`. Every store here is a module singleton read
through `useSyncExternalStore`, so resetting one **notifies subscribers**, and RTL's
`cleanup()` lives in `vitest.setup.ts`'s own `afterEach`. Vitest's default
`sequence.hooks: "parallel"` runs those hooks concurrently, so the reset could beat the
unmount and update a live component outside `act`. The fix is ordering, in two parts:
`cleanup()` and `resetStores()` in the **same callback**, and `sequence.hooks: "stack"` so
a spec's own `afterEach` runs **before** the global one — which is what lets
`scene.dom.test.tsx` await its RTTR unmount before the stores it subscribes to are reset.

That makes the reset **global**, which is strictly better than the per-file convention
`.devin/rules/testing.md` used to describe: 4 files reset ad hoc and between them covered
**2 of 7** stores, so `perf`, `web-vitals`, `world`, `world-theme` and the inspector
overlay all leaked across files. No test can forget it now.

Three more came from `await user.click()` under fake timers — `setExiting` and
`setInspectorOpen` fire synchronously inside the click, and user-event does not wrap them
once `advanceTimers` is driving it. Wrapped at the call site in `boot.dom.test.tsx`'s
`click()` helper, matching what `deck-explore-toggle.dom.test.tsx` already did.

The remaining 18 were Radix `Presence`/`Portal`/`FocusScope` effects with no `src/` frame
in the stack, and they disappeared once the ordering was fixed — they were downstream of
the same race, not a separate defect.

**`resetStores()` is proven load-bearing, not decorative:** stubbing it to a no-op fails a
boot spec. Its larger value is insurance for Phases 3–6, and it deliberately reaches only
for each store's **public** API, using the server snapshots as the canonical initial
values. Three limits are therefore known and accepted: `perf-store` and `web-vitals-store`
have no public reset (nothing writes to them yet), and the `hydrated` latch in
`inspector-overlay-store` and `reduced-motion-store` stays set. Add a reset alongside the
first test that actually needs one, driven by a failing test — not speculatively.

---

## 2026-08-09 — The package is declared ESM, and every config is TypeScript

**This supersedes the `.mts` rename recorded below the same day, and the reasoning that
produced it was wrong on a fact.** That entry argued `"type": "module"` "reinterprets every
`.js` file in the repo". **There are no `.js` or `.cjs` files in this repo** — not one — and
no `require`, `module.exports`, `__dirname` or `__filename` anywhere in `src/`, `scripts/`
or `tests/`. Every config was already either `.mjs` or `.ts`. So the cost that argument
rested on did not exist, and the `.mjs` extensions were only ever there **because**
`"type": "module"` was missing.

The fix is therefore the root cause, not the symptom: `package.json` declares
`"type": "module"`, and four files lose their disambiguating extensions — the vitest config
becomes `vitest.config.ts`, and the ESLint, PostCSS and commitlint configs become plain
`.js`. The ESM-loaded-as-CJS warning that started this is gone
because the package now tells the truth about what it is, rather than because one file was
renamed around it.

**Two things here fail silently, so both were verified deliberately rather than inferred
from a green build.**

- **`postcss.config.ts` not being loaded would not fail `next build`** — it would emit
  unstyled CSS and exit 0. Confirmed loaded by the output itself: 81 KB of CSS with **87
  `@property` rules** (Tailwind v4's signature registration of its `--tw-*` custom
  properties) and no unresolved `@import "tailwindcss"`.
- **`commitlint.config.ts` not being loaded would still accept and reject commits**, just
  under `config-conventional`'s defaults. Our config sets `header-max-length: [0]`, so the
  decisive test is a **910-character header**, which passes. Under defaults it would fail at 100.

Also verified: `pnpm validate` green with the same 11 pre-existing warnings (so ESLint found
`eslint.config.ts`), `prerender:check` still reporting 19 static routes, `pnpm size` at
831 kB against the 1.3 MB budget, `pnpm e2e:ci` at **44/44**, and dev mode separately —
`next dev` serves the page 200 with the same 87 `@property` rules, because PostCSS loads by
a different path there than in a production build.

One scare worth recording so nobody re-runs it: the E2E output carries ~97
`MaxListenersExceededWarning` lines from `[WebServer]`. A/B measurement put it at **97 with
`"type": "module"` and 98 without**, so it is pre-existing and unrelated. It is now noted in
`AGENTS.md` as benign. Two of my own verification steps were also wrong before they were
right, which is the more useful lesson: a stray `pnpm start` from an earlier load test held
port 3000 so the first A/B never ran at all, and `echo "EXIT=$?"` after a pipeline reports
`sed`'s status, not the command's — it read 0 while Playwright was erroring. Use
`set -o pipefail`, and confirm a run actually ran before trusting its zero.

The general lesson is the one this file exists for: when a warning offers a contained fix
and a root-cause fix, price the root-cause fix against the repo in front of you instead of
the repo you assume. The contained fix here was cheaper only under a false premise, and it
would have left `.mjs` extensions in place permanently, each one a small standing question
about why it is not just `.js`.

`tsconfig.json` keeps its `**/*.mts` include entry. It now matches nothing, but it is
pre-existing and harmless, and removing it would silently exclude any future `.mts` from
typechecking.

**Follow-through: there are now no `.js` files either.** All four configs are TypeScript —
`eslint.config.ts`, `postcss.config.ts`, `commitlint.config.ts`, `vitest.config.ts` — so
every authored file in the repo is `.ts`/`.tsx` and `pnpm typecheck` covers the build
configuration too, which it previously did not. Three things had to be true first, and each
was verified rather than assumed:

- **Turbopack loads `postcss.config.ts`.** Next 16's own docs list `.ts`/`.mts`/`.cts` as
  supported, and this project builds with Turbopack. Confirmed by output, not exit code —
  87 `@property` rules in the built CSS.
- **ESLint needs `jiti` to read a TS config, and it was working by accident.** `jiti` is an
  _optional peer_ of ESLint (`peerDependenciesMeta: {jiti: {optional: true}}`), and pnpm was
  satisfying it from the copy `vite` drags in — the store entry is literally
  `eslint@9.39.5_jiti@2.7.0`. So `eslint.config.ts` would have kept working until someone
  changed the vitest toolchain, then failed to lint at all. It is now a **declared
  devDependency**, which is the honest statement of a dependency we already had.
- **`@commitlint/types` had to be declared** for a real `import type`. The old `.js` file
  carried a `/** @type {import('@commitlint/types').UserConfig} */` annotation that
  `pnpm typecheck` **never checked**, because `.js` is not in the tsconfig `include` — the
  types were editor-only decoration. Declaring the package let the
  `ignoreDependencies: ["@commitlint/types"]` entry come **out** of `knip.json`: one fewer
  blind spot, where the usual direction of this trade is one more. `jiti` needed no entry
  either; knip resolves both.

Both packages were already in the store, so `pnpm add -D` downloaded nothing and the
`minimumReleaseAge` policy was satisfied without special handling.

**`eslint.config.ts` needed real types, and they improved it.** It failed typecheck with 11
errors at first, all of the same shape: rule entries only receive their
`[Severity, ...unknown[]]` tuple type from the surrounding `defineConfig` literal, so the
parts this config deliberately _derives_ — the React-family rule list, the per-feature
`no-restricted-imports` loop — widened to `Record<string, string>` and `(string | {…})[]`.
The fix is **not** a cast (`00-core.md` forbids unchecked casts): a `Linter.RulesRecord`
accumulator replaces `Object.fromEntries`, and a named `restrictedImports()` helper returning
`Linter.RuleEntry` replaces three copies of an inline tuple. Fewer repeated literals than
before, and 0 typecheck errors. Verified the config is still _applied_, not merely found, by
the count that only our rules produce: **11 warnings**.

The general point, since "is no output good news?" came up repeatedly here: with config
files, absence of error proves nothing. ESLint reports nothing when it lints cleanly _and_
when a config contributes no rules; commitlint exits 0 for a valid message _and_ when it
loaded no config at all. Every check above was chosen so that the wrong answer looks
different from the right one.

---

## 2026-08-09 — ~~The vitest config renamed to a `.mts` extension~~ (superseded same day); three Phase 0 helpers deliberately not written

The `.mts` half of this entry is superseded by the entry above — the config is
`vitest.config.ts` again, and the package is declared ESM instead. Kept because the second
half stands on its own, and because the superseded reasoning is instructive: it rejected
`"type": "module"` on a cost that a single `find` would have shown did not exist.

**Only one of the four listed `tests/` helpers was written.** `stores.ts` had real callers
the moment it landed and fixed a live leak. `env.ts` has no consumer until Phase 1,
`recording-ctx.ts` until Phase 5, and the plan itself says `r3f.ts` should wait for a
second scene spec. Writing them now means untested code with no caller, and since
`pnpm knip` fails on unused files it would need an ignore entry — blinding the tool that
exists to catch exactly that, for the sake of speculative code. Phase 0's exit criterion
was reworded from "helpers exist" to "the helpers with consumers exist".

Related: the jsdom setup now stubs `HTMLCanvasElement.prototype.getContext` to return
`null`. jsdom returns `null` anyway and reports "Not implemented" to its virtual console
each time — 55 lines per run from the scene spec alone. The native `canvas` package was
deliberately rejected, so `null` is the permanent answer and the messages carry no
information. Behavior is unchanged; Phase 5 replaces the stub with the recording context.
The jsdom setup also imports `silence-clock-deprecation`, which the app already applies at
`world-canvas.tsx` — RTTR mounts the scene directly and so bypasses it.

---

## 2026-08-09 — `nuqs` is not installed; the URL state here is the pathname

`.devin/rules/nextjs-app-router.md` told you to manage URL state "with a typed helper
(e.g. `nuqs`)". `nuqs` is not a dependency and never has been, so the rule pointed at
something no one could follow — the same class of defect the rule set corrects elsewhere
(`react-hook-form` is explicitly flagged as absent two files away). The obvious fix is to
install it. That is the wrong fix.

**There is no query state in this repo at all.** No `useSearchParams`, no `searchParams`
prop, no query parameter in any of the 17 routes. Navigation is entirely pathname-based —
`usePathname` to read, typed `router.push` to write — which is the route-driven spine
`AGENTS.md` lists as a non-negotiable: one station per route, deep-linkable, with
`metadata`. A query-string helper has nothing to manage.

Installing it anyway would have cost more than the wording did. `knip` fails on unused
dependencies and `pnpm validate` runs `knip`, so a consumer-less `nuqs` turns the gate red
the moment it lands; the only way to keep it green is an `ignoreDependencies` entry in
`knip.json`, which is deliberately blinding the tool that exists to catch exactly this.
Add the install weight and a standing upgrade obligation and the trade is plainly bad
against `00-core.md`'s "don't add a dependency for something the framework already
solves". Nothing needs solving yet.

**So the rule was rewritten to describe the codebase, and `nuqs` is pre-approved for the
day a real query parameter arrives** — a filter on `/work`, a paginated list. At that
point it is a good choice and this entry is the justification; until then the bullet says
what the repo does. The general form of the lesson: when a rule and the tree disagree,
change whichever one is wrong, and a rule recommending an uninstalled package is almost
always the wrong one. Do not install a dependency to make a sentence true.

---

## 2026-08-09 — US English is the project language, enforced by review rather than tooling

The repo was not mixed, as it appeared — it was consistently **British**. Every one of
the 68 occurrences was en-GB prose (`behaviour` ×24, `colour`, `organised`,
`de-optimises`, `characterisation`, `normalisation`, `sanitised`, `serialised`,
`labelled`, `centre`, `favour`), spread over `docs/`, `.devin/rules/`, `AGENTS.md`, three
`src/` comments and two E2E specs. What looked like the American half was not prose at
all: `pnpm analyze`, `Optimize` in `00-core.md`, and `openGraph.locale: "en_US"` are
identifiers and config. So this is a change of language, not a cleanup of drift.

**The rule lives in `.devin/rules/language-and-copy.md`, `trigger: always_on`.** It is
the only location agents load without being asked, and it is where every other normative
standard already sits. `docs/` was rejected because these files are plans and records —
write-once, describing a moment — and a live standard buried in a 38 KB decision log is a
standard nobody reads. `AGENTS.md` was rejected because it scopes itself to "operational
facts that aren't obvious from the code"; a writing convention is neither operational nor
a fact about this codebase in particular. `00-core.md` and `README.md` carry a two-line
pointer each, so the rule is discoverable from both the agent path and the human one.

**All 68 were converted in the same change, `docs/` included.** Leaving the historical
documents in British would have meant the rule was contradicted by the largest body of
prose in the repo on the day it landed, which is how a convention becomes decorative. The
conversion used stem rules with an `[eai]` suffix guard (`optimis[eai]` → `optimiz[eai]`)
specifically so `optimistic` in `nextjs-app-router.md` and any `organism` survived; a
naive `s/optimis/optimiz/` would have silently corrupted them.

**One behavior change came with it.** `terminal-screen.ts` built its clock from
`Intl.DateTimeFormat("en-GB", …)`, which is a formatting locale, not a spelling — the
carve-out in the rule exists precisely for that class of thing. It was switched anyway,
for consistency, after checking what actually moves: the time is unchanged (`16:41:00`
either way, verified at midnight for the h24 rollover), and only the date reorders, `Sun
09 Aug` → `Sun, Aug 09`. `hour12: false` became `hourCycle: "h23"` at the same time,
because `hour12` leaves the h23/h24 choice to the locale's default and en-US has
historically resolved it the other way. Nothing asserts on this string — it is painted
into a canvas texture, never the DOM — so no test covers the regression if the locale is
changed again.

**No spell-check gate.** `cspell` would make this enforceable, and was declined: it is a
dependency plus a curated wordlist for three.js, Next.js and R3F jargon, bought for a
class of error that review catches and that cannot break the build. The honest
consequence is written into the rule — it holds exactly as well as the person reading the
diff.

That absence is itself the reason `AGENTS.md` gets two bullets, against a first instinct
that a writing standard is not an operational fact. It is not the standard that belongs
there but the things a green build will not tell you: that `pnpm validate` does not check
spelling, that `CHANGELOG.md` and `agent-index.json` are generated so prose fixes have to
go to the source, that the suffix guard is load-bearing, and that the terminal clock is
painted into a canvas and therefore unobservable to every test in the repo. `AGENTS.md`
points at the rule for the convention itself rather than restating it, so there is one
copy to keep true.

---

## 2026-08-09 — CI E2E stays at one worker in one job; the win was a cold build, not parallelism

The Actions minute budget is not the constraint — 2,000/month against ~15 minutes a push
is ~130 pushes, far more than this repo sees. That makes it tempting to "use as many
workers as we can", and minutes even reward it, since they bill wall-clock: finishing
sooner costs _less_. Both ways of doing it were measured and both rejected.

**`--workers=2` oversubscribes the runner.** A Free runner has 2 vCPU _total_, shared by
Chromium and the one `pnpm start` server. At `--workers=2` in `scripts/ci-local.sh`, 3 of
26 tests needed a retry and went green only on `retries: 2`. The three failed for three
different reasons, and the interesting one was `mobile-nav`: its snapshot was

```yaml
- main:
    - main "Loading":
        - status
```

— the route's Suspense fallback, held for the entire 15s budget. The starved process was
the **server**, not the browser, so no amount of test-side readiness work buys it back.
This is why `workers: 1` on CI is not a copy of the local `2`; they are capped for
unrelated reasons, and the local number does not transfer.

**`--shard=n/2` splits along the project boundary.** Playwright shards by test count in
listing order, and that order groups by project, so `--shard=1/2` took all 22
`reduced-motion` tests and `--shard=2/2` all 22 `full-motion` ones. Since `full-motion`
(software rendering, 15s expect budget) dominates the runtime, wall time is bounded by
that shard and barely moves, while the fixed per-job cost — checkout, install, browsers,
build — is paid twice. A 4-way shard would genuinely split `full-motion`, but at ~3
minutes of setup per extra runner to save ~1.5 minutes of test time.

**What actually helped**: the `e2e` job ran `pnpm build` without restoring `.next/cache`,
unlike the `build` job, so every E2E run paid a cold production build. It now restores the
same cache key, and because `e2e` `needs: build` the key is already warm. No added flake
risk, no extra minutes.

Sharding becomes worth revisiting only when pure test time grows well past the fixed
setup cost — and if the `full-motion` races are ever fixed, `workers: 2` would deliver the
same saving with no extra minutes, making it the better lever of the two.

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
and the timing itself stays in `boot.dom.test.tsx`. Added there: the pre-ready "Skip intro"
path, which had no coverage at any layer; verified by mutation (stubbing its `onClick`
fails exactly that test).

## 2026-08-08 — Timing-sensitive behavior moves to component tests; CPU starvation stays open

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
plus a ready signal — `boot.dom.test.tsx` now owns it with fake timers and asserts what the
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

The first fix was to rename the parameter to `provide`. That is behavior-identical (the
name is a local binding) but it is a **patch on the wrong layer**: it leaves 39 other
irrelevant rules linting `tests/` and `scripts/`, guarantees the next person writing a
fixture hits the same error, and trades the documented API name for lint appeasement.
Reverted.

Now `eslint.config.ts` carries a `no-react-outside-src` entry that turns the
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
the same behavior in both projects. `world-3d.spec.ts` sets `skipBoot: false` to test
boot itself.

**The measurements, because the first run looked like ten product bugs and was not.**
At the default five workers, 10 of 22 full-motion tests failed, one with
`Protocol error: session closed`. Serialized, 21 of 22 passed. The last one was the
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
`ask-answer-formatting.tsx` — one of which is a **user-visible behavior change**
(an internal-looking href that is not a real route now renders as plain text).

`release-please-config.json` maps `docs` to a Documentation section, so the next
release cuts a patch bump whose Features, Bug Fixes and Performance sections are all
empty. None of the above appears in `CHANGELOG.md`, and the behavior change ships
unannounced. The `commit-msg` hook cannot catch this — `docs:` is a valid type, so
commitlint passes. Only the author choosing the right type catches it.

Not rewritten: `main` is unprotected but shared history, and a force-push to relabel
two commits is a worse trade than a note. The rule that was already written in
`00-core.md` ("the **accurate** type so the changelog stays complete… one logical
change each, not one squashed mega-commit") stands; these two commits are the
counter-example, not the precedent.

## 2026-08-08 — RTTR adopted, and the R3F coverage estimate replaced with a measurement

`@react-three/test-renderer@9.1.1` is installed and testing-plan Phase 0's spike
exists at `features/studio/components/scene/scene.dom.test.tsx` — the current cluster
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
- `ask-answer-formatting.tsx` rendered `<Link>` from sanitized LLM markdown. Same
  guard. **Behavior change:** an internal-looking href that is not a real route now
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
- `/sitemap.xml` **silently de-optimized** from static to dynamic, because `new Date()`
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
does not warn when a route de-optimizes, and static rendering is this site's main
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
harness that verifies 'pure move, no behavior change'". A harness with a
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
`tests/**`. _(Both done on 2026-08-09, with `tests/stores.ts`.)_

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
code and changes no behavior, so the "we cannot verify a pure move" argument that
blocks Phases 1–7 does not apply to it.

## 2026-08-08 — Cross-boundary import guardrails ship as warnings, ahead of the tests

`restructure-plan.md` §6 scheduled these for Phase 7 — last, after every dangerous
merge, which is backwards: their whole job is to stop new violations appearing while
the restructure is in flight. They are pure lint config with no behavior risk, so
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
job. Resolved in CI's favor of the docs: the step is now `continue-on-error`.

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
