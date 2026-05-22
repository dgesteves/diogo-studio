import { expect, test } from "@playwright/test";

// Override the default desktop viewport for this entire file. The desktop nav
// is hidden < md, so the hamburger only renders on small viewports. We use a
// plain viewport override instead of `devices["iPhone 14"]` so the suite stays
// on chromium and doesn't require WebKit (matches the one project we ship in
// `playwright.config.ts`).
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe("Mobile navigation", () => {
  test("hamburger opens a drawer with primary routes", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /open menu/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // All primary routes are present in the drawer.
    await expect(dialog.getByRole("link", { name: /^home$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^work$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^writing$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^about$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^contact$/i })).toBeVisible();
  });

  test("desktop primary nav is hidden on mobile", async ({ page }) => {
    await page.goto("/");
    // The desktop <nav aria-label="Primary"> is hidden under md.
    await expect(page.getByRole("navigation", { name: /^primary$/i })).toBeHidden();
  });
});
