import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReducedMotionProvider } from "@/reduced-motion";
import { persistOverride } from "@/reduced-motion";
import { WorldStage } from "./world-stage";

/**
 * The gate in front of the whole 3D layer, and the component that owns two of the
 * non-negotiables in `three-r3f-world.md`: reduced motion is a real code path with no
 * canvas at all, and the current tier is published on the root as `data-world-quality`.
 *
 * `WorldCanvas` is mocked at the module boundary `next/dynamic` imports, because what is
 * under test is whether it mounts and what it is handed — not the scene inside it, which
 * has its own specs.
 */

const canvas = vi.hoisted(() => ({
  mounts: 0,
  props: [] as { active: string; quality: string }[],
  ready: undefined as (() => void) | undefined,
  degrade: undefined as ((quality: string) => void) | undefined,
}));

vi.mock("./world-canvas", () => ({
  WorldCanvas: (props: {
    active: string;
    quality: string;
    onReady?: () => void;
    onQuality: (quality: string) => void;
  }) => {
    canvas.mounts += 1;
    canvas.props.push({ active: props.active, quality: props.quality });
    canvas.ready = props.onReady;
    canvas.degrade = props.onQuality as (quality: string) => void;
    return <div data-testid="world-canvas" />;
  },
}));

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const gpu = vi.hoisted(() => ({ software: false }));
vi.mock("../utils/gpu", () => ({ detectSoftwareRenderer: () => gpu.software }));

function mount() {
  return render(
    <ReducedMotionProvider>
      <WorldStage />
    </ReducedMotionProvider>,
  );
}

function worldRoot(): HTMLElement {
  const root = document.querySelector("[data-world-root]");
  if (!(root instanceof HTMLElement)) throw new Error("The world root was never rendered");
  return root;
}

beforeEach(() => {
  canvas.mounts = 0;
  canvas.props = [];
  canvas.ready = undefined;
  canvas.degrade = undefined;
  gpu.software = false;
  nav.pathname = "/";
});

afterEach(() => {
  act(() => persistOverride(null));
});

describe("WorldStage", () => {
  it("mounts the canvas for a visitor who has not asked for less motion", async () => {
    mount();

    await waitFor(() => expect(screen.getByTestId("world-canvas")).toBeInTheDocument());
    expect(worldRoot()).toHaveAttribute("data-world-quality", "full");
  });

  it("never loads the canvas under reduced motion, and shows the poster instead", async () => {
    act(() => persistOverride(true));
    mount();

    // A still of the world, so the page is not simply blank where the scene would be.
    await waitFor(() => expect(screen.getByRole("presentation", { hidden: true })).toBeVisible());

    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
    expect(canvas.mounts).toBe(0);
    expect(worldRoot()).toHaveAttribute("data-world-quality", "off");
  });

  it("takes the canvas away again when the preference changes mid-session", async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId("world-canvas")).toBeInTheDocument());

    act(() => persistOverride(true));

    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
    expect(worldRoot()).toHaveAttribute("data-world-quality", "off");
  });

  it("starts frozen on a software rasterizer, before the canvas has drawn anything", async () => {
    gpu.software = true;
    mount();

    await waitFor(() => expect(canvas.props).not.toHaveLength(0));
    // The very first render the canvas ever sees, not a tier it was talked down to.
    expect(canvas.props[0]?.quality).toBe("frozen");
    expect(worldRoot()).toHaveAttribute("data-world-quality", "frozen");
  });

  it("publishes a tier the scene degrades itself to", async () => {
    mount();
    await waitFor(() => expect(canvas.degrade).toBeDefined());

    act(() => canvas.degrade?.("reduced"));

    expect(worldRoot()).toHaveAttribute("data-world-quality", "reduced");
    expect(canvas.props.at(-1)?.quality).toBe("reduced");
  });

  it("holds the canvas invisible until the scene reports it has compiled", async () => {
    mount();
    await waitFor(() => expect(canvas.ready).toBeDefined());

    const shell = screen.getByTestId("world-canvas").parentElement!;
    expect(shell.className).toContain("opacity-0");

    act(() => canvas.ready?.());

    expect(shell.className).toContain("opacity-100");
  });

  it("tells the canvas which station the current route is", async () => {
    nav.pathname = "/writing";
    mount();

    await waitFor(() => expect(canvas.props).not.toHaveLength(0));
    expect(canvas.props[0]?.active).toBe("writing");
  });

  /**
   * The root is decoration for assistive tech and a pointer surface for the orbit input:
   * `isWorldSurface` keys on `data-world-root`, so losing the attribute silently kills
   * every drag, wheel and click in the world without breaking a single render.
   */
  it("marks the root as decoration and as the world's pointer surface", async () => {
    mount();
    await waitFor(() => expect(screen.getByTestId("world-canvas")).toBeInTheDocument());

    expect(worldRoot()).toHaveAttribute("aria-hidden", "true");
    expect(worldRoot()).toHaveAttribute("data-world-root");
  });

  it("renders nothing 3D on the server, so hydration has nothing to disagree about", () => {
    const html = renderToStaticMarkup(
      <ReducedMotionProvider>
        <WorldStage />
      </ReducedMotionProvider>,
    );

    expect(html).toContain('data-world-quality="off"');
    expect(html).not.toContain("world-canvas");
  });
});
