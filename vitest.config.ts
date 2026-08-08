import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "stub-server-client-only",
      enforce: "pre",
      resolveId(id) {
        if (id === "server-only" || id === "client-only") {
          return "\0virtual:server-client-only";
        }
        return null;
      },
      load(id) {
        if (id === "\0virtual:server-client-only") {
          return "export {};";
        }
        return null;
      },
    },
  ],
  resolve: {
    tsconfigPaths: true,
    // Keep exactly one copy of three in the module graph. @react-three/fiber ships
    // no `exports` field, so vitest resolves its CJS `main` and that copy requires
    // three.cjs while src/ imports three.module.js. Two `Mesh` identities means
    // fiber's applyProps assigns instead of copying, and `Mesh.position` is a
    // read-only accessor — every scene render throws. Preferring `module` gives
    // fiber's ESM build, which shares src/'s three.
    mainFields: ["module", "jsnext:main", "jsnext", "main"],
    dedupe: ["three", "@react-three/fiber"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    server: {
      deps: {
        inline: ["@react-three/fiber", "@react-three/drei", "@react-three/test-renderer"],
      },
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "build", "coverage", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/__tests__/**",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
      ],
    },
  },
});
