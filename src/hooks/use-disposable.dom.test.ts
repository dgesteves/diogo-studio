import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useDisposable } from "./use-disposable";

/**
 * The hook that keeps the scene from stranding textures and geometries on the GPU when the
 * canvas unmounts. Its two halves are both load-bearing and fail in opposite directions: a
 * factory that re-runs rebuilds a texture every frame, and a cleanup that does not run
 * leaks one per motion toggle.
 */

const makeResource = (): { dispose: ReturnType<typeof vi.fn> } => ({ dispose: vi.fn() });

describe("useDisposable", () => {
  it("builds the resource once, however often the component renders", () => {
    const create = vi.fn(makeResource);
    const { result, rerender } = renderHook(() => useDisposable(create));
    const first = result.current;

    rerender();
    rerender();

    expect(create).toHaveBeenCalledOnce();
    expect(result.current).toBe(first);
    expect(first.dispose).not.toHaveBeenCalled();
  });

  it("disposes on unmount", () => {
    const resource = makeResource();
    const { unmount } = renderHook(() => useDisposable(() => resource));

    unmount();

    expect(resource.dispose).toHaveBeenCalledOnce();
  });

  it("disposes every resource in an array or on an object", () => {
    const array = [makeResource(), makeResource()];
    const record = { a: makeResource(), b: makeResource() };

    renderHook(() => useDisposable(() => array)).unmount();
    renderHook(() => useDisposable(() => record)).unmount();

    for (const resource of [...array, ...Object.values(record)]) {
      expect(resource.dispose).toHaveBeenCalledOnce();
    }
  });

  it("leaves values that are not resources alone", () => {
    const texture = makeResource();
    // The shape `createCanvasTexture` returns, and the mouse's Vector3 beside its geometry:
    // a disposable next to something that has no `dispose` and must not be reached for.
    // `dispose: 3` is the case that makes the walk check the type rather than the key.
    const mixed = {
      canvas: { width: 8 },
      texture,
      label: "tv",
      size: 3,
      missing: null,
      odd: { dispose: 3 },
    };

    const { unmount } = renderHook(() => useDisposable(() => mixed));
    expect(() => unmount()).not.toThrow();

    expect(texture.dispose).toHaveBeenCalledOnce();
  });

  it("returns a plain value untouched when there is nothing to dispose", () => {
    const { result, unmount } = renderHook(() => useDisposable(() => "no resources"));

    expect(result.current).toBe("no resources");
    expect(() => unmount()).not.toThrow();
  });
});
