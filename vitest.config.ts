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
              // Every package that calls a fiber hook has to be inlined alongside fiber
              // itself, or it resolves fiber's CJS build and its `useThree` looks for the
              // root in a second React context: "Hooks can only be used within the Canvas
              // component!" from inside a component that plainly is.
              inline: [
                "@react-three/fiber",
                "@react-three/drei",
                "@react-three/postprocessing",
                "@react-three/test-renderer",
              ],
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
      /**
       * Two entries only, and both are "there is no executable code here" rather than "this is
       * hard to test". Every other candidate was tried and turned out to be reachable: the 17
       * route pages render in `pages.test.tsx`, satori rasterizes real PNGs in `icons.test.tsx`,
       * the error boundaries and the 404 render in `chrome.dom.test.tsx`, and `root-metadata.ts`
       * is plain data. Type-only modules need no entry at all — they compile to nothing, so v8
       * never sees them.
       *
       * Before adding one, prove the file cannot be asserted rather than that it is
       * inconvenient, and check whether what cannot run headlessly is the file or a dependency
       * of it: stubbing the dependency is how `world-postprocessing.tsx` stayed measured.
       */
      exclude: ["src/**/*.d.ts", "src/**/*.{test,spec}.{ts,tsx}"],

      /**
       * A ratchet, set from a measured run rather than from an aspiration: 98.96 / 93.81 /
       * 98.82 / 99.73 on 2026-08-11, over the whole of `src/` bar type declarations and the
       * specs themselves. Floored to whole numbers so a rounding difference is not a build
       * failure, and raised only after re-measuring.
       *
       * **Deliberately global rather than per-directory.** Per-layer thresholds were the
       * original plan and are the wrong instrument *right now*: `docs/refactor.md`
       * moves or merges nearly every directory in `src/`, and a threshold keyed on a path that
       * is about to change either breaks the build during a pure move or silently stops
       * applying. The two rows below are the exceptions because their locations are fixed by
       * what they are — the HTTP surface and the abuse limiter — and they are the highest-risk
       * files in the repo.
       *
       * Branches sit five points under statements because a handful of `noUncheckedIndexedAccess`
       * guards and `?? fallback`s cannot be reached without testing TypeScript instead of the
       * product. Read the branch column first when raising these: statements can be bought by
       * mounting things, conditions cannot.
       */
      thresholds: {
        statements: 98,
        branches: 93,
        functions: 98,
        lines: 99,
        "src/app/api/**": { statements: 100, functions: 100, lines: 100, branches: 93 },
        "src/rate-limit.ts": { statements: 100, functions: 100, lines: 100, branches: 100 },
      },
    },
  },
});
