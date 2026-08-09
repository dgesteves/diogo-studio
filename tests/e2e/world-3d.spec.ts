import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, test, WCAG_TAGS } from "./fixtures";

/**
 * The path most visitors actually get. Before the project split this was never
 * exercised: the suite forced `reducedMotion: "reduce"` globally, so the canvas, the
 * boot sequence and every state that only exists alongside them went untested.
 */
test.describe("The 3D world", { tag: "@full-motion" }, () => {
  test("mounts the canvas and still keeps content in the DOM", async ({ page }) => {
    await page.goto("/work");

    await expect(page.locator("canvas").first()).toBeAttached({ timeout: 20_000 });

    // The world is decorative: it must be hidden from assistive tech, and the page
    // content must not depend on it.
    await expect(page.locator("[data-world-root]")).toHaveAttribute("aria-hidden", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /eleven years on the surfaces users touch/i }),
    ).toBeVisible();
  });

  test("has no detectable WCAG 2.2 A/AA violations with the canvas mounted", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas").first()).toBeAttached({ timeout: 20_000 });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

// A cold first visit downloads the route's JS and compiles every shader before the gate
// can appear at all, and the gate then holds until `BOOT_MAX_MS`. One budget covers both.
const COLD_BOOT_MS = 30_000;

/**
 * Wait for the state the product *guarantees*, then interact with it normally.
 *
 * `BootActions` shows "Skip intro" while the scene compiles and swaps in "Enter the
 * studio" once `canEnter` flips — which `BootSequence` promises within `BOOT_MAX_MS`
 * (12s) on any machine, however slow, via its `forceReady` timer. So the ready CTA is
 * not a race: it is reached by the clock, not by the hardware. Waiting for it means the
 * panel has finished resizing around the swap, and no element can detach mid-click.
 *
 * Two days of red CI came from doing the opposite — racing whichever control was up,
 * with `force: true` and a 1s cap, on a page whose main thread was blocked in 5s chunks.
 * The cap guaranteed the failure it was meant to prevent and the force hid that the page
 * was unusable; `WorldQualityGuard` fixes that cause. The pre-ready "Skip intro" path and
 * the boot timing itself are asserted in `boot.test.tsx` under fake timers, where they
 * are deterministic. End to end, the question is only whether a first visit is gated and
 * whether dismissing it yields a usable page.
 */
async function dismissBoot(boot: Locator): Promise<void> {
  await expect(boot).toBeVisible({ timeout: COLD_BOOT_MS });
  await boot.getByRole("button", { name: /enter the studio/i }).click({ timeout: COLD_BOOT_MS });
  await expect(boot).toHaveCount(0);
}

test.describe("Boot sequence", { tag: "@full-motion" }, () => {
  // Opt out of the fixture's session seeding — this is the one place that wants a
  // genuinely first-ever visit.
  test.use({ skipBoot: false });

  test("gates a first visit until the visitor moves past it", async ({ page }) => {
    await page.goto("/");

    // The overlay only exists after hydration flips `isClient`.
    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await dismissBoot(boot);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("canvas").first()).toBeAttached();

    // The gate's inspector preference defaults to on, so a default entry opens the
    // overlay. Asserted here rather than in the preferences test below because that one
    // turns it off — and "off" is indistinguishable from a control wired to nothing.
    // Between the two, both directions are covered for the price of one boot each.
    await expect(
      page.getByRole("region", { name: /performance inspector overlay/i }),
    ).toBeVisible();
  });

  test("does not gate again in the same session", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await dismissBoot(boot);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(boot).toHaveCount(0);
  });

  /**
   * The gate is also a preferences screen, and nothing checked that the preferences
   * survive it. All three are inverted from their defaults here, so a control that is
   * wired to nothing fails rather than passing on the default it already had.
   *
   * The progress bar and the step log are deliberately not asserted end to end. They are
   * driven by three timers, `boot.dom.test.tsx` already covers them under fake ones, and
   * chasing them here is what made this the flakiest spec in the suite — see
   * docs/decisions.md. What is left for a browser is whether the choices take effect.
   */
  test("the choices made at the gate are the studio you enter", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await expect(boot).toBeVisible({ timeout: COLD_BOOT_MS });

    // The preference controls only exist once `canEnter` flips — before that the panel
    // offers "Skip intro" and nothing else — so waiting for the CTA is also waiting for them.
    const enter = boot.getByRole("button", { name: /enter the studio/i });
    await expect(enter).toBeVisible({ timeout: COLD_BOOT_MS });

    await preference(boot, /theme preference/i, "Dark").click();
    await preference(boot, /sound preference/i, "Muted").click();

    const hidden = preference(boot, /inspector preference/i, "Hidden");
    await hidden.click();
    await expect(hidden).toHaveAttribute("aria-pressed", "true");

    await enter.click();
    await expect(boot).toHaveCount(0);

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: /play ambient studio audio/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("region", { name: /performance inspector overlay/i })).toHaveCount(
      0,
    );
  });
});

function preference(boot: Locator, group: RegExp, option: string): Locator {
  return boot.getByRole("group", { name: group }).getByRole("button", { name: option });
}
