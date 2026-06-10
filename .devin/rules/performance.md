---
trigger: model_decision
description: Apply when working on performance, bundle size, Core Web Vitals (LCP/CLS/INP), images/fonts/scripts, lazy loading, caching strategy, or diagnosing slowness.
---

# Performance

## Measure first, then optimize

- Optimize against **measurements**, not hunches: Lighthouse / Core Web Vitals
  (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms), `@next/bundle-analyzer` for bundle
  composition, and React DevTools Profiler for render hotspots.
- Enforce **bundle budgets** in CI (e.g. `size-limit`) so regressions fail the
  build instead of shipping. Track Web Vitals from real users in production.

## Ship less JavaScript

- Server Components are the primary lever: keep data fetching, markdown/MDX,
  syntax highlighting, date/number formatting, and heavy libraries on the
  server. Add `"use client"` only at the leaves.
- Lazy-load below-the-fold or interaction-gated client code with
  `next/dynamic`; keep 3D, charts, editors, and animation libraries inside
  small client islands.
- Watch import cost: prefer tree-shakeable, modern packages; never import a
  whole library for one helper; avoid duplicate dependencies that do the same
  job.

## Avoid waterfalls, stream the rest

- Fetch in parallel (`Promise.all`) and start requests as high as possible in
  the tree. Preload critical data; don't chain sequential awaits that could
  run concurrently.
- Use **Partial Prerendering + `<Suspense>`** so the static shell renders
  instantly while dynamic subtrees stream in. Suspense fallbacks must match
  final layout dimensions (no CLS).
- Cache deliberately (`use cache` / `fetch` cache options / React `cache()`)
  and revalidate by tag after mutations — caching strategy is part of the
  design, not an afterthought.

## Web Vitals specifics

- **LCP**: the hero image/text must not wait on client JS. Use `next/image`
  with `priority` for the LCP image; preload critical assets; no lazy-loading
  above the fold.
- **CLS**: reserve space for media, embeds, ads, and fonts (`next/font` with
  proper fallbacks); never inject layout-shifting content after load.
- **INP**: keep main-thread tasks short — break up long client work, debounce
  expensive handlers, use `startTransition` for non-urgent updates, and avoid
  re-rendering huge trees on every keystroke.

## Assets

- `next/image` for every image (correct `sizes`, modern formats); `next/font`
  for fonts (self-hosted, subset); `next/script` with `lazyOnload`/`afterInteractive`
  for third parties — audit and drop third-party scripts that don't pay rent.
