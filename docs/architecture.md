# Architecture

**This file is normative.** It describes the architecture this codebase is being built
toward, and it is the authority when the code disagrees — the opposite of the contract
this file carried before 2026-08-11, when it described only what existed. That inversion
is deliberate and recorded in [`decisions.md`](./decisions.md): the destination is the
source of truth, not the current tree.

[`refactor.md`](./refactor.md) tracks how far the code has moved toward this document and
is deleted when it arrives. Where the code and this file disagree today, the gap is a
phase in that plan — not a licence to write new code against the old shape.

---

## 1. The product

A one-author portfolio. Seventeen pages of authored prose. No database, no users, no auth.
One differentiator: the primary navigation is a 3D room. One dynamic surface: an agent that
answers questions from the same prose.

Two consequences carry the whole architecture:

1. **There is one body of content and several renderers of it.** A DOM reading surface, a
   3D room, an agent, a sitemap, a command menu. Each derives; none authors.
2. **The 3D room is an enhancement, never the only path to content.** A visitor with reduced
   motion, no WebGL, a slow device, assistive tooling, or no JavaScript gets a complete
   portfolio. The room is a domain of the product, not the owner of it.

---

## 2. The six domains

```
                    ┌───────────────────────────────────────┐
                    │            content/                   │
                    │   the authored record — one truth     │
                    └───────────────────────────────────────┘
                        ▲        ▲        ▲        ▲
            ┌───────────┘        │        │        └───────────┐
      ┌─────┴─────┐   ┌──────────┴──┐  ┌──┴──────────┐   ┌─────┴────────┐
      │   site/   │   │   world/    │  │   agent/    │   │ command-menu/│
      │ DOM pages │   │  3D room    │  │ RAG (server)│   │  ⌘K surface  │
      └───────────┘   └──────┬──────┘  └─────────────┘   └──────────────┘
                             │ perf signal
                       ┌─────▼──────┐
                       │ inspector/ │
                       └────────────┘
```

| Domain          | One-line charter                                           |
| --------------- | ---------------------------------------------------------- |
| `content/`      | The authored record. Every fact the product states.        |
| `site/`         | Renders content to the DOM. Metadata, SEO, page shell.     |
| `world/`        | Renders content as a navigable 3D room.                    |
| `agent/`        | Retrieves over content and generates answers. Server-only. |
| `command-menu/` | The ⌘K surface: navigate the site, ask the agent.          |
| `inspector/`    | Developer-facing overlay for performance and Web Vitals.   |

There is no `features/` umbrella. Six domains at the root of `src/` are easier to hold in
your head than six domains inside a folder that says nothing.

---

## 3. Domain contracts

The five questions each domain must answer without reference to project history.

### `content/`

|                        |                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Owns**               | Every authored fact: page prose, the career record, the author's identity and links, the URL map, editorial grouping (sectors). |
| **May import**         | Nothing outside itself. It is the root of the graph; its own modules may compose each other.                                    |
| **Must never import**  | Any other domain. Especially not `world/` — content does not know 3D exists.                                                    |
| **Runtime**            | Split. `content/prose.ts` and `content/prose/**` are `server-only`. Everything else is isomorphic and client-safe.              |
| **Source of truth**    | Itself. This is the only domain that may contain a fact.                                                                        |
| **Talks to others by** | Being imported. It has no behavior, only data and types.                                                                        |

The client/server split inside this domain is load-bearing, not tidiness. `Page` carries
`blocks` — the full prose body — so a client island that imports the page collection to read
a label drags every page's text into the browser bundle, where nothing reads it.
Tree-shaking cannot help: these are property reads on runtime objects. So `content/pages.ts`
is the client-safe projection (slug, path, label, sector) and `content/prose/**` holds the
prose behind `import "server-only"`, which turns the rule into a build error.

That marker also decides how a node process may read the corpus. `server-only` throws
outside a server module graph, so the two that legitimately read it — the index builder and
the crawlability spec — run under `--conditions=react-server`, set on the `agent:index*` and
`e2e*` scripts. It stays off `next build` and `next start`, which must resolve packages the
way production does.

