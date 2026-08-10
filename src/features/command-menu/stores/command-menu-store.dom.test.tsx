import { useState, type ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { click, press } from "@tests/interactions";
import { CommandMenuProvider, useCommandMenu } from "./command-menu-store";

/**
 * The store behind ⌘K. Two of its jobs are invisible in the rendered menu and are what
 * this spec exists for: the mode always resets to Navigate on close (so Ask never reopens
 * mid-conversation), and the element that opened the menu is captured *before* the dialog
 * mounts and moves focus to its input — the only moment it can still be read. Radix
 * suppresses its own focus restoration without a `Dialog.Trigger`, which this menu does not
 * have, so losing the opener means keyboard focus lands on `<body>`.
 */

function Probe(): ReactElement {
  const { open, mode, setOpen, toggle, setMode, openWithMode, openerRef } = useCommandMenu();
  const [recorded, setRecorded] = useState("untried");
  return (
    <>
      <p data-testid="opener">{recorded}</p>
      <p data-testid="state">{`${open ? "open" : "closed"}:${mode}`}</p>
      <button type="button" onClick={() => setOpen(true)}>
        Open the menu
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Close the menu
      </button>
      <button type="button" onClick={toggle}>
        Toggle the menu
      </button>
      <button type="button" onClick={() => setMode("ask")}>
        Switch to Ask
      </button>
      <button type="button" onClick={() => openWithMode("ask")}>
        Ask the agent
      </button>
      {/* What `command-menu.tsx` does in Radix's `onCloseAutoFocus`, which is the only
          consumer of the ref — and the only way to observe it without reading a ref during
          render. */}
      <button type="button" onClick={() => openerRef.current?.focus()}>
        Restore focus
      </button>
      {/* Reading the ref in a handler, like the dialog does — reading it during render is
          both a lint error and a stale read. */}
      <button
        type="button"
        onClick={() => setRecorded(openerRef.current?.textContent ?? "nothing recorded")}
      >
        Report the opener
      </button>
    </>
  );
}

function renderProbe(): UserEvent {
  const user = userEvent.setup();
  render(
    <CommandMenuProvider>
      <Probe />
    </CommandMenuProvider>,
  );
  return user;
}

function state(): string {
  return screen.getByTestId("state").textContent ?? "";
}

function button(name: RegExp): HTMLElement {
  return screen.getByRole("button", { name });
}

describe("command-menu store", () => {
  it("opens and closes on the platform shortcut, in either modifier flavor", async () => {
    const user = renderProbe();

    await press(user, "{Meta>}k{/Meta}");
    expect(state()).toBe("open:navigate");

    await press(user, "{Meta>}k{/Meta}");
    expect(state()).toBe("closed:navigate");

    // Windows and Linux visitors get the same menu.
    await press(user, "{Control>}k{/Control}");
    expect(state()).toBe("open:navigate");
  });

  it("ignores an unmodified k, and any other modified key", async () => {
    const user = renderProbe();

    await press(user, "k");
    await press(user, "{Meta>}j{/Meta}");

    expect(state()).toBe("closed:navigate");
  });

  it("resets to Navigate whenever it closes", async () => {
    const user = renderProbe();

    await click(user, /ask the agent/i);
    expect(state()).toBe("open:ask");

    await click(user, /close the menu/i);
    // Reopening into a half-finished Ask session is the bug this prevents.
    expect(state()).toBe("closed:navigate");

    await press(user, "{Meta>}k{/Meta}");
    expect(state()).toBe("open:navigate");
  });

  it("switches mode while open without closing", async () => {
    const user = renderProbe();

    await press(user, "{Meta>}k{/Meta}");
    await click(user, /switch to ask/i);

    expect(state()).toBe("open:ask");
  });

  it("remembers whatever had focus, through every way of opening", async () => {
    const user = renderProbe();

    await click(user, /toggle the menu/i);
    expect(state()).toBe("open:navigate");

    await click(user, /restore focus/i);
    expect(button(/toggle the menu/i)).toHaveFocus();

    await click(user, /close the menu/i);
    // The shortcut path must remember it too: it was a copy of `setOpen` once, and the copy
    // is what dropped focus on `<body>`.
    button(/switch to ask/i).focus();
    await press(user, "{Meta>}k{/Meta}");

    await click(user, /restore focus/i);
    expect(button(/switch to ask/i)).toHaveFocus();
  });

  it("remembers nothing when the menu is opened with no element focused", async () => {
    const user = renderProbe();

    // `document.body` is not a restoration target: focus would go nowhere the visitor can
    // use, which is the bug the `active !== document.body` check prevents.
    expect(document.activeElement).toBe(document.body);
    await press(user, "{Meta>}k{/Meta}");

    await click(user, /report the opener/i);
    // Exact, because `document.body`'s text contains every label on the page and a
    // substring match on "nothing recorded" is not what distinguishes them.
    expect(screen.getByTestId("opener").textContent).toBe("nothing recorded");
  });

  it("stops listening once the provider unmounts", () => {
    // A leaked handler is invisible in the DOM — the component it updates is gone — so the
    // assertion has to be that the exact function registered is the one removed. Two
    // mounted worlds would otherwise toggle the menu twice per shortcut.
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <CommandMenuProvider>
        <Probe />
      </CommandMenuProvider>,
    );
    const registered = add.mock.calls.find(([type]) => type === "keydown")?.[1];
    expect(registered).toBeDefined();

    unmount();
    expect(remove).toHaveBeenCalledWith("keydown", registered);

    add.mockRestore();
    remove.mockRestore();
  });

  it("takes the shortcut away from the browser", () => {
    renderProbe();

    // Chrome and Firefox both bind ⌘K to their own search; without preventDefault the
    // visitor gets the address bar instead of the menu. user-event cannot report this, so
    // the event is dispatched by hand.
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      cancelable: true,
      bubbles: true,
    });
    act(() => void window.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(true);
    expect(state()).toBe("open:navigate");
  });

  it("refuses to be used outside its provider", () => {
    // A silent `null` context would make ⌘K a no-op somewhere in the tree instead.
    expect(() => render(<Probe />)).toThrow(/within <CommandMenuProvider>/);
  });
});
