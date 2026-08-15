import type { ReactElement } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { click, press } from "@tests/interactions";
import { ReducedMotionProvider } from "@/reduced-motion";
import { publishPerf } from "@/world/perf";
import type { VitalName, VitalRating } from "./vitals";
import { persistOverride } from "@/reduced-motion";
import { InspectorOverlay } from "./overlay";
import { InspectorOverlayProvider } from "./store";

/**
 * The Web-Vitals overlay — the "receipts" panel, not the ⌘K menu. It is the one surface in
 * the app whose entire content comes from live measurement, so this spec supplies the
 * measurements: `web-vitals` is mocked at the library boundary the way the store's own spec
 * does it, perf is published through `world/perf`, and route JS is read from a stubbed
 * Resource Timing buffer. `inspector-overlay.spec.ts` proves the shortcut and the panels
 * exist in a browser; the numbers, the units and the empty states are here.
 */

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

type VitalReport = { name: VitalName; value: number; rating: VitalRating };

const vitals = vi.hoisted(() => ({
  handlers: new Map<VitalName, (metric: VitalReport) => void>(),
}));

vi.mock("web-vitals", () => {
  function capture(name: VitalName) {
    return (callback: (metric: VitalReport) => void) => void vitals.handlers.set(name, callback);
  }
  return {
    onLCP: capture("LCP"),
    onINP: capture("INP"),
    onCLS: capture("CLS"),
    onTTFB: capture("TTFB"),
    onFCP: capture("FCP"),
  };
});

/** The 600 ms the overlay waits before measuring, so the route's own JS has arrived. */
const SETTLE_MS = 600;

type Entry = Partial<PerformanceResourceTiming>;

function stubResourceTiming(entries: Entry[]): void {
  vi.spyOn(performance, "getEntriesByType").mockReturnValue(entries as PerformanceResourceTiming[]);
}

function script(name: string, encodedBodySize: number, initiatorType = "script"): Entry {
  return { name, initiatorType, encodedBodySize };
}

/** Resource Timing names are absolute, so "same origin" needs an origin to compare with. */
function stubOrigin(): void {
  Object.defineProperty(window, "location", {
    value: { origin: "https://studio.test" },
    configurable: true,
  });
}

async function report(name: VitalName, value: number, rating: VitalRating): Promise<void> {
  await vi.waitFor(() => expect(vitals.handlers.has(name)).toBe(true));
  const handler = vitals.handlers.get(name);
  act(() => handler?.({ name, value, rating }));
}

function tree(): ReactElement {
  return (
    <ReducedMotionProvider>
      <InspectorOverlayProvider>
        <InspectorOverlay />
      </InspectorOverlayProvider>
    </ReducedMotionProvider>
  );
}

function renderOverlay(): UserEvent & { rerender: () => void } {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { rerender } = render(tree());
  return Object.assign(user, { rerender: () => rerender(tree()) });
}

async function openOverlay(): Promise<UserEvent & { rerender: () => void }> {
  const user = renderOverlay();
  await press(user, "{Control>}`{/Control}");
  return user;
}

function overlay(): HTMLElement {
  return screen.getByRole("region", { name: /performance inspector overlay/i });
}

function panel(title: RegExp): HTMLElement {
  return screen.getByRole("region", { name: title });
}

function settle(): void {
  act(() => {
    vi.advanceTimersByTime(SETTLE_MS);
  });
}

/** Which of the three override buttons reports itself as the current one — exactly one. */
function pressedMode(): string[] {
  const modes = within(panel(/motion mode/i)).getByRole("group", {
    name: /reduced-motion override/i,
  });
  return within(modes)
    .getAllByRole("button", { pressed: true })
    .map((button) => button.textContent ?? "");
}

/** The `<dt>`/`<dd>` pairs of the motion panel, read the way a screen reader pairs them. */
function signal(label: string): string {
  const term = within(panel(/motion mode/i)).getByText(label);
  return term.nextElementSibling?.textContent ?? "";
}

