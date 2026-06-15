import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("/about", () => {
  test("renders the pixelated portrait", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("img", { name: /pixelated portrait of/i })).toBeVisible();
  });

  test("has no detectable WCAG 2.1 A/AA violations", async ({ page }) => {
    await page.goto("/about");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test("footer trigger launches the Inspector overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open the performance inspector overlay/i }).click();
  await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toBeVisible();
});
