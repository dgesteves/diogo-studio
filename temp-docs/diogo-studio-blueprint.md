# diogo-studio — Blueprint

> The portfolio for a Staff/Principal Frontend & Platform Engineer targeting
> Founding / Staff+ / Principal / VP roles at AI-native product companies in the
> OpenAI · Anthropic · Vercel · Linear · Ramp · Stripe class.
>
> This document is the source of truth for vision, architecture, scope, and
> execution. Update it as decisions land. Treat it like an internal RFC.

---

## 0. The mandate (in one sentence)

**Build a portfolio that is itself a working specimen of the systems Diogo
ships — agentic, observable, design-system-driven, streaming-grade — so that
the medium IS the message and any senior hiring manager who lands on it has
to reach out.**

If a visitor cannot tell within 5 seconds that this is _not_ a generic
React+Tailwind portfolio, we have failed.

---

## 1. Why this exists

### 1.1 The problem

The standard senior-engineer portfolio is one of three clichés:

1. **The minimalist Notion-page**: hero, list of jobs, list of projects, contact. Tasteful. Forgettable. Says nothing about engineering taste.
2. **The Awwwards toy**: rotating astronaut, blob shaders, smudgy cursor, locomotive scroll. Pretty for 8 seconds. Says "I can copy a CodePen." Wrong audience for Staff+ roles.
3. **The agency template**: dark mode, big serif, scroll-jacked sections, perfect Lighthouse, zero point of view.

None of these signal _Staff/Principal_ engineering taste. They demonstrate
front-end _output_, not platform _judgment_.

### 1.2 The audience

