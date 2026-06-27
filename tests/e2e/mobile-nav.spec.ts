import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe("Mobile navigation", () => {
  test("the studio map opens from the deck and routes to a destination", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /open studio map/i });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const destinations = dialog.getByRole("navigation", { name: /all studio destinations/i });
    await expect(destinations.getByRole("link", { name: /^studio$/i })).toBeVisible();
    await expect(destinations.getByRole("link", { name: /^about$/i })).toBeVisible();

    await destinations.getByRole("link", { name: /^about$/i }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(dialog).toBeHidden();
  });

  test("the inline deck waypoints are hidden on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Studio destinations", exact: true }),
    ).toBeHidden();
  });
});
