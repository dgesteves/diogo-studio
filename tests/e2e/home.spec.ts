import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the senior-grade hero with primary CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /engineering the systems behind ambitious products/i,
      }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /press.*to ask/i })).toBeVisible();
    await expect(page.getByText(/available\s*[—-]\s*staff\+\s*\/\s*principal/i)).toBeVisible();
  });

  test("exposes the /api/health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
