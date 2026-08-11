# Refactor

The migration from the tree as it is to the architecture in
[`architecture.md`](./architecture.md). **That file is the target; this one is the route.**
Delete this file when the last phase lands.

Status: **Phase 1 in progress.** Supersedes `restructure-plan.md`, deleted 2026-08-11 — see
[`decisions.md`](./decisions.md) for why its central premise was wrong.

---

## 1. Why the previous plan was replaced, not continued

`restructure-plan.md` diagnosed the granularity problem correctly — a 100-line lint cap
shredding cohesive modules, two levels of technical-kind folders, names that lie about
ownership — and Phase 0 fixed the cause. Its structural conclusions largely hold, and where
they do this plan keeps them.

What it got wrong was its own charter:

> "Every phase is a pure move/merge with **no behavior change**."

That constraint is incompatible with the actual state of the repository. Roughly a third of
the work below is deletion of code that should never have been kept and correction of
statements the product makes that are not true. A plan that forbids behavior change can only
relocate those into better folders — which is how the four copies of the career record, three
dead dependencies and a page advertising a deleted feature would all have survived a
"successful" seven-phase restructure.

The new charter:

> **Author content once, derive every representation, delete what does not earn its place.**
> Behavior changes where the current behavior is incomplete, misleading, abandoned, or
> architecturally wrong. Not for style.

---

## 2. Evidence

Measured 2026-08-11 against `f7335a8`. This is what the phases below act on.

### Content is authored two to four times

The career record exists in four places, in three formats, and has already drifted:

| Location                           | Format            | Consumer               |
| ---------------------------------- | ----------------- | ---------------------- |
| `constants/career.ts`              | typed engagements | RAG index only         |
| `world/constants/work-timeline.ts` | typed timeline    | `/work`                |
| `props/resume-screen-draw.ts`      | canvas literals   | a 3D wall screen       |
| `props/timeline-screen-draw.ts`    | canvas literals   | another 3D wall screen |

Drift already shipped: `timeline-screen-draw` has a sixth entry ("2015 · Studio era") that
exists nowhere else; `career.ts` lists an operating company with no matching engagement;
`stack-screen-draw` advertises GSAP and shadcn/ui, neither of which is a dependency. The
author's role line exists in three variants (`profile`, boot constants, `world-neon`). All
seventeen `page.tsx` files hand-copy their destination's summary into `metadata`.

### Dead code the tooling cannot see

`knip` sees real imports, so none of this is flagged:

- **`motion`** — only `<MotionConfig>`; zero animated components in `src/`.
- **`sonner`** — `<Toaster/>` mounted; zero `toast()` calls.
- **`lenis`** — a permanent rAF loop competing with the 3D render loop. Verified
  non-load-bearing: `html { scroll-behavior: smooth }` already provides smooth scrolling and
  Lenis _disables_ it to substitute its own; `anchors: true` handles nothing because no
  anchor links are authored; and the provider returns early under reduced motion, so a whole
  class of visitors already runs without it.
- **Five `.cg-*` CSS classes** plus `.boot-ring` — remnants of the deleted `career-graph`.
- **`config/navigation.ts`** — a second, partial nav model covering 6 of 17 routes.
- **`scene/constants.ts`** — re-exports `brand.ts` under aliases.

### Statements the product makes that are not true

- `/playground` advertises "Career graph — an animated graph", a feature deleted in `b72c1e5`.
- The inspector's empty state says "the static SVG carries the same data". There is no SVG.
- `SYSTEM_PROMPT` and `REFUSAL_TEXT` both direct users to "the links in the site footer".
  There is no footer.
- The 3D résumé screen renders "↧ DOWNLOAD RÉSUMÉ". There is no PDF.
- The boot gate advertises "Alpha · Work in progress … expect placeholder content".
- Five pages promise content that does not exist (`/writing`, `/case-studies`, `/lab`,
  `/open-source`, `/speaking`).

### Duplicated implementation

- **Seven external stores**, each re-implementing the same `Set<listener>` / `emit` /
  `subscribe` / `getSnapshot` / `getServerSnapshot` — roughly 200 lines of one 25-line idea.
