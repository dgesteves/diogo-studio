import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { careerGraphNodes as nodes } from "@/features/career-graph";
import { CareerGraphShowcase } from "./career-graph-showcase";

describe("Career graph showcase", () => {
  it("renders a focusable anchor per engagement node linking home", () => {
    render(<CareerGraphShowcase />);
    for (const node of nodes) {
      const escaped = node.fullName.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
      const link = screen.getByRole("link", { name: new RegExp(`^${escaped}\\s*[—-]`, "i") });
      expect(link).toHaveAttribute("href", "/");
    }
  });

  it("includes a screen-reader description summarizing the career graph", () => {
    render(<CareerGraphShowcase />);
    expect(screen.getByText(/career graph of \d+ engagements/i)).toBeInTheDocument();
  });
});
