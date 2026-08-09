import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { routes, type RoutePath } from "@/constants/routes";
import { expect, openWithShortcut, settleWorld, test, WCAG_TAGS } from "./fixtures";

/**
 * Accessibility is a hard gate in `AGENTS.md`, so it is scanned per route rather than
 * per sample: a content block introduced on one station is a page nobody scanned before.
 *
 * Untagged, so all 17 run in both projects. That is deliberate rather than thorough by
 * default — with the canvas up the page has a different focus order, a different
 * contrast backdrop and an `aria-hidden` subtree full of nothing, and `aria-hidden-focus`
 * and `target-size` are exactly the rules that catch a regression there. `settleWorld`
 * is what makes the second run mean something.
 */
const ROUTE_PATHS: readonly RoutePath[] = Object.values(routes);

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

test.describe("Accessibility", () => {
  for (const path of ROUTE_PATHS) {
    test(`${path} has no detectable WCAG 2.2 A/AA violations`, async ({ page, canvasMounts }) => {
      await page.goto(path);
      await settleWorld(page, canvasMounts);

      await scan(page);
    });
  }

  test("the home page is clean in dark mode too", async ({ page, canvasMounts }) => {
    // Contrast is the one rule that depends on the palette, and the world swaps its own
    // day/night palette alongside the theme, so this is not a duplicate scan.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(routes.home);
    await settleWorld(page, canvasMounts);

    await scan(page);
  });

  test("the command menu is clean while open", async ({ page }) => {
    await page.goto(routes.home);
    await openWithShortcut(page);

    await scan(page);
  });
});

/**
 * The keyboard requirements axe cannot see: it scans markup, not what focus does. Both
 * are WCAG AA, and the second one was broken until the commit that added it.
 */
test.describe("Keyboard operation", () => {
  test("focus is visible on the element the keyboard moved to", async ({ page }) => {
    await page.goto(routes.work);

    // Focus is seeded on a known control and then moved with Tab, rather than tabbing in
    // from the top, for two reasons: `:focus-visible` only applies when the browser
    // attributes the focus change to the keyboard, and in `pnpm dev` the first stop is
    // Next's own devtools button, which does not exist in the production build CI runs.
    // A station page has no links at all outside the map and ⌘K, so the deck is the seam.
    await page.getByRole("button", { name: /open studio map/i }).focus();
    await page.keyboard.press("Tab");

    const focused = page.locator(":focus-visible");
    await expect(focused).toHaveCount(1);

    // The project styles focus with Tailwind's ring utilities, which compile to a
    // box-shadow, so either channel counts — what must never happen is neither.
    const indicator = await focused.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outline: style.outlineStyle, shadow: style.boxShadow };
    });
    expect(
      indicator.outline !== "none" || indicator.shadow !== "none",
      `focused element has no visible indicator: ${JSON.stringify(indicator)}`,
    ).toBe(true);
  });

  // Both entry points, because the fix lives in the store precisely so that every one of
  // them behaves the same — testing one would not show that.
  for (const trigger of [/open command menu/i, /ask the agent about diogo/i]) {
    test(`dismissing the menu opened from ${trigger.source} returns focus to it`, async ({
      page,
    }) => {
      await page.goto(routes.home);

      const opener = page.getByRole("button", { name: trigger });
      // Activated by keyboard, not clicked: on macOS a click does not focus a button at
      // all, so a mouse-driven version of this test would have nothing to restore and
      // would pass against the broken code.
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.keyboard.press("Escape");

      // WCAG 2.4.3: dropping focus at the top of the document after a dialog closes
      // strands a keyboard visitor, who then has to tab back through everything. Radix
      // restores focus inside a `setTimeout(0)` after unmount, and outside reduced motion
      // the exit animation gates that unmount — hence the budget, the same one
      // `command-menu.spec.ts` explains for its `toBeHidden`.
      await expect(opener).toBeFocused({ timeout: 30_000 });
    });
  }
});
