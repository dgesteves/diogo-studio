import { expect, test } from "@playwright/test";

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

    await expect(dialog.getByRole("link", { name: /^home$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^work$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^writing$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^about$/i })).toBeVisible();
    await expect(dialog.getByRole("link", { name: /^contact$/i })).toBeVisible();
  });

  test("desktop primary nav is hidden on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: /^primary$/i })).toBeHidden();
  });
});
