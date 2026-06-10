import { expect, test } from "@playwright/test";

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

  await expect(region.getByText("Web Vitals")).toBeVisible();
  await expect(region.getByText("Route JS")).toBeVisible();
  await expect(region.getByText("Motion mode")).toBeVisible();

  const group = region.getByRole("group", { name: /reduced-motion override/i });
  await expect(group.getByRole("button", { name: "auto" })).toHaveAttribute("aria-pressed", "true");

  await group.getByRole("button", { name: "on" }).click();
  await expect(group.getByRole("button", { name: "on" })).toHaveAttribute("aria-pressed", "true");
});
