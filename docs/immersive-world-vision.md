# Diogo Studio — World Vision & Art Direction

> **Companion to `immersive-world-roadmap.md`.** This is an **idea board + creative
> brief** — the _what_ and _why_ we are reaching for. It is intentionally **not** a
> committed plan or schedule; the roadmap owns the _how_ and _when_. Capture ideas
> freely here, then promote the ones we decide to build into the roadmap.

> Parts of this distill a brainstorming session (ChatGPT) the team shared. Treat
> everything here as **raw inspiration, not requirements** — anything that ships
> must still pass our non-negotiables (accessibility, performance, SEO,
> type-safety, security). Spectacle never breaks the fundamentals.

---

## 0. North star

**This is not a portfolio. It's a place.** Visiting should feel like _stepping
into Diogo's digital workspace in 204X_ — a luxurious, futuristic studio floating
above a neon city, where every space says something about who he is and what he
builds.

**Ambition:** one of the most memorable engineering portfolios on the web —
something people _remember_ and _share_, not just read.

**Are you up for the challenge?** Yes. Unequivocally. The bar is "best on the
web," and every change is measured against that — while keeping it fast,
accessible, and honest.

---

## 1. Guiding principles (the rules of this world)

- **The world is the interface, not a background.** The 3D scene is the star; UI
  appears only when needed.
- **Reveal on focus.** Home is pure explore — no cards, paragraphs, buttons, or
  chips. Content appears only when you focus an object (or use the dock).
- **Objects are navigation.** Hover reveals a label + verb; click flies the
  camera in and opens the panel; closing returns you to the overview.
- **Responsiveness moves the camera, never the objects.** Narrower viewport →
  step further back. (We already do this via aspect-aware pullback; see §6.)
- **Every space means something.** No random rooms — each area maps to real
  routes and real content. Never an empty room.
- **One world, many doors.** You can always reach any object/area and always get
  back out (explore ⇄ focus).
- **Opt-in spectacle.** Motion, audio, and "free explore" are enhancements, gated
  on preferences (reduced-motion, mute) and never the _only_ way to do anything.
- **Earn the wow without taxing the user.** Lazy-load heavy bits; protect Core
  Web Vitals and the bundle/bandwidth budget.

---

## 2. Art direction & mood

**Aesthetic:** futuristic engineering studio / penthouse above a cyberpunk city.
Neon accents, glass, brushed metal, warm interior light against cool city haze.
Cinematic, premium, a little Tony-Stark-lab.

**Visual references:**

- **Film/Game:** Blade Runner 2049, Tron: Legacy, Cyberpunk 2077, Ghost in the
  Shell, Mass Effect, Interstellar, No Man's Sky, Journey.
- **Lighting:** volumetric pools, bloom on neon, soft spotlights that switch on
  when an object is focused, gentle vignette.
- **Palette:** deep blue-black base, per-area neon accent (each station already
  has an `accent`), warm highlights for "human" spaces (lounge, library).
- **Materials:** emissive neon, frosted glass panels, dark matte surfaces, subtle
  reflections.

**Feel words:** immersive, calm, premium, alive, intentional.

---

## 3. The experience (interaction model)

**Home = explore.** Name + a subtle prompt + the world. No content card.

```
            DIOGO ESTEVES
                  ★
            [ 3D STUDIO ]
     Hover objects to explore
```

**Focus flow:**

1. **Hover** an object → label + verb ("Projects — view case studies →").
2. **Click** → camera flies in, spotlight on, monitors/object animate, **panel
   slides in** beside the object (never over it).
3. **Close / `Esc` / click empty space** → camera returns to overview, panel
   hides.

**States:** `explore` ⇄ `focus` (per roadmap Phase 1). From any focus you can hop
to another visible object, use the dock, or exit.

**Free-explore mode (delight):** a key (`E` / `Space`) or control hides all UI and
lets you orbit the room like a mini-game. Opt-in, reduced-motion safe, clear exit.

