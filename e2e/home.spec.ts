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

    await expect(page.getByRole("link", { name: /browse case studies/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /press.*to ask/i })).toBeVisible();
    await expect(page.getByText(/available\s*[—-]\s*staff\+\s*\/\s*principal/i)).toBeVisible();
  });

  test("operating-altitudes section shows the three most recent engagements", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 2, name: /equally comfortable/i }),
    ).toBeVisible();
    await expect(page.getByText(/fueled · current/i)).toBeVisible();
    await expect(page.getByText(/moment · 2025/i)).toBeVisible();
    await expect(page.getByText(/eino\.ai · 2023[\u2013-]2025/i)).toBeVisible();
  });

  test("exposes the /api/health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
