import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Every domain at the root of `src/`.
const DOMAINS = ["world", "site", "command-menu", "telemetry", "agent"] as const;
type Domain = (typeof DOMAINS)[number];

/**
 * Who may reach which sibling module — the "May import" rows of docs/architecture.md §3,
 * which are the authority.
 *
 * Grants are per *edge*, not per domain: a domain's store modules are what it may expose,
 * and each consumer gets the named subset it actually needs. `telemetry/` reads `world/perf`
 * and is deliberately not granted `world/store` — the overlay has no business in hover,
 * day/night or explore state, and a per-domain rule would permit that forever without ever
 * saying so. Widening a grant is one line here plus a note in decisions.md, which is the
 * right price for a new cross-domain edge. `"all"` is for `app/`, which composes domains
 * rather than living beside them.
 */
type Access = Readonly<Record<string, readonly string[] | "all">>;

const ACCESS: Record<Domain, Access> = {
  world: { "command-menu": ["store"], telemetry: ["store"] },
  site: { "command-menu": ["store"] },
  telemetry: { world: ["perf"] },
  "command-menu": {},
  agent: {},
};

type ImportPattern = { group: string[]; message: string };
type ImportPath = { name: string; importNames?: string[]; message: string };

// Inside a domain, import relatively. This is what stops a flattened domain growing a barrel
// back by aliasing itself — it caught 45 self-alias imports in `world/` the day it landed.
const sameDomainImport = (domain: string): ImportPattern => ({
  group: [`@/${domain}`, `@/${domain}/**`],
  message: `Inside ${domain}/, import relatively — never through the @/${domain} alias.`,
});

/**
 * A closed domain takes two entries, and the split is load-bearing rather than stylistic.
 * `no-restricted-imports` matches `group` with gitignore semantics, which refuse to
 * re-include a path whose parent directory is excluded — so putting the bare `@/world`
 * in the same group as `!@/world/store` silently voids every carve-out, and the group then
 * denies the very store it exists to permit. The bare specifier is an exact `paths` entry
 * instead, and the negations live in a group that only ever matches *below* the directory.
 * Both halves are held by tests/boundaries.test.ts. Do not merge them.
 */
const noBarrel = (domain: Domain): ImportPath => ({
  name: `@/${domain}`,
  message: `There are no barrel files — import the ${domain}/ module you need at its real path.`,
});

const privateFiles = (domain: Domain, reachable: readonly string[]): ImportPattern => ({
  group: [`@/${domain}/**`, ...reachable.map((module) => `!@/${domain}/${module}`)],
  message: reachable.length
    ? `${domain}/ is private except ${reachable.map((m) => `${domain}/${m}`).join(" and ")} — see docs/architecture.md §4.`
    : `${domain}/ is private whole — nothing outside it may import it. See docs/architecture.md §4.`,
});

const ROUTING_IS_A_LEAF: ImportPattern = {
  group: ["@/app", "@/app/**"],
  message: "app/ is the routing layer and a leaf — nothing may import from it.",
};

// `content/` is the root of the graph and `ui/` knows no domain, so both are closed to the
// whole of `@/` — including the root leaves, and including their own folder, which is the
// same anti-barrel protection the domains get from `sameDomainImport`.
const IMPORTS_NOTHING = (owner: string, why: string): ImportPattern => ({
  group: ["@/**"],
  message: `${owner} ${why} — import relatively within it, and nothing else from src/.`,
});

// `fireEvent` dispatches a single synthetic event, where a real interaction is a sequence
// (pointerdown → mousedown → focus → click), so it passes against UI a user could not
// operate. `user-event` is the default, through `@tests/interactions` when the handler
// writes to an external store. Events a user cannot perform — `error` on an image, a media
// or animation event — are the honest exception: take them with a one-line reason.
// Unrelated to `@react-three/test-renderer`'s `renderer.fireEvent`, which is the only way to
// reach a mesh, since R3F raycasts its events and no mesh has a DOM node.
const PREFER_USER_EVENT: ImportPath = {
  name: "@testing-library/react",
  importNames: ["fireEvent"],
  message:
    "Prefer user-event (via @tests/interactions for store writes) — fireEvent fires one event, not the sequence a real interaction produces.",
};

// Rule entries only get their tuple type from context, so anything built outside a
// defineConfig literal needs its own annotation.
const restrictedImports = (
  patterns: ImportPattern[],
  paths: ImportPath[] = [],
): Linter.RuleEntry => ["error", { patterns, paths: [PREFER_USER_EVENT, ...paths] }];