- **Seven copies** of `useDisposable(createCanvasTexture) → interval → draw → needsUpdate`,
  each carrying a verbatim-duplicated four-line `eslint-disable` banner.
- **Three CRT draw kits**: `screen-draw-kit.ts` defines the primitives, `terminal-screen-draw`
  reimplements them inline, `lounge-tv-screen-draw` redefines `INK` a third time.

### Retrieval is a data defect, not a layout one

25 chunks, whole-page granularity (largest 2,979 characters), **`anchor` undefined on all 25**
— so `buildCitations`' deep-link machinery is unreachable — and **8 of 25 permalink to `/`**
because career chunks hardcode `routes.home`. The agent cites the home page for Peacock work.
`agentSourceKindSchema` ships `"case-study"` and `"essay"`, neither ever emitted.

### Other

- `world-poster.png` is 3.19 MB at 5116×2084, served raw as the Open Graph card.
- `diogo-esteves.png` is 1.4 MB for a portrait rendered at 192px.
- The home page has no visible content — `Home` wraps the hero in `sr-only` — and
  `home.spec.ts` passes anyway, because Playwright treats `sr-only` as visible.
- `package.json` carries `--max-warnings 11`, a committed debt budget.

---

## 3. Change classification

Every change below is one of six kinds. The last row is the only one that alters what a
visitor sees for reasons other than correctness, and it is deliberately isolated in Phase 7.

| Kind                       | Scope                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Deletion (obsolete)**    | 3 dependencies, 6 CSS classes, 4 modules, 10 barrels                                 |
| **Consolidation**          | 7 stores → 1 factory · 7 texture hooks → 1 · 3 draw kits → 1 · 56 scene files → ~10  |
| **Structural refactor**    | `studio` dissolved · page rendering moves from `world` to `site` · domains flattened |
| **Bug fix**                | citation permalinks · stale copy ×4 · OG image weight · warning budget               |
| **Architectural redesign** | the content model · per-block chunking · derived metadata · data-driven screens      |
| **Product / UX**           | home page · ⌘K coverage · placeholder pages · résumé · alpha notice                  |

---

## 4. Phases

Each phase leaves `pnpm validate` and `pnpm e2e:ci` green and is independently revertible.
The E2E suite is structure-immune by design and is the only gate that observes behavior
rather than resolution — run it at the end of every phase, not just the dangerous ones.

### Phase 1 — remove the dead weight ⏳

Deletion and bug fix. Nothing moves, so nothing can break subtly.

- Delete `motion`, `sonner`, `lenis` with their providers and the six `.lenis*` CSS blocks.
- Delete the five `.cg-*` classes and `.boot-ring`.
- Delete `types/agent.ts` (a pure re-export, 17 importers) and collapse `telemetry/` to
  `telemetry.ts`.
- Delete the `METAL` / `ANODIZED` / `PORT` aliases in `scene/constants.ts`; import the
  materials directly.
- Fix the four false statements: `/playground` copy, the inspector empty state, and the two
  "site footer" references in the agent prompt and refusal text.

**Two items were moved out of this phase during execution**, because doing them here would
have created work that a later phase immediately undoes:

- **`config/navigation.ts` → Phase 2.** Deleting it means the ⌘K menu must derive its route
  list from somewhere, and the only current source is `features/world/constants/station-index`
  — a cross-domain reach that the present lint rule forbids and that Phase 2 replaces with
  `content/pages.ts` anyway. Deleting it here would mean importing the wrong module now and
  repointing it in a fortnight.
- **Barrels and the import rule → Phases 2, 5 and 6, per domain.** The layered rule in
  `architecture.md` §4 is written against domain paths (`content/`, `site/`, `world/`) that do
  not exist yet, so writing it now means writing it three times. Each domain's barrel is
  deleted by the phase that moves that domain, when its final path exists. `--max-warnings 11`
  therefore stays until Phase 5, which is what resolves the 11 deep imports into
  `features/studio` that the budget accounts for.

### Phase 2 — establish `content/`

Architectural redesign. The phase everything else depends on.

- Create `content/` per `architecture.md` §5: `schema.ts`, `routes.ts`, `pages.ts`,
  `profile.ts`, `pages/*`.
