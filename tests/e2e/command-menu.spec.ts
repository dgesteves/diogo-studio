import { expect, test, type Page } from "@playwright/test";

const modifier = process.platform === "darwin" ? "Meta" : "Control";

// The ⌘K listener is attached in a useEffect, so it does not exist until React
// has hydrated — and no DOM state distinguishes "server markup" from "hydrated"
// here. Retry the keypress until it registers rather than pressing once into a
// page that cannot yet hear it.
async function openWithShortcut(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await page.keyboard.press(`${modifier}+KeyK`);
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}

test.describe("⌘K Command Menu", () => {
  test("opens with the keyboard shortcut and navigates to /about", async ({ page }) => {
    await page.goto("/");

    const dialog = await openWithShortcut(page);

    const input = dialog.getByPlaceholder(/type a command, page, or question/i);
    await expect(input).toBeFocused();
    await input.fill("About");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/about$/);
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

    await page.getByRole("button", { name: /ask the agent about diogo/i }).press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const askTab = dialog.getByRole("tab", { name: /ask/i });
    await expect(askTab).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByLabel(/question for the agent/i)).toBeFocused();
  });

  test("Phase 4: switches to Ask mode and surfaces pre-seeded suggestions", async ({ page }) => {
    await page.goto("/");

    const dialog = await openWithShortcut(page);

    const navigateTab = dialog.getByRole("tab", { name: /navigate/i });
    const askTab = dialog.getByRole("tab", { name: /ask/i });
    await expect(navigateTab).toHaveAttribute("aria-selected", "true");
    await expect(askTab).toHaveAttribute("aria-selected", "false");

    await page.keyboard.press(`${modifier}+Digit2`);
    await expect(askTab).toHaveAttribute("aria-selected", "true");

    await expect(dialog.getByLabel(/question for the agent/i)).toBeFocused();
    await expect(dialog.getByText(/design-system thesis/i)).toBeVisible();
    await expect(dialog.getByText(/agentic ux work/i)).toBeVisible();
  });
});
