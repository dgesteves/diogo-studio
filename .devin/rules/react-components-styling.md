---
trigger: glob
globs: **/*.tsx, **/*.jsx, **/*.css
---

# React 19 components, styling & accessibility

## Components

- One concept per file, **named exports**, explicit `Props` types (extend
  `React.ComponentProps<…>` instead of re-listing DOM props).
- Add `"use client"` only when required, and keep client islands small. Don't
  define components inside other components. Always give list items stable `key`s
  (never the array index when items can reorder).
- Follow the **Rules of Hooks**: call hooks at the top level only, with complete
  dependency arrays and no conditional calls. Reach for `useEffect` last — prefer
  deriving values during render, lifting state, or handling things in events.
- React 19: use `useActionState`, `useOptimistic`, and `<form action={…}>` for
  mutations; use `use()` to unwrap promises/context under Suspense.
- Write **declarative JSX** (map/conditional render over imperative DOM work).
  Minimize client-side state — derive from props/server data first.
- Build composable APIs (slot / `asChild`, `forwardRef` when wrapping a DOM node).
  Prefer accessible primitives (e.g. Radix UI) over hand-rolled interactive widgets.
- Build forms with **`react-hook-form` + a `zod` resolver**; submit via Server
  Actions and surface validation errors accessibly (`aria-invalid`, linked
  message ids).

## Styling (Tailwind)

- Utility-first. Compose conditional classes with a **`cn()`** helper
  (`clsx` + `tailwind-merge`) — never string concatenation. Model variants with
  **class-variance-authority**, and let an incoming `className` override last.
- Use **design tokens / theme values**, not arbitrary hex or magic numbers.
  Support dark mode, and gate every animation on `prefers-reduced-motion`.
- Design **mobile-first** (base styles, then `sm:`/`md:`/`lg:` overrides). Avoid
  inline styles and global CSS for component-level styling.

## Accessibility (hard gate)

- Semantic HTML first (`button`, `a`, `nav`, `main`, ordered headings). Every
  interactive element must be keyboard-operable with a visible `:focus-visible`
  ring — never remove focus outlines without an equivalent replacement.
- Icon-only controls need an `aria-label`; associate inputs with a `<label>`.
  Set `aria-current="page"` on the active nav link. Respect
  `eslint-plugin-jsx-a11y` — fix violations instead of disabling the rule.

## Performance

- Use `next/image` (sized, modern formats), `next/font` (self-hosted, no layout
  shift), and `next/script` (defer/lazy) — never raw `<img>`, font `<link>`s, or
  blocking third-party scripts.
- Lazy-load heavy/below-the-fold client code with `next/dynamic`. Keep animation,
  charting, 3D, and rich editors inside small client boundaries so the server
  shell stays lean.
- **With the React Compiler enabled** (`reactCompiler: true`), automatic
  memoization is in effect — **do not add `useMemo` / `useCallback` /
  `React.memo`**. Reach for manual memoization only to fix a **measured**
  problem or to preserve a referentially-stable value an external API requires,
  and say so in a short comment. Without the compiler, memoize only proven hot
  paths — never speculatively. Protect the LCP element and avoid layout shift
  (reserve space for media/embeds).
