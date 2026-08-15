import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { press } from "@tests/interactions";
import { getExploreSnapshot, setExplore } from "./store";
import { EXPLORE } from "./explore";
import { ORBIT } from "./camera";
import { useExploreInput, type ExploreInputState } from "./input";
import { useOrbitInput, type OrbitInputState } from "./input";

/**
 * Both hooks listen on `window` and write into a ref rather than React state, so there is
 * no rendered output to query — the ref *is* the contract the camera reads every frame.
 * The seam that stays honest is the event: drive real pointer and key events at a real
 * world surface, then read the ref the frame loop would have read.
 */

function WorldSurface({ children }: { children?: ReactNode }): ReactElement {
  return <main>{children}</main>;
}

function worldSurface(): HTMLElement {
  return screen.getByRole("main");
}

/** Anything the world does not own — the command deck, the destination panel, the page. */
function outsideWorld(): HTMLElement {
  return document.body;
}

/**
 * A wheel is the one gesture user-event has no API for, and the hook both reads `deltaY`
 * and calls `preventDefault()` on a deliberately non-passive listener — so the event
 * object is itself the assertion.
 */
function wheelOver(target: HTMLElement, deltaY: number): WheelEvent {
  const event = new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/**
 * Every listener these hooks add to `window` outlives the canvas unless the effect takes
 * it back, and the world remounts on route changes. Most leaks show up as behavior — a
 * drag that still orbits — but a listener nothing else reads (`pointerdown` on its own)
 * changes no state at all, so the pairing is the only thing that can catch it.
 */
function trackWindowListeners(): { leaked: () => string[] } {
  const added: [string, unknown][] = [];
  const removed: [string, unknown][] = [];
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);

  vi.spyOn(window, "addEventListener").mockImplementation((type, handler, options) => {
    added.push([type, handler]);
    add(type, handler, options);
  });
  vi.spyOn(window, "removeEventListener").mockImplementation((type, handler, options) => {
    removed.push([type, handler]);
    remove(type, handler, options);
  });

  return {
    leaked: () =>
      added
        .filter(([type, handler]) => !removed.some(([t, h]) => t === type && h === handler))
        .map(([type]) => type),
  };
}

const preventedKeys: string[] = [];

function recordPrevented(event: KeyboardEvent): void {
  if (event.defaultPrevented) preventedKeys.push(event.code);
}

afterEach(() => {
  vi.restoreAllMocks();
  preventedKeys.length = 0;
  window.removeEventListener("keydown", recordPrevented);
});