**`content/routes.ts` does not exist**, and adding one would restate every URL a second time.
The route map is derived from the page list in `content/pages.ts` — an `as const` array
through a mapped type, so `typedRoutes` still sees a literal per route.

### `site/`

|                        |                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Owns**               | The DOM reading surface: page shell, the block renderer, page and root metadata, JSON-LD, the portrait. |
| **May import**         | `content/`, `ui/`                                                                                       |
| **Must never import**  | `world/`, `agent/`, `command-menu/`, `inspector/`, `app/`                                               |
| **Runtime**            | Server-first. Client only where interaction demands it.                                                 |
| **Source of truth**    | None — it derives everything from `content/`. It owns presentation, never facts.                        |
| **Talks to others by** | Being composed by `app/`. It is a leaf renderer and calls nothing.                                      |

**`site/` never imports `world/`.** This is what makes "the 3D room is an enhancement"
structurally true rather than a stated intention: the reading surface cannot depend on the
room, so it cannot break when the room is absent. The room is mounted _beside_ page content
by the layout, never around it.

### `world/`

|                        |                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owns**               | The 3D room: scene geometry, materials, camera, input, boot, HUD, audio, canvas screens, and the spatial placement of each page.            |
| **May import**         | `content/`, `ui/`, `reduced-motion`                                                                                                         |
| **Must never import**  | `site/`, `agent/`, `inspector/`, `app/`                                                                                                     |
| **Runtime**            | Client-only. Nothing here renders on the server.                                                                                            |
| **Source of truth**    | Spatial and visual tuning only — where a station sits, how the camera moves, what a material looks like. **Never a fact about the author.** |
| **Talks to others by** | Publishing a perf signal (`world/perf.ts`) that `inspector/` reads; opening the command menu through a callback it is handed.               |

The rule that keeps this domain honest:

> **A canvas draw function decides layout, typography, color, spacing, animation, truncation
> and decoration. It may not contain a company, role, date, technology, or description.**

Enforced by construction rather than by review: every draw function takes its data as a
parameter, so a fact has nowhere to hide.

`world/stations.ts` holds the _spatial_ record for each page — camera position, anchor,
accent, which object represents it — keyed by page slug. It carries no prose. The join
between "what a page says" and "where it lives in the room" is a slug, and nothing more.

### `agent/`

|                        |                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Owns**               | The Zod contract for `/api/chat`, retrieval, prompting, streaming, the response envelope, rate limiting, and the generated index. |
| **May import**         | `content/` (including `content/prose/**`), `env`                                                                                  |
| **Must never import**  | `site/`, `world/`, `command-menu/`, `inspector/`, `ui/`, `app/`                                                                   |
| **Runtime**            | **Server-only**, every module. `import "server-only"` is the first line.                                                          |
| **Source of truth**    | The generated index is derived from `content/` and never hand-edited.                                                             |
| **Talks to others by** | HTTP, and only HTTP. `app/api/chat/route.ts` is its single entry point.                                                           |

No client module may import from `agent/`, including its types — the schema is imported by
the client through its own module, and the boundary is the wire format. Its safety
properties are non-negotiable and break silently, so they are listed in `AGENTS.md`.

### `command-menu/`

|                        |                                                                               |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Owns**               | The ⌘K dialog, its two modes, and the client-side ask/stream state.           |
| **May import**         | `content/` (the client-safe page projection), `ui/`, `reduced-motion`         |
| **Must never import**  | `agent/`, `world/`, `site/`, `inspector/`, `app/`                             |
| **Runtime**            | Client.                                                                       |
| **Source of truth**    | None. Its route list derives from `content/pages.ts` — all seventeen of them. |
| **Talks to others by** | `fetch("/api/chat")`. It never imports the agent.                             |

### `inspector/`

