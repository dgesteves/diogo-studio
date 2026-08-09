import { routes } from "@/constants/routes";
import { expect, settleWorld, test } from "./fixtures";

/**
 * "The world never crops. Verify ultrawide, laptop, tablet and portrait phone" —
 * `AGENTS.md`, previously verified by hand.
 *
 * Scope, stated plainly because the non-negotiable is broader than this file: whether the
 * *focused object* is visible and unoccluded is a claim about pixels, and only the visual
 * baselines can make it. `framing.test.ts` owns the camera math. What is left in between
 * is the part that actually breaks in practice and that neither of them sees — the
 * renderer sized to something other than the viewport, and a fixed overlay that stops
 * fitting on screen.
 */
const VIEWPORTS = [
  { name: "ultrawide", width: 2560, height: 1080 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "portrait phone", width: 390, height: 844 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("lays the page out with no horizontal overflow", async ({ page, canvasMounts }) => {
      await page.goto(routes.work);
      await settleWorld(page, canvasMounts);

      // A sideways scrollbar on a full-bleed layout is always a bug — an unbreakable
      // string or an over-wide content block in a destination panel is how it happens.
      // It does not see the fixed overlays, which do not extend `scrollWidth`; the deck
      // is why the next test measures a bounding box instead.
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("keeps the deck on screen and reachable", async ({ page, canvasMounts }) => {
      await page.goto(routes.work);
      await settleWorld(page, canvasMounts);

      // The deck is the only navigation at every size, so it being clipped off the edge
      // is not cosmetic — it is the site becoming unnavigable.
      const trigger = page.getByRole("button", { name: /open studio map/i });
      await expect(trigger).toBeVisible();

      const box = await trigger.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    });

    test(
      "renders the world at the viewport's own aspect",
      { tag: "@full-motion" },
      async ({ page, canvasMounts }) => {
        await page.goto(routes.work);
        await settleWorld(page, canvasMounts);

        // Responsiveness moves the camera, not the objects — but that only holds if the
        // renderer is told the right size. A drawing buffer that does not match the element
        // is exactly what "cropped" looks like, and it survives every DOM assertion.
        const canvas = await page
          .locator("canvas")
          .first()
          .evaluate((element) => {
            const node = element as HTMLCanvasElement;
            return {
              cssWidth: node.clientWidth,
              cssHeight: node.clientHeight,
              bufferWidth: node.width,
              bufferHeight: node.height,
              dpr: window.devicePixelRatio,
            };
          });

        expect(canvas.cssWidth).toBe(viewport.width);
        expect(canvas.cssHeight).toBe(viewport.height);
        expect(canvas.bufferWidth / canvas.bufferHeight).toBeCloseTo(
          canvas.cssWidth / canvas.cssHeight,
          2,
        );
      },
    );
  });
}
