---
paths:
  - "src/app/**"
  - "src/site/**"
  - "next.config.ts"
---

# App Router — rendering, caching & metadata

`AGENTS.md` carries the Cache Components flags, the segment configs that were removed, and the
synchronous-IO build error. This rule is the detail that only matters inside a route.

## Metadata

**Never set `openGraph.title`, `description` or `url` in `rootMetadata`.** Official semantics:
a child that does not define `openGraph` inherits the parent's fields verbatim, so a value at
the root ships the home page's social preview on every route — the defect this rule was written
after. Left absent, Next derives them per page. `og:url` is deliberately emitted by nothing.

Metadata inheritance does not exist until a route renders, so it is asserted in
`tests/e2e/seo.spec.ts`; no unit test can see it. Prefer the static `metadata` object over
`generateMetadata` when it does not depend on the request, and keep `opengraph-image`,
`robots.ts`, `sitemap.ts` and canonical URLs consistent.

## Caching and static rendering

- Put `use cache` as close to the data as possible, with a `cacheLife()` profile chosen
  deliberately; `src/app/sitemap.ts` is the worked example.
- The reads that de-optimize a route are `headers()`, `cookies()` and an env read; wrap the
  dynamic subtree in `<Suspense>` when it must stay dynamic.
- In development, Cache Components reports instant-navigation insights in the overlay and the
  dev-server log. Read them instead of guessing; they name the blocking component.
- **Stream rather than block.** A static shell with dynamic subtrees inside `<Suspense>` is the
  default model; make each fallback match its final layout so nothing shifts. `loading.tsx` is
  the route-level fallback.

## Route boundaries

- Keep `app/` to routing: thin `page.tsx`/`layout.tsx` that resolve, set metadata and compose
  UI from the domains — `site/`, `world/`, `command-menu/`, `telemetry/`, `content/`, `ui/`.
  Import a sibling domain's component at its real path; there are no barrels, and never build
  a new umbrella. Inside `app/`, import relatively — the leaf rule fires on `@/app/…`.
- **URL state here is the pathname.** Each station is its own route, read with `usePathname`
  and written with a typed `router.push`. If a genuine query parameter arrives, `nuqs` is the
  pre-approved typed helper but is not installed, so it needs a `docs/decisions.md` entry.
- Route Handlers serve client callers and webhooks; don't call your own handler from a Server
  Component, import the function. Run post-response work in `after()`.
- Security headers are set in `next.config.ts` and there is no `proxy.ts`; don't add a second
  source of headers.
- There are no Server Actions and no database. If a mutation is introduced, prefer a Server
  Action, schema-validate its input, and authenticate plus authorize inside it — it is a public
  HTTP endpoint. `security-and-env.md` is the authority.
