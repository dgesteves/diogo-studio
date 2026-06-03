import { expect, test } from "@playwright/test";

/**
 * Inspector Overlay (S4) — the "receipts" HUD.
 *
 * Verifies the keyboard contract (Ctrl+` toggles, Escape closes), the close
 * button, and the live reduced-motion override. The Playwright context runs
 * with `prefers-reduced-motion: reduce`, so the hero canvas is paused and the
 * 3D panel falls back to its "no live scene" copy — exactly the degraded
 * state we want to confirm renders cleanly.
 */

const overlay = (name = /performance inspector overlay/i) => ({ name });

test("toggles with Ctrl+` and closes with Escape", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", overlay());

  await expect(region).toBeHidden();

  await page.keyboard.press("Control+Backquote");
  await expect(region).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(region).toBeHidden();
});

test("closes via the close button", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+Backquote");

  const region = page.getByRole("region", overlay());
  await expect(region).toBeVisible();

  await region.getByRole("button", { name: /close inspector overlay/i }).click();
  await expect(region).toBeHidden();
});

test("surfaces web-vitals, route JS, and a live motion override", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+Backquote");

  const region = page.getByRole("region", overlay());
  await expect(region).toBeVisible();

  // Panels are present.
  await expect(region.getByText("Web Vitals")).toBeVisible();
  await expect(region.getByText("Route JS")).toBeVisible();
  await expect(region.getByText("Motion mode")).toBeVisible();

  // The motion override is a 3-state segmented control; "auto" is the default.
  const group = region.getByRole("group", { name: /reduced-motion override/i });
  await expect(group.getByRole("button", { name: "auto" })).toHaveAttribute("aria-pressed", "true");

  // Flipping to "on" updates the pressed state.
  await group.getByRole("button", { name: "on" }).click();
  await expect(group.getByRole("button", { name: "on" })).toHaveAttribute("aria-pressed", "true");
});
