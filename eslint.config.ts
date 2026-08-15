import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Every client domain at the root of `src/`. Phase 6 emptied `features/`, so the glob that
// used to name its slices matches nothing and is gone with it.
const DOMAINS = ["world", "site", "command-menu", "telemetry", "agent"];

type ImportPattern = { group: string[]; message: string };
type ImportPath = { name: string; importNames: string[]; message: string };

// Inside a domain, import relatively. This is what stops a flattened domain growing a barrel
// back by aliasing itself — it caught 45 self-alias imports in `world/` the day it landed.
// Phase 7 adds the other half: one group per domain applied from *outside* it, with the store
// module carved out, and the whole lot promoted from `warn` to `error`.
const sameDomainImport = (domain: string): ImportPattern => ({
  group: [`@/${domain}`, `@/${domain}/**`],
  message: `Inside ${domain}/, import relatively — never through the @/${domain} alias.`,
});

const ROUTING_IS_A_LEAF: ImportPattern = {
  group: ["@/app", "@/app/**"],
  message: "app/ is the routing layer and a leaf — nothing may import from it.",
};

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
const restrictedImports = (...patterns: ImportPattern[]): Linter.RuleEntry => [
  "warn",
  { patterns, paths: [PREFER_USER_EVENT] },
];

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
      "no-restricted-imports": restrictedImports(ROUTING_IS_A_LEAF),
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
    rules: {
      "no-restricted-imports": restrictedImports(sameDomainImport(domain), ROUTING_IS_A_LEAF),
    },
  })),
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
