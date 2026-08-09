import AxeBuilder from "@axe-core/playwright";
import { expect, test, WCAG_TAGS } from "./fixtures";

/**
 * The reduced-motion non-negotiable, asserted rather than assumed. Until the
 * `reduced-motion` / `full-motion` projects existed the whole suite ran with
 * `reducedMotion: "reduce"`, so this path was covered everywhere and nowhere: no spec
 * checked that the canvas is actually absent or that the site works without it.
 */
test.describe("Reduced motion", { tag: "@reduced-motion" }, () => {
  test("never mounts the 3D canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // world-stage.tsx gates the canvas on `isClient && !reducedMotion`, so give
    // hydration a chance to mount it before asserting that it did not.
    await expect(page.locator("canvas")).toHaveCount(0);

    // The other half of the pair `world-3d.spec.ts` asserts holds a real tier. Together
    // they make the attribute meaningful rather than decorative: "off" only where there
    // is no canvas, and never "off" where there is one.
    await expect(page.locator("[data-world-root]")).toHaveAttribute("data-world-quality", "off");
  });

  test("the site is fully navigable with no 3D", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /open command menu/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder(/type a command, page, or question/i).fill("About");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("station content is still server-rendered without any 3D interaction", async ({ page }) => {
    // The crawlability non-negotiable: reveal-on-focus is a visual affordance, so the
    // prose must be in the DOM on a cold load with the canvas absent entirely.
    const response = await page.goto("/work");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1, name: /eleven years on the surfaces users touch/i }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: /fueled/i })
        .first(),
    ).toBeVisible();
  });

  test("has no detectable WCAG 2.2 A/AA violations without 3D", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
