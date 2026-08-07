# Restructure plan

A review of `src/` as it actually is today, why it feels over-engineered, and a
phased plan to fix it without changing behaviour.

Status: proposal. Nothing here has been applied.

---

## 1. Verdict

The architecture is not wrong — the **granularity** is. Feature boundaries are
clean (cross-feature coupling is tiny), the `@/` alias is used consistently, and
routing is thin. The problem is that every cohesive unit of code has been
shredded into 3–6 tiny files, and then those files were stacked into folders
named after technical kinds at two different levels. The result reads like a
codebase with 350 modules and no modules.

You are not misreading it. The numbers below say the structure is the problem.

---

## 2. Evidence (measured, not guessed)

| Metric                      | Value                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| TS/TSX files in `src/`      | **345**                                                                                    |
| Lines of TS/TSX in `src/`   | ~16,400                                                                                    |
| **Average file size**       | **~47 lines**                                                                              |
| Files under 30 lines        | **118** (34% of the codebase)                                                              |
| Smallest "module"           | `career-graph-svg-viewport.ts` — **5 lines**                                               |
| Top-level folders in `src/` | **13**                                                                                     |
| Deepest path                | **7 segments** (`src/features/world/components/lounge/lounge-tv-channels/wave-channel.ts`) |
| Largest flat folder         | `features/studio/components/scene/` — **40 files**                                         |
| Second largest              | `features/world/components/` — **38 files**                                                |
| Barrel files                | 11                                                                                         |
| Empty folders               | 1 (`src/components/layout`)                                                                |

### Prefix-namespaced clusters — folders pretending to be filenames

These are the "too many levels / not grouped" feeling, concretely. Each row is
one concept spread over N files that all share a prefix because the prefix is
doing the job a folder should do:

| Cluster                | Files | Lines | Location                                                           |
| ---------------------- | ----- | ----- | ------------------------------------------------------------------ |
| `boot-*`               | 16    | 622   | `features/world/components/` (flat, mixed with 22 unrelated files) |
| `deck-*` + hud         | 12    | 574   | `features/world/components/hud/`                                   |
| `career-graph-*`       | 10    | 512   | `features/career-graph/components/`                                |
| `lounge-*`             | 11    | ~500  | `features/world/components/lounge/`                                |
| `pixelated-portrait-*` | 6     | 436   | `features/about/components/`                                       |
| `mouse-*`              | 5     | 369   | `features/studio/components/scene/`                                |
| `destinations-*`       | 11    | ~900  | `features/world/constants/`                                        |
| `retrieve-*`           | 7     | ~400  | `src/ai/`                                                          |

`features/career-graph/components/career-graph-svg.tsx` is imported as
`@/features/career-graph/components/career-graph-svg` — the concept is repeated
three times in one path.

---

## 3. Root causes

There are exactly three, and they are causal. Reorganising folders without
fixing #1 will not stick — the structure will re-shred itself.

### Cause 1 — the 100-line cap is manufacturing files

`eslint.config.mjs` enforces `max-lines: ["error", { max: 100 }]` on all of
`src/**`, and `.devin/rules/00-core.md` restates it as a target. This is the
single largest driver of the mess.

The consequence is visible everywhere: a 436-line canvas portrait becomes six
files (`-canvas`, `-engine`, `-engine-config`, `-frame`, `-sampler`, plus the
component); a procedural mouse shell becomes five. These splits are not
conceptual boundaries — `pixelated-portrait-frame.ts` imports nine constants
from `pixelated-portrait-engine-config.ts` and a type from
`pixelated-portrait-sampler.ts` purely to stay under the cap. Cohesive code was
cut along an arbitrary line, and the seams became import graphs you now have to
navigate.

A 100-line cap is reasonable for React components. It is actively harmful for
shaders, procedural geometry, canvas draw routines, and content data — which is
most of this repo.