/**
 * The whole dependency contract for one scope: what it owns, and which siblings it reaches.
 * Every domain absent from `access` is closed, so the default is deny and a new top-level
 * file inherits the strictest rule rather than a gap.
 */
const boundaries = (own: Domain | null, access: Access = {}): Linter.RuleEntry => {
  const closed = DOMAINS.flatMap((domain) => {
    const reachable = access[domain];
    if (domain === own || reachable === "all") return [];
    return [{ domain, reachable: reachable ?? [] }];
  });
  return restrictedImports(
    [
      ...(own ? [sameDomainImport(own)] : []),
      ...closed.map(({ domain, reachable }) => privateFiles(domain, reachable)),
      ROUTING_IS_A_LEAF,
    ],
    closed.map(({ domain }) => noBarrel(domain)),
  );
};

// eslint-config-next's `next` entry globs every file in the repo and brings the react,
// react-hooks and jsx-a11y plugins with it — 40 enabled rules that also reach tests/ and
// scripts/, where there is no React at all. There they can only misfire: rules-of-hooks
// reads Playwright's `use` fixture callback as React's `use()` and errors, which invites
// renaming the parameter away from the documented API to appease a rule that should never
// have applied. React rules belong where React is. Derived from the shared configs rather
// than hardcoded, so a new upstream rule is covered without editing this list.
const REACT_FAMILY = ["react", "react-hooks", "jsx-a11y"];

const reactFamilyRulesOff: Linter.RulesRecord = {};

for (const rule of [...nextVitals, ...nextTs]
  .flatMap((entry) => Object.keys(entry.rules ?? {}))
  .filter((rule) => REACT_FAMILY.some((plugin) => rule.startsWith(`${plugin}/`)))) {
  reactFamilyRulesOff[rule] = "off";
}

const NO_REACT_OUTSIDE_SRC = {
  name: "no-react-outside-src",
  files: ["tests/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"],
  rules: reactFamilyRulesOff,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  NO_REACT_OUTSIDE_SRC,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
      // Functions carry the complexity budget; files carry none. There is no
      // max-lines rule anywhere in this config — a cap below what a cohesive
      // module needs is what shredded this codebase once already. Cohesion
      // decides file boundaries; see .claude/rules/project-structure.md.
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // The deny-all default. It is what binds the root leaves — env, store,
      // reduced-motion, use-is-client, chat-contract — and it means a new file at the
      // root of src/ starts closed rather than in a gap. Every scope below widens it.
      "no-restricted-imports": boundaries(null),
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']:not([property.name='NODE_ENV'])",
          message: "Read environment variables via src/env.ts, not process.env directly.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      // eslint-config-next enables only six jsx-a11y rules, none of which cover
      // keyboard operability or label association. These ten were measured against
      // src/ before being turned on and reported zero violations, so they are a
      // floor that costs nothing — axe and keyboard testing remain the real gate.
      // If one ever false-positives (a canvas overlay is the likely candidate),
      // turn that rule off here with a reason rather than disabling it inline.
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/control-has-associated-label": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-static-element-interactions": "error",
    },
  },
  ...DOMAINS.map((domain) => ({
    files: [`src/${domain}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": boundaries(domain, ACCESS[domain]) },
  })),
  {
    // app/ resolves, sets metadata and composes; it is the one place that reaches into a
    // domain rather than at its store. It still may not see agent/ — the wire format is the
    // boundary, which is why chat-contract.ts is a root leaf.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": boundaries(null, {
        world: "all",
        site: "all",
        "command-menu": "all",
        telemetry: "all",
      }),
    },
  },
  {
    // …and the API half is the mirror image: agent/, chat-contract and env, no client domain.
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": boundaries(null, { agent: "all" }) },
  },
  {
    files: ["src/content/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports([
        IMPORTS_NOTHING("content/", "is the authored record and the root of the graph"),
      ]),
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports([
        IMPORTS_NOTHING(
          "ui/",
          "holds primitives with zero domain knowledge (if it needs to know what a Page is, it is not a primitive)",
        ),
      ]),
    },
  },
  {
    files: ["src/env.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "playwright/.cache/**",
    ".velite/**",
    "public/static/**",
  ]),
]);

export default eslintConfig;