beforeEach(() => {
  vi.useFakeTimers();
  stubResourceTiming([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  nav.pathname = "/";
});

describe("Inspector overlay: the shell", () => {
  it("stays out of the document until the shortcut opens it", async () => {
    const user = renderOverlay();
    expect(
      screen.queryByRole("region", { name: /performance inspector/i }),
    ).not.toBeInTheDocument();

    await press(user, "{Control>}`{/Control}");

    expect(overlay()).toBeInTheDocument();
    expect(within(overlay()).getByText(/inspector · receipts/i)).toBeInTheDocument();
  });

  it("closes from its own header", async () => {
    const user = await openOverlay();

    await click(user, /close inspector overlay/i);

    expect(
      screen.queryByRole("region", { name: /performance inspector/i }),
    ).not.toBeInTheDocument();
  });

  it("does not animate itself in when motion is reduced", async () => {
    // The overlay slides up from the corner. Under reduced motion the class Tailwind reads
    // for that has to be absent, since the animation itself is the observable behavior.
    await openOverlay();
    expect(overlay()).toHaveClass("animate-in");

    act(() => persistOverride(true));

    expect(overlay()).not.toHaveClass("animate-in");
  });
});

describe("Inspector overlay: Web Vitals", () => {
  it("shows a placeholder for every metric that has not reported yet", async () => {
    await openOverlay();

    const vitalsPanel = panel(/web vitals/i);
    for (const name of ["LCP", "INP", "CLS", "TTFB", "FCP"]) {
      expect(within(vitalsPanel).getByText(name)).toBeInTheDocument();
    }
    expect(within(vitalsPanel).getAllByText("—")).toHaveLength(5);
  });

  it("shows each metric in its own unit as it arrives", async () => {
    await openOverlay();

    await report("LCP", 2517, "needs-improvement");
    await report("INP", 84, "good");
    await report("CLS", 0.0824, "poor");

    const vitalsPanel = panel(/web vitals/i);
    expect(within(vitalsPanel).getByText("2.52s")).toBeInTheDocument();
    expect(within(vitalsPanel).getByText("84ms")).toBeInTheDocument();
    expect(within(vitalsPanel).getByText("0.082")).toBeInTheDocument();
    // Rating, not value, decides the color, and a "poor" CLS of 0.08 must not read as good.
    expect(within(vitalsPanel).getByText("0.082")).toHaveClass("text-signal-hot");
    expect(within(vitalsPanel).getByText("84ms")).toHaveClass("text-signal-good");
  });
});

describe("Inspector overlay: the 3D scene", () => {
  it("says the scene is not running rather than showing zeroes", async () => {
    // Reduced motion, low power and an off-screen canvas all pause the frame loop, and a
    // panel of zeroes would read as a broken scene instead of a paused one.
    await openOverlay();

    expect(within(panel(/3d scene/i)).getByText(/no live scene/i)).toBeInTheDocument();
  });

  it("reports the live frame stats once the scene publishes them", async () => {
    await openOverlay();

    act(() =>
      publishPerf({
        fps: 58,
        frameMs: 12,
        drawCalls: 141,
        triangles: 1_250_000,
        geometries: 87,
        textures: 24,
      }),
    );

    const scene = panel(/3d scene/i);
    expect(within(scene).getByText("58")).toHaveClass("text-signal-good");
    expect(within(scene).getByText("12ms")).toBeInTheDocument();
    expect(within(scene).getByText("141")).toBeInTheDocument();
    expect(within(scene).getByText("1.3M")).toBeInTheDocument();
    expect(within(scene).getByText("87")).toBeInTheDocument();
    expect(within(scene).getByText("24")).toBeInTheDocument();
    expect(within(scene).queryByText(/no live scene/i)).not.toBeInTheDocument();
  });

  it("tones a frame rate that has fallen behind", async () => {
    await openOverlay();

    act(() => publishPerf({ fps: 24 }));

    expect(within(panel(/3d scene/i)).getByText("24")).toHaveClass("text-signal-hot");
  });
});

describe("Inspector overlay: route JS", () => {
  it("counts only this origin's scripts, and only once the page has settled", async () => {
    stubResourceTiming([
      script("https://studio.test/_next/static/chunks/main.js", 102_400),
      // A module named by URL rather than reported as a script still counts.
      script("https://studio.test/_next/static/chunks/world.js", 51_200, "fetch"),
      script("https://cdn.other.test/analytics.js", 900_000),
      { name: "https://studio.test/styles.css", initiatorType: "link", encodedBodySize: 4096 },
      // A cached response reports no transferred size, and must not count as NaN.
      { name: "https://studio.test/_next/static/chunks/cached.js", initiatorType: "script" },
    ]);
    stubOrigin();
    await openOverlay();

    const routeJs = panel(/route js/i);
    expect(within(routeJs).getByText("0")).toBeInTheDocument();

    settle();

    expect(within(routeJs).getByText("150")).toBeInTheDocument();
    expect(within(routeJs).getByText(/3 files/)).toBeInTheDocument();
  });

  it("measures again when the visitor moves to another route", async () => {
    // The overlay survives navigation, so a stale figure from the previous route would be
    // the most misleading thing it could show.
    stubResourceTiming([script("https://studio.test/a.js", 1024)]);
    stubOrigin();
    const user = await openOverlay();
    settle();

    const routeJs = panel(/route js/i);
    expect(within(routeJs).getByText(/^\/$/)).toBeInTheDocument();
    expect(within(routeJs).getByText("1")).toBeInTheDocument();

    stubResourceTiming([
      script("https://studio.test/a.js", 1024),
      script("https://studio.test/b.js", 9216),
    ]);
    nav.pathname = "/work";
    act(() => user.rerender());
    settle();

    expect(within(panel(/route js/i)).getByText("/work")).toBeInTheDocument();
    expect(within(panel(/route js/i)).getByText("10")).toBeInTheDocument();
  });
});

describe("Inspector overlay: the motion override", () => {
  it("starts on auto, reporting what the platform asked for", async () => {
    await openOverlay();

    expect(pressedMode()).toEqual(["auto"]);
    expect(signal("Effective")).toBe("full");
    expect(signal("System")).toBe("no-pref");
    expect(signal("Low-power")).toBe("no");
    expect(signal("Override")).toBe("auto");
  });

  it("forces motion off and gives the decision back to the platform", async () => {
    const user = await openOverlay();

    await click(user, /^on$/i);

    expect(pressedMode()).toEqual(["on"]);
    expect(signal("Effective")).toBe("reduced");
    expect(signal("Override")).toBe("on");

    await click(user, /^off$/i);

    // "off" is an explicit refusal of the OS preference, not the same as auto.
    expect(pressedMode()).toEqual(["off"]);
    expect(signal("Effective")).toBe("full");
    expect(signal("Override")).toBe("off");

    await click(user, /^auto$/i);

    expect(pressedMode()).toEqual(["auto"]);
    expect(signal("Override")).toBe("auto");
  });
});
