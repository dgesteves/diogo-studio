import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { click } from "@tests/interactions";
import { CommandMenuProvider, useCommandMenu } from "@/features/command-menu";
import { Home } from "./home";

/** The CTA's whole job is the mode it opens the menu in, which only the store can report. */
function MenuProbe(): ReactElement {
  const { open, mode } = useCommandMenu();
  return <p data-testid="menu">{open ? `open:${mode}` : "closed"}</p>;
}

function renderHome(): UserEvent {
  const user = userEvent.setup();
  render(
    <CommandMenuProvider>
      <Home />
      <MenuProbe />
    </CommandMenuProvider>,
  );
  return user;
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

  it("exposes a ⌘K trigger CTA that opens the agent in Ask mode", async () => {
    const user = renderHome();
    expect(screen.getByRole("button", { name: /ask the agent about diogo/i })).toBeInTheDocument();

    await click(user, /ask the agent about diogo/i);

    // Straight into Ask: a visitor who came for the agent should not have to switch modes.
    expect(screen.getByTestId("menu")).toHaveTextContent("open:ask");
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