describe("useOrbitInput", () => {
  function mount(orbitEnabled = true) {
    // The surface is rendered on its own rather than as the hook's wrapper, so it survives
    // the hook's unmount and a leaked listener still has something to fire on.
    render(<WorldSurface />);
    const view = renderHook((enabled: boolean) => useOrbitInput(enabled), {
      initialProps: orbitEnabled,
    });
    return {
      ...view,
      state: (): OrbitInputState => view.result.current.current,
    };
  }

  it("orbits the camera while a pointer drags across the world", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 140, clientY: 120 } },
      { keys: "[/MouseLeft]" },
    ]);

    expect(state().azimuth).toBeCloseTo(-40 * ORBIT.azimuthRadPerPx);
    expect(state().polar).toBeCloseTo(-20 * ORBIT.polarRadPerPx);
    expect(state().dragging).toBe(false);
    expect(state().lastInput).toBeGreaterThan(0);
  });

  it("holds the camera inside its orbit limits however far the pointer travels", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 900, clientY: 900 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 0, clientY: 0 } },
      { keys: "[/MouseLeft]" },
    ]);

    expect(state().azimuth).toBeCloseTo(ORBIT.azimuthLimitRad);
    expect(state().polar).toBeCloseTo(ORBIT.polarLimitRad);
  });

  it("reads a pointer that barely moved as a click on the world, with its coordinates", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 102, clientY: 101 } },
      { keys: "[/MouseLeft]" },
    ]);

    expect(state().clickSeq).toBe(1);
    expect(state().clickX).toBe(102);
    expect(state().clickY).toBe(101);
    expect(state().azimuth).toBe(0);
  });

  it("does not select a station at the end of a drag", async () => {
    const user = userEvent.setup();
    const { state } = mount();
    const past = 100 + ORBIT.dragThresholdPx + 1;

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: past, clientY: 100 } },
      { keys: "[/MouseLeft]" },
    ]);

    expect(state().clickSeq).toBe(0);
  });

  it("ignores a drag that starts outside the world", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: outsideWorld(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: outsideWorld(), coords: { clientX: 300, clientY: 300 } },
      { keys: "[/MouseLeft]" },
    ]);

    expect(state().azimuth).toBe(0);
    expect(state().clickSeq).toBe(0);
    expect(state().overWorld).toBe(false);
  });

  it("ignores a secondary-button drag, which belongs to the context menu", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseRight>]" },
      { target: worldSurface(), coords: { clientX: 300, clientY: 300 } },
      { keys: "[/MouseRight]" },
    ]);

    expect(state().azimuth).toBe(0);
    expect(state().clickSeq).toBe(0);
  });

  it("tracks the pointer over the world even when nothing is pressed", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer({ target: worldSurface(), coords: { clientX: 42, clientY: 24 } });

    expect(state()).toMatchObject({ clientX: 42, clientY: 24, overWorld: true });

    await user.pointer({ target: outsideWorld(), coords: { clientX: 7, clientY: 9 } });

    expect(state()).toMatchObject({ clientX: 7, clientY: 9, overWorld: false });
  });

  it("zooms on a wheel over the world, clamped, and keeps the page from scrolling", () => {
    const { state } = mount();

    expect(wheelOver(worldSurface(), 100).defaultPrevented).toBe(true);
    expect(state().zoom).toBeCloseTo(1 + 100 * ORBIT.zoomFactorPerWheelUnit);

    wheelOver(worldSurface(), 10_000);
    expect(state().zoom).toBeCloseTo(ORBIT.zoomMaxFactor);

    wheelOver(worldSurface(), -10_000);
    expect(state().zoom).toBeCloseTo(ORBIT.zoomMinFactor);
  });

  it("leaves a wheel outside the world to the page", () => {
    const { state } = mount();

    expect(wheelOver(outsideWorld(), 100).defaultPrevented).toBe(false);
    expect(state().zoom).toBe(1);
  });

  it("recenters when orbit is turned off, but still reports clicks", async () => {
    const user = userEvent.setup();
    const { state, rerender } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 200, clientY: 200 } },
      { keys: "[/MouseLeft]" },
    ]);
    expect(state().azimuth).not.toBe(0);

    rerender(false);

    expect(state()).toMatchObject({ azimuth: 0, polar: 0, zoom: 1, dragging: false });

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 10, clientY: 10 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 300, clientY: 300 } },
      { keys: "[/MouseLeft]" },
    ]);
    expect(state().azimuth).toBe(0);

    wheelOver(worldSurface(), 100);
    expect(state().zoom).toBe(1);

    // A station is still selectable with the orbit off — that is how a focused route
    // and explore mode both hand the visitor back to another station.
    await user.pointer([
      { target: worldSurface(), coords: { clientX: 50, clientY: 50 }, keys: "[MouseLeft>]" },
      { keys: "[/MouseLeft]" },
    ]);
    expect(state().clickSeq).toBe(1);
  });

  it("stops listening once the canvas unmounts", async () => {
    const user = userEvent.setup();
    const listeners = trackWindowListeners();
    const { state, unmount } = mount();

    unmount();
    await user.pointer([
      { target: worldSurface(), coords: { clientX: 10, clientY: 10 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 300, clientY: 300 } },
      { keys: "[/MouseLeft]" },
    ]);
    wheelOver(worldSurface(), 500);

    expect(state()).toMatchObject({ azimuth: 0, zoom: 1, clientX: -1, clickSeq: 0 });
    expect(listeners.leaked()).toEqual([]);
  });
});

