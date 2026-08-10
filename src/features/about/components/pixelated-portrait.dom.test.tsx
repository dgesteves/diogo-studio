import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/config/site";
import { AboutPortrait } from "./about-portrait";
import { PixelatedPortrait } from "./pixelated-portrait";

/**
 * The portrait draws itself onto a canvas, which jsdom cannot rasterize — the engine and its
 * sampler are testing-plan Phase 5. What is testable now is the part that decides whether the
 * portrait is content or noise: a canvas is invisible to assistive technology, so the frame
 * around it carries the description, and something legible stands in until pixels arrive.
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

describe("AboutPortrait", () => {
  it("names whose portrait it is", () => {
    render(<AboutPortrait />);

    expect(
      screen.getByRole("img", { name: `Pixelated portrait of ${siteConfig.name}` }),
    ).toBeInTheDocument();
  });
});
