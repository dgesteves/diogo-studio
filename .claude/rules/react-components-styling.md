---
paths:
  - "**/*.tsx"
  - "**/*.css"
---

# Components, styling & accessibility

`AGENTS.md` carries the compiler's automatic memoization, the `ref`-prop preference and where
Tailwind tokens live. This rule is what those leave out.

## Components

- One concept per file, named exports, explicit `Props` — extend `React.ComponentProps<…>`
  rather than re-listing DOM props.
- Prefer composition (`asChild`/slot) over wrapper components that forward everything, and
  accessible primitives (Radix, `cmdk`) over hand-rolled interactive widgets.
- Reach for `useEffect` last: derive during render, lift state, or handle it in the event.
- **There is no form library.** One `<form>` exists (the ⌘K ask input). Use a native form with
  Zod validation at the boundary and accessible errors (`aria-invalid`, linked message ids).
  `react-hook-form` would be a dependency decision, not a default.

## Styling

- Compose conditional classes with `cn()` (`clsx` + `tailwind-merge`), never string
  concatenation; model variants with `class-variance-authority` and let an incoming `className`
  win last.
- Use the design tokens rather than arbitrary values, and gate every animation on
  `prefers-reduced-motion` — here that is a real code path, not a preference.

## Accessibility (a gate, WCAG 2.2 AA)

- Semantic HTML first. Every interactive element is keyboard-operable with a visible
  `:focus-visible` ring; never remove an outline without an equivalent.
- Icon-only controls need an accessible name; `aria-current="page"` on the active nav link; no
  focus trap when a panel reveals; and a dialog restores focus to whatever opened it — the ⌘K
  menu does this itself in `onCloseAutoFocus`, because it has no `Dialog.Trigger`.
- Target size ≥ 24×24 CSS px and focus must not be obscured by fixed chrome — the two WCAG 2.2
  criteria this UI can plausibly break.
- **Lint is a floor, not the bar.** The enabled `jsx-a11y` rules catch structural mistakes;
  `@axe-core/playwright` plus keyboard-only testing is the real check, and part of 2.2 AA is
  not automatable at all. Fix an a11y rule rather than disabling it; if one genuinely
  false-positives, disable it in `eslint.config.ts` with a reason, never inline.
