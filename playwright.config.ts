import { defineConfig, devices } from "@playwright/test";
import type { Options } from "./tests/e2e/fixtures";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig<Options>({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Not `undefined` locally: the full-motion project software-renders a three.js scene
  // per test, and at the default (cpus/2) five concurrent SwiftShader contexts starve
  // each other badly enough to close browser sessions. Measured: 10 of 22 full-motion
  // tests failed at 5 workers, 1 at 1 worker, 0 at 2 with the budgets below.
  //
  // CI stays at 1 for a different reason, so raising it to match the local 2 does not
  // work: a Free runner has 2 vCPU total, shared by Chromium *and* the one `pnpm start`
  // server. At `--workers=2` in `scripts/ci-local.sh` the server was starved and
  // `mobile-nav` sat on `main "Loading"` — its route's Suspense fallback — for the whole
  // 15s budget, with 3 of 26 tests needing a retry. Sharding across runners does not help
  // either: `--shard=n/2` splits on the project boundary, so one shard takes all 22
  // full-motion tests and wall time is unchanged. See `docs/decisions.md`.
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Reduced motion is a real code path, not a preference: world-stage.tsx does not
  // mount the canvas when it is set, so the two projects exercise genuinely different
  // products. Every spec runs in both unless it is tagged for one, because a bug that
  // only appears with the canvas mounted is exactly the bug this suite exists to catch.
  // The suite previously set `reducedMotion: "reduce"` globally, so the 3D path — what
  // most visitors get — had never been tested at all.
  projects: [
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "reduce" },
        canvasMounts: false,
      },
      grepInvert: /@full-motion/,
    },
    {
      name: "full-motion",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "no-preference" },
        // Declared rather than inferred from the project name, so an untagged spec can
        // wait for the world where it exists and skip the wait where it never will.
        // Without that, a DOM snapshot taken before hydration is just a second copy of
        // the reduced-motion run — the same trap the project split was added to close.
        canvasMounts: true,
      },
      grepInvert: /@reduced-motion/,
      // A continuously rendering scene on a software renderer competes with the
      // assertion loop for CPU: the same `/about` portrait check settles in 395ms with
      // no canvas and took 9.3s with one, so the 5s default was the actual cause of
      // the flake here — not the product. Raise the budget instead of adding sleeps.
      expect: { timeout: 15_000 },
      timeout: 90_000,
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
