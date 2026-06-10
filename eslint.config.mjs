import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
      "max-lines": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
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
    files: ["src/config/env.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "max-lines": "off",
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