- Engineering directors, VPs, CTOs, and founders at AI-native product companies (seed → Series B and the OpenAI/Anthropic/Vercel/Linear/Ramp/Stripe class).
- Recruiters at the same orgs filtering for Staff+ / Principal / Founding / VP candidates.
- Peers (other senior engineers) — secondary audience but high amplification value (they share what's good).

### 1.3 What the audience actually wants to see

In rough order of weight:

1. **Judgment under ambiguity**: how Diogo turned messy product/business problems into durable architectures.
2. **Receipts**: real metrics, real scale, real tradeoffs. Not adjectives.
3. **A point of view**: opinionated takes on platform engineering, AI-native UX, design systems, performance.
4. **Operating maturity**: hiring, leveling, RFC culture, on-call, release safety. The non-IC parts of senior work.
5. **Taste**: visual, interaction, code, prose. All four.
6. **Proof of execution**: the site itself ships at the bar he claims.

The site must serve all six in under 90 seconds of scroll.

---

## 2. The unique angle

### 2.1 The signature concept

> **The portfolio as an agentic, digital-twin operations console of Diogo's
> career.**

Concretely, the site borrows visual and interaction grammar from Diogo's
own work — the things competing portfolios _cannot_ credibly steal:

- **Digital twins / RF heatmaps / agentic orchestration panels** (eino.ai)
- **Telemetry, observability, release-safety dashboards** (Peacock / Sky)
- **Multi-framework design-system inspectors** (Diligent)
- **Agentic UX with human-in-the-loop review** (Moment, eino.ai)

Visitors don't browse a portfolio. They open a _console_ that happens to be
about a person. Every surface is justified by something concrete on the
resume — no decorative 3D, no metaphor without referent.

### 2.2 The four signature surfaces

#### S1 — Hero: the Career Graph (3D digital twin)

A real 3D scene (R3F + Three + postprocessing). Nodes are companies and
flagship projects (Peacock, eino.ai, Diligent DS, BMW Innovation, Moment,
Fueled). Edges are _patterns_ connecting them: design systems, AI-native
UX, streaming reliability, enterprise scale, agentic UX.

- Camera dollies on scroll, with a Lenis-driven smooth scrub.
- Hover a node → glassy tooltip with metrics (years, scale, role).
- Click a node → camera flies, deep-link routes to the case study.
- Subtle volumetric/heatmap shader as the ambient field — explicit nod to RF heatmaps.
- `prefers-reduced-motion` and low-power devices fall back to a beautiful static SVG/Canvas version with the same information.

#### S2 — The Inspector (⌘K agent)

A persistent command surface (`cmdk`) with two modes:

- **Navigate**: jump to any case study, post, section, or external profile.
- **Ask**: stream answers grounded on the resume + MDX case studies via
  Vercel AI SDK. Citations link back to the actual source. Example queries
  pre-seeded: _"What's Diogo's design-system thesis?"_, _"Show me agentic
  UX work"_, _"Tell me about Peacock-scale reliability work"_.

Meta-recursive flex: he ships agentic UX _while describing_ his agentic UX work.

#### S3 — Case Studies as Telemetry Dashboards

Each case study renders like an observability dashboard, not a marketing page:

- Header: scale metrics (users, traffic, scope) as actual metric tiles.
- Timeline: phases with annotated decisions and tradeoffs.
- System diagram: interactive (`@xyflow/react`) — hover edges to read why.
- Decisions log: RFC-flavored bullets with _constraint → option → choice → outcome_.
- Code excerpts with `shiki` + `rehype-pretty-code`.
- Outcomes: real numbers, no adjectives.

Reads like a postmortem from a senior engineer, not a brochure.

#### S4 — The Inspector Overlay (perf receipts)

Toggleable dev-mode overlay (keyboard shortcut, off by default) showing:

- Live Web Vitals (LCP, INP, CLS, TTFB) via `web-vitals`.
- Real-time FPS, draw calls, GPU memory for the 3D scene (custom panel built on `three`'s `WebGLRenderer.info` — `r3f-perf` was dropped in Phase 2 for Turbopack incompatibility).
- Bundle size for the current route (built-in via `size-limit` snapshot).
- Reduced-motion / low-power mode indicator.

The CV claims "streaming-grade reliability and performance." This proves it
on the surface itself.

### 2.3 Anti-patterns we will **not** ship

These are the failure modes we explicitly avoid. If a PR drifts toward any of
these, it gets rejected in review.

- Generic floating particles, blobs, or astronauts.
- Locomotive-style scroll-jacking that fights the user.
- Cursor smudges with no informational purpose.
- Content-free hero with a single buzzword.
- "Skills bars" or rated-out-of-5 charts.
- Project tiles with no metrics, decisions, or tradeoffs.
- Awwwards-tier loading screens that delay LCP.
- Generic dark-mode toggle as a feature.
- Stock photos. Ever.
- Lorem ipsum. Ever.
- Anything that doesn't survive `prefers-reduced-motion: reduce`.
- Anything that breaks keyboard-only navigation.

---

## 3. Information architecture

### 3.1 Routes

```
/                       Hero (Career Graph) + intro + selected work strip + writing strip + contact CTA
/work                   All case studies (filterable by pattern: AI-native, design systems, streaming, enterprise)
/work/[slug]            Telemetry-dashboard case study
/writing                Index of essays / RFCs / takes
/writing/[slug]         MDX article
/about                  Long-form bio + leadership philosophy + how I work
/contact                Branded contact form (Resend + react-email)
/uses                   Tools, hardware, editor, dotfiles — small, signals taste
/colophon               How this site is built (meta — links back to S4 receipts)
/api/chat               Streaming chat endpoint for the Inspector agent
/api/og/[...slug]       Per-route dynamic OG via @vercel/og + satori
```

### 3.2 Global surfaces

- **Inspector** (⌘K) — every route.
- **Inspector Overlay** (dev-mode receipts) — every route, off by default.
- **Theme** — system / light / dark (next-themes).
- **Toast bus** — `sonner`.
- **Reduced-motion + low-power awareness** — global context.

### 3.3 Case-study slugs (initial set)

1. `eino-ai-network-planning` — agentic RF planning, digital twin, geospatial.
2. `peacock-streaming` — performance, release safety, scale.
3. `diligent-design-system` — multi-framework DS, contribution model, governance.
4. `moment-ai-platform` — VPE: hiring, operating model, AI-native architecture.
5. `bmw-innovation` — enterprise innovation platform, regulated environment.

Each is a forcing function for one of the four pattern themes used in the
hero graph edges.

### 3.4 Writing seeds (initial 3)

1. _"Design systems that survive multiple product lines"_.
2. _"Agentic UX without the demo-tax"_.
3. _"Streaming-grade frontend: what 'reliability' means at tens of millions of viewers"_.

---

## 4. Visual & interaction language

### 4.1 Aesthetic direction

- **Console / cockpit, not marketing site.** Reference the look-and-feel of Linear's settings, Vercel's dashboard, Datadog's APM, Stripe's dashboard, and an RF planning tool.
- **Data-dense by default.** Whitespace where it serves clarity, density where it serves trust.
- **Mono + display pairing.** Display: _Geist_, _Inter Display_, _PP Neue Montreal_, _Satoshi_, or _Instrument Serif_ (decision in §10.1). Mono: _Geist Mono_ or _JetBrains Mono_.
- **Color**: muted ink-on-paper light mode + deep-space dark mode. One restrained accent (proposal: a single signal-cyan reserved for _active state, edges, telemetry_). No gradients-for-gradient's-sake.
- **Motion**: directional and informational. Things move because the camera moved or data updated. Never decorative bobbing.

### 4.2 Motion system

- All animations honor `prefers-reduced-motion: reduce` and a manual toggle.
- Scroll: Lenis-driven smooth scrub, _not_ scroll-jacking. The page still scrolls 1:1; Lenis only smooths.
- Page transitions: View Transitions API (Next 16 supports it) + a tasteful fade for non-supporting browsers.
- Layout: `motion`'s shared-layout for case-study card → hero transitions.
- Numbers: animated count-up for metric tiles when they enter the viewport.

### 4.3 Accessibility (non-negotiable)

- WCAG 2.2 AA across all surfaces. AAA where cheap.
- All 3D scenes have a documented, equally informational fallback.
- Full keyboard navigation, including the Inspector and case-study graphs.
- Real focus rings — not removed, not faked.
- `axe-core` runs in Playwright on every PR.

---

## 5. Technical architecture

### 5.1 Already in place (do not re-add)

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict.
- Tailwind v4 (`@tailwindcss/postcss`), Prettier, ESLint 9 flat config.
- Vitest + RTL + jsdom, Playwright + axe.
- Sentry (`@sentry/nextjs`), Vercel Analytics, Vercel Speed Insights.
- `@t3-oss/env-nextjs` + Zod for typed envs.
- Husky + commitlint + lint-staged.
- size-limit, knip, bundle-analyzer.
- GitHub Actions CI + CodeQL + Dependabot.

### 5.2 To add — by phase

#### Phase 1 — Foundation & identity

```
shadcn (CLI, not a dep)         pnpm dlx shadcn@latest init
@radix-ui/react-dialog          accessible primitives
@radix-ui/react-tooltip
@radix-ui/react-popover
@radix-ui/react-dropdown-menu
@radix-ui/react-tabs
@radix-ui/react-accordion
class-variance-authority        variant API
clsx tailwind-merge             safe class composition
lucide-react                    icon set
motion                          (formerly framer-motion)
lenis                           inertia smooth scroll
@studio-freight/hamo            raf hooks for Lenis
next-themes                     theming with no FOUC
sonner                          toasts
cmdk                            command palette
vaul                            drawers / sheets
react-wrap-balancer             balanced headlines
```

#### Phase 2 — Signature hero (3D career graph)

```
three                           core 3D engine
@react-three/fiber              R3F renderer
@react-three/drei               R3F helpers (cameras, AdaptiveDpr, <Stats>, Preload)
@react-three/postprocessing     bloom, chromatic aberration, vignette
maath                           math utilities (curves, easing, sampling)
```

Phase 2 deltas from the original plan (decided during build, shipped as-is):

- **`r3f-perf` → drei `<Stats>`.** `r3f-perf` ships its bitmap font as a
  base64 `.mjs` payload that Turbopack (Next 16 default) can't parse as
  UTF-8 source, breaking the dev build outright. The drei `<Stats>` panel
  covers the FPS/ms readout we actually use day-to-day; the richer perf
  surface (draw calls, GPU memory, web-vitals) belongs to the S4 Inspector
  Overlay anyway. Gated by `NEXT_PUBLIC_PERF_HUD=1` and dead-code-eliminated
  in production.
- **No `leva` panel.** Shader/postfx values are hard-coded with tuning
  comments next to each pass. The cost of wiring a live param panel didn't
  pay back once the scene was settled; revisit only if we re-open the look.
- **No `@xyflow/react` / `d3-force` for the reduced-motion fallback.** The
  fallback is a hand-built SVG (`career-graph-svg.tsx`) with a deterministic
  `projectToSvg` projection, not a force-laid-out xyflow diagram. It carries
  the same nodes/edges/metadata, doubles as the LCP frame, and ships zero
  client JS for the layout. `@xyflow/react` is still earmarked for Phase 3
  case-study system diagrams.

#### Phase 3 — Content layer (case studies as dashboards)

```
velite                          type-safe MDX (modern contentlayer alt)
shiki                           VS-Code-grade highlighting (zero client JS)
rehype-pretty-code              shiki integration for MDX
remark-gfm                      tables, task lists, strike
rehype-slug                     auto heading IDs
rehype-autolink-headings        anchor links
reading-time                    article time estimate
@tremor/react                   metric tiles, sparklines, polished charts
```

#### Phase 4 — Agentic ⌘K Inspector

```
ai                              Vercel AI SDK
@ai-sdk/openai                  provider
@upstash/ratelimit              per-IP rate limiting (with in-memory fallback)
@upstash/redis                  backing store for the rate limiter
tsx                             devDep — runs the indexing script in TypeScript
zod                             (already installed) — for tool schemas
```

Plus:

- Embedding pipeline (build-time) over MDX + career-graph + site-config → JSON committed to repo at `src/content/agent-index.json`.
- Rate-limited API route (Upstash when configured, in-memory token bucket otherwise).

Phase 4 deltas from the original plan (decided during build, shipped as-is):

- **Committed index, not deploy-time regen** (closes §7.4). The index lives
  in git as `src/content/agent-index.json` and is regenerated locally via
  `pnpm agent:index` whenever MDX changes. CI runs `pnpm agent:index:check`
  (auto-wired into `prebuild`) to fail any deploy whose index has drifted
  from the source MDX. Rationale: hermetic deploys (no `OPENAI_API_KEY`
  required at build), reproducible artifacts, faster cold deploys, free
  preview branches. Trade: contributors must remember to rebuild the
  index — enforced by the `--check` guard.
- **Matryoshka 512-d embeddings**, not the default 1536. `text-embedding-3-small`
  is requested with `dimensions: 512`, a 3× JSON size win that costs no
  quality at this corpus scale (~40 chunks). Index lands at ~50 KB without
  embeddings, ~150 KB with — comfortably under any Edge bundle cap.
- **Two retrieval tiers in one route.** Cosine over embeddings is primary;
  BM25 keyword scoring over the same chunks is the fallback when either
  the index ships without embeddings (no key at build) or the runtime
  embedding call fails. The route reports which tier it used in the
  `X-Agent-Sources` header so the Inspector UI can label sources accordingly.
- **Sources via response header, not in the stream.** `streamText`'s body
  carries the model text as `text/plain`; the `X-Agent-Sources` header
  ships base64-encoded JSON with the citation chips. The client can render
  the sources panel before the first token arrives, and we keep the
  text stream parser-free (no SSE framing, no JSON-in-stream gymnastics).
- **No `@ai-sdk/react` `useChat`.** A 60-line custom client (in
  `command-menu-ask.tsx`) handles fetch + ReadableStream + abort. Avoiding
  the hook keeps the cmdk dialog out of React-context coupling with the
  AI SDK and trims a few KB of client JS.
- **Hard refusal floor** (closes the §6 Phase 4 "grounding guardrails"
  exit criterion). If the top retrieved chunk fails the relevance floor
  (`MIN_COSINE_SCORE=0.25` / `MIN_KEYWORD_SCORE=1.5`), the route refuses
  before calling the model and routes the user to `/contact`. No LLM call,
  no chance of hallucination — and zero tokens billed for off-topic queries.

#### Phase 5 — Polish, receipts, contact

```
react-hook-form                 form state
@hookform/resolvers             zod resolver
resend                          transactional email
react-email                     branded email components
@upstash/ratelimit              rate-limiting
@upstash/redis                  storage for rate limit + (optional) vector
schema-dts                      typed JSON-LD for Person/Article/Breadcrumb
web-vitals                      client-side CWV reporting for the overlay
```

Phase 5 deltas from the original plan (decided during build, shipped as-is):

- **Per-route OG via the Next file convention, not `/api/og/[...slug]`.**
  Shipped `opengraph-image.tsx` at the root and under `work/[slug]` +
  `writing/[slug]`, all driven by one shared `renderOgImage()` template
  (`src/components/og/og-template.tsx`). Next statically generates one card per
  published slug at build and wires the `<meta>` tags automatically — the
  catch-all `/api/og` route in §3.1 / §5.3 is superseded. The card uses a
  system font stack (Satori would otherwise need the raw Geist binary fetched
  per request — not worth the cold-start cost for a near-static card); colors
  are the real signal-cyan + deep-space tokens.
- **Inspector Overlay samples `WebGLRenderer.info`, not `r3f-perf`** (already
  dropped in Phase 2). The hero canvas pushes FPS / frame-time / draw-calls /
  triangles / GPU objects into a tiny `useSyncExternalStore` perf store; the
  overlay reads that plus `web-vitals` (dynamically imported on first open, so
  it stays off the initial bundle) and a Resource-Timing route-JS readout.
  Toggle is `Ctrl` + backtick; non-modal; off by default; also launchable from
  `/colophon`.
- **Easter egg: type `diogo` anywhere, not `:diogo` in the Inspector.** A
  global key-buffer fires a one-shot signal-cyan sweep (a static greeting pill
  under reduced-motion). Decoupled from the agent input → more discoverable and
  with zero risk of colliding with a real query.
- **Contact graceful degradation.** `/api/contact` validates + rate-limits
  (Upstash when configured, in-memory token bucket otherwise) and returns a
  structured 503 when `RESEND_API_KEY` is absent; the form then shows an
  "email me directly" fallback, so the route is never broken.

### 5.3 Rendering strategy

- `/` and `/work/*`, `/writing/*` — **statically rendered** at build time. Pure Server Components for shell; Client Components only inside `Canvas`, `cmdk`, and interactive widgets.
- Case-study and writing content sourced from `velite` collections at build time.
- `/api/chat` — Edge runtime, streaming response, rate-limited.
- `/api/og/*` — Edge runtime via `@vercel/og`.
- 3D scenes lazy-loaded with `next/dynamic` and `Suspense`. Hero scene has a static SVG fallback for the LCP frame.

### 5.4 Performance budgets (CI-enforced)

- **LCP** ≤ 1.5s on 4G mid-tier device (median).
- **INP** ≤ 150ms.
- **CLS** ≤ 0.02.
- **First-route JS** ≤ 110 KB gzipped (excluding 3D bundle, which is lazy-chunked).
- **3D bundle (lazy chunk)** ≤ 220 KB gzipped.
- **Lighthouse**: 100 / 100 / 100 / 100 on `/` and `/work/[slug]` in CI.
- **Hero scene**: ≥ 60 fps on M1, ≥ 30 fps on a 2019 mid-tier laptop, falls back below that.

These are wired into `size-limit` and a Lighthouse-CI step.

### 5.5 Quality gates

- `pnpm validate` (lint + typecheck + format check + test + knip) — already exists.
- Playwright e2e on every PR, including axe a11y assertions.
- Lighthouse-CI on PR previews.
- size-limit fails the build on regression.
- A "no-clichés" review checklist on PRs that touch visual surfaces (see §2.3).

---

## 6. Phased roadmap

Each phase ships independently. The site is deployable and impressive at the
end of every phase — we do not accumulate big-bang risk.

### Phase 1 — Foundation & identity (the bones)

**Goal**: a shippable shell that already feels premium without a single 3D pixel.

**Deliverables**:

- shadcn initialized with custom theme tokens.
- `cn` util, theme provider, motion provider, Lenis provider.
- App shell: nav, footer, mobile menu, command palette skeleton.
- Type system: heading scale, text scale, mono integration.
- Light/dark/system theming, no FOUC.
- Reduced-motion + low-power context.
- Toast bus (`sonner`).
- A finalized hero placeholder (typography only) that already reads as senior.
- Updated README and a `docs/design-system.md` documenting tokens and primitives.

**Exit criteria**:

- Lighthouse 100/100/100/100 on `/`.
- All a11y checks green.
- `pnpm validate` green.

### Phase 2 — Signature hero (the wow)

**Goal**: ship the 3D Career Graph with full reduced-motion fallback.

**Deliverables**:

- `<CareerGraph />` Client Component using R3F.
- Data file `src/content/career-graph.ts` (typed) describing nodes and edges with metadata.
- Hover tooltips, click-to-route deep links.
- Heatmap-flavored ambient shader (custom GLSL, kept small).
- Postprocessing pass (bloom + vignette, restrained).
- Reduced-motion fallback: hand-built SVG with the same data, doubling as the LCP frame.
- Dev-only FPS/ms HUD via drei `<Stats>`, gated by `NEXT_PUBLIC_PERF_HUD=1` (see Phase 2 deltas in §5.2 for why we dropped `r3f-perf` and `leva`).

**Exit criteria**:

- Hero hits the perf budget (§5.4) on M1 and a 2019 mid-tier laptop.
- Reduced-motion fallback is informationally equivalent.
- Hero LCP frame is the static SVG, not the canvas — guaranteed sub-1.5s LCP.

### Phase 3 — Content layer (the substance)

**Goal**: 3 case studies + 2 essays at Staff-engineer prose quality.

**Deliverables**:

- `velite` configured with `caseStudies` and `essays` collections.
- MDX components: `<MetricTile/>`, `<SystemDiagram/>` (xyflow), `<DecisionsLog/>`, `<Timeline/>`, `<Tradeoff/>`, `<Outcome/>`, custom `<Code/>` via shiki.
- 3 case studies authored: `eino-ai-network-planning`, `peacock-streaming`, `diligent-design-system`.
- 2 essays authored: design-systems thesis + agentic UX thesis.
- `/work` index with pattern filters.
- `/writing` index with reading-time.

**Exit criteria**:

- Each case study reads like a postmortem, not a brochure.
- All headings are anchored; TOC works on every long-form page.
- Lighthouse 100/100/100/100 on `/work/eino-ai-network-planning`.

### Phase 4 — Agentic ⌘K Inspector (the meta-flex)

**Goal**: a streaming, cited, grounded agent that works.

**Deliverables**:

- Build-time pipeline: chunk MDX + resume, embed, store as JSON or Upstash Vector.
- `/api/chat` Edge route with rate limiting (Upstash) and streaming response.
- Inspector UI in `cmdk`: Navigate mode + Ask mode, with citation badges that deep-link.
- Pre-seeded suggested queries on first open.
- Refusal/grounding guardrails: the agent only answers from indexed content; otherwise says so and offers to route to contact.

**Exit criteria**:

- Cold p95 response time ≤ 2.5s; streaming starts ≤ 800ms.
- Rate limit triggers cleanly (tested).
- Citations always link to a real, existing source.
- Reduced-motion + screen-reader friendly.

### Phase 5 — Polish, receipts, and conversion

**Goal**: the details that close the deal.

**Deliverables**:

- Inspector Overlay (S4): web-vitals + r3f-perf + bundle-size readout, keyboard-toggled.
- `/contact` form: react-hook-form + zod + Resend + react-email branded template.
- Per-route OG images via `@vercel/og` + Satori using the site's actual type and tokens.
- JSON-LD: `Person`, `Article`, `BreadcrumbList`, `WebSite` via `schema-dts`.
- `/uses` and `/colophon` pages.
- A subtle but real Easter egg (proposal: typing `:diogo` in the Inspector triggers a small animation; nothing tacky).
- Final SEO pass, sitemap, robots, canonical URLs.

**Exit criteria**:

- All Lighthouse scores 100 across all main routes.
- All Core Web Vitals "good" in the field after a week of CrUX data.
- Contact form ships email, rate-limits, and is observed in Sentry.

---

## 7. Open decisions

These are explicitly _not yet decided_. Each gets resolved before the phase
that depends on it.

### 7.1 Display typeface (decide before Phase 1 ships)

Candidates: Geist, Inter Display, PP Neue Montreal, Satoshi, Instrument Serif.
Default proposal: **Geist + Geist Mono** (Vercel-native, free, signals taste,
keeps the audience in mind). Override only with a strong reason.

### 7.2 Accent color (decide before Phase 2)

Candidates: signal-cyan (`#22d3ee`-ish), electric-violet, warm-amber.
Default proposal: **signal-cyan** — reads as telemetry, complements both
ink-on-paper light and deep-space dark, and ties to the heatmap shader.

### 7.3 LLM provider for the Inspector — **DECIDED 2026-05-23**

Candidates: OpenAI (`gpt-4.1-mini` or `gpt-5`-class small), Anthropic
(Haiku-class). **Locked: OpenAI via `@ai-sdk/openai` with `gpt-4o-mini`
for chat and `text-embedding-3-small` for the index.** One provider, one
bill, frontier-model-irrelevant since the agent only answers grounded
questions over ~40 chunks. Overridable via `OPENAI_CHAT_MODEL` /
`OPENAI_EMBED_MODEL` env vars without code changes — if a cheaper model
ships, we swap names, not imports.

### 7.4 Vector store — **DECIDED 2026-05-23**

Candidates: in-repo JSON (cheapest, fine at this scale), Upstash Vector,
pgvector on Vercel Postgres. **Locked: in-repo JSON at
`src/content/agent-index.json`, _committed to git_.** A small `--check`
mode in the indexing script runs in `prebuild` and fails the build if the
committed index has drifted from the source MDX, so deploys are hermetic
(no `OPENAI_API_KEY` required at build, no external dep on the OpenAI
API at deploy time). Revisit if the corpus grows past ~200 chunks or the
JSON crosses ~500 KB — at that point Upstash Vector becomes the cheaper
runtime story.

### 7.5 Hero data: companies vs patterns as primary nodes

Default proposal: **companies as primary nodes, patterns as edge labels**.
Reads more honestly to a hiring manager than a more abstract "graph of
ideas."

---

## 8. Risks and mitigations

| Risk                                          | Mitigation                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3D bundle bloats LCP                          | Lazy-load Canvas; ship static SVG hero frame; enforce `size-limit` budgets on the hero chunk.                            |
| The site looks "designy" but says nothing     | Phase 3 is a hard gate — no shipping the public URL until 3 case studies exist with real metrics and decisions.          |
| Agent hallucinates about Diogo's career       | Strict grounding: agent refuses anything not retrievable from the index; cited sources required.                         |
| Motion fatigue / accessibility regressions    | Global reduced-motion context + axe in CI + a manual toggle + design review checklist.                                   |
| Drift back to clichés under deadline pressure | The anti-pattern list (§2.3) is part of the PR template.                                                                 |
| Costs (LLM, Resend) spiral                    | Rate-limiting (Upstash) + small model + monthly budget alarm.                                                            |
| Maintenance burden                            | Everything statically rendered where possible; content authoring via MDX, not a CMS; one provider for AI, one for email. |

---

## 9. Definition of "jaw-dropping" — measurable

We will know we hit the bar when:

- Within 5 seconds of landing, the visitor sees something they have never seen on another portfolio.
- Within 30 seconds, they have understood the unique angle (digital-twin career console + agent).
- Within 90 seconds, they have read at least one real metric and one real tradeoff from a case study.
- They reach for ⌘K within the first minute (we instrument this).
- Lighthouse: 100 / 100 / 100 / 100 on `/`, `/work/*`, `/writing/*`.
- Field CWV after a week: all "good".
- At least one inbound message references a _specific_ case-study decision, not just "loved your portfolio."

The last bullet is the real success metric. The whole point is to make
hiring managers reach out about _the work_, not the visuals.

---

## 10. Working agreements (for this build)

- We work in phases. No phase starts until the previous one passes its exit criteria.
- The blueprint is updated whenever a decision is made. Open decisions in §7 get closed inline with rationale.
- Every PR runs `pnpm validate` + Playwright + Lighthouse-CI.
- Every visual PR includes a screenshot in the description.
- The anti-pattern list (§2.3) is a hard reject criterion in code review.
- No feature ships without a `prefers-reduced-motion` story.
- No copy ships with "passionate," "innovative," "synergy," or any other adjective a recruiter has read 10,000 times. Show, don't claim.

---

## 11. Status log

| Date       | Phase                | Status | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-22 | Phase 0 (planning)   | Done   | Blueprint authored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-05-22 | Phase 1 (foundation) | Done   | Tokens (OKLCH, light + deep-space dark, signal-cyan accent, all WCAG 2.2 AA contrast-verified). Providers: theme, motion-preference (system pref ∪ low-power signals ∪ user override via `useSyncExternalStore`), motion, lenis, ⌘K. Site shell: nav, mobile drawer (vaul), footer, command menu (cmdk + Radix Dialog, Navigate mode), theme toggle. UI primitives: Button (cva), Badge, Kbd, StatusDot, brand icons, ComingSoon. Typography hero + operating altitudes + trust strip. All nav routes have working placeholder pages. `pnpm validate` green. E2E: 10/10 (home, ⌘K, mobile nav, axe a11y on light + dark + command-menu-open). **Lighthouse: desktop 100/100/100/100 ✓ ; mobile 90/100/100/100** (10-pt perf gap is Sentry SDK + Replay-on-error + cmdk + Lenis in initial bundle — Phase 5 will lazy-load these alongside the inspector overlay). Build 350/400 KB. Docs: `docs/design-system.md`, rewritten `README.md`. Locked: typeface = Geist, accent = signal-cyan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-22 | Phase 2 (hero)       | Done   | 3D Career Graph shipped: R3F canvas (`career-graph-canvas.tsx`) with volumetric heatmap (raymarched 3D FBM), radar sweep, perspective grid floor, drifting particles, scroll+mouse camera dolly, postprocessing (bloom + chromatic aberration + vignette). AdaptiveDpr + AdaptiveEvents + IntersectionObserver pause; canvas is `next/dynamic({ ssr:false })` and only mounts when motion is allowed and in-view. Hand-built SVG (`career-graph-svg.tsx`) carries data, hover `<title>` tooltips, `Link`-wrapped click-to-route, full screen-reader description — doubles as the LCP frame. Data lives in typed `src/content/career-graph.ts` (with unit tests). Dev FPS HUD via drei `<Stats>` (`NEXT_PUBLIC_PERF_HUD=1`). **Deltas from plan (see §5.2):** dropped `r3f-perf` (Turbopack incompatibility), dropped `leva` (no live param panel), dropped `@xyflow/react`/`d3-force` for the fallback in favor of deterministic SVG projection. Perf-budget validation against §5.4 still owed before declaring exit criteria fully met.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-05-23 | Phase 4 (Inspector)  | Done   | Agentic ⌘K Inspector shipped: build-time indexer (`scripts/build-agent-index.ts`) chunks case-studies + essays MDX + career-graph + site-config into 38 retrievable passages; content-hashed deltas, Matryoshka 512-d embeddings via `text-embedding-3-small`, committed to git at `src/content/agent-index.json`. `pnpm agent:index:check` guards `prebuild` against drift. Edge `/api/chat` route streams `gpt-4o-mini` answers grounded in cosine-retrieved top-K=6 chunks; BM25 keyword tier as fallback; refusal floor (`MIN_COSINE_SCORE=0.25` / `MIN_KEYWORD_SCORE=1.5`) short-circuits off-topic questions to `/contact` before any LLM call. Rate limiting via `@upstash/ratelimit` (10 rpm/IP) with in-memory token-bucket fallback. cmdk dialog refactored: Navigate / Ask tabs (⌘1 / ⌘2), pre-seeded suggested queries, streamed answer with inline `[N]` citation chips that deep-link to `/work/[slug]#anchor`, sources panel with retrieval-tier label ("Embedded" vs "Keyword"). Reduced-motion-aware (no pulse cursor, no spinner). E2E: Phase 4 Ask-mode smoke test (`⌘2` switches tabs, suggestions render, input focused). Tests: 35/35 (17 new `retrieve.test.ts`). **Deltas (see §5.2):** committed-index over deploy-time regen (closes §7.4); Matryoshka 512-d over default 1536; sources via `X-Agent-Sources` header instead of in-stream framing; custom fetch+ReadableStream client over `@ai-sdk/react` `useChat`. **Decisions closed:** §7.3 (OpenAI/gpt-4o-mini + text-embedding-3-small), §7.4 (in-repo JSON, committed). **Owed before Phase 4 truly closes:** the `agent-index.json` currently ships _without_ embeddings (keyword tier only) — run `pnpm agent:index` with `OPENAI_API_KEY` set and commit the result to switch the live agent to the cosine tier. **Drive-by cleanup:** Phase-2 knip leftovers swept (`maath` removed; legacy `<CareerGraph>` combined component dropped; default re-exports on `career-graph-canvas` and `studio-canvas` retired; `@commitlint/types` added to knip ignore). **Hero CTA polish:** "Press ⌘ K to ask" now opens the menu directly in Ask mode via `openWithMode("ask")` lifted onto the context; plain ⌘K still lands on Navigate. **Console hygiene:** `willReadFrequently:true` on the OKLCH probe canvas (silences Canvas2D perf warning); shared `<WebGLContextGuard />` in both R3F canvases calls `preventDefault()` on `webglcontextlost` so the GPU recovers cleanly; `three` pinned to `0.182.0` to silence the `THREE.Clock` deprecation that R3F 9.6.1 still triggers on r183+ (unpin once R3F adopts `THREE.Timer`). `pnpm validate` green for the first time since Phase 2. |
| 2026-06-03 | Phase 5 (polish)     | Done   | Inspector Overlay (S4) shipped: web-vitals (LCP/INP/CLS/TTFB/FCP, dynamically imported on open), 3D telemetry from `WebGLRenderer.info` via a `useSyncExternalStore` perf store the hero canvas feeds, Resource-Timing route-JS readout, and a live reduced-motion override; toggle `Ctrl`+backtick, non-modal, off by default, launchable from `/colophon`. `/contact`: react-hook-form + zod (one schema shared client+server) + Resend + branded react-email template + Upstash rate-limit (in-memory fallback); structured 503 + "email directly" fallback when unconfigured. Per-route dynamic OG via Next `opengraph-image.tsx` file convention + one shared `renderOgImage()` template (home + every published case-study/essay). JSON-LD (`Person` + `WebSite` in layout, `Article` + `BreadcrumbList` per case-study/essay) via `schema-dts`, cross-linked by stable `@id`. Long-form `/about` (sourced from the same career-graph dataset as the hero), `/colophon` (real stack + live Inspector launch), `/uses` (repo-verified items + amber-flagged pending hardware). Easter egg: type `diogo` → reduced-motion-aware sweep. SEO: `alternates.canonical` on every route; sitemap + robots verified. `ComingSoon` retired (all routes now real). `pnpm validate` green. Tests: 44/44 unit (9 new `structured-data.test.ts`); E2E 26/26 (14 new: content-page smoke+axe ×4, Inspector toggle/close/motion, easter-egg trigger + input guard). Production build clean. **Deltas (see §5.2):** file-convention OG over `/api/og/[...slug]`; system font in OG card; `WebGLRenderer.info` over r3f-perf; global `diogo` egg over `:diogo`-in-Inspector.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

> Append entries as work progresses. Keep it terse — one row per real change.
