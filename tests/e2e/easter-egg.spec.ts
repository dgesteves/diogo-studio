import { expect, test } from "@playwright/test";

test("typing 'diogo' reveals a greeting and then dismisses it", async ({ page }) => {
  await page.goto("/");

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.type("diogo");

  const greeting = page.getByText(/Hi, I.?m Diogo/i);
  await expect(greeting).toBeVisible();

  await expect(greeting).toBeHidden({ timeout: 4000 });
});

test("typing 'diogo' inside a text field does NOT trigger the egg", async ({ page }) => {
  await page.goto("/");

  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+KeyK`);

  const input = page.getByPlaceholder(/type a command, page, or question/i);
  await expect(input).toBeFocused();
  await page.keyboard.type("diogo");

  await expect(page.getByText(/Hi, I.?m Diogo/i)).toHaveCount(0);
  await expect(input).toHaveValue("diogo");
});
