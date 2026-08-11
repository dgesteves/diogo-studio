import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStation } from "../constants/stations";
import { consumeIntro, introStartPosition } from "./intro";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("consumeIntro", () => {
  it("flies the camera in once, and not again for the rest of the session", () => {
    expect(consumeIntro(true)).toBe(true);
    expect(consumeIntro(true)).toBe(false);
  });

  /**
   * A visitor who lands on a station deep-link is looking at that station, not at an
   * establishing shot — and the flag must survive, so the intro is still theirs when they
   * do reach the world root.
   */
  it("never plays on a station route, and does not spend the session's one intro", () => {
    expect(consumeIntro(false)).toBe(false);
    expect(consumeIntro(true)).toBe(true);
  });

  it("skips the intro rather than failing when the browser refuses session storage", () => {
    // Safari in private mode, and any browser with site data blocked. The property is a
    // proxy in jsdom, so the spy has to go on the prototype to replace anything at all.
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    expect(consumeIntro(true)).toBe(false);

    getItem.mockRestore();
  });
});

describe("introStartPosition", () => {
  it("starts wider and higher than the station's own camera, so the world flies in", () => {
    const home = getStation("home");
    const [x, y, z] = introStartPosition(home);
    const [hx, hy, hz] = home.position;

    expect(Math.abs(x)).toBeGreaterThan(Math.abs(hx));
    expect(Math.abs(z)).toBeGreaterThan(Math.abs(hz));
    expect(y).toBeGreaterThan(hy);
  });
});
