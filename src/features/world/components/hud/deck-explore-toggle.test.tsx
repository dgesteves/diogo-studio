import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getExploreSnapshot, setExplore } from "@/stores/explore-store";
import { DeckExploreToggle } from "./deck-explore-toggle";

afterEach(() => {
  setExplore(false);
});

describe("DeckExploreToggle", () => {
  it("toggles explore mode when the user activates it", async () => {
    const user = userEvent.setup();
    render(<DeckExploreToggle />);

    const enter = screen.getByRole("button", { name: /explore the studio/i });
    expect(enter).toHaveAttribute("aria-pressed", "false");
    expect(getExploreSnapshot()).toBe(false);

    await act(async () => {
      await user.click(enter);
    });

    expect(getExploreSnapshot()).toBe(true);
    expect(screen.getByRole("button", { name: /exit explore mode/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
