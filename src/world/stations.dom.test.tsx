import { act, renderHook } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "@/content/pages";
import { setAiCoreHovered, setExplore, setHoveredStation } from "./store";
import { useActiveStation } from "./stations";
import { useAiCoreHovered } from "./scene/ai-core";
import { useExplore } from "./explore";
import { useExploreHandoff } from "./explore";
import { useHoveredStation } from "./stations";

const nav = vi.hoisted(() => ({ pathname: "/", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: nav.replace }),
}));

beforeEach(() => {
  nav.pathname = "/";
  nav.replace.mockClear();
});

describe("useActiveStation", () => {
  it("names the station the current route is showing", () => {
    nav.pathname = routes.projects;

    expect(renderHook(() => useActiveStation()).result.current).toBe("projects");
  });
});

describe("the world's shared reads", () => {
  it("reports what the pointer is over, and forgets it when the pointer leaves", () => {
    const { result } = renderHook(() => useHoveredStation());

    expect(result.current).toBeNull();

    act(() => setHoveredStation("writing"));
    expect(result.current).toBe("writing");

    act(() => setHoveredStation(null));
    expect(result.current).toBeNull();
  });

  it("reports the AI core's own hover separately from the stations", () => {
    const { result } = renderHook(() => useAiCoreHovered());

    act(() => setHoveredStation("writing"));
    expect(result.current).toBe(false);

    act(() => setAiCoreHovered(true));
    expect(result.current).toBe(true);
  });

  it("reports explore mode, and follows it in both directions", () => {
    const { result } = renderHook(() => useExplore());

    expect(result.current).toBe(false);

    act(() => setExplore(true));
    expect(result.current).toBe(true);

    act(() => setExplore(false));
    expect(result.current).toBe(false);
  });

  /**
   * All three are module singletons, so a value left over from one visitor's session
   * would otherwise be rendered into the HTML the next one is served — and the client
   * would then hydrate against markup describing a hover that never happened.
   */
  it("renders on the server as though nothing had been pointed at or entered", () => {
    setHoveredStation("writing");
    setAiCoreHovered(true);
    setExplore(true);

    function Probe(): ReactElement {
      return (
        <p>
          {String(useHoveredStation())}/{String(useAiCoreHovered())}/{String(useExplore())}
        </p>
      );
    }

    expect(renderToStaticMarkup(<Probe />)).toBe("<p>null/false/false</p>");

    setExplore(false);
  });
});

describe("useExploreHandoff", () => {
  function mount(active: Parameters<typeof useExploreHandoff>[0], explore: boolean) {
    return renderHook(
      ({ station, exploring }: { station: typeof active; exploring: boolean }) =>
        useExploreHandoff(station, exploring),
      { initialProps: { station: active, exploring: explore } },
    );
  }

  it("hands a visitor who walks out of explore mode back to the world root", () => {
    const { rerender } = mount("projects", true);
    expect(nav.replace).not.toHaveBeenCalled();

    rerender({ station: "projects", exploring: false });

    expect(nav.replace).toHaveBeenCalledWith(routes.home, { scroll: false });
  });

  it("does not navigate when the visitor was already at the world root", () => {
    const { rerender } = mount("home", true);

    rerender({ station: "home", exploring: false });

    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("does not navigate on entering explore mode", () => {
    const { rerender } = mount("projects", false);

    rerender({ station: "projects", exploring: true });

    expect(nav.replace).not.toHaveBeenCalled();
  });

  /**
   * The guard that matters most: without it every station page would bounce to `/` the
   * moment it mounted, because "not exploring" is the state each one loads in.
   */
  it("leaves a station page alone when explore mode was never entered", () => {
    const { rerender } = mount("projects", false);

    rerender({ station: "projects", exploring: false });

    expect(nav.replace).not.toHaveBeenCalled();
  });
});
