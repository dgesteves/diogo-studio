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
  component that suspends in `<Suspense fallback={…}>`. Manage URL/query state
  with a typed helper (e.g. `nuqs`) rather than ad-hoc `useState` + effects.

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
  Import components, hooks, and logic from outside `app/` (`src/components`,
  `src/lib`, `src/features`); keep `page.tsx`/`layout.tsx` as thin composition
  layers. (See the project-structure rule.)

## Data fetching, caching & rendering

- Fetch data in **Server Components** (async components / `fetch`), close to
  where it is used. **Fetch in parallel** (`Promise.all`) to avoid waterfalls.
- Treat data as **dynamic by default** and opt into caching **explicitly**. With
  Cache Components (`cacheComponents: true`), mark cacheable data or UI with the
  **`use cache`** directive and set lifetimes/tags via `cacheLife` / `cacheTag`.
  Otherwise use `fetch(url, { cache, next: { revalidate, tags } })` + React
  `cache()`. Invalidate with `revalidateTag` / `revalidatePath` after mutations.
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
  rely on middleware/layout/page checks alone.
- Keep data access in a server-only Data Access Layer. After a mutation,
  revalidate affected caches and return typed, `useActionState`-friendly results.

## Metadata & SEO

- Export `metadata` / `generateMetadata` per route. Provide `opengraph-image`,
  `robots.ts`, and `sitemap.ts`. Keep canonical URLs and titles consistent.
