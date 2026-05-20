import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /to get started, edit the page\.tsx file\./i }),
    ).toBeInTheDocument();
  });

  it("renders primary CTA links", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /deploy now/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /documentation/i })).toBeInTheDocument();
  });
});
