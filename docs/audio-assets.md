# Audio assets — what to download & where to put it

This is the **sourcing + placement guide** for the site's opt-in audio. No audio
code ships right now; once you drop files into `public/audio/`, tell me and I'll
wire up an opt-in player (muted by default, never autoplay, lazy-loaded).

> **Licensing rule:** only use audio that is explicitly **free for commercial
> use**. Do **not** use commercial tracks (Blade Runner, Tron, Tycho,
> Stellardrone, The Midnight, etc.) — those are copyrighted and will get the site
> taken down. The references in `immersive-world-vision.md` are _mood targets_, not
> files to use. Keep a note of each file's license + attribution.

---

## Where to download (free, commercial-use)

| Source          | URL                                              | Good for        | Attribution                |
| --------------- | ------------------------------------------------ | --------------- | -------------------------- |
| **Pixabay**     | pixabay.com/music + /sound-effects               | music + SFX     | **None** (best first stop) |
| **Mixkit**      | mixkit.co/free-stock-music + /free-sound-effects | music + SFX     | None (own license)         |
| **Uppbeat**     | uppbeat.io                                       | cinematic music | Free tier needs a credit   |
| **Freesound**   | freesound.org                                    | SFX             | **Per-clip** — check each  |
| **OpenGameArt** | opengameart.org                                  | game ambiences  | Per-asset — check each     |

Always read the license on the asset page before downloading.

---

## What to download

### 1. Ambient music — 1 loop to start (recommended)

- A single **seamless ambient loop**, ~1–3 min, calm and non-distracting.
- Search terms: `space ambient`, `cyberpunk ambient`, `ambient drone`,
  `chill synthwave`, `lo-fi ambient`.
- Format: **MP3** (or OGG). Aim for **< 2 MB** (it only loads when a visitor
  clicks "Sound on", but smaller is better).

### 2. (Later) Per-area music — optional, 1 loop per zone

Only if we build adaptive per-zone music. Moods from the vision doc:

| Area     | Mood                | Search terms                       |
| -------- | ------------------- | ---------------------------------- |
| Work     | deep / focused      | `dark synth ambient`, `tech drone` |
| Projects | energetic           | `synthwave`, `retrowave`           |
| Writing  | warm                | `lo-fi`, `chillhop`                |
| About    | emotional cinematic | `cinematic ambient`, `pad`         |
| Contact  | hopeful, open       | `uplifting ambient`                |

### 3. Sound effects — small files (< 50 KB each)

- **UI:** `ui click`, `soft beep`, `hover tick`, `whoosh`, `interface confirm`.
- **Environment (optional):** `computer hum`, `server room`, `neon buzz`,
  `keyboard typing`, `wind ambience`, `vinyl crackle`.
- Format: **MP3** or **WAV**.

---

## Where to put the files

Create this structure under `public/`:

```
public/audio/
├── music/
│   ├── ambient.mp3            # the main loop (start here)
│   └── work.mp3 …             # optional per-area loops
└── sfx/
    ├── hover.mp3
    ├── select.mp3
    ├── confirm.mp3
    └── whoosh.mp3
```

Naming guidance:

- **lowercase, kebab-case**, no spaces (`neon-buzz.mp3`, not `Neon Buzz.mp3`).
- Keep names semantic (`hover`, `select`, `ambient`) — I'll map them in code.

Anything in `public/` is served from the site root, e.g.
`public/audio/music/ambient.mp3` → `/audio/music/ambient.mp3`.

---

## When you're done

Tell me which files you added (and their licenses). I'll then:

- Build a small opt-in audio feature (a clear "Sound on/off" control).
- Loop the ambient track and trigger SFX on hover/navigation.
- Keep it **muted by default, gesture-started, reduced-motion aware**, and
  **lazy-loaded** so it never costs anything for visitors who don't enable it.
