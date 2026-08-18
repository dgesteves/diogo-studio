# Decisions

One dated entry per decision that has a rationale worth keeping. Newest first.
Add an entry when a choice would otherwise be re-litigated or silently reversed —
not for every change. A bug fix with no reversible choice inside it belongs in the
commit message; git already keeps that.

**This file is a record, not a rule.** It is not on the authority ladder in
[`architecture.md`](./architecture.md) §11, and it never outranks a rule, a config
or a test. **A decision binds through the thing that enforces it** — `eslint.config.ts`,
`vitest.config.ts`, a spec, `.claude/rules/`, `architecture.md`. Read an entry to learn
_why_ one of those says what it says; never act on an entry alone.

Two consequences worth stating, because they are what keep this file cheap to own:

- **Every entry is true as of its date and is never rewritten.** Paths, file names and
  numbers in old entries may name things that have since moved or changed — a refactor
  is in flight and renames most of the tree. Verify against the current code, which is
  what an entry's reasoning is meant to help you understand rather than replace.
- **An overtaken entry is history, not a conflict.** Where an entry and the current
  config disagree, the config is right. Marking the old entry is a courtesy, not an
  obligation: if a reversal is worth understanding, write the new entry and say what it
  reverses. Reasoning is the asset here; accuracy about the present lives elsewhere.

---

## 2026-08-18 — An opacity-animated rule states its own resting opacity

Second cause behind the flashing boot screen, found by measuring frames out of a screen
recording rather than by reading the CSS: the sun flashed to **1.6x** its brightest animated
value for single frames, and 1 / 0.62 — the `0%` keyframe of `boot-sun-pulse` — is 1.61.

A CSS animation that sets `opacity` in its keyframes says nothing about the element when the
animation is not applying, and the initial value is `1`. Any frame painted before the
animation takes effect shows the element at full opacity, and a fresh mount is exactly that
frame. `.boot-sun` rested at 1 against a `0%` of 0.62; `.boot-crt` — a full-screen white grid
at `mix-blend-mode: overlay` — rested at 1 against a `0%` of **0.035**, a 28x flash;
`.boot-scan-beam` and `.boot-hud-sweep` rested fully opaque against a `0%` of 0. Sweeping the
stylesheet for the same shape turned up five more: `scene-pulse`'s two users at 2.5x, the two
`.boot-glitch` pseudo-elements fully opaque against a `0%` of 0, plus `.world-hint-pulse` and
`.deck-radar-ping`.

The static value also decides the **reduced-motion** resting state, since this stylesheet cuts
every animation to 0.001ms and the element then reverts to it. `.boot-crt` was therefore
pinned at opacity 1 under reduced motion, not only for a frame.

Every fix states the `0%` value as the rule's own, so the steady state is unchanged and only
the pre-animation frame moves. `src/globals.test.ts` now parses the stylesheet and fails any
rule whose animation touches opacity without either declaring one or using a `both`/`backwards`
fill mode, which applies the first keyframe up front and makes the static value unreachable —
that is why `.world-intro-rise` and `.boot-neon-in` are correct as they are. Verified by
mutation: deleting `.boot-sun`'s resting opacity fails the check by name.

This is the flash that a fresh mount produced; what _caused_ the repeated fresh mounts is the
entry below.

## 2026-08-18 — The boot gate decides once; reading the motion preference live tore it down

Reported from production: the sun on the boot screen "flashes a lot," the progress bar jumps,
and the preferences and CTA disappear and come back — worst on a fresh browser profile with a
cold cache.

One cause for all of it. `BootSequence` computed `show` from `useReducedMotionPreference()` on
every render, and `reducedMotion` is `override ?? (systemReducedMotion || lowPower)` where
`lowPower` reads `navigator.connection.effectiveType`. That value is not a constant: Chrome
derives it from a rolling RTT and throughput estimate and fires `change` as it moves — and a
cold first visit downloading the entire 3D world is exactly the moment it dips to `2g` and
recovers. Each dip made `show` false, so `BootSequence` returned `null` and the whole overlay
unmounted; each recovery mounted a brand-new tree. That is the flashing sun (every backdrop
animation restarts from 0% on fresh DOM), the jumping bar (`BootOverlay`'s `faux` is
`useState(8)`), and the vanishing controls (the panel is simply gone for the duration of the
dip). `saveData` cannot flap, but `effectiveType` does, which is why this looked random.

**The fix is the latch, not the input.** `reducedMotion` is a live preference and should stay
one; what was wrong is that a startup event read it as if it were stable. `BootSequence` now
decides on the first client render — a render-phase `setGated`, so it costs no extra paint and
the splash still hands over in the same commit — and never revisits it. That closes the whole
class: the OS media query flipping mid-load, or an override written by other UI, would have
done the same damage. It also takes the `hasBootedThisSession()` `sessionStorage` read out of
every render.

Deliberately **not** changed: `lowPower`'s contribution to `reducedMotion`. Treating a slow
connection as a motion preference is arguably conflating bandwidth with vestibular safety, but
that decision reaches the canvas, the HUD and every animation in `site/`, and it is not what
this bug required.

Reproduced before fixing, in `boot.dom.test.tsx`, with `stubNetworkConnection` and a real
`ReducedMotionProvider`: reporting `2g` then `4g` mid-compile removed the dialog and the
`.boot-sun` node outright. The test now asserts the opposite — same dialog, the _same_
backdrop node (identity, so a restarted animation would fail it), and a progress bar that
does not go backwards. Restoring the old `show` expression fails exactly that test.

Still open, and much smaller: `BootSplash` and `BootOverlay` each render a `BootBackdrop`, and
`hideBootSplash()` runs in a passive effect, so at least one frame paints with two suns
stacked out of phase. That is a single pop at handoff rather than a repeating flash, and it is
untouched here.

## 2026-08-18 — The boot gate has one control in both states; "Skip intro" is deleted

`BootActions` used to render two unrelated things: a small ghost "Skip intro" button while
the scene compiled, then — at `canEnter` — a preferences row plus the bordered "Enter the
studio" CTA. Reported as "an odd different button before the enter button appears," which is
what it looked like: the pre-ready control shared no shape, weight or placement with the
thing it turned into, and the swap grew the panel by the whole height of the preferences row.

Now the preferences and the CTA mount on the first frame and `canEnter` only flips the CTA's
`disabled`. The panel geometry is identical in both halves of the boot, so nothing resizes
under the visitor and no element detaches mid-click. Two details are load-bearing rather than
decorative: the `group` class is withheld until the CTA is live, so the animated frame and
the corner brackets hold still under a pointer that cannot click yet; and the dimming is on
the wrapper with `disabled:opacity-100` on the button, because the button's own
`disabled:opacity-40` fades the button and leaves its decoration lit.

Mounting the preferences early created one bug worth naming, because it is invisible until
someone uses a keyboard: the effect that hands focus to the CTA at `canEnter` would now yank
it off a toggle a visitor was part-way through choosing. So `onOpenAutoFocus` parks focus on
the panel instead of Radix's default first focusable child, and the effect claims focus only
when focus is still there (or on `document.body`). That makes "the visitor has not moved
focus" a testable condition rather than an assumption, and it is asserted in both directions.

**The accepted cost: before `canEnter` there is no visible way out** — only Escape, which
`BootOverlay` already routes to the muted entry. `BOOT_MIN_MS` (1.1s) bounds the common case
and `BOOT_MAX_MS` (12s) bounds the worst one, so no visitor is held indefinitely, but a
pointer-only visitor on a slow device has 12 seconds with nothing to press. Weighed against a
second control that read as a different product, this was chosen deliberately; a future
change that wants a visible pre-ready exit should make it the _same_ control, not a new one.

Test layering is unchanged from the 2026-08-08 entry and the coverage moved with the
behavior. `boot.dom.test.tsx` asserts the CTA is disabled before ready, enabled after, and
that Escape is the pre-ready exit and does not enable audio, plus both focus directions;
verified by mutation — dropping `disabled` and stubbing `onOpenChange` fails exactly four
tests, and dropping the focus guard fails exactly the mid-choice one. E2E gets simpler rather than
looser: `dismissBoot` waits on the same element throughout, so Playwright's built-in "enabled"
actionability wait _is_ the wait for the gate to open, and the detach-mid-click failure mode
that the 2026-08-09 entry spent `force: true` on cannot occur — that `force: true` stays, as
the animation reason for it is untouched.

## 2026-08-18 — `world-poster.png` is a placeholder, and its weight is an OG constraint

One file, two roles, opposite budgets. In `world/fallback.tsx` it goes through
`next/image`, so it is resized and re-encoded per viewport and its 3.2 MB source never
reaches a browser. In `site/metadata.ts` it is the `og:image` — a raw `/public` URL that
no optimizer touches, so every social scraper fetches all 3.2 MB. X and Facebook accept
that; several messaging clients cap preview fetches far lower and render no card at all
rather than a slow one. Its 5116×2084 is also ≈2.45:1, wider than the 2:1 that
`summary_large_image` crops to, so the card loses the top and bottom.

