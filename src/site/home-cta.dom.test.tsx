import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { click } from "@tests/interactions";
import { siteConfig } from "@/content/profile";
import { CommandMenuProvider, useCommandMenu } from "@/features/command-menu";
import { HomeCta } from "./home-cta";

/** The CTA's whole job is the mode it opens the menu in, which only the store can report. */
function MenuProbe(): ReactElement {
  const { open, mode } = useCommandMenu();
  return <p data-testid="menu">{open ? `open:${mode}` : "closed"}</p>;
}

function renderCta(): UserEvent {
  const user = userEvent.setup();
  render(
    <CommandMenuProvider>
      <HomeCta />
      <MenuProbe />
    </CommandMenuProvider>,
  );
  return user;
}

describe("Home CTA", () => {
  it("opens the agent straight into Ask mode", async () => {
    const user = renderCta();
    expect(screen.getByRole("button", { name: /ask the agent about diogo/i })).toBeInTheDocument();

    await click(user, /ask the agent about diogo/i);

    // Straight into Ask: a visitor who came for the agent should not have to switch modes.
    expect(screen.getByTestId("menu")).toHaveTextContent("open:ask");
  });

  it("states availability in the author's own words, not a second copy of them", () => {
    renderCta();

    expect(screen.getByText(siteConfig.availability)).toBeInTheDocument();
  });
});
