import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandMenuProvider } from "@/components/site/command-menu-context";
import { nodes } from "@/content/career-graph";
import Home from "./page";

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

  it("exposes a ⌘K trigger CTA", () => {
    renderHome();
    expect(screen.getByRole("button", { name: /press.*to ask/i })).toBeInTheDocument();
  });

  it("renders the availability status", () => {
    renderHome();
    expect(screen.getByText(/available\s*[—-]\s*staff\+\s*\/\s*principal/i)).toBeInTheDocument();
  });

  it("renders all pattern labels at least once on the page", () => {
    renderHome();
    // Some pattern names ("Design-system infrastructure") also appear in the
    // hero copy, so we allow duplicates here and just assert presence.
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
    // The career-graph SVG fallback must be in the SSR markup so it can drive
    // LCP and the canvas crossfade has something to layer over.
    for (const node of nodes) {
      // Match by fullName which is unique per node, anchored at the start
      // of the accessible label to avoid colliding with the SR description.
      const escaped = node.fullName.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
      const link = screen.getByRole("link", {
        name: new RegExp(`^${escaped}\\s*[—-]`, "i"),
      });
      expect(link).toBeInTheDocument();
      // Phase 3 wires real `/work/[slug]` deep-links for published case
      // studies and falls back to `/work` for unpublished engagements.
      // Mirror PUBLISHED_CASE_STUDY_SLUGS from career-graph.ts.
      const published = new Set([
        "eino-ai-network-planning",
        "peacock-streaming",
        "diligent-design-system",
      ]);
      if (node.slug && published.has(node.slug)) {
        expect(link).toHaveAttribute("href", `/work/${node.slug}`);
      } else {
        expect(link).toHaveAttribute("href", "/work");
      }
    }
  });

  it("includes a screen-reader description summarizing the career graph", () => {
    renderHome();
    // The hidden description is part of the figure's accessible name chain
    // and lists every engagement.
    expect(screen.getByText(/career graph of \d+ engagements/i)).toBeInTheDocument();
  });
});
