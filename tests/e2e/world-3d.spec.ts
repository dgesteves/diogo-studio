import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, test, WCAG_TAGS } from "./fixtures";

/**
 * The path most visitors actually get. Before the project split this was never
 * exercised: the suite forced `reducedMotion: "reduce"` globally, so the canvas, the
 * boot sequence and every state that only exists alongside them went untested.
 */
test.describe("The 3D world", { tag: "@full-motion" }, () => {
  test("mounts the canvas and still keeps content in the DOM", async ({ page }) => {
    await page.goto("/work");

    await expect(page.locator("canvas").first()).toBeAttached({ timeout: 20_000 });

    // The world is decorative: it must be hidden from assistive tech, and the page
    // content must not depend on it.
    await expect(page.locator("[data-world-root]")).toHaveAttribute("aria-hidden", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /eleven years on the surfaces users touch/i }),
    ).toBeVisible();
  });

  test("has no detectable WCAG 2.2 A/AA violations with the canvas mounted", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas").first()).toBeAttached({ timeout: 20_000 });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

// A cold first visit downloads the route's JS and compiles every shader before the gate
// can appear at all, and the gate then holds until `BOOT_MAX_MS`. One budget covers both.
const COLD_BOOT_MS = 30_000;

/**
 * Wait for the state the product *guarantees*, then interact with it normally.
 *
 * `BootActions` shows "Skip intro" while the scene compiles and swaps in "Enter the
 * studio" once `canEnter` flips — which `BootSequence` promises within `BOOT_MAX_MS`
 * (12s) on any machine, however slow, via its `forceReady` timer. So the ready CTA is
 * not a race: it is reached by the clock, not by the hardware. Waiting for it means the
 * panel has finished resizing around the swap, and no element can detach mid-click.
 *
 * Two days of red CI came from doing the opposite — racing whichever control was up,
 * with `force: true` and a 1s cap, on a page whose main thread was blocked in 5s chunks.
 * The cap guaranteed the failure it was meant to prevent and the force hid that the page
 * was unusable; `WorldQualityGuard` fixes that cause. The pre-ready "Skip intro" path and
 * the boot timing itself are asserted in `boot.test.tsx` under fake timers, where they
 * are deterministic. End to end, the question is only whether a first visit is gated and
 * whether dismissing it yields a usable page.
 */
async function dismissBoot(boot: Locator): Promise<void> {
  await expect(boot).toBeVisible({ timeout: COLD_BOOT_MS });
  await boot.getByRole("button", { name: /enter the studio/i }).click({ timeout: COLD_BOOT_MS });
  await expect(boot).toHaveCount(0);
}

test.describe("Boot sequence", { tag: "@full-motion" }, () => {
  // Opt out of the fixture's session seeding — this is the one place that wants a
  // genuinely first-ever visit.
  test.use({ skipBoot: false });

  test("gates a first visit until the visitor moves past it", async ({ page }) => {
    await page.goto("/");

    // The overlay only exists after hydration flips `isClient`.
    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await dismissBoot(boot);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("canvas").first()).toBeAttached();
  });

  test("does not gate again in the same session", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await dismissBoot(boot);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(boot).toHaveCount(0);
  });
});