|                        |                                                           |
| ---------------------- | --------------------------------------------------------- |
| **Owns**               | The performance overlay and its open/closed state.        |
| **May import**         | `world/perf`, `telemetry`, `ui/`, `reduced-motion`        |
| **Must never import**  | `content/`, `agent/`, `site/`, `app/`                     |
| **Runtime**            | Client.                                                   |
| **Source of truth**    | None. It is a dashboard over signals produced elsewhere.  |
| **Talks to others by** | Subscribing. It reads; it never writes to another domain. |

A signal is owned by whoever **produces** it, not whoever displays it. The world produces
frame statistics, so `world/perf.ts` owns them. `instrumentation-client.ts` produces Web
Vitals, so `telemetry.ts` owns those. The inspector subscribes to both and owns neither —
which is why adding a second consumer later requires no move.

### Supporting modules

| Module               | Owns                                                        | Runtime    |
| -------------------- | ----------------------------------------------------------- | ---------- |
| `ui/`                | Generic primitives with zero domain knowledge, plus `cn`    | Isomorphic |
| `env.ts`             | The **only** reader of `process.env`, Zod-validated         | Isomorphic |
| `telemetry.ts`       | Sentry sample rate, the Web Vitals store                    | Isomorphic |
| `reduced-motion.tsx` | The motion preference: system, low-power, override, storage | Client     |
| `styles/`            | Design tokens and global CSS                                | —          |

`ui/` is the hardest boundary to keep clean and the easiest to test: **if a primitive needs
to know what a `Page` is, it does not belong in `ui/`.**

---

## 4. Dependency rules

```
app/  →  site/ · world/ · command-menu/ · inspector/  →  content/ · ui/
app/api/  →  agent/  →  content/
leaves (import nothing above them):  content/ · ui/ · env · telemetry · reduced-motion
```

Five rules:

1. **Nothing imports from `app/`.** Routing is a leaf.
2. **No domain imports a sibling domain**, with three named exceptions that are part of the
   design: `inspector/` → `world/perf`, `world/` → `content/`, `site/` → `content/`.
3. **`ui/` imports no domain.**
4. **`content/` imports nothing.**
5. **`agent/` is reachable only from `app/api/` and build scripts.**

**These are not yet enforced as errors.** `no-restricted-imports` ships as `warn` under a
`--max-warnings 11` budget, and eight live imports break rule 2 today — the count is in
[`refactor.md`](./refactor.md) §4.5. **Phase 7 of the refactor** is what makes this section
true: it resolves the eight edges, replaces the three hand-written exceptions with the
store rule in `refactor.md` §4.2, promotes the rule to `error` and drops the warning budget.
Until it lands, read this list as the contract, not as something the build checks.

**There are no barrel files.** Import the module you need at its real path. With shallow
domains there are no internals to protect, so a barrel buys nothing and costs two things:
a client bundle pulling in content-bearing modules it never reads, and an indirection
between a name and its definition. The dependency rules above are enforced directly on
paths, which is what the barrels were standing in for.

---

## 5. The content model

### Types

```ts
// content/schema.ts
export type Block =
  | { kind: "lede"; id?: string; text: string }
  | { kind: "prose"; id?: string; paragraphs: readonly string[] }
  | { kind: "list"; id?: string; title?: string; items: readonly string[] }
  | { kind: "stats"; id?: string; items: readonly Stat[] }
  | { kind: "cards"; id?: string; items: readonly Card[] }
  | { kind: "timeline"; id?: string; items: readonly Role[] }
  | { kind: "links"; id?: string; items: readonly Link[] };

export type Page = {
  slug: PageSlug;
  path: PagePath;
  label: string; // short form: nav, HUD, radar, citations
  sector: SectorId; // editorial grouping
  eyebrow: string;
  title: string;
  summary: string; // the ONE description — page metadata, OG, agent
  blocks: readonly Block[];
};
```

`id` on a block is the mechanism that makes single-authoring real: it is the DOM anchor, the
`#fragment` in an agent citation, and the chunk boundary in the retrieval index. All three
derive from one declaration.

### Derivation

Every representation below is generated from the table above. None of them may restate it.

