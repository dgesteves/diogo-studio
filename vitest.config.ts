import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

const VIRTUAL_ID = "\0virtual:server-client-only";

function stubServerClientOnly(): Plugin {
  return {
    name: "stub-server-client-only",
    enforce: "pre",
    resolveId(id) {
      return id === "server-only" || id === "client-only" ? VIRTUAL_ID : null;
    },
    load(id) {
      return id === VIRTUAL_ID ? "export {};" : null;
    },
  };
}

const plugins = [react(), stubServerClientOnly()];

const resolve = {
  tsconfigPaths: true,
  // Keep exactly one copy of three in the module graph. @react-three/fiber ships
  // no `exports` field, so vitest resolves its CJS `main` and that copy requires
  // three.cjs while src/ imports three.module.js. Two `Mesh` identities means
  // fiber's applyProps assigns instead of copying, and `Mesh.position` is a
  // read-only accessor — every scene render throws. Preferring `module` gives
  // fiber's ESM build, which shares src/'s three.
  mainFields: ["module", "jsnext:main", "jsnext", "main"],
  dedupe: ["three", "@react-three/fiber"],
};

const exclude = ["node_modules", ".next", "out", "build", "coverage", "tests/e2e/**"];

// jsdom is opt-in by filename, and node is the default, so that forgetting the marker
// fails loudly (`document is not defined`) instead of quietly running a route handler
// against a DOM it will never have in production.
const DOM_SPECS = ["src/**/*.dom.{test,spec}.{ts,tsx}", "tests/**/*.dom.{test,spec}.{ts,tsx}"];
const ALL_SPECS = ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"];

export default defineConfig({
  test: {
    projects: [
      {
        plugins,
        resolve,
        test: {
          name: "node",
          environment: "node",
          globals: true,
          include: ALL_SPECS,
          exclude: [...exclude, ...DOM_SPECS],
        },
      },
      {
        plugins,
        resolve,
        test: {
          name: "jsdom",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          css: true,
          server: {
            deps: {
              inline: ["@react-three/fiber", "@react-three/drei", "@react-three/test-renderer"],
            },
          },
          // A spec's own afterEach must run before the global one, so anything it mounted
          // is unmounted before vitest.setup.ts resets the stores it subscribes to.
          sequence: { hooks: "stack" },
          include: DOM_SPECS,
          exclude,
        },
      },
    ],
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
