import { expect, test } from "./fixtures";

test.describe("/about", () => {
  test("renders the pixelated portrait", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("img", { name: /pixelated portrait of/i })).toBeVisible();
  });
});

test.describe("/work", () => {
  test("timeline shows the three most recent engagements, newest first", async ({ page }) => {
    await page.goto("/work");
    await expect(
      page.getByRole("heading", { level: 1, name: /eleven years on the surfaces users touch/i }),
    ).toBeVisible();

    const entries = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
    await expect(entries.nth(0).getByRole("heading", { level: 3 })).toHaveText(
      /lead engineer, web applications/i,
    );
    await expect(entries.nth(0)).toContainText(/fueled/i);
    await expect(entries.nth(1).getByRole("heading", { level: 3 })).toHaveText(
      /vp of engineering/i,
    );
    await expect(entries.nth(1)).toContainText(/moment/i);
    await expect(entries.nth(2)).toContainText(/eino\.ai/i);
  });
});

test("footer trigger launches the Inspector overlay", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open the performance inspector overlay/i }).click();
  await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toBeVisible();
});