| Representation       | Derived from                    | Built by                    |
| -------------------- | ------------------------------- | --------------------------- |
| Page body (DOM)      | `page.blocks`                   | `site/blocks.tsx`           |
| Page metadata / OG   | `page.title`, `page.summary`    | `site/metadata.ts`          |
| `sitemap.xml`        | `content/pages.ts`              | `app/sitemap.ts`            |
| JSON-LD              | `content/profile.ts`            | `site/structured-data.tsx`  |
| Retrieval index      | blocks, with `id` as the anchor | `scripts/build-index.ts`    |
| 3D canvas screens    | `content/career.ts` and friends | `world/screens/*`           |
| HUD, radar, deck map | `content/pages.ts`              | `world/hud/*`               |
| ⌘K route list        | `content/pages.ts`              | `command-menu/navigate.tsx` |

If a fact needs changing, exactly one file changes.

---

## 6. The tree

```
src/
  app/                        ROUTING ONLY — resolve, set metadata, compose
    (world)/
      layout.tsx              mounts <World/> BESIDE {children}, never around it
      page.tsx  about/  work/ …            17 explicit folders, ~3 lines each
    api/chat/route.ts  api/health/route.ts
    layout.tsx  error.tsx  global-error.tsx  not-found.tsx  loading.tsx
    icon.tsx  apple-icon.tsx  robots.ts  sitemap.ts

  content/                    ★ SOURCE OF TRUTH
    schema.ts                 Block · Page · Sector · Role
    pages.ts                  client-safe: slug · path · label · sector
                              + the derived URL map and asInternalHref()
    profile.ts                identity, role, links, availability
    career.ts                 the ONE career record
    prose.ts                  server-only: the join — slug → page with blocks
    prose/                    server-only prose, ONE FILE PER SLUG
      home.ts  about.ts  work.ts  projects.ts  case-studies.ts …  (17)

  site/                       THE DOM READING SURFACE
    page-view.tsx  blocks.tsx  metadata.ts  structured-data.tsx
    portrait.tsx  portrait-engine.ts  home-cta.tsx

  world/                      THE 3D ROOM
    world.tsx                 mount point: fallback · gate · dynamic canvas
    canvas.tsx  camera.tsx  interact.tsx  quality.tsx  postprocessing.tsx  fallback.tsx
    stations.ts               slug → camera · anchor · accent · object (spatial only)
    hotspots.tsx  materials.ts  room.ts  palette.ts  tuning.ts  input.ts
    store.ts  perf.ts  audio.ts
    boot/                     gate · overlay · splash · backdrop
    hud/                      deck · radar · map · explore-hud
    scene/                    room · desk · workstation · lounge · shelving
                              lighting · city  + geometry modules
    screens/                  canvas.ts (one texture hook) · kit.ts (one CRT kit)
                              wall-screens · monitors · tv — DRAW FROM content

  agent/                      SERVER-ONLY
    schema.ts  retrieval.ts  prompt.ts  stream.ts  response.ts  rate-limit.ts
    index.json                generated — per-block chunks with anchors

  command-menu/               menu · navigate · ask · answer · store
  inspector/                  overlay · panels

  ui/                         button · badge · kbd · status-dot · brand-icons · cn.ts
  styles/globals.css
  env.ts                      the only process.env reader
  reduced-motion.tsx          provider + store, one concept
  telemetry.ts                sample rate + Web Vitals store

scripts/build-index.ts        content → agent/index.json
tests/                        helpers (@tests/*) + e2e/
```

Eight folders and three files at the root of `src/`. Maximum depth four segments. No
`utils/`, `helpers/`, `common/`, `shared/`, `sections/`, `constants/`, or `components/`
passthrough level anywhere, and no folder that exists to make the tree look organized.

### Path aliases

- `@/*` → `src/*` — always. Never `../../../`.
- `@tests/*` → `tests/*` — test helpers only.

---

## 7. Conventions

**Naming.** `kebab-case` files and folders, `PascalCase` components, `useX` hooks,
`is/has/can` booleans. Exports are named, except where a framework demands a default (pages,
layouts, `route.ts`, metadata images, configs).

