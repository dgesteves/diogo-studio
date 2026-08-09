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

/**
 * `BootActions` shows "Skip intro" until the scene finishes compiling and "Enter the
 * studio" after, so which control is on screen depends on the machine. That timing —
 * the minimum hold, the 12s forceReady fallback, the ready label, session-once — is
 * asserted deterministically in `boot.test.tsx` with fake timers. Matching either
 * control here is therefore layering, not hedging: end-to-end the only question left is
 * whether a real first visit is gated and whether dismissing it yields a usable page.
 */
const DISMISS_BOOT = /skip intro|enter the studio/i;

// A cold first visit compiles every shader before the overlay can settle, and CI runs on
// two vCPUs with a software renderer. See docs/decisions.md for the perf work item that
// should bring this back down.
const COLD_BOOT_MS = 30_000;

const DISMISS_ATTEMPT_MS = 1_000;

/**
 * Dismissing the gate is a click Playwright will not make on its own terms. The splash
 * animates by design — the panel rises, the log fills, the progress bar and its sheen run
 * continuously — so the dismiss control never satisfies the *stability* half of
 * actionability: measured locally, a 30s retry loop of plain clicks never landed one.
 * That is what turned `main` red, and a slow runner only makes it more certain, because
 * the moment the scene reports ready `BootActions` swaps "Skip intro" for "Enter the
 * studio" and the element Playwright was waiting on detaches.
 *
 * So assert the facts a visitor depends on — the gate is up, the control is visible and
 * enabled — then dispatch the click without the stability wait, and retry the *action*
 * until the gate is gone (the readiness idiom `docs/decisions.md` sanctions). Clicking
 * twice is harmless: `BootSequence.enter` ignores re-entry while the overlay is exiting.
 */
async function dismissBoot(boot: Locator): Promise<void> {
  await expect(boot).toBeVisible({ timeout: COLD_BOOT_MS });
  await expect(boot.getByRole("button", { name: DISMISS_BOOT })).toBeEnabled();

  await expect(async () => {
    const dismiss = boot.getByRole("button", { name: DISMISS_BOOT });
    if (await dismiss.count()) await dismiss.click({ force: true, timeout: DISMISS_ATTEMPT_MS });
    await expect(boot).toHaveCount(0, { timeout: DISMISS_ATTEMPT_MS });
  }).toPass({ timeout: COLD_BOOT_MS });
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
  });

  test("does not gate again in the same session", async ({ page }) => {
    await page.goto("/");

    const boot = page.getByRole("dialog", { name: /entering .*studio/i });
    await dismissBoot(boot);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(boot).toHaveCount(0);
  });
});