- Delete `config/navigation.ts`; the ⌘K route list and the HUD both derive from
  `content/pages.ts`, so all 17 routes become reachable from the menu.
- `site/` takes ownership of DOM rendering: `page-view.tsx`, `blocks.tsx`, `metadata.ts`,
  `structured-data.tsx`. `world/` stops owning the reading surface.
- All 17 `page.tsx` derive metadata; `sitemap.ts` derives from `content/pages.ts`.
- `(world)/layout.tsx` mounts the world **beside** `{children}`.
- Home becomes a real `PageView`; the `sr-only` wrapper goes, and `home.spec.ts` is corrected
  to assert genuinely visible content.

### Phase 3 — one career record, one index

Architectural redesign and bug fix.

- Collapse four career copies into `content/career.ts`.
- Every draw function takes its data as a parameter; no facts remain in `world/screens/`.
- Rebuild the index: per-block chunks, `id` as anchor, correct permalinks.
- Delete the `essay` / `case-study` chunk kinds and rewrite the five placeholder pages to
  describe what exists.

### Phase 4 — the two real abstractions

Consolidation.

- One `createStore<T>()`; `src/stores/` dissolves into the producing domains.
- One `useCanvasTexture` and one CRT kit; the seven duplicated `eslint-disable` banners go.

### Phase 5 — the 3D room

Structural refactor. **The dangerous phase**, deliberately last among the structural ones and
run against a codebase that has already shrunk.

- `features/studio` dissolved into `world/scene/`; 56 scene files merged to ~10 by object
  group.
- `brand.ts` → `world/materials.ts` (44 importers), `constants/room.ts` → `world/room.ts`.
- `components/r3f` → `world/`; tuning constants consolidated into `world/tuning.ts`.
- `features/audio` → `world/audio.ts`.

Verified by the RTTR scene spec. Its exact mesh count is the only guard against a mesh
vanishing in a large move — it will need a deliberate, recorded update, never a quiet one.

### Phase 6 — the remaining domains

Consolidation.

- `src/ai` → `agent/`; the six `retrieve-*` files merge; `rate-limit.ts` moves in beside its
  only caller.
- `command-menu` 13 files → 5, deriving all 17 routes from `content/pages.ts`.
- `inspector` 8 → 2. `boot/` 15 → 4. `hud/` 12 → 4. Portrait 6 → 2.

### Phase 7 — product and documentation

Product/UX, isolated so it can be scheduled or dropped independently.

- Remove the alpha notice properly, not by hiding it.
- Remove the fake résumé download, or wire a real PDF.
- Image budgets: a proper 1200×630 OG card.
- Update `architecture.md` where reality taught us something; append `decisions.md`; delete
  this file.

---

## 5. Risks

1. **Merging modules can change init order.** Real for scene modules that build geometry and
   canvas textures at module scope. Phases merge only files already imported together, and
   `e2e:ci` runs after each.
2. **`git blame` gets noisier.** One commit per phase, moves separated from edits, and a
   `.git-blame-ignore-revs` entry.
3. **The index build reads content.** `agent:index:check` runs in `prebuild` and fails the
   build if the committed index is stale. Phases 2 and 3 must rebuild and commit it.
4. **`content/pages/**` is `server-only` but the index builder reads it via `tsx`.**
   `server-only` is a no-op under plain Node, so this works — verified in Phase 2 rather than
   assumed.
5. **Bundle size shifts** when merging changes tree-shaking boundaries. Read `pnpm size` after
   phases 1, 4 and 5; its CI step is `continue-on-error` by design, so a regression appears in
   the log, not as a red build.
6. **`components.json` aliases** move to `@/ui`, keeping `shadcn add` working.

---

## 6. Open product questions

Not blocking; settled as the phases reach them.

- **Résumé PDF** — a real document is wanted eventually. Until it exists, Phase 7 removes the
  download affordance rather than shipping an action that pretends a file exists.
- **Essays and case studies** — no content is ready, so no pipeline is being built. When there
  is real content, the content type gets designed properly then.
- **`.devin/rules/project-structure.md`** describes the abandoned target and is frozen by
  `CLAUDE.md`. Left untouched it will instruct a future Devin session to undo this work.
  Needs an explicit call to unfreeze.
