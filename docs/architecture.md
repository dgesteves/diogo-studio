# Architecture

**This file is normative.** It describes the architecture this codebase holds to, and it is
the authority when the code disagrees — the opposite of the contract this file carried
before 2026-08-11, when it described only what existed. That inversion is deliberate and
recorded in [`decisions.md`](./decisions.md): the design is the source of truth, not
whatever the tree happens to be.

The code has arrived at what is described here, and the plan that moved it — `refactor.md` —
was deleted when it did. So a disagreement between this file and the tree is no longer a
phase waiting to run: it is a defect in one of the two, and which one is settled by §11.
Most of §4 is now held by `eslint.config.ts` and `tests/boundaries.test.ts` rather than by
this document, which is the intended end state — a check outranks a paragraph.

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
                       │ telemetry/ │
                       └────────────┘
```

| Domain          | One-line charter                                              |
| --------------- | ------------------------------------------------------------- |
| `content/`      | The authored record. Every fact the product states.           |
| `site/`         | Renders content to the DOM. Metadata, SEO, page shell.        |
| `world/`        | Renders content as a navigable 3D room.                       |
| `agent/`        | Retrieves over content and generates answers. Server-only.    |
| `command-menu/` | The ⌘K surface: navigate the site, ask the agent.             |
| `telemetry/`    | Web Vitals, and the developer-facing overlay that shows them. |

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
| **Must never import**  | `world/`, `agent/`, `app/`, or any sibling's private file — `command-menu/store` only                   |
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
| **May import**         | `content/`, `ui/`, `reduced-motion`, and two sibling stores: `command-menu/store`, `telemetry/store`                                        |
| **Must never import**  | `site/`, `agent/`, `app/`, or any other file of a sibling                                                                                   |
| **Runtime**            | Client-only. Nothing here renders on the server.                                                                                            |
| **Source of truth**    | Spatial and visual tuning only — where a station sits, how the camera moves, what a material looks like. **Never a fact about the author.** |
| **Talks to others by** | Publishing a perf signal (`world/perf.ts`) that `telemetry/` reads, and reading the ⌘K and overlay stores to open them.                     |

The rule that keeps this domain honest:

> **A canvas draw function decides layout, typography, color, spacing, animation, truncation
> and decoration. It may not contain a company, role, date, technology, or description.**

Enforced by construction rather than by review: every draw function takes its data as a
parameter, so a fact has nowhere to hide.

`world/stations.ts` holds the _spatial_ record for each page — camera position, anchor,
accent, which object represents it — keyed by page slug. It carries no prose. The join
between "what a page says" and "where it lives in the room" is a slug, and nothing more.

### `agent/`

|                        |                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Owns**               | The corpus, retrieval, prompting, streaming, the response envelope, rate limiting, and the generated index. |
| **May import**         | `content/` (including `content/prose/**`), `env`, `chat-contract`                                           |
| **Must never import**  | `site/`, `world/`, `command-menu/`, `telemetry/`, `ui/`, `app/`                                             |
| **Runtime**            | **Server-only**, every module. `import "server-only"` is the first line.                                    |
| **Source of truth**    | The generated index is derived from `content/` and never hand-edited.                                       |
| **Talks to others by** | HTTP, and only HTTP. `app/api/chat/route.ts` is its single entry point.                                     |

No client module may import from `agent/`, including its types. That is what `chat-contract.ts`
is for: the `/api/chat` request and sources schemas are a root leaf both ends read, and the
boundary between them is the wire format rather than a module. Its safety properties are
non-negotiable and break silently, so they are listed in `AGENTS.md`.

### `command-menu/`

|                        |                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Owns**               | The ⌘K dialog, its two modes, and the client-side ask/stream state.                    |
| **May import**         | `content/` (the client-safe page projection), `ui/`, `reduced-motion`, `chat-contract` |
| **Must never import**  | `agent/`, `world/`, `site/`, `telemetry/`, `app/`                                      |
| **Runtime**            | Client.                                                                                |
| **Source of truth**    | None. Its route list derives from `content/pages.ts` — all seventeen of them.          |
| **Talks to others by** | `fetch("/api/chat")`. It never imports the agent.                                      |

### `telemetry/`

|                        |                                                                             |
| ---------------------- | --------------------------------------------------------------------------- |
| **Owns**               | The Web Vitals collector, the overlay that displays it, and its open state. |
| **May import**         | `ui/`, `reduced-motion`, and one sibling store: `world/perf`                |
| **Must never import**  | `content/`, `agent/`, `site/`, `command-menu/`, `app/`                      |
| **Runtime**            | Client.                                                                     |
| **Source of truth**    | Web Vitals. Everything else on the overlay is a signal produced elsewhere.  |
| **Talks to others by** | Subscribing. It reads; it never writes to another domain.                   |

A signal is owned by whoever **produces** it, not whoever displays it. The world produces
frame statistics, so `world/perf.ts` owns them; `telemetry/vitals.ts` starts the `web-vitals`
collector on its first subscriber, so it owns those. The overlay subscribes to both — which is
why adding a second consumer later requires no move.

It has **two** public modules rather than the one a domain usually has: `vitals.ts` for the
metrics and `store.tsx` for whether the overlay is showing. Keeping the open/close signal out
of the component tree it drives is not a style choice — `tests/stores.ts` pulls whatever that
module imports into every spec's module graph, which is how merging the two broke three
unrelated specs in Phase 5.

The name "Inspector" survives in the UI copy and in the identifiers that match it. It is a
brand, not a directory: the `features/inspector` folder that made it ambiguous is gone.

### Supporting modules

| Module               | Owns                                                          | Runtime    |
| -------------------- | ------------------------------------------------------------- | ---------- |
| `ui/`                | Generic primitives with zero domain knowledge, plus `cn`      | Isomorphic |
| `env.ts`             | The **only** reader of `process.env`, Zod-validated           | Isomorphic |
| `store.ts`           | `createStore<T>()` — the one external-store factory           | Isomorphic |
| `chat-contract.ts`   | The `/api/chat` wire format, owned by neither end             | Isomorphic |
| `reduced-motion.tsx` | The motion preference: system, low-power, override, storage   | Client     |
| `use-is-client.ts`   | Whether hydration has happened — read by `world/` and `site/` | Client     |
| `globals.css`        | Design tokens and global CSS                                  | —          |

A root leaf is measured, never assumed: it earns its place when a **second** domain imports
it, and it goes back into a domain when that stops being true. `use-is-client.ts` is the newest
and the whole argument for it is that `world/` and `site/` both read it.

`ui/` is the hardest boundary to keep clean and the easiest to test: **if a primitive needs
to know what a `Page` is, it does not belong in `ui/`.**

---

## 4. Dependency rules

```
app/  →  site/ · world/ · command-menu/ · telemetry/  →  content/ · ui/
app/api/  →  agent/  →  content/
leaves (import nothing above them):
  content/ · ui/ · env · store · reduced-motion · use-is-client · chat-contract
```

Six rules:

1. **Nothing imports from `app/`.** Routing is a leaf.
2. **A domain's store module is its public API; every other file in it is private.** The
   modules a domain _may_ expose are `world/store.ts`, `world/perf.ts`,
   `command-menu/store.tsx`, `telemetry/store.tsx` and `telemetry/vitals.ts`; `site/` exports
   no state, so it is private whole. **Each consumer is then granted a named subset, not the
   whole list** — `telemetry/` reads `world/perf` and is deliberately not granted
   `world/store`, because the overlay has no business in hover, day/night or explore state.
   The grants are the `ACCESS` table in `eslint.config.ts`, and widening one is a one-line
   edit there: the right price for a new cross-domain edge.
3. **`site/` never imports `world/`, and `world/` never imports `site/`** — not even a store.
   This is the edge that makes "the 3D room is an enhancement" structural rather than stated.
4. **`ui/` imports no domain.**
5. **`content/` imports nothing.**
6. **`agent/` is reachable only from `app/api/` and build scripts**, never from a client
   module, not even for a type.

**All six are enforced**, as `no-restricted-imports` errors, since Phase 7. Every scope in
`src/` gets the whole contract at once — the domains it owns, the siblings it reaches, and the
grants that let it — built from `ACCESS` in `eslint.config.ts`. The default is deny, so a new
file at the root of `src/` starts closed rather than in a gap, and the **same-domain rule**
(inside each domain, import relatively, never through its own `@/…` alias) is what stops a
flattened domain growing a barrel back.

**Read `eslint.config.ts` before editing a grant, not this section.** A closed domain is two
entries — an exact `paths` entry for the bare specifier and a `patterns` group for everything
below it — and merging them silently voids every carve-out, because `group` matches with
gitignore semantics and those refuse to re-include a path under an excluded parent. That
mistake was published as the design for three phases before anyone ran it — see the
2026-08-15 entry "A closed domain is two ESLint entries" in [`decisions.md`](./decisions.md).
`tests/boundaries.test.ts` holds both directions of every rule above against the real config,
so a carve-out that is too wide and one that is voided each fail a named test.

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
// `id` is required on every variant, not optional — see below.
export type Block =
  | { kind: "lede"; id: string; text: string }
  | { kind: "prose"; id: string; paragraphs: readonly string[] }
  | { kind: "list"; id: string; title?: string; items: readonly string[] }
  | { kind: "stats"; id: string; items: readonly Stat[] }
  | { kind: "cards"; id: string; items: readonly Card[] }
  | { kind: "timeline"; id: string; items: readonly Role[] }
  | { kind: "links"; id: string; items: readonly BlockLink[] };

export type Page = {
  slug: PageSlug;
  href: PagePath;
  label: string; // short form: nav, HUD, radar, citations
  eyebrow: string;
  title: string;
  summary: string; // the ONE description — page metadata, OG, agent
  blocks: readonly Block[];
};
```

Sector is not on `Page`. The editorial grouping lives in `content/pages.ts` beside the URL
map, because it is a property of the client-safe projection — the ⌘K list and the studio map
both read it, and neither may touch `blocks`.

`id` on a block is the mechanism that makes single-authoring real: it is the DOM anchor, the
`#fragment` in an agent citation, and the chunk boundary in the retrieval index. All three
derive from one declaration — which is why it is **required**. Optional would make an
un-anchorable chunk representable, and the 25-chunk index that preceded this had `anchor`
undefined on every one of them for exactly that reason.

### Derivation

Every representation below is generated from the table above. None of them may restate it.

| Representation       | Derived from                    | Built by                       |
| -------------------- | ------------------------------- | ------------------------------ |
| Page body (DOM)      | `page.blocks`                   | `site/blocks.tsx`              |
| Page metadata / OG   | `page.title`, `page.summary`    | `site/metadata.ts`             |
| `sitemap.xml`        | `content/pages.ts`              | `app/sitemap.ts`               |
| JSON-LD              | `content/profile.ts`            | `site/structured-data.tsx`     |
| Retrieval index      | blocks, with `id` as the anchor | `scripts/build-agent-index.ts` |
| 3D canvas screens    | `content/career.ts` and friends | `world/screens/*`              |
| HUD, radar, deck map | `content/pages.ts`              | `world/hud/*`                  |
| ⌘K route list        | `content/pages.ts`              | `command-menu/navigate.tsx`    |

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
    layout.tsx  providers.tsx  error.tsx  global-error.tsx  not-found.tsx  loading.tsx
    icon.tsx  apple-icon.tsx  robots.ts  sitemap.ts

  content/                    ★ SOURCE OF TRUTH
    schema.ts                 Block · BlockLink · Page
    pages.ts                  client-safe: slug · href · label · sector
                              + the derived URL map, asInternalHref(), the station index
    profile.ts                identity, role, links, availability
    career.ts                 the ONE career record
    principles.ts  stack.ts  playground.ts   records a canvas screen reads
    prose.ts                  server-only: the join — slug → page with blocks
    prose/                    server-only prose, ONE FILE PER SLUG
      home.ts  about.ts  work.ts  projects.ts  case-studies.ts …  (17)

  site/                       THE DOM READING SURFACE
    page-view.tsx  blocks.tsx  metadata.ts  structured-data.tsx
    portrait.tsx  portrait-engine.tsx  home-cta.tsx

  world/                      THE 3D ROOM
    world.tsx                 mount point: fallback · gate · dynamic canvas
    canvas.tsx  camera.tsx  interact.tsx  quality.tsx  postprocessing.tsx  fallback.tsx
    stations.ts               slug → camera · anchor · accent · object (spatial only)
    hotspots.tsx  materials.ts  room.ts  input.ts  explore.tsx  gpu.ts  random.ts
    boot.tsx  store.ts  perf.ts  audio.tsx
    hud/                      deck · radar · map · explore
    scene/                    room · desk · workstation · lounge · shelving
                              books.tsx (one binding, shelved and stacked)
                              lighting · city  + geometry modules
    screens/                  texture.ts (one texture hook) · kit.ts (one CRT kit)
                              wall · monitors · tv — DRAW FROM content

  agent/                      SERVER-ONLY
    corpus.ts  retrieval.ts  prompt.ts  stream.ts  response.ts  rate-limit.ts
    index.generated.json      generated — per-block chunks with anchors

  command-menu/               menu · navigate · ask · answer · store
  telemetry/                  vitals · store · overlay · panels

  ui/                         button · badge · kbd · status-dot · segmented
                              brand-icons · brand.ts · cn.ts
  globals.css
  env.ts                      the only process.env reader
  store.ts                    createStore<T>() — every client signal is built from it
  reduced-motion.tsx          provider + store, one concept
  use-is-client.ts            hydration, read by world/ and site/
  chat-contract.ts            the /api/chat wire format — owned by neither end

scripts/build-agent-index.ts  content → agent/index.generated.json
tests/                        helpers (@tests/*) + e2e/
```

Eight folders and six files at the root of `src/`. Maximum depth four segments. No
`utils/`, `helpers/`, `common/`, `shared/`, `sections/`, `constants/`, `config/`, `hooks/`,
`providers/`, `schemas/`, `seo/`, `styles/`, or `components/` passthrough level anywhere, and
no folder that exists to make the tree look organized. Every one of those existed before
Phase 6; adding one back needs a `decisions.md` entry naming the boundary it marks.

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
codebase's 297-file, 49-line-average shape — see the 2026-08-14 entry in
[`decisions.md`](./decisions.md).)_

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
| A number that tunes rendering       | the module that reads it — never beside content  |
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
