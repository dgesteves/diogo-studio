import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("links are reachable by keyboard in DOM order", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const expectedOrder = [/templates/i, /learning/i, /deploy now/i, /documentation/i];

    for (const name of expectedOrder) {
      await user.tab();
      expect(screen.getByRole("link", { name })).toHaveFocus();
    }
  });
});