**Fix:** raise the cap to `250` for `src/**`, keep a tighter `120` for `.tsx`
where it reflects real component hygiene, and exempt data/shader/draw modules.
Keep "small files" as a value, drop it as a mechanical gate.

### Cause 2 — layering by technical kind, twice

`src/` has 13 top-level buckets, then most features repeat the same buckets
inside themselves (`components/`, `constants/`, `hooks/`, `stores/`, `utils/`).
So finding the boot overlay means traversing kind → feature → kind → cluster.

Several top-level buckets do not earn their existence:

- `src/types/` — one file, and it is a **pure re-export** of `src/schemas/agent.ts`. 17 files import the indirection.
- `src/telemetry/` — one file, containing **one constant**.
- `src/utils/` — one file (`cn.ts`).
- `src/schemas/` — one file.
- `src/rate-limit.ts` — sits loose at the root of `src/`, in no bucket at all.

And the `components/` level inside a feature is pure noise:
`features/studio/components/scene/` has exactly one child, and
`features/about/components/about.tsx` is a feature whose entire content _is_ the
component.

### Cause 3 — ownership is wrong, so names lie

- **`src/stores/` holds feature state.** Six of its nine files (`boot`, `explore`, `world`, `world-theme`, `perf`) are owned exclusively by the `world` feature. Meanwhile `command-menu` and `inspector` correctly keep stores feature-local. Two conventions, no rule.
- **`src/config/brand.ts` is not brand.** It is Three.js material tokens (`roughness`, `metalness`). It has **39 importers** — the most-imported module in the repo after `routes` — under a name that tells you nothing.
- **`src/constants/room.ts` is world geometry**, used by studio scene meshes and world camera framing, but lives in global constants.
- **`src/constants/agent-index.json` is generated** (3,367 lines) and sits in a hand-authored folder.
- **`features/home` is not home.** `/work` imports `OperatingSection` and `TrustSection` from it. `Home` itself is an 8-line `sr-only` wrapper. `features/about` is a 19-line wrapper. These are page sections, not features.
- **`features/studio` is not a feature.** It is the 3D desk/room content rendered inside `world`'s `<Canvas>`. `world` imports it 12 times, and **11 of those bypass the barrel** to reach `studio/components/screens/canvas-texture` — the boundary is already fictional.

---

## 4. Target structure

```
src/
  app/                      # routing only — essentially unchanged
    (marketing)/
    api/

  features/
    world/                  # absorbs studio/ — one 3D scene, one owner
      index.ts              # public API
      world-stage.tsx  world-canvas.tsx  world-camera.tsx  ...
      boot/                 # was 16 boot-* files → ~5
      hud/                  # was deck-* → drop prefix
      lounge/
      props/
      scene/                # was features/studio/components/scene
      stores/               # was src/stores/{boot,explore,world,world-theme,perf}
      hooks/  utils/
      data/                 # destinations-*, stations, sectors, work-timeline
      types.ts
    agent/                  # was src/ai + src/schemas/agent
      index.ts
      retrieval.ts          # was 7 retrieve-* files
      stream.ts  response.ts  system-prompt.ts  schema.ts
      generated/agent-index.json
    career-graph/           # prefix dropped: graph.tsx, node.tsx, axis.tsx, svg.tsx
    command-menu/
    inspector/
    audio/

  components/               # cross-feature presentational (shadcn-compatible)
    ui/                     # unchanged — components.json points here
    r3f/                    # canvas plumbing + canvas-texture + materials.ts
    sections/               # was features/home + features/about page sections

  config/                   # env, site, routes, navigation, seo, telemetry
  lib/                      # cn.ts, rate-limit.ts (server-only)
  stores/                   # only genuinely cross-cutting: reduced-motion, web-vitals
  providers/
  styles/
```

Rules that make it self-maintaining:

