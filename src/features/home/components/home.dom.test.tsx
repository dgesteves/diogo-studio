import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandMenuProvider } from "@/features/command-menu";
import { Home } from "./home";

function renderHome() {
  return render(
    <CommandMenuProvider>
      <Home />
    </CommandMenuProvider>,
  );
}

describe("Home landing", () => {
  it("renders the neon brand heading", () => {
    renderHome();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /engineering the systems behind ambitious products/i,
      }),
    ).toBeInTheDocument();
  });

  it("exposes a ⌘K trigger CTA that opens the agent in Ask mode", () => {
    renderHome();
    expect(screen.getByRole("button", { name: /ask the agent about diogo/i })).toBeInTheDocument();
  });

  it("renders the availability status", () => {
    renderHome();
    expect(screen.getByText(/available\s*[—-]\s*staff\+\s*\/\s*principal/i)).toBeInTheDocument();
  });

  it("offers a primary affordance into the studio via the work hub", () => {
    renderHome();
    const explore = screen.getByRole("link", { name: /explore the studio/i });
    expect(explore).toHaveAttribute("href", "/work");
  });

  it("renders all pattern labels at least once on the landing", () => {
    renderHome();
    for (const pattern of [
      /ai-native platforms/i,
      /design-system infrastructure/i,
      /streaming-grade reliability/i,
      /agentic ux/i,
      /enterprise scale/i,
    ]) {
      expect(screen.getAllByText(pattern).length).toBeGreaterThan(0);
    }
  });
});
