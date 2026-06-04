import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { path: "/about", heading: /engineering systems behind ambitious products/i },
  { path: "/colophon", heading: /how this site is built/i },
  { path: "/uses", heading: /tools, hardware, editor/i },
  { path: "/contact", heading: /.+/ },
] as const;

for (const route of routes) {
  test.describe(`${route.path}`, () => {
    test("renders a level-1 heading", async ({ page }) => {
      await page.goto(route.path);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(route.heading);
    });

    test("has no detectable WCAG 2.1 A/AA violations", async ({ page }) => {
      await page.goto(route.path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test("/colophon launches the Inspector overlay", async ({ page }) => {
  await page.goto("/colophon");
  await page.getByRole("button", { name: /open the inspector/i }).click();
  await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toBeVisible();
});
