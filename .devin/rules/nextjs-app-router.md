---
trigger: glob
globs: app/**, src/app/**, **/app/**
---

# App Router — architecture, data & rendering

## Server vs Client Components

- Default to **Server Components**. A file becomes client-side only with a
  top-level `"use client"`. Keep client boundaries small and at the leaves;
  pass Server Components into client ones via `children`/props rather than
  importing client components upward.
- Never place secrets, data-access code, or large dependencies in client
  components.
- `cookies()`, `headers()`, and `searchParams` opt a route into **dynamic
  rendering** — use them intentionally and wrap dynamic subtrees in `<Suspense>`
  so the rest of the route can stay static.
- Minimize `useEffect`/`useState` in favor of RSC + server data. Wrap any client
  component that suspends in `<Suspense fallback={…}>`.
- **URL state here is the pathname, not the query string.** The route-driven spine
  means each station is its own route, read with `usePathname` and written with a
  typed `router.push`; there is currently **no `useSearchParams`, no `searchParams`
  prop, and no query parameter anywhere in `src/`**. Don't introduce ad-hoc
  `useState` + effects to mirror the URL. If a genuine query parameter arrives
  (a filter, a paginated list), `nuqs` is the pre-approved typed helper — but it is
  **not installed**, so adding it is a dependency decision that needs an entry in
  [`docs/decisions.md`](../../docs/decisions.md), not a default.

## Routing & file conventions

- Use nested **layouts** for shared UI + partial rendering. Use `<Link>` for
  internal navigation/prefetch — never a raw `<a>` for internal routes.
- Co-locate route states: `loading.tsx` (Suspense fallback), `error.tsx`
  (client component, exposes `reset`), `not-found.tsx`. Add a top-level
  `global-error.tsx` for uncaught errors.
- Use route groups `(group)`, dynamic segments `[param]`, and
  `generateStaticParams` to statically generate known paths. Filter
  unpublished/draft content out of production.
- **Keep `app/` to routing only** — route segments + Next.js special files.
  Import UI/logic/data from outside `app/` (`src/features`, `src/components`,
  `src/config`, `src/utils`); keep `page.tsx`/`layout.tsx` as thin composition
  layers. Nothing may import **from** `app/` — it is a leaf, and that is
  lint-enforced. There is no `src/server/` and no `src/lib/` in this repo:
  server-only modules live in named top-level folders (`src/ai/`,
  `src/rate-limit.ts`) marked `import "server-only"`. The project-structure rule is
  the authority on placement.
- **It is `proxy.ts` now, not `middleware.ts`.** Next.js 16 renamed the convention:
  the file is `proxy.ts` (root or `src/`), the default export is `proxy`, and it runs
  on the **Node.js runtime only** — the runtime is not configurable. `middleware.ts`
  still works but is deprecated and slated for removal, and `skipMiddlewareUrlNormalize`
  is deprecated in favor of `skipProxyUrlNormalize`. It is a rename, not a new API:
  the request/response types are still `NextRequest` / `NextResponse` from
  `next/server`, and there is no `next/proxy` module — several migration blog posts
  claim otherwise and are wrong.
- Keep the **proxy** lean and fast: optimistic checks (session cookie presence,
  redirects, headers) only — no data fetching or heavy work. It sits at the network
  boundary and is **not an authorization boundary**; real authorization happens in the
  data layer and inside each handler.
- **This repo has neither file**, and security headers are set in `next.config.ts` —
  treat the two bullets above as guidance for if one is ever added, and don't add a
  `proxy.ts` to do something the config already does.

## Data fetching, caching & rendering

- Fetch data in **Server Components** (async components / `fetch`), close to
  where it is used. **Fetch in parallel** (`Promise.all`) to avoid waterfalls.
- **`cacheComponents` is enabled**, so data is **dynamic by default** and you opt into
  caching **explicitly**: mark cacheable data or UI with **`use cache`** and set
  lifetimes/tags via `cacheLife` / `cacheTag`. Invalidate with `revalidateTag` /
  `revalidatePath` after mutations.
- **Route segment configs `runtime`, `revalidate` and `dynamic` are incompatible with
  `cacheComponents`** and will fail the build. Don't reach for them; express intent
  with `use cache` instead.
- **Any uncached dynamic API silently de-optimizes a route** — `new Date()`,
  `headers()`, `cookies()`, an env read. `pnpm prerender:check` (`postbuild`) is what
  catches it; see `src/app/sitemap.ts` for the pattern.
- **Stream, don't block.** Lean on **Partial Prerendering**: serve a static shell
  instantly and wrap dynamic/async subtrees in `<Suspense>` with a fallback that
  matches the final layout (no CLS). `loading.tsx` is the route-level fallback.
- **Route Handlers** (`route.ts`, named `GET`/`POST`…) are for client callers
  and webhooks — don't call your own Route Handlers from Server Components
  (import the function directly instead).
- Run non-critical post-response work (logging, analytics) in **`after()`** so it
  never blocks the response.

## Mutations (Server Actions)

- Prefer **Server Actions** for mutations and forms. Validate input with a schema
  inside the action, and **authenticate + authorize inside every action** — never
  rely on `proxy.ts`/layout/page checks alone.
- Keep server-only modules marked with `import "server-only"`. After a mutation,
  revalidate affected caches and return typed, `useActionState`-friendly results.
- **Reality check for this repo:** there are currently **no Server Actions and no
  database**. The only server surface is the `/api/chat` and `/api/health` Route
  Handlers plus the retrieval/embedding modules. Treat this section as guidance
  for when a mutation is first introduced, not as a description of existing code.

## Metadata & SEO

- Export `metadata` / `generateMetadata` per route. Provide `opengraph-image`,
  `robots.ts`, and `sitemap.ts`. Keep canonical URLs and titles consistent.
