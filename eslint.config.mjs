import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Add a folder here when a new vertical slice lands, so the same-feature import
// guardrail below covers it.
const FEATURES = ["about", "audio", "command-menu", "home", "inspector", "studio", "world"];

const DEEP_FEATURE_IMPORT = {
  group: ["@/features/*/**"],
  message:
    "Cross-feature imports go through the feature's index.ts (@/features/world), never a deep path.",
};

const ROUTING_IS_A_LEAF = {
  group: ["@/app", "@/app/**"],
  message: "app/ is the routing layer and a leaf — nothing may import from it.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
      "no-restricted-imports": ["warn", { patterns: [DEEP_FEATURE_IMPORT, ROUTING_IS_A_LEAF] }],
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
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [`@/features/${feature}`, `@/features/${feature}/**`],
              message: `Inside features/${feature}, import relatively — never through the @/features/${feature} alias.`,
            },
            DEEP_FEATURE_IMPORT,
            ROUTING_IS_A_LEAF,
          ],
        },
      ],
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