**Boot sequence (signature moment):** first visit feels like powering on the
studio —

```
[ Powering studio… ]
→ lights switch on, one by one
→ monitors boot
→ ambient music fades in
```

Consider once-per-session, and always skippable / reduced-motion friendly.

**Mobile (open question, §8):** rather than shrinking the whole room, consider a
**focused-object-only** experience — show one object + its panel, swipe between
sections — i.e. a dedicated narrow-screen choreography.

**Navigation chrome:** lean toward _less_. Today we have top nav + bottom dock +
(now removed) home card + scene. The idea on the table: keep a slim top bar and a
small **dock/minimap** (e.g. lower-right list of places) and let the world do the
rest. To revisit deliberately — the dock is currently our return-to-explore and
a11y fallback.

---

## 4. The spaces (rooms) — current + proposed

Each room maps to **real routes** so it is never empty. Current scene already has
the **Engineering Studio** (desk) and the **Lounge** (sofa / TV / Game Boys /
coffee table).

| Space                    | Represents                           | Maps to routes                               | Status          |
| ------------------------ | ------------------------------------ | -------------------------------------------- | --------------- |
| 🖥 Engineering Studio    | Work / experience / craft            | `/work`, `/resume`, `/stack`, `/principles`  | Current         |
| 🛋 Lounge                | About / personality                  | `/about`, `/uses`, `/now`                    | Current         |
| 🚀 Project Hangar        | What he's built                      | `/projects`, `/case-studies`, `/open-source` | Proposed        |
| 📚 Library / Observatory | Words & ideas                        | `/writing`, `/speaking`                      | Proposed        |
| 🧪 Innovation Lab        | Experiments & AI                     | `/lab`, `/playground`                        | Proposed        |
| 🌿 Rooftop Garden        | Reach & trajectory                   | `/contact`, `/timeline`                      | Proposed        |
| 🎞 Memory Gallery        | Career timeline (walk-through)       | `/timeline`                                  | Idea            |
| 🌌 Hall of Ideas         | Hero showcase (floating holo panels) | best of `/projects` + `/writing`             | Idea (flagship) |

**Room flavor notes:**

- **Project Hangar** — holographic tables; clicking a project _materializes_ it
  above the table; docking-bay vibe.
- **Library / Observatory** — bookshelves, telescope, warm light, floating dust;
  Interstellar × late-night-coding cozy.
- **Innovation Lab** — robot arms, transparent displays, holograms, AI assistant.
- **Rooftop Garden** — trees, water reflections, city skyline, stars; the
  emotional _ending_ of the experience.
- **Hall of Ideas (flagship)** — a dark chamber of floating holographic panels
  (best projects, articles, OSS, future ideas) that expand on approach. If we
  build one show-stopper, this is it.

**Layout idea — circular "island" studio:** instead of a horizontal sprawl
(which breaks on narrow screens), arrange spaces around a central hub and reveal
them by rotating the camera. Reconciles responsiveness with "show everything."
(See roadmap Phase 4 — zones — and Phase 8 — area expansion.)

```
                Observatory
                     ▲
 Project Hangar ◄── Hub ──► Innovation Lab
                     ▼
            Engineering Studio
                 Lounge
             Rooftop Garden
```

---

## 5. Sound design direction

Current state: a **file-based opt-in player** is live — a looping royalty-free
ambient track plus hover/navigate/enable SFX from `public/audio/` (muted by
default, lazy-loaded; see `docs/audio-assets.md`). Direction to grow into:

**Ambient music (adaptive, per-area crossfade 2–3s — how games do it):**

| Area     | Mood                | Reference                |
| -------- | ------------------- | ------------------------ |
| Work     | deep synths         | Deus Ex / Blade Runner   |
| Projects | energetic           | Tron: Legacy / CP2077    |
| Writing  | warm lofi           | coffee-shop / late-night |
| About    | emotional cinematic | Interstellar / Journey   |
| Contact  | hopeful, open       | No Man's Sky             |

