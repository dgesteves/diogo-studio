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

test.describe("/work", () => {
  test("operating-altitudes section shows the three most recent engagements", async ({ page }) => {
    await page.goto("/work");
    await expect(
      page.getByRole("heading", { level: 2, name: /equally comfortable/i }),
    ).toBeVisible();
    await expect(page.getByText(/fueled · current/i)).toBeVisible();
    await expect(page.getByText(/moment · 2025/i)).toBeVisible();
    await expect(page.getByText(/eino\.ai · 2023[\u2013-]2025/i)).toBeVisible();
  });
});

test("footer trigger launches the Inspector overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open the performance inspector overlay/i }).click();
  await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toBeVisible();
});
