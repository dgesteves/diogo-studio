import AxeBuilder from "@axe-core/playwright";
import { expect, openWithShortcut, test, WCAG_TAGS } from "./fixtures";

test.describe("Accessibility", () => {
  test("home page has no detectable WCAG 2.2 A/AA violations", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test("home page in dark mode has no detectable WCAG 2.2 A/AA violations", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test("command menu has no detectable WCAG 2.2 A/AA violations when open", async ({ page }) => {
    await page.goto("/");
    await openWithShortcut(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});
