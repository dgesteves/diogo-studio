import { expect, openWithShortcut, test, MODIFIER as modifier } from "./fixtures";

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

    // Deliberately still `toBeHidden` — the menu disappearing is what the visitor
    // experiences, and asserting Radix's `data-state` instead would test the library
    // rather than the behavior. Outside reduced motion the content keeps its
    // `animate-out` exit animation, so Radix unmounts only on `animationend`; on two
    // vCPUs with the scene competing for the main thread those frames are slow to
    // arrive, which is why the wait is budgeted here rather than the assertion softened.
    // The underlying fix is the frame-loop perf item in docs/decisions.md.
    await expect(dialog).toBeHidden({ timeout: 30_000 });
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
