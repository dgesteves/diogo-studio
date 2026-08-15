# diogo-studio

A portfolio whose navigation _is_ a 3D world: Next.js 16 App Router, React 19, TypeScript,
three.js + React Three Fiber (~40% of `src/`). Private, on Vercel. No database, no auth, no
Server Actions — the only server surface is `/api/chat`, `/api/health` and the metadata routes.

```bash
pnpm install     # Node 24+, pnpm 11+, both pinned
pnpm dev
pnpm validate    # lint + typecheck + format:check + test + knip — the commit gate
pnpm build       # agent:index:check runs before, prerender:check after
pnpm e2e:ci      # Playwright + axe on a production build (`pnpm e2e:install` once)
```

**`pnpm validate` runs neither `build` nor `e2e`.** Anything touching routing, metadata, the
3D world, focus or timing is unverified until `pnpm e2e:ci` is green. Three skills carry the
workflows: `/gates` picks the gates and reads a failure, `/e2e` runs and triages Playwright,
`/commit` picks a commit type.

## Principles

1. **Server-first.** Server Components by default; `"use client"` only for state, effects,
   refs, browser APIs or events, pushed to the leaves.
2. **Static rendering is this site's main performance asset.** Rendering is dynamic-by-default
   under Cache Components, so an uncached dynamic read silently de-optimizes a route.
   `pnpm prerender:check` is the guard — never satisfy it by removing a route from its list.
3. **The 3D world is an enhancement, never the only path to content.** Everything must be
   reachable with reduced motion and with no canvas. WCAG 2.2 AA is a gate, not a report, and
   a clean `pnpm lint` says very little about it.
4. **Validate at the boundary** with Zod, and prefer making illegal states unrepresentable to
   defensive checks. (`any`, non-null assertions and loose casts are already lint errors.)
5. **Secrets stay server-side, and every env var is optional** — features degrade instead of
   failing (no `OPENAI_API_KEY` → `503`, no `UPSTASH_*` → in-memory limiter, no Sentry DSN →
   skipped). Preserve that when adding one; read env only through `@/env`.

## Framework behavior that isn't visible in the source

Version-bound to Next 16.3 / React 19.2 / Tailwind 4 — re-verify here on a major upgrade.

- **Memoization is automatic** (`reactCompiler`): write plain code, add no speculative
  memoization. `useMemo`/`useCallback` stay valid where referential stability is part of the
  contract — a three.js object, an effect dependency, an identity-comparing external API.
- **Routes are typed** (`typedRoutes`): `Link href` and `router.push` take a real route, never
  a `string`. Narrow an untrusted href with `asInternalHref()` from `@/content/pages`.
- **Caching is opt-in** (`cacheComponents`) via `use cache` + `cacheLife()`/`cacheTag()`. It
  removed the `dynamic`, `dynamicParams`, `revalidate` and `fetchCache` segment configs;
  `maxDuration`, `runtime`, `instant` and `prefetch` remain valid and `/api/chat` uses
  `maxDuration`. The official docs are inconsistent about `dynamicParams` — **trust the build
  error over any prose, including this file.**
- **Synchronous IO during prerender is a build error**, not a de-optimization: `new Date()`,
  `Date.now()`, `Math.random()`, `crypto.randomUUID()`.
- **Navigation hides routes rather than unmounting them** (React `<Activity>`, up to 3), so
  state and DOM survive and effects re-run on show. The canvas and HUD live in the `(world)`
  layout and are unaffected — but new stateful client UI inside a station page must not assume
  a fresh mount.
- **Tailwind 4 is CSS-first:** no `tailwind.config.*` exists or should be added; tokens live in
  `src/globals.css` under `@theme`. Don't reintroduce a legacy config because older
  examples use one.
- **Prefer the React 19 `ref` prop** for new code. `forwardRef` is deprecated but supported —
  no ban, no migration.

## Authority, and keeping this file true

1. Security, accessibility and web standards — OWASP, WCAG 2.2 AA, W3C/WHATWG/RFC/MDN.
2. Official docs for the installed versions — Next 16.3, React 19.2, TS 6, Vitest 4,
   Playwright 1.62.
3. The recorded design target — `docs/architecture.md`. May override (2), never (1).
4. Automated enforcement — tsconfig, ESLint, Vitest/Playwright, CI. If it contradicts 1–3, the
   config may be the bug: investigate it.
5. These instructions — `AGENTS.md`, then `.claude/rules` and `.claude/skills`.
6. Existing implementation — evidence of what is, never authority for what should be.

**`docs/decisions.md` is not on this ladder.** It is the reasoning behind (3), (4) and (5) —
dated, append-only, and a record of what was true when it was written. Read an entry to learn
why a rule or a config is the way it is; never treat one as the rule itself. **A decision binds
through the thing that enforces it**, so when an entry and the current config disagree, the
config is right and the entry is history.

