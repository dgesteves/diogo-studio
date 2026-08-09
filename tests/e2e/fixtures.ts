import { expect, test as base, type Page } from "@playwright/test";

export { expect };

export const MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

/** Mirrors `BOOT_SESSION_KEY` in `src/stores/boot-store.ts`. */
const BOOT_SESSION_KEY = "studio-booted";

type Options = {
  /**
   * In the `full-motion` project the canvas mounts, which puts `BootSequence`'s
   * click-gated Radix dialog in front of every page load — and `getByRole("dialog")`
   * would then match the boot overlay instead of the ⌘K menu. Seeding the session flag
   * puts the page in the returning-visitor state, which is what lets one spec assert
   * the same behavior in both projects. `world-3d.spec.ts` opts out to test boot.
   */
  skipBoot: boolean;
};

export const test = base.extend<Options>({
  skipBoot: [true, { option: true }],
  page: async ({ page, skipBoot }, use) => {
    if (skipBoot) {
      await page.addInitScript((key: string) => {
        window.sessionStorage.setItem(key, "1");
      }, BOOT_SESSION_KEY);
    }
    await use(page);
  },
});

/**
 * The ⌘K listener is attached in a `useEffect`, so it does not exist until React has
 * hydrated — and no DOM state distinguishes "server markup" from "hydrated" here.
 * Retry the keypress until it registers rather than pressing once into a page that
 * cannot yet hear it. Mounting the canvas makes hydration slower, so this matters more
 * in the `full-motion` project than it did when the whole suite ran reduced.
 */
export async function openWithShortcut(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await page.keyboard.press(`${MODIFIER}+KeyK`);
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}

/**
 * Same hydration race as `openWithShortcut`, with one difference that matters: ``Ctrl+` ``
 * *toggles*, so retrying blindly would close the overlay it just opened. Press only when
 * it is not already showing, which converges whether the miss was the listener or the
 * render.
 */
export async function openInspector(page: Page) {
  const region = page.getByRole("region", { name: /performance inspector overlay/i });
  await expect(async () => {
    if (!(await region.isVisible())) await page.keyboard.press("Control+Backquote");
    await expect(region).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return region;
}

/** WCAG 2.2 AA is the documented bar, so scan for it — `wcag22aa` adds `target-size`. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
