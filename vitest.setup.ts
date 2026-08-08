import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement matchMedia, and `stores/reduced-motion-store.ts` calls it
// directly, so anything rendering `ReducedMotionProvider` throws without this. Reports no
// preference: tests that need reduced motion should set the app's own override
// (`persistOverride`), which takes precedence over the media query, rather than reaching
// into this stub.
vi.stubGlobal("matchMedia", (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}));

afterEach(() => {
  cleanup();
});
