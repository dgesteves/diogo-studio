import { routes } from "@/constants/routes";
import { stationIndex, stationSectors } from "@/features/world/constants/station-index";
import { expect, settleWorld, test } from "./fixtures";

/**
 * The navigation half of the world — the part `AGENTS.md` calls non-negotiable: "3D
 * objects can't be the only navigation: keyboard-reachable index". That index is the
 * studio map, and it is plain DOM, so most of this is deliberately **untagged** rather
 * than `@full-motion` as the testing plan first sketched. A visitor in reduced motion
 * has nothing but this dialog and ⌘K to get around with, which makes it more important
 * there, not less.
 *
 * Clicking a sign inside the canvas is not asserted here and should not be. Picking a
 * mesh by screen coordinate on a software renderer is a coin flip, and the same
 * navigation is reachable through the map — so the RTTR specs own "the hotspot is where it
 * should be", and this owns "a visitor can get anywhere".
 */
test.describe("Studio map", () => {
  test("lists every destination under its sector", async ({ page }) => {
    await page.goto(routes.home);

    await page.getByRole("button", { name: /open studio map/i }).click();
    const dialog = page.getByRole("dialog", { name: /navigate the studio/i });
    await expect(dialog).toBeVisible();

    const index = dialog.getByRole("navigation", { name: /all studio destinations/i });
    await expect(index.getByRole("link")).toHaveCount(stationIndex.length);

    // Driven off `station-index.ts`, so a station added to a sector is covered without
    // touching this spec — and a station dropped from every sector fails it.
    for (const sector of stationSectors) {
      await expect(dialog.getByRole("heading", { name: sector.label })).toBeVisible();
      for (const station of sector.stations) {
        await expect(index.getByRole("link", { name: station.label })).toBeVisible();
      }
    }
  });

  test("marks the station you are on as the current page", async ({ page }) => {
    await page.goto(routes.work);

    await page.getByRole("button", { name: /open studio map/i }).click();
    const index = page.getByRole("navigation", { name: /all studio destinations/i });

    // Exactly one, and the right one: `aria-current` is how a screen-reader user knows
    // where they are in a list of 17 near-identical links.
    const current = index.getByRole("link").and(page.locator('[aria-current="page"]'));
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(/work/i);
  });

  test("navigating from the map lands on the station and dismisses itself", async ({ page }) => {
    await page.goto(routes.home);

    await page.getByRole("button", { name: /open studio map/i }).click();
    const dialog = page.getByRole("dialog", { name: /navigate the studio/i });
    const index = dialog.getByRole("navigation", { name: /all studio destinations/i });

    await index.getByRole("link", { name: "Résumé" }).click();

    await expect(page).toHaveURL(new RegExp(`${routes.resume}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test("the deck names the station a deep link opened", async ({ page, canvasMounts }) => {
    // `resolveStation` derives the active station from the pathname, so this is the
    // assertion that a deep link — someone arriving from a search result, not from the
    // world — still puts the studio in the right place.
    await page.goto(routes.stack);
    await settleWorld(page, canvasMounts);

    const trigger = page.getByRole("button", {
      name: new RegExp(`open studio map — ${stationIndex.length} destinations`, "i"),
    });
    await expect(trigger).toContainText("Stack");
  });
});

test.describe("Explore mode", { tag: "@full-motion" }, () => {
  test("turns on from the deck, announces its controls, and exits with Escape", async ({
    page,
    canvasMounts,
  }) => {
    await page.goto(routes.home);

    // Genuinely canvas-only, twice over: `DeckExploreToggle` renders `null` under reduced
    // motion, and the Escape binding lives in `use-explore-input`, which only
    // `world-canvas.tsx` mounts. So there is nothing here to assert in the other project.
    await settleWorld(page, canvasMounts);

    const enter = page.getByRole("button", { name: /explore the studio/i });
    await expect(enter).toHaveAttribute("aria-pressed", "false");

    await enter.click();

    const exit = page.getByRole("button", { name: /exit explore mode/i });
    await expect(exit).toHaveAttribute("aria-pressed", "true");

    // The visible chrome is `aria-hidden`, so the announcement is the only thing a
    // screen-reader user gets — and it has to say which keys move you.
    await expect(page.getByRole("status").filter({ hasText: /explore mode on/i })).toContainText(
      /move with w, a, s, d/i,
    );

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /explore the studio/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