1. **One level of grouping inside a feature, and only when a real cluster exists** (≥5 related files). No `components/` passthrough level.
2. **The folder name is the namespace — never repeat it in filenames.** `world/boot/splash.tsx`, not `world/components/boot-splash.tsx`.
3. **A feature owns its state, data, hooks, and utils.** `src/stores/` is for state used by two or more features, nothing else.
4. **Cross-feature imports go through `index.ts`.** Enforced by lint, not habit.
5. **Generated files live in a `generated/` folder** so they are obviously not hand-authored.

Expected outcome: **~345 files → ~230**, max depth 7 → 5, and the two 40-file
folders gone.

---

## 5. Phased plan

Every phase is a pure move/merge with no behaviour change, independently
shippable, and verified by `pnpm validate && pnpm build`. Run `pnpm e2e` at the
end of phases 3, 4, and 7. Use `git mv` so history follows.

Do this on a branch, one commit per phase, on a clean tree.

### Phase 0 — unblock (prerequisite)

- Raise `max-lines` to 250 for `src/**`; 120 for `src/**/*.tsx`; off for `**/*-{draw,shaders,geometry,layout,data}.ts` and `**/data/**`.
- Update `.devin/rules/00-core.md` to match, reframing "~100 lines" as guidance.
- Delete the empty `src/components/layout/`.

Nothing moves yet. This phase only removes the pressure that caused the mess.

### Phase 1 — kill the one-file buckets

- Delete `src/types/agent.ts`; repoint its 17 importers at the schema module.
- `src/utils/cn.ts` → `src/lib/cn.ts`; `src/rate-limit.ts` → `src/lib/rate-limit.ts`.
- `src/telemetry/constants.ts` → fold into `src/config/`.
- `src/constants/routes.ts` → `src/config/routes.ts` (53 importers; it is config).
- `src/seo/*` → `src/config/seo/*`.
- Update `components.json` `aliases.utils` to `@/lib`.

Removes 4 top-level folders. Mechanical, wide, zero risk.

### Phase 2 — rename the lies

- `src/config/brand.ts` → `src/components/r3f/materials.ts` (39 importers; it is 3D material tokens).
- `src/constants/patterns.ts` → `src/config/patterns.ts` (content taxonomy).
- `src/constants/agent-index.json` → `src/features/agent/generated/agent-index.json`; update `scripts/agent-index/paths.ts`.
- `src/constants/room.ts` → moves with the scene in phase 4.

### Phase 3 — flatten features, drop the `components/` level

For each feature: `features/X/components/*` → `features/X/*`, then group the
prefix clusters into folders and strip the prefix.

- `world/components/boot-*` (16 files) → `world/boot/` and **merge to ~5**: the four 20-line files (`wordmark`, `backdrop`, `wip-notice`, `progress-reporter`) collapse into their consumers.
- `world/components/hud/deck-*` → `world/hud/{button,comms,controls,radar,radar-plot,map-overlay,sector-list,station-map}.tsx`.
- `world/components/lounge/lounge-*` → `world/lounge/{sofa,tv,lamp,rug,...}.tsx`; `lounge-tv-channels/` → `world/lounge/channels/` (kills the 7-segment path).
- `career-graph/components/career-graph-*` → `career-graph/{graph,node,axis,svg,defs,canvas,showcase}.tsx`; merge the 5-line `career-graph-svg-viewport.ts` into `svg.tsx`.
- `about/components/pixelated-portrait-*` (6 files, 436 lines) → **2 files** under `components/sections/portrait/`, now that phase 0 allows it.
- `world/constants/destinations-*` → `world/data/destinations/`.

Tests stay co-located and move with their subjects.

### Phase 4 — merge `studio` into `world`

- `features/studio/components/scene/*` → `features/world/scene/*`; group `mouse-*` (5 files) → `world/scene/mouse/` and merge to 2–3.
- `features/studio/components/screens/*` → `features/world/scene/screens/*`.
- Promote `canvas-texture.ts` → `src/components/r3f/canvas-texture.ts`, resolving all **11 barrel-bypassing imports**.
- `src/constants/room.ts` → `features/world/scene/room-dimensions.ts`.
- Delete `features/studio/`.

