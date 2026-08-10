# Agent notes

This file is loaded on **every** session, so it stays small and holds only what is true
regardless of what you are touching. Everything else is routed:

| Where                                                    | What                                               |
| -------------------------------------------------------- | -------------------------------------------------- |
| [`.devin/rules/`](./.devin/rules)                        | coding standards, loaded by file type or on demand |
| [`.devin/skills/`](./.devin/skills)                      | procedures: `/verify`, `/e2e`, `/commit`           |
| [`docs/restructure-plan.md`](./docs/restructure-plan.md) | authoritative for anything structural              |
| [`docs/testing-plan.md`](./docs/testing-plan.md)         | authoritative for coverage targets                 |
| [`docs/architecture.md`](./docs/architecture.md)         | the tree as it is today                            |
| [`docs/decisions.md`](./docs/decisions.md)               | why the non-obvious calls were made                |

**Keep this file under 16 KB.** Always-on rules are truncated at that size, silently, and
the tail is simply never loaded. If you need to add something here, first check whether a
rule or skill is its real home.

## Status: do not start a restructure phase

**Restructure Phase 0 has landed; Phases 1–7 are blocked on
[`docs/testing-plan.md`](./docs/testing-plan.md)**, whose Phases 0, 1 and 2 are complete
(Phase 2 minus its visual baselines, deliberately). **Testing-plan Phase 3 — client state,
hooks, providers — is the next thing to work on.**

Phase 1 closed the server holes (`rate-limit.ts` and `app/api/chat` went 0% → 100%
statements, `src/ai` to 98.4%) and Phase 2 covered every route, the SEO surface, the studio
map and the ⌘K agent from the outside, finding **two production defects and one test that
could not fail**. But the layers a refactor would break are still thin at the unit level:
`command-menu` at 4.2% components / 1.2% hooks with **0% branches**, `world/components` at
22.3%, `world/hooks` at 2.4%. "Pure move, no behavior change" is therefore unverifiable —
E2E proves the product works, not that a moved module kept its contract.

Two changes have shipped outside that block and they set the bar: Phase 0 (a lint-cap
relaxation, moving no code) and the `station-index` / `(world)` split, which moved code but
came with a **measured** justification and a new invariant test guarding it. Anything less
— tidying, renaming, "obvious" moves — waits for the suite, and each exception needs an
entry in [`docs/decisions.md`](./docs/decisions.md).

### Reading the coverage numbers

Unit coverage is **35.9% statements / 27.5% branches** (30 files / 237 tests, measured
2026-08-09); E2E is **210 runs across 14 specs**, green under `pnpm e2e:ci`.

**Re-measure before citing these.** They have drifted four times, every time understating
real progress, and two figures in an old table were **never real**: `world/components` was
quoted as 11% when v8 had been printing 22.3% all along, and `command-menu`'s "8%" was a
hand-rolled aggregate v8 does not emit. Copy the rows `pnpm test:coverage` prints, and
update [`docs/testing-plan.md`](./docs/testing-plan.md) §2 alongside this paragraph.

**Phase 2 lowered the branch number (27.7% → 27.5%) and that is correct.** Vitest does not
instrument the browser, so 79 new E2E tests are invisible to it, while the two fixes added
`src/` branches only E2E covers. Never read this number as how well the product is tested,
and never ratchet a threshold in the same commit as an E2E phase.

## Verification

```bash
pnpm validate   # lint + typecheck + format:check + test + knip — before every commit
pnpm build      # agent:index:check before, prerender:check after
pnpm e2e:ci     # Playwright + axe; needs `pnpm e2e:install` once
pnpm size       # review signal, not a gate
```

`pnpm validate` is the gate but it does **not** run `e2e`, so a green validate says nothing
about the Playwright suite — it was silently red on `main` for weeks because nobody ran it.
`pnpm lint` must report **exactly 11 warnings and 0 errors**; never add to that count and
never silence one with an inline `eslint-disable`.

Use **`/verify`** for the full gate sequence and what each step catches, and **`/e2e`** for
running or triaging Playwright — including why `pnpm e2e` is not what CI runs.

## Repository constraints (private, GitHub Free)

Do not add workflows or re-add removed ones without checking these first — the plan, not
the config, is what makes them fail:

- No branch protection or rulesets, so `main` is unprotected and **no required status
  checks exist**. Anything depending on them (PR auto-merge, `CODEOWNERS`) does not work.
- No code scanning — CodeQL needs the paid Code Security add-on, and OSSF Scorecard is
  public-repository-only.
- **2,000 Actions minutes/month** and a **500 MB artifact quota**. Upload artifacts only on
  failure, always with `retention-days`.

The full table with rationale is in the Quality gates section of
[`docs/architecture.md`](./docs/architecture.md).

## Facts with no other home

- **The package is ESM and every authored file is TypeScript.** `"type": "module"`, and
  `eslint.config.ts`, `postcss.config.ts`, `commitlint.config.ts` and `vitest.config.ts` are
  all `.ts`. There are **zero `.js`/`.cjs`/`.mjs`/`.mts` files** and no `require`,
  `module.exports`, `__dirname` or `__filename` anywhere. Don't reintroduce a `.mjs` to
  disambiguate what is no longer ambiguous — and note `pnpm typecheck` covers the build
  config only because it is TypeScript; a `.js` config would be invisible to it.
- **`jiti` is a real dependency, not decoration.** ESLint needs it to read a TypeScript
  config and declares it only as an _optional peer_, so before it was declared here linting
  worked purely because `vite` happened to supply it. Remove it and `pnpm lint` stops being
  able to load its own config.
- **`src/constants/agent-index.json` is generated, not authored.** Its sources are
  `src/constants/{career,patterns,routes}.ts` + `config/site.ts` (read by
  `scripts/agent-index/virtual-chunks.ts`) and `features/world/constants/destinations.ts`
  (read by `destination-chunks.ts`). Edit a source, then run `pnpm agent:index`; `prebuild`
  runs `agent:index:check` and fails the build when the committed index is stale.
- **`src/constants/career.ts` looks dead but isn't.** Zero runtime consumers — only
  `scripts/agent-index/virtual-chunks.ts` (build-time) and its own test import it. Don't
  delete it as unused; `knip` won't flag it either.
- **"Inspector" means two different things.** The ⌘K surface is `features/command-menu`,
  and its agent is branded "the Inspector agent" in the UI. `features/inspector` is
  unrelated — it is the performance / Web-Vitals overlay. This collision has already
  produced one wrong doc; don't let it produce another.
- **`src/config/brand.ts` is not brand colors.** It is three.js material tokens
  (`roughness`, `metalness`, `color`) with ~40 importers.
- **Every env var is optional** and features degrade rather than fail, so a missing
  `.env.local` does not break the build.
- **The ⌘K menu restores keyboard focus itself.** It has no `Dialog.Trigger` (it opens from
  the deck, the hero CTA and ⌘K), and Radix's modal content _suppresses_ FocusScope's own
  restore in favor of focusing a trigger that is therefore always null — so closing it used
  to strand focus on `<body>`. `command-menu-store.tsx` remembers the opener and
  `command-menu.tsx` restores it in `onCloseAutoFocus`. When testing it: on macOS a click
  does not focus a button, so a mouse-driven test passes against the broken code, and Radix
  restores inside a `setTimeout(0)`, so a single `activeElement` read is too early.
- **Audio assets must be free for commercial use.** Only ship tracks/SFX with an explicit
  commercial-use license (Pixabay, Mixkit, Freesound per-clip) and record the license and
  attribution. Never commercial music.
