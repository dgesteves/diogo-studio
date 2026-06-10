import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandMenuProvider } from "@/features/command-menu";
import { careerGraphNodes as nodes, PUBLISHED_CASE_STUDY_SLUGS } from "@/features/career-graph";
import { Home } from "./home";

function renderHome() {
  return render(
    <CommandMenuProvider>
      <Home />
    </CommandMenuProvider>,
  );
}

describe("Home page", () => {
  it("renders the senior-grade hero heading", () => {
    renderHome();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /engineering the systems behind ambitious products/i,
      }),
    ).toBeInTheDocument();
  });

  it("links to the case studies page", () => {
    renderHome();
    const link = screen.getByRole("link", { name: /browse case studies/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/work");
  });

  it("exposes a ⌘K trigger CTA that opens the agent in Ask mode", () => {
    renderHome();
    expect(screen.getByRole("button", { name: /ask the agent about diogo/i })).toBeInTheDocument();
  });

  it("renders the availability status", () => {
    renderHome();
    expect(screen.getByText(/available\s*[—-]\s*staff\+\s*\/\s*principal/i)).toBeInTheDocument();
  });

  it("renders all pattern labels at least once on the page", () => {
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

  it("renders the three operating-altitude cards with the most recent org names", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { level: 2, name: /equally comfortable/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/fueled · current/i)).toBeInTheDocument();
    expect(screen.getByText(/moment · 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/eino\.ai · 2023[\u2013-]2025/i)).toBeInTheDocument();
  });

  it("renders the SVG career-graph LCP frame with a focusable anchor per node", () => {
    renderHome();
    for (const node of nodes) {
      const escaped = node.fullName.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
      const link = screen.getByRole("link", {
        name: new RegExp(`^${escaped}\\s*[—-]`, "i"),
      });
      expect(link).toBeInTheDocument();
      if (node.slug && PUBLISHED_CASE_STUDY_SLUGS.has(node.slug)) {
        expect(link).toHaveAttribute("href", `/work/${node.slug}`);
      } else {
        expect(link).toHaveAttribute("href", "/work");
      }
    }
  });

  it("includes a screen-reader description summarizing the career graph", () => {
    renderHome();
    expect(screen.getByText(/career graph of \d+ engagements/i)).toBeInTheDocument();
  });
});