**A file exports what its concept needs.** Split when responsibilities differ — different
consumers, different lifecycle, different runtime. Never split to satisfy a number, and never
merge to reduce one. _(This replaces "one primary, named export per file", which is a
fragmentation rule wearing a style rule's clothes: if a file may export one thing, a component
tree with fifteen nodes is fifteen files by arithmetic. It is the measured cause of this
codebase's 297-file, 49-line-average shape — `refactor.md` §2.1.)_

**The folder is the namespace.** Never repeat it in the filename. `world/boot/overlay.tsx`,
not `world/boot/boot-overlay.tsx`. Read an import path aloud; if a word repeats, rename.

**File size is not a design signal.** There is no `max-lines` rule in `eslint.config.ts` — the
250/120 caps were deleted in Phase 0 because they sat below what a cohesive `world/boot.tsx`
or `world/scene/lounge.tsx` needs. Don't reinstate one. `max-lines-per-function` stays at 100
as an error, because function length tracks complexity and file length tracks nothing.

**Cohesion over count.** Five files that are one concept become one file. One file holding
two independent responsibilities becomes two. The question is always "does a reader need
these together?", never "how many files is that?".

**Boundaries.** `"use client"` at interactive leaves only. `import "server-only"` on every
server module. Never both in one file.

**Content is US English (en-US)**, in code, copy, comments and commits.

**Comments earn their place** — a measured decision, a workaround, a non-obvious constraint.
Never a restatement of the code.

**Tests colocate with their subject** at the cluster root — one spec per concept, not per
file, so a folder move carries its tests. `*.dom.test.{ts,tsx}` runs under jsdom; everything
else runs under node, judged by what the test touches rather than what the module is about.
Helpers live in `tests/` and are imported through `@tests/*`.

---

## 8. Where does X go?

| Adding…                             | Location                                         |
| ----------------------------------- | ------------------------------------------------ |
| A page's prose                      | `content/prose/<slug>.ts`                        |
| A fact about the author             | `content/profile.ts` or `content/career.ts`      |
| A URL                               | `content/pages.ts` — the URL map derives from it |
| A route or API handler              | `src/app/…` (thin)                               |
| DOM rendering of content            | `site/`                                          |
| 3D geometry, materials, camera work | `world/scene/`, `world/materials.ts`             |
| A number that tunes rendering       | `world/tuning.ts` — never beside content         |
| A canvas screen                     | `world/screens/` — takes its data as an argument |
| Retrieval, prompting, streaming     | `agent/` + `import "server-only"`                |
| A generic primitive                 | `ui/`                                            |
| An env var                          | `env.ts` — never raw `process.env`               |
| Cross-domain state                  | the **producing** domain; consumers subscribe    |
| A test helper                       | `tests/`                                         |
| A decision with rationale           | `docs/decisions.md`                              |

**Promotion rule.** Code lives with its owner. It moves to a shared module only when two or
more domains import it, and moves back when that stops being true. Counting importers is the
test — it is what exposes a "shared" folder holding single-consumer code.

---

## 9. Stack

| Concern             | Choice                                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Framework / runtime | Next.js 16 (App Router), React 19                                                  |
| Language            | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)                                |
| Styling             | Tailwind v4 (CSS-first, no config file), `cva` + `cn`                              |
| UI primitives       | Radix UI, `cmdk`, `lucide-react`                                                   |
| Content             | Typed static data in `content/`                                                    |
| 3D                  | `three` + React Three Fiber + drei + postprocessing                                |
| Validation          | `zod`                                                                              |
| AI                  | Vercel AI SDK + `@ai-sdk/openai`, RAG over a prebuilt index                        |
| Client state        | URL first; hand-rolled external stores via `useSyncExternalStore` from one factory |
| Env                 | `@t3-oss/env-nextjs` → `src/env.ts`                                                |
| Observability       | Sentry, Vercel Analytics + Speed Insights, `web-vitals`                            |
| Rate limiting       | Upstash Redis with an in-memory fallback                                           |
| Tooling             | pnpm, ESLint, Prettier, Vitest (+ RTTR), Playwright + axe, knip, size-limit        |

