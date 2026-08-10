import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { GithubIcon, LinkedinIcon } from "./brand-icons";
import { Button } from "./button";
import { Kbd } from "./kbd";
import { StatusDot } from "./status-dot";

/**
 * The shared atoms. There is no logic here to test and their styling is not a contract, so
 * what this covers is the small set of things that would be accessibility defects if they
 * changed: decoration must stay out of the accessibility tree, a key hint must be a `<kbd>`,
 * and `asChild` must produce one element rather than a link nested in a button.
 */

describe("Brand icons", () => {
  it.each([
    ["GitHub", GithubIcon],
    ["LinkedIn", LinkedinIcon],
  ])("renders %s as decoration next to its own label", (_name, Icon) => {
    // They always sit beside a text label, so announcing them would repeat it — and an
    // unlabelled `<svg>` in the tree announces nothing useful anyway.
    const { container } = render(<Icon />);
    const svg = container.firstElementChild;

    expect(svg?.tagName).toBe("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    // Sized by default, so an icon used without a class is not a 24px block in a 14px line.
    expect(svg).toHaveClass("size-4");
  });

  it("takes a caller's size when it is given one", () => {
    const { container } = render(<GithubIcon className="size-3.5" />);

    expect(container.firstElementChild).toHaveClass("size-3.5");
  });
});

describe("StatusDot", () => {
  it("is decoration, whatever it signals", () => {
    // The availability status is written out in text beside it; the dot is a color.
    const { container } = render(<StatusDot tone="warn" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Kbd", () => {
  it("marks a key hint up as a key", () => {
    render(<Kbd>⌘</Kbd>);

    expect(screen.getByText("⌘").tagName).toBe("KBD");
  });
});

describe("Button", () => {
  it("is a button by default", () => {
    render(<Button>Enter the studio</Button>);

    expect(screen.getByRole("button", { name: "Enter the studio" })).toBeInTheDocument();
  });

  it("becomes the child it is given, instead of wrapping it", () => {
    // `asChild` is how a link gets button styling. Rendering both would nest an anchor
    // inside a button, which is invalid and unusable by keyboard.
    render(
      <Button asChild>
        <a href="/work">Explore the studio</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Explore the studio" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders its own content, and stays out of the way of it", () => {
    render(<Badge tone="accent">AI-native platforms</Badge>);

    // No role of its own: a badge is a styled label, and the text is the information.
    const badge = screen.getByText("AI-native platforms");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("aria-hidden");
  });
});
