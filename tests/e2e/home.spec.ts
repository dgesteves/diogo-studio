import { expect, test } from "./fixtures";

/**
 * `/` is a page now. Until Phase 2b it rendered a bespoke hero inside an `sr-only` wrapper,
 * so this file asserted content no visitor could see — a spec that passes against a blank
 * landing. What it checks is what a sighted visitor gets before touching anything:
 * `content-in-dom.spec.ts` owns the crawlability claim over raw HTTP.
 */
test.describe("Home page", () => {
  test("renders the landing panel, visibly", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /engineering the systems behind ambitious products/i,
      }),
    ).toBeVisible();

    await expect(page.getByText(/this is the rig the work ships from/i)).toBeVisible();
    await expect(page.getByText(/streaming subscribers/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /see the work/i })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  test("offers the agent and states availability", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /press.*to ask/i })).toBeVisible();
    await expect(page.getByText(/open to staff\+, principal/i)).toBeVisible();
  });

  test("exposes the /api/health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