`next.config.ts` enables **`reactCompiler`**, **`typedRoutes`** and **`cacheComponents`**.
The last makes rendering dynamic-by-default, so static rendering — this site's main
performance asset — is protected by `pnpm prerender:check`, which fails the build if any of
the 19 must-be-static routes de-optimizes.

**Every env var is optional and features degrade rather than fail**: no `OPENAI_API_KEY`
returns `503` with the top index matches, no embeddings falls back to keyword/BM25, no
`UPSTASH_*` falls back to an in-memory token bucket. Preserve that when adding one.

---

## 10. Quality gates

`pnpm validate` = lint + typecheck + `format:check` + tests with coverage + knip. It runs
neither `build` nor `e2e`, so anything touching routing, metadata, the 3D world, focus or
timing is unverified until `pnpm e2e:ci` is green.

`pnpm build` runs `agent:index:check` before and `prerender:check` after. `pnpm size` is a
review signal, not a gate — its CI step is `continue-on-error`, because a breach would
otherwise also sink the `e2e` job via `needs: build`. Core Web Vitals are the real bar.

Coverage thresholds live in `vitest.config.ts`, set from measured runs. **Never lower one to
make a change pass**: a threshold rises because a test was written, so it falls only when
code is deleted.

This repository is **private on a GitHub Free plan**, which removes capabilities the
workflows would otherwise rely on:

| Capability                   | Status                                                  |
| ---------------------------- | ------------------------------------------------------- |
| Branch protection / rulesets | Unavailable — `main` is unprotected, no required checks |
| Code scanning (CodeQL)       | Unavailable — needs the paid add-on                     |
| PR auto-merge, `CODEOWNERS`  | Unavailable                                             |
| Actions minutes              | 2,000/month · Artifact storage 500 MB                   |

Nothing stops a red push but you. CI uploads artifacts only on failure with short retention;
`pnpm validate` locally is the cheap gate, CI is confirmation.

`pnpm e2e` is **not** what CI runs — locally it uses `next dev`, 2 workers, no retries; CI
sets `CI=1`, switching to `next start` against a production build, 1 worker, `retries: 2`.
`pnpm e2e:ci` closes the flag gap; `pnpm e2e:runner` (Ubuntu container, 2 vCPU / 7 GB)
closes the runner gap. Neither reproduces the CPU architecture: GitHub runs x86-64, a Mac
runs arm64, so SwiftShader timings are indicative, not identical.

---

## 11. Authority

1. Security, accessibility and web standards — OWASP, WCAG 2.2 AA, W3C/WHATWG/RFC/MDN.
2. Official docs for the installed versions — Next 16.3, React 19.2, TS 6, Vitest 4,
   Playwright 1.62.
3. The recorded design target — this file. May override (2), never (1).
4. Automated enforcement — tsconfig, ESLint, Vitest/Playwright, CI. If it contradicts 1–3,
   the config may be the bug: investigate it.
5. Agent instructions — `AGENTS.md`, then `.claude/rules/`.
6. Existing implementation — evidence of what is, **never authority for what should be.**

**[`decisions.md`](./decisions.md) is deliberately not on this ladder.** It records why (3),
(4) and (5) say what they say — dated entries, append-only, true as of the day they were
written. A decision binds through the thing that enforces it: the rule, the config, the test,
or this document. So an entry never outranks the current state of those, and an entry that has
been overtaken is history rather than a contradiction. That is what keeps a growing archive
from becoming a growing set of conflicts.

**"The repository does X" is never by itself a reason to do X.** This codebase contains
temporary 3D work, duplicated content, abandoned experiments and historical structure.
Before copying a pattern, check whether (1)–(3) endorse it. When an instruction here turns
out to be wrong, fix it in the same change — a rule nobody corrects is how wrong claims
ship. If a check can enforce it, prefer the check over the rule.
