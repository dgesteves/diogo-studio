# Design system — Phase 1

> Source of truth for tokens, primitives, providers, and the visual language
> shipped in Phase 1. Update as the system evolves. The blueprint at
> `temp-docs/diogo-studio-blueprint.md` owns the _why_; this doc owns the _what_.

---

## 1. Visual language

**Console / cockpit, not marketing site.** References: Linear settings,
Vercel dashboard, Stripe dashboard, Datadog APM, an RF planning tool.

- **Light mode** reads as ink-on-paper. **Dark mode** reads as deep-space
  telemetry. The two modes are _equally first-class_ — neither is the
  "fallback."
- **One restrained accent** (signal-cyan) reserved for _active state, edges,
  and live telemetry_. Never decorative.
- **Mono is structural**, not just for code: small caps labels, eyebrows,
  metric values, keyboard hints all use Geist Mono.
- **Data-dense by default.** Whitespace where it earns clarity, density
  where it earns trust.

---

## 2. Tokens

All color tokens are OKLCH so perceived brightness and contrast stay
predictable across themes. They live in `src/app/globals.css` and are
re-exposed to Tailwind via `@theme inline`, which means utilities like
`bg-surface`, `text-muted-foreground`, `border-border-strong`, and
`text-signal-edge` all work out of the box.

### 2.1 Surface stack (lowest → highest elevation)

| Token           | Light           | Dark            | Usage                          |
| --------------- | --------------- | --------------- | ------------------------------ |
| `background`    | `oklch(0.985…)` | `oklch(0.135…)` | Page background                |
| `surface-inset` | slightly darker | slightly darker | Sunken/recessed areas (inputs) |
| `surface-muted` | hover surfaces  | hover surfaces  | Hover backgrounds, list rows   |
| `surface`       | pure white      | elevated panel  | Cards, dialogs, sticky nav     |

### 2.2 Text tiers

| Token               | Usage                                |
| ------------------- | ------------------------------------ |
| `foreground`        | Primary text, headlines              |
| `muted-foreground`  | Secondary text, descriptions         |
| `subtle-foreground` | Eyebrows, hints, low-weight metadata |

### 2.3 Borders

| Token           | Usage                                   |
| --------------- | --------------------------------------- |
| `border`        | Hairline dividers, default card borders |
| `border-strong` | Active/hover, dropdown/menu containers  |

### 2.4 Accent + signal scales

`accent` is the single brand expression. `signal-*` are reserved for
telemetry semantics — never decorative.

| Token           | Semantic         | Example                            |
| --------------- | ---------------- | ---------------------------------- |
| `accent`        | Brand / primary  | Primary buttons, focus ring, edges |
| `accent-soft`   | Brand background | Tagged badges, hover backgrounds   |
| `signal-edge`   | Telemetry        | Active edges in the career graph   |
| `signal-active` | Live indicator   | Currently selected, active session |
| `signal-good`   | Success / online | "Available" status dot, OK metrics |
| `signal-warn`   | Warning          | Degraded perf, soft warnings       |
| `signal-hot`    | Critical         | Errors, regressions, danger        |

### 2.5 Radii

`--radius` is 0.75rem. Derived: `radius-xs/sm/md/lg/xl` via `calc()`.

### 2.6 Typography

- **Sans (display + body)**: Geist (`var(--font-geist-sans)`), loaded by
  `next/font/google` with the `--font-geist-sans` CSS variable.
- **Mono (labels, code, telemetry)**: Geist Mono.
- Body has `font-feature-settings: "ss01", "cv11"` enabled — the stylistic
  alternates that distinguish Geist from Inter.
- Hero display uses `text-[clamp(2.5rem,6vw,4.75rem)]` for fluid sizing
  without breakpoint jumps.

### 2.7 Utilities introduced

| Class              | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `.tabular`         | `font-variant-numeric: tabular-nums` for telemetry values |
| `.console-grid`    | Subtle 48px grid backdrop — used selectively (hero only)  |
| `.mask-fade-edges` | Radial mask for soft-edge backgrounds                     |
| `.hairline`        | Border-color helper (currently aliases `--border`)        |

---

## 3. Providers