```
Master
├── Work layer
├── Projects layer
├── Writing layer
├── About layer
└── Contact layer   → crossfade on focus
```

Genre palette: space-ambient (Stellardrone, Carbon Based Lifeforms, Solar
Fields), modern ambient (Tycho, HOME), chill synthwave (The Midnight, FM-84,
Timecop1983).

**Environmental SFX (subtle, low volume):** soft wind, electrical hum, computer
fans, occasional keyboard taps (every 20–40s), neon buzz, vinyl crackle, rain (if
windows).

**Interaction SFX:** hover = tick/beep; focus = cinematic whoosh; panel open =
glass slide / soft click; spotlight = activation hum.

**Sourcing (when we go beyond procedural):** Pixabay Music, Uppbeat, Mixkit,
Freesound, OpenGameArt — all free-for-commercial-use; **verify license per track**
and respect the bandwidth budget (lazy-load, only on opt-in).

**Always:** muted by default, user-initiated start, persistent toggle, never
autoplay, reduced-motion/quiet-preference aware.

---

## 6. Responsive framing (idea vs. our implementation)

The brainstorm suggested fixed per-device camera distances/FOV:

```
Desktop  z=18  fov=35      Tablet  z=35  fov=55
Laptop   z=25  fov=45      Mobile  z=50  fov=70
```

Those exact numbers are **illustrative** — they assume a different scene scale
than ours (our FOV is 44, station positions are ~4–7 units). We implement the
_intent_ — "step further back on narrower screens" — as a **continuous,
aspect-aware pullback** (`features/world/utils/framing.ts`), which is smooth on
resize/rotate and needs no breakpoint table. Keep the idea, not the literals.

---

## 7. Working agreement — what Diogo expects from Cascade

- **Hold the "best on the web" bar.** Default to craft and ambition, not "good
  enough." Sweat lighting, motion, copy, micro-interactions.
- **Be proactive.** Anticipate, propose options, push quality — but flag tradeoffs
  and ask when intent is genuinely ambiguous.
- **Protect the non-negotiables, always:** WCAG 2.2 AA, Core Web Vitals (LCP/CLS/
  INP), SEO, end-to-end type safety, security. The spectacle must never break
  these.
- **Ship incrementally and safely.** Small, reversible changes; tests green;
  `pnpm validate` clean; granular Conventional Commits.
- **Keep the world coherent.** Every addition maps to real content and the
  principles above.
- **Keep the docs honest.** Vision lives here; the plan + status live in the
  roadmap; update both as we learn.

---

## 8. Open questions / decisions to make

- **Mobile:** dedicated focused-object + swipe experience, or a scaled-down world?
- **Chrome:** drop the bottom dock for a lower-right minimap, or keep the dock as
  the accessible fallback?
- **Audio:** decided — **downloaded royalty-free files** (see
  `docs/audio-assets.md`), opt-in. Open: per-area adaptive layers — when?
- **Boot sequence:** every visit, once per session, or opt-in?
- **Layout:** migrate to the circular "island" hub — and when?
- **Flagship:** is the **Hall of Ideas** the one show-stopper we invest in?

---

## 9. How this maps to the roadmap

- **Phase 0** — responsive camera framing _(done)_ → §6.
- **Phase 1** — explore ⇄ focus state → §3.
- **Phase 2** — reveal-on-focus composition _(in progress)_ → §3.
- **Phase 3** — home overview + dock/minimap → §3.
- **Phase 4** — zones (circular layout) → §4.
- **Phase 6** — free-explore mode → §3.
- **Phase 7** — ambient audio _(planned; royalty-free assets)_ → §5.
- **Phase 8** — new areas (Hangar, Library, Lab, Garden, Hall of Ideas) → §4.
