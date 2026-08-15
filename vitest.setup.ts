import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { stubMatchMedia } from "@tests/media";
import { resetStores } from "@tests/stores";

// jsdom does not implement matchMedia, and `stores/reduced-motion-store.ts` calls it
// directly, so anything rendering `ReducedMotionProvider` throws without this. Reports no
// preference: tests that need reduced motion should set the app's own override
// (`persistOverride`), which takes precedence over the media query, rather than reaching
// into this stub. The two specs that own the media-query seam itself re-stub it through the
// same helper, so a stub this file needs can never drift from the one they install.
stubMatchMedia(false);

// jsdom cannot rasterise a canvas: it returns null and reports "Not implemented" to its
// virtual console for every call, which the scene alone triggers 55 times per run. The
// native `canvas` package was deliberately rejected, so null is the permanent answer and
// the messages are pure noise. Returning it directly keeps behavior identical — every
// draw routine already handles null — and leaves real warnings visible. Phase 5 replaces
// this with a recording context that asserts what each routine paints.
HTMLCanvasElement.prototype.getContext = () => null;

// Order is load-bearing: resetting a store notifies its subscribers, so unmounting first
// is what keeps that notification from reaching a live component outside act(...).
// `sequence.hooks: "stack"` in vitest.config.ts runs a spec's own afterEach before this
// one, so specs that mount outside RTL (RTTR) still tear down first.
afterEach(() => {
  cleanup();
  resetStores();
});
