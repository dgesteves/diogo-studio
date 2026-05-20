import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("renders heading and primary CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /to get started, edit the page\.tsx file\./i }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /deploy now/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /documentation/i })).toBeVisible();
  });

  test("exposes the /api/health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
