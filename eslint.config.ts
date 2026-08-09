import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Add a folder here when a new vertical slice lands, so the same-feature import
// guardrail below covers it.
const FEATURES = ["about", "audio", "command-menu", "home", "inspector", "studio", "world"];

type ImportPattern = { group: string[]; message: string };

const DEEP_FEATURE_IMPORT: ImportPattern = {
  group: ["@/features/*/**"],
  message:
    "Cross-feature imports go through the feature's index.ts (@/features/world), never a deep path.",
};

const ROUTING_IS_A_LEAF: ImportPattern = {
  group: ["@/app", "@/app/**"],
  message: "app/ is the routing layer and a leaf — nothing may import from it.",
};

// Rule entries only get their tuple type from context, so anything built outside a
// defineConfig literal needs its own annotation.
const restrictedImports = (...patterns: ImportPattern[]): Linter.RuleEntry => [
  "warn",
  { patterns },
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
      // Functions carry the complexity budget, not files. Enforced at 100 with a
      // ~50-line target in .devin/rules/00-core.md; file length is capped only
      // loosely below so cohesive modules stay whole.
      "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "no-restricted-imports": restrictedImports(DEEP_FEATURE_IMPORT, ROUTING_IS_A_LEAF),
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']:not([property.name='NODE_ENV'])",
          message: "Read environment variables via src/config/env.ts, not process.env directly.",
        },
      ],
    },
  },
  {
    // React components stay tighter than the general cap — a 120-line component
    // usually is mixing rendering with state or data shaping.
    files: ["src/**/*.tsx"],
    rules: {
      "max-lines": ["error", { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Shaders, procedural geometry, canvas draw routines, layout math and static
    // data are legitimately long. Splitting them produces import graphs, not
    // boundaries — see docs/restructure-plan.md Cause 1.
    files: [
      "src/**/*-{draw,shaders,geometry,layout,textures,data}.ts",
      "src/**/{data,generated,constants}/**/*.{ts,tsx}",
    ],
    rules: {
      "max-lines": "off",
    },
  },
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": restrictedImports(
        {
          group: [`@/features/${feature}`, `@/features/${feature}/**`],
          message: `Inside features/${feature}, import relatively — never through the @/features/${feature} alias.`,
        },
        DEEP_FEATURE_IMPORT,
        ROUTING_IS_A_LEAF,
      ),
    },
  })),
  {
    files: ["src/config/env.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "max-lines": "off",
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
