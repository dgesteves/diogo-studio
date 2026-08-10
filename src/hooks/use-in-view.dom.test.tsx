import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInView } from "./use-in-view";

/**
 * `useInView` is what defers expensive work — the pixelated portrait's canvas — until the
 * visitor can actually see it, so the two behaviors that matter are that it does fire when
 * the element scrolls in, and that it degrades to visible where the API is missing rather
 * than hiding content forever.
 */

type Observed = { callback: IntersectionObserverCallback; element: Element; disconnects: number };

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

function Probe({ rootMargin }: { rootMargin?: string }): ReactElement {
  const { ref, inView } = useInView<HTMLDivElement>(rootMargin);
  return (
    <div ref={ref} data-testid="probe">
      {inView ? "in view" : "out of view"}
    </div>
  );
}

afterEach(() => {
  observed.length = 0;
  observerOptions.length = 0;
  vi.stubGlobal("IntersectionObserver", undefined);
});

describe("useInView", () => {
  it("reports the element visible once it intersects, then stops observing", () => {
    stubIntersectionObserver();
    render(<Probe />);
    const [target] = observed;
    expect(target).toBeDefined();

    expect(screen.getByTestId("probe")).toHaveTextContent("out of view");

    intersect(target!, false);
    expect(screen.getByTestId("probe")).toHaveTextContent("out of view");

    intersect(target!, true);
    expect(screen.getByTestId("probe")).toHaveTextContent("in view");

    // One-shot: the work it gates never needs to be undone, so the observer disconnects
    // instead of firing on every scroll.
    expect(target!.disconnects).toBe(1);
  });

  it("observes the element it was attached to, with the caller's margin", () => {
    stubIntersectionObserver();
    render(<Probe rootMargin="200px" />);

    expect(observed[0]?.element).toBe(screen.getByTestId("probe"));
    expect(observerOptions[0]).toEqual({ rootMargin: "200px", threshold: 0 });
  });

  it("defaults to a zero margin", () => {
    stubIntersectionObserver();
    render(<Probe />);

    expect(observerOptions[0]).toEqual({ rootMargin: "0px", threshold: 0 });
  });

  it("disconnects on unmount", () => {
    stubIntersectionObserver();
    const { unmount } = render(<Probe />);

    unmount();
    expect(observed[0]?.disconnects).toBe(1);
  });

  it("treats content as visible where IntersectionObserver does not exist", () => {
    // The fallback is the accessibility-relevant branch: without it, a browser missing the
    // API would leave the gated content permanently unrendered.
    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("in view");
  });
});
