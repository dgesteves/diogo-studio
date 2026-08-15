import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/content/profile";
import { AboutPortrait, PixelatedPortrait } from "./portrait";

/**
 * The portrait draws itself onto a canvas, which jsdom cannot rasterize — the engine and its
 * sampler are covered through a recording context in `portrait-engine.dom.test.ts`. What this
 * file owns is the part that decides whether the portrait is content or noise: a canvas is
 * invisible to assistive technology, so the frame around it carries the description, something
 * legible stands in until pixels arrive, and the expensive half does not load until the
 * visitor can see it.
 */

describe("PixelatedPortrait", () => {
  it("describes itself, because the canvas inside it cannot", () => {
    render(<PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />);

    expect(screen.getByRole("img", { name: "A pixelated portrait" })).toBeInTheDocument();
  });

  it("shows the initials until the pixels arrive", () => {
    render(<PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />);

    // The placeholder is decoration behind the labelled frame, so it is text on screen
    // rather than anything announced.
    expect(screen.getByText(siteConfig.initials)).toBeInTheDocument();
  });

  it("mounts the canvas once the frame is in view", async () => {
    // jsdom has no IntersectionObserver, and `useInView` treats that as visible rather than
    // hiding content forever — which is the same path a crawler and an old browser take.
    const { container } = render(
      <PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />,
    );

    await waitFor(() => expect(container.querySelector("canvas")).not.toBeNull());
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
  });

  it("waits for the frame to be in view before mounting anything", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe(): void {}
        disconnect(): void {}
        unobserve(): void {}
        takeRecords(): [] {
          return [];
        }
      },
    );
    const { container } = render(
      <PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />,
    );

    // Nothing has intersected, so the expensive part must not exist yet — the placeholder
    // and the description do.
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("img", { name: "A pixelated portrait" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

/**
 * The deferral itself, which used to be `hooks/use-in-view.dom.test.tsx` and is asserted
 * through the portrait now that the hook is private to it. jsdom has no
 * `IntersectionObserver`, so the observer is stubbed to drive the one-shot.
 */
describe("PixelatedPortrait: deferring the canvas", () => {
  type Observed = {
    callback: IntersectionObserverCallback;
    element: Element;
    disconnects: number;
  };

  const observed: Observed[] = [];
  const observerOptions: (IntersectionObserverInit | undefined)[] = [];

  function stubIntersectionObserver(): void {
    class FakeObserver {
      private readonly record: Observed;
      constructor(
        public callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        observerOptions.push(options);
        this.record = { callback, element: document.body, disconnects: 0 };
      }
      observe(element: Element): void {
        this.record.element = element;
        observed.push(this.record);
      }
      disconnect(): void {
        this.record.disconnects += 1;
      }
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  }

  function intersect(target: Observed, isIntersecting: boolean): void {
    act(() => {
      target.callback(
        [{ isIntersecting, target: target.element } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
  }

  afterEach(() => {
    observed.length = 0;
    observerOptions.length = 0;
    vi.unstubAllGlobals();
  });

  it("loads nothing until the frame intersects, then stops watching", async () => {
    stubIntersectionObserver();
    const { container } = render(
      <PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />,
    );
    const [target] = observed;
    expect(target).toBeDefined();

    intersect(target!, false);
    expect(container.querySelector("canvas")).toBeNull();

    intersect(target!, true);
    await waitFor(() => expect(container.querySelector("canvas")).not.toBeNull());

    // One-shot: the work it gates never needs undoing, so the observer disconnects rather
    // than firing on every scroll.
    expect(target!.disconnects).toBe(1);
  });

  it("watches the frame itself, with the margin that starts the load early", () => {
    stubIntersectionObserver();
    const { container } = render(
      <PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />,
    );

    expect(observed[0]?.element).toBe(container.firstElementChild);
    expect(observerOptions[0]).toEqual({ rootMargin: "200px 0px", threshold: 0 });
  });

  it("stops watching when the portrait unmounts", () => {
    stubIntersectionObserver();
    const { unmount } = render(
      <PixelatedPortrait src="/images/diogo-esteves.png" alt="A pixelated portrait" />,
    );

    unmount();
    expect(observed[0]?.disconnects).toBe(1);
  });
});

describe("AboutPortrait", () => {
  it("names whose portrait it is", () => {
    render(<AboutPortrait />);

    expect(
      screen.getByRole("img", { name: `Pixelated portrait of ${siteConfig.name}` }),
    ).toBeInTheDocument();
  });
});
