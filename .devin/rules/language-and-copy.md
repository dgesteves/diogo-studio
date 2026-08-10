---
trigger: always_on
---

# Language and copy

**US English (en-US) is the language of this project.** It applies to every
human-readable string, in code and out of it: documentation, Markdown, UI copy,
error messages, `aria-label`s and other accessible names, SEO and metadata copy,
test titles, commit messages, and the rare comment that earns its place.

Follow US English even when the surrounding text does not — the fix is to
correct the neighbors, not to match them.

## The spellings that actually come up here

| Use            | Not                    |
| -------------- | ---------------------- |
| behavior       | behaviour, behavioural |
| color          | colour                 |
| center         | centre                 |
| neighboring    | neighbouring           |
| favor          | favour                 |
| labeled        | labelled               |
| organize(d)    | organise(d)            |
| optimize(s)    | optimise(s)            |
| analyze        | analyse                |
| normalization  | normalisation          |
| characterizing | characterising         |
| sanitized      | sanitised              |
| serialized     | serialised             |

The general shapes: `-ize`/`-ization` over `-ise`/`-isation`, `-or` over
`-our`, `-er` over `-re`, and a single `l` before a suffix (`labeled`,
`modeling`, `canceled`). Words that are `-ise` in both dialects stay as they
are — `compromise`, `enterprise`, `advertise`, `supervise`, `precise`.

## Do not "correct" these

- **Identifiers, filenames, and routes.** Spelling is a copy concern; renaming
  an export, a prop, a CSS class, or a slug is a refactor with real blast
  radius. If an identifier is misspelled, that is a separate, deliberate change.
- **Third-party names and APIs.** Package names (`@img/colour`), upstream
  option names, and vendor terminology are quoted, not translated.
- **Quoted text.** Anything reproduced from an external source, a log, or an
  error emitted by a dependency keeps its original wording.
- **Generated files.** `CHANGELOG.md` is derived from commit messages by
  `release-please`, `src/constants/agent-index.json` by `pnpm agent:index`, and
  `pnpm-lock.yaml` by pnpm. Fix the source, then regenerate.
- **Proper nouns**, including place and person names.

## Three traps when fixing prose in bulk

The repo was converted wholesale on 2026-08-09 (68 occurrences — it had been uniformly
British). If you ever do that again:

- **A naive `s/optimis/optimiz/` corrupts `optimistic`.** Guard the suffix:
  `optimis[eai]`.
- **`CHANGELOG.md` and `src/constants/agent-index.json` are generated.** Fix the source
  and regenerate, or the next build overwrites you.
- **Identifiers, package names and quoted upstream text are out of scope.** Spelling is
  a copy concern; renaming an export is a refactor with real blast radius.

## Locale settings

These are formatting decisions, not spelling, but they should agree with the
above and should not drift:

- `<html lang="en">` in the root layout.
- `openGraph.locale` is `en_US` in `src/seo/root-metadata.ts`.
- `Intl` formatters take `"en-US"`. Note that the locale drives output order and
  separators, so changing one is a visible UI change — verify the rendered
  string, and prefer an explicit `hourCycle` over relying on `hour12` defaults.

**Nothing asserts on the terminal clock.** `useCenterScreenTexture` in
`features/studio/components/screens/terminal-screen.ts` formats Lisbon time with
`Intl.DateTimeFormat("en-US", …)` and paints it into a **canvas texture**, never the
DOM — so no unit test or spec can see it, and a locale or format change ships
unverified. Check the rendered string by hand. `hourCycle: "h23"` is explicit on
purpose: `hour12: false` leaves the h23/h24 midnight rollover to the locale default.

## Enforcement

Review only. There is no spell-check gate in `pnpm validate`, and no dependency
was added for one — so this rule holds exactly as well as the person reading the
diff. Treat a British spelling in a diff as a review comment, not a nit.