All client-side providers compose under `src/providers/index.tsx`
as a single `<AppProviders>` mounted by the root `layout.tsx`.

| Provider                | Owner of                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| `ThemeProvider`         | Light/dark/system via `next-themes`. `class="dark"` strategy, no FOUC. |
| `ReducedMotionProvider` | System `prefers-reduced-motion` + user override (localStorage).        |
| `MotionProvider`        | App-wide `<MotionConfig>` — forwards reduced-motion to every `motion`. |
| `LenisProvider`         | Inertia smooth scroll. Disabled under reduced-motion.                  |
| `CommandMenuProvider`   | ⌘K open/close state + global keybinding (`mod+K`).                     |
| `Toaster` (sonner)      | Bottom-right toast bus.                                                |

### Reduced-motion contract

Every animated surface MUST gate on `useReducedMotionPreference()`. The
CSS safety net in `globals.css` will neuter any animation that slips
through, but components should still respect the contract explicitly so
behavior (e.g. skipping a 3D scene, falling back to SVG) is intentional.

---

## 4. Primitives (`src/components/ui/*`)

Components are hand-authored, but `components.json` is configured so future
`shadcn add <component>` commands integrate cleanly under the same aliases.

| Component                    | API                                                                                                  | Notes                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Button`                     | `variant: default \| accent \| outline \| ghost \| link \| subtle`, `size: sm/md/lg/icon`, `asChild` | Slot-based for `<Link asChild>`; focus-ring built in. |
| `Badge`                      | `tone: default \| accent \| good \| warn \| hot \| outline`                                          | Mono uppercase pill; pattern tags, status chips.      |
| `Kbd`                        | Mono keyboard hint                                                                                   | Used in nav ⌘K trigger and command menu hints.        |
| `StatusDot`                  | `tone: good \| warn \| hot \| neutral`                                                               | Pulsing telemetry dot. Animation respected by CSS.    |
| `GithubIcon`, `LinkedinIcon` | Inline SVG brand glyphs                                                                              | Lucide v1 removed brand icons; this is the local set. |

---

## 5. Site composition (`src/components/site/*`)

| Component            | Role                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| `SiteNav`            | Sticky top nav: wordmark, primary links, ⌘K trigger, theme toggle. Active-link aware. |
| `SiteFooter`         | Two-column quiet footer: availability + meta (left), contact links (right).           |
| `CommandTrigger`     | Search-style ⌘K opener for the nav.                                                   |
| `CommandMenu`        | Dialog-wrapped `cmdk` palette. Phase 1: Navigate mode. Phase 4: Ask mode.             |
| `CommandMenuContext` | ⌘K state + global keybinding.                                                         |
| `ThemeToggle`        | Light/dark cycle (system reachable via ⌘K).                                           |
| `HeroAskCta`         | Client-island CTA on the home hero that opens the command menu.                       |

---

## 6. Accessibility contract

- WCAG 2.2 AA across all surfaces, AAA where cheap.
- Focus rings are real, visible, and styled via `:focus-visible` in
  `globals.css`. Buttons re-apply `focus-visible:ring-*` for clarity.
- All interactive surfaces are keyboard reachable. `aria-current="page"` on
  the active nav link. `aria-label`s on icon-only buttons.
- Command menu uses Radix Dialog + cmdk → full role/aria coverage.
- Color contrast against `--background` validated for `foreground` and
  `muted-foreground`. (Re-validate when accent shade changes.)
- `prefers-reduced-motion` is honored by both the provider AND a CSS safety
  net.

---

## 7. Performance contract (Phase 1)

- Home `/` is statically prerendered (Next 16 SSG).
- Hero uses native CSS only — no JS animation cost on first paint.
- Lenis and `motion` are imported only inside `"use client"` modules, so the
  Server Component shell doesn't pull them.
- Current build bundle: **350 KB gzipped** (size-limit budget: 400 KB).
- Tighter, per-route + per-phase budgets land in Phase 2 alongside the 3D
  bundle.

---

## 8. Open questions (resolved before Phase 2)

- **Display typeface**: Geist (locked for now — Vercel-native, free, ties to audience).
- **Accent color**: signal-cyan (locked — telemetry semantics, works in both modes).

(Other §7 questions in the blueprint remain open until their phase.)