describe("useExploreInput", () => {
  function mount(enabled = true) {
    render(<WorldSurface />);
    const view = renderHook((on: boolean) => useExploreInput(on), { initialProps: enabled });
    return {
      ...view,
      state: (): ExploreInputState => view.result.current.current,
    };
  }

  it("walks on both WASD and the arrow keys, and cancels opposing directions", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.keyboard("{w>}");
    expect(state()).toMatchObject({ forward: 1, strafe: 0 });

    await user.keyboard("{d>}");
    expect(state()).toMatchObject({ forward: 1, strafe: 1 });

    await user.keyboard("{ArrowDown>}");
    expect(state().forward).toBe(0);

    await user.keyboard("{/w}{/d}{/ArrowDown}");
    expect(state()).toMatchObject({ forward: 0, strafe: 0 });

    await user.keyboard("{ArrowLeft>}");
    expect(state().strafe).toBe(-1);
    await user.keyboard("{/ArrowLeft}");
  });

  it("keeps the arrow keys from scrolling the page underneath the world", async () => {
    const user = userEvent.setup();
    mount();
    window.addEventListener("keydown", recordPrevented);

    await user.keyboard("{ArrowUp>}{/ArrowUp}{Tab}");

    expect(preventedKeys).toEqual(["ArrowUp"]);
  });

  it("leaves explore mode on Escape", async () => {
    const user = userEvent.setup();
    setExplore(true);
    mount();

    await press(user, "{Escape}");

    expect(getExploreSnapshot()).toBe(false);
  });

  it("looks around while dragging, with pitch clamped so the horizon cannot flip", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 60, clientY: 130 } },
    ]);

    expect(state().yaw).toBeCloseTo(40 * EXPLORE.lookSensitivity);
    expect(state().pitch).toBeCloseTo(-30 * EXPLORE.lookSensitivity);
    expect(state().dragging).toBe(true);

    await user.pointer({ target: worldSurface(), coords: { clientX: 60, clientY: 9_000 } });
    expect(state().pitch).toBeCloseTo(EXPLORE.pitchMinRad);

    await user.pointer({ keys: "[/MouseLeft]" });
    expect(state().dragging).toBe(false);
  });

  it("releases everything held when the window loses focus", async () => {
    const user = userEvent.setup();
    const { state } = mount();

    await user.pointer([
      { target: worldSurface(), coords: { clientX: 100, clientY: 100 }, keys: "[MouseLeft>]" },
      { target: worldSurface(), coords: { clientX: 140, clientY: 100 } },
    ]);
    await user.keyboard("{w>}");
    expect(state()).toMatchObject({ forward: 1, dragging: true });

    // Switching tabs mid-stride, which no user-event gesture can produce: without this
    // the visitor walks into a wall until they come back and press the key again.
    window.dispatchEvent(new Event("blur"));

    expect(state()).toMatchObject({ forward: 0, strafe: 0, dragging: false });

    await user.keyboard("{/w}");
  });

  it("listens for nothing at all while explore mode is off", async () => {
    const user = userEvent.setup();
    const { state } = mount(false);
    setExplore(true);

    await user.keyboard("{w>}{/w}");
    await press(user, "{Escape}");

    expect(state().forward).toBe(0);
    expect(getExploreSnapshot()).toBe(true);
  });

  it("stops listening once explore mode ends", async () => {
    const user = userEvent.setup();
    const listeners = trackWindowListeners();
    const { state, rerender } = mount();

    rerender(false);
    await user.keyboard("{w>}{/w}");
    window.dispatchEvent(new Event("blur"));

    expect(state().forward).toBe(0);
    expect(listeners.leaked()).toEqual([]);
  });
});