Highest-value phase: eliminates a fake boundary and 12 cross-feature imports.
Run `pnpm e2e` — this touches the 3D scene.

### Phase 5 — move state to its owner

- `src/stores/{boot,explore,world,world-theme,perf}-store.ts` → `features/world/stores/`.
- `src/config/world-theme.ts` → `features/world/theme.ts`.
- `src/hooks/use-world-palette.ts` → `features/world/hooks/`.
- Keep `src/stores/{reduced-motion,web-vitals}-store.ts` — genuinely cross-cutting.
- Note: `inspector` reads world stores. Export what it needs from `features/world/index.ts` rather than letting it deep-import.

### Phase 6 — consolidate the agent

- `src/ai/` → `src/features/agent/`.
- Merge the 7 `retrieve-*` files into `retrieval.ts` + `retrieval/types.ts`.
- `src/schemas/agent.ts` → `features/agent/schema.ts`.
- Drop `agent-` prefixes: `stream.ts`, `response.ts`, `index-loader.ts`.
- Add `features/agent/index.ts` as the only entry point for `app/api/chat/route.ts`.

### Phase 7 — sections, and lock it in

- `features/home` + `features/about` → `src/components/sections/` (`hero`, `operating`, `trust`, `portrait`). Deletes two features that were never features and fixes `/work` importing from `@/features/home`.
- Fix the two files that self-import via `@/features/home/constants/operating` instead of a relative path.
- Add the guardrails in §6.
- Full `pnpm validate && pnpm build && pnpm e2e && pnpm size`.

---

## 6. Guardrails (so it does not rot again)

Add to `eslint.config.mjs`:

1. **No deep imports across features.** `no-restricted-imports` with pattern `@/features/*/*` outside the owning feature — forces the barrel. This alone would have caught all 11 `canvas-texture` violations.
2. **No `@/features/*` imports from inside the same feature** — use relative paths. Catches the `features/home` self-import inconsistency.
3. **`app/` may not be imported from** — routing is a leaf.
4. **Replace `max-lines` with `max-lines-per-function`** as the primary signal. Function length tracks complexity; file length tracks nothing.

Document the five structure rules from §4 in `.devin/rules/project-structure.md`
so agents and humans follow the same convention.

---

## 7. Scope and risk

**Not in scope:** no dependency changes, no rendering or data-flow changes, no
route changes, no public-URL changes. Every step is a move, a merge, or a
rename.

**What makes this safe:**

- Every import already goes through the `@/` alias, so moves are mechanical.
- `pnpm validate` runs lint + typecheck + format + test + knip; TypeScript catches every broken path immediately.
- `knip` will flag any barrel export orphaned by a merge.
- 19 unit tests and 6 Playwright specs cover boot, command menu, inspector, content pages, and a11y.
- Phases are independent — any one can be shipped or reverted alone.

**Real risks:**

1. **Merging files can change module init order.** Matters for the R3F scene modules that build geometry at module scope. Mitigation: phases 3–4 merge only files already imported together, and `pnpm e2e` runs after each.
2. **`git mv` at this volume will make `git blame` noisier.** Mitigation: one commit per phase, moves separated from edits, and add a `.git-blame-ignore-revs` entry.
3. **`components.json` alias changes affect `shadcn add`.** Phase 1 updates it; keeping `components/ui` in place is deliberate for exactly this reason.
4. **Bundle size could shift** when merging modules changes tree-shaking boundaries. `pnpm size` guards the 1.3 MB budget; check it after phases 3, 4, and 6.

**Suggested order if you want value fastest:** Phase 0 → 3 → 4. Those three
remove the two 40-file folders, the 7-segment paths, the worst prefix clusters,
and the fake `studio` boundary — the bulk of the "I can't find anything"
problem. Phases 1, 2, 5, 6, 7 are cleanup that can land incrementally.