**"The repository does X" is never by itself a reason to do X.** Before copying an existing
pattern, check whether (1)–(3) endorse it; if not, treat it as potential technical debt — say
so, keep the change scoped, and either fix it or record why you deferred. **But divergence is
a decision, not a side effect:** two conventions inside one module are worse than either, so
make the smallest correct change and take a broader correction to `docs/decisions.md` or the
user. **When an instruction here is wrong, fix it in the same change** — claims in this system
have shipped wrong before, and a rule nobody corrects is how. If a check can enforce it
(TypeScript, ESLint, a test, CI), prefer the check over the rule.

**`docs/architecture.md` is normative.** It describes the six-domain architecture and wins
when the code disagrees — and a disagreement is now a defect in one of the two rather than
work waiting to happen, because the architecture is held by `eslint.config.ts` and
`tests/boundaries.test.ts`. `docs/decisions.md` holds the reasoning, append-only, so read the
entry rather than the file. Standards and placement live in `.claude/rules/` (activated by
file type).

## Constraints that are easy to trip over

- **`pnpm validate` gates coverage.** Thresholds live in `vitest.config.ts` — global rather
  than per-directory, for the reason commented there. Re-measure with `pnpm test:coverage`
  before citing any figure, and
  raise a threshold only from a measured run. **Never lower one to make a change pass**: the
  number went up because a test was written, so it comes down only when code is deleted.
- **Test helpers live in `tests/` and are imported through `@tests/*`** — `r3f` for the scene
  graph, `recording-ctx` for canvas draws, `interactions` for act-wrapped user-event, plus
  `stores`, `media`, `env` and `agent`. Write one when its second caller appears, not before;
  `knip` fails on an unused file. Colocate specs at the **cluster root**, one file per concept
  rather than per source file, so a `git mv` of the folder carries them.
- **Judge the environment by what the test touches, not what the module is about.**
  `*.dom.test.{ts,tsx}` runs under jsdom with `vitest.setup.ts`; everything else runs under
  node. Node is the default so a missing marker fails loudly with `document is not defined`.
- **`src/agent/index.generated.json` is generated.** It derives from `src/content/**` and
  nothing else, so edit a source there — most often `src/content/prose/**` or
  `src/content/career.ts` — then run `pnpm agent:index` and commit the result. Every chunk's
  permalink and anchor come from the page it was derived from; there is no parameter for
  either, and reintroducing one is how the agent last ended up citing `/` for Peacock work.
- **`src/content/prose/**` is `server-only`, and that reaches the scripts.** The package throws
  outside a server module graph, so anything in node that reads the corpus runs under
  `--conditions=react-server` — it is on the `agent:index*` and `e2e*` scripts, and must stay
  off `next build` / `next start`. Run those through `pnpm`, never bare `tsx` or `playwright`;
  CI ran `pnpm exec playwright test` for a day and every E2E job died on import.
  `playwright.config.ts` now fails fast with that instruction, so the rule is checked.
- **"Inspector" is a brand, not a directory.** `command-menu/` is the ⌘K surface, whose agent is
  branded "the Inspector agent"; `telemetry/` is the Web-Vitals overlay, whose UI is labeled
  "Inspector · receipts". The `features/inspector` folder that made the name ambiguous is gone;
  the copy and the `Inspector*` identifiers that match it stay, deliberately — four E2E specs
  assert on those strings. See `docs/decisions.md`.
- **The AI endpoint's safety properties already hold and break silently.** When touching
  `/api/chat`, `src/agent/**` or the answer UI, keep them: user text stays in the user message and
  is never concatenated into the system prompt; model output renders as text, never HTML, and
  never becomes a URL or route; citations resolve only against the server-built citation list,
  with hrefs through `asInternalHref()`; the input cap, output-token cap, `maxDuration` and
  rate limiter stay; the refusal path stays tested; never leak the system prompt or index in a
  response or error. Corpus content not authored in this repo would be untrusted prompt input
  and needs its own review.
- **CSP: `'unsafe-inline'` is an accepted limitation of a fully static build, not a TODO.** The
  invariant that bounds it: **no user- or model-derived content reaches an inline script or
  HTML sink.** A nonce-based CSP forces every route dynamic and is incompatible with PPR, so
  don't introduce one; any future change must prove the inline blocks still run, the routes
  stay static, and `prerender:check` passes. See `docs/decisions.md`.
- **All human-readable text is US English (en-US).** Correct the neighbors rather than matching
  them; never rename an identifier to fix spelling.
- **Comments earn their place** — a measured decision, a workaround, a non-obvious constraint,
  as in `eslint.config.ts` and `playwright.config.ts`. Never restate the code.
- **New dependency releases must age 24 h** (`minimumReleaseAge: 1440`). Never raise, bypass or
  exclude a package to get a build green — escalate. For an audit advisory prefer an aged patch
  or a `pnpm-workspace.yaml` override, never a floating range.
- **Audio assets must be licensed for commercial use** (Pixabay / Mixkit / Freesound per-clip);
  record license and attribution. Never commercial music.
- **GitHub Free, private repo:** no branch protection and no required status checks, so nothing
  stops a red push but you. Upload CI artifacts only on failure, with `retention-days`. Full
  table in `docs/architecture.md`.
