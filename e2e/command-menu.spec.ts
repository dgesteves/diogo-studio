import { expect, test } from "@playwright/test";

test.describe("⌘K Command Menu", () => {
  test("opens with the keyboard shortcut and navigates to /work", async ({ page }) => {
    await page.goto("/");

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const input = dialog.getByPlaceholder(/type a command, page, or question/i);
    await expect(input).toBeFocused();
    await input.fill("Work");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work$/);
  });

  test("opens via the nav trigger and dismisses with Escape", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /open command menu/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
