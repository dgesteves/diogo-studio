import AxeBuilder from "@axe-core/playwright";
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

test.describe("Boot sequence", { tag: "@full-motion" }, () => {
  // Opt out of the fixture's session seeding — this is the one place that wants a
  // genuinely first-ever visit.
  test.use({ skipBoot: false });

  test("gates a first visit, then lets the visitor in", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    // The overlay only exists after hydration flips `isClient`.
    await expect(boot).toBeVisible({ timeout: 15_000 });

    // canEnter is `(ready || forceReady) && minElapsed`, and forceReady only fires at
    // BOOT_MAX_MS (12s), so allow for the slow path on a software renderer.
    const enter = boot.getByRole("button", { name: /enter the studio/i });
    await expect(enter).toBeVisible({ timeout: 20_000 });
    await enter.click();

    // Not `toBeHidden`: the overlay animates to opacity-0 first, which Playwright still
    // counts as visible, and only unmounts BOOT_EXIT_MS later.
    await expect(boot).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("does not gate again in the same session", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    const dismiss = boot.getByRole("button", { name: /skip intro|enter the studio/i });
    await expect(dismiss).toBeVisible({ timeout: 20_000 });
    await dismiss.click();
    await expect(boot).toHaveCount(0, { timeout: 10_000 });

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(boot).toHaveCount(0);
  });
});
