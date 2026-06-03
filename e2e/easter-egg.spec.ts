import { expect, test } from "@playwright/test";

/**
 * Easter egg — typing `diogo` anywhere outside a text field fires a one-shot
 * greeting. Under `prefers-reduced-motion: reduce` (the Playwright context
 * default) the animated burst is replaced by a static greeting pill, which is
 * what we assert here. It auto-dismisses, so we also confirm it disappears.
 */

test("typing 'diogo' reveals a greeting and then dismisses it", async ({ page }) => {
  await page.goto("/");

  // Ensure focus is on the document body, not an interactive element.
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.type("diogo");

  const greeting = page.getByText(/Hi, I.?m Diogo/i);
  await expect(greeting).toBeVisible();

  // One-shot: it removes itself after a beat.
  await expect(greeting).toBeHidden({ timeout: 4000 });
});

test("typing 'diogo' inside a text field does NOT trigger the egg", async ({ page }) => {
  await page.goto("/contact");

  const nameField = page.getByLabel(/name/i).first();
  await nameField.click();
  await page.keyboard.type("diogo");

  await expect(page.getByText(/Hi, I.?m Diogo/i)).toHaveCount(0);
  await expect(nameField).toHaveValue("diogo");
});