The poster is placeholder art and will be replaced. When it is, give `og:image` its own
small 2:1 asset and leave the large source to the fallback, rather than hunting for one
file that satisfies both. A size assertion on the card asset is the right guard, but it
would fail today, so it belongs with the replacement rather than here. Per
[No roadmap document](#2026-08-07--no-roadmap-document) the intent to replace lives in an
issue; this entry is only the constraint any replacement has to meet.

## 2026-08-17 — `config-plan.md` and `pipeline-plan.md` are deleted, unimplemented, on purpose

Both plans were sound and neither was wrong. They were deleted because the product is not
finished, and a bounded plan against a codebase that is still growing gets re-derived anyway —
paying for the audit twice. The experience comes first: UI, copy, behavior, desktop and mobile,
reduced motion, accessibility. The architectural pass happens once, against the finished thing.

**Deferring is safe here for a specific reason, not a hopeful one.** Drift is held by machinery
rather than by intent: `tests/boundaries.test.ts` and `eslint.config.ts` hold the six-domain
architecture, `prerender:check` holds static rendering, the `vitest.config.ts` thresholds hold
coverage. Keep those green while building and the eventual audit is about design, not debt.
If they start getting waived, this decision has expired.

Both implementation branches were dropped with the docs — `config-architecture` (three commits:
the ESLint `process.env` ban widened to the node, `pnpm env:check`, and the `AGENTS.md`
correction) and `ci/gated-pipeline` (`8150ed3`, six CI jobs to three). None of it is on `main`.
The full plans are at `fee3f0c`; `git show` beats re-auditing.

**What is deferred is repository work only. Four findings live outside it and are not deferred:**

| Finding                                                                     | Where it lives   |
| --------------------------------------------------------------------------- | ---------------- |
| No OpenAI spend cap — the only bound on worst case independent of code      | OpenAI dashboard |
| `OPENAI_API_KEY` and the Sentry token were displayed in a chat session      | rotate both      |
| No Upstash database — the in-memory limiter is ineffective on serverless    | Upstash + Vercel |
| `OPENAI_API_KEY` absent from Vercel Production — `/api/chat` is `503` there | Vercel           |

The last two are ordered: adding the key before a real limiter exists creates a billable
endpoint behind one that does not work.

**And one fact worth not rediscovering: CI is an observer, not a gate.** Deployment triggers on
`git push` and has no relationship to the checks — release `846c8f0` served production at
`14:54:52Z` while its own CI finished at `15:16:33Z`, 21 minutes later. GitHub Free has no
branch protection, so nothing stops a red push but you. Vercel Deployment Checks is the fix
when it is worth doing; `git show fee3f0c:docs/pipeline-plan.md` has the worked design.

## 2026-08-15 — The five pnpm overrides are deleted; the Dependabot ignores stay

Two cleanups that looked alike and were not. Both were checked the same way: remove the
thing, re-resolve, and see what the tree actually does.

**The overrides were dead, and one was worse than dead.** Resolving the lockfile with the
`overrides:` block removed leaves `esbuild` at 0.28.2, `postcss` at 8.5.23/8.5.26, `sharp`
at 0.35.3 and `brace-expansion` at 1.1.18/5.0.9 — every dependent had already moved above
its advisory floor, so four of the five changed nothing. `pnpm audit --audit-level low`
(dev included, not just the scheduled `--prod --audit-level high`) is clean without them.

The fifth is the reason to look rather than assume. **pnpm matches an override selector
against the declared range, not the resolved version**, so `fast-uri@<3.1.4` still matched
`ajv`'s `^3` — the ranges intersect — and rewrote it to the open `>=3.1.4`, which resolves
to **4.1.2**. A floor written for a 3.1.3 advisory was silently holding a major upgrade
`ajv` never asked for. Removing it drops the tree to 3.1.5, still above the advisory.
So: re-add an override for an advisory natural resolution does not clear, and **delete it
once it does** — a stale one is a version pin wearing a security label.

**The Dependabot ignores are still load-bearing, and now say how to check.** Both are peer
ranges, not opinions. `eslint-plugin-react` is still latest at 7.37.5 peering
`^3 || … || ^9.7`, so ESLint 10 is out; `typescript-eslint` 8.67.0 already peers `^10`,
which makes that one transitive package the entire blocker. `typescript-eslint` peers
`typescript >=4.8.4 <6.1.0`, so TS 7 is out. Each comment now names the package and range
to re-read, so the entry expires on evidence instead of on someone's memory.

**The `typescript` ignore is a version bound, not a major block**, because of what that
peer range says: it ends at `<6.1.0`, so the break arrives on a **minor**. `versions:
[">=6.1.0"]` mirrors the ceiling exactly — majors are a subset of it, 6.0.x patches still
come through, and the entry now fails the same way the toolchain does. An
`update-types: semver-major` block would have waved 6.1 straight past. Raise the bound to
typescript-eslint's new ceiling when it moves; delete the entry when it has none.

## 2026-08-15 — The `THREE.Clock` deprecation warning is no longer filtered

`silence-clock-deprecation.ts` is deleted, with its spec and both import sites
(`world/canvas.tsx`, `vitest.setup.ts`). It reverses the suppression recorded in the
2026-08-08 testing-plan entry below.

**The warning is still live** — `@react-three/fiber` 9.7.0 constructs `THREE.Clock` for
each root, and three r183+ warns from the constructor. So this trades a quieter console
for an honest one: one line per canvas root at mount, not per frame, and the suite's
stderr is no longer empty. That is the cost, and it is accepted. Filtering upstream noise
means owning a `console.warn` wrapper that every other warning in the app has to pass
through, and the spec that existed to prove the wrapper stayed transparent was more code
than the noise it hid. The fix belongs upstream: when fiber migrates to `THREE.Timer` the
line disappears on a dependency bump, with nothing here to remove.

Do not reintroduce a console filter to quiet a dependency. Pin, patch or upgrade instead.

## 2026-08-15 — `refactor.md` is deleted, and its cross-references land on `architecture.md`

The refactor's own charter was "delete this file when the last phase lands", restated in its
header and in the entry below dated 2026-08-11. Phase 8 is where that came due.

The deletion was mostly a repointing job. Fifteen live references in code, rules and configs
pointed _into_ its sections, and a document is not deletable while things cite it by section
number. Each moved to whatever now carries the claim: `architecture.md` §4 rule 2 for
store-is-public-API (`world/store.ts`, `world/perf.ts`, `world/hud/deck.dom.test.tsx`,
`.claude/rules/three-r3f-world.md`), §4 rule 6 for no-client-imports-`agent/`
(`chat-contract.ts`), and the closed-domain entry below for the gitignore-semantics finding
(`tests/boundaries.test.ts`).

**The "a refactor is in flight, so this tree is not a pattern to copy" framing went with it**,
from `project-structure.md`, `AGENTS.md`, `CLAUDE.md` and `README.md`. That warning was
load-bearing for eight phases and is now the most misleading thing an agent could read: it
tells a reader to distrust a tree that is, at this point, the design.

**This file keeps all twenty-five of its own references to `refactor.md`, deliberately.** Its
header says entries are true as of their date and are never rewritten, and that old entries
may name things that have since moved. Editing them to point somewhere else would break the
rule the file is built on, to buy accuracy the file explicitly does not promise. A reader who
wants the deleted document has `git log`.

What is genuinely lost is §2 (the measurement: 297 files, 49-line average, the fragmentation
mechanism) and §5 (the evidence: five career copies, eight stores, 25 chunks with no anchors).
Folding them in here was considered and declined — the findings that mattered already have
their own entries below, and an archive of superseded measurements is the kind of document
this file's header exists to discourage.

## 2026-08-15 — Coverage thresholds stay global now that the refactor's reason has expired

`vitest.config.ts` justified global-rather-than-per-directory thresholds by saying the
refactor moved or merged nearly every directory in `src/`, so a threshold keyed on a path
either broke the build during a pure move or silently stopped applying. True, and now spent.

Global stays, on a reason that outlives the refactor. A per-directory threshold encodes a tree
shape into a config: a second place the architecture has to be maintained, and the first to
rot silently, since a threshold on a path that no longer exists fails open rather than red.
The domains here are also small — a per-domain floor over a few hundred statements moves
several points when one branch is added, which is noise presented as a gate.

The comment now names the expired reason as history rather than quietly swapping it. An
argument that has been overtaken is worth one sentence; deleting it invites the next reader to
re-derive it and reach the opposite conclusion.

## 2026-08-15 — The boot gate keeps its alpha notice

`refactor.md` §9 listed the "Alpha · Work in progress" notice with the fake résumé download,
as a statement the product makes that is not true, and gave Phase 8 the job of removing it.
Half of that pairing was wrong.

The notice is true. The site _is_ early — there are rough edges, and more of them than a
visitor would guess from a boot sequence and a 3D room that both look finished. The people who
land here are recruiters, clients and peers, and the notice is the only thing that sets their
expectation before the polish sets a different one. Removing it would not make the product
more honest; it would make it quieter about something real, which is the opposite of what the
refactor's charter was about.

So it stays, and its removal becomes a decision for the day the claim stops being true rather
than a tidy-up a refactor gets to take on the way past. Only the copy was touched: the
sentence was missing its punctuation ("my new portfolio an immersive, interactive 3D world").

Contrast the résumé download in the next entry. The test is not whether a line sounds
promotional — it is whether the thing it names exists.

## 2026-08-15 — The résumé panel drops its download affordance

`world/screens/wall.ts` painted "↧ DOWNLOAD RÉSUMÉ" at the foot of the résumé panel. There is
no PDF in `public/` and never has been, and a click on the panel resolves through
`world/interact.tsx` to a route push to `/resume` — a page. The line promised a file and
delivered a web page.

Removed rather than wired, per `refactor.md` §9: a real document is wanted eventually, and
until it exists the honest move is to not advertise it. The `divider()` above it went too — it
existed only to separate that line, and left behind it is a rule with nothing under it. When a
PDF lands, the panel and `/resume` both get it.

**"▶ PRESS START" on the playground panel was checked and deliberately left.** It is the same
shape of line and not the same case. What it names is real: that panel is a registered hotspot
in `world/hotspots.tsx` and a click on it starts something — `/playground`. It is also of a
piece with the panel's own register (`● HIGH SCORES`, the `P1`–`P5` row markers), so changing
it alone would leave two-thirds of an arcade framing behind and read as an oversight rather
than a decision.

The rule this pair establishes, for the next panel: **a canvas screen may use any register it
likes, and may not name an artifact that does not exist.** Decoration is free; a deliverable
is a promise.

## 2026-08-15 — The dependency rules are grants per edge, not a public store per domain

Phase 7 had to choose between two readings of the same contract, and the summaries disagreed
with the contracts they were summarizing.

Per **edge** is what the design always said. `architecture.md` §3's domain contracts grant
`world/` "two sibling stores: `command-menu/store`, `telemetry/store`", `site/`
"`command-menu/store` only" and `telemetry/` "one sibling store: `world/perf`". `refactor.md`
§4.1's adjacency list — which §4 names as the thing Phase 7 encodes — says the same. What
read as per **domain** was only the one-line summary in `architecture.md` §4 rule 2 and
`refactor.md` §4.2: "a domain's store module is its public API; a sibling may import the
store and nothing else." Taken literally that grants every sibling every store, which is
looser than any contract in the document containing it.

The check encodes the contracts. The loose reading would let `telemetry/` import
`@/world/store` — hover, day/night and explore state — which is a real architectural smell,
permitted silently and forever, and the overlay has no business there. Per-edge turns it into
one red line until someone widens the grant deliberately: the correct price for a new
cross-domain edge, and the same test §8 rule 6 applies to shared code.

The objection to per-edge was that it would put a rule in `eslint.config.ts` that no document
teaches. That turned out to be backwards — the documents already taught it, in the tables —
and the fix was to correct the two summaries rather than weaken the check. `architecture.md`
rule 2, `.claude/rules/project-structure.md` rule 2 and `refactor.md` §4.2 now state the grant
model and name `ACCESS` in `eslint.config.ts` as where the grants live.

The residual risk is that a table and `ACCESS` drift. Both summaries are now scoped to what a
domain may _expose_, so they cannot contradict the grants — only be wider than them, which is
what "may expose" means. `ACCESS` is the single authority on who gets what.

## 2026-08-15 — A closed domain is two ESLint entries, and merging them voids the carve-out

`docs/refactor.md` §4.4 carried this glob for three phases, cited as the design twice:

```ts
{ group: ["@/world/*", "@/world/**", "!@/world/store", "!@/world/perf"], message: … }
```

It does not do what it reads as. `no-restricted-imports` matches `group` with **gitignore
semantics**, and gitignore refuses to re-include a path whose parent directory is excluded.
The bare `@/world` excludes the directory, so both `!` entries stop applying and the group
denies the very stores it exists to permit. Verified against the project's own ESLint 9
before anything was written: with `@/world` in the group, all five fixture imports were
restricted; without it, only the two private ones.

Because the bare specifier cannot live in that group, it becomes an exact `paths` entry
instead — which is also what keeps a future `src/world/index.ts` barrel from being importable,
the thing §4.4 said the rule was for:

```ts
paths:    [{ name: "@/world", … }]
patterns: [{ group: ["@/world/**", "!@/world/store", "!@/world/perf"], … }]
```

The comment on `noBarrel`/`privateFiles` in `eslint.config.ts` says not to merge them, and
`tests/boundaries.test.ts` is what makes that stick: it runs the real config through the
ESLint API over 23 cases, 9 that must pass and 14 that must fail. Putting the footgun back
fails exactly the four carve-out rows, by name.

**The general lesson is the one Phase 4 already recorded about a scanline color that passed
31 tests:** a rule nobody has watched fail is not a check. Phase 7's verify line said "prove
the rule can fail before trusting it", and following it literally is the only reason the
published glob's defect was ever found. A one-time manual demonstration would have proved
the config of that afternoon and guarded nothing after it, which is why the proof is a spec.

## 2026-08-15 — `schemas/agent.ts` split into `chat-contract.ts` and `agent/corpus.ts`

One file held two contracts with opposite audiences: the `/api/chat` request and
sources schemas, which a browser must be able to read, and the retrieval index
schema, which is server-only. That is why five client files under
`features/command-menu` imported a module inside the server boundary for a type —
a violation of the "no client module imports `agent/`" rule that no glob could
see, because the file was in neither domain. The wire half is `src/chat-contract.ts`,
a root leaf owned by neither end; the index half went into `agent/corpus.ts` with
the corpus it validates. The shared source-kind enum lives in the contract, which
`agent/` may import.

## 2026-08-15 — `agent/corpus.ts` is separate from `agent/retrieval.ts`

The plan said fold the index loader into `retrieval.ts` and get one file.
`app/api/chat/route.test.ts` mocks the loader so the real scoring runs against a
two-chunk fake corpus; merging them would have meant mocking the module under
test to test it. The boundary that resolves it is a lifecycle rather than a
convenience: `corpus.ts` reads and Zod-validates a build artifact at module scope,
`retrieval.ts` is pure functions over whatever chunks it is handed. Six files in
`agent/` rather than five, and the seam is where a reader would predict.

## 2026-08-15 — `telemetry/` has two public store modules

`docs/refactor.md` §4.2 named `telemetry/vitals.ts` as the domain's single public
module, which would have put the overlay's open/close signal inside `overlay.tsx`.
Phase 5 already paid for that mistake once: `tests/stores.ts` imports the setter,
and that import drags everything the module pulls in into every spec's graph before
`vi.mock` can register — three unrelated specs broke when `world/boot`'s store moved
into its screen. So `telemetry/store.tsx` sits beside `telemetry/vitals.ts`, the way
`world/` has both `store.ts` and `perf.ts`. **A store module stays out of the
component tree it drives.**

## 2026-08-15 — `use-is-client.ts` is a root leaf; `world/random.ts` is not

Both are tiny and both were in a category folder Phase 6 deleted, and the two-importer
rule sent them to different places. `useIsClient` has consumers in `world/` (×3) and
`site/` (×1) — two domains, so it is a root leaf, the same argument Phase 4 used for
`store.ts`. `mulberry32` has four consumers and all of them are the world's, so it
became `world/random.ts` — a domain file, not a shared one. It sits at the domain root
rather than in `scene/` or `screens/` only because both subfolders read it.
Neither appears in any target tree; §3 of `refactor.md` was corrected, not the code.

## 2026-08-15 — `useDisposable` merged into `world/gpu.ts`

`hooks/use-disposable.ts` released three.js resources; `world/gpu.ts` detected whether
there was a real GPU to release them from. They read as unrelated until you notice both
are the same boundary asked at the two ends of a session, and that all five importers
of the hook are in `world/`. The alternative — a one-hook file at the domain root — is
the fragmentation Phase 0 retired the rule for.

## 2026-08-15 — "Inspector" is a brand; the directory is what was ambiguous

`refactor.md` §3 said the name is "retired from the tree and kept only as the ⌘K
agent's brand", and Phase 6 renamed `features/inspector/` to `telemetry/` on that
basis. The identifiers did **not** follow: `InspectorOverlay`, `useInspectorOverlay`
and `setInspectorOpen` name a user-facing surface labelled "Inspector · receipts",
with an accessible name four E2E specs match on. The ambiguity `AGENTS.md` warned
about was two _directories_ competing for one word, and only one directory remains.
Renaming the copy is a product decision; Phase 8 owns it if anyone does.

## 2026-08-15 — `ContentLink` became `BlockLink`, not `Link`

The rename to `architecture.md` §3's names took `Destination → Page` and
`ContentBlock → Block`, and symmetry wanted `Link`. Every file that renders one also
imports `next/link`, and two `Link`s in one scope is exactly the collision class Phase 5
spent a commit untangling — eleven of them in the hardware cluster alone. `BlockLink` is
also the more accurate name: it is the link inside a `links` block, not a link in general.

## 2026-08-15 — The world keeps calling a station a "destination"

The content model is `Page` now, but `world/` still says destination in its copy —
"all studio destinations", the map's count — and in locals iterating `stationIndex`.
That is not drift. A page is what the record holds; a destination is what the room
takes you to, and the room's word for it is product language with E2E specs asserting
on it. `StationEntry`, `StationSector` and `STATION_ORDER` stay for the same reason:
they are the room's index into the record, not the record.

## 2026-08-15 — Two brand hexes live in `ui/`, the rest of `brand.ts` is the world's

`config/brand.ts` was the room's three.js material tokens under a name that said
otherwise, so it became `world/materials.ts` and `brandColors` became `worldColors`.
Three of its 43 importers are not the world: the two `ImageResponse` icons use
`accent` and `edge`, and the portrait engine uses `accent`. The portrait moves to
`site/` in Phase 6, where §4.3 rule 5 forbids importing `world/`.

So the two hexes are `components/ui/brand.ts` — mirroring `--brand-cyan` and
`--brand-edge`, which is where every DOM surface already reads them — and
`world/materials.ts` builds its accent on that import rather than duplicating the
value. It sits under `components/ui/` rather than a new `src/ui/` because Phase 6
moves that whole folder; two `ui` directories at once would be worse than one in the
wrong place. `brandColors.ink` had zero uses and is gone.

The alternative was to move the file whole and let three modules import
`@/world/materials`. That is legal for `app/` and illegal for `site/`, and it would
have handed Phase 6 an edge to unpick.

## 2026-08-15 — The boot signal lives in `world/store.ts`, not beside the boot screen

Phase 5 merged fifteen boot components into `world/boot.tsx` and took the boot store
in with them — one concept, one file, which is what `reduced-motion.tsx` already
models. It broke three unrelated specs.

`tests/stores.ts` imports `resetBoot` and `vitest.setup.ts` calls it in every
`afterEach`, so the moment `@/world/boot` became a component module that import
pulled `@/features/audio` and `@/features/inspector` into every test file's module
graph — evaluated during setup, before the spec's own `vi.mock` could register.
`world-audio.tsx` closed over the real `next/navigation` and the audio and inspector
specs failed on **behavior**, not resolution.

The signal is a store of exactly the kind `world/store.ts` already holds: the canvas
publishes progress and readiness, the overlay reads them. It moves there. What stays
in `boot.tsx` is the overlay and the session/splash helpers only it uses.

The general form, which is the part worth keeping: **a store that cannot be imported
without pulling in a DOM overlay is not usable as a store.** "Provider + store, one
concept" holds when the provider is small; it does not survive a 600-line client tree.

## 2026-08-15 — `world/room.ts` holds dimensions, `world/materials.ts` holds surfaces

`docs/refactor.md` Phase 5 scoped `scene/constants.ts` into `materials.ts`. It holds
`DESK_TOP_Y` and `CITY_WINDOW` — dimensions, not surfaces — and the camera framing
derives from the same measurements `ROOM` carries. They went to `room.ts` instead.

The split that matters is not "constants vs. components". It is that `room.ts` is
what a camera has to respect and `materials.ts` is what a mesh looks like, and those
two change for different reasons.

## 2026-08-15 — There is no `world/scene/server-rack.tsx`

Phase 5's scope named one. The server node, the Mac Studio and the desk hub are laid
out as a single row from one shared layout module and all three use `StatusLed`, so
splitting them means either an import cycle or a layout file belonging to neither.
They are `workstation.tsx`.

The evidence was in the merge: eleven top-level identifiers collided, because three
files were describing the same measurements under the same names. Each box namespaces
its own now (`HUB_`, `MAC_`, `SERVER_`), which is what the shared layout module had
been doing all along.

## 2026-08-15 — `knip` reports every export nothing else imports

`ignoreExportsUsedInFile: true` switched off the whole check: an `export` no other file
imported was invisible as long as the module used the value itself. That is precisely the
over-export the store rule in `refactor.md` §4.2 depends on catching — a domain whose files
export more than their consumers read gives a sibling something to reach for.

There is no setting now; the check runs on everything. It reported sixteen and all sixteen
were fixed by deleting a keyword: five plain values, six types, and five consts read in their
own file **in a type position** (`VariantProps<typeof buttonVariants>`,
`z.infer<typeof agentChunkSchema>`), which knip's object form would have exempted.

Exempting them was considered and rejected. The argument for it was that a type or a Zod
schema is a module's documented shape rather than dead surface — but nothing consumes those
shapes, and `export` is not documentation: `z.infer<typeof agentChunkSchema>` and
`VariantProps<typeof buttonVariants>` read a local const perfectly well. The AI boundary got
narrower for it, which is the direction `AGENTS.md` wants that file to move, and the
`cva` variants that shadcn exports by convention are ours now. **If one is ever needed
elsewhere, the `export` comes back in the commit that needs it** — that is rule 6 in
`refactor.md` §8, measured rather than assumed.

**Never reintroduce the option to make `pnpm validate` green.** A finding here is one
character to delete.

## 2026-08-15 — One `createStore`, and `src/store.ts` as a fourth root leaf

Eight modules hand-rolled `Set<listener>` / `emit` / `subscribe` / `getSnapshot` /
`getServerSnapshot`. `architecture.md` §9 and `.claude/rules/project-structure.md` both
already said client state comes "from one factory"; Phase 4 is what made that true. Three
choices inside it are worth keeping.

**The factory is a root leaf, which neither target tree listed.** `world/`, `telemetry.ts`,
`reduced-motion.tsx` and `inspector/` all build stores, so the factory belongs to none of them,
and §4.1's definition of a root leaf — imports nothing from `src/`, importable by anyone — fits
it exactly. Putting it in `ui/` was the alternative and is worse: `ui/` is primitives a page
renders, and a state mechanism there invites domain state to follow it in.

**`set` and `update` are separate, and neither emits when the value has not changed.** One
overloaded setter would have to ask whether its argument is a reducer, which has no honest
answer once `T` may itself be a function. The `Object.is` guard is the thing every store used
to hand-write, and returning `prev` from `update` is now how a caller says nothing moved —
without it, a pointer move over a hotspot re-renders the whole HUD on mouse noise.

**Nothing hydrates from storage during a snapshot read.** The boot flag, the inspector overlay
and the motion override used to read `localStorage`/`sessionStorage` on the first
`getSnapshot()`, which React calls during render — safe only because they mutated a plain
variable and skipped the emit. Reading at module scope instead removes the hazard rather than
tiptoeing around it, and keeps `getServer()` at the initial value so hydration still matches
the server's markup.

## 2026-08-15 — The world exposes two store modules; three signals share one of them

`refactor.md` §4.2 says a client domain's store module is its public API and lists exactly two
for the world. `world/store.ts` is now hover, day/night and explore mode — three
`createStore` instances in one module, so a hover cannot re-render the sky — and `world/perf.ts`
is frame statistics, separate because it is the one the inspector reads.

Boot stayed out of both. It is a different lifecycle: it runs once, at startup, and nothing
reads it afterwards. `world/boot.ts` holds it until Phase 5 folds the fifteen boot files into
`world/boot.tsx`, which is where it belongs.

This is not "fewer files is better" — see §2.4's corollary. Merging three modules that the HUD
deck and the camera read together is a cohesion call; `mouse.tsx` and `keyboard.tsx` stay two
files for the same reason.

## 2026-08-15 — `--max-warnings` is `0`, four phases early

Every one of the eleven warnings under the old budget was the same import: nine files in
`features/world/` reaching into `features/studio/…/canvas-texture`. Phase 4 gave that module a
real home in `world/screens/texture.ts`, so the budget went to zero on its own and
`no-restricted-imports` now fails the build in practice, without waiting for Phase 7.

**What Phase 7 still owns is the glob, not the severity.** `@/features/*/**` does not match
`@/features/command-menu` — a domain's own `index.ts` is one segment short — so all eight edges
in `refactor.md` §4.5 import through a barrel and pass silently. A budget of zero over a rule
that cannot see the violations is worth exactly as much as the rule's reach, and saying so is
the point of this entry.

## 2026-08-15 — A block is a chunk, and a chunk's permalink is where it was derived from

Phase 3 rewrote the retrieval chunker. Three properties are worth keeping, because each
replaces something that failed silently and would come back the same way.

**Granularity is per block, and per item for `cards` and `timeline`.** The old chunker emitted
one chunk per page — the largest 2,979 characters — so a question about one engagement
retrieved the whole of `/work`. A timeline entry is a self-contained record, so it is a chunk.
86 chunks now, median 166 characters, largest 749. `TOP_K` rose 6 → 10 to compensate: the same
K over chunks a fifth of the size is a fifth of the prompt context.

**`ContentBlock.id` is required, not optional.** `anchor` was undefined on all 25 chunks of the
old index, so `buildCitations`' `#${anchor}` machinery had never once fired, and the cause was
that nothing in the authored record could be anchored to. Required makes an un-anchorable chunk
unrepresentable rather than guarded, and `site/blocks.tsx` renders the id, so the fragment
resolves against real markup.

**A chunk's permalink is the page it was derived from — there is no parameter for it.** Eight
of 25 chunks permalinked to `/` because the career chunks hard-coded `routes.home`, so the
agent cited the home page when asked about Peacock. Deleting those chunks fixed it by
construction: the career facts are `/work`'s and `/timeline`'s timeline blocks now. Do not
reintroduce a chunk source that invents a permalink for content that is not on that page.

`SourceKind` is `"career" | "site"`, both emitted. `"case-study"` and `"essay"` shipped in the
Zod schema, the script's types and six test fixtures for as long as the index existed, and
nothing ever produced either.

## 2026-08-15 — `/work` and `/timeline` are two projections of one record

`refactor.md` §5 counted four copies of the career record. There were five: `/timeline`
hand-wrote its own, with editorial groupings ("First lead roles", "The AI-native turn") that
merged two engagements into one stop and restated every date a fourth time.

`content/career.ts` is the record. `/work` projects the engagements with their points;
`/timeline` projects engagements plus education, merged chronologically on a sortable
`start`. The groupings are gone, and that is the cost: `/timeline` reads as a record rather
than as a narrative. It is the right trade only because the alternative was two hand-written
timelines that had already drifted — the wall panel invented a "2015 · Studio era" stop that
existed nowhere else, and `career.ts` listed Superglue as an operating company with no matching
engagement.

**`content/career.ts` carries no `server-only` marker, deliberately.** The 3D room is a client
island and its canvas screens read the record directly, which is what makes "a draw function
may not contain a fact" enforceable by construction rather than by review. The same reasoning
put `content/{principles,stack,playground}.ts` beside it rather than inside `prose/`. The rule
in `.claude/rules/three-r3f-world.md` is unchanged and still binds: a client island may read
these, never `content/prose`, which carries every page's text.

## 2026-08-15 — The home page renders its record visibly, and keeps one client island

`/` rendered a bespoke `HeroSection` inside a `.sr-only` wrapper, on the reasoning that the 3D
room _is_ the home page. Two costs came with that and only one of them was visible.

The visible one: home was the single route with no reading surface. The invisible one is worse
— home's authored `lede`, `stats` and `links` blocks were never rendered at all, so they sat in
the retrieval index, answerable by the agent, and absent from the page a crawler or a screen
reader reads. `content-in-dom.spec.ts` had a written exemption for `/` recording exactly this.
A guarantee with one route excused from it is a guarantee about sixteen routes.

So home renders `PageView` like the others. The room is still behind it; the panel sits over the
room the way every station's already did, so this is the layout the site already had on
sixteen-seventeenths of its routes.

Two things from the hero were not in the record and had to be decided rather than derived. The
**⌘K ask button stays**, as `site/home-cta.tsx` in a new `actions` slot: the agent is the
site's one dynamic surface, and without the CTA its only entry points are an icon button on the
deck and a keyboard shortcut nothing announces. The **five pattern badges go** — they are
`constants/patterns.ts`, not `content/`, and a landing that lists five capability labels above
the fold was saying less than the stats block below it. The availability line, which the hero
carried as its own shortened variant, is read from `content/profile.ts`.

`site/` holding a `"use client"` module is not an exception being carved: it reads
`command-menu`'s store, which is a sibling's public API under `refactor.md` §4.2, and Phase 7's
globs allow it as written.

## 2026-08-15 — `src/site/` is a new top-level domain, and the reading surface leaves the room

`refactor.md` §8 rule 1 requires a written justification for a new directory at the root of
`src/`: which ownership or runtime boundary it marks, and why no existing domain can own the
code. This is that entry, for Phase 2b's `src/site/`.

The boundary it marks is **the DOM reading surface**. Until now `destination-view.tsx`,
`destination-panel.tsx` and `content-blocks.tsx` lived in `features/world/components/`, so all
seventeen routes reached their own markup by importing the 3D domain. That is the dependency
`architecture.md` §3 names as the one that has to run the other way: "`site/` never imports
`world/`" is what makes "the room is an enhancement" structurally true rather than an intention.
With the renderer inside `world/`, the claim was documentation only — every page depended on
the room to render text, and nothing but habit stopped a block renderer from reading a scene
store.

No existing domain can own it. `world/` owning it is the defect. `content/` imports nothing and
has no behavior. `app/` is a leaf that composes. `ui/` may not know what a `Page` is. So the
answer to "who owns this?" was not already a domain, which is the test the rule sets.

Three files became two on the way. `destination-panel.tsx` had exactly one consumer — its
parent — and `content-rich-blocks.tsx` exactly one — the block switch. Both are the
fragmentation §2.1 measured and rule 4 replaced, so they were folded into `page-view.tsx` and
`blocks.tsx` rather than moved. `DestinationView` is now `PageView`: the domain is pages, and
"destination" is the room's word for one.

`features/world/index.ts` also stopped re-exporting `getDestination`. A barrel over `content/`
lets a client island reach the prose through the world, which is the bundle problem
`content/prose`'s `server-only` marker exists to prevent.

## 2026-08-14 — `decisions.md` comes off the authority ladder and becomes a record

It sat at **rank 3** in `architecture.md` §11 and `AGENTS.md`, above automated enforcement at
rank 4 — whose wording is "if it contradicts 1–3, the config may be the bug: investigate it."
Follow that through with an entry that has been overtaken and the failure is structural, not
editorial: the 2026-08-08 entry below says `max-lines` is 250/120, Phase 0 deleted the rule
outright six days later, and until this change the dead entry formally outranked the config and
instructed the reader to suspect the config.

That contract obliges 57 entries to stay accurate forever. The discipline it depends on had
already failed twice in eight days — both reversals were recorded forward-only, on the new
entry, leaving nothing on the entry a `grep` actually lands on. Nobody reads this file top to
bottom; `AGENTS.md` says so itself ("read the entry rather than the file"). A convention that
fails at eight days will not hold at eight months.

**The fix is to change what the file is, not to keep correcting what is in it.** `decisions.md`
is now the reasoning behind the rules, configs and tests, and is on no ladder. A decision binds
through the thing that enforces it. An overtaken entry therefore stops being a contradiction
and becomes history, which is the only state an append-only archive can hold indefinitely
without maintenance.

**This costs almost nothing, because the repository already works this way.** Every binding
constraint sampled — CSP `'unsafe-inline'`, the Playwright worker cap, the coverage thresholds,
`size-limit` being non-gating, the seeded PRNG, `server-only` — is already stated in
`AGENTS.md`, a `.claude/rules/` file, or the config that enforces it. This file was the sole
carrier of none of them, so nothing had to move: the change ratifies the layering that the
2026-08-10 entry "AGENTS.md holds only what has no other home" already established. `README.md`
had it right all along, describing this file as recording "the reasoning behind the non-obvious
calls" and never as authority.

**What was rejected.** Archiving by date: age does not predict staleness here, and the four
oldest entries include "every env var is optional" and "no store library", both still live
constraints cited in `AGENTS.md` and `architecture.md` §9 — a date cut would file those away
while leaving the dead `.devin/` entry in place. Deleting the file: 26 references point at it,
14 from source, test and config. Committing to mark every reversal forever: that is the
treadmill this entry exists to get off. Splitting it: if it is ever needed, split by lifecycle
— live constraints versus historical record — never by date, and not while the growth rate is
falling (37 of 57 entries came from one two-day hardening burst; the last two days produced
four).

The two entries known to be overtaken are struck through once as a courtesy, using the
convention two 2026-08-09 entries already established. That is a one-off, not a new obligation.

## 2026-08-14 — Refactor Phase 2a: the prose is one file per slug, `server-only`, and the URL map derives from it

Three calls made while moving the authored record into `content/`, each of which would
otherwise be re-litigated by whoever reads `architecture.md` next.

**One file per slug, not per sector.** `architecture.md` §6 described `content/pages/` grouped
into nine sector files; the tree that shipped is `content/prose/<slug>.ts`, seventeen of them,
and §6 has been corrected to match. Sector grouping means you must know `/uses` lives in
"tooling" before you can find its words, and it put a file and a folder both named `pages` in
one directory with opposite meanings. Seventeen files averaging ~42 lines looks like the
fragmentation this refactor exists to undo, and is not: these are authored documents with
independent lifecycles, not a component tree split by a lint rule. Rule 4 in `refactor.md` §8
is the test — different consumers, different lifecycle — and each page passes it.

**No `content/routes.ts`.** A `routes.ts` beside a `pages.ts` would encode all seventeen URLs
twice, in the phase whose entire purpose is single-authoring. `routes` is derived from the
`as const` page list through a mapped type, which is what keeps a string literal per route for
`typedRoutes`; the `Object.fromEntries` assertion is the only cast in the file and is commented
there. The editorial sector grouping stayed authored rather than derived, because a sector's
reading order is not the page order — deriving it would have silently reordered the deck's
Reach sector.

**`server-only` shipped with the move, not after it.** The client/server split inside `content/`
is the reason the domain is split at all: `Page` carries `blocks`, so one client island reading
a label off the prose collection ships every page's text to the browser. `architecture.md` §3
already named `import "server-only"` as the mechanism that makes this a build error rather than
a convention, and no later phase owned adding it.

Its cost is a resolution flag. The `server-only` package throws on its default export and is
empty on its `react-server` one, and two node processes legitimately read the corpus: the agent
index builder, and `content-in-dom.spec.ts`, which asserts every authored block reaches the HTML
over raw HTTP with no browser. Both now run under `--conditions=react-server`, set on the
`agent:index*` and `e2e*` scripts.

Three things about that flag are load-bearing:

- **It must be set at process start**, so it cannot live in `playwright.config.ts` — the config
  is evaluated after the runner has already loaded the spec files. It is on the npm script.
- **It must not reach `next build` or `next start`**, which have to resolve packages the way
  production does. `e2e:ci` prefixes only the `playwright` half, and `webServer.env` clears
  `NODE_OPTIONS` for the Playwright-managed server.
- **The alternative was worse.** Dropping the marker and policing the boundary with a lint glob
  in Phase 7 would leave the most expensive mistake in the domain — a client island importing
  prose — as a warning under a budget, instead of a failed build.

## 2026-08-14 — Refactor Phase 0: `max-lines` deleted outright, and "one export per file" retired

**This reverses the 2026-08-08 entry below**, which kept `max-lines` at 250 (120 for `.tsx`,
off for draw/geometry/data modules) as a loose backstop. There is now no `max-lines` rule in
`eslint.config.ts` at all, and no override block to go with it.

That entry's diagnosis was half right. It blamed a 100-line cap for the file-shredding, and
`refactor.md` §2.3 falsified the surviving half by measurement: no `.ts` file comes within 140
lines of the 250 cap and only 3 of 154 `.tsx` files sit above 100, so the caps as relaxed were
shredding nothing. **They were not the cause — but they veto the cure.** The consolidation in
Phases 4–6 produces files the caps forbid: `world/boot.tsx` (~560 lines, from fifteen files
averaging 41), `world/scene/lounge.tsx` (~600), `world/scene/mouse.tsx` (~364). Keeping a
number nothing currently violates, purely so it can block six correct merges later, is the
worst of both.

The actual cause was `architecture.md` §7's **"one primary, named export per file"** — a
fragmentation rule stated as a style rule. If a file may export one thing, a component tree
with fifteen nodes is fifteen files by arithmetic, which is exactly what the boot overlay,
`pixelated-portrait-*`, `audio` and `inspector-*` are. It sat in the _target_ document, so the
refactor would have carried the cause across the move. It is replaced by: **a file exports
what its concept needs; split when responsibilities differ — different consumers, lifecycle or
runtime — never to satisfy a number, and never merge to reduce one.** Same wording in
`architecture.md` §7 and `.claude/rules/project-structure.md`.

`max-lines-per-function` stays at 100 as an error and is now the only length gate, because
function length tracks complexity and file length tracks nothing.

Also in this phase: `architecture.md` §4 and `.claude/rules/project-structure.md` both claimed
the dependency rules were "lint-enforced as errors". They are `warn` under `--max-warnings 11`
with eight live violations, so both now say so and name Phase 7 as the change that makes the
claim true. `refactor.md` scoped Phase 0 to `architecture.md` alone, saying the rule file
"needs no change here" — wrong, since that file carries the same one-export rule and the same
false claim, and it is the file loaded on every `src/**` edit. `nextjs-app-router.md` and
`three-r3f-world.md` also recommended composing from `features/` and importing through
`@/features/world`; both now state the domain rule instead. The `paths:` frontmatter stays
dual-scoped until Phase 8.

As with the 2026-08-08 entry: relaxing a lint rule moves no code and changes no behavior, so
`pnpm validate` is the whole gate — no build, no E2E.

## 2026-08-14 — VSCode, not WebStorm; `.devin/` deleted, and the cspell rationale expired with it

The migration recorded on 2026-08-11 landed on **VSCode**, not WebStorm, and the Claude Code
trial succeeded — so `.devin/` is deleted, which is exactly what that entry said would happen.
`.claude/` was already the authored copy; the fallback was only ever insurance against the
trial failing. Devin stays in use until the paid month ends, and losing its three skills for
those weeks is the accepted cost of not maintaining two rule sets for a directory on its way
out.

**One file made the deletion urgent rather than optional.** `.devin/rules/project-structure.md`
still documented `features/`, `components/`, `utils/`, `constants/`, `stores/`, `hooks/` and
`providers/` as the **target**, with a tree, under `trigger: model_decision` — so it loaded
itself whenever anyone asked where a file goes, and answered with the architecture Phases 2–6
delete. Phase 0 of `refactor.md` carried steps 3 and 4 solely to correct it and to lift the
freeze that forbade the correction; both are now moot and were removed, and step 5 became
step 3. The other seven rules were byte-identical in body to their `.claude/` twins, and
`testing.md`'s drift was purely additive — its one enforceable rule, `user-event` over
`fireEvent`, is an ESLint error either way, which is what kept the drift tolerable.

**The freeze was the right call and still produced a wrong instruction.** That is the lesson
worth keeping: a frozen copy of a rule set is safe only while the thing it describes is also
frozen, and this one sat across a live architecture refactor. Next time the copy either tracks
the change or goes, at the point the refactor starts rather than at the point someone notices.

**The cspell rejection rested on a premise that is now false.** It was declined (2026-08-11,
and again in the US English entry of 2026-08-09) because WebStorm ships a built-in
spellchecker, so a `cspell.json` plus a dependency plus a `validate` step would duplicate it
for the human path — with the residual gap named honestly: the IDE only checks files a human
opens. **VSCode ships no spellchecker.** The gap those entries describe is therefore wider
now, not equal: nothing checks copy on any path, human or agent. The two older entries stand
as written — they record what was true when decided — and this is the correction.

**The conclusion does not change; only the reason does.** cspell stays out, now on its own
merits rather than on redundancy: a curated wordlist for three.js, Next.js and R3F jargon,
bought for a class of error that cannot break the build. What changes is that
`language-and-copy.md` is now the _only_ thing holding US English, so it is load-bearing for
the human path as well as the agent one. The one live artifact, `"cSpell.language": "en-US"`
in `.vscode/settings.json`, is removed; no config, dependency or gate ever existed to remove.
`.idea/` came out of `.gitignore` in the same change.

---

## 2026-08-13 — pnpm settings live in `pnpm-workspace.yaml` only, and the pins now bite

`.npmrc` is deleted. pnpm 11 reads its own settings from `pnpm-workspace.yaml` and CLI
flags; it accepts `.npmrc` and `npm_config_*` without complaint and ignores them. Verified
against pnpm 11.7.0: with `engine-strict=true` in `.npmrc`, a package declaring
`engines.node: ">=99"` installs cleanly; the same setting as `engineStrict` in this file
fails as intended. `package-manager-strict` behaved the same way.

That made all three `.npmrc` lines dead from the day they were added (`8938999`, the same
day `pnpm@11` was pinned) — so nothing had ever enforced the Node 24 / pnpm 11 pins that
`AGENTS.md` calls pinned. `engineStrict` and `packageManagerStrict` now carry them; both
default to false, so they buy real checks rather than restating a default.
`auto-install-peers` is not carried over — it has been pnpm's default since v8.

**This is a behavior change, not a repair.** `pnpm install` on the wrong Node now fails
where it used to succeed. That is the point, but it is also the thing someone will hit and
be tempted to switch off.

Found via the same class of bug in `scripts/ci-local.sh`, which set the store location
through `npm_config_store_dir`. Ignored, so pnpm fell back to its default — and because
`$HOME` in the container is on a different filesystem from the bind-mounted `/work`, the
store relocated into the working tree, leaving 343 MB of untracked `.pnpm-store/`. Fixed
with the real `--store-dir` flag. It is deliberately not gitignored: nothing is supposed to
write it, so its appearance is a signal. The script asserts on it after installing, because
the first version of this failure announced itself only as a dirty `git status`.

The two dead settings had been canceling out — the script disabled `engine-strict` for a
container whose Node differs, and neither half worked. Hence one commit: turning the pins
on without `--config.engineStrict=false` in the container would break `pnpm e2e:runner`.

## 2026-08-11 — `restructure-plan.md` deleted: its premise was wrong, not its diagnosis

`restructure-plan.md` always said of itself "delete when phases 1–7 land". It is being deleted
for a different reason: **it was superseded before it was executed.** Its replacement is
[`refactor.md`](./refactor.md), and the target it moves toward is
[`architecture.md`](./architecture.md).

References to the deleted file survive in older entries below. This entry is their redirect.

**The diagnosis was right and is kept.** A 100-line `max-lines` cap was manufacturing files —
a 417-line canvas portrait cut into six modules that import each other only to stay under the
cap. Layering by technical kind twice (`src/` buckets, then the same buckets inside every
feature) meant finding the boot overlay traversed kind → feature → kind → cluster. Names had
stopped describing ownership: `config/brand.ts` is three.js material tokens with 44 importers,
`features/studio` is not a feature, `src/stores/` held state owned by one feature. Phase 0
fixed the cause and shipped; the rest of the analysis carries into `refactor.md` §2.

**The charter was wrong.** Every phase was defined as "a pure move/merge with no behavior
change", and that constraint could not survive contact with the repository. Re-auditing found
that roughly a third of the necessary work is deletion and correction, not relocation:

- The career record is authored **four times** in three formats, and has already drifted three
  ways. A move-only plan gives all four copies better addresses.
- Three dependencies — `motion`, `sonner`, `lenis` — are wired into the provider tree and do
  nothing. `knip` cannot see them because the imports are real.
- The product states things that are not true: `/playground` advertises a feature deleted in
  `b72c1e5`, the inspector's empty state cites an SVG that does not exist, and the agent's
  system prompt and refusal text both send users to a site footer that does not exist.
- Retrieval is a data defect, not a layout one: 25 whole-page chunks, `anchor` undefined on
  every one of them so the citation deep-links cannot fire, and 8 chunks permalinked to `/`.

None of that is reachable by moving files, and a plan that forbade behavior change would have
canonized all of it in a tidier tree. "No behavior change" is the right promise for a
refactor of _correct_ code; this code is a partially finished product, and treating it as
correct was the error.

**What replaced it.** One charter — author content once, derive every representation, delete
what does not earn its place — and a rule that every change declares which of six kinds it is
(deletion, consolidation, structural refactor, bug fix, architectural redesign, product/UX),
so the one kind that changes what a visitor sees stays isolated and schedulable.

**Two structural conclusions are also reversed**, both from the same cause: they were derived
from the old tree rather than from the product.

- The old target kept `features/`, with `agent/` inside it beside `command-menu`. But the
  agent is server-only, and a folder whose lint rule exists to police client barrels is the
  wrong home for it. Domains now sit flat at the root of `src/`.
- The old target kept barrels as the cross-feature import surface. With shallow domains there
  are no internals left to protect, so the barrels buy nothing and cost a client bundle
  pulling in content-bearing modules it never reads. They are deleted and the dependency
  rules are enforced on paths directly.

## 2026-08-11 — `architecture.md` is now normative, not descriptive

`architecture.md` used to open with "What the codebase **is** today. The code wins; where they
disagree this file is stale." That contract was correct while the tree was the thing being
described. It is wrong now, and holding it produced a real failure mode: the file documented
`features/studio` and `src/stores/` faithfully, which made an accidental structure read as an
intended one to anyone — human or agent — arriving without the history.

The file is now the **design target**, and it is the authority when the code disagrees.
`refactor.md` tracks the distance between them and is deleted when it reaches zero.

This inverts entry 6 of the authority list in the same file — "existing implementation:
evidence of what is, never authority for what should be" — from a caveat into the operating
principle. The codebase contains temporary 3D work, duplicated content, abandoned experiments
and historical structure. A document that describes it accurately is, for as long as that is
true, a document that recommends it.

The cost is real and accepted: for the duration of the refactor, `architecture.md` describes
folders that do not exist yet. That is why the header says so explicitly, and why the phase
list lives in a second file rather than being implied by the first.

## 2026-08-11 — The coverage exclusion list is two entries, and that was a correction

Phase 7 was first drafted with a nine-entry exclusion list: the 17 route pages, both layouts, the
satori icons, `global-error`, `loading`, `error`, `not-found`, `root-metadata.ts`,
`telemetry/constants.ts` and four type-only modules. Each had a reason that sounded like "this
cannot be asserted here" and mostly meant "this is inconvenient to assert here". **It was
reviewed and reversed before it was committed**, which is why the history shows only the
two-entry list — this entry is the record of the wrong turn.

Two measurements settled it. First, removing every exclusion moved coverage from 98.92% to
97.25% — the list was worth 1.7 points, so it was neither hiding a problem nor buying much.
Second, and decisive: **everything on it turned out to be reachable.** A route page renders
server-side in 20 ms; satori rasterizes a real 32×32 PNG in 45 ms and the bytes can be checked
against the declared `size`; the error boundaries, the spinner and the 404 render under Testing
Library; `root-metadata.ts` is plain data; both layouts render as the shell a visitor actually
gets. The claim in the deleted plan that these were E2E-only was inherited, not tested.

Two dependencies genuinely do not run headlessly, and stubbing them at the library boundary is
what made the files above measurable rather than excluded: `next/font/google` is a build-time
transform whose loader is not a function outside a Next build, and `@vercel/analytics` injects
its script on mount so it leaves nothing in server-rendered markup. That is the general rule
now written into the config: **check whether what cannot run is the file or a dependency of it.**

What is left is `src/**/*.d.ts` and the specs themselves — no executable code in either. Type-only
modules need no entry at all: they compile to nothing, so v8 never reports them.

The residue is honest rather than excluded. `layout.tsx` and the boundaries are covered but E2E
still owns what only a real request proves — metadata _inheritance_, which does not exist until a
route renders, and the icons served through the hashed href the page emits. And two mutations in
this batch survived as genuine equivalent mutants: changing a favicon's declared _and_ rendered
size together is not a defect, and only the mismatch is.

## 2026-08-11 — `testing-plan.md` deleted, and where its content went

The plan said of itself: "This plan is temporary and gets deleted when its phases land."
Phases 0–7 have landed, so it is gone. What it carried has been split by whether a tool can
enforce it:

- **The coverage targets are now thresholds** in `vitest.config.ts`, which `pnpm validate` and
  CI both run. A number in a document is a wish; a number in a config is a gate.
- **The exclusion list was re-derived from scratch and came out at two entries** — see the entry
  above it, which supersedes the plan's own list.
- **The conventions moved to `.claude/rules/testing.md` and `AGENTS.md`** — what each kind of
  test owns, the jsdom-by-filename split, the helper locations, the repo's mechanical traps.
- **The findings stayed here.** Every phase's defects already have entries above.
- **The one unfinished item was already recorded here** — the DOM-only visual baselines, in the
  2026-08-09 entry. It is not lost; it was never started.

What is deliberately _not_ preserved is the phase narrative: which phase bought which
percentage, the measured tables, the "shape of the gain" arguments. That was scaffolding for
sequencing work that is now done, and `git log` holds it if anyone wants the history.

The reason to delete rather than archive is the same one behind
[the no-roadmap entry](#2026-08-07--no-roadmap-document): a document nothing forces to stay
true will drift, and this one went stale four times _while being actively maintained_. Its own
§2 said so.

## 2026-08-11 — Coverage thresholds are global, not per-directory

`testing-plan.md` §5.3 argued for per-directory thresholds, and it was right that 90% on pure
math and 90% on a lighting rig mean different things. It is still the wrong instrument to
install **now**: `restructure-plan.md` moves or merges nearly every directory in `src/`, so a
threshold keyed on `src/features/studio/components/scene/**` either fails the build during a
pure `git mv` or silently stops applying to the files it was written for. That is the same
class of mistake as keying the jsdom/node split on a directory, which §5.4 already rejected.

So: global floors on all four metrics, set from a measured run and floored to whole numbers,
plus exactly two path-keyed rows — `src/app/api/**` and `src/rate-limit.ts` at 100%. Those two
are exempt because their locations are fixed by what they are (the HTTP surface and the abuse
limiter) and because they are the highest-risk files in the repo.

**Revisit per-layer thresholds after the restructure lands**, when the paths are stable. Until
then the branch column is the honest signal: it sits five points under statements because of
`noUncheckedIndexedAccess` guards and `?? fallback`s that cannot be reached without testing
TypeScript instead of the product.

## 2026-08-11 — `features/audio` is tested, not excluded: it never used Web Audio

The plan listed audio as "Web Audio, no jsdom equivalent" and no phase ever claimed it, which
left 239 lines at 8.8% coverage. **The premise was false.** There is no `AudioContext`
anywhere in `src/`: the engine is four `HTMLAudioElement`s and a volume ramp on
`setInterval`, and jsdom provides both. Only `play()` and `pause()` are unimplemented, and
stubbing those two prototype methods also removes jsdom's "Not implemented" noise from the run.

It is now at 100% statements and branches, and the branches were worth having, because they are
all cases where sound must **not** happen: a browser that blocks autoplay (`play()` rejects, and
fading up anyway would leave the volume set on a paused element so the next legitimate start is
silent), a visitor who asked for reduced motion, a returning visitor who must wait for a gesture,
and storage the browser refuses.

One finding worth keeping for any effect-heavy spec here: **the React Compiler decides what is
observable.** `WorldAudio`'s two "did it actually change" guards looked untestable — the effects
never re-ran on an ordinary re-render, because the compiler memoizes the context value and
`play` keeps its identity. The one thing that moves it is the `enabled` flag, so toggling sound
off and on is the seam that proves those guards. Three mutations survived before this was
understood; a spec that mounts and re-renders is not enough here.

## 2026-08-11 — `WebGLContextGuard` deleted: three.js already prevents that default

The component added a `webglcontextlost` listener to the canvas whose entire body was
`event.preventDefault()`. three's own `WebGLRenderer` registers the same listener in its
constructor — deliberately before the context is created (`#12753`) — and its handler calls
`event.preventDefault()` and sets `_isContextLost`. So the guard could not change anything
observable: the event is prevented either way, and both handlers run.

It was found by trying to test it. The first assertion — dispatch a cancelable
`webglcontextlost` on `gl.domElement`, expect `defaultPrevented` — passed with the component's
body removed, and the paired "stops listening after unmount" assertion failed, because three's
listener is still there. A component whose only test cannot fail is the same finding Phases 3,
4 and 5 each produced once, and it takes the same fix: delete it rather than exclude it from
coverage or write a test that asserts registration instead of behavior.

If a real need appears — logging the loss, or showing the visitor a fallback — it should be a
component that does that observable thing, not a second `preventDefault`.

## 2026-08-11 — Phase 5's leak had five more call sites than recorded

The entry below names six components and "roughly ten textures and seven geometries". That was
the audit's count, and the audit missed a shape: **five more call sites held a
`createCanvasTexture` in a `useMemo` with no cleanup** — the four `screens/` hooks
(`code-screen`, `terminal-screen`, `metrics-screen`, `tablet-screen`), which are the desk's
three monitors and the graphics tablet, and `props/wall-screen.tsx`, which is instantiated once
per wall station and therefore leaks five 600×800 textures at a time. Nine textures in total,
on exactly the path the entry below describes: turning motion off mid-session unmounts the
canvas, and every one of them stays on the GPU.

The reason they were missed is worth keeping, because it will recur. Phase 5 audited the
`*-textures.ts` factories and the scene components that call them; these five are _hooks_ that
wrap a factory, and one of them lives in a different feature from the factory it imports.
`grep -rn "createCanvasTexture("` finds all of them and is the check to run — it now returns
eleven call sites, each either inside a `useDisposable` factory or inside a `*-textures.ts`
factory whose result is held by one, and each covered by a test that fails if the disposal is
removed.

## 2026-08-11 — Three RTTR traps the test harness owns rather than each spec

`tests/r3f.tsx` grew three non-obvious pieces during testing-plan Phase 6. Each one produced a
test that passed while asserting nothing, so they are recorded here rather than left as
comments.

**`@react-three/postprocessing` has to be inlined alongside fiber.** `vitest.config.ts` already
prefers fiber's ESM build and inlines `fiber`/`drei`/`test-renderer` (see the 2026-08-08 entry
on two `Mesh` identities). Postprocessing was not on that list, so it resolved fiber's **CJS**
build and its `useThree` looked for the root in a second React context — failing with "R3F:
Hooks can only be used within the Canvas component!" from inside a component that plainly is,
preceded by three's "Multiple instances of Three.js" warning. Any package that calls a fiber
hook belongs on that list.

**`Box3.setFromObject` and `getWorldPosition` do not refresh ancestors.** Both call
`updateWorldMatrix(false, true)` — descendants, not parents — so a mesh three groups deep
reports its position as though every group above it sat at the origin. A lounge spec asserting
the sofa sits on the rug passed on exactly the number it expected, in the wrong space. The
harness now calls `scene.updateMatrixWorld(true)` on every read.

**A captured `RootState` goes stale.** R3F replaces the state object on every `set()`, and
`<PerspectiveCamera makeDefault>` is a `set()`. A probe that captured `useThree()` at mount
therefore kept the renderer's default 75° camera while the scene drove another one, so a camera
assertion read a camera nothing was moving. The probe now reports the _store_ and `state` is a
getter over `store.getState()`.

Two smaller things that are stubs rather than traps, both on the mock renderer and both stubbed
through the new `prepare` hook: `compileAsync` is real three code that polls a driver which does
not exist headlessly and leaves a timer running past the test, and `ContactShadows` renders to
an offscreen target every frame that a mock context has no framebuffer for. `prepare` exists
because three defines `compileAsync` as an own property of each renderer — there is no prototype
to spy on — and the components that call it do so from a mount-time effect, so the renderer has
to exist before its children mount.

## 2026-08-11 — Phase 5's leak: `useDisposable`, and why `useMemo` was the wrong holder

Testing-plan Phase 5 went looking for draw-routine transcripts and found that **`src/`
contained no `dispose()` call at all**, against a `three-r3f-world.md` rule that requires one:
"textures and geometries built imperatively must be disposed on unmount." Six components were
affected — the lounge television, the keyboard legends, the cityscape's six facades and its
sky, the moon's glow and surface, and the mouse's shell, three bands and three seams. Roughly
ten textures and seven geometries.

**It is reachable, which is what made it worth fixing rather than noting.** `world-stage.tsx`
gates the canvas on `isClient && !reducedMotion`, and the reduced-motion store is explicitly
built to follow an OS preference that changes mid-session (Phase 3 tested that branch). So
turning motion off unmounts the entire scene, and every one of those resources stays on the
GPU; turning it back on allocates a fresh set. R3F disposes what it **reconciles** from JSX,
and a texture passed as a `map={…}` prop was never reconciled, so nothing else was ever going
to free it.

The fix is one shared hook, `src/hooks/use-disposable.ts` — placed there rather than in either
feature because `world` and `studio` both import it, which is the two-importer test in
`project-structure.md`. It takes the factory rather than the built resource, so a call site
cannot memoize and forget the cleanup, or — the subtler trap — write an effect against an
array literal that is rebuilt every render and therefore disposes the live resource.

**It holds the resource in `useState`, not `useMemo`, and that is the load-bearing detail.**
React is explicitly free to discard a `useMemo` and recompute it; for a value that has to be
released by hand, a discarded memo _is_ the leak. A lazy `useState` initializer is the hook
that runs exactly once. The React Compiler's lint pushed toward this independently — it
rejects `useMemo(create, [])` because the first argument is not an inline function — but the
correctness argument is the reason, and it is why this should not be "simplified" back.

Two smaller notes. The walk that finds disposables inside an array or an object uses
`Object.values` alone: an explicit `Array.isArray` branch was written first, and the mutation
pass showed removing it changed nothing, because `Object.values` already returns an array's
elements. It was deleted rather than covered — the Phase 3/4 rule applied a third time. And
the walk checks `typeof value.dispose === "function"` rather than the key alone, because the
mouse hands back a `Vector3` beside its geometries and `createCanvasTexture` hands back a
`{ canvas, texture }` pair, so the collection genuinely contains non-resources.

## 2026-08-11 — ~~`.claude/` is authored; `.devin/` is a frozen fallback~~

> **Overtaken by "VSCode, not WebStorm" (2026-08-14) above:** `.devin/` is deleted. The
> wiring half — `CLAUDE.md` `@`-importing `AGENTS.md`, rules and skills under `.claude/` —
> is still exactly how this repository works.

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

## 2026-08-08 — ~~`max-lines-per-function` replaces `max-lines` as the real cap~~

> **Overtaken by "Refactor Phase 0" (2026-08-14) above:** there is no `max-lines` rule at
> all now. `max-lines-per-function: 100` survives, and is the half of this entry still live.

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
