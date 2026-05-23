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

  test("Phase 4: the hero CTA opens the menu directly in Ask mode", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /ask the agent about diogo/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const askTab = dialog.getByRole("tab", { name: /ask/i });
    await expect(askTab).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByLabel(/question for the agent/i)).toBeFocused();
  });

  test("Phase 4: switches to Ask mode and surfaces pre-seeded suggestions", async ({ page }) => {
    await page.goto("/");

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Default is Navigate; the footer exposes both as tabs.
    const navigateTab = dialog.getByRole("tab", { name: /navigate/i });
    const askTab = dialog.getByRole("tab", { name: /ask/i });
    await expect(navigateTab).toHaveAttribute("aria-selected", "true");
    await expect(askTab).toHaveAttribute("aria-selected", "false");

    // ⌘2 switches to Ask mode (the shortcut hint is in the footer).
    await page.keyboard.press(`${modifier}+Digit2`);
    await expect(askTab).toHaveAttribute("aria-selected", "true");

    // Ask input takes focus and the pre-seeded suggestions render.
    await expect(dialog.getByLabel(/question for the agent/i)).toBeFocused();
    await expect(dialog.getByText(/design-system thesis/i)).toBeVisible();
    await expect(dialog.getByText(/agentic ux work/i)).toBeVisible();
  });
});
