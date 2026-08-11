---
paths:
  - "src/content/**"
  - "src/site/**"
  - "src/seo/**"
  - "src/config/site.ts"
  - "src/app/layout.tsx"
  - "src/**/*-draw.ts"
  - "src/**/*-textures.ts"
  - "src/world/screens/**"
---

# Language and copy

US English (en-US) for every human-readable string: prose, Markdown, UI copy, error messages,
accessible names, SEO copy, test titles, commit messages. Prefer `-ize`/`-or`/`-er` and a single
`l` before a suffix.

**Out of scope:** identifiers, filenames, routes and CSS classes — renaming an export is a
refactor, not a copy fix. Also third-party names and APIs, quoted external text, and proper
nouns.

**Generated files are regenerated, not edited:** `CHANGELOG.md` (release-please),
`src/constants/agent-index.json` (`pnpm agent:index`), `pnpm-lock.yaml`. Fix the source.

**Bulk replacements need guarded patterns** — `optimis[eai]`, or you corrupt `optimistic` — and
must skip generated files and identifiers.

**Locale settings that must agree:** `<html lang="en">`, `openGraph.locale: "en_US"` in
`src/seo/root-metadata.ts`, and `Intl` formatters on `"en-US"`. Locale drives order and
separators, so changing one is a visible UI change: verify the rendered string, and keep
`hourCycle` explicit rather than relying on an `hour12` default.

**Nothing checks any of this.** There is no spell-check gate, deliberately, so it holds by
review only — and copy painted into a canvas texture rather than the DOM is invisible to every
test. Read the rendered string after a format change.
