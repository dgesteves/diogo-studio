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
  test("timeline shows the three most recent engagements, newest first", async ({ page }) => {
    await page.goto("/work");
    await expect(
      page.getByRole("heading", { level: 1, name: /eleven years on the surfaces users touch/i }),
    ).toBeVisible();

    const entries = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
    await expect(entries.nth(0).getByRole("heading", { level: 3 })).toHaveText(
      /lead engineer, web applications/i,
    );
    await expect(entries.nth(0)).toContainText(/fueled/i);
    await expect(entries.nth(1).getByRole("heading", { level: 3 })).toHaveText(
      /vp of engineering/i,
    );
    await expect(entries.nth(1)).toContainText(/moment/i);
    await expect(entries.nth(2)).toContainText(/eino\.ai/i);
  });
});

test("footer trigger launches the Inspector overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open the performance inspector overlay/i }).click();
  await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toBeVisible();
});
